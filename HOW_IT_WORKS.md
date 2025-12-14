# 🤖 Bagaimana AI Trading Platform Bekerja?

## Penjelasan Lengkap untuk WEEX AI Trading Hackathon

---

## 📋 Table of Contents

1. [Overview Sistem](#overview-sistem)
2. [Alur Kerja Lengkap](#alur-kerja-lengkap)
3. [AI Prediction Engine](#ai-prediction-engine)
4. [Smart Contract Validation](#smart-contract-validation)
5. [Oracle Verification](#oracle-verification)
6. [Trading Execution](#trading-execution)
7. [Risk Management](#risk-management)
8. [Contoh Praktis](#contoh-praktis)

---

## 🎯 Overview Sistem

### Konsep Dasar

AI Trading Platform adalah sistem trading otomatis yang menggunakan **Artificial Intelligence** untuk menganalisis pasar cryptocurrency dan membuat keputusan trading yang cerdas, dengan **Smart Contract** untuk validasi dan **Oracle** untuk verifikasi data.

### Komponen Utama

```
┌─────────────────────────────────────────────────────────┐
│                    USER INTERFACE                        │
│              (Dashboard, Charts, Controls)               │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                    BACKEND SERVER                        │
│                      (FastAPI)                           │
└────────────────────────┬────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
┌──────────┐    ┌──────────────┐    ┌─────────┐
│    AI    │    │    Smart     │    │ Oracle  │
│  Engine  │    │   Contract   │    │  Layer  │
└────┬─────┘    └──────┬───────┘    └────┬────┘
     │                 │                  │
     └─────────────────┼──────────────────┘
                       │
                       ▼
              ┌─────────────────┐
              │ Trading Engine  │
              │   + WEEX API    │
              └─────────────────┘
```

---

## 🔄 Alur Kerja Lengkap

### Step-by-Step Process

```
START: User membuka dashboard
│
├─→ STEP 1: Ambil Data Market
│   ├─ Koneksi ke WEEX API (atau fallback)
│   ├─ Ambil harga BTC, ETH, BNB, SOL
│   ├─ Update price history
│   └─ Tampilkan di dashboard
│
├─→ STEP 2: AI Analisis
│   ├─ Ambil 50-100 data harga terakhir
│   ├─ Hitung indikator teknikal:
│   │  • RSI (Relative Strength Index)
│   │  • MACD (Moving Average Convergence Divergence)
│   │  • Bollinger Bands
│   │  • Moving Averages (MA5, MA20)
│   │  • Volatility
│   │
│   ├─ Scoring System:
│   │  • Buy Score = 0
│   │  • Sell Score = 0
│   │  
│   │  IF RSI < 30 (oversold):
│   │     Buy Score += 2
│   │  IF RSI > 70 (overbought):
│   │     Sell Score += 2
│   │  
│   │  IF MACD > 0 (bullish):
│   │     Buy Score += 1.

-
--

## 👤 **User Profile & Wallet Management**

### **12. User Profile System**

#### **Profile Data Structure:**
```python
user_profile = {
    "user_id": "USER_001",
    "username": "AI Trader",
    "email": "trader@aitrade.com",
    "created_at": "2024-12-04T10:00:00",
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
```

#### **Risk Tolerance Impact:**
```python
# Conservative: Lower position sizes, higher confidence required
if user_profile["risk_tolerance"] == "conservative":
    min_confidence = 0.75
    max_position_size = 10
    
# Moderate: Balanced approach
elif user_profile["risk_tolerance"] == "moderate":
    min_confidence = 0.65
    max_position_size = 20
    
# Aggressive: Higher risk, higher reward
elif user_profile["risk_tolerance"] == "aggressive":
    min_confidence = 0.55
    max_position_size = 30
```

#### **Profile API Endpoints:**
```python
# Get Profile
GET /api/user/profile
Response: {
    "success": true,
    "data": {
        "user_id": "USER_001",
        "username": "AI Trader",
        "email": "trader@aitrade.com",
        "risk_tolerance": "moderate",
        "stats": {...}
    }
}

# Update Profile
PUT /api/user/profile
Body: {
    "username": "Pro Trader",
    "risk_tolerance": "aggressive"
}

# Get User Stats
GET /api/user/stats
Response: {
    "success": true,
    "data": {
        "total_trades": 150,
        "total_profit": 2345.67,
        "best_trade": 456.78,
        "win_rate": 68.5,
        "days_active": 30
    }
}
```

---

### **13. Wallet Management System**

#### **Wallet Structure:**
```python
wallet_state = {
    "wallet_id": "WALLET_001",
    "balances": {
        "USDT": 10000.0,
        "BTC": 0.0,
        "ETH": 0.0,
        "BNB": 0.0,
        "SOL": 0.0
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
    "created_at": "2024-12-04T10:00:00"
}
```

#### **Wallet Features:**

**1. Multi-Currency Support**
- USDT (base currency untuk trading)
- BTC (Bitcoin)
- ETH (Ethereum)
- BNB (Binance Coin)
- SOL (Solana)

**2. Balance Management**
```python
def get_wallet_balances():
    balances = []
    
    for currency in ["USDT", "BTC", "ETH", "BNB", "SOL"]:
        balance = wallet_state["balances"][currency]
        locked = wallet_state["locked_balances"][currency]
        
        # Calculate value in USDT
        if currency == "USDT":
            value_usdt = balance
            price = 1.0
        else:
            price = get_current_price(currency)
            value_usdt = balance * price
        
        balances.append({
            "currency": currency,
            "balance": balance,
            "locked": locked,
            "available": balance - locked,
            "price_usdt": price,
            "value_usdt": value_usdt
        })
    
    return balances
```

**3. Deposit System**
```python
def deposit_to_wallet(currency, amount):
    # Validate
    if amount <= 0:
        return {"error": "Invalid amount"}
    
    # Add to balance
    wallet_state["balances"][currency] += amount
    wallet_state["total_deposited"] += amount
    
    # Update trading balance (if USDT)
    if currency == "USDT":
        trading_state["balance"] += amount
    
    # Record transaction
    transaction = {
        "tx_id": f"TX_{len(transactions) + 1}",
        "type": "DEPOSIT",
        "currency": currency,
        "amount": amount,
        "status": "COMPLETED",
        "timestamp": datetime.now().isoformat()
    }
    
    wallet_state["transaction_history"].append(transaction)
    
    return {
        "success": True,
        "transaction": transaction,
        "new_balance": wallet_state["balances"][currency]
    }
```

**4. Withdrawal System**
```python
def withdraw_from_wallet(currency, amount):
    # Check available balance
    available = wallet_state["balances"][currency] - wallet_state["locked_balances"][currency]
    
    if amount > available:
        return {"error": "Insufficient balance"}
    
    # Deduct from balance
    wallet_state["balances"][currency] -= amount
    wallet_state["total_withdrawn"] += amount
    
    # Update trading balance (if USDT)
    if currency == "USDT":
        trading_state["balance"] -= amount
    
    # Record transaction
    transaction = {
        "tx_id": f"TX_{len(transactions) + 1}",
        "type": "WITHDRAW",
        "currency": currency,
        "amount": amount,
        "status": "COMPLETED",
        "timestamp": datetime.now().isoformat()
    }
    
    wallet_state["transaction_history"].append(transaction)
    
    return {
        "success": True,
        "transaction": transaction,
        "new_balance": wallet_state["balances"][currency]
    }
```

**5. Locked Balance (For Active Trades)**
```python
def lock_balance_for_trade(currency, amount):
    """Lock balance when opening a position"""
    available = wallet_state["balances"][currency] - wallet_state["locked_balances"][currency]
    
    if amount > available:
        return {"error": "Insufficient available balance"}
    
    wallet_state["locked_balances"][currency] += amount
    
    return {"success": True, "locked": amount}

def unlock_balance_after_trade(currency, amount):
    """Unlock balance when closing a position"""
    wallet_state["locked_balances"][currency] -= amount
    
    return {"success": True, "unlocked": amount}
```

#### **Wallet API Endpoints:**

**Get Wallet Info:**
```
GET /api/wallet
```
Response:
```json
{
    "success": true,
    "data": {
        "wallet_id": "WALLET_001",
        "balances": {...},
        "locked_balances": {...},
        "total_value_usdt": 12345.67,
        "available_balance": 10000.0,
        "locked_balance": 2345.67
    }
}
```

**Get All Balances:**
```
GET /api/wallet/balances
```
Response:
```json
{
    "success": true,
    "data": [
        {
            "currency": "USDT",
            "balance": 10000.0,
            "locked": 0.0,
            "available": 10000.0,
            "price_usdt": 1.0,
            "value_usdt": 10000.0
        },
        {
            "currency": "BTC",
            "balance": 0.5,
            "locked": 0.1,
            "available": 0.4,
            "price_usdt": 50234.56,
            "value_usdt": 25117.28
        }
    ]
}
```

**Deposit:**
```
POST /api/wallet/deposit
Body: {
    "operation": "deposit",
    "amount": 5000,
    "currency": "USDT"
}
```

**Withdraw:**
```
POST /api/wallet/withdraw
Body: {
    "operation": "withdraw",
    "amount": 1000,
    "currency": "USDT"
}
```

**Transaction History:**
```
GET /api/wallet/transactions?limit=20
```

---

### **14. Integration: Profile + Wallet + Trading**

#### **Complete Trading Flow with Wallet:**
```python
# STEP 1: User Profile Check
user = get_user_profile()
risk_tolerance = user["risk_tolerance"]

# STEP 2: Wallet Balance Check
wallet = get_wallet()
available_usdt = wallet["balances"]["USDT"] - wallet["locked_balances"]["USDT"]

# STEP 3: AI Signal Generation (adjusted by risk tolerance)
signal = ai_predictor.generate_signal("BTC")
if risk_tolerance == "conservative":
    signal["position_size"] *= 0.5  # Reduce position size
elif risk_tolerance == "aggressive":
    signal["position_size"] *= 1.5  # Increase position size

# STEP 4: Calculate Trade Amount
trade_amount = available_usdt * (signal["position_size"] / 100)

# STEP 5: Lock Balance
lock_balance_for_trade("USDT", trade_amount)

# STEP 6: Execute Trade
trade = execute_trade(signal, "BTC", current_price)

# STEP 7: Update Wallet After Trade
if trade["success"]:
    # Unlock USDT
    unlock_balance_after_trade("USDT", trade_amount)
    
    # Add BTC to wallet
    wallet_state["balances"]["BTC"] += trade["quantity"]
    
    # Record transaction
    record_wallet_transaction({
        "type": "TRADE",
        "from_currency": "USDT",
        "to_currency": "BTC",
        "amount": trade_amount,
        "quantity": trade["quantity"]
    })

# STEP 8: Update User Stats
update_user_stats({
    "total_trades": user["stats"]["total_trades"] + 1,
    "total_profit": user["stats"]["total_profit"] + trade["profit_loss"]
})
```

---

## 🎯 **Summary: Complete System Architecture**

Platform ini sekarang memiliki **sistem lengkap** dengan:

### **Core Trading Components:**
1. ✅ **AI Prediction Engine** - Multi-indicator analysis
2. ✅ **Smart Contract** - Validation & on-chain recording
3. ✅ **Oracle Layer** - Data verification
4. ✅ **Trading Engine** - Execution & P&L management
5. ✅ **Risk Management** - Position sizing & limits

### **User Management:**
6. ✅ **User Profile** - Preferences & risk tolerance
7. ✅ **User Stats** - Performance tracking
8. ✅ **Wallet System** - Multi-currency balances
9. ✅ **Transaction History** - Complete audit trail

### **Data & Analytics:**
10. ✅ **Live Market Data** - WEEX API integration
11. ✅ **Backtesting Engine** - Strategy testing
12. ✅ **Performance Analytics** - Win rate, P&L, metrics
13. ✅ **Real-time Updates** - WebSocket streaming

### **API Endpoints (Total: 25+)**
- Market Data: 2 endpoints
- Trading: 3 endpoints
- Smart Contract: 4 endpoints
- Oracle: 1 endpoint
- Backtesting: 3 endpoints
- User Profile: 3 endpoints
- Wallet: 5 endpoints
- Dashboard: 2 endpoints
- System: 2 endpoints

**Perfect untuk WEEX AI Trading Hackathon!** 🏆🚀💰
