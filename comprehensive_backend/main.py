"""
AI Trading Platform - Comprehensive Backend
Menggabungkan semua fitur: AI Prediction, Smart Contract, Oracle, Trading Engine
Integrated with WEEX Exchange Live Data
"""
from fastapi import FastAPI, WebSocket, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Optional
import asyncio
import json
from datetime import datetime
import uvicorn
import random
import hashlib
import numpy as np
import logging
import time

# Import WEEX API, Binance API, Binance Trading and Backtesting
from weex_api import WeexAPI
from binance_api import binance_api
from binance_trading import binance_trading
from backtesting import BacktestEngine
from blockchain_service import blockchain_service
from settlement_service import settlement_service

# Import Database and Auth
from database import init_db
from auth_routes import router as auth_router
from user_routes import router as user_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="AI Trading Platform - Comprehensive",
    description="Platform trading AI dengan Smart Contract, Oracle, dan Risk Management",
    version="3.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    init_db()
    logger.info("✓ Database initialized")

# Include auth and user routes
app.include_router(auth_router)
app.include_router(user_router)

# ============ Initialize APIs ============
# Use Binance as primary and only data source
USE_BINANCE = True
USE_LIVE_DATA = True

logger.info("✓ Using Binance API for all market data")

# Keep WEEX API for backward compatibility but don't use it
weex_api = WeexAPI()

# ============ Global State ============
trading_state = {
    "balance": 10000.0,
    "pnl": 0.0,
    "positions": [],
    "price_history": {
        "BTC": [], "ETH": [], "BNB": [], "SOL": [], "XRP": [], "ADA": [], "MATIC": [], "LINK": []
    },
    "trades_today": 0,
    "daily_pnl": 0.0,
    "use_live_data": USE_LIVE_DATA
}

# ============ User Profile & Wallet State ============
user_profile = {
    "user_id": "USER_001",
    "username": "AI Trader",
    "email": "trader@aitrade.com",
    "created_at": datetime.now().isoformat(),
    "risk_tolerance": "moderate",  # conservative, moderate, aggressive
    "trading_strategy": "ai_multi_indicator",
    "preferences": {
        "auto_trade": False,
        "notifications": True,
        "max_daily_trades": 50
    },
    "stats": {
        "total_trades": 0,
        "total_profit": 0.0,
        "best_trade": 0.0,
        "win_rate": 0.0,
        "days_active": 1
    }
}

wallet_state = {
    "wallet_id": "WALLET_001",
    "balances": {
        "USDT": 10000.0,
        "BTC": 0.0, "ETH": 0.0, "BNB": 0.0, "SOL": 0.0, "XRP": 0.0, "ADA": 0.0, "MATIC": 0.0, "LINK": 0.0
    },
    "locked_balances": {
        "USDT": 0.0,
        "BTC": 0.0,
        "ETH": 0.0,
        "BNB": 0.0,
        "SOL": 0.0
    },
    "transaction_history": [],
    "total_deposited": 10000.0,
    "total_withdrawn": 0.0,
    "created_at": datetime.now().isoformat()
}

# Initialize price history
def initialize_price_history():
    """Initialize price history from Binance"""
    # Trading Pairs - Top 8 coins (Best Balance)
    symbols = ["BTC", "ETH", "BNB", "SOL", "XRP", "ADA", "MATIC", "LINK"]
    
    for symbol in symbols:
        # Get historical data from Binance
        pair = f"{symbol}/USDT"
        klines = binance_api.get_klines(pair, interval='1h', limit=50)
        if klines:
            history = [k['close'] for k in klines]
            trading_state["price_history"][symbol] = history
            logger.info(f"✓ Loaded {len(history)} price points for {symbol} from Binance")
        else:
            # Fallback to simulated only if Binance fails
            trading_state["price_history"][symbol] = _generate_simulated_history(symbol)
            logger.warning(f"⚠ Using simulated data for {symbol}")
    
def _generate_simulated_history(symbol: str) -> List[float]:
    """Generate simulated price history"""
    base_prices = {"BTC": 50000, "ETH": 3000, "BNB": 300, "SOL": 100}
    base = base_prices.get(symbol, 1000)
    return [base + random.uniform(-base * 0.02, base * 0.02) for _ in range(50)]

# Initialize on startup
initialize_price_history()

# ============ Models ============
class TradeRequest(BaseModel):
    symbol: str
    force_execute: bool = False

class RiskLimitsUpdate(BaseModel):
    max_position_size_pct: Optional[float] = None
    max_daily_loss_pct: Optional[float] = None
    min_confidence: Optional[float] = None

class UserProfileUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    risk_tolerance: Optional[str] = None  # conservative, moderate, aggressive
    trading_strategy: Optional[str] = None

class WalletOperation(BaseModel):
    operation: str  # deposit, withdraw
    amount: float
    currency: str = "USDT"

# ============ ML Predictor Import ============
from ml_predictor import ml_predictor

# ============ AI Predictor ============
class AIPredictor:
    def __init__(self):
        self.model_version = "v3.0-comprehensive"
    
    def calculate_indicators(self, prices: List[float]) -> Dict:
        """Calculate technical indicators"""
        if len(prices) < 20:
            return {}
        
        prices_arr = np.array(prices)
        
        # RSI
        deltas = np.diff(prices_arr[-14:])
        gains = np.where(deltas > 0, deltas, 0)
        losses = np.where(deltas < 0, -deltas, 0)
        avg_gain = np.mean(gains) if len(gains) > 0 else 0
        avg_loss = np.mean(losses) if len(losses) > 0 else 0
        rs = avg_gain / avg_loss if avg_loss != 0 else 0
        rsi = 100 - (100 / (1 + rs))
        
        # Moving Averages
        ma_5 = np.mean(prices_arr[-5:])
        ma_20 = np.mean(prices_arr[-20:])
        
        # MACD
        ema_12 = self._ema(prices_arr, 12)
        ema_26 = self._ema(prices_arr, 26)
        macd = ema_12 - ema_26
        
        # Bollinger Bands
        sma_20 = np.mean(prices_arr[-20:])
        std_20 = np.std(prices_arr[-20:])
        bb_upper = sma_20 + (2 * std_20)
        bb_lower = sma_20 - (2 * std_20)
        
        # Volatility
        volatility = std_20 / sma_20 if sma_20 != 0 else 0
        
        return {
            "rsi": rsi,
            "ma_5": ma_5,
            "ma_20": ma_20,
            "macd": macd,
            "bb_upper": bb_upper,
            "bb_lower": bb_lower,
            "volatility": volatility,
            "current_price": prices_arr[-1]
        }
    
    def _ema(self, prices, period):
        alpha = 2 / (period + 1)
        ema = prices[0]
        for price in prices[1:]:
            ema = alpha * price + (1 - alpha) * ema
        return ema
    
    def generate_signal(self, symbol: str) -> Dict:
        """Generate AI trading signal"""
        prices = trading_state["price_history"][symbol]
        indicators = self.calculate_indicators(prices)
        
        if not indicators:
            return self._default_signal()
        
        # Calculate signal scores
        buy_score = 0
        sell_score = 0
        
        # RSI analysis
        if indicators["rsi"] < 30:
            buy_score += 2
        elif indicators["rsi"] > 70:
            sell_score += 2
        
        # MACD analysis
        if indicators["macd"] > 0:
            buy_score += 1.5
        else:
            sell_score += 1.5
        
        # MA crossover
        if indicators["ma_5"] > indicators["ma_20"]:
            buy_score += 1
        else:
            sell_score += 1
        
        # Bollinger Bands
        if indicators["current_price"] <= indicators["bb_lower"]:
            buy_score += 1.5
        elif indicators["current_price"] >= indicators["bb_upper"]:
            sell_score += 1.5
        
        # Determine signal
        total_score = buy_score + sell_score
        if total_score == 0:
            signal = "HOLD"
            confidence = 0.5
        elif buy_score > sell_score:
            signal = "BUY"
            confidence = min(0.95, 0.5 + (buy_score / (total_score * 2)))
        else:
            signal = "SELL"
            confidence = min(0.95, 0.5 + (sell_score / (total_score * 2)))
        
        # Risk score
        risk_score = int(50 + (indicators["volatility"] * 200))
        risk_score = max(0, min(100, risk_score))
        
        # Position size
        position_size = confidence * 15 * (1 - risk_score / 200)
        position_size = max(1, min(20, position_size))
        
        # Get ML prediction if available
        ml_prediction = ml_predictor.predict(indicators)
        
        result = {
            "signal": signal,
            "confidence": round(confidence, 3),
            "buy_score": round(buy_score, 2),
            "sell_score": round(sell_score, 2),
            "risk_score": risk_score,
            "position_size": round(position_size, 2),
            "indicators": indicators,
            "timestamp": datetime.now().isoformat()
        }
        
        # Add ML prediction if available
        if ml_prediction:
            result["ml_prediction"] = ml_prediction
            # Combine rule-based and ML confidence
            combined_confidence = (confidence + ml_prediction["ml_confidence"]) / 2
            result["combined_confidence"] = round(combined_confidence, 3)
        
        return result
    
    def _default_signal(self):
        return {
            "signal": "HOLD",
            "confidence": 0.5,
            "buy_score": 0,
            "sell_score": 0,
            "risk_score": 50,
            "position_size": 0,
            "indicators": {},
            "timestamp": datetime.now().isoformat()
        }

