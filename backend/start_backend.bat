@echo off
REM Urban Flow Backend Startup Script (Windows CMD)
echo ========================================
echo   Urban Flow Backend Server Startup
echo ========================================
echo.

REM Check if we're in the backend directory
if not exist "app\main.py" (
    echo Error: Please run this script from the backend directory
    echo Current directory: %CD%
    exit /b 1
)

REM Check if virtual environment exists
if not exist "venv\Scripts\activate.bat" (
    echo Virtual environment not found. Creating...
    python -m venv venv
    if errorlevel 1 (
        echo Error: Failed to create virtual environment
        exit /b 1
    )
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Check if requirements are installed
echo Checking dependencies...
python -c "import uvicorn" >nul 2>&1
if errorlevel 1 (
    echo Installing dependencies...
    pip install -r requirements.txt
    if errorlevel 1 (
        echo Error: Failed to install dependencies
        exit /b 1
    )
)

REM Check if database exists, if not initialize it
if not exist "urbanflow.db" (
    echo Database not found. Initializing...
    python scripts/init_db.py
    if errorlevel 1 (
        echo Warning: Database initialization may have failed
    )
)

echo.
echo Starting FastAPI server...
echo Server will be available at: http://localhost:8000
echo API Documentation: http://localhost:8000/docs
echo Health Check: http://localhost:8000/health
echo.
echo Press CTRL+C to stop the server
echo.

REM Start the server
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

