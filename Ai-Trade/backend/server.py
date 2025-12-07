from fastapi import FastAPI, APIRouter, HTTPException, BackgroundTasks
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Dict, Optional
import uuid
from datetime import datetime, timezone
import asyncio

# Import our AI Trading modules
from market_data import MarketDataGenerator
from feature_engineering import FeatureEngineer
from ai_predictor import AIPredictor
from trading_engine import TradingEngine
from smart_contract import SmartContract
from oracle_layer import OracleLayer


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="AI Trading SmartContract 2.0 Platform")

# Create API router
api_router = APIRouter(prefix="/api")

# Initialize AI Trading System
market_data_gen = MarketDataGenerator()
feature_engineer = FeatureEngineer()
ai_predictor = AIPredictor()
trading_engine = TradingEngine()
smart_contract = SmartContract()
oracle = OracleLayer()

# Symbols to track
SYMBOLS = ['BTC', 'ETH', 'BNB', 'SOL']
CURRENT_SYMBOL = 'BTC'  # Primary trading symbol

# Real-time data cache
market_cache = {}


# ============ API Models ============

class TradeRequest(BaseModel):
    symbol: str
    force_execute: bool = False


class RiskLimitsUpdate(BaseModel):
    max_position_size_pct: Optional[int] = None
    max_daily_loss_pct: Optional[float] = None
    min_confidence: Optional[float] = None


# ============ Market Data Endpoints ============

@api_router.get("/")
async def root():
    return {
        "message": "AI Trading SmartContract 2.0 Platform API",
        "version": "2.0",
        "status": "operational"
    }


