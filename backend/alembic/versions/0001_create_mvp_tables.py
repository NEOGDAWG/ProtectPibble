"""Create MVP tables.

Revision ID: 0001_create_mvp_tables
Revises:
Create Date: 2026-01-18
"""

from __future__ import annotations

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision = "0001_create_mvp_tables"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Enums
    group_mode = postgresql.ENUM("FRIEND", "INSTRUCTOR", name="groupmode")
    group_role = postgresql.ENUM("student", "instructor", name="grouprole")
    task_type = postgresql.ENUM("ASSIGNMENT", "QUIZ", "LECTURE", "EXAM", "OTHER", name="tasktype")
    task_status = postgresql.ENUM("NOT_DONE", "DONE", "EXCUSED", name="taskstatusvalue")
    event_type = postgresql.ENUM(
        "GROUP_CREATED",
        "MEMBER_JOINED",
        "TASK_CREATED",
        "TASK_COMPLETED",
        "TASK_MISSED",
        "PET_DAMAGED",
        "NUDGE_SENT",
        name="eventtype",
    )

    group_mode.create(op.get_bind(), checkfirst=True)
    group_role.create(op.get_bind(), checkfirst=True)
    task_type.create(op.get_bind(), checkfirst=True)
    task_status.create(op.get_bind(), checkfirst=True)
    event_type.create(op.get_bind(), checkfirst=True)

    # Tables
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("display_name", sa.String(length=120), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "classes",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("school", sa.String(length=120), nullable=True),
        sa.Column("code", sa.String(length=50), nullable=False),
        sa.Column("term", sa.String(length=50), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.UniqueConstraint("school", "code", "term", name="uq_classes_school_code_term"),
    )

    op.create_table(
        "groups",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("class_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("mode", group_mode, nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("invite_code", sa.String(length=16), nullable=False),
        sa.Column("created_by_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["class_id"], ["classes.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"], ondelete="RESTRICT"),
    )
    op.create_index("ix_groups_class_id", "groups", ["class_id"])
    op.create_index("ix_groups_created_by_id", "groups", ["created_by_id"])
    op.create_index("ix_groups_invite_code", "groups", ["invite_code"], unique=True)

    op.create_table(
        "group_memberships",
        sa.Column("group_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("role", group_role, nullable=False),
        sa.Column(
            "joined_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("group_id", "user_id", name="pk_group_memberships"),
        sa.ForeignKeyConstraint(["group_id"], ["groups.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )

    op.create_table(
        "tasks",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("group_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("type", task_type, nullable=False),
        sa.Column("due_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("penalty", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("created_by_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("penalty_applied_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["group_id"], ["groups.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"], ondelete="RESTRICT"),
    )
    op.create_index("ix_tasks_group_id", "tasks", ["group_id"])
    op.create_index("ix_tasks_due_at", "tasks", ["due_at"])
    op.create_index("ix_tasks_created_by_id", "tasks", ["created_by_id"])

    op.create_table(
        "task_status",
        sa.Column("task_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("status", task_status, nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("task_id", "user_id", name="pk_task_status"),
        sa.ForeignKeyConstraint(["task_id"], ["tasks.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )

    op.create_table(
        "pets",
        sa.Column("group_id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(length=80), nullable=False, server_default="Pibble"),
        sa.Column("health", sa.Integer(), nullable=False, server_default="10"),
        sa.Column("max_health", sa.Integer(), nullable=False, server_default="10"),
        sa.Column("avatar_url", sa.String(length=500), nullable=True),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["group_id"], ["groups.id"], ondelete="CASCADE"),
    )

    op.create_table(
        "events",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("group_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("type", event_type, nullable=False),
        sa.Column("actor_user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("target_user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("task_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("delta", sa.Integer(), nullable=True),
        sa.Column("message", sa.String(length=500), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["group_id"], ["groups.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["actor_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["target_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["task_id"], ["tasks.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_events_group_id", "events", ["group_id"])
    op.create_index("ix_events_type", "events", ["type"])
    op.create_index("ix_events_created_at", "events", ["created_at"])
    op.create_index("ix_events_actor_user_id", "events", ["actor_user_id"])
    op.create_index("ix_events_target_user_id", "events", ["target_user_id"])
    op.create_index("ix_events_task_id", "events", ["task_id"])

    # Idempotency constraint for missed deadlines:
    # Unique index: (type, task_id, target_user_id) where type=TASK_MISSED
    op.create_index(
        "uq_events_task_missed",
        "events",
        ["type", "task_id", "target_user_id"],
        unique=True,
        postgresql_where=sa.text(
            "type = 'TASK_MISSED' AND task_id IS NOT NULL AND target_user_id IS NOT NULL"
        ),
    )


def downgrade() -> None:
    op.drop_index("uq_events_task_missed", table_name="events")
    op.drop_table("events")
    op.drop_table("pets")
    op.drop_table("task_status")
    op.drop_table("tasks")
    op.drop_table("group_memberships")
    op.drop_index("ix_groups_invite_code", table_name="groups")
    op.drop_index("ix_groups_created_by_id", table_name="groups")
    op.drop_index("ix_groups_class_id", table_name="groups")
    op.drop_table("groups")
    op.drop_table("classes")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")

    # Enums (drop last)
    op.execute("DROP TYPE IF EXISTS eventtype")
    op.execute("DROP TYPE IF EXISTS taskstatusvalue")
    op.execute("DROP TYPE IF EXISTS tasktype")
    op.execute("DROP TYPE IF EXISTS grouprole")
    op.execute("DROP TYPE IF EXISTS groupmode")

