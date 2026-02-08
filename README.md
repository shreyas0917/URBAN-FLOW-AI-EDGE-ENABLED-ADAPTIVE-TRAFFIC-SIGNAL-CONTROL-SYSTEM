# Urban Flow - Intelligent Traffic Management System

A comprehensive traffic management system designed for Mumbai city with real-time traffic monitoring, signal control, emergency vehicle priority, and AI-powered insights.

## 🎯 Project Overview

Urban Flow is an intelligent traffic management system that provides:
- **Real-time Traffic Monitoring**: Live traffic data with congestion levels
- **Signal Control**: Dynamic traffic signal management
- **Emergency Vehicle Priority**: Clear routes for emergency vehicles
- **Zone-based Access Control**: Operators manage specific zones
- **AI-powered Insights**: Traffic predictions and recommendations
- **Interactive Dashboards**: Modern UI for Super Admins, Operators, and Viewers

## 📋 Prerequisites

Before running the project, ensure you have the following installed:

- **Python 3.11+** ([Download](https://www.python.org/downloads/))
- **Node.js 18+** and npm ([Download](https://nodejs.org/))
- **Git** (for cloning the repository)

## 🚀 Quick Start

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd final_Year_Project
```

### Step 2: Backend Setup

#### Option A: Using Virtual Environment (Recommended)

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
# Windows
python -m venv venv

# Linux/Mac
python3 -m venv venv
```

3. Activate the virtual environment:
```bash
# Windows (PowerShell)
.\venv\Scripts\Activate.ps1

# Windows (Command Prompt)
.\venv\Scripts\activate.bat

# Linux/Mac
source venv/bin/activate
```

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Initialize the database:
```bash
# For Mumbai-specific setup (Recommended)
python scripts/init_db_mumbai.py

# OR for standard setup
python scripts/init_db.py
```

6. Start the backend server:
```bash
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend will be available at:
- **API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **WebSocket**: ws://localhost:8000/ws

#### Option B: Using Batch Script (Windows)

```bash
cd backend
start_backend.bat
```

#### Option C: Using PowerShell Script (Windows)

```bash
cd backend
.\start_backend.ps1
```

### Step 3: Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at:
- **Application**: http://localhost:3000 (or the port shown in terminal)

## 🔐 Default Login Credentials

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| **Super Admin** | admin@urbanflow.gov | Admin@2024 | Full system access |
| **Operator 1** | operator1@urbanflow.gov | Operator@2024 | South Mumbai (400001-400010) |
| **Operator 2** | operator2@urbanflow.gov | Operator@2024 | Central Mumbai (400011-400020) |
| **Operator 3** | operator3@urbanflow.gov | Operator@2024 | Western Suburbs (400050-400059) |
| **Operator 4** | operator4@urbanflow.gov | Operator@2024 | North Mumbai (400060-400069) |
| **Viewer** | viewer@urbanflow.gov | Viewer@2024 | Read-only access |

## 🏗️ Project Structure

```
final_Year_Project/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/v1/endpoints/    # API endpoints
│   │   │   ├── auth.py          # Authentication
│   │   │   ├── signals.py       # Traffic signals
│   │   │   ├── zones.py         # Zone management
│   │   │   ├── operators.py     # Operator management
│   │   │   ├── traffic.py       # Traffic data
│   │   │   ├── emergency.py     # Emergency routes
│   │   │   └── ai_explanation.py # AI insights
│   │   ├── api/v1/websocket.py  # WebSocket handler
│   │   ├── core/                # Core configuration
│   │   ├── db/                  # Database models
│   │   ├── services/            # Background services
│   │   └── main.py              # FastAPI app entry
│   ├── scripts/                 # Database scripts
│   │   ├── init_db_mumbai.py    # Mumbai setup
│   │   └── init_db.py           # Standard setup
│   ├── requirements.txt         # Python dependencies
│   └── urbanflow.db             # SQLite database
│
├── frontend/                # React + TypeScript frontend
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── admin/           # Super Admin components
│   │   │   ├── operator/        # Operator components
│   │   │   └── ...              # Shared components
│   │   ├── pages/               # Page components
│   │   │   ├── Login.tsx
│   │   │   ├── SuperAdminDashboard.tsx
│   │   │   ├── OperatorDashboard.tsx
│   │   │   └── ViewerDashboard.tsx
│   │   ├── data/                # Static data
│   │   │   ├── mumbai_locations.ts
│   │   │   └── mumbai_roads.ts
│   │   ├── lib/                 # Utilities
│   │   │   ├── api.ts           # API client
│   │   │   └── websocket.ts     # WebSocket client
│   │   └── store/               # State management
│   ├── package.json             # Node dependencies
│   └── vite.config.ts           # Vite configuration
│
├── MUMBAI_SETUP.md         # Mumbai configuration details
├── PROJECT_COMPLETE.md     # Project completion summary
└── README.md               # This file
```

## 🌟 Key Features

### 1. **Real-time Traffic Monitoring**
- Live congestion levels updated every 10 seconds
- Traffic flow visualization over time
- Zone-specific traffic statistics
- Historical traffic data analysis

### 2. **Traffic Signal Control**
- Dynamic signal timing adjustment
- Phase control (Red, Yellow, Green)
- Signal status monitoring
- Zone-based signal management

### 3. **Emergency Vehicle Priority**
- Create emergency routes with location dropdowns
- Automatic routing to nearest government hospital
- Signal clearing along emergency routes
- Real-time alerts and notifications

### 4. **AI-powered Insights**
- Traffic predictions based on historical data
- Peak hours identification
- Comparative analysis (current vs previous periods)
- Pincode/Area-based recommendations

### 5. **Zone-based Access Control**
- Operators see only their assigned zone
- Pincode-based filtering
- Mumbai area dropdown selection
- Super Admin has full city access

### 6. **Interactive Dashboards**
- **Super Admin Dashboard**: Full system overview, zone/operator/signal management
- **Operator Dashboard**: Zone-specific control, signal management, emergency routes
- **Viewer Dashboard**: Public traffic insights, congestion levels, predictions

## 🗺️ Mumbai Zones & Pincodes

| Zone | Pincodes | Areas | Operator |
|------|----------|-------|----------|
| **South Mumbai** | 400001-400010 | Colaba, Fort, Marine Drive, Nariman Point | operator1@urbanflow.gov |
| **Central Mumbai** | 400011-400020 | Dadar, Parel, Worli, Lower Parel | operator2@urbanflow.gov |
| **Western Suburbs** | 400050-400059 | Andheri, Bandra, Juhu, Santacruz | operator3@urbanflow.gov |
| **North Mumbai** | 400060-400069 | Borivali, Kandivali, Malad, Goregaon | operator4@urbanflow.gov |

## 🛠️ Development

### Backend Development

The backend uses FastAPI with SQLite database. Key files:
- `backend/app/main.py` - Main application entry point
- `backend/app/core/config.py` - Configuration settings
- `backend/app/db/models.py` - Database models

### Frontend Development

The frontend uses React + TypeScript + Vite. Key files:
- `frontend/src/App.tsx` - Main app component
- `frontend/src/lib/api.ts` - API client configuration
- `frontend/src/lib/websocket.ts` - WebSocket client

### Database Management

To reset and reinitialize the database:
```bash
cd backend
python scripts/reset_and_init_mumbai.py
```

## 📡 API Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `GET /api/v1/auth/me` - Get current user

### Traffic
- `GET /api/v1/traffic/stats` - Get traffic statistics
- `GET /api/v1/traffic/history` - Get traffic history
- `GET /api/v1/traffic/zones` - Get zone traffic data

### Signals
- `GET /api/v1/signals` - Get all signals
- `GET /api/v1/signals/{id}` - Get signal by ID
- `PUT /api/v1/signals/{id}` - Update signal
- `PUT /api/v1/signals/{id}/timing` - Update signal timing

### Emergency
- `POST /api/v1/emergency/routes` - Create emergency route
- `GET /api/v1/emergency/routes/active` - Get active routes
- `DELETE /api/v1/emergency/routes/{id}` - Deactivate route

Full API documentation available at: http://localhost:8000/docs

## 🔧 Troubleshooting

### Backend Issues

**Problem**: Port 8000 already in use
```bash
# Change port in backend/app/main.py or use:
python -m uvicorn app.main:app --reload --port 8001
```

**Problem**: Database not found
```bash
cd backend
python scripts/init_db_mumbai.py
```

**Problem**: Module not found errors
```bash
# Ensure virtual environment is activated
pip install -r requirements.txt
```

### Frontend Issues

**Problem**: Port 3000 already in use
```bash
# Vite will automatically use the next available port
# Or specify a port:
npm run dev -- --port 3001
```

**Problem**: Dependencies not installed
```bash
cd frontend
npm install
```

**Problem**: WebSocket connection failed
- Ensure backend is running on port 8000
- Check CORS settings in `backend/app/main.py`
- Verify WebSocket endpoint: `ws://localhost:8000/ws`

## 📦 Technology Stack

### Backend
- **FastAPI** - Modern Python web framework
- **SQLite** - Lightweight database
- **WebSocket** - Real-time communication
- **Pydantic** - Data validation
- **JWT** - Authentication tokens

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **Framer Motion** - Animations
- **Recharts** - Data visualization
- **Zustand** - State management

## 📝 Notes

- The database file (`urbanflow.db`) is created automatically on first run
- All passwords are hashed using bcrypt
- JWT tokens expire after 24 hours
- WebSocket connections auto-reconnect on disconnect
- Traffic simulation runs automatically in the background

## 🎓 Academic Project

This project is designed for final year academic submission with:
- ✅ Complete documentation
- ✅ Production-ready code structure
- ✅ Real-world Mumbai city data
- ✅ Industry-standard practices
- ✅ Comprehensive feature set

## 📄 License

This project is for academic purposes.

## 👥 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review API documentation at `/docs`
3. Check console logs for error messages

---
