from __future__ import annotations

import secrets
import string

ALPHABET = string.ascii_uppercase + string.digits


def generate_invite_code(length: int = 7) -> str:
    # e.g. "A1B2C3D" (short, readable, URL-safe)
    return "".join(secrets.choice(ALPHABET) for _ in range(length))

