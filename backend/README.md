# Urban Flow Backend API

## Quick Start

```bash
# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Initialize database
python scripts/init_db.py

# Start server
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/logout` - Logout
- `GET /api/v1/auth/me` - Get current user

### Signals
- `GET /api/v1/signals` - Get all signals (filter by zone_id)
- `GET /api/v1/signals/{id}` - Get signal by ID
- `PUT /api/v1/signals/{id}` - Update signal
- `PUT /api/v1/signals/{id}/timing` - Update signal timing

### Zones
- `GET /api/v1/zones` - Get all zones
- `POST /api/v1/zones` - Create zone

### Operators
- `GET /api/v1/operators` - Get all operators
- `POST /api/v1/operators` - Create operator
- `PUT /api/v1/operators/{id}/assign-zone` - Assign zone to operator

### Traffic
- `GET /api/v1/traffic/stats` - Get traffic statistics
- `GET /api/v1/traffic/history` - Get traffic history
- `GET /api/v1/traffic/zones` - Get zones with traffic data

### Emergency
- `POST /api/v1/emergency/routes` - Create emergency route
- `GET /api/v1/emergency/routes/active` - Get active routes
- `PUT /api/v1/emergency/routes/{id}/deactivate` - Deactivate route

### AI Explanation
- `GET /api/v1/ai-explanation/{signal_id}/latest` - Get latest AI explanation
- `GET /api/v1/ai-explanation/{signal_id}/history` - Get explanation history

### WebSocket
- `WS /ws?token={jwt_token}` - Real-time updates

## Default Credentials

- **Super Admin:** admin@urbanflow.gov / Admin@2024
- **Operator:** operator1@urbanflow.gov / Operator@2024
- **Viewer:** viewer@urbanflow.gov / Viewer@2024

## Features

- ✅ JWT Authentication
- ✅ Role-Based Access Control (RBAC)
- ✅ Real-time WebSocket updates
- ✅ Traffic simulation
- ✅ Signal management
- ✅ Zone management
- ✅ Emergency route management
- ✅ AI explanation system



