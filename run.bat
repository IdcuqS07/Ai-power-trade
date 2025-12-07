@echo off
echo ==========================================
echo AI Trading Platform - Comprehensive
echo ==========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo Error: Node.js is not installed
    pause
    exit /b 1
)

echo Starting Backend...
cd comprehensive_backend

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install dependencies
echo Installing Python dependencies...
pip install -r requirements.txt >nul 2>&1

REM Start backend in background
echo Backend starting on http://localhost:8000
start /B python main.py

cd ..

REM Start frontend
echo.
echo Starting Frontend...
cd comprehensive_frontend

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo Installing Node.js dependencies...
    npm install >nul 2>&1
)

echo Frontend starting on http://localhost:3000
start /B npm run dev

cd ..

echo.
echo ==========================================
echo Backend running on: http://localhost:8000
echo Frontend running on: http://localhost:3000
echo API Docs: http://localhost:8000/docs
echo ==========================================
echo.
echo Press Ctrl+C to stop all services
echo.

pause
