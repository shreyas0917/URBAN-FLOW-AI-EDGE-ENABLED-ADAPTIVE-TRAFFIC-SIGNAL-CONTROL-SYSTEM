from fastapi import APIRouter
from app.api.v1.endpoints import auth, signals, zones, operators, traffic, emergency, ai_explanation, realtime

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(signals.router, tags=["signals"])
api_router.include_router(zones.router, tags=["zones"])
api_router.include_router(operators.router, tags=["operators"])
api_router.include_router(traffic.router, tags=["traffic"])
api_router.include_router(emergency.router, tags=["emergency"])
api_router.include_router(ai_explanation.router, tags=["ai-explanation"])
api_router.include_router(realtime.router, tags=["realtime"])


