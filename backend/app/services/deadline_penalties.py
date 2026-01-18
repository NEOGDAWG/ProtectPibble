from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.enums import EventType, GroupRole, TaskStatusValue
from app.models.event import Event
from app.models.group_membership import GroupMembership
from app.models.pet import Pet
from app.models.task import Task
from app.models.task_status import TaskStatus


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


def _to_uuid(val: object) -> uuid.UUID:
    if isinstance(val, uuid.UUID):
        return val
    if isinstance(val, str):
        return uuid.UUID(val)
    raise TypeError("Expected UUID or str")


def apply_deadline_penalties_for_group(db: Session, group_id) -> int:
    """
    Apply missed-deadline penalties for one group.
    NOTE: This mutates state during a GET (dashboard) for demo convenience.
    """
    now = _now_utc()
    applied_events = 0
    group_uuid = _to_uuid(group_id)

    overdue_tasks = (
        db.execute(
            select(Task)
            .where(
                Task.group_id == group_uuid,
                Task.due_at < now,
                Task.penalty_applied_at.is_(None),
            )
            .order_by(Task.due_at.asc())
        )
        .scalars()
        .all()
    )
    if not overdue_tasks:
        return 0

    is_sqlite = db.bind is not None and db.bind.dialect.name == "sqlite"

    for task in overdue_tasks:
        with db.begin_nested():
            pet_q = select(Pet).where(Pet.group_id == group_uuid)
            if not is_sqlite:
                pet_q = pet_q.with_for_update()
            pet = db.scalar(pet_q)
            if pet is None:
                pet = Pet(group_id=group_uuid, name="Pibble", health=100, max_health=100)
                db.add(pet)
                db.flush()

            members = (
                db.execute(
                    select(GroupMembership.user_id)
                    .where(
                        GroupMembership.group_id == group_uuid,
                        GroupMembership.role == GroupRole.STUDENT,
                    )
                    .order_by(GroupMembership.joined_at.asc())
                )
                .scalars()
                .all()
            )

            for user_id in members:
                user_uuid = _to_uuid(user_id)
                status = db.scalar(
                    select(TaskStatus.status).where(
                        TaskStatus.task_id == task.id,
                        TaskStatus.user_id == user_uuid,
                    )
                )
                if status in (TaskStatusValue.DONE, TaskStatusValue.EXCUSED):
                    continue

                exists = db.scalar(
                    select(func.count())
                    .select_from(Event)
                    .where(
                        Event.group_id == group_uuid,
                        Event.type == EventType.TASK_MISSED,
                        Event.task_id == task.id,
                        Event.target_user_id == user_uuid,
                    )
                )
                if int(exists or 0) > 0:
                    continue

                try:
                    with db.begin_nested():
                        db.add(
                            Event(
                                group_id=group_uuid,
                                type=EventType.TASK_MISSED,
                                actor_user_id=None,
                                target_user_id=user_uuid,
                                task_id=task.id,
                                delta=-int(task.penalty),
                            )
                        )
                        db.flush()
                except IntegrityError:
                    continue

                applied_events += 1
                pet.health = max(0, min(pet.max_health, pet.health - int(task.penalty)))

            task.penalty_applied_at = now

    if applied_events:
        db.commit()

    return applied_events
