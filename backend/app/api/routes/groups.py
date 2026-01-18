from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.deps.auth import CurrentUser, get_current_user
from app.models.class_ import Class
from app.models.enums import EventType, GroupRole
from app.models.event import Event
from app.models.group import Group
from app.models.group_membership import GroupMembership
from app.models.pet import Pet
from app.schemas.groups import (
    CreateGroupRequest,
    CreateGroupResponse,
    GroupSummary,
    JoinGroupRequest,
    JoinGroupResponse,
    MyGroupsResponse,
)
from app.schemas.state import GroupStateResponse
from app.services.authz import require_group_membership
from app.services.deadline_penalties import apply_deadline_penalties_for_group
from app.services.group_state import build_group_state
from app.utils.invite_codes import generate_invite_code

router = APIRouter(prefix="/groups")


def _serialize_group_summary(group: Group, role: GroupRole, klass: Class, db: Session, user: CurrentUser) -> GroupSummary:
    # Get pet health for preview
    pet = db.scalar(select(Pet).where(Pet.group_id == group.id))
    pet_health = pet.health if pet else None
    pet_max_health = pet.max_health if pet else None
    
    # Check if user is the creator
    is_creator = group.created_by_id == user.id
    
    return GroupSummary(
        id=str(group.id),
        name=group.name,
        mode=group.mode,
        invite_code=group.invite_code,
        role=role,
        class_={"code": klass.code, "term": klass.term, "school": klass.school},
        pet_health=pet_health,
        pet_max_health=pet_max_health,
        is_creator=is_creator,
    )


@router.post("", response_model=CreateGroupResponse)
def create_group(
    body: CreateGroupRequest,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
) -> CreateGroupResponse:
    klass = db.scalar(
        select(Class).where(
            Class.code == body.class_code,
            Class.term == body.term,
            Class.school.is_(body.school) if body.school is None else Class.school == body.school,
        )
    )
    if klass is None:
        klass = Class(code=body.class_code, term=body.term, school=body.school)
        db.add(klass)
        db.flush()

    # Invite code uniqueness: retry on collision.
    invite_code = generate_invite_code()
    for _ in range(10):
        group = Group(
            class_id=klass.id,
            mode=body.mode,
            name=body.group_name,
            invite_code=invite_code,
            created_by_id=user.id,
        )
        db.add(group)
        try:
            db.flush()
            break
        except IntegrityError:
            db.rollback()
            invite_code = generate_invite_code()
    else:
        raise RuntimeError("Failed to generate unique invite code")

    role = GroupRole.INSTRUCTOR if body.mode.value == "INSTRUCTOR" else GroupRole.STUDENT
    membership = GroupMembership(group_id=group.id, user_id=user.id, role=role)
    db.add(membership)

    initial_hp = max(1, min(1000, int(body.initial_health)))  # Clamp between 1 and 1000
    pet = Pet(group_id=group.id, name="Pibble", health=initial_hp, max_health=initial_hp)
    db.add(pet)

    db.add(Event(group_id=group.id, type=EventType.GROUP_CREATED, actor_user_id=user.id))

    db.commit()

    return CreateGroupResponse(group=_serialize_group_summary(group, role=role, klass=klass, db=db, user=user))


@router.post("/join", response_model=JoinGroupResponse)
def join_group(
    body: JoinGroupRequest,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
) -> JoinGroupResponse:
    group = db.scalar(select(Group).where(Group.invite_code == body.invite_code.strip().upper()))
    if group is None:
        from fastapi import HTTPException, status

        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invalid invite code")

    existing = db.scalar(
        select(GroupMembership).where(
            GroupMembership.group_id == group.id,
            GroupMembership.user_id == user.id,
        )
    )
    if existing is None:
        membership = GroupMembership(group_id=group.id, user_id=user.id, role=GroupRole.STUDENT)
        db.add(membership)
        db.add(Event(group_id=group.id, type=EventType.MEMBER_JOINED, actor_user_id=user.id))
        db.commit()
        role = membership.role
    else:
        role = existing.role

    klass = db.scalar(select(Class).where(Class.id == group.class_id))
    assert klass is not None

    return JoinGroupResponse(group=_serialize_group_summary(group, role=role, klass=klass, db=db, user=user))


@router.get("/my", response_model=MyGroupsResponse)
def my_groups(
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
) -> MyGroupsResponse:
    rows = db.execute(
        select(Group, GroupMembership, Class)
        .join(GroupMembership, GroupMembership.group_id == Group.id)
        .join(Class, Class.id == Group.class_id)
        .where(GroupMembership.user_id == user.id)
        .order_by(Group.created_at.desc())
    ).all()

    # Apply deadline penalties for each group to ensure pet health is up-to-date
    # This ensures the preview matches what you see when clicking into the group
    for (g, _, _) in rows:
        apply_deadline_penalties_for_group(db, group_id=str(g.id))

    groups = [
        _serialize_group_summary(group=g, role=m.role, klass=c, db=db, user=user)
        for (g, m, c) in rows
    ]
    return MyGroupsResponse(groups=groups)


@router.delete("/{group_id}")
def delete_group(
    group_id: str,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
) -> dict:
    """Delete a group. Only the creator can delete it."""
    import uuid
    from fastapi import HTTPException, status
    
    try:
        group_uuid = uuid.UUID(group_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid group ID format")
    
    group = db.scalar(select(Group).where(Group.id == group_uuid))
    if group is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
    
    # Only the creator can delete the group
    if group.created_by_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the group creator can delete the group")
    
    # Delete related records first to avoid constraint issues
    # Delete all tasks for this group
    from app.models.task import Task
    from app.models.task_status import TaskStatus
    tasks = db.scalars(select(Task).where(Task.group_id == group_uuid)).all()
    for task in tasks:
        # Delete task statuses first
        task_statuses = db.scalars(select(TaskStatus).where(TaskStatus.task_id == task.id)).all()
        for task_status in task_statuses:
            db.delete(task_status)
        db.delete(task)
    
    # Delete all events for this group
    from app.models.event import Event
    events = db.scalars(select(Event).where(Event.group_id == group_uuid)).all()
    for event in events:
        db.delete(event)
    
    # Delete all memberships for this group
    memberships = db.scalars(select(GroupMembership).where(GroupMembership.group_id == group_uuid)).all()
    for membership in memberships:
        db.delete(membership)
    
    # Delete the pet
    pet = db.scalar(select(Pet).where(Pet.group_id == group_uuid))
    if pet:
        db.delete(pet)
    
    # Finally delete the group itself
    db.delete(group)
    db.commit()
    return {"ok": True}


@router.get("/{group_id}/state", response_model=GroupStateResponse)
def group_state(
    group_id: str,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
) -> GroupStateResponse:
    ctx = require_group_membership(db, group_id=group_id, user=user)
    # Apply deadline penalties before building state (for demo convenience)
    apply_deadline_penalties_for_group(db, group_id=ctx.group.id)
    return build_group_state(db, group=ctx.group, viewer=user)

