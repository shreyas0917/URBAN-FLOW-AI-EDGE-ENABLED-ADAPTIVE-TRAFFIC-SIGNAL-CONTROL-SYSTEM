"""
Real-Time Data API Endpoints
Provides access to real-time traffic data from free public sources
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.api.v1.endpoints.auth import get_current_user
from app.db import models
from app.services.realtime_data_service import realtime_data_service

router = APIRouter()

@router.get("/realtime/traffic-pattern")
async def get_traffic_pattern(
    current_user: models.User = Depends(get_current_user),
):
    """Get current traffic pattern based on time of day"""
    pattern = realtime_data_service.get_time_based_traffic_pattern()
    return {
        "pattern": pattern,
        "message": "Real-time traffic pattern based on Mumbai rush hours",
    }

@router.get("/realtime/weather")
async def get_weather_data(
    current_user: models.User = Depends(get_current_user),
):
    """Get current weather data (affects traffic)"""
    weather = await realtime_data_service.fetch_weather_data()
    return {
        "weather": weather,
        "message": "Weather data affecting traffic conditions",
    }

@router.get("/realtime/road-congestion")
async def get_road_congestion(
    current_user: models.User = Depends(get_current_user),
):
    """Get current road congestion levels"""
    congestion = await realtime_data_service.update_road_congestion()
    return {
        "congestion": congestion,
        "message": "Real-time road congestion based on time and weather",
    }

@router.get("/realtime/osm-data")
async def get_osm_data(
    current_user: models.User = Depends(get_current_user),
):
    """Get OpenStreetMap road network data for Mumbai"""
    if current_user.role != models.UserRole.SUPER_ADMIN:
        return {"error": "Only Super Admin can access OSM data"}
    
    osm_data = await realtime_data_service.fetch_openstreetmap_traffic()
    return {
        "osm_data": osm_data,
        "message": "OpenStreetMap road network data",
    }



