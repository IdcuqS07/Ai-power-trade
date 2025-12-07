#!/bin/bash

echo "=========================================="
echo "AI Trading Platform - Comprehensive"
echo "=========================================="
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Error: Python3 is not installed"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed"
    exit 1
fi

echo "Starting Backend..."
cd comprehensive_backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt > /dev/null 2>&1

# Start backend in background
echo "Backend starting on http://localhost:8000"
python main.py &
BACKEND_PID=$!

cd ..

# Start frontend
echo ""
echo "Starting Frontend..."
cd comprehensive_frontend

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing Node.js dependencies..."
    npm install > /dev/null 2>&1
fi

echo "Frontend starting on http://localhost:3000"
npm run dev &
FRONTEND_PID=$!

cd ..

echo ""
echo "=========================================="
echo "✓ Backend running on: http://localhost:8000"
echo "✓ Frontend running on: http://localhost:3000"
echo "✓ API Docs: http://localhost:8000/docs"
echo "=========================================="
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
