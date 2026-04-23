from fastapi import FastAPI, WebSocket, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import json
from datetime import datetime
import uvicorn
import random
import hashlib
from ai_model import ai_model, multi_strategy_ai, sentiment_analyzer, advanced_risk_manager
from weex_api import WeexAPI
from smart_contract import SmartContractValidator
from enhanced_smart_contract import EnhancedSmartContract

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

class RiskManager:
    def __init__(self):
        self.max_position_size = 0.1
        self.max_daily_loss = 500
        self.max_leverage = 3
        self.daily_loss = 0
    
    def evaluate_risk(self, signal, price, confidence):
        if self.daily_loss >= self.max_daily_loss:
            return {"approved": False, "reason": "Daily loss limit reached"}
        if confidence < 70:
            return {"approved": False, "reason": "Confidence too low"}
        if abs(trading_data["pnl"]) > trading_data["balance"] * 0.2:
            return {"approved": False, "reason": "Risk exposure too high"}
        return {"approved": True, "reason": "Risk check passed"}

class OracleLayer:
    def verify_and_encrypt(self, data):
        data_str = json.dumps(data, sort_keys=True)
        hash_value = hashlib.sha256(data_str.encode()).hexdigest()
        return {
            "original_data": data,
            "hash": hash_value,
            "verified": True,
            "timestamp": datetime.now().isoformat()
        }

class SmartContract:
    def __init__(self):
        self.rules = {
            "min_confidence": 70,
            "max_position_size": 0.1,
            "allowed_symbols": ["BTCUSDT", "ETHUSDT"],
            "max_daily_trades": 50,
            "min_time_between_trades": 30
        }
        self.on_chain_records = []
        self.governance_votes = []
        self.fund_pool = {"total": 10000, "available": 10000, "locked": 0}
        
    def validate_signal(self, signal_data):
        if signal_data["confidence"] < self.rules["min_confidence"]:
            return {"valid": False, "reason": "Confidence below threshold"}
        if signal_data["symbol"] not in self.rules["allowed_symbols"]:
            return {"valid": False, "reason": "Symbol not allowed"}
        
        today_trades = len([r for r in self.on_chain_records 
                           if r["timestamp"][:10] == datetime.now().isoformat()[:10]])
        if today_trades >= self.rules["max_daily_trades"]:
            return {"valid": False, "reason": "Daily trade limit exceeded"}
            
        if self.on_chain_records:
            last_trade_time = datetime.fromisoformat(self.on_chain_records[-1]["timestamp"])
            time_diff = (datetime.now() - last_trade_time).total_seconds()
            if time_diff < self.rules["min_time_between_trades"]:
                return {"valid": False, "reason": "Too soon since last trade"}
        
        if random.random() < 0.1:
            return {"valid": False, "reason": "Random validation failure"}
        return {"valid": True, "reason": "All validations passed"}
    
    def record_on_chain(self, trade_data):
        record = {
            "id": len(self.on_chain_records) + 1,
            "data": trade_data,
            "block_hash": hashlib.sha256(json.dumps(trade_data).encode()).hexdigest()[:16],
            "timestamp": datetime.now().isoformat(),
            "gas_used": random.uniform(21000, 50000),
            "tx_hash": f"0x{hashlib.sha256(str(random.random()).encode()).hexdigest()}"
        }
        self.on_chain_records.append(record)
        return record
    
    def distribute_funds(self, profit_loss):
        if profit_loss > 0:
            self.fund_pool["total"] += profit_loss
            self.fund_pool["available"] += profit_loss * 0.8
        else:
            self.fund_pool["total"] += profit_loss
            self.fund_pool["available"] += profit_loss
        
        return {
            "distributed": profit_loss,
            "new_total": self.fund_pool["total"],
            "available": self.fund_pool["available"]
        }
    
    def governance_vote(self, proposal, vote):
        vote_record = {
            "proposal": proposal,
            "vote": vote,
            "timestamp": datetime.now().isoformat(),
            "voter_id": f"voter_{random.randint(1000, 9999)}"
        }
        self.governance_votes.append(vote_record)
        return vote_record

