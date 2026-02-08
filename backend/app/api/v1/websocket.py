from fastapi import WebSocket, WebSocketDisconnect
from app.core.security import decode_access_token
from app.db.database import SessionLocal
from app.db import models
from app.services.traffic_simulator import traffic_simulator
from app.services.realtime_data_service import realtime_data_service

async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time updates"""
    # Get token from query params
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=1008, reason="No token provided")
        return
    
    # Verify token
    payload = decode_access_token(token)
    if not payload:
        await websocket.close(code=1008, reason="Invalid token")
        return
    
    # Get user
    db = SessionLocal()
    try:
        user_id = payload.get("sub")
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            await websocket.close(code=1008, reason="User not found")
            return
    finally:
        db.close()
    
    # Accept connection after authentication
    await websocket.accept()
    
    # Add to simulator and real-time service for broadcasting
    traffic_simulator.add_websocket(websocket)
    realtime_data_service.add_websocket(websocket)
    
    try:
        # Send welcome message
        await websocket.send_json({
            "type": "connected",
            "data": {"message": "Connected to Urban Flow Traffic Control"},
        })
        
        while True:
            # Keep connection alive and handle messages
            try:
                data = await websocket.receive_text()
                # Echo back or process message
                await websocket.send_json({"type": "pong", "data": data})
            except WebSocketDisconnect:
                break
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        traffic_simulator.remove_websocket(websocket)
        realtime_data_service.remove_websocket(websocket)
