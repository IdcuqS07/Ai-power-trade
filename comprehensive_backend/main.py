"""
AI Trading Platform - Comprehensive Backend
Menggabungkan semua fitur: AI Prediction, Smart Contract, Oracle, Trading Engine
Integrated with WEEX Exchange Live Data
"""
from fastapi import FastAPI, WebSocket, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Any, Dict, List, Optional
import asyncio
import json
from datetime import datetime
from pathlib import Path
import uvicorn
import random
import hashlib
import numpy as np
import logging
import time
import os
from dotenv import load_dotenv

# Configure logging early so imported modules can use it safely
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

BACKEND_DIR = Path(__file__).resolve().parent
load_dotenv(BACKEND_DIR / ".env")
load_dotenv(BACKEND_DIR / ".env.local", override=True)

PRICE_SYMBOLS = ["BTC", "ETH", "BNB", "SOL", "XRP", "ADA", "MATIC", "LINK"]
CANDLE_INTERVAL_MS = {
    "1m": 60_000,
    "5m": 300_000,
    "15m": 900_000,
    "1h": 3_600_000,
    "4h": 14_400_000,
    "1d": 86_400_000,
}
DEFAULT_CANDLE_LIMIT = 48
MAX_CANDLE_LIMIT = 500
EXPLAINABILITY_CACHE_DURATION_SECONDS = 1800


def env_flag(name: str, default: bool = False) -> bool:
    raw_value = os.getenv(name)
    if raw_value is None:
        return default
    return raw_value.strip().lower() in {"1", "true", "yes", "on"}


def build_sentiment_fallback(symbol: str, reason: str = "CoinGecko sentiment unavailable") -> Dict[str, Any]:
    """Return a neutral sentiment payload when the external provider is throttled."""
    normalized_symbol = symbol.upper().strip()
    return {
        "symbol": normalized_symbol,
        "sentiment_up": 50,
        "sentiment_down": 50,
        "twitter_followers": 0,
        "reddit_subscribers": 0,
        "github_stars": 0,
        "github_forks": 0,
        "timestamp": datetime.now().isoformat(),
        "source": "Fallback",
        "fallback": True,
        "message": reason,
    }

# Import Binance API, Binance Trading and Backtesting
from binance_api import binance_api
from binance_trading import binance_trading
from backtesting import BacktestEngine
from blockchain_service import blockchain_service
from provider_registry import get_provider_registry
from settlement_service import settlement_service

# Import Enhanced AI Predictors
try:
    from enhanced_predictor import enhanced_predictor
    from lstm_predictor import lstm_predictor
    from coingecko_api import coingecko_api
    ENHANCED_AI_AVAILABLE = True
    logger.info("✓ Enhanced AI predictors loaded")
except ImportError as e:
    ENHANCED_AI_AVAILABLE = False
    logger.warning(f"Enhanced AI not available: {e}")

try:
    from sosovalue_service import sosovalue_service
    SOSOVALUE_AVAILABLE = True
    logger.info("✓ SoSoValue service loaded")
except Exception as e:
    SOSOVALUE_AVAILABLE = False
    sosovalue_service = None
    logger.warning(f"SoSoValue service not available: {e}")

try:
    from cryptopanic_service import cryptopanic_service
    CRYPTOPANIC_AVAILABLE = True
    logger.info("✓ CryptoPanic service loaded")
except Exception as e:
    CRYPTOPANIC_AVAILABLE = False
    cryptopanic_service = None
    logger.warning(f"CryptoPanic service not available: {e}")

try:
    from openrouter_service import openrouter_service
    OPENROUTER_AVAILABLE = True
    logger.info("✓ OpenRouter service loaded")
except Exception as e:
    OPENROUTER_AVAILABLE = False
    openrouter_service = None
    logger.warning(f"OpenRouter service not available: {e}")

try:
    from groq_service import groq_service
    GROQ_AVAILABLE = True
    logger.info("✓ Groq service loaded (free tier)")
except Exception as e:
    GROQ_AVAILABLE = False
    groq_service = None
    logger.warning(f"Groq service not available: {e}")

try:
    from sodex_service import sodex_service
    SODEX_AVAILABLE = True
    logger.info("✓ SoDEX service loaded")
except Exception as e:
    SODEX_AVAILABLE = False
    sodex_service = None
    logger.warning(f"SoDEX service not available: {e}")

try:
    from ssi_service import ssi_service
    SSI_AVAILABLE = True
    logger.info("✓ SSI service loaded")
except Exception as e:
    SSI_AVAILABLE = False
    ssi_service = None
    logger.warning(f"SSI service not available: {e}")

# Import Database and Auth
from database import init_db
from auth_routes import router as auth_router
from user_routes import router as user_router

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
async def startup_core_services():
    init_db()
    logger.info("✓ Database initialized")
    seed_price_history()
    asyncio.create_task(initialize_price_history_async())

# Include auth and user routes
app.include_router(auth_router)
app.include_router(user_router)

# ============ Initialize APIs ============
# Use Binance as primary and only data source
USE_BINANCE = True
USE_LIVE_DATA = True

logger.info("✓ Using Binance API for all market data")

