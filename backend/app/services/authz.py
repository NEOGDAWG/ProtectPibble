from __future__ import annotations

import uuid
from dataclasses import dataclass

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.deps.auth import CurrentUser
from app.models.enums import GroupMode, GroupRole
from app.models.group import Group
from app.models.group_membership import GroupMembership


@dataclass(frozen=True)
class MembershipContext:
    group: Group
    membership: GroupMembership


def require_group_membership(db: Session, group_id: str, user: CurrentUser) -> MembershipContext:
    try:
        group_uuid = uuid.UUID(group_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid group id",
        ) from e

    group = db.scalar(select(Group).where(Group.id == group_uuid))
    if group is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")

    membership = db.scalar(
        select(GroupMembership).where(
            GroupMembership.group_id == group_uuid,
            GroupMembership.user_id == user.id,
        )
    )
    if membership is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this group",
        )

    return MembershipContext(group=group, membership=membership)


def require_instructor_or_creator(ctx: MembershipContext, user: CurrentUser) -> None:
    if ctx.group.created_by_id == user.id:
        return
    if ctx.membership.role == GroupRole.INSTRUCTOR:
        return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Instructor permission required",
    )


def can_create_tasks(ctx: MembershipContext) -> bool:
    if ctx.group.mode == GroupMode.INSTRUCTOR:
        return ctx.membership.role == GroupRole.INSTRUCTOR
    # FRIEND: allow all members for MVP (can tighten later)
    return True


def require_can_create_tasks(ctx: MembershipContext) -> None:
    if not can_create_tasks(ctx):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not allowed to create tasks",
        )


def ensure_instructor_mode_has_no_identities(group: Group) -> None:
    # Marker/helper for future use; serialization should enforce this.
    if group.mode != GroupMode.INSTRUCTOR:
        return


def ensure_nudges_allowed(group: Group) -> None:
    # Easiest MVP: disable nudges in instructor mode.
    if group.mode == GroupMode.INSTRUCTOR:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nudges are disabled in INSTRUCTOR mode for MVP",
        )

