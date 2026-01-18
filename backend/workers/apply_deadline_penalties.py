from __future__ import annotations

import os
import time
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError

from app.db.session import SessionLocal
from app.models.enums import EventType, GroupRole, TaskStatusValue
from app.models.event import Event
from app.models.group_membership import GroupMembership
from app.models.pet import Pet
from app.models.task import Task
from app.models.task_status import TaskStatus


def apply_deadline_penalties_once() -> int:
    """
    Apply penalties for overdue tasks where penalty_applied_at is NULL.

    Idempotency:
    - insert TASK_MISSED event protected by unique index (type, task_id, target_user_id)
    - only if insert succeeds, decrement pet health
    """
    now = datetime.now(timezone.utc)
    applied_events = 0

    with SessionLocal() as db:
        tasks = (
            db.execute(
                select(Task)
                .where(Task.due_at < now, Task.penalty_applied_at.is_(None))
                .order_by(Task.due_at.asc())
            )
            .scalars()
            .all()
        )

        for task in tasks:
            # Per-task transaction keeps pet health + event log consistent.
            with db.begin():
                pet = db.scalar(select(Pet).where(Pet.group_id == task.group_id).with_for_update())
                if pet is None:
                    pet = Pet(group_id=task.group_id, name="Pibble", health=10, max_health=10)
                    db.add(pet)
                    db.flush()

                members = (
                    db.execute(
                        select(GroupMembership.user_id)
                        .where(
                            GroupMembership.group_id == task.group_id,
                            GroupMembership.role == GroupRole.STUDENT,
                        )
                        .order_by(GroupMembership.joined_at.asc())
                    )
                    .scalars()
                    .all()
                )

                for user_id in members:
                    status = db.scalar(
                        select(TaskStatus.status).where(
                            TaskStatus.task_id == task.id,
                            TaskStatus.user_id == user_id,
                        )
                    )
                    if status in (TaskStatusValue.DONE, TaskStatusValue.EXCUSED):
                        continue

                    # Cross-DB idempotency: check before insert
                    # (SQLite doesn't support our Postgres partial unique index).
                    existing_missed = db.scalar(
                        select(func.count())
                        .select_from(Event)
                        .where(
                            Event.group_id == task.group_id,
                            Event.type == EventType.TASK_MISSED,
                            Event.task_id == task.id,
                            Event.target_user_id == user_id,
                        )
                    )
                    if int(existing_missed or 0) > 0:
                        continue

                    # Savepoint per user keeps the overall task transaction alive.
                    try:
                        with db.begin_nested():
                            db.add(
                                Event(
                                    group_id=task.group_id,
                                    type=EventType.TASK_MISSED,
                                    actor_user_id=None,  # system
                                    target_user_id=user_id,
                                    task_id=task.id,
                                    delta=-int(task.penalty),
                                    message=None,
                                )
                            )
                            db.flush()  # may raise IntegrityError if already inserted
                    except IntegrityError:
                        continue

                    applied_events += 1
                    pet.health = max(0, min(pet.max_health, pet.health - int(task.penalty)))

                task.penalty_applied_at = now

    return applied_events


def run_forever(interval_seconds: int) -> None:
    while True:
        applied = apply_deadline_penalties_once()
        if applied:
            print(f"[worker] applied {applied} missed-deadline events")
        time.sleep(interval_seconds)


if __name__ == "__main__":
    interval = int(os.getenv("WORKER_INTERVAL_SECONDS", "60"))
    once = os.getenv("WORKER_ONCE", "0") == "1"
    if once:
        n = apply_deadline_penalties_once()
        print(f"[worker] applied {n} missed-deadline events")
    else:
        print(f"[worker] starting deadline penalty loop (interval={interval}s)")
        run_forever(interval)

