"""
Vercel Serverless Function Entry Point
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from main import app

# Export the FastAPI app for Vercel
handler = app
