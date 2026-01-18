from fastapi import APIRouter

from app.api.routes import auth, groups, health, nudges, tasks

api_router = APIRouter()

api_router.include_router(health.router, tags=["health"])
api_router.include_router(auth.router, tags=["auth"])
api_router.include_router(groups.router, tags=["groups"])
api_router.include_router(tasks.router, tags=["tasks"])
api_router.include_router(nudges.router, tags=["nudges"])