risk_manager = RiskManager()
oracle = OracleLayer()
smart_contract = SmartContract()
enhanced_contract = EnhancedSmartContract()
weex_api = WeexAPI()

@app.get("/api/status")
async def get_status():
    return {
        "status": "active",
        "timestamp": datetime.now().isoformat(),
        "balance": trading_data["balance"],
        "pnl": trading_data["pnl"],
        "daily_loss": risk_manager.daily_loss
    }

@app.get("/api/market-data")
async def get_market_data():
    market_data = weex_api.get_market_data("BTCUSDT")
    trading_data["price_history"].append(market_data["price"])
    if len(trading_data["price_history"]) > 100:
        trading_data["price_history"].pop(0)
    return market_data

@app.get("/api/orderbook/{symbol}")
async def get_orderbook(symbol: str):
    return weex_api.get_orderbook(symbol)

@app.get("/api/account-balance")
async def get_account_balance():
    return weex_api.get_account_balance()

@app.get("/api/governance/votes")
async def get_governance_votes():
    return enhanced_contract.governance.votes

@app.get("/api/governance/proposals")
async def get_governance_proposals():
    return enhanced_contract.get_governance_proposals()

@app.post("/api/governance/proposal")
async def create_proposal(title: str, description: str, proposal_type: str):
    proposal = enhanced_contract.governance.create_proposal(
        proposer_id=f"user_{random.randint(1000, 9999)}",
        title=title,
        description=description,
        proposal_type=proposal_type,
        parameters={}
    )
    return proposal

@app.post("/api/governance/vote")
async def submit_vote(proposal_id: int, vote: str):
    voter_id = f"voter_{random.randint(1000, 9999)}"
    voting_power = random.uniform(10, 100)
    return enhanced_contract.governance.cast_vote(voter_id, proposal_id, vote, voting_power)

@app.get("/api/fund-pool")
async def get_fund_pool():
    return smart_contract.fund_pool

@app.get("/api/liquidity-pool")
async def get_liquidity_pool():
    return {
        'total_liquidity': enhanced_contract.liquidity_pool.total_liquidity,
        'providers': enhanced_contract.liquidity_pool.providers,
        'rewards_pool': enhanced_contract.liquidity_pool.rewards_pool
    }

@app.post("/api/liquidity-pool/add")
async def add_liquidity(provider_id: str, amount: float):
    return enhanced_contract.liquidity_pool.add_liquidity(provider_id, amount)

@app.post("/api/liquidity-pool/remove")
async def remove_liquidity(provider_id: str, amount: float):
    return enhanced_contract.liquidity_pool.remove_liquidity(provider_id, amount)

