from fastapi import FastAPI, WebSocket, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import json
from datetime import datetime
import uvicorn
import random

app = FastAPI(title="AI Trading Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global state
trading_data = {
    "positions": [],
    "pnl": 0.0,
    "balance": 10000.0,
    "signals": [],
    "price_history": [50000 + random.uniform(-1000, 1000) for _ in range(20)]
}

@app.get("/api/status")
async def get_status():
    return {
        "status": "active",
        "timestamp": datetime.now().isoformat(),
        "balance": trading_data["balance"],
        "pnl": trading_data["pnl"]
    }

@app.get("/api/market-data")
async def get_market_data():
    new_price = trading_data["price_history"][-1] + random.uniform(-200, 200)
    trading_data["price_history"].append(new_price)
    if len(trading_data["price_history"]) > 100:
        trading_data["price_history"].pop(0)
    
    return {
        "symbol": "BTCUSDT",
        "price": round(new_price, 2),
        "timestamp": datetime.now().isoformat()
    }

@app.post("/api/trading-cycle")
async def run_trading_cycle():
    new_price = trading_data["price_history"][-1] + random.uniform(-200, 200)
    trading_data["price_history"].append(new_price)
    
    signal = random.choice(["BUY", "SELL"])
    confidence = random.uniform(70, 95)
    profit = random.uniform(-300, 500)
    
    trading_data["pnl"] += profit
    
    return {
        "success": True,
        "market_data": {
            "symbol": "BTCUSDT",
            "price": round(new_price, 2),
            "timestamp": datetime.now().isoformat()
        },
        "ai_signal": {
            "signal": signal,
            "confidence": round(confidence, 1),
            "price": round(new_price, 2)
        },
        "trade_result": {
            "profit": round(profit, 2),
            "order_id": f"order_{random.randint(1000, 9999)}"
        }
    }

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            new_price = trading_data["price_history"][-1] + random.uniform(-50, 50)
            trading_data["price_history"].append(new_price)
            if len(trading_data["price_history"]) > 100:
                trading_data["price_history"].pop(0)
            
            data = {
                "type": "market_data",
                "price": round(new_price, 2),
                "timestamp": datetime.now().isoformat(),
                "pnl": round(trading_data["pnl"], 2),
                "balance": trading_data["balance"]
            }
            await websocket.send_text(json.dumps(data))
            await asyncio.sleep(2)
    except:
        pass

if __name__ == "__main__":
    print("🚀 Starting AI Trading Backend...")
    print("🔗 Backend API: http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)