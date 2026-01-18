from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.enums import TaskStatusValue, TaskType


class TaskOut(BaseModel):
    id: str
    group_id: str
    title: str
    type: TaskType
    due_at: datetime
    penalty: int


class CreateTaskRequest(BaseModel):
    title: str
    type: TaskType
    due_at: datetime
    penalty: int = 1


class UpdateTaskRequest(BaseModel):
    title: Optional[str] = None
    type: Optional[TaskType] = None
    due_at: Optional[datetime] = None
    penalty: Optional[int] = None


class CompleteTaskRequest(BaseModel):
    status: TaskStatusValue = Field(..., description="DONE, NOT_DONE, or EXCUSED (instructor only)")


class TaskWithMyStatus(TaskOut):
    my_status: TaskStatusValue

