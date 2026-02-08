"""
Real-Time Data Service
Integrates free public APIs and data sources for real-time traffic information
Final Year Project - Urban Flow Traffic Control System
"""
import asyncio
import random
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.db import models

# Try to import aiohttp, fallback if not available
try:
    import aiohttp
    HAS_AIOHTTP = True
except ImportError:
    HAS_AIOHTTP = False
    print("[WARNING] aiohttp not installed. Install with: pip install aiohttp")

class RealTimeDataService:
    def __init__(self):
        self.running = False
        self.websocket_connections = []
        self.session: Optional[aiohttp.ClientSession] = None if not HAS_AIOHTTP else None
        self.mumbai_bounds = {
            "min_lat": 18.9,
            "max_lat": 19.3,
            "min_lon": 72.7,
            "max_lon": 73.0
        }
    
    def add_websocket(self, ws):
        """Add a WebSocket connection for broadcasting"""
        self.websocket_connections.append(ws)
    
    def remove_websocket(self, ws):
        """Remove a WebSocket connection"""
        if ws in self.websocket_connections:
            self.websocket_connections.remove(ws)
    
    async def broadcast(self, message_type: str, data: dict):
        """Broadcast message to all connected WebSocket clients"""
        if not self.websocket_connections:
            return
        
        message = {
            "type": message_type,
            "data": data,
            "timestamp": datetime.utcnow().isoformat(),
        }
        
        disconnected = []
        for ws in self.websocket_connections:
            try:
                if hasattr(ws, 'send_json'):
                    await ws.send_json(message)
                else:
                    import json
                    await ws.send_text(json.dumps(message))
            except Exception as e:
                print(f"WebSocket broadcast error: {e}")
                disconnected.append(ws)
        
        for ws in disconnected:
            self.remove_websocket(ws)
    
    async def fetch_openstreetmap_traffic(self) -> Dict:
        """
        Fetch road network data from OpenStreetMap Overpass API (Free)
        This provides real road geometries and can be used to enhance our road network
        """
        if not HAS_AIOHTTP:
            return {"success": False, "error": "aiohttp not installed"}
        
        try:
            if not self.session:
                self.session = aiohttp.ClientSession()
            
            # Mumbai bounding box query
            overpass_url = "https://overpass-api.de/api/interpreter"
            query = f"""
            [out:json][timeout:25];
            (
              way["highway"~"^(primary|secondary|tertiary|trunk)$"]
              ({self.mumbai_bounds['min_lat']},{self.mumbai_bounds['min_lon']},{self.mumbai_bounds['max_lat']},{self.mumbai_bounds['max_lon']});
            );
            out geom;
            """
            
            async with self.session.post(
                overpass_url,
                data={"data": query},
                timeout=aiohttp.ClientTimeout(total=10)
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    return {"success": True, "data": data, "source": "OpenStreetMap"}
                else:
                    return {"success": False, "error": f"HTTP {response.status}"}
        except Exception as e:
            print(f"OpenStreetMap fetch error: {e}")
            return {"success": False, "error": str(e)}
    
    def get_time_based_traffic_pattern(self) -> Dict:
        """
        Generate realistic traffic patterns based on time of day
        Uses Mumbai's actual rush hour patterns
        """
        now = datetime.now()
        hour = now.hour
        day_of_week = now.weekday()  # 0 = Monday, 6 = Sunday
        
        # Mumbai rush hours: 8-10 AM, 6-8 PM
        # Weekend patterns are different
        is_weekend = day_of_week >= 5
        
        if is_weekend:
            # Weekend: Lower traffic, more spread out
            if 10 <= hour <= 20:
                base_multiplier = 0.7
            else:
                base_multiplier = 0.4
        else:
            # Weekday patterns
            if 8 <= hour <= 10:  # Morning rush
                base_multiplier = 1.5
            elif 18 <= hour <= 20:  # Evening rush
                base_multiplier = 1.6
            elif 10 <= hour <= 12 or 14 <= hour <= 17:  # Mid-day
                base_multiplier = 1.0
            elif 12 <= hour <= 14:  # Lunch time
                base_multiplier = 0.8
            elif 20 <= hour <= 22:  # Late evening
                base_multiplier = 0.7
            else:  # Night/Early morning
                base_multiplier = 0.3
        
        return {
            "time_multiplier": base_multiplier,
            "hour": hour,
            "day_of_week": day_of_week,
            "is_rush_hour": (8 <= hour <= 10) or (18 <= hour <= 20),
            "is_weekend": is_weekend,
        }
    
    async def fetch_weather_data(self) -> Dict:
        """
        Fetch weather data from OpenWeatherMap (Free tier available)
        Weather affects traffic patterns
        """
        # For demo, we simulate weather. Can integrate real API if needed
        try:
            # Simulate weather conditions that affect traffic
            conditions = ["clear", "cloudy", "rainy", "foggy"]
            current_condition = random.choice(conditions)
            
            # Weather impact on traffic
            weather_multiplier = {
                "clear": 1.0,
                "cloudy": 1.1,
                "rainy": 1.4,  # Rain increases traffic significantly
                "foggy": 1.3,
            }
            
            return {
                "condition": current_condition,
                "temperature": random.randint(25, 35),  # Mumbai temperature range
                "humidity": random.randint(60, 90),
                "traffic_multiplier": weather_multiplier.get(current_condition, 1.0),
                "source": "simulated_weather",
            }
        except Exception as e:
            print(f"Weather fetch error: {e}")
            return {
                "condition": "clear",
                "traffic_multiplier": 1.0,
                "source": "fallback",
            }
    
    async def generate_realistic_traffic_data(self, signal: models.Signal) -> Dict:
        """
        Generate realistic traffic data based on:
        - Time of day patterns
        - Weather conditions
        - Historical patterns
        - Random variations
        """
        time_pattern = self.get_time_based_traffic_pattern()
        weather = await self.fetch_weather_data()
        
        # Base traffic values
        base_vehicle_count = 30
        base_queue_length = 10
        base_speed = 40  # km/h
        
        # Apply multipliers
        vehicle_count = int(
            base_vehicle_count * time_pattern["time_multiplier"] * weather["traffic_multiplier"]
        ) + random.randint(-10, 20)
        
        queue_length = int(
            base_queue_length * time_pattern["time_multiplier"] * weather["traffic_multiplier"]
        ) + random.randint(-5, 15)
        
        speed = max(10, int(
            base_speed / (time_pattern["time_multiplier"] * weather["traffic_multiplier"])
        ) + random.randint(-10, 10))
        
        # Calculate density (0.0 to 1.0)
        density = min(1.0, (vehicle_count / 100) * time_pattern["time_multiplier"])
        
        return {
            "vehicle_count": max(0, vehicle_count),
            "queue_length": max(0, queue_length),
            "speed": speed,
            "density": round(density, 2),
            "pedestrian_count": random.randint(0, 20) if time_pattern["is_rush_hour"] else random.randint(0, 10),
            "time_pattern": time_pattern,
            "weather": weather,
        }
    
    async def update_traffic_data(self):
        """Update traffic data for all signals using real-time patterns"""
        db = SessionLocal()
        try:
            signals = db.query(models.Signal).filter(
                models.Signal.status == models.SignalStatus.ACTIVE
            ).all()
            
            updates = []
            for signal in signals:
                traffic_data = await self.generate_realistic_traffic_data(signal)
                
                # Create traffic log
                traffic_log = models.TrafficLog(
                    signal_id=signal.id,
                    vehicle_count=traffic_data["vehicle_count"],
                    pedestrian_count=traffic_data["pedestrian_count"],
                    queue_length=traffic_data["queue_length"],
                    density=traffic_data["density"],
                    traffic_density=traffic_data["density"],  # Also populate legacy column
                )
                db.add(traffic_log)
                
                updates.append({
                    "signal_id": signal.signal_id,
                    "signal_id_db": signal.id,
                    "zone_id": signal.zone_id,
                    **traffic_data,
                })
            
            db.commit()
            
            # Broadcast updates
            await self.broadcast("realtime_traffic_update", {
                "signals": updates,
                "timestamp": datetime.utcnow().isoformat(),
            })
            
            return updates
            
        except Exception as e:
            print(f"Traffic data update error: {e}")
            db.rollback()
            return []
        finally:
            db.close()
    
    async def update_road_congestion(self):
        """Update road congestion levels based on real-time data"""
        # This would integrate with actual road data
        # For now, we'll use time-based patterns
        time_pattern = self.get_time_based_traffic_pattern()
        weather = await self.fetch_weather_data()
        
        # Determine congestion level
        multiplier = time_pattern["time_multiplier"] * weather["traffic_multiplier"]
        
        if multiplier >= 1.5:
            congestion = "severe"
        elif multiplier >= 1.2:
            congestion = "high"
        elif multiplier >= 0.8:
            congestion = "medium"
        else:
            congestion = "low"
        
        return {
            "congestion": congestion,
            "multiplier": round(multiplier, 2),
            "time_pattern": time_pattern,
            "weather": weather,
        }
    
    async def run_realtime_updates(self):
        """Main loop for real-time data updates"""
        while self.running:
            try:
                # Update traffic data every 15 seconds
                await self.update_traffic_data()
                
                # Update road congestion every 30 seconds
                congestion_data = await self.update_road_congestion()
                await self.broadcast("road_congestion_update", congestion_data)
                
                await asyncio.sleep(15)  # Update every 15 seconds
                
            except Exception as e:
                print(f"Real-time update error: {e}")
                await asyncio.sleep(15)
    
    def start(self):
        """Start the real-time data service"""
        if not self.running:
            self.running = True
            import asyncio
            try:
                loop = asyncio.get_event_loop()
                if loop.is_running():
                    asyncio.create_task(self._async_start())
                else:
                    loop.run_until_complete(self._async_start())
            except RuntimeError:
                # Will be started when app starts
                pass
    
    async def _async_start(self):
        """Async initialization"""
        if HAS_AIOHTTP:
            self.session = aiohttp.ClientSession()
        asyncio.create_task(self.run_realtime_updates())
        print("[OK] Real-time data service started")
    
    async def stop(self):
        """Stop the real-time data service"""
        self.running = False
        if self.session:
            await self.session.close()
            self.session = None
        print("[OK] Real-time data service stopped")

# Global instance
realtime_data_service = RealTimeDataService()
