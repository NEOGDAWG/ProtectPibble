from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import Field

from app.models.enums import EventType, GroupMode, TaskStatusValue, TaskType
from app.schemas.base import ApiModel


class ClassRef(ApiModel):
    code: str
    term: str
    school: Optional[str] = None


class GroupHeader(ApiModel):
    id: str
    name: str
    mode: GroupMode
    class_: ClassRef = Field(alias="class")


class PetState(ApiModel):
    name: str
    health: int
    max_health: int
    avatar_url: Optional[str] = None


class TaskStats(ApiModel):
    done_count: int
    total_count: int


class TaskState(ApiModel):
    id: str
    title: str
    type: TaskType
    due_at: datetime
    penalty: int
    my_status: TaskStatusValue
    stats: TaskStats


class UserRef(ApiModel):
    id: str
    display_name: str


class LeaderboardEntry(ApiModel):
    user: UserRef
    done_count: int
    missed_count: int


class EventOut(ApiModel):
    type: EventType
    task_id: Optional[str] = None
    delta: Optional[int] = None
    message: Optional[str] = None
    created_at: datetime

    actor: Optional[UserRef] = None
    target: Optional[UserRef] = None


class GroupStateResponse(ApiModel):
    group: GroupHeader
    pet: PetState
    tasks: list[TaskState]
    leaderboard: Optional[list[LeaderboardEntry]] = None
    recent_events: list[EventOut]

