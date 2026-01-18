from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.deps.auth import CurrentUser, get_current_user
from app.models.enums import EventType, GroupRole, TaskStatusValue
from app.models.event import Event
from app.models.group import Group
from app.models.task import Task
from app.models.task_status import TaskStatus
from app.schemas.tasks import CompleteTaskRequest, CreateTaskRequest, TaskOut, UpdateTaskRequest
from app.services.authz import (
    require_can_create_tasks,
    require_group_membership,
    require_instructor_or_creator,
)

router = APIRouter()


def _get_task_and_group(db: Session, task_id: str) -> tuple[Task, Group]:
    try:
        task_uuid = uuid.UUID(task_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid task id",
        ) from e

    task = db.scalar(select(Task).where(Task.id == task_uuid))
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    group = db.scalar(select(Group).where(Group.id == task.group_id))
    assert group is not None
    return task, group


@router.post("/groups/{group_id}/tasks", response_model=TaskOut)
def create_task(
    group_id: str,
    body: CreateTaskRequest,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
) -> TaskOut:
    ctx = require_group_membership(db, group_id=group_id, user=user)
    require_can_create_tasks(ctx)

    task = Task(
        group_id=ctx.group.id,
        title=body.title,
        type=body.type,
        due_at=body.due_at,
        penalty=body.penalty,
        created_by_id=user.id,
    )
    db.add(task)
    db.flush()

    db.add(
        Event(
            group_id=ctx.group.id,
            type=EventType.TASK_CREATED,
            actor_user_id=user.id,
            task_id=task.id,
        )
    )
    db.commit()

    return TaskOut(
        id=str(task.id),
        group_id=str(task.group_id),
        title=task.title,
        type=task.type,
        due_at=task.due_at,
        penalty=task.penalty,
    )


@router.patch("/tasks/{task_id}", response_model=TaskOut)
def update_task(
    task_id: str,
    body: UpdateTaskRequest,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
) -> TaskOut:
    task, group = _get_task_and_group(db, task_id)
    ctx = require_group_membership(db, group_id=str(group.id), user=user)
    # creator or instructor
    if task.created_by_id != user.id:
        require_instructor_or_creator(ctx, user)

    if body.title is not None:
        task.title = body.title
    if body.type is not None:
        task.type = body.type
    if body.due_at is not None:
        task.due_at = body.due_at
    if body.penalty is not None:
        task.penalty = body.penalty

    db.commit()
    db.refresh(task)

    return TaskOut(
        id=str(task.id),
        group_id=str(task.group_id),
        title=task.title,
        type=task.type,
        due_at=task.due_at,
        penalty=task.penalty,
    )


@router.delete("/tasks/{task_id}")
def delete_task(
    task_id: str,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
) -> dict:
    task, group = _get_task_and_group(db, task_id)
    ctx = require_group_membership(db, group_id=str(group.id), user=user)
    if task.created_by_id != user.id:
        require_instructor_or_creator(ctx, user)

    db.delete(task)
    db.commit()
    return {"ok": True}


@router.post("/tasks/{task_id}/complete")
def complete_task(
    task_id: str,
    body: CompleteTaskRequest,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
) -> dict:
    task, group = _get_task_and_group(db, task_id)
    ctx = require_group_membership(db, group_id=str(group.id), user=user)

    # EXCUSED is only allowed in INSTRUCTOR mode by instructors.
    if body.status == TaskStatusValue.EXCUSED:
        if ctx.group.mode.value != "INSTRUCTOR":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="EXCUSED only in INSTRUCTOR mode",
            )
        if ctx.membership.role != GroupRole.INSTRUCTOR:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Instructor required to excuse",
            )

    existing = db.scalar(
        select(TaskStatus).where(TaskStatus.task_id == task.id, TaskStatus.user_id == user.id)
    )

    if body.status == TaskStatusValue.NOT_DONE:
        # Remove row for NOT_DONE to match the spec (missing row => NOT_DONE).
        if existing is not None:
            db.delete(existing)
            db.commit()
        return {"ok": True}

    now = datetime.now(timezone.utc)
    if existing is None:
        existing = TaskStatus(
            task_id=task.id,
            user_id=user.id,
            status=body.status,
            completed_at=now,
        )
        db.add(existing)
        db.flush()
    else:
        existing.status = body.status
        existing.completed_at = now

    if body.status == TaskStatusValue.DONE:
        db.add(
            Event(
                group_id=task.group_id,
                type=EventType.TASK_COMPLETED,
                actor_user_id=user.id,
                task_id=task.id,
            )
        )

    db.commit()
    return {"ok": True}

