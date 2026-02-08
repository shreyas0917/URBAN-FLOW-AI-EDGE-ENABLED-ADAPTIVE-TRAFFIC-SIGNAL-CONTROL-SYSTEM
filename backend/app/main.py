from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.api.v1.api import api_router
from app.api.v1.websocket import websocket_endpoint
from app.db.database import engine
from app.db import models
from app.services.traffic_simulator import traffic_simulator
from app.services.realtime_data_service import realtime_data_service

# Create database tables
try:
    models.Base.metadata.create_all(bind=engine)
    print("[OK] Database tables ready")
except Exception as e:
    print(f"Warning: Could not create database tables: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("[OK] Starting traffic simulator...")
    import asyncio
    traffic_simulator.running = True
    asyncio.create_task(traffic_simulator.simulate_traffic())
    asyncio.create_task(traffic_simulator.simulate_signal_updates())
    
    print("[OK] Starting real-time data service...")
    realtime_data_service.start()
    
    yield
    
    # Shutdown
    print("[OK] Stopping real-time data service...")
    import asyncio
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            asyncio.create_task(realtime_data_service.stop())
        else:
            loop.run_until_complete(realtime_data_service.stop())
    except:
        pass
    print("[OK] Stopping traffic simulator...")
    traffic_simulator.stop()

app = FastAPI(
    title="Urban Flow API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add CORS headers manually for health check
@app.middleware("http")
async def add_cors_header(request, call_next):
    response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response

# Include routers
app.include_router(api_router, prefix="/api/v1")

# WebSocket endpoint
@app.websocket("/ws")
async def websocket_route(websocket: WebSocket):
    await websocket_endpoint(websocket)

@app.get("/")
async def root():
    return {"message": "Urban Flow API", "status": "running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.options("/health")
async def health_options():
    return {"status": "ok"}

