"""Add password authentication

Revision ID: 0002_add_password_auth
Revises: 0001_create_mvp_tables
Create Date: 2026-01-18
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "0002_add_password_auth"
down_revision = "0001_create_mvp_tables"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add password_hash column (nullable for existing demo users)
    op.add_column("users", sa.Column("password_hash", sa.String(length=255), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "password_hash")
