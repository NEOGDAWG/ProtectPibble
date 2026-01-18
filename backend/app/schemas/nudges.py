from __future__ import annotations

from typing import Optional

from pydantic import BaseModel


class NudgeRequest(BaseModel):
    to_user_id: str
    task_id: Optional[str] = None
    message: Optional[str] = None


class NudgeResponse(BaseModel):
    ok: bool

