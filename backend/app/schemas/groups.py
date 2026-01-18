from __future__ import annotations

from typing import Optional

from pydantic import Field

from app.models.enums import GroupMode, GroupRole
from app.schemas.base import ApiModel


class ClassRef(ApiModel):
    code: str
    term: str
    school: Optional[str] = None


class GroupSummary(ApiModel):
    id: str
    name: str
    mode: GroupMode
    invite_code: str
    role: GroupRole
    class_: ClassRef = Field(alias="class")


class CreateGroupRequest(ApiModel):
    class_code: str
    term: str
    school: Optional[str] = None
    mode: GroupMode
    group_name: str


class JoinGroupRequest(ApiModel):
    invite_code: str


class CreateGroupResponse(ApiModel):
    group: GroupSummary


class JoinGroupResponse(ApiModel):
    group: GroupSummary


class MyGroupsResponse(ApiModel):
    groups: list[GroupSummary]

