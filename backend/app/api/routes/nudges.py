from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.deps.auth import CurrentUser, get_current_user
from app.models.enums import EventType
from app.models.event import Event
from app.models.group_membership import GroupMembership
from app.schemas.nudges import NudgeRequest, NudgeResponse
from app.services.authz import ensure_nudges_allowed, require_group_membership

router = APIRouter(prefix="/groups/{group_id}/nudges")


@router.post("", response_model=NudgeResponse)
def send_nudge(
    group_id: str,
    body: NudgeRequest,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
) -> NudgeResponse:
    ctx = require_group_membership(db, group_id=group_id, user=user)
    ensure_nudges_allowed(ctx.group)

    # recipient must be in group
    recipient_membership = db.scalar(
        select(GroupMembership).where(
            GroupMembership.group_id == ctx.group.id,
            GroupMembership.user_id == body.to_user_id,
        )
    )
    if recipient_membership is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Recipient not in group",
        )

    db.add(
        Event(
            group_id=ctx.group.id,
            type=EventType.NUDGE_SENT,
            actor_user_id=user.id,
            target_user_id=body.to_user_id,
            task_id=body.task_id,
            message=body.message,
        )
    )
    db.commit()
    return NudgeResponse(ok=True)

