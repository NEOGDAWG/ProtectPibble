from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


# Ensure model modules are imported so Alembic autogenerate sees them.
# (Safe even if you prefer manual migrations.)
from app import models as _models  # noqa: E402,F401

