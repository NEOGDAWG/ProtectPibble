"""SQLAlchemy models.

Importing this module should import all models so Alembic autogenerate can see them.
"""

from app.models.class_ import Class  # noqa: F401
from app.models.enums import (  # noqa: F401
    EventType,
    GroupMode,
    GroupRole,
    TaskStatusValue,
    TaskType,
)
from app.models.event import Event  # noqa: F401
from app.models.group import Group  # noqa: F401
from app.models.group_membership import GroupMembership  # noqa: F401
from app.models.pet import Pet  # noqa: F401
from app.models.task import Task  # noqa: F401
from app.models.task_status import TaskStatus  # noqa: F401
from app.models.user import User  # noqa: F401

