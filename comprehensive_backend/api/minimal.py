"""
Minimal Vercel Backend - API Only
Tanpa ML dan Blockchain (terlalu besar untuk Vercel)
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os

app = FastAPI(title="AI Trading API - Minimal")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "status": "online",
        "message": "AI Trading Backend - Minimal Version",
        "version": "1.0-minimal"
    }

@app.get("/api/status")
async def status():
    return {
        "status": "healthy",
        "binance_mode": os.getenv("BINANCE_MODE", "testnet"),
        "features": ["api", "trading"]
    }

# Export for Vercel
handler = app
