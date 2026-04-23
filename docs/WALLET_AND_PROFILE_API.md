# 👤💰 Wallet & User Profile API Documentation

## Overview
Dokumentasi lengkap untuk User Profile Management dan Wallet System di AI Trading Platform.

---

## 👤 User Profile API

### 1. Get User Profile
Mendapatkan informasi profil user.

**Endpoint:** `GET /api/user/profile`

**Response:**
```json
{
    "success": true,
    "data": {
        "user_id": "USER_001",
        "username": "AI Trader",
        "email": "trader@aitrade.com",
        "created_at": "2024-12-04T10:00:00",
        "risk_tolerance": "moderate",
        "trading_strategy": "ai_multi_indicator",
        "preferences": {
            "auto_trade": false,
            "notifications": true,
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
}
```

---

### 2. Update User Profile
Update informasi profil user.

**Endpoint:** `PUT /api/user/profile`

**Request Body:**
```json
{
    "username": "Pro Trader",
    "email": "protrader@aitrade.com",
    "risk_tolerance": "aggressive",
    "trading_strategy": "momentum"
}
```

**Risk Tolerance Options:**
- `conservative` - Lower risk, higher confidence required (min 75%)
- `moderate` - Balanced approach (min 65%)
- `aggressive` - Higher risk, higher reward (min 55%)

**Response:**
```json
{
    "success": true,
    "message": "Profile updated successfully",
    "data": {
        "user_id": "USER_001",
        "username": "Pro Trader",
        "email": "protrader@aitrade.com",
        "risk_tolerance": "aggressive",
        ...
    }
}
```

---

### 3. Get User Statistics
Mendapatkan statistik trading user.

**Endpoint:** `GET /api/user/stats`

**Response:**
```json
{
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

## 💰 Wallet API

### 1. Get Wallet Information
Mendapatkan informasi lengkap wallet.

**Endpoint:** `GET /api/wallet`

**Response:**
```json
{
    "success": true,
    "data": {
        "wallet_id": "WALLET_001",
        "balances": {
            "USDT": 10000.0,
            "BTC": 0.5,
            "ETH": 2.0,
            "BNB": 10.0,
            "SOL": 50.0
        },
        "locked_balances": {
            "USDT": 0.0,
            "BTC": 0.1,
            "ETH": 0.0,
            "BNB": 0.0,
            "SOL": 0.0
        },
        "transaction_history": [...],
        "total_deposited": 10000.0,
        "total_withdrawn": 0.0,
        "created_at": "2024-12-04T10:00:00",
        "total_value_usdt": 35234.56,
        "available_balance": 10000.0,
        "locked_balance": 5117.28
    }
}
```

---

### 2. Get All Balances
Mendapatkan detail balance semua currency dengan nilai USDT.

**Endpoint:** `GET /api/wallet/balances`

**Response:**
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
        },
        {
            "currency": "ETH",
            "balance": 2.0,
            "locked": 0.0,
            "available": 2.0,
            "price_usdt": 3012.45,
            "value_usdt": 6024.90
        },
        {
            "currency": "BNB",
            "balance": 10.0,
            "locked": 0.0,
            "available": 10.0,
            "price_usdt": 305.67,
            "value_usdt": 3056.70
        },
        {
            "currency": "SOL",
            "balance": 50.0,
            "locked": 0.0,
            "available": 50.0,
            "price_usdt": 102.34,
            "value_usdt": 5117.00
        }
    ]
}
```

---

### 3. Deposit to Wallet
Deposit dana ke wallet.

**Endpoint:** `POST /api/wallet/deposit`

**Request Body:**
```json
{
    "operation": "deposit",
    "amount": 5000,
    "currency": "USDT"
}
```

**Supported Currencies:**
- `USDT` - Tether (base currency)
- `BTC` - Bitcoin
- `ETH` - Ethereum
- `BNB` - Binance Coin
- `SOL` - Solana

**Response:**
```json
{
    "success": true,
    "message": "Deposited 5000 USDT",
    "transaction": {
        "tx_id": "TX_1",
        "type": "DEPOSIT",
        "currency": "USDT",
        "amount": 5000,
        "status": "COMPLETED",
        "timestamp": "2024-12-04T10:30:00"
    },
    "new_balance": 15000.0
}
```

**Error Response:**
```json
{
    "detail": "Amount must be positive"
}
```

---

### 4. Withdraw from Wallet
Withdraw dana dari wallet.

**Endpoint:** `POST /api/wallet/withdraw`

**Request Body:**
```json
{
    "operation": "withdraw",
    "amount": 1000,
    "currency": "USDT"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Withdrew 1000 USDT",
    "transaction": {
        "tx_id": "TX_2",
        "type": "WITHDRAW",
        "currency": "USDT",
        "amount": 1000,
        "status": "COMPLETED",
        "timestamp": "2024-12-04T11:00:00"
    },
    "new_balance": 9000.0
}
```

**Error Response:**
```json
{
    "detail": "Insufficient balance"
}
```

---

### 5. Get Transaction History
Mendapatkan riwayat transaksi wallet.

**Endpoint:** `GET /api/wallet/transactions?limit=20`

**Query Parameters:**
- `limit` (optional) - Jumlah transaksi yang ditampilkan (default: 20)