@app.post("/api/trading-cycle")
async def run_trading_cycle():
    try:
        # Step 1: Market Data Ingestion
        new_price = trading_data["price_history"][-1] + random.uniform(-200, 200)
        trading_data["price_history"].append(new_price)
        if len(trading_data["price_history"]) > 100:
            trading_data["price_history"].pop(0)
        
        market_data = {
            "symbol": "BTCUSDT",
            "price": new_price,
            "timestamp": datetime.now().isoformat()
        }
        
        # Step 2: Enhanced AI Analysis
        detailed_analysis = ai_model.get_detailed_analysis(trading_data["price_history"])
        signal = detailed_analysis['final_signal']
        confidence = detailed_analysis['confidence']
        
        # Get multi-strategy breakdown
        strategy_signals = detailed_analysis['strategy_breakdown']
        sentiment_data = detailed_analysis['sentiment']
        risk_factors = detailed_analysis['risk_factors']
        
        ai_signal = {
            "signal": signal,
            "confidence": round(confidence, 1),
            "price": round(new_price, 2),
            "timestamp": datetime.now().isoformat(),
            "strategy_breakdown": strategy_signals,
            "sentiment": sentiment_data,
            "risk_factors": risk_factors
        }
        
        # Step 3: Enhanced Risk Management
        risk_check = risk_manager.evaluate_risk(signal, new_price, confidence)
        
        # Advanced risk assessment
        portfolio_risk = advanced_risk_manager.evaluate_portfolio_risk(trading_data["positions"], market_data)
        
        # Calculate optimal position size
        volatility = risk_factors.get('volatility_value', 0.02)
        position_size = advanced_risk_manager.calculate_position_size(
            confidence / 100, trading_data["balance"], volatility
        )
        
        risk_check.update({
            'portfolio_risk': portfolio_risk,
            'recommended_position_size': position_size,
            'volatility': volatility
        })
        
        if not risk_check["approved"]:
            return {
                "success": False,
                "stage": "risk_management",
                "reason": risk_check["reason"],
                "market_data": market_data,
                "ai_signal": ai_signal
            }
        
        # Step 4: Oracle Verification
        verified_data = oracle.verify_and_encrypt(ai_signal)
        
        # Step 5: Enhanced Smart Contract Validation
        validation = enhanced_contract.validate_advanced_signal({
            "symbol": "BTCUSDT",
            "confidence": confidence,
            "signal": signal,
            "position_size": position_size / trading_data["balance"],
            "expected_slippage": random.uniform(0.001, 0.003),
            "market_volatility": volatility,
            "trader_address": f"0x{random.randint(100000, 999999)}"
        })
        
        if not validation["valid"]:
            return {
                "success": False,
                "stage": "smart_contract",
                "reason": validation["reason"],
                "market_data": market_data,
                "ai_signal": ai_signal,
                "oracle_data": verified_data
            }
        
        # Step 6: Execution via WEEX API
        order_result = weex_api.place_order(
            symbol="BTCUSDT",
            side=signal.lower(),
            amount=0.01,
            price=new_price
        )
        
        profit = random.uniform(-300, 500)
        trading_data["pnl"] += profit
        risk_manager.daily_loss += max(0, -profit)
        
        trade_result = {
            "signal": signal,
            "price": round(new_price, 2),
            "profit": round(profit, 2),
            "order_id": order_result["order_id"],
            "execution_status": order_result["status"],
            "timestamp": datetime.now().isoformat()
        }
        
        # Step 7: Enhanced Settlement
        on_chain_record = enhanced_contract.record_on_chain(trade_result)
        fund_distribution = smart_contract.distribute_funds(profit)
        
        # Distribute liquidity pool rewards
        if profit > 0:
            enhanced_contract.liquidity_pool.distribute_rewards(profit * 0.1)  # 10% to LP
        
        # Check circuit breakers
        circuit_check = enhanced_contract.check_circuit_breakers()
        
        return {
            "success": True,
            "market_data": market_data,
            "ai_signal": ai_signal,
            "risk_check": risk_check,
            "oracle_data": verified_data,
            "validation": validation,
            "trade_result": trade_result,
            "on_chain_record": on_chain_record,
            "fund_distribution": fund_distribution,
            "circuit_check": circuit_check,
            "detailed_analysis": detailed_analysis
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/on-chain-records")
async def get_on_chain_records():
    return smart_contract.on_chain_records[-10:]

@app.get("/api/enhanced-records")
async def get_enhanced_records():
    return enhanced_contract.on_chain_records[-10:] if hasattr(enhanced_contract, 'on_chain_records') else []

@app.get("/api/performance-report")
async def get_performance_report():
    return enhanced_contract.get_performance_report()

@app.get("/api/detailed-analysis")
async def get_detailed_analysis():
    return ai_model.get_detailed_analysis(trading_data["price_history"])

@app.get("/api/sentiment-analysis")
async def get_sentiment_analysis():
    return sentiment_analyzer.get_market_sentiment()

@app.get("/api/risk-assessment")
async def get_risk_assessment():
    return advanced_risk_manager.evaluate_portfolio_risk(trading_data["positions"], {})

@app.get("/api/positions")
async def get_positions():
    return trading_data["positions"]

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
    uvicorn.run(app, host="0.0.0.0", port=8000)