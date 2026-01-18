from fastapi import APIRouter

from app.core.config import get_settings

router = APIRouter()
settings = get_settings()


@router.get("/health")
def health() -> dict:
    """Health check endpoint with CORS debug info."""
    return {
        "ok": True,
        "cors_origins": settings.cors_origins,
        "cors_origin_regex": settings.cors_allow_origin_regex,
    }