# ============ Global State ============
trading_state = {
    "balance": 10000.0,
    "pnl": 0.0,
    "positions": [],
    "price_history": {
        symbol: [] for symbol in PRICE_SYMBOLS
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
    for symbol in PRICE_SYMBOLS:
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

def seed_price_history():
    """Seed history so the API can respond immediately during local startup."""
    for symbol in PRICE_SYMBOLS:
        if not trading_state["price_history"][symbol]:
            trading_state["price_history"][symbol] = _generate_simulated_history(symbol)

    logger.info("✓ Seeded simulated price history for fast startup")

async def initialize_price_history_async():
    """Refresh history in the background without delaying server startup."""
    try:
        await asyncio.to_thread(initialize_price_history)
    except Exception as e:
        logger.warning(f"Background price history refresh failed: {e}")


def clamp_candle_limit(limit: int) -> int:
    return max(12, min(int(limit or DEFAULT_CANDLE_LIMIT), MAX_CANDLE_LIMIT))


def build_explainability_cache_response(
    cached_payload: Dict[str, Any],
    *,
    cache_duration: int,
    cached_only: bool = False,
    generation_locked: bool = False,
    message: Optional[str] = None,
) -> Dict[str, Any]:
    response = dict(cached_payload or {})
    cached_at = float(response.get("cached_at", time.time()) or time.time())
    cache_age = max(0.0, time.time() - cached_at)
    next_refresh = max(0, cache_duration - cache_age)
    signal_available = bool((response.get("data") or {}).get("explain"))

    response["cache_hit"] = True
    response["cache_age_seconds"] = cache_age
    response["cache_duration_seconds"] = cache_duration
    response["next_refresh_in_seconds"] = int(next_refresh)
    response["generation_allowed"] = next_refresh <= 0
    response["generation_locked"] = generation_locked
    response["signal_available"] = signal_available

    if cached_only:
        response["cached_only"] = True

    if message:
        response["message"] = message

    return response


def build_fallback_candles(symbol: str, interval: str, limit: int) -> List[Dict]:
    history = trading_state["price_history"].get(symbol) or _generate_simulated_history(symbol)
    closes = history[-limit:]
    step_ms = CANDLE_INTERVAL_MS[interval]
    end_timestamp = int(time.time() * 1000)
    candles = []
    previous_close = closes[0] if closes else 0.0

    for index, close_price in enumerate(closes):
        open_price = previous_close if index else close_price
        high_price = max(open_price, close_price) * 1.002
        low_price = min(open_price, close_price) * 0.998

        candles.append({
            "timestamp": end_timestamp - ((len(closes) - 1 - index) * step_ms),
            "open": round(open_price, 6),
            "high": round(high_price, 6),
            "low": round(low_price, 6),
            "close": round(close_price, 6),
            "volume": round(max(1.0, close_price * 0.05), 6),
        })
        previous_close = close_price

    return candles


def safe_float(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default

# ============ Models ============
class TradeRequest(BaseModel):
    symbol: str
    force_execute: bool = False
    trade_type: Optional[str] = None
    amount: Optional[float] = None
    price: Optional[float] = None
    wallet_address: Optional[str] = None
    confidence: Optional[float] = None
    risk_score: Optional[float] = None
    execution_provider: Optional[str] = None
    sodex_account_id: Optional[str] = None
    sodex_signed_order: Optional[Dict[str, Any]] = None

class SodexOrderPreparationRequest(BaseModel):
    symbol: str
    trade_type: str
    amount: float
    price: float
    wallet_address: Optional[str] = None
    sodex_account_id: Optional[str] = None

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
    
    performance = trading_engine.get_performance()
    performance_cache["data"] = performance
    performance_cache["timestamp"] = current_time
    return performance

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


@app.get("/api/health")
async def get_health():
    """Lightweight healthcheck for platform load balancers."""
    return {
        "success": True,
        "status": "ok",
        "service": "comprehensive_backend",
        "worker_enabled": env_flag("ENABLE_SETTLEMENT_WORKER", False),
        "database": "configured" if os.getenv("DATABASE_URL") else "sqlite-default",
    }

@app.get("/api/integrations/providers")
async def get_integration_providers():
    """Return the app-level feature-to-provider mapping and readiness summary."""
    return {
        "success": True,
        "data": get_provider_registry(),
    }


@app.get("/api/ssi/status")
async def get_ssi_status():
    """Get SSI participation-layer status and configuration."""
    if not SSI_AVAILABLE or not ssi_service:
        raise HTTPException(status_code=503, detail="SSI backend service is not available")

    return {
        "success": True,
        "data": ssi_service.get_service_status(),
    }


@app.get("/api/ssi/overview/{address}")
async def get_ssi_overview(
    address: str,
    include_sodex: bool = True,
    account_id: str = None,
    history_limit: int = 120,
):
    """Build an SSI participation overview from holdings and execution history."""
    if not SSI_AVAILABLE or not ssi_service:
        raise HTTPException(status_code=503, detail="SSI backend service is not available")

    if not ssi_service.is_available():
        raise HTTPException(status_code=503, detail="SSI participation layer is disabled")

    normalized_limit = min(max(int(history_limit or 120), 1), 250)
    token_info = blockchain_service.get_token_info()
    balance = blockchain_service.get_balance(address)
    can_claim = blockchain_service.can_claim_faucet(address)
    cooldown = blockchain_service.time_until_next_claim(address)
    history_payload = build_trade_history_response(
        limit=normalized_limit,
        user_address=address,
        account_id=account_id,
        include_sodex=include_sodex,
        filter_primary_by_user=True,
        use_cache=True,
    )
    performance = _calculate_trade_performance(history_payload.get("data") or [])

    return {
        "success": True,
        "data": ssi_service.build_participation_overview(
            address=address,
            token_balance=balance,
            token_symbol=token_info.get("symbol") or "atUSDT",
            can_claim_faucet=can_claim,
            cooldown_seconds=cooldown,
            performance=performance,
            history_count=history_payload.get("count", 0),
            history_sources=history_payload.get("sources", {}),
            history_warnings=history_payload.get("warnings", []),
        ),
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
    prices = {}
    
    # Get live data from Binance
    for symbol in PRICE_SYMBOLS:
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

@app.get("/api/market/candles/{symbol}")
async def get_market_candles(symbol: str, interval: str = "1h", limit: int = DEFAULT_CANDLE_LIMIT):
    """Get candlestick data for charting."""
    normalized_symbol = symbol.upper()

    if normalized_symbol not in PRICE_SYMBOLS:
        raise HTTPException(status_code=404, detail="Symbol not found")

    if interval not in CANDLE_INTERVAL_MS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported interval '{interval}'. Supported intervals: {', '.join(CANDLE_INTERVAL_MS.keys())}",
        )

    normalized_limit = clamp_candle_limit(limit)
    pair = f"{normalized_symbol}/USDT"
    candles = binance_api.get_klines(pair, interval=interval, limit=normalized_limit)
    source = "Binance"

    if not candles:
        candles = build_fallback_candles(normalized_symbol, interval, normalized_limit)
        source = "Simulated fallback"

    return {
        "success": True,
        "data": {
            "symbol": normalized_symbol,
            "pair": pair,
            "interval": interval,
            "limit": len(candles),
            "candles": candles,
        },
        "source": source,
    }

def _get_simulated_price(symbol: str) -> Dict:
    """Get simulated price for a symbol"""
    history = trading_state["price_history"][symbol]
    if not history:
        history.extend(_generate_simulated_history(symbol))

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
    symbol = request.symbol.upper().strip()
    
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

    requested_provider = str(request.execution_provider or "").lower().strip()
    wants_sodex = requested_provider == "sodex" or bool(request.sodex_signed_order)

    if wants_sodex:
        if not request.sodex_signed_order:
            return {
                "success": False,
                "stage": "sodex_execution",
                "reason": "Signed SoDEX order payload is required for live execution",
                "execution_provider": "SoDEX",
                "oracle_verification": oracle_verification,
                "validation": validation,
            }

        try:
            service = require_sodex_service()
            prepared_order = request.sodex_signed_order
            sodex_result = service.submit_prepared_order(
                request_body=prepared_order.get("request_body") or {},
                signature=str(prepared_order.get("signature") or ""),
                nonce=int(prepared_order.get("nonce")),
                endpoint_path=str(prepared_order.get("endpoint_path") or ""),
                api_key=prepared_order.get("api_key"),
            )
            results = sodex_result if isinstance(sodex_result, list) else [sodex_result]
            primary_result = results[0] if results else {}

            if str(primary_result.get("code", "0")) not in {"0", "200", "None"}:
                return {
                    "success": False,
                    "stage": "sodex_execution",
                    "reason": primary_result.get("error") or "SoDEX order was rejected",
                    "execution_provider": "SoDEX",
                    "sodex": {
                        "result": sodex_result,
                        "market_type": prepared_order.get("market_type"),
                    },
                    "oracle_verification": oracle_verification,
                    "validation": validation,
                }

            trade_side = "SELL" if str(request.trade_type or "").upper() in {"SELL", "SHORT"} else "BUY"
            execution_price = request.price or current_price
            execution_amount = safe_float(request.amount)
            execution_quantity = safe_float(prepared_order.get("estimated_quantity"))
            order_identifier = primary_result.get("orderID") or prepared_order.get("cl_ord_id") or f"SODEX-{int(time.time() * 1000)}"
            executed_trade = {
                "trade_id": str(order_identifier),
                "symbol": symbol,
                "type": trade_side,
                "amount": execution_amount,
                "price": execution_price,
                "quantity": execution_quantity,
                "value": execution_amount,
                "status": "Submitted",
                "wallet_address": request.wallet_address,
                "tx_hash": None,
                "timestamp": datetime.now().isoformat(),
                "execution_provider": "SoDEX",
                "exchange_symbol": prepared_order.get("symbol_name"),
                "cl_ord_id": primary_result.get("clOrdID") or prepared_order.get("cl_ord_id"),
                "exchange_order_id": primary_result.get("orderID"),
            }

            return {
                "success": True,
                "execution_provider": "SoDEX",
                "preview_only": False,
                "trade": executed_trade,
                "oracle_verification": oracle_verification,
                "validation": validation,
                "on_chain_record": {
                    "status": "skipped",
                    "reason": "External SoDEX execution does not use the internal settlement contract",
                },
                "settlement": {
                    "status": "Submitted to SoDEX",
                    "source": "SoDEX",
                },
                "sodex": {
                    "market_type": prepared_order.get("market_type"),
                    "symbol_name": prepared_order.get("symbol_name"),
                    "endpoint_path": prepared_order.get("endpoint_path"),
                    "result": sodex_result,
                },
            }
        except Exception as e:
            logger.error(f"SoDEX execution error: {e}")
            return {
                "success": False,
                "stage": "sodex_execution",
                "reason": str(e),
                "execution_provider": "SoDEX",
                "oracle_verification": oracle_verification,
                "validation": validation,
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

def _build_trade_history_cache_key(
    limit: int,
    user_address: Optional[str] = None,
    symbol: Optional[str] = None,
    account_id: Optional[str] = None,
    include_sodex: bool = False,
    filter_primary_by_user: bool = False,
) -> str:
    normalized_user = str(user_address or "").strip().lower() or "*"
    normalized_symbol = str(symbol or "").strip().upper() or "*"
    normalized_account = str(account_id or "").strip() or "*"
    return "|".join(
        [
            f"limit={limit}",
            f"user={normalized_user}",
            f"symbol={normalized_symbol}",
            f"account={normalized_account}",
            f"sodex={int(include_sodex)}",
            f"filter_primary={int(filter_primary_by_user)}",
        ]
    )


def _trade_timestamp_key(value: Any) -> float:
    if isinstance(value, (int, float)):
        return float(value)

    text = str(value or "").strip()
    if not text:
        return 0.0

    try:
        return datetime.fromisoformat(text.replace("Z", "+00:00")).timestamp()
    except ValueError:
        return 0.0


def _normalize_trade_record(trade: Dict[str, Any], source_label: str = "Execution") -> Dict[str, Any]:
    on_chain_record = trade.get("on_chain_record") if isinstance(trade.get("on_chain_record"), dict) else {}
    amount = safe_float(
        trade.get("amount"),
        safe_float(trade.get("value"), safe_float(trade.get("quantity"))),
    )
    quantity = safe_float(trade.get("quantity"))
    price = safe_float(trade.get("price"))

    return {
        "trade_id": trade.get("trade_id") or trade.get("id"),
        "user": trade.get("user") or trade.get("wallet_address") or trade.get("trader"),
        "wallet_address": trade.get("wallet_address"),
        "symbol": str(trade.get("symbol") or "UNKNOWN").upper(),
        "type": str(trade.get("type") or trade.get("trade_type") or trade.get("signal") or "BUY").upper(),
        "amount": amount,
        "price": price,
        "profit_loss": safe_float(trade.get("profit_loss"), safe_float(trade.get("pnl"))),
        "timestamp": trade.get("timestamp") or trade.get("created_at") or datetime.now().isoformat(),
        "status": trade.get("status") or ("Settled" if trade.get("settled") else "Filled"),
        "quantity": quantity,
        "value": safe_float(trade.get("value"), amount or (quantity * price)),
        "confidence": trade.get("confidence"),
        "tx_hash": trade.get("tx_hash") or trade.get("transaction_hash"),
        "record_hash": trade.get("record_hash") or trade.get("block_hash") or on_chain_record.get("block_hash"),
        "exchange_order_id": trade.get("exchange_order_id"),
        "cl_ord_id": trade.get("cl_ord_id"),
        "execution_provider": trade.get("execution_provider"),
        "source": trade.get("source") or source_label,
    }


def _trade_matches_filters(
    trade: Dict[str, Any],
    *,
    user_address: Optional[str] = None,
    symbol: Optional[str] = None,
) -> bool:
    normalized_symbol = str(symbol or "").strip().upper()
    if normalized_symbol and str(trade.get("symbol") or "").upper() != normalized_symbol:
        return False

    normalized_user = str(user_address or "").strip().lower()
    if normalized_user:
        identities = [
            trade.get("user"),
            trade.get("wallet_address"),
            trade.get("trader"),
        ]
        if not any(str(identity or "").strip().lower() == normalized_user for identity in identities):
            return False

    return True


def _trade_identity(trade: Dict[str, Any]) -> str:
    for key in ("tx_hash", "record_hash", "exchange_order_id", "cl_ord_id"):
        value = str(trade.get(key) or "").strip()
        if value:
            return f"{key}:{value.lower()}"

    return ":".join(
        [
            str(trade.get("source") or trade.get("execution_provider") or "trade").lower(),
            str(trade.get("trade_id") or "unknown").lower(),
            str(trade.get("symbol") or "unknown").lower(),
            str(trade.get("type") or "unknown").lower(),
            str(trade.get("timestamp") or "").lower(),
            f"{safe_float(trade.get('amount'), safe_float(trade.get('value'))):.8f}",
        ]
    )


def _merge_trade_records(existing: Dict[str, Any], incoming: Dict[str, Any]) -> Dict[str, Any]:
    merged = dict(existing)
    for key, value in incoming.items():
        if value not in (None, "", []):
            merged[key] = value
    return merged


def _merge_trade_history(*collections: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    merged: Dict[str, Dict[str, Any]] = {}

    for collection in collections:
        for trade in collection:
            normalized_trade = _normalize_trade_record(trade)
            identity = _trade_identity(normalized_trade)
            existing = merged.get(identity)
            merged[identity] = (
                _merge_trade_records(existing, normalized_trade) if existing else normalized_trade
            )

    return sorted(
        merged.values(),
        key=lambda trade: _trade_timestamp_key(trade.get("timestamp")),
        reverse=True,
    )


def _get_memory_trade_history(
    limit: int,
    *,
    user_address: Optional[str] = None,
    symbol: Optional[str] = None,
) -> List[Dict[str, Any]]:
    recent_trades = trading_engine.trades[-limit:] if limit > 0 else trading_engine.trades
    history = []

    for trade in reversed(recent_trades):
        normalized_trade = _normalize_trade_record(
            {
                **trade,
                "status": trade.get("status") or "Preview",
                "source": "Memory",
            },
            source_label="Memory",
        )
        if _trade_matches_filters(normalized_trade, user_address=user_address, symbol=symbol):
            history.append(normalized_trade)

    return history


def _get_settlement_trade_history(
    limit: int,
    *,
    user_address: Optional[str] = None,
    symbol: Optional[str] = None,
) -> List[Dict[str, Any]]:
    trades = []
    trade_counter = settlement_service.contract.functions.tradeCounter().call()

    for trade_id in range(trade_counter, 0, -1):
        try:
            trade_data = settlement_service.contract.functions.getTrade(trade_id).call()
            amount = float(trade_data[4]) / 1e18
            price = safe_float(trade_data[5])
            trade = {
                "trade_id": trade_data[0],
                "user": trade_data[1],
                "symbol": trade_data[2],
                "type": trade_data[3],
                "amount": amount,
                "price": price,
                "profit_loss": float(trade_data[6]) / 1e18 if trade_data[8] else 0,
                "timestamp": datetime.fromtimestamp(trade_data[7]).isoformat(),
                "settled": trade_data[8],
                "status": "Settled" if trade_data[8] else "Pending settlement",
                "quantity": amount / price if price else 0,
                "value": amount,
                "confidence": 0.85,
                "source": "Settlement",
            }

            if not _trade_matches_filters(trade, user_address=user_address, symbol=symbol):
                continue

            trades.append(_normalize_trade_record(trade, source_label="Settlement"))
            if limit > 0 and len(trades) >= limit:
                break
        except Exception as e:
            logger.debug(f"Error fetching trade {trade_id}: {e}")
            continue

    return trades


def _collect_primary_trade_history(
    limit: int,
    *,
    user_address: Optional[str] = None,
    symbol: Optional[str] = None,
) -> Dict[str, Any]:
    if settlement_service.is_ready():
        try:
            trades = _get_settlement_trade_history(limit, user_address=user_address, symbol=symbol)
            return {
                "trades": trades,
                "source": "settlement",
                "status": "active",
                "blockchain_available": True,
                "warning": None,
            }
        except Exception as e:
            logger.error(f"Settlement history fetch failed, falling back to memory: {e}")
            trades = _get_memory_trade_history(limit, user_address=user_address, symbol=symbol)
            return {
                "trades": trades,
                "source": "memory",
                "status": "fallback",
                "blockchain_available": False,
                "warning": f"Settlement history unavailable: {e}",
            }

    logger.info("Settlement contract unavailable, using in-memory trade history fallback")
    return {
        "trades": _get_memory_trade_history(limit, user_address=user_address, symbol=symbol),
        "source": "memory",
        "status": "fallback",
        "blockchain_available": False,
        "warning": None,
    }


def _collect_sodex_trade_history(
    limit: int,
    *,
    enabled: bool,
    user_address: Optional[str] = None,
    symbol: Optional[str] = None,
    account_id: Optional[str] = None,
) -> Dict[str, Any]:
    if not enabled:
        return {
            "trades": [],
            "status": "disabled",
            "count": 0,
            "source": None,
            "error": None,
        }

    if not user_address:
        return {
            "trades": [],
            "status": "skipped_missing_user_address",
            "count": 0,
            "source": None,
            "error": None,
        }

    if not SODEX_AVAILABLE or not sodex_service or not sodex_service.is_available():
        return {
            "trades": [],
            "status": "unavailable",
            "count": 0,
            "source": None,
            "error": None,
        }

    try:
        trades = sodex_service.get_account_trades(
            user_address=user_address,
            symbol=symbol,
            limit=limit,
            account_id=account_id,
        )
        normalized = sodex_service.normalize_history_items(trades)
        source = "account_trades"

        if not normalized:
            orders = sodex_service.get_account_order_history(
                user_address=user_address,
                symbol=symbol,
                limit=limit,
                account_id=account_id,
            )
            normalized = sodex_service.normalize_history_items(orders)
            source = "order_history" if normalized else "empty"

        return {
            "trades": normalized,
            "status": "included" if normalized else "empty",
            "count": len(normalized),
            "source": source,
            "error": None,
        }
    except Exception as e:
        logger.error(f"SoDEX history aggregation failed: {e}")
        return {
            "trades": [],
            "status": "error",
            "count": 0,
            "source": None,
            "error": str(e),
        }


def _calculate_trade_performance(trades: List[Dict[str, Any]]) -> Dict[str, Any]:
    if not trades:
        return {
            "total_trades": 0,
            "winning_trades": 0,
            "losing_trades": 0,
            "win_rate": 0,
            "total_profit": 0,
            "avg_profit": 0,
            "best_trade": 0,
            "worst_trade": 0,
            "pending_trades": 0,
            "total_volume": 0,
        }

    pnl_values = [safe_float(trade.get("profit_loss")) for trade in trades]
    winning_trades = [value for value in pnl_values if value > 0]
    total_profit = sum(pnl_values)
    total_volume = sum(
        safe_float(trade.get("amount"), safe_float(trade.get("value")))
        for trade in trades
    )
    pending_trades = sum(
        1
        for trade in trades
        if any(
            keyword in str(trade.get("status") or "").lower()
            for keyword in ("submit", "process", "pending")
        )
    )

    return {
        "total_trades": len(trades),
        "winning_trades": len(winning_trades),
        "losing_trades": len(trades) - len(winning_trades),
        "win_rate": round(len(winning_trades) / len(trades) * 100, 2),
        "total_profit": round(total_profit, 2),
        "avg_profit": round(total_profit / len(trades), 2),
        "best_trade": round(max(pnl_values), 2),
        "worst_trade": round(min(pnl_values), 2),
        "pending_trades": pending_trades,
        "total_volume": round(total_volume, 2),
    }


def build_trade_history_response(
    limit: int = 20,
    *,
    user_address: Optional[str] = None,
    symbol: Optional[str] = None,
    account_id: Optional[str] = None,
    include_sodex: Optional[bool] = None,
    filter_primary_by_user: bool = False,
    use_cache: bool = True,
) -> Dict[str, Any]:
    import time

    normalized_limit = min(max(int(limit or 20), 1), 250)
    normalized_symbol = str(symbol or "").strip().upper() or None
    include_sodex_history = bool(include_sodex) if include_sodex is not None else bool(user_address)
    primary_user_filter = user_address if filter_primary_by_user else None
    cache_key = _build_trade_history_cache_key(
        normalized_limit,
        user_address=user_address,
        symbol=normalized_symbol,
        account_id=account_id,
        include_sodex=include_sodex_history,
        filter_primary_by_user=filter_primary_by_user,
    )

    if use_cache and trade_history_cache.get("data") and trade_history_cache.get("key") == cache_key:
        current_time = time.time()
        if (current_time - trade_history_cache["timestamp"]) < trade_history_cache["ttl"]:
            logger.debug("Using cached trade history")
            return trade_history_cache["data"]

    primary_result = _collect_primary_trade_history(
        normalized_limit,
        user_address=primary_user_filter,
        symbol=normalized_symbol,
    )
    sodex_result = _collect_sodex_trade_history(
        normalized_limit,
        enabled=include_sodex_history,
        user_address=user_address,
        symbol=normalized_symbol,
        account_id=account_id,
    )
    merged_history = _merge_trade_history(primary_result["trades"], sodex_result["trades"])[:normalized_limit]

    warnings = []
    if primary_result.get("warning"):
        warnings.append(primary_result["warning"])
    if sodex_result.get("error"):
        warnings.append(f"SoDEX history unavailable: {sodex_result['error']}")

    response = {
        "success": True,
        "data": merged_history,
        "count": len(merged_history),
        "source": "aggregated" if sodex_result.get("count") else primary_result["source"],
        "sources": {
            "primary": {
                "name": primary_result["source"],
                "status": primary_result["status"],
                "count": len(primary_result["trades"]),
                "blockchain_available": primary_result["blockchain_available"],
            },
            "sodex": {
                "name": "sodex",
                "status": sodex_result["status"],
                "count": sodex_result["count"],
                "source": sodex_result["source"],
            },
        },
        "blockchain_available": primary_result["blockchain_available"],
        "sodex_available": bool(SODEX_AVAILABLE and sodex_service and sodex_service.is_available()),
        "filters": {
            "user_address": user_address,
            "symbol": normalized_symbol,
            "account_id": account_id,
            "include_sodex": include_sodex_history,
            "filter_primary_by_user": filter_primary_by_user,
            "limit": normalized_limit,
        },
    }

    if warnings:
        response["warnings"] = warnings

    if use_cache:
        trade_history_cache["data"] = response
        trade_history_cache["key"] = cache_key
        trade_history_cache["timestamp"] = time.time()

    return response


@app.get("/api/trades/history")
async def get_trade_history(
    limit: int = 20,
    user_address: str = None,
    symbol: str = None,
    account_id: str = None,
    include_sodex: Optional[bool] = None,
    filter_primary_by_user: bool = False,
):
    """Get a unified execution history across internal, settlement, and optional SoDEX sources."""
    try:
        return build_trade_history_response(
            limit=limit,
            user_address=user_address,
            symbol=symbol,
            account_id=account_id,
            include_sodex=include_sodex,
            filter_primary_by_user=filter_primary_by_user,
            use_cache=True,
        )
    except Exception as e:
        logger.error(f"Error fetching trade history: {e}")
        trades = _get_memory_trade_history(
            min(max(int(limit or 20), 1), 250),
            user_address=user_address if filter_primary_by_user else None,
            symbol=symbol,
        )
        return {
            "success": True,
            "data": trades,
            "count": len(trades),
            "source": "memory",
            "blockchain_available": False,
            "warnings": [f"Unified history fallback active: {e}"],
        }


@app.get("/api/trades/performance")
async def get_performance(
    user_address: str = None,
    symbol: str = None,
    account_id: str = None,
    include_sodex: Optional[bool] = None,
    filter_primary_by_user: bool = False,
    limit: int = 250,
):
    """Get trading performance, optionally based on the unified trade history feed."""
    wants_unified_history = bool(
        user_address or symbol or account_id or filter_primary_by_user or include_sodex is not None
    )

    if wants_unified_history:
        history_payload = build_trade_history_response(
            limit=limit,
            user_address=user_address,
            symbol=symbol,
            account_id=account_id,
            include_sodex=include_sodex,
            filter_primary_by_user=filter_primary_by_user,
            use_cache=True,
        )
        performance = _calculate_trade_performance(history_payload.get("data") or [])
        return {
            "success": True,
            "data": performance,
            "source": history_payload.get("source"),
            "sources": history_payload.get("sources", {}),
            "count": history_payload.get("count", 0),
            "filters": history_payload.get("filters", {}),
            "warnings": history_payload.get("warnings", []),
        }

    try:
        if not settlement_service.is_ready():
            logger.info("Settlement contract unavailable, using in-memory performance fallback")
            performance = trading_engine.get_performance()
            return {
                "success": True,
                "data": performance,
                "source": "memory",
                "blockchain_available": False,
            }

        trades = []
        trade_counter = settlement_service.contract.functions.tradeCounter().call()

        for trade_id in range(1, trade_counter + 1):
            try:
                trade_data = settlement_service.contract.functions.getTrade(trade_id).call()

                if trade_data[8]:
                    trades.append({"profit_loss": float(trade_data[6]) / 1e18})
            except Exception as e:
                logger.debug(f"Error fetching trade {trade_id}: {e}")
                continue

        performance = _calculate_trade_performance(trades)
        return {"success": True, "data": performance}
    except Exception as e:
        logger.error(f"Error calculating performance: {e}")
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

# ============ Backtesting Endpoints ============

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
        if not blockchain_service.is_ready():
            raise HTTPException(
                status_code=503,
                detail="Blockchain service is not ready to read atUSDT balances on Polygon Amoy"
            )

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
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/blockchain/claim-faucet")
async def claim_faucet_tokens(request: dict):
    """
    Claim faucet tokens - user must sign transaction from frontend
    This endpoint returns transaction data for user to sign
    """
    try:
        address = request.get("address")
        if not address:
            raise HTTPException(status_code=400, detail="Address required")
        
        if not blockchain_service.is_ready():
            raise HTTPException(
                status_code=503,
                detail="Blockchain service unavailable"
            )
        
        # Check if can claim
        can_claim = blockchain_service.can_claim_faucet(address)
        if not can_claim:
            cooldown = blockchain_service.time_until_next_claim(address)
            raise HTTPException(
                status_code=400,
                detail=f"Faucet cooldown active. Wait {round(cooldown/3600, 1)} hours"
            )
        
        # Return transaction data for frontend to sign
        return {
            "success": True,
            "data": {
                "contract_address": blockchain_service.contract_address,
                "function": "claimFaucet",
                "params": [],
                "message": "Sign this transaction in your wallet to claim faucet tokens"
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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

# ============ Project Info Endpoint ============

@app.get("/api/project-info")
async def get_project_info():
    """Get project summary information"""
    return {
        "success": True,
        "project": {
            "name": "AI Power Trade",
            "platform": "Independent Submission",
            "url": "",
            "version": "3.0 Comprehensive Edition",
            "features": [
                "AI-guided trading signals",
                "Explainability layer with confidence and research context",
                "Wallet-aware execution workspace",
                "Polygon Amoy demo settlement support",
                "Trade history and performance views",
                "Backtesting and strategy comparison tools"
            ],
            "tech_stack": {
                "backend": "FastAPI + Python",
                "frontend": "Next.js + React",
                "ai": "Hybrid ML and explainability services",
                "blockchain": "Polygon Amoy + Solidity + Web3.py"
            },
            "innovation": [
                "Transparent signal explainability",
                "Provider-aware fallback architecture",
                "Browser-signed execution flow",
                "Unified market, AI, and execution workspace",
                "Research context layered into trading decisions"
            ],
            "demo": {
                "frontend": "http://localhost:3000",
                "backend": "http://localhost:8000",
                "api_docs": "http://localhost:8000/docs"
            },
            "documentation": [
                "README.md",
                "GLOBAL_ROADMAP.md",
                "blockchain/deployment.json",
                "blockchain/AITradeUSDT_V2.sol",
                "comprehensive_backend/RAILWAY_DEPLOYMENT.md"
            ]
        }
    }

@app.on_event("startup")
async def startup_background_services():
    """Start background services"""
    
    # Signal scheduler disabled - using on-demand with cache instead
    if env_flag("ENABLE_SIGNAL_SCHEDULER", False):
        try:
            from signal_scheduler import start_scheduler
            start_scheduler()
            logger.info("🔄 Signal scheduler enabled")
        except Exception as e:
            logger.warning(f"Signal scheduler failed to start: {e}")
    else:
        logger.info("💤 Signal scheduler disabled (using on-demand with 30min manual signal cache)")
    
    # Start settlement worker
    if not env_flag("ENABLE_SETTLEMENT_WORKER", False):
        logger.info("💤 Settlement worker disabled for this process")
        return

    if not settlement_service.is_ready():
        logger.info("💤 Settlement contract unavailable - background worker not started")
        return

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
    print("AI Power Trade - Comprehensive Backend")
    print("Project Info: http://localhost:8000/api/project-info")
    print("=" * 60)
    print("Starting server on http://localhost:8000")
    print("API Documentation: http://localhost:8000/docs")
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


# ============ Enhanced AI Prediction Endpoints (5th Wave) ============

@app.get("/api/ai/enhanced-prediction/{symbol}")
async def get_enhanced_prediction(symbol: str):
    """Get enhanced AI prediction using LSTM + ML + CoinGecko data"""
    if not ENHANCED_AI_AVAILABLE:
        raise HTTPException(
            status_code=503, 
            detail="Enhanced AI features not available. Install TensorFlow: pip install tensorflow"
        )
    
    try:
        # Get price history
        price_history = trading_state["price_history"].get(symbol, [])
        
        if len(price_history) < 20:
            return {
                "success": False,
                "error": "Insufficient price history for enhanced prediction",
                "symbol": symbol
            }
        
        # Generate enhanced prediction
        prediction = enhanced_predictor.predict(symbol, price_history)
        
        return {
            "success": True,
            "data": prediction
        }
    
    except Exception as e:
        logger.error(f"Enhanced prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/ai/coingecko/{symbol}")
async def get_coingecko_data(symbol: str):
    """Get market data from CoinGecko API"""
    if not ENHANCED_AI_AVAILABLE:
        raise HTTPException(status_code=503, detail="CoinGecko integration not available")
    
    try:
        market_data = coingecko_api.get_enhanced_market_data(symbol)
        
        if not market_data:
            raise HTTPException(status_code=404, detail=f"No data found for {symbol}")
        
        return {
            "success": True,
            "data": market_data
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"CoinGecko API error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/ai/market-sentiment/{symbol}")
async def get_market_sentiment(symbol: str):
    """Get market sentiment with CryptoPanic preferred and CoinGecko fallback."""
    normalized_symbol = symbol.upper()

    if CRYPTOPANIC_AVAILABLE and cryptopanic_service and cryptopanic_service.is_available():
        try:
            sentiment = cryptopanic_service.get_symbol_sentiment(normalized_symbol, limit=10)
            return {
                "success": True,
                "data": sentiment
            }
        except Exception as e:
            logger.warning(f"CryptoPanic sentiment fallback for {normalized_symbol}: {e}")

    if not ENHANCED_AI_AVAILABLE:
        raise HTTPException(status_code=503, detail="Sentiment integrations are not available")
    
    try:
        sentiment = coingecko_api.get_market_sentiment(normalized_symbol)
        
        if not sentiment:
            sentiment = build_sentiment_fallback(
                normalized_symbol,
                reason=f"CoinGecko sentiment is temporarily unavailable for {normalized_symbol}",
            )
        
        sentiment["source"] = sentiment.get("source") or "CoinGecko"

        return {
            "success": True,
            "data": sentiment,
            "fallback": bool(sentiment.get("fallback")),
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Sentiment API error: {e}")
        return {
            "success": True,
            "data": build_sentiment_fallback(
                normalized_symbol,
                reason=f"Sentiment fallback active because the upstream provider failed: {e}",
            ),
            "fallback": True,
        }


@app.get("/api/ai/global-market")
async def get_global_market():
    """Get global cryptocurrency market data"""
    if not ENHANCED_AI_AVAILABLE:
        raise HTTPException(status_code=503, detail="CoinGecko integration not available")
    
    try:
        global_data = coingecko_api.get_global_market_data()
        
        if not global_data:
            return {
                "success": True,
                "data": None,
                "fallback": True,
                "message": "CoinGecko global market data is temporarily unavailable. Use cached frontend market overview until retry.",
            }
        
        return {
            "success": True,
            "data": global_data,
            "fallback": bool(global_data.get("stale")),
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Global market API error: {e}")
        return {
            "success": True,
            "data": None,
            "fallback": True,
            "message": f"Global market fallback active because the upstream provider failed: {e}",
        }


@app.get("/api/ai/trending")
async def get_trending_coins():
    """Get trending cryptocurrencies"""
    if not ENHANCED_AI_AVAILABLE:
        raise HTTPException(status_code=503, detail="CoinGecko integration not available")
    
    try:
        trending = coingecko_api.get_trending_coins()
        
        if not trending:
            raise HTTPException(status_code=500, detail="Failed to fetch trending coins")
        
        return {
            "success": True,
            "data": trending
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Trending API error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def require_sosovalue_service(check_enabled: bool = True):
    """Ensure the SoSoValue service is importable and optionally enabled."""
    if not SOSOVALUE_AVAILABLE or not sosovalue_service:
        raise HTTPException(status_code=503, detail="SoSoValue backend service is not available")

    if check_enabled and not sosovalue_service.is_available():
        raise HTTPException(status_code=503, detail=sosovalue_service.get_unavailable_reason())

    return sosovalue_service


def require_cryptopanic_service():
    """Ensure the CryptoPanic service is configured."""
    if not CRYPTOPANIC_AVAILABLE or not cryptopanic_service:
        raise HTTPException(status_code=503, detail="CryptoPanic backend service is not available")

    if not cryptopanic_service.is_available():
        raise HTTPException(status_code=503, detail="CRYPTOPANIC_API_KEY is not configured")

    return cryptopanic_service


def require_sodex_service():
    """Ensure the SoDEX read-path service is configured."""
    if not SODEX_AVAILABLE or not sodex_service:
        raise HTTPException(status_code=503, detail="SoDEX backend service is not available")

    if not sodex_service.is_available():
        raise HTTPException(status_code=503, detail="SODEX_API_URL is not configured")

    return sodex_service


def _merge_news_feeds(
    primary_feed: Optional[Dict],
    secondary_feed: Optional[Dict] = None,
    limit: int = 5,
) -> Dict:
    merged = []

    for feed in [primary_feed, secondary_feed]:
        for item in (feed or {}).get("articles", []):
            title = item.get("title")
            if title and not any(existing.get("title") == title for existing in merged):
                merged.append(item)

    return {
        "symbol": (primary_feed or secondary_feed or {}).get("symbol"),
        "articles": merged[:limit],
        "count": len(merged[:limit]),
        "source": "CryptoPanic + SoSoValue" if primary_feed and secondary_feed else (primary_feed or secondary_feed or {}).get("source"),
    }


@app.get("/api/sosovalue/status")
async def get_sosovalue_status():
    """Get SoSoValue backend integration status."""
    service = require_sosovalue_service(check_enabled=False)
    return {
        "success": True,
        "data": service.get_service_status()
    }


@app.get("/api/sosovalue/currencies")
async def get_sosovalue_currencies():
    """Get normalized list of SoSoValue supported currencies."""
    service = require_sosovalue_service()

    try:
        currencies = service.get_listed_currencies()
        return {
            "success": True,
            "data": currencies,
            "count": len(currencies)
        }
    except Exception as e:
        logger.error(f"SoSoValue currencies error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/sosovalue/news")
async def get_sosovalue_news(page_num: int = 1, page_size: int = 10):
    """Get general SoSoValue featured news."""
    service = require_sosovalue_service()

    try:
        feed = service.get_news_feed(page_num=page_num, page_size=page_size)
        return {
            "success": True,
            "data": feed
        }
    except Exception as e:
        logger.error(f"SoSoValue news feed error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/sosovalue/news/{symbol}")
async def get_sosovalue_news_by_symbol(symbol: str, page_num: int = 1, page_size: int = 5):
    """Get SoSoValue featured news for one asset symbol."""
    service = require_sosovalue_service()

    try:
        feed = service.get_news_feed(symbol=symbol, page_num=page_num, page_size=page_size)
        return {
            "success": True,
            "data": feed
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"SoSoValue symbol news error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/sosovalue/etf-metrics")
async def get_sosovalue_etf_metrics(etf_type: str = "us-btc-spot"):
    """Get normalized SoSoValue ETF metrics."""
    service = require_sosovalue_service()

    try:
        metrics = service.get_etf_metrics(etf_type=etf_type)
        return {
            "success": True,
            "data": metrics
        }
    except Exception as e:
        logger.error(f"SoSoValue ETF metrics error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/sosovalue/research-context/{symbol}")
async def get_sosovalue_research_context(symbol: str, news_limit: int = 5):
    """Get normalized research context for one asset."""
    service = require_sosovalue_service()

    try:
        context = service.get_research_context(symbol=symbol, news_limit=news_limit)
        return {
            "success": True,
            "data": context
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"SoSoValue research context error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/cryptopanic/status")
async def get_cryptopanic_status():
    """Get CryptoPanic backend integration status."""
    if not CRYPTOPANIC_AVAILABLE or not cryptopanic_service:
        raise HTTPException(status_code=503, detail="CryptoPanic backend service is not available")

    return {
        "success": True,
        "data": cryptopanic_service.get_service_status()
    }


@app.get("/api/cryptopanic/news/{symbol}")
async def get_cryptopanic_news(symbol: str, limit: int = 5):
    """Get CryptoPanic news for one asset symbol."""
    service = require_cryptopanic_service()

    try:
        feed = service.get_news_feed(symbol=symbol, limit=limit)
        return {
            "success": True,
            "data": feed
        }
    except Exception as e:
        logger.error(f"CryptoPanic news error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/cryptopanic/sentiment/{symbol}")
async def get_cryptopanic_sentiment(symbol: str, limit: int = 10):
    """Get CryptoPanic-derived sentiment for one asset symbol."""
    service = require_cryptopanic_service()

    try:
        sentiment = service.get_symbol_sentiment(symbol=symbol, limit=limit)
        return {
            "success": True,
            "data": sentiment
        }
    except Exception as e:
        logger.error(f"CryptoPanic sentiment error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/sodex/prepare-order")
async def prepare_sodex_order(request: SodexOrderPreparationRequest):
    """Build a SoDEX EIP-712 payload for browser signing."""
    service = require_sodex_service()

    try:
        prepared_order = service.prepare_order(
            symbol=request.symbol,
            trade_type=request.trade_type,
            amount=request.amount,
            price=request.price,
            wallet_address=request.wallet_address,
            account_id=request.sodex_account_id,
        )
        return {
            "success": True,
            "data": prepared_order,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"SoDEX prepare order error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/sodex/status")
async def get_sodex_status():
    """Get SoDEX read-path integration status."""
    if not SODEX_AVAILABLE or not sodex_service:
        raise HTTPException(status_code=503, detail="SoDEX backend service is not available")

    return {
        "success": True,
        "data": sodex_service.get_service_status()
    }


@app.get("/api/sodex/markets/symbols")
async def get_sodex_symbols(symbol: str = None):
    """Get SoDEX market symbols for the configured gateway."""
    service = require_sodex_service()

    try:
        symbols = service.get_symbols(symbol=symbol)
        return {
            "success": True,
            "data": symbols,
            "count": len(symbols)
        }
    except Exception as e:
        logger.error(f"SoDEX symbols error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/sodex/markets/tickers")
async def get_sodex_tickers(symbol: str = None):
    """Get SoDEX market tickers for the configured gateway."""
    service = require_sodex_service()

    try:
        tickers = service.get_tickers(symbol=symbol)
        return {
            "success": True,
            "data": tickers,
            "count": len(tickers)
        }
    except Exception as e:
        logger.error(f"SoDEX tickers error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/sodex/history/{user_address}")
async def get_sodex_history(user_address: str, symbol: str = None, limit: int = 50, account_id: str = None):
    """Get SoDEX trade or order history for one account."""
    service = require_sodex_service()

    try:
        trades = service.get_account_trades(
            user_address=user_address,
            symbol=symbol,
            limit=min(max(int(limit or 50), 1), 250),
            account_id=account_id,
        )
        normalized = service.normalize_history_items(trades)

        if not normalized:
            orders = service.get_account_order_history(
                user_address=user_address,
                symbol=symbol,
                limit=min(max(int(limit or 50), 1), 250),
                account_id=account_id,
            )
            normalized = service.normalize_history_items(orders)

        return {
            "success": True,
            "data": normalized,
            "count": len(normalized),
            "source": "SoDEX"
        }
    except Exception as e:
        logger.error(f"SoDEX history error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/ai/explainability/{symbol}")
async def get_ai_explainability_bundle(
    symbol: str,
    news_limit: int = 3,
    candle_limit: int = 24,
    candle_interval: str = "1h",
    force_refresh: bool = False,
    cached_only: bool = False,
):
    """
    Aggregate AI explainability with smart caching.
    Signals are generated at most once every 30 minutes per symbol.
    Use cached_only=true to read the latest snapshot without generating a new one.
    Use force_refresh=true to request a new snapshot once the cooldown has expired.
    """
    normalized_symbol = symbol.upper().strip()

    if normalized_symbol not in trading_state["price_history"]:
        raise HTTPException(status_code=404, detail="Symbol not found")

    cache_duration = EXPLAINABILITY_CACHE_DURATION_SECONDS
    cache_key = f"explainability:{normalized_symbol}:{news_limit}:{candle_limit}:{candle_interval}"

    try:
        from utils.cache import get_cached, set_cached
    except Exception:
        get_cached = None
        set_cached = None

    cached = get_cached(cache_key) if get_cached else None
    if cached:
        cached_response = build_explainability_cache_response(
            cached,
            cache_duration=cache_duration,
            cached_only=cached_only,
            generation_locked=bool(force_refresh),
            message=(
                f"Fresh AI signals are limited to one generation every 30 minutes. "
                f"The latest cached {normalized_symbol} signal is still active."
                if force_refresh
                else None
            ),
        )

        if cached_only:
            return cached_response

        if force_refresh and cached_response.get("next_refresh_in_seconds", 0) > 0:
            return cached_response

        if not force_refresh:
            return cached_response

    if cached_only:
        return {
            "success": True,
            "data": None,
            "cache_hit": False,
            "cached_only": True,
            "signal_available": False,
            "generation_allowed": True,
            "generation_locked": False,
            "cache_duration_seconds": cache_duration,
            "next_refresh_in_seconds": 0,
            "message": (
                f"No cached explainability signal is ready for {normalized_symbol}. "
                f"Use Generate Signal to create a fresh snapshot."
            ),
        }

    explain_payload = await explain_ai_decision(normalized_symbol)
    candles_payload = await get_market_candles(
        normalized_symbol,
        interval=candle_interval,
        limit=candle_limit,
    )
    market_prices_payload = await get_prices()
    market_snapshot = (market_prices_payload.get("data") or {}).get(normalized_symbol, {})

    explain_data = dict(explain_payload.get("data") or {})
    provider_registry = get_provider_registry()
    warnings = []

    research_context = None
    etf_metrics = None
    sosovalue_feed = None
    if SOSOVALUE_AVAILABLE and sosovalue_service and sosovalue_service.is_available():
        try:
            research_context = sosovalue_service.get_research_context(normalized_symbol, news_limit=news_limit)
        except Exception as e:
            warnings.append(f"SoSoValue research unavailable: {e}")

        try:
            sosovalue_feed = sosovalue_service.get_news_feed(symbol=normalized_symbol, page_num=1, page_size=news_limit)
        except Exception as e:
            warnings.append(f"SoSoValue news unavailable: {e}")

        try:
            etf_metrics = sosovalue_service.get_etf_metrics(
                etf_type="us-eth-spot" if normalized_symbol == "ETH" else "us-btc-spot"
            )
        except Exception as e:
            warnings.append(f"SoSoValue ETF metrics unavailable: {e}")

    cryptopanic_feed = None
    cryptopanic_sentiment = None
    if CRYPTOPANIC_AVAILABLE and cryptopanic_service and cryptopanic_service.is_available():
        try:
            cryptopanic_feed = cryptopanic_service.get_news_feed(symbol=normalized_symbol, limit=news_limit)
        except Exception:
            pass  # CryptoPanic is optional

        try:
            cryptopanic_sentiment = cryptopanic_service.get_symbol_sentiment(normalized_symbol, limit=max(news_limit * 2, 6))
        except Exception:
            pass  # CryptoPanic is optional

    merged_news = _merge_news_feeds(cryptopanic_feed, sosovalue_feed, limit=news_limit)
    sentiment_data = cryptopanic_sentiment

    # Skip fallback sentiment if CryptoPanic not available (optional feature)
    if not sentiment_data:
        try:
            sentiment_payload = await get_market_sentiment(normalized_symbol)
            sentiment_data = sentiment_payload.get("data")
        except Exception:
            pass  # Sentiment is optional, no warning needed

    llm_overlay = None
    
    # Try Groq first (free tier)
    if GROQ_AVAILABLE and groq_service and groq_service.is_available():
        try:
            llm_overlay = groq_service.build_signal_overlay(
                normalized_symbol,
                explain_data=explain_data,
                market_snapshot=market_snapshot,
                research_context=research_context,
                sentiment=sentiment_data,
                news_items=merged_news.get("articles", []),
            )
            explain_data["llm_overlay"] = llm_overlay
        except Exception as e:
            warnings.append(f"Groq overlay unavailable: {e}")
    
    # Fallback to OpenRouter if Groq failed
    if not llm_overlay and OPENROUTER_AVAILABLE and openrouter_service and openrouter_service.is_available():
        try:
            llm_overlay = openrouter_service.build_signal_overlay(
                normalized_symbol,
                explain_data=explain_data,
                market_snapshot=market_snapshot,
                research_context=research_context,
                sentiment=sentiment_data,
                news_items=merged_news.get("articles", []),
            )
            explain_data["llm_overlay"] = llm_overlay
        except Exception as e:
            warnings.append(f"OpenRouter overlay unavailable: {e}")

    result = {
        "success": True,
        "data": {
            "symbol": normalized_symbol,
            "explain": explain_data,
            "research": research_context,
            "sentiment": sentiment_data,
            "news": merged_news,
            "etf": etf_metrics,
            "llm": llm_overlay,
            "candles": candles_payload.get("data"),
            "providers": provider_registry.get("providers", {}),
            "sources": {
                "explain": explain_payload.get("source", "fresh"),
                "market": market_prices_payload.get("source", "fresh"),
                "news": merged_news.get("source") or "Unavailable",
                "sentiment": (sentiment_data or {}).get("source") or "Unavailable",
                "llm": (llm_overlay or {}).get("provider") or "Unavailable",
            },
            "warnings": warnings,
            "updated_at": datetime.now().isoformat(),
        },
        "cache_hit": False,
        "cached_at": time.time(),
        "cache_duration_seconds": cache_duration,
        "next_refresh_in_seconds": cache_duration,
        "generation_allowed": False,
        "generation_locked": False,
        "signal_available": True,
        "message": "Fresh signal generated. The next manual generation window opens in 30 minutes.",
    }
    
    # Save to cache
    try:
        if set_cached:
            set_cached(cache_key, result, cache_duration)
    except Exception:
        pass  # Cache save failed, but return result anyway
    
    return result


@app.get("/api/ai/signal/cached/{symbol}")
async def get_cached_signal(symbol: str):
    """
    Get pre-generated cached signal from scheduler
    Much faster than on-demand generation
    """
    try:
        from signal_scheduler import get_cached_signal, signal_cache
        
        normalized_symbol = symbol.upper().strip()
        cached = get_cached_signal(normalized_symbol)
        
        if not cached:
            return {
                "success": False,
                "error": "Signal not cached yet",
                "message": f"Signal for {normalized_symbol} is being generated. Try again in a few seconds.",
                "available_symbols": list(signal_cache.cache.keys()),
            }
        
        age = signal_cache.get_age(normalized_symbol)
        
        return {
            "success": True,
            "data": cached,
            "cache_age_seconds": age,
            "source": "scheduled_cache",
        }
    except ImportError:
        raise HTTPException(status_code=503, detail="Signal scheduler not available")


@app.get("/api/ai/signal/status")
async def get_signal_scheduler_status():
    """Get status of signal scheduler and all cached signals"""
    try:
        from signal_scheduler import get_signal_status
        
        status = get_signal_status()
        
        return {
            "success": True,
            "data": {
                "scheduler_enabled": True,
                "signals": status,
                "timestamp": datetime.now().isoformat(),
            }
        }
    except ImportError:
        return {
            "success": False,
            "error": "Signal scheduler not available",
            "data": {
                "scheduler_enabled": False,
                "signals": {},
            }
        }


@app.post("/api/ai/lstm/train")
async def train_lstm_model(symbol: str, epochs: int = 50):
    """Train LSTM model on historical price data"""
    if not ENHANCED_AI_AVAILABLE:
        raise HTTPException(status_code=503, detail="LSTM features not available")
    
    try:
        price_history = trading_state["price_history"].get(symbol, [])
        
        if len(price_history) < lstm_predictor.sequence_length + 10:
            raise HTTPException(
                status_code=400,
                detail=f"Need at least {lstm_predictor.sequence_length + 10} data points for training"
            )
        
        result = lstm_predictor.train(price_history, epochs=epochs)
        
        return {
            "success": result.get("success", False),
            "data": result
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"LSTM training error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/ai/lstm/predict/{symbol}")
async def get_lstm_prediction(symbol: str):
    """Get LSTM price prediction"""
    if not ENHANCED_AI_AVAILABLE:
        raise HTTPException(status_code=503, detail="LSTM features not available")
    
    try:
        price_history = trading_state["price_history"].get(symbol, [])
        
        if len(price_history) < lstm_predictor.sequence_length:
            raise HTTPException(
                status_code=400,
                detail=f"Need at least {lstm_predictor.sequence_length} data points"
            )
        
        prediction = lstm_predictor.predict(price_history)
        
        if not prediction:
            raise HTTPException(status_code=500, detail="LSTM model not trained")
        
        return {
            "success": True,
            "data": prediction
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"LSTM prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/ai/model-status")
async def get_ai_model_status():
    """Get status of all AI models"""
    if not ENHANCED_AI_AVAILABLE:
        return {
            "success": False,
            "error": "Enhanced AI features not available",
            "install_command": "pip install tensorflow keras"
        }
    
    try:
        status = enhanced_predictor.get_model_status()
        
        return {
            "success": True,
            "data": status
        }
    
    except Exception as e:
        logger.error(f"Model status error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/ai/confidence-thresholds")
async def get_confidence_thresholds():
    """Get confidence score thresholds for color coding"""
    if not ENHANCED_AI_AVAILABLE:
        raise HTTPException(status_code=503, detail="Enhanced AI features not available")
    
    return {
        "success": True,
        "data": {
            "thresholds": enhanced_predictor.CONFIDENCE_THRESHOLDS,
            "colors": {
                "green": "High confidence (>= 75%)",
                "yellow": "Medium confidence (60-74%)",
                "red": "Low confidence (< 60%)"
            }
        }
    }


# ============ Run Server ============
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
