from fastapi import FastAPI, WebSocket, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import json
from datetime import datetime
import uvicorn
import random
import hashlib
from typing import Dict, List
from pydantic import BaseModel

app = FastAPI(title="Unified AI Trading Platform")

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
    "price_history": [50000 + random.uniform(-1000, 1000) for _ in range(20)]
}

class TradeRequest(BaseModel):
    symbol: str
    force_execute: bool = False

@app.get("/api/dashboard")
async def get_dashboard():
    # Market data
    prices = {}
    symbols = ['BTC', 'ETH', 'BNB', 'SOL']
    
    for symbol in symbols:
        base_price = {'BTC': 50000, 'ETH': 3000, 'BNB': 300, 'SOL': 100}[symbol]
        current_price = base_price + random.uniform(-base_price*0.05, base_price*0.05)
        
        prices[symbol] = {
            "price": round(current_price, 2),
            "change_24h": round(random.uniform(-5, 5), 2),
            "high_24h": round(current_price * 1.03, 2),
            "low_24h": round(current_price * 0.97, 2)
        }
    
    # AI Signal
    current_signal = {
        "signal": random.choice(['BUY', 'SELL', 'HOLD']),
        "confidence": random.uniform(0.6, 0.9),
        "risk_score": random.randint(20, 80),
        "position_size": random.randint(5, 15),
        "price_prediction": {
            "target_price": round(prices['BTC']['price'] * random.uniform(1.02, 1.08), 2)
        },
        "reasoning": "AI analysis based on technical indicators"
    }
    
    # Portfolio
    portfolio = {
        "total_value": trading_data["balance"] + trading_data["pnl"],
        "profit_loss": trading_data["pnl"],
        "profit_loss_pct": (trading_data["pnl"] / trading_data["balance"]) * 100,
        "positions_count": len(trading_data["positions"])
    }
    
    # Performance
    performance = {
        "total_trades": random.randint(50, 200),
        "winning_trades": random.randint(30, 120),
        "losing_trades": random.randint(20, 80),
        "win_rate": random.uniform(55, 75),
        "profit_factor": random.uniform(1.2, 2.5),
        "total_profit": random.uniform(1000, 5000),
        "avg_profit": random.uniform(50, 200),
        "avg_loss": random.uniform(-30, -100)
    }
    
    # Smart Contract Stats
    smart_contract_stats = {
        "total_validations": random.randint(100, 500),
        "validation_pass_rate": random.uniform(85, 95),
        "total_on_chain_records": random.randint(50, 200),
        "total_settlements": random.randint(40, 180),
        "risk_limits": {
            "max_position_size_pct": 10,
            "max_daily_loss_pct": 5.0,
            "min_confidence": 0.7
        }
    }
    
    # Oracle Stats
    oracle_stats = {
        "verification_rate": random.uniform(95, 99)
    }
    
    return {
        "success": True,
        "data": {
            "prices": prices,
            "portfolio": portfolio,
            "current_signal": current_signal,
            "performance": performance,
            "smart_contract": smart_contract_stats,
            "oracle": oracle_stats,
            "primary_symbol": "BTC"
        }
    }

@app.get("/api/predictions/current/{symbol}")
async def get_prediction(symbol: str):
    prediction = {
        "signal": random.choice(['BUY', 'SELL', 'HOLD']),
        "confidence": random.uniform(0.6, 0.9),
        "risk_score": random.randint(20, 80),
        "position_size": random.randint(5, 15)
    }
    
    return {
        "success": True,
        "symbol": symbol,
        "prediction": prediction
    }

@app.post("/api/trades/execute")
async def execute_trade(request: TradeRequest):
    symbol = request.symbol
    base_prices = {'BTC': 50000, 'ETH': 3000, 'BNB': 300, 'SOL': 100}
    current_price = base_prices.get(symbol, 50000) + random.uniform(-1000, 1000)
    
    profit = random.uniform(-300, 500)
    trading_data["pnl"] += profit
    
    trade_result = {
        "symbol": symbol,
        "type": random.choice(['BUY', 'SELL']),
        "quantity": random.uniform(0.001, 0.1),
        "price": current_price,
        "value": current_price * 0.01,
        "profit_loss": profit,
        "timestamp": datetime.now().isoformat(),
        "order_id": f"ORD_{random.randint(100000, 999999)}"
    }
    
    trading_data["positions"].append(trade_result)
    
    return {
        "success": True,
        "trade": trade_result
    }

@app.get("/api/trades/history")
async def get_trade_history(limit: int = 20):
    history = trading_data["positions"][-limit:] if trading_data["positions"] else []
    return {
        "success": True,
        "data": history,
        "count": len(history)
    }

@app.get("/api/smartcontract/records")
async def get_on_chain_records(limit: int = 20):
    records = []
    for i in range(min(limit, 10)):
        records.append({
            "symbol": random.choice(['BTC', 'ETH', 'BNB', 'SOL']),
            "type": random.choice(['BUY', 'SELL']),
            "quantity": round(random.uniform(0.001, 0.1), 6),
            "price": round(random.uniform(45000, 55000), 2),
            "value": round(random.uniform(450, 5500), 2),
            "block_number": random.randint(1000000, 9999999),
            "block_hash": hashlib.sha256(str(random.random()).encode()).hexdigest()[:32]
        })
    
    return {"success": True, "data": records}

@app.get("/api/smartcontract/validations")
async def get_validations(limit: int = 20):
    validations = []
    for i in range(min(limit, 10)):
        is_valid = random.choice([True, True, True, False])
        validations.append({
            "signal": random.choice(['BUY', 'SELL', 'HOLD']),
            "confidence": random.uniform(0.6, 0.9),
            "is_valid": is_valid,
            "validations": [
                {"message": "Risk check", "passed": True},
                {"message": "Position size", "passed": True},
                {"message": "Market conditions", "passed": is_valid}
            ]
        })
    
    return {"success": True, "data": validations}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)