# ============ Smart Contract ============
class SmartContract:
    def __init__(self):
        self.version = "3.0"
        self.risk_limits = {
            "max_position_size_pct": 20,
            "max_daily_loss_pct": 5,
            "min_confidence": 0.65,
            "max_daily_trades": 50
        }
        self.on_chain_records = []
        self.validations = []
        self.settlements = []
    
    def validate_trade(self, signal: Dict, portfolio: Dict) -> Dict:
        """Validate trade against smart contract rules"""
        validations = []
        is_valid = True
        
        # Confidence check
        if signal["confidence"] < self.risk_limits["min_confidence"]:
            validations.append({
                "rule": "min_confidence",
                "passed": False,
                "message": f"Confidence {signal['confidence']} below {self.risk_limits['min_confidence']}"
            })
            is_valid = False
        else:
            validations.append({"rule": "min_confidence", "passed": True, "message": "OK"})
        
        # Position size check
        if signal["position_size"] > self.risk_limits["max_position_size_pct"]:
            validations.append({
                "rule": "max_position_size",
                "passed": False,
                "message": f"Position size {signal['position_size']}% exceeds limit"
            })
            is_valid = False
        else:
            validations.append({"rule": "max_position_size", "passed": True, "message": "OK"})
        
        # Daily loss check
        if portfolio["profit_loss_pct"] < -self.risk_limits["max_daily_loss_pct"]:
            validations.append({
                "rule": "max_daily_loss",
                "passed": False,
                "message": f"Daily loss limit exceeded"
            })
            is_valid = False
        else:
            validations.append({"rule": "max_daily_loss", "passed": True, "message": "OK"})
        
        # Daily trades check
        if trading_state["trades_today"] >= self.risk_limits["max_daily_trades"]:
            validations.append({
                "rule": "max_daily_trades",
                "passed": False,
                "message": "Daily trade limit reached"
            })
            is_valid = False
        else:
            validations.append({"rule": "max_daily_trades", "passed": True, "message": "OK"})
        
        validation_record = {
            "validation_id": len(self.validations) + 1,
            "is_valid": is_valid,
            "validations": validations,
            "timestamp": datetime.now().isoformat(),
            "block_hash": self._hash(f"validation_{len(self.validations)}")
        }
        
        self.validations.append(validation_record)
        return validation_record
    
    def record_trade(self, trade: Dict) -> Dict:
        """Record trade on blockchain"""
        record = {
            "record_id": len(self.on_chain_records) + 1,
            "trade": trade,
            "block_number": len(self.on_chain_records) + 1,
            "block_hash": self._hash(json.dumps(trade)),
            "previous_hash": self.on_chain_records[-1]["block_hash"] if self.on_chain_records else "0" * 64,
            "timestamp": datetime.now().isoformat()
        }
        
        self.on_chain_records.append(record)
        return record
    
    def settle_trade(self, trade: Dict) -> Dict:
        """Settle trade and distribute P&L"""
        settlement = {
            "settlement_id": len(self.settlements) + 1,
            "trade_id": trade["trade_id"],
            "profit_loss": trade.get("profit_loss", 0),
            "status": "SETTLED",
            "timestamp": datetime.now().isoformat()
        }
        
        self.settlements.append(settlement)
        return settlement
    
    def _hash(self, data: str) -> str:
        return hashlib.sha256(data.encode()).hexdigest()
    
    def get_stats(self) -> Dict:
        total_validations = len(self.validations)
        passed = len([v for v in self.validations if v["is_valid"]])
        
        return {
            "total_validations": total_validations,
            "passed_validations": passed,
            "validation_pass_rate": round(passed / total_validations * 100, 2) if total_validations > 0 else 0,
            "total_records": len(self.on_chain_records),
            "total_settlements": len(self.settlements),
            "risk_limits": self.risk_limits
        }

# ============ Oracle Layer ============
class OracleLayer:
    def __init__(self):
        self.verifications = []
    
    def verify_signal(self, signal: Dict, market_data: Dict) -> Dict:
        """Verify signal integrity and market data"""
        # Hash signal data
        signal_hash = hashlib.sha256(json.dumps(signal, sort_keys=True).encode()).hexdigest()
        
        # Verify market data consistency
        is_verified = True
        reasons = []
        
        # Check if confidence is reasonable
        if signal["confidence"] > 0.98:
            is_verified = False
            reasons.append("Confidence suspiciously high")
        
        # Check if risk score matches volatility
        if signal["risk_score"] < 20 and signal["indicators"].get("volatility", 0) > 0.05:
            is_verified = False
            reasons.append("Risk score inconsistent with volatility")
        
        verification = {
            "verification_id": len(self.verifications) + 1,
            "signal_hash": signal_hash,
            "is_verified": is_verified,
            "reasons": reasons if not is_verified else ["All checks passed"],
            "timestamp": datetime.now().isoformat()
        }
        
        self.verifications.append(verification)
        return verification
    
    def get_stats(self) -> Dict:
        total = len(self.verifications)
        verified = len([v for v in self.verifications if v["is_verified"]])
        
        return {
            "total_verifications": total,
            "verified_count": verified,
            "verification_rate": round(verified / total * 100, 2) if total > 0 else 100
        }

# ============ Trading Engine ============
class TradingEngine:
    def __init__(self):
        self.trades = []
    
    def execute_trade(self, signal: Dict, symbol: str, current_price: float) -> Dict:
        """Execute trade based on signal"""
        if signal["signal"] == "HOLD":
            return {"success": False, "reason": "Signal is HOLD"}
        
        # Calculate trade details
        trade_value = trading_state["balance"] * (signal["position_size"] / 100)
        quantity = trade_value / current_price
        
        # Simulate execution with slippage
        execution_price = current_price * (1 + random.uniform(-0.001, 0.001))
        
        # Simulate P&L
        profit_loss = random.uniform(-trade_value * 0.05, trade_value * 0.08)
        
        trade = {
            "trade_id": f"TRD_{len(self.trades) + 1}",
            "symbol": symbol,
            "type": signal["signal"],
            "quantity": round(quantity, 6),
            "price": round(execution_price, 2),
            "value": round(trade_value, 2),
            "profit_loss": round(profit_loss, 2),
            "confidence": signal["confidence"],
            "timestamp": datetime.now().isoformat()
        }
        
        self.trades.append(trade)
        
        # Update state
        trading_state["pnl"] += profit_loss
        trading_state["daily_pnl"] += profit_loss
        trading_state["trades_today"] += 1
        trading_state["positions"].append(trade)
        
        return {"success": True, "trade": trade}
    
    def get_performance(self) -> Dict:
        if not self.trades:
            return {
                "total_trades": 0,
                "winning_trades": 0,
                "win_rate": 0,
                "total_profit": 0,
                "avg_profit": 0
            }
        
        winning = [t for t in self.trades if t["profit_loss"] > 0]
        total_profit = sum(t["profit_loss"] for t in self.trades)
        
        return {
            "total_trades": len(self.trades),
            "winning_trades": len(winning),
            "losing_trades": len(self.trades) - len(winning),
            "win_rate": round(len(winning) / len(self.trades) * 100, 2),
            "total_profit": round(total_profit, 2),
            "avg_profit": round(total_profit / len(self.trades), 2),
            "best_trade": round(max(t["profit_loss"] for t in self.trades), 2),
            "worst_trade": round(min(t["profit_loss"] for t in self.trades), 2)
        }