**Response:**
```json
{
    "success": true,
    "data": [
        {
            "tx_id": "TX_2",
            "type": "WITHDRAW",
            "currency": "USDT",
            "amount": 1000,
            "status": "COMPLETED",
            "timestamp": "2024-12-04T11:00:00"
        },
        {
            "tx_id": "TX_1",
            "type": "DEPOSIT",
            "currency": "USDT",
            "amount": 5000,
            "status": "COMPLETED",
            "timestamp": "2024-12-04T10:30:00"
        }
    ],
    "count": 2
}
```

**Transaction Types:**
- `DEPOSIT` - Deposit ke wallet
- `WITHDRAW` - Withdraw dari wallet
- `TRADE` - Trading transaction (buy/sell)

---

## 🔄 Integration Examples

### Example 1: Complete User Setup Flow

```javascript
// 1. Get user profile
const profile = await fetch('http://localhost:8000/api/user/profile');
console.log('User:', profile.data.username);

// 2. Update risk tolerance
await fetch('http://localhost:8000/api/user/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        risk_tolerance: 'aggressive'
    })
});

// 3. Deposit funds
await fetch('http://localhost:8000/api/wallet/deposit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        operation: 'deposit',
        amount: 10000,
        currency: 'USDT'
    })
});

// 4. Check wallet balance
const wallet = await fetch('http://localhost:8000/api/wallet/balances');
console.log('Total Value:', wallet.data.reduce((sum, b) => sum + b.value_usdt, 0));
```

---

### Example 2: Trading with Wallet Integration

```javascript
// 1. Check available balance
const wallet = await fetch('http://localhost:8000/api/wallet');
const availableUSDT = wallet.data.balances.USDT - wallet.data.locked_balances.USDT;

console.log('Available for trading:', availableUSDT);

// 2. Get AI prediction
const prediction = await fetch('http://localhost:8000/api/predictions/BTC');
console.log('Signal:', prediction.prediction.signal);
console.log('Confidence:', prediction.prediction.confidence);

// 3. Execute trade (if sufficient balance)
if (availableUSDT > 100) {
    const trade = await fetch('http://localhost:8000/api/trades/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            symbol: 'BTC',
            force_execute: false
        })
    });
    
    if (trade.success) {
        console.log('Trade executed:', trade.trade.trade_id);
        console.log('P&L:', trade.trade.profit_loss);
    }
}

// 4. Check updated stats
const stats = await fetch('http://localhost:8000/api/user/stats');
console.log('Win Rate:', stats.data.win_rate + '%');
console.log('Total Profit:', stats.data.total_profit);
```

---

### Example 3: Portfolio Management

```javascript
// Get complete portfolio overview
async function getPortfolioOverview() {
    // 1. User stats
    const stats = await fetch('http://localhost:8000/api/user/stats');
    
    // 2. Wallet balances
    const balances = await fetch('http://localhost:8000/api/wallet/balances');
    
    // 3. Calculate total value
    const totalValue = balances.data.reduce((sum, b) => sum + b.value_usdt, 0);
    
    // 4. Recent transactions
    const transactions = await fetch('http://localhost:8000/api/wallet/transactions?limit=10');
    
    return {
        totalValue: totalValue,
        winRate: stats.data.win_rate,
        totalProfit: stats.data.total_profit,
        balances: balances.data,
        recentTransactions: transactions.data
    };
}

// Usage
const portfolio = await getPortfolioOverview();
console.log('Portfolio Value:', portfolio.totalValue);
console.log('Win Rate:', portfolio.winRate + '%');
console.log('Total Profit:', portfolio.totalProfit);
```

---

## 🎯 Key Features

### User Profile
✅ **Risk Tolerance Management** - Conservative, Moderate, Aggressive
✅ **Trading Strategy Selection** - Multiple strategies available
✅ **Performance Tracking** - Win rate, profit, best trade
✅ **Customizable Preferences** - Auto-trade, notifications, limits

### Wallet System
✅ **Multi-Currency Support** - USDT, BTC, ETH, BNB, SOL
✅ **Real-time Balance Tracking** - Available & locked balances
✅ **Deposit & Withdrawal** - Easy fund management
✅ **Transaction History** - Complete audit trail
✅ **USDT Value Calculation** - All balances in USDT equivalent

### Security
✅ **Balance Validation** - Prevent overdraft
✅ **Locked Balance System** - Protect active positions
✅ **Transaction Recording** - Immutable history
✅ **Error Handling** - Comprehensive validation

---

## 📊 Response Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request (invalid parameters) |
| 404 | Not Found (invalid symbol/currency) |
| 500 | Internal Server Error |

---

## 🚀 Testing

### Test User Profile
```bash
# Get profile
curl http://localhost:8000/api/user/profile

# Update profile
curl -X PUT http://localhost:8000/api/user/profile \
  -H "Content-Type: application/json" \
  -d '{"risk_tolerance": "aggressive"}'

# Get stats
curl http://localhost:8000/api/user/stats
```

### Test Wallet
```bash
# Get wallet
curl http://localhost:8000/api/wallet

# Get balances
curl http://localhost:8000/api/wallet/balances

# Deposit
curl -X POST http://localhost:8000/api/wallet/deposit \
  -H "Content-Type: application/json" \
  -d '{"operation": "deposit", "amount": 5000, "currency": "USDT"}'

# Withdraw
curl -X POST http://localhost:8000/api/wallet/withdraw \
  -H "Content-Type: application/json" \
  -d '{"operation": "withdraw", "amount": 1000, "currency": "USDT"}'

# Get transactions
curl http://localhost:8000/api/wallet/transactions?limit=10
```

---

**Perfect untuk WEEX AI Trading Hackathon!** 🏆🚀💰
