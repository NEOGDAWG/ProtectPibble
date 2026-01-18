from __future__ import annotations

import uuid
from collections.abc import Iterable
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.deps.auth import CurrentUser
from app.models.class_ import Class
from app.models.enums import EventType, GroupMode, GroupRole, TaskStatusValue
from app.models.event import Event
from app.models.group import Group
from app.models.group_membership import GroupMembership
from app.models.pet import Pet
from app.models.task import Task
from app.models.task_status import TaskStatus
from app.models.user import User
from app.schemas.state import (
    EventOut,
    GroupHeader,
    GroupStateResponse,
    LeaderboardEntry,
    PetState,
    TaskState,
    TaskStats,
    UserRef,
)


def _user_map(db: Session, user_ids: Iterable[uuid.UUID]) -> dict[str, UserRef]:
    ids = [uid for uid in set(user_ids) if uid]
    if not ids:
        return {}
    rows = db.execute(select(User).where(User.id.in_(ids))).scalars().all()
    return {str(u.id): UserRef(id=str(u.id), display_name=u.display_name) for u in rows}


def build_group_state(db: Session, group: Group, viewer: CurrentUser) -> GroupStateResponse:
    klass = db.scalar(select(Class).where(Class.id == group.class_id))
    assert klass is not None

    pet = db.scalar(select(Pet).where(Pet.group_id == group.id))
    if pet is None:
        # Safety: ensure group always has a pet row.
        pet = Pet(group_id=group.id, name="Pibble", health=100, max_health=100)
        db.add(pet)
        db.commit()
        db.refresh(pet)

    student_count = db.scalar(
        select(func.count())
        .select_from(GroupMembership)
        .where(
            GroupMembership.group_id == group.id,
            GroupMembership.role == GroupRole.STUDENT,
        )
    )
    total_count = int(student_count or 0)

    tasks = (
        db.execute(select(Task).where(Task.group_id == group.id).order_by(Task.due_at.asc()))
        .scalars()
        .all()
    )
    task_ids = [t.id for t in tasks]

    # My statuses (missing row => NOT_DONE)
    my_status_rows = db.execute(
        select(TaskStatus).where(TaskStatus.task_id.in_(task_ids), TaskStatus.user_id == viewer.id)
    ).scalars().all()
    my_status_by_task_id = {str(ts.task_id): ts.status for ts in my_status_rows}
    my_grade_by_task_id = {
        str(ts.task_id): {"letter": ts.grade_letter, "percent": ts.grade_percent}
        for ts in my_status_rows
        if ts.grade_letter is not None or ts.grade_percent is not None
    }

    # Done counts per task (DONE or EXCUSED)
    done_counts_rows = db.execute(
        select(TaskStatus.task_id, func.count())
        .select_from(TaskStatus)
        .join(
            GroupMembership,
            (GroupMembership.user_id == TaskStatus.user_id)
            & (GroupMembership.group_id == group.id),
        )
        .where(
            TaskStatus.task_id.in_(task_ids),
            TaskStatus.status.in_([TaskStatusValue.DONE, TaskStatusValue.EXCUSED]),
            GroupMembership.role == GroupRole.STUDENT,
        )
        .group_by(TaskStatus.task_id)
    ).all()
    done_count_by_task_id = {str(task_id): int(cnt) for task_id, cnt in done_counts_rows}

    task_states: list[TaskState] = []
    for t in tasks:
        tid = str(t.id)
        my_grade = my_grade_by_task_id.get(tid)
        task_states.append(
            TaskState(
                id=tid,
                title=t.title,
                type=t.type,
                due_at=t.due_at,
                penalty=t.penalty,
                my_status=my_status_by_task_id.get(tid, TaskStatusValue.NOT_DONE),
                my_grade_letter=my_grade.get("letter") if my_grade else None,
                my_grade_percent=my_grade.get("percent") if my_grade else None,
                stats=TaskStats(
                    done_count=done_count_by_task_id.get(tid, 0),
                    total_count=total_count,
                ),
            )
        )

    # Recent events (privacy filtered)
    events = (
        db.execute(
            select(Event)
            .where(Event.group_id == group.id)
            .order_by(Event.created_at.desc())
            .limit(50)
        )
        .scalars()
        .all()
    )
    task_title_by_id = {str(t.id): t.title for t in tasks}

    actor_ids = [e.actor_user_id for e in events if e.actor_user_id]
    target_ids = [e.target_user_id for e in events if e.target_user_id]
    users = _user_map(db, actor_ids + target_ids)

    recent_events: list[EventOut] = []
    for e in events:
        task_id = str(e.task_id) if e.task_id else None
        if group.mode == GroupMode.INSTRUCTOR:
            # No identities in instructor mode.
            msg = e.message
            if not msg:
                if e.type == EventType.TASK_MISSED and task_id:
                    msg = f"Penalty applied for {task_title_by_id.get(task_id, 'a task')}"
                elif e.type == EventType.TASK_COMPLETED and task_id:
                    msg = f"Task completed: {task_title_by_id.get(task_id, 'a task')}"
                else:
                    msg = e.type.value

            recent_events.append(
                EventOut(
                    type=e.type,
                    task_id=task_id,
                    delta=e.delta,
                    message=msg,
                    created_at=e.created_at,
                    actor=None,
                    target=None,
                )
            )
        else:
            recent_events.append(
                EventOut(
                    type=e.type,
                    task_id=task_id,
                    delta=e.delta,
                    message=e.message,
                    created_at=e.created_at,
                    actor=users.get(str(e.actor_user_id)) if e.actor_user_id else None,
                    target=users.get(str(e.target_user_id)) if e.target_user_id else None,
                )
            )

    leaderboard: Optional[list[LeaderboardEntry]] = None
    if group.mode == GroupMode.FRIEND:
        # Simple leaderboard: count DONE rows and TASK_MISSED events (when worker is enabled).
        member_rows = db.execute(
            select(User, GroupMembership)
            .join(GroupMembership, GroupMembership.user_id == User.id)
            .where(GroupMembership.group_id == group.id, GroupMembership.role == GroupRole.STUDENT)
        ).all()

        done_rows = db.execute(
            select(TaskStatus.user_id, func.count())
            .where(TaskStatus.task_id.in_(task_ids), TaskStatus.status == TaskStatusValue.DONE)
            .group_by(TaskStatus.user_id)
        ).all()
        done_by_user = {str(uid): int(cnt) for uid, cnt in done_rows}

        missed_rows = db.execute(
            select(Event.target_user_id, func.count())
            .where(Event.group_id == group.id, Event.type == EventType.TASK_MISSED)
            .group_by(Event.target_user_id)
        ).all()
        missed_by_user = {str(uid): int(cnt) for uid, cnt in missed_rows if uid is not None}

        leaderboard = []
        for u, _m in member_rows:
            uid = str(u.id)
            leaderboard.append(
                LeaderboardEntry(
                    user=UserRef(id=uid, display_name=u.display_name),
                    done_count=done_by_user.get(uid, 0),
                    missed_count=missed_by_user.get(uid, 0),
                )
            )

        # Sort: most done, then least missed.
        leaderboard.sort(key=lambda x: (-x.done_count, x.missed_count, x.user.display_name.lower()))

    return GroupStateResponse(
        group=GroupHeader(
            id=str(group.id),
            name=group.name,
            mode=group.mode,
            class_={"code": klass.code, "term": klass.term, "school": klass.school},
        ),
        pet=PetState(
            name=pet.name,
            health=pet.health,
            max_health=pet.max_health,
            avatar_url=pet.avatar_url,
        ),
        tasks=task_states,
        leaderboard=leaderboard,
        recent_events=recent_events,
    )