# ============ Initialize Components ============
ai_predictor = AIPredictor()
smart_contract = SmartContract()
oracle = OracleLayer()
trading_engine = TradingEngine()
backtest_engine = BacktestEngine()

# Performance cache with longer TTL
performance_cache = {"data": None, "timestamp": 0, "ttl": 300}  # 5 minutes cache

# Prices cache to reduce API calls - Optimized for speed
prices_cache = {"data": None, "timestamp": 0, "ttl": 90}  # 90 seconds cache (1.5 minutes)

# Dashboard cache for faster loading - Increased TTL
dashboard_cache = {"data": {}, "timestamp": {}, "ttl": 60}  # 60 seconds per symbol (1 minute)

# Trade history cache to reduce blockchain calls
trade_history_cache = {"data": None, "timestamp": 0, "ttl": 60, "key": None}  # 60 seconds cache

# AI Explanation cache for faster AI Explainer page
ai_explanation_cache = {"data": {}, "timestamp": {}, "ttl": 90}  # 90 seconds per symbol

def get_cached_performance():
    """Get performance data with caching - optimized for speed"""
    import time
    current_time = time.time()
    
    # Return cached data if still valid
    if performance_cache["data"] and (current_time - performance_cache["timestamp"]) < performance_cache["ttl"]:
        logger.debug("Using cached performance data")
        return performance_cache["data"]
    
    # If cache expired but data exists, return stale data and update in background
    if performance_cache["data"]:
        logger.debug("Returning stale cache while updating")
        # TODO: Update in background thread
        return performance_cache["data"]
    
    # First time or no cache - use quick estimation
    try:
        from settlement_service import settlement_service
        trade_counter = settlement_service.contract.functions.tradeCounter().call()
        
        # For dashboard, just show trade count - detailed stats available in /api/trades/performance
        performance = {
            "total_trades": trade_counter,
            "winning_trades": 0,
            "losing_trades": 0,
            "win_rate": 0,
            "total_profit": 0,
            "avg_profit": 0
        }
        
        performance_cache["data"] = performance
        performance_cache["timestamp"] = current_time
        return performance
    except Exception as e:
        logger.error(f"Error getting performance: {e}")
        return {"total_trades": 0, "winning_trades": 0, "losing_trades": 0, "win_rate": 0, "total_profit": 0, "avg_profit": 0}

# ============ API Endpoints ============

@app.get("/")
async def root():
    return {
        "name": "AI Trading Platform - Binance Edition",
        "version": "3.0",
        "status": "operational",
        "data_source": "Binance",
        "binance_trading": "Configured" if binance_trading.is_configured else "Not Configured",
        "features": [
            "AI Prediction Engine",
            "Binance Real Trading",
            "Smart Contract Validation",
            "Oracle Verification",
            "Risk Management",
            "Real-time Market Data",
            "ML Predictions"
        ]
    }

@app.get("/api/status")
async def get_api_status():
    """Get API and Binance connection status"""
    # Test Binance market data connection
    binance_market_health = False
    try:
        test_price = binance_api.get_price("BTC/USDT")
        binance_market_health = test_price is not None
    except:
        pass
    
    # Test Binance trading connection
    binance_trading_health = binance_trading.is_configured
    
    return {
        "success": True,
        "api_status": "operational",
        "binance": {
            "market_data": {
                "connected": binance_market_health,
                "status": "Connected" if binance_market_health else "Unavailable",
                "response_time": "< 200ms" if binance_market_health else "N/A"
            },
            "trading": {
                "configured": binance_trading_health,
                "status": "Ready" if binance_trading_health else "Not Configured",
                "mode": binance_trading.mode if binance_trading_health else "N/A"
            }
        },
        "data_source": "Binance",
        "trading_state": {
            "balance": trading_state["balance"],
            "pnl": trading_state["pnl"],
            "trades_today": trading_state["trades_today"],
            "positions": len(trading_state["positions"])
        }
    }

@app.get("/api/dashboard")
async def get_dashboard(symbol: str = "BTC"):
    """Get complete dashboard data with live prices and AI signal for specified symbol"""
    import time
    
    # Check dashboard cache first
    current_time = time.time()
    cache_key = symbol
    if (cache_key in dashboard_cache["data"] and 
        cache_key in dashboard_cache["timestamp"] and
        (current_time - dashboard_cache["timestamp"][cache_key]) < dashboard_cache["ttl"]):
        cached_data = dashboard_cache["data"][cache_key]
        cached_data["cache_hit"] = True
        return {"success": True, "data": cached_data, "source": "cache"}
    
    # Get current prices (live or simulated)
    prices_response = await get_prices()
    prices = prices_response["data"]
    
    # Get AI signal for requested symbol (default BTC)
    signal = ai_predictor.generate_signal(symbol)
    
    # Portfolio
    portfolio = {
        "total_value": trading_state["balance"] + trading_state["pnl"],
        "profit_loss": trading_state["pnl"],
        "profit_loss_pct": (trading_state["pnl"] / trading_state["balance"]) * 100,
        "positions_count": len(trading_state["positions"]),
        "balance": trading_state["balance"]
    }
    
    # Performance - Use cached data from blockchain
    performance = get_cached_performance()
    
    # Smart contract stats
    sc_stats = smart_contract.get_stats()
    
    # Oracle stats
    oracle_stats = oracle.get_stats()
    
    # Prepare response data
    response_data = {
        "prices": prices,
        "current_signal": signal,
        "portfolio": portfolio,
        "performance": performance,
        "smart_contract": sc_stats,
        "oracle": oracle_stats,
        "trades_today": trading_state["trades_today"],
        "cache_hit": False
    }
    
    # Save to cache
    dashboard_cache["data"][cache_key] = response_data
    dashboard_cache["timestamp"][cache_key] = current_time
    
    return {
        "success": True,
        "data": response_data,
        "source": "fresh"
    }

@app.get("/api/market/prices")
async def get_prices():
    """Get current market prices from Binance"""
    import time
    
    # Check cache first
    current_time = time.time()
    if prices_cache["data"] and (current_time - prices_cache["timestamp"]) < prices_cache["ttl"]:
        return {"success": True, "data": prices_cache["data"], "source": "cache"}
    
    # Trading Pairs - Top 8 coins (Best Balance)
    SYMBOLS = [
        "BTC", "ETH", "BNB", "SOL", "XRP", "ADA", "MATIC", "LINK"
    ]
    prices = {}
    
    # Get live data from Binance
    for symbol in SYMBOLS:
        pair = f"{symbol}/USDT"
        stats = binance_api.get_24h_stats(pair)
        
        if stats:
            # Update price history
            if symbol in trading_state["price_history"]:
                history = trading_state["price_history"][symbol]
                new_price = stats['price']
                history.append(new_price)
                if len(history) > 100:
                    history.pop(0)
            
            prices[symbol] = {
                "price": round(stats['price'], 2),
                "change_24h": round(stats['change_24h'], 2),
                "high_24h": round(stats['high_24h'], 2),
                "low_24h": round(stats['low_24h'], 2),
                "volume_24h": round(stats['volume_24h'], 2),
                "source": "Binance"
            }
        else:
            # Fallback to simulated only if Binance fails
            prices[symbol] = _get_simulated_price(symbol)
    
    # Update cache
    prices_cache["data"] = prices
    prices_cache["timestamp"] = current_time
    
    return {
        "success": True, 
        "data": prices, 
        "data_source": "Binance",
        "response_time_ms": round((time.time() - current_time) * 1000, 2)
    }

