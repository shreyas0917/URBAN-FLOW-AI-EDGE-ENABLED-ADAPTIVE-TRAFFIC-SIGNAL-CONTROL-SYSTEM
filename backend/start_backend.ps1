# Urban Flow Backend Startup Script
# This script activates the virtual environment and starts the FastAPI server

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Urban Flow Backend Server Startup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the backend directory
if (-not (Test-Path "app\main.py")) {
    Write-Host "Error: Please run this script from the backend directory" -ForegroundColor Red
    Write-Host "Current directory: $(Get-Location)" -ForegroundColor Yellow
    exit 1
}

# Check if virtual environment exists
if (-not (Test-Path "venv\Scripts\Activate.ps1")) {
    Write-Host "Virtual environment not found. Creating..." -ForegroundColor Yellow
    python -m venv venv
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Failed to create virtual environment" -ForegroundColor Red
        exit 1
    }
}

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Green
& ".\venv\Scripts\Activate.ps1"

# Check if requirements are installed
Write-Host "Checking dependencies..." -ForegroundColor Green
$uvicornInstalled = python -c "import uvicorn" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    pip install -r requirements.txt
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
}

# Check if database exists, if not initialize it
if (-not (Test-Path "urbanflow.db")) {
    Write-Host "Database not found. Initializing..." -ForegroundColor Yellow
    python scripts/init_db.py
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Warning: Database initialization may have failed" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Starting FastAPI server..." -ForegroundColor Green
Write-Host "Server will be available at: http://localhost:8000" -ForegroundColor Cyan
Write-Host "API Documentation: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "Health Check: http://localhost:8000/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press CTRL+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start the server
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

