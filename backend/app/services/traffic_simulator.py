"""Traffic simulation service for generating realistic traffic data"""
import asyncio
import random
from datetime import datetime
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.db import models

class TrafficSimulator:
    def __init__(self):
        self.running = False
        self.websocket_connections = []
    
    def add_websocket(self, ws):
        """Add a WebSocket connection to broadcast updates"""
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
    
    async def simulate_traffic(self):
        """Simulate traffic updates"""
        db = SessionLocal()
        try:
            while self.running:
                # Get all active signals
                signals = db.query(models.Signal).filter(
                    models.Signal.status == models.SignalStatus.ACTIVE
                ).all()
                
                for signal in signals:
                    # Simulate traffic density changes
                    vehicle_count = random.randint(20, 80)
                    queue_length = random.randint(5, 40)
                    density = random.uniform(0.2, 0.9)
                    
                    # Create traffic log
                    traffic_log = models.TrafficLog(
                        signal_id=signal.id,
                        vehicle_count=vehicle_count,
                        pedestrian_count=random.randint(0, 15),
                        queue_length=queue_length,
                        density=density,
                        traffic_density=density,  # Also populate legacy column
                    )
                    db.add(traffic_log)
                    
                    # Update signal phase based on traffic
                    if queue_length > 30 and signal.current_phase == models.SignalPhase.NORTH:
                        # High queue, might need phase extension
                        pass
                
                db.commit()
                
                # Broadcast updates
                await self.broadcast("traffic_update", {
                    "signals_updated": len(signals),
                    "timestamp": datetime.utcnow().isoformat(),
                })
                
                await asyncio.sleep(10)  # Update every 10 seconds
                
        except Exception as e:
            print(f"Traffic simulation error: {e}")
        finally:
            db.close()
    
    async def simulate_signal_updates(self):
        """Simulate signal phase changes"""
        db = SessionLocal()
        try:
            while self.running:
                signals = db.query(models.Signal).filter(
                    models.Signal.status == models.SignalStatus.ACTIVE
                ).all()
                
                for signal in signals:
                    # Randomly change phase
                    if random.random() < 0.1:  # 10% chance
                        phases = list(models.SignalPhase)
                        current_index = phases.index(signal.current_phase)
                        next_index = (current_index + 1) % len(phases)
                        signal.current_phase = phases[next_index]
                        
                        db.commit()
                        
                        await self.broadcast("signal_update", {
                            "signal_id": signal.id,
                            "signal_id_display": signal.signal_id,
                            "phase": signal.current_phase.value,
                            "status": signal.status.value,
                        })
                
                await asyncio.sleep(30)  # Check every 30 seconds
                
        except Exception as e:
            print(f"Signal simulation error: {e}")
        finally:
            db.close()
    
    def start(self):
        """Start simulation"""
        if not self.running:
            self.running = True
            # Note: Tasks will be created by the event loop
            import asyncio
            try:
                loop = asyncio.get_event_loop()
                if loop.is_running():
                    asyncio.create_task(self.simulate_traffic())
                    asyncio.create_task(self.simulate_signal_updates())
                else:
                    loop.run_until_complete(asyncio.gather(
                        self.simulate_traffic(),
                        self.simulate_signal_updates()
                    ))
            except RuntimeError:
                # Event loop not running, will start when app starts
                pass
    
    def stop(self):
        """Stop simulation"""
        self.running = False

# Global simulator instance
traffic_simulator = TrafficSimulator()

