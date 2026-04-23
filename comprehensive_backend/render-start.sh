#!/bin/bash
# Render Start Script

set -e

echo "🚀 Starting AI Trading Backend..."
uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1
