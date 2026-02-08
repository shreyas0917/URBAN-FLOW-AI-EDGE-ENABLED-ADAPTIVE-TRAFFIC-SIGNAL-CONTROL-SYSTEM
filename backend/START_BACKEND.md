# How to Run the Backend Server

## Quick Start (Windows PowerShell)

### Option 1: Using the startup script
```powershell
.\start_backend.ps1
```

### Option 2: Manual steps

1. **Navigate to backend directory:**
   ```powershell
   cd backend
   ```

2. **Activate virtual environment:**
   ```powershell
   .\venv\Scripts\Activate.ps1
   ```

3. **Install dependencies (if not already installed):**
   ```powershell
   pip install -r requirements.txt
   ```

4. **Initialize database (first time only):**
   ```powershell
   python scripts/init_db.py
   ```

5. **Start the server:**
   ```powershell
   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

## Quick Start (Windows CMD)

1. **Navigate to backend directory:**
   ```cmd
   cd backend
   ```

2. **Activate virtual environment:**
   ```cmd
   venv\Scripts\activate.bat
   ```

3. **Start the server:**
   ```cmd
   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

## Quick Start (Linux/Mac)

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Activate virtual environment:**
   ```bash
   source venv/bin/activate
   ```

3. **Start the server:**
   ```bash
   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

## Verify Backend is Running

Once started, you should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
[OK] Database tables ready
INFO:     Application startup complete.
```

### Test the backend:
- Open browser: http://localhost:8000
- Health check: http://localhost:8000/health
- API docs: http://localhost:8000/docs

## Troubleshooting

### Port 8000 already in use
```powershell
# Find process using port 8000
netstat -ano | findstr :8000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Virtual environment not found
```powershell
# Create virtual environment
python -m venv venv

# Activate it
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt
```

### Database not initialized
```powershell
python scripts/init_db.py
```

## Default Credentials

After initializing the database:
- **Super Admin:** admin@urbanflow.gov / Admin@2024
- **Operator:** operator1@urbanflow.gov / Operator@2024
- **Viewer:** viewer@urbanflow.gov / Viewer@2024