def _get_simulated_price(symbol: str) -> Dict:
    """Get simulated price for a symbol"""
    history = trading_state["price_history"][symbol]
    new_price = history[-1] + random.uniform(-history[-1] * 0.01, history[-1] * 0.01)
    history.append(new_price)
    if len(history) > 100:
        history.pop(0)
    
    return {
        "price": round(new_price, 2),
        "change_24h": round(((new_price - history[-2]) / history[-2]) * 100, 2) if len(history) > 1 else 0,
        "high_24h": round(new_price * 1.03, 2),
        "low_24h": round(new_price * 0.97, 2),
        "volume_24h": round(random.uniform(1000000, 10000000), 2),
        "source": "Simulated"
    }

@app.get("/api/predictions/{symbol}")
async def get_prediction(symbol: str):
    """Get AI prediction for symbol"""
    if symbol not in trading_state["price_history"]:
        raise HTTPException(status_code=404, detail="Symbol not found")
    
    signal = ai_predictor.generate_signal(symbol)
    return {"success": True, "symbol": symbol, "prediction": signal}

@app.get("/api/ai/explain/{symbol}")
async def explain_ai_decision(symbol: str):
    """Get detailed explanation of AI decision for a symbol"""
    if symbol not in trading_state["price_history"]:
        raise HTTPException(status_code=404, detail="Symbol not found")
    
    # Check cache first for faster loading
    current_time = time.time()
    cache_key = symbol
    if (cache_key in ai_explanation_cache["data"] and 
        cache_key in ai_explanation_cache["timestamp"] and
        (current_time - ai_explanation_cache["timestamp"][cache_key]) < ai_explanation_cache["ttl"]):
        cached_data = ai_explanation_cache["data"][cache_key]
        cached_data["cache_hit"] = True
        logger.debug(f"Using cached AI explanation for {symbol}")
        return {"success": True, "data": cached_data, "source": "cache"}
    
    # Get AI signal with all indicators
    signal = ai_predictor.generate_signal(symbol)
    indicators = signal["indicators"]
    
    # Build detailed reasoning
    reasoning = []
    
    # RSI Analysis
    rsi = indicators.get("rsi", 50)
    if rsi < 30:
        reasoning.append({
            "indicator": "RSI (Relative Strength Index)",
            "explanation": f"RSI is {rsi:.2f}, which is below 30. This indicates the asset is oversold and may be due for a price increase.",
            "impact": 2.0,
            "signal": "BUY"
        })
    elif rsi > 70:
        reasoning.append({
            "indicator": "RSI (Relative Strength Index)",
            "explanation": f"RSI is {rsi:.2f}, which is above 70. This indicates the asset is overbought and may be due for a price correction.",
            "impact": -2.0,
            "signal": "SELL"
        })
    else:
        reasoning.append({
            "indicator": "RSI (Relative Strength Index)",
            "explanation": f"RSI is {rsi:.2f}, which is in the neutral zone (30-70). No strong signal from RSI.",
            "impact": 0.0,
            "signal": "NEUTRAL"
        })
    
    # MACD Analysis
    macd = indicators.get("macd", 0)
    if macd > 0:
        reasoning.append({
            "indicator": "MACD (Moving Average Convergence Divergence)",
            "explanation": f"MACD is positive ({macd:.2f}), indicating bullish momentum. The short-term trend is stronger than the long-term trend.",
            "impact": 1.5,
            "signal": "BUY"
        })
    else:
        reasoning.append({
            "indicator": "MACD (Moving Average Convergence Divergence)",
            "explanation": f"MACD is negative ({macd:.2f}), indicating bearish momentum. The short-term trend is weaker than the long-term trend.",
            "impact": -1.5,
            "signal": "SELL"
        })
    
    # Moving Average Crossover
    ma_5 = indicators.get("ma_5", 0)
    ma_20 = indicators.get("ma_20", 0)
    ma_diff = ma_5 - ma_20
    if ma_5 > ma_20:
        reasoning.append({
            "indicator": "Moving Average Crossover",
            "explanation": f"5-period MA (${ma_5:.2f}) is above 20-period MA (${ma_20:.2f}). This 'Golden Cross' suggests an upward trend.",
            "impact": 1.0,
            "signal": "BUY"
        })
    else:
        reasoning.append({
            "indicator": "Moving Average Crossover",
            "explanation": f"5-period MA (${ma_5:.2f}) is below 20-period MA (${ma_20:.2f}). This 'Death Cross' suggests a downward trend.",
            "impact": -1.0,
            "signal": "SELL"
        })
    
    # Bollinger Bands
    current_price = indicators.get("current_price", 0)
    bb_upper = indicators.get("bb_upper", 0)
    bb_lower = indicators.get("bb_lower", 0)
    bb_position = (current_price - bb_lower) / (bb_upper - bb_lower + 0.0001)
    
    if bb_position <= 0.2:
        reasoning.append({
            "indicator": "Bollinger Bands",
            "explanation": f"Price (${current_price:.2f}) is near the lower Bollinger Band (${bb_lower:.2f}). This suggests the asset may be undervalued.",
            "impact": 1.5,
            "signal": "BUY"
        })
    elif bb_position >= 0.8:
        reasoning.append({
            "indicator": "Bollinger Bands",
            "explanation": f"Price (${current_price:.2f}) is near the upper Bollinger Band (${bb_upper:.2f}). This suggests the asset may be overvalued.",
            "impact": -1.5,
            "signal": "SELL"
        })
    else:
        reasoning.append({
            "indicator": "Bollinger Bands",
            "explanation": f"Price (${current_price:.2f}) is within the middle range of Bollinger Bands. No extreme valuation detected.",
            "impact": 0.0,
            "signal": "NEUTRAL"
        })
    
    # Volatility Analysis
    volatility = indicators.get("volatility", 0)
    reasoning.append({
        "indicator": "Market Volatility",
        "explanation": f"Current volatility is {volatility*100:.2f}%. {'High volatility increases risk but also potential rewards.' if volatility > 0.03 else 'Low volatility suggests a stable market with lower risk.'}",
        "impact": 0.0,
        "signal": "RISK_FACTOR"
    })
    
    # Prepare response
    explanation = {
        "symbol": symbol,
        "signal": signal["signal"],
        "confidence": signal["confidence"],
        "buy_score": signal["buy_score"],
        "sell_score": signal["sell_score"],
        "risk_score": signal["risk_score"],
        "position_size": signal["position_size"],
        "indicators": {
            "rsi": rsi,
            "macd": macd,
            "ma_5": ma_5,
            "ma_20": ma_20,
            "ma_diff": ma_diff,
            "bb_upper": bb_upper,
            "bb_lower": bb_lower,
            "bb_position": bb_position,
            "current_price": current_price,
            "volatility": volatility
        },
        "reasoning": reasoning,
        "indicators_analyzed": len(reasoning),
        "timestamp": datetime.now().isoformat()
    }
    
    # Add ML prediction if available
    if "ml_prediction" in signal:
        explanation["ml_prediction"] = signal["ml_prediction"]
    
    # Cache the explanation for faster subsequent requests
    ai_explanation_cache["data"][cache_key] = explanation
    ai_explanation_cache["timestamp"][cache_key] = current_time
    
    return {"success": True, "data": explanation, "source": "fresh"}