@api_router.get("/market/prices")
async def get_market_prices():
    """Get current market prices for all symbols"""
    prices = {}
    for symbol in SYMBOLS:
        price_data = market_data_gen.generate_price_tick(symbol)
        if price_data:
            prices[symbol] = price_data
            market_cache[f"{symbol}_price"] = price_data
    
    return {
        "success": True,
        "data": prices,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@api_router.get("/market/prices/{symbol}")
async def get_symbol_price(symbol: str):
    """Get current price for specific symbol"""
    if symbol not in SYMBOLS:
        raise HTTPException(status_code=404, detail="Symbol not found")
    
    price_data = market_data_gen.generate_price_tick(symbol)
    if not price_data:
        raise HTTPException(status_code=500, detail="Failed to generate price data")
    
    market_cache[f"{symbol}_price"] = price_data
    
    return {
        "success": True,
        "data": price_data
    }


@api_router.get("/market/orderbook/{symbol}")
async def get_orderbook(symbol: str):
    """Get orderbook for symbol"""
    if symbol not in SYMBOLS:
        raise HTTPException(status_code=404, detail="Symbol not found")
    
    orderbook = market_data_gen.generate_orderbook(symbol)
    
    return {
        "success": True,
        "data": orderbook
    }


@api_router.get("/market/historical/{symbol}")
async def get_historical_data(symbol: str, periods: int = 100):
    """Get historical OHLCV data"""
    if symbol not in SYMBOLS:
        raise HTTPException(status_code=404, detail="Symbol not found")
    
    historical = market_data_gen.generate_historical_data(symbol, periods)
    
    return {
        "success": True,
        "data": historical,
        "periods": len(historical)
    }


# ============ AI Prediction Endpoints ============

@api_router.get("/predictions/current/{symbol}")
async def get_current_prediction(symbol: str):
    """Get current AI prediction for symbol"""
    if symbol not in SYMBOLS:
        raise HTTPException(status_code=404, detail="Symbol not found")
    
    # Get historical data for feature engineering
    historical = market_data_gen.generate_historical_data(symbol, 100)
    
    # Calculate features
    df = feature_engineer.calculate_indicators(historical)
    features = feature_engineer.get_latest_features(df)
    
    # Generate AI signal
    signal = ai_predictor.generate_signal(features)
    
    # Add support/resistance levels
    levels = feature_engineer.calculate_support_resistance(df)
    
    return {
        "success": True,
        "symbol": symbol,
        "prediction": signal,
        "features": features,
        "levels": levels
    }


@api_router.get("/signals/latest")
async def get_latest_signals():
    """Get latest trading signals for all symbols"""
    signals = {}
    
    for symbol in SYMBOLS:
        historical = market_data_gen.generate_historical_data(symbol, 100)
        df = feature_engineer.calculate_indicators(historical)
        features = feature_engineer.get_latest_features(df)
        signal = ai_predictor.generate_signal(features)
        
        signals[symbol] = {
            "signal": signal['signal'],
            "confidence": signal['confidence'],
            "risk_score": signal['risk_score'],
            "position_size": signal['position_size']
        }
    
    return {
        "success": True,
        "data": signals,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


# ============ Trading Endpoints ============

@api_router.get("/portfolio")
async def get_portfolio():
    """Get current portfolio status"""
    # Update with current prices
    current_prices = {}
    for symbol in SYMBOLS:
        price_data = market_data_gen.generate_price_tick(symbol)
        if price_data:
            current_prices[symbol] = price_data['price']
    
    portfolio = trading_engine.get_portfolio(current_prices)
    
    return {
        "success": True,
        "data": portfolio
    }


@api_router.post("/trades/execute")
async def execute_trade(request: TradeRequest):
    """Execute a trade based on AI signal"""
    symbol = request.symbol
    
    if symbol not in SYMBOLS:
        raise HTTPException(status_code=404, detail="Symbol not found")
    
    # Get current price
    price_data = market_data_gen.generate_price_tick(symbol)
    current_price = price_data['price']
    
    # Get AI signal
    historical = market_data_gen.generate_historical_data(symbol, 100)
    df = feature_engineer.calculate_indicators(historical)
    features = feature_engineer.get_latest_features(df)
    signal = ai_predictor.generate_signal(features)
    
    # Get portfolio for validation
    portfolio = trading_engine.get_portfolio({symbol: current_price})
    
    # Oracle verification
    verification = oracle.verify_and_transmit(signal, price_data)
    
    if not verification['is_verified'] and not request.force_execute:
        return {
            "success": False,
            "message": "Signal failed oracle verification",
            "verification": verification
        }
    
    # Smart contract validation
    validation = smart_contract.validate_decision(signal, portfolio)
    
    if not validation['is_valid'] and not request.force_execute:
        return {
            "success": False,
            "message": "Trade failed smart contract validation",
            "validation": validation
        }
    
    # Execute trade
    result = trading_engine.execute_trade(signal, symbol, current_price)
    
    if result['success']:
        # Record on-chain
        on_chain_record = smart_contract.record_trade(result['trade'])
        
        # Settle if it's a sell trade
        if result['trade']['type'] == 'SELL':
            settlement = smart_contract.settle_trade(result['trade'], portfolio)
        else:
            settlement = None
        
        return {
            "success": True,
            "trade": result['trade'],
            "validation": validation,
            "on_chain_record": on_chain_record,
            "settlement": settlement
        }
    else:
        return {
            "success": False,
            "message": result['reason']
        }


@api_router.get("/trades/history")
async def get_trade_history(limit: int = 50):
    """Get trade history"""
    history = trading_engine.get_trade_history(limit)
    
    return {
        "success": True,
        "data": history,
        "count": len(history)
    }


@api_router.get("/trades/performance")
async def get_performance():
    """Get trading performance metrics"""
    metrics = trading_engine.get_performance_metrics()
    
    return {
        "success": True,
        "data": metrics
    }


# ============ Smart Contract Endpoints ============

@api_router.get("/smartcontract/records")
async def get_on_chain_records(limit: int = 50):
    """Get on-chain trading records"""
    records = smart_contract.get_on_chain_records(limit)
    
    return {
        "success": True,
        "data": records,
        "count": len(records)
    }


@api_router.get("/smartcontract/validations")
async def get_validations(limit: int = 50):
    """Get validation history"""
    validations = smart_contract.get_validation_history(limit)
    
    return {
        "success": True,
        "data": validations,
        "count": len(validations)
    }


@api_router.get("/smartcontract/settlements")
async def get_settlements(limit: int = 50):
    """Get settlement history"""
    settlements = smart_contract.get_settlement_history(limit)
    
    return {
        "success": True,
        "data": settlements,
        "count": len(settlements)
    }


@api_router.get("/smartcontract/risk-limits")
async def get_risk_limits():
    """Get current risk limits"""
    limits = smart_contract.get_risk_limits()
    
    return {
        "success": True,
        "data": limits
    }


@api_router.post("/smartcontract/risk-limits")
async def update_risk_limits(update: RiskLimitsUpdate):
    """Update risk limits (governance)"""
    new_limits = {k: v for k, v in update.dict().items() if v is not None}
    
    if not new_limits:
        raise HTTPException(status_code=400, detail="No valid limits provided")
    
    result = smart_contract.update_risk_limits(new_limits)
    
    return {
        "success": True,
        "data": result
    }


@api_router.get("/smartcontract/verify-chain")
async def verify_blockchain():
    """Verify blockchain integrity"""
    result = smart_contract.verify_chain_integrity()
    
    return {
        "success": True,
        "data": result
    }


@api_router.get("/smartcontract/stats")
async def get_contract_stats():
    """Get smart contract statistics"""
    stats = smart_contract.get_contract_stats()
    
    return {
        "success": True,
        "data": stats
    }


# ============ Oracle Endpoints ============

@api_router.get("/oracle/verifications")
async def get_oracle_verifications(limit: int = 50):
    """Get oracle verification history"""
    verifications = oracle.get_verification_history(limit)
    
    return {
        "success": True,
        "data": verifications,
        "count": len(verifications)
    }


@api_router.get("/oracle/stats")
async def get_oracle_stats():
    """Get oracle statistics"""
    stats = oracle.get_verification_stats()
    
    return {
        "success": True,
        "data": stats
    }


# ============ Analytics Endpoints ============

@api_router.get("/analytics/dashboard")
async def get_dashboard_data():
    """Get complete dashboard data"""
    # Current prices
    prices = {}
    for symbol in SYMBOLS:
        price_data = market_data_gen.generate_price_tick(symbol)
        if price_data:
            prices[symbol] = price_data
    
    # Portfolio
    current_prices_map = {s: p['price'] for s, p in prices.items()}
    portfolio = trading_engine.get_portfolio(current_prices_map)
    
    # Current prediction for primary symbol
    historical = market_data_gen.generate_historical_data(CURRENT_SYMBOL, 100)
    df = feature_engineer.calculate_indicators(historical)
    features = feature_engineer.get_latest_features(df)
    signal = ai_predictor.generate_signal(features)
    
    # Performance metrics
    performance = trading_engine.get_performance_metrics()
    
    # Smart contract stats
    contract_stats = smart_contract.get_contract_stats()
    
    # Oracle stats
    oracle_stats = oracle.get_verification_stats()
    
    return {
        "success": True,
        "data": {
            "prices": prices,
            "portfolio": portfolio,
            "current_signal": signal,
            "performance": performance,
            "smart_contract": contract_stats,
            "oracle": oracle_stats,
            "primary_symbol": CURRENT_SYMBOL
        }
    }


@api_router.get("/analytics/backtest/{symbol}")
async def get_backtest_results(symbol: str):
    """Get backtesting results (simulated)"""
    if symbol not in SYMBOLS:
        raise HTTPException(status_code=404, detail="Symbol not found")
    
    # Generate simulated backtest results
    import random
    
    total_trades = 100
    win_rate = random.uniform(55, 75)
    winning_trades = int(total_trades * win_rate / 100)
    
    results = {
        "symbol": symbol,
        "period": "30 days",
        "total_trades": total_trades,
        "winning_trades": winning_trades,
        "losing_trades": total_trades - winning_trades,
        "win_rate": round(win_rate, 2),
        "total_return": round(random.uniform(5, 25), 2),
        "sharpe_ratio": round(random.uniform(1.2, 2.5), 2),
        "max_drawdown": round(random.uniform(-8, -3), 2),
        "avg_trade_duration": "4.2 hours",
        "profit_factor": round(random.uniform(1.5, 2.8), 2)
    }
    
    return {
        "success": True,
        "data": results
    }


# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
