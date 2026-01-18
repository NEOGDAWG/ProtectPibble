from fastapi import APIRouter

from app.api.routes import groups, health, nudges, tasks

api_router = APIRouter()
#yo

api_router.include_router(health.router, tags=["health"])
api_router.include_router(groups.router, tags=["groups"])
api_router.include_router(tasks.router, tags=["tasks"])
api_router.include_router(nudges.router, tags=["nudges"])