@app.post("/api/trades/execute")
async def execute_trade(request: TradeRequest):
    """Execute trade with full validation"""
    symbol = request.symbol
    
    if symbol not in trading_state["price_history"]:
        raise HTTPException(status_code=404, detail="Symbol not found")
    
    # Get current price
    current_price = trading_state["price_history"][symbol][-1]
    
    # Get AI signal
    signal = ai_predictor.generate_signal(symbol)
    
    # Oracle verification
    market_data = {"price": current_price, "symbol": symbol}
    oracle_verification = oracle.verify_signal(signal, market_data)
    
    if not oracle_verification["is_verified"] and not request.force_execute:
        return {
            "success": False,
            "stage": "oracle_verification",
            "reason": "Oracle verification failed",
            "verification": oracle_verification
        }
    
    # Smart contract validation
    portfolio = {
        "total_value": trading_state["balance"] + trading_state["pnl"],
        "profit_loss_pct": (trading_state["pnl"] / trading_state["balance"]) * 100
    }
    validation = smart_contract.validate_trade(signal, portfolio)
    
    if not validation["is_valid"] and not request.force_execute:
        return {
            "success": False,
            "stage": "smart_contract_validation",
            "reason": "Validation failed",
            "validation": validation
        }
    
    # Execute trade
    execution = trading_engine.execute_trade(signal, symbol, current_price)
    
    if not execution["success"]:
        return execution
    
    # Record on-chain
    on_chain_record = smart_contract.record_trade(execution["trade"])
    
    # Settle trade
    settlement = smart_contract.settle_trade(execution["trade"])
    
    return {
        "success": True,
        "trade": execution["trade"],
        "oracle_verification": oracle_verification,
        "validation": validation,
        "on_chain_record": on_chain_record,
        "settlement": settlement
    }

@app.get("/api/trades/history")
async def get_trade_history(limit: int = 20, user_address: str = None):
    """Get trade history from blockchain with caching"""
    import time
    
    # Check cache first (only if no user filter)
    if not user_address:
        current_time = time.time()
        cache_key = f"trades_{limit}"
        
        if trade_history_cache.get("data") and trade_history_cache.get("key") == cache_key:
            if (current_time - trade_history_cache["timestamp"]) < trade_history_cache["ttl"]:
                logger.debug("Using cached trade history")
                return trade_history_cache["data"]
    
    try:
        from settlement_service import settlement_service
        
        trades = []
        trade_counter = settlement_service.contract.functions.tradeCounter().call()
        
        # Get recent trades
        start_id = max(1, trade_counter - limit + 1)
        for trade_id in range(start_id, trade_counter + 1):
            try:
                trade_data = settlement_service.contract.functions.getTrade(trade_id).call()
                
                # Filter by user if specified
                if user_address and trade_data[1].lower() != user_address.lower():
                    continue
                
                # Parse trade data
                from datetime import datetime
                trade = {
                    "trade_id": trade_data[0],
                    "user": trade_data[1],
                    "symbol": trade_data[2],
                    "type": trade_data[3],
                    "amount": float(trade_data[4]) / 1e18,  # Convert from wei
                    "price": trade_data[5],
                    "profit_loss": float(trade_data[6]) / 1e18 if trade_data[8] else 0,  # Convert from wei
                    "timestamp": datetime.fromtimestamp(trade_data[7]).isoformat(),  # Convert Unix timestamp
                    "settled": trade_data[8],
                    "quantity": float(trade_data[4]) / 1e18 / trade_data[5],  # amount / price
                    "value": float(trade_data[4]) / 1e18,
                    "confidence": 0.85  # Default confidence
                }
                trades.append(trade)
            except Exception as e:
                logger.debug(f"Error fetching trade {trade_id}: {e}")
                continue
        
        # Reverse to show newest first
        trades.reverse()
        
        result = {"success": True, "data": trades, "count": len(trades)}
        
        # Cache the result (only if no user filter)
        if not user_address:
            trade_history_cache["data"] = result
            trade_history_cache["key"] = cache_key
            trade_history_cache["timestamp"] = time.time()
        
        return result
    except Exception as e:
        logger.error(f"Error fetching trade history: {e}")
        # Fallback to in-memory trades
        trades = trading_engine.trades[-limit:][::-1]
        return {"success": True, "data": trades, "count": len(trades)}

@app.get("/api/trades/performance")
async def get_performance():
    """Get trading performance from blockchain"""
    try:
        from settlement_service import settlement_service
        
        trades = []
        trade_counter = settlement_service.contract.functions.tradeCounter().call()
        
        # Get all settled trades
        for trade_id in range(1, trade_counter + 1):
            try:
                trade_data = settlement_service.contract.functions.getTrade(trade_id).call()
                
                # Only count settled trades
                if trade_data[8]:  # settled = True
                    profit_loss = float(trade_data[6]) / 1e18  # Convert from wei
                    trades.append({
                        "profit_loss": profit_loss
                    })
            except Exception as e:
                logger.debug(f"Error fetching trade {trade_id}: {e}")
                continue
        
        # Calculate performance
        if not trades:
            performance = {
                "total_trades": 0,
                "winning_trades": 0,
                "losing_trades": 0,
                "win_rate": 0,
                "total_profit": 0,
                "avg_profit": 0,
                "best_trade": 0,
                "worst_trade": 0
            }
        else:
            winning = [t for t in trades if t["profit_loss"] > 0]
            total_profit = sum(t["profit_loss"] for t in trades)
            
            performance = {
                "total_trades": len(trades),
                "winning_trades": len(winning),
                "losing_trades": len(trades) - len(winning),
                "win_rate": round(len(winning) / len(trades) * 100, 2),
                "total_profit": round(total_profit, 2),
                "avg_profit": round(total_profit / len(trades), 2),
                "best_trade": round(max(t["profit_loss"] for t in trades), 2),
                "worst_trade": round(min(t["profit_loss"] for t in trades), 2)
            }
        
        return {"success": True, "data": performance}
    except Exception as e:
        logger.error(f"Error calculating performance: {e}")
        # Fallback to in-memory trades
        performance = trading_engine.get_performance()
        return {"success": True, "data": performance}

@app.get("/api/smartcontract/records")
async def get_on_chain_records(limit: int = 20):
    """Get on-chain records"""
    records = smart_contract.on_chain_records[-limit:][::-1]
    return {"success": True, "data": records, "count": len(records)}

@app.get("/api/smartcontract/validations")
async def get_validations(limit: int = 20):
    """Get validation history"""
    validations = smart_contract.validations[-limit:][::-1]
    return {"success": True, "data": validations, "count": len(validations)}

@app.get("/api/smartcontract/risk-limits")
async def get_risk_limits():
    """Get current risk limits"""
    return {"success": True, "data": smart_contract.risk_limits}

@app.post("/api/smartcontract/risk-limits")
async def update_risk_limits(update: RiskLimitsUpdate):
    """Update risk limits"""
    new_limits = {k: v for k, v in update.dict().items() if v is not None}
    smart_contract.risk_limits.update(new_limits)
    return {"success": True, "data": smart_contract.risk_limits}

