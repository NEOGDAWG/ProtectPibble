from __future__ import annotations

import enum


class GroupMode(str, enum.Enum):
    FRIEND = "FRIEND"
    INSTRUCTOR = "INSTRUCTOR"


class GroupRole(str, enum.Enum):
    STUDENT = "student"
    INSTRUCTOR = "instructor"


class TaskType(str, enum.Enum):
    ASSIGNMENT = "ASSIGNMENT"
    QUIZ = "QUIZ"
    LECTURE = "LECTURE"
    EXAM = "EXAM"
    OTHER = "OTHER"


class TaskStatusValue(str, enum.Enum):
    NOT_DONE = "NOT_DONE"
    DONE = "DONE"
    EXCUSED = "EXCUSED"


class EventType(str, enum.Enum):
    GROUP_CREATED = "GROUP_CREATED"
    MEMBER_JOINED = "MEMBER_JOINED"
    TASK_CREATED = "TASK_CREATED"
    TASK_COMPLETED = "TASK_COMPLETED"
    TASK_MISSED = "TASK_MISSED"
    PET_DAMAGED = "PET_DAMAGED"
    NUDGE_SENT = "NUDGE_SENT"