@app.get("/api/oracle/verifications")
async def get_oracle_verifications(limit: int = 20):
    """Get oracle verifications"""
    verifications = oracle.verifications[-limit:][::-1]
    return {"success": True, "data": verifications, "count": len(verifications)}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket for real-time updates from Binance"""
    await websocket.accept()
    try:
        while True:
            # Get prices from Binance
            for symbol in trading_state["price_history"]:
                pair = f"{symbol}/USDT"
                price = binance_api.get_price(pair)
                if price:
                    history = trading_state["price_history"][symbol]
                    history.append(price)
                    if len(history) > 100:
                        history.pop(0)
                else:
                    # Fallback to simulated if Binance fails
                    history = trading_state["price_history"][symbol]
                    new_price = history[-1] + random.uniform(-history[-1] * 0.005, history[-1] * 0.005)
                    history.append(new_price)
                    if len(history) > 100:
                        history.pop(0)
            
            # Send update
            data = {
                "type": "market_update",
                "prices": {
                    symbol: round(trading_state["price_history"][symbol][-1], 2)
                    for symbol in trading_state["price_history"]
                },
                "pnl": round(trading_state["pnl"], 2),
                "balance": trading_state["balance"],
                "data_source": "Binance",
                "timestamp": datetime.now().isoformat()
            }
            
            await websocket.send_text(json.dumps(data))
            await asyncio.sleep(2)
    except:
        pass

# ============ Backtesting Endpoints (Hackathon Feature) ============

@app.get("/api/backtest/{symbol}")
async def run_backtest(
    symbol: str,
    strategy: str = "ai_multi_indicator",
    period_days: int = 30
):
    """Run backtest for a symbol and strategy"""
    if symbol not in ["BTC", "ETH", "BNB", "SOL"]:
        raise HTTPException(status_code=404, detail="Symbol not found")
    
    result = backtest_engine.run_backtest(symbol, strategy, period_days)
    
    return {
        "success": True,
        "data": result
    }

@app.get("/api/backtest/compare/{symbol}")
async def compare_strategies(symbol: str, period_days: int = 30):
    """Compare multiple strategies for a symbol"""
    if symbol not in ["BTC", "ETH", "BNB", "SOL"]:
        raise HTTPException(status_code=404, detail="Symbol not found")
    
    strategies = ["ai_multi_indicator", "momentum", "mean_reversion"]
    result = backtest_engine.compare_strategies(symbol, strategies, period_days)
    
    return {
        "success": True,
        "data": result
    }

@app.get("/api/backtest/results")
async def get_backtest_results():
    """Get all backtest results"""
    results = backtest_engine.get_results_summary()
    
    return {
        "success": True,
        "data": results
    }

# ============ User Profile Endpoints ============

@app.get("/api/user/profile")
async def get_user_profile():
    """Get user profile information"""
    return {
        "success": True,
        "data": user_profile
    }

@app.put("/api/user/profile")
async def update_user_profile(update: UserProfileUpdate):
    """Update user profile"""
    updates = {k: v for k, v in update.dict().items() if v is not None}
    
    # Validate risk tolerance
    if "risk_tolerance" in updates:
        if updates["risk_tolerance"] not in ["conservative", "moderate", "aggressive"]:
            raise HTTPException(status_code=400, detail="Invalid risk tolerance")
    
    user_profile.update(updates)
    
    return {
        "success": True,
        "message": "Profile updated successfully",
        "data": user_profile
    }

@app.get("/api/user/stats")
async def get_user_stats():
    """Get user trading statistics"""
    # Update stats from trading engine
    performance = trading_engine.get_performance()
    
    user_profile["stats"].update({
        "total_trades": performance.get("total_trades", 0),
        "total_profit": performance.get("total_profit", 0),
        "best_trade": performance.get("best_trade", 0),
        "win_rate": performance.get("win_rate", 0)
    })
    
    return {
        "success": True,
        "data": user_profile["stats"]
    }

# ============ Wallet Endpoints ============

@app.get("/api/wallet")
async def get_wallet():
    """Get wallet information"""
    # Calculate total value in USDT
    total_value = wallet_state["balances"]["USDT"]
    
    # Add crypto values (convert to USDT)
    for symbol in ["BTC", "ETH", "BNB", "SOL"]:
        if wallet_state["balances"][symbol] > 0:
            current_price = trading_state["price_history"][symbol][-1]
            total_value += wallet_state["balances"][symbol] * current_price
    
    return {
        "success": True,
        "data": {
            **wallet_state,
            "total_value_usdt": round(total_value, 2),
            "available_balance": round(wallet_state["balances"]["USDT"], 2),
            "locked_balance": round(wallet_state["locked_balances"]["USDT"], 2)
        }
    }

@app.get("/api/wallet/balances")
async def get_wallet_balances():
    """Get all wallet balances with current values"""
    balances = []
    
    for currency in ["USDT", "BTC", "ETH", "BNB", "SOL"]:
        balance = wallet_state["balances"][currency]
        locked = wallet_state["locked_balances"][currency]
        
        if currency == "USDT":
            value_usdt = balance
            price = 1.0
        else:
            price = trading_state["price_history"][currency][-1]
            value_usdt = balance * price
        
        balances.append({
            "currency": currency,
            "balance": round(balance, 6),
            "locked": round(locked, 6),
            "available": round(balance - locked, 6),
            "price_usdt": round(price, 2),
            "value_usdt": round(value_usdt, 2)
        })
    
    return {
        "success": True,
        "data": balances
    }

@app.post("/api/wallet/deposit")
async def deposit_to_wallet(operation: WalletOperation):
    """Deposit funds to wallet"""
    if operation.operation != "deposit":
        raise HTTPException(status_code=400, detail="Invalid operation")
    
    if operation.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
    
    currency = operation.currency
    if currency not in wallet_state["balances"]:
        raise HTTPException(status_code=400, detail="Invalid currency")
    
    # Add to balance
    wallet_state["balances"][currency] += operation.amount
    wallet_state["total_deposited"] += operation.amount
    
    # Update trading balance if USDT
    if currency == "USDT":
        trading_state["balance"] += operation.amount
    
    # Record transaction
    transaction = {
        "tx_id": f"TX_{len(wallet_state['transaction_history']) + 1}",
        "type": "DEPOSIT",
        "currency": currency,
        "amount": operation.amount,
        "status": "COMPLETED",
        "timestamp": datetime.now().isoformat()
    }
    wallet_state["transaction_history"].append(transaction)
    
    return {
        "success": True,
        "message": f"Deposited {operation.amount} {currency}",
        "transaction": transaction,
        "new_balance": wallet_state["balances"][currency]
    }

@app.post("/api/wallet/withdraw")
async def withdraw_from_wallet(operation: WalletOperation):
    """Withdraw funds from wallet"""
    if operation.operation != "withdraw":
        raise HTTPException(status_code=400, detail="Invalid operation")
    
    if operation.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
    
    currency = operation.currency
    if currency not in wallet_state["balances"]:
        raise HTTPException(status_code=400, detail="Invalid currency")
    
    # Check available balance
    available = wallet_state["balances"][currency] - wallet_state["locked_balances"][currency]
    if operation.amount > available:
        raise HTTPException(status_code=400, detail="Insufficient balance")
    
    # Deduct from balance
    wallet_state["balances"][currency] -= operation.amount
    wallet_state["total_withdrawn"] += operation.amount
    
    # Update trading balance if USDT
    if currency == "USDT":
        trading_state["balance"] -= operation.amount
    
    # Record transaction
    transaction = {
        "tx_id": f"TX_{len(wallet_state['transaction_history']) + 1}",
        "type": "WITHDRAW",
        "currency": currency,
        "amount": operation.amount,
        "status": "COMPLETED",
        "timestamp": datetime.now().isoformat()
    }
    wallet_state["transaction_history"].append(transaction)
    
    return {
        "success": True,
        "message": f"Withdrew {operation.amount} {currency}",
        "transaction": transaction,
        "new_balance": wallet_state["balances"][currency]
    }

@app.get("/api/wallet/transactions")
async def get_wallet_transactions(limit: int = 20):
    """Get wallet transaction history"""
    transactions = wallet_state["transaction_history"][-limit:][::-1]
    
    return {
        "success": True,
        "data": transactions,
        "count": len(transactions)
    }

# ============ Blockchain Endpoints ============

@app.get("/api/blockchain/status")
async def get_blockchain_status():
    """Get blockchain connection status"""
    return {
        "success": True,
        "data": {
            "connected": blockchain_service.connected,
            "contract_deployed": blockchain_service.is_ready(),
            "network": blockchain_service.get_network_info(),
            "token": blockchain_service.get_token_info()
        }
    }

@app.get("/api/blockchain/balance/{address}")
async def get_blockchain_balance(address: str):
    """Get token balance for wallet address"""
    try:
        balance = blockchain_service.get_balance(address)
        can_claim = blockchain_service.can_claim_faucet(address)
        cooldown = blockchain_service.time_until_next_claim(address)
        
        return {
            "success": True,
            "data": {
                "address": address,
                "balance": balance,
                "can_claim_faucet": can_claim,
                "cooldown_seconds": cooldown,
                "cooldown_hours": round(cooldown / 3600, 1)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/blockchain/verify-transaction")
async def verify_blockchain_transaction(tx_hash: str):
    """Verify a blockchain transaction"""
    try:
        result = blockchain_service.verify_transaction(tx_hash)
        
        if result:
            return {
                "success": True,
                "data": result
            }
        else:
            raise HTTPException(status_code=404, detail="Transaction not found")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/blockchain/token-info")
async def get_token_info():
    """Get AITradeUSDT token information"""
    return {
        "success": True,
        "data": blockchain_service.get_token_info()
    }

# ============ ML Model Endpoints ============

@app.post("/api/ml/train")
async def train_ml_model():
    """Train ML model on historical trades"""
    try:
        from settlement_service import settlement_service
        
        # Fetch historical trades
        trades = []
        trade_counter = settlement_service.contract.functions.tradeCounter().call()
        
        for trade_id in range(1, min(trade_counter + 1, 51)):  # Max 50 trades
            try:
                trade_data = settlement_service.contract.functions.getTrade(trade_id).call()
                if trade_data[8]:  # settled
                    # Get indicators for this trade (simulate)
                    indicators = ai_predictor.calculate_indicators(
                        trading_state["price_history"].get("BTC", [50000] * 100)
                    )
                    
                    trades.append({
                        "indicators": indicators,
                        "profit_loss": float(trade_data[6]) / 1e18
                    })
            except Exception as e:
                logger.debug(f"Error fetching trade {trade_id}: {e}")
                continue
        
        # Train model
        result = ml_predictor.train(trades)
        return {"success": True, "training_result": result}
    
    except Exception as e:
        logger.error(f"ML training error: {e}")
        return {"success": False, "error": str(e)}

@app.get("/api/ml/info")
async def get_ml_info():
    """Get ML model information"""
    return {"success": True, "data": ml_predictor.get_model_info()}

# ============ Hackathon Info Endpoint ============

@app.get("/api/hackathon")
async def get_hackathon_info():
    """Get hackathon submission information"""
    return {
        "success": True,
        "hackathon": {
            "name": "WEEX AI Trading Hackathon",
            "platform": "DoraHacks",
            "url": "https://dorahacks.io/hackathon/weex-ai-trading/detail",
            "project": {
                "name": "AI Trading Platform - Comprehensive Edition",
                "version": "3.0 Hackathon Special",
                "features": [
                    "AI-Powered Trading Signals",
                    "Smart Contract Validation",
                    "Oracle Verification Layer",
                    "Real-time WEEX Integration",
                    "Backtesting Engine",
                    "Strategy Comparison",
                    "Risk Management System",
                    "Performance Analytics"
                ],
                "tech_stack": {
                    "backend": "FastAPI + Python",
                    "frontend": "Next.js + React",
                    "ai": "NumPy + Custom Algorithms",
                    "blockchain": "Smart Contract Simulation"
                },
                "innovation": [
                    "Multi-layer validation system",
                    "Automatic fallback mechanism",
                    "Real-time WebSocket updates",
                    "Advanced backtesting engine",
                    "Comprehensive risk management"
                ]
            },
            "demo": {
                "frontend": "http://localhost:3000",
                "backend": "http://localhost:8000",
                "api_docs": "http://localhost:8000/docs"
            },
            "documentation": [
                "README.md",
                "HACKATHON_FEATURES.md",
                "ARCHITECTURE.md",
                "API_DOCUMENTATION.md",
                "WEEX_INTEGRATION.md"
            ]
        }
    }

@app.on_event("startup")
async def startup_event():
    """Start background services"""
    if settlement_service.account:
        asyncio.create_task(settlement_service.monitor_and_settle())
        logger.info("🤖 Auto-settlement service started")
    else:
        logger.info("💡 Auto-settlement disabled - set OWNER_PRIVATE_KEY to enable")

# ============ Binance Trading Endpoints ============

class BinanceTradeRequest(BaseModel):
    symbol: str
    side: str  # BUY or SELL
    quantity: Optional[float] = None
    usdt_amount: Optional[float] = None  # Alternative to quantity
    order_type: str = "MARKET"  # MARKET or LIMIT
    price: Optional[float] = None  # For limit orders

class BinanceCancelRequest(BaseModel):
    symbol: str
    order_id: int

@app.get("/api/binance/status")
async def get_binance_trading_status():
    """Get Binance trading status and configuration"""
    info = binance_trading.get_trading_info()
    
    return {
        "success": True,
        "data": info
    }

@app.get("/api/binance/balance")
async def get_binance_balance(asset: str = "USDT"):
    """Get balance for specific asset"""
    if not binance_trading.is_configured:
        raise HTTPException(status_code=400, detail="Binance trading not configured")
    
    balance = binance_trading.get_balance(asset)
    
    if balance is None:
        raise HTTPException(status_code=500, detail="Failed to fetch balance")
    
    return {
        "success": True,
        "asset": asset,
        "balance": balance
    }

@app.get("/api/binance/balances")
async def get_all_binance_balances():
    """Get all non-zero balances"""
    if not binance_trading.is_configured:
        raise HTTPException(status_code=400, detail="Binance trading not configured")
    
    balances = binance_trading.get_all_balances()
    
    return {
        "success": True,
        "data": balances
    }

@app.post("/api/binance/trade")
async def execute_binance_trade(request: BinanceTradeRequest):
    """Execute trade on Binance"""
    if not binance_trading.is_configured:
        raise HTTPException(status_code=400, detail="Binance trading not configured")
    
    try:
        # Calculate quantity if usdt_amount is provided
        if request.usdt_amount and not request.quantity:
            # Get current price
            from binance_api import binance_api
            current_price = binance_api.get_price(request.symbol)
            
            if not current_price:
                raise HTTPException(status_code=400, detail="Failed to get current price")
            
            request.quantity = binance_trading.calculate_quantity(
                request.symbol,
                request.usdt_amount,
                current_price
            )
        
        # Place order based on type
        if request.order_type.upper() == "MARKET":
            result = binance_trading.place_market_order(
                request.symbol,
                request.side,
                request.quantity
            )
        elif request.order_type.upper() == "LIMIT":
            if not request.price:
                raise HTTPException(status_code=400, detail="Price required for limit orders")
            
            result = binance_trading.place_limit_order(
                request.symbol,
                request.side,
                request.quantity,
                request.price
            )
        else:
            raise HTTPException(status_code=400, detail="Invalid order type")
        
        if not result:
            raise HTTPException(status_code=500, detail="Failed to place order")
        
        return {
            "success": True,
            "order": result
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error executing trade: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/binance/orders/open")
async def get_open_binance_orders(symbol: Optional[str] = None):
    """Get open orders"""
    if not binance_trading.is_configured:
        raise HTTPException(status_code=400, detail="Binance trading not configured")
    
    orders = binance_trading.get_open_orders(symbol)
    
    return {
        "success": True,
        "data": orders,
        "count": len(orders)
    }

@app.get("/api/binance/orders/{symbol}")
async def get_binance_order_history(symbol: str, limit: int = 50):
    """Get order history for a symbol"""
    if not binance_trading.is_configured:
        raise HTTPException(status_code=400, detail="Binance trading not configured")
    
    orders = binance_trading.get_all_orders(symbol, limit)
    
    return {
        "success": True,
        "data": orders,
        "count": len(orders)
    }

@app.get("/api/binance/trades/{symbol}")
async def get_binance_trade_history(symbol: str, limit: int = 50):
    """Get trade history for a symbol"""
    if not binance_trading.is_configured:
        raise HTTPException(status_code=400, detail="Binance trading not configured")
    
    trades = binance_trading.get_trade_history(symbol, limit)
    
    return {
        "success": True,
        "data": trades,
        "count": len(trades)
    }

@app.post("/api/binance/cancel")
async def cancel_binance_order(request: BinanceCancelRequest):
    """Cancel an order"""
    if not binance_trading.is_configured:
        raise HTTPException(status_code=400, detail="Binance trading not configured")
    
    result = binance_trading.cancel_order(request.symbol, request.order_id)
    
    if not result:
        raise HTTPException(status_code=500, detail="Failed to cancel order")
    
    return {
        "success": True,
        "data": result
    }

@app.get("/api/binance/order/status")
async def get_binance_order_status(symbol: str, order_id: int):
    """Get order status"""
    if not binance_trading.is_configured:
        raise HTTPException(status_code=400, detail="Binance trading not configured")
    
    status = binance_trading.get_order_status(symbol, order_id)
    
    if not status:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return {
        "success": True,
        "data": status
    }

@app.post("/api/binance/ai-trade")
async def execute_ai_binance_trade(symbol: str, usdt_amount: float = 10.0):
    """Execute AI-powered trade on Binance"""
    if not binance_trading.is_configured:
        raise HTTPException(status_code=400, detail="Binance trading not configured")
    
    try:
        # Get AI signal
        signal = ai_predictor.generate_signal(symbol.replace('/USDT', ''))
        
        # Check if signal is actionable
        if signal["signal"] == "HOLD":
            return {
                "success": False,
                "reason": "AI signal is HOLD - no trade executed",
                "signal": signal
            }
        
        # Get current price
        from binance_api import binance_api
        current_price = binance_api.get_price(symbol)
        
        if not current_price:
            raise HTTPException(status_code=400, detail="Failed to get current price")
        
        # Calculate quantity
        quantity = binance_trading.calculate_quantity(symbol, usdt_amount, current_price)
        
        # Execute trade
        result = binance_trading.place_market_order(
            symbol,
            signal["signal"],
            quantity
        )
        
        if not result:
            raise HTTPException(status_code=500, detail="Failed to execute trade")
        
        return {
            "success": True,
            "signal": signal,
            "order": result,
            "message": f"AI {signal['signal']} order executed successfully"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error executing AI trade: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    print("=" * 60)
    print("AI Trading Platform - Comprehensive Backend")
    print("WEEX AI Trading Hackathon Edition")
    print("=" * 60)
    print("Starting server on http://localhost:8000")
    print("API Documentation: http://localhost:8000/docs")
    print("Hackathon Info: http://localhost:8000/api/hackathon")
    print("=" * 60)
    uvicorn.run(app, host="0.0.0.0", port=8000)


# ============ Binance Trading Endpoints ============

class BinanceTradeRequest(BaseModel):
    symbol: str
    side: str  # BUY or SELL
    quantity: Optional[float] = None
    usdt_amount: Optional[float] = None  # Alternative to quantity
    order_type: str = "MARKET"  # MARKET or LIMIT
    price: Optional[float] = None  # For limit orders

class BinanceCancelRequest(BaseModel):
    symbol: str
    order_id: int

@app.get("/api/binance/status")
async def get_binance_trading_status():
    """Get Binance trading status and configuration"""
    info = binance_trading.get_trading_info()
    
    return {
        "success": True,
        "data": info
    }

@app.get("/api/binance/balance")
async def get_binance_balance(asset: str = "USDT"):
    """Get balance for specific asset"""
    if not binance_trading.is_configured:
        raise HTTPException(status_code=400, detail="Binance trading not configured")
    
    balance = binance_trading.get_balance(asset)
    
    if balance is None:
        raise HTTPException(status_code=500, detail="Failed to fetch balance")
    
    return {
        "success": True,
        "asset": asset,
        "balance": balance
    }

@app.get("/api/binance/balances")
async def get_all_binance_balances():
    """Get all non-zero balances"""
    if not binance_trading.is_configured:
        raise HTTPException(status_code=400, detail="Binance trading not configured")
    
    balances = binance_trading.get_all_balances()
    
    return {
        "success": True,
        "data": balances
    }

@app.post("/api/binance/trade")
async def execute_binance_trade(request: BinanceTradeRequest):
    """Execute trade on Binance"""
    if not binance_trading.is_configured:
        raise HTTPException(status_code=400, detail="Binance trading not configured")
    
    try:
        # Calculate quantity if usdt_amount is provided
        if request.usdt_amount and not request.quantity:
            # Get current price
            from binance_api import binance_api
            current_price = binance_api.get_price(request.symbol)
            
            if not current_price:
                raise HTTPException(status_code=400, detail="Failed to get current price")
            
            request.quantity = binance_trading.calculate_quantity(
                request.symbol,
                request.usdt_amount,
                current_price
            )
        
        # Place order based on type
        if request.order_type.upper() == "MARKET":
            result = binance_trading.place_market_order(
                request.symbol,
                request.side,
                request.quantity
            )
        elif request.order_type.upper() == "LIMIT":
            if not request.price:
                raise HTTPException(status_code=400, detail="Price required for limit orders")
            
            result = binance_trading.place_limit_order(
                request.symbol,
                request.side,
                request.quantity,
                request.price
            )
        else:
            raise HTTPException(status_code=400, detail="Invalid order type")
        
        if not result:
            raise HTTPException(status_code=500, detail="Failed to place order")
        
        return {
            "success": True,
            "order": result
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error executing trade: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/binance/orders/open")
async def get_open_binance_orders(symbol: Optional[str] = None):
    """Get open orders"""
    if not binance_trading.is_configured:
        raise HTTPException(status_code=400, detail="Binance trading not configured")
    
    orders = binance_trading.get_open_orders(symbol)
    
    return {
        "success": True,
        "data": orders,
        "count": len(orders)
    }

@app.get("/api/binance/orders/{symbol}")
async def get_binance_order_history(symbol: str, limit: int = 50):
    """Get order history for a symbol"""
    if not binance_trading.is_configured:
        raise HTTPException(status_code=400, detail="Binance trading not configured")
    
    orders = binance_trading.get_all_orders(symbol, limit)
    
    return {
        "success": True,
        "data": orders,
        "count": len(orders)
    }

@app.get("/api/binance/trades/{symbol}")
async def get_binance_trade_history(symbol: str, limit: int = 50):
    """Get trade history for a symbol"""
    if not binance_trading.is_configured:
        raise HTTPException(status_code=400, detail="Binance trading not configured")
    
    trades = binance_trading.get_trade_history(symbol, limit)
    
    return {
        "success": True,
        "data": trades,
        "count": len(trades)
    }

@app.post("/api/binance/cancel")
async def cancel_binance_order(request: BinanceCancelRequest):
    """Cancel an order"""
    if not binance_trading.is_configured:
        raise HTTPException(status_code=400, detail="Binance trading not configured")
    
    result = binance_trading.cancel_order(request.symbol, request.order_id)
    
    if not result:
        raise HTTPException(status_code=500, detail="Failed to cancel order")
    
    return {
        "success": True,
        "data": result
    }

@app.get("/api/binance/order/status")
async def get_binance_order_status(symbol: str, order_id: int):
    """Get order status"""
    if not binance_trading.is_configured:
        raise HTTPException(status_code=400, detail="Binance trading not configured")
    
    status = binance_trading.get_order_status(symbol, order_id)
    
    if not status:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return {
        "success": True,
        "data": status
    }

@app.post("/api/binance/ai-trade")
async def execute_ai_binance_trade(symbol: str, usdt_amount: float = 10.0):
    """Execute AI-powered trade on Binance"""
    if not binance_trading.is_configured:
        raise HTTPException(status_code=400, detail="Binance trading not configured")
    
    try:
        # Get AI signal
        signal = ai_predictor.generate_signal(symbol.replace('/USDT', ''))
        
        # Check if signal is actionable
        if signal["signal"] == "HOLD":
            return {
                "success": False,
                "reason": "AI signal is HOLD - no trade executed",
                "signal": signal
            }
        
        # Get current price
        from binance_api import binance_api
        current_price = binance_api.get_price(symbol)
        
        if not current_price:
            raise HTTPException(status_code=400, detail="Failed to get current price")
        
        # Calculate quantity
        quantity = binance_trading.calculate_quantity(symbol, usdt_amount, current_price)
        
        # Execute trade
        result = binance_trading.place_market_order(
            symbol,
            signal["signal"],
            quantity
        )
        
        if not result:
            raise HTTPException(status_code=500, detail="Failed to execute trade")
        
        return {
            "success": True,
            "signal": signal,
            "order": result,
            "message": f"AI {signal['signal']} order executed successfully"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error executing AI trade: {e}")
        raise HTTPException(status_code=500, detail=str(e))
