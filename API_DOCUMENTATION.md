# API Documentation - AI Trading Platform

Base URL: `http://localhost:8000`

## Table of Contents
1. [General](#general)
2. [Dashboard](#dashboard)
3. [Market Data](#market-data)
4. [Predictions](#predictions)
5. [Trading](#trading)
6. [Smart Contract](#smart-contract)
7. [Oracle](#oracle)
8. [WebSocket](#websocket)

---

## General

### Get API Info
```http
GET /
```

**Response:**
```json
{
  "name": "AI Trading Platform - Comprehensive",
  "version": "3.0",
  "status": "operational",
  "features": [
    "AI Prediction Engine",
    "Smart Contract Validation",
    "Oracle Verification",
    "Risk Management",
    "Real-time Trading"
  ]
}
```

---

## Dashboard

### Get Complete Dashboard Data
```http
GET /api/dashboard
```

**Response:**
```json
{
  "success": true,
  "data": {
    "prices": {
      "BTC": {
        "price": 50234.56,
        "change_24h": 2.34,
        "high_24h": 51500.00,
        "low_24h": 49000.00
      },
      "ETH": { ... },
      "BNB": { ... },
      "SOL": { ... }
    },
    "current_signal": {
      "signal": "BUY",
      "confidence": 0.785,
      "buy_score": 5.5,
      "sell_score": 2.0,
      "risk_score": 45,
      "position_size": 12.5,
      "indicators": { ... },
      "timestamp": "2024-12-03T10:30:00"
    },
    "portfolio": {
      "total_value": 10500.00,
      "profit_loss": 500.00,
      "profit_loss_pct": 5.0,
      "positions_count": 3,
      "balance": 10000.00
    },
    "performance": {
      "total_trades": 25,
      "winning_trades": 18,
      "losing_trades": 7,
      "win_rate": 72.0,
      "total_profit": 1250.50,
      "avg_profit": 50.02
    },
    "smart_contract": {
      "total_validations": 30,
      "passed_validations": 25,
      "validation_pass_rate": 83.33,
      "total_records": 25,
      "total_settlements": 25,
      "risk_limits": { ... }
    },
    "oracle": {
      "total_verifications": 30,
      "verified_count": 28,
      "verification_rate": 93.33
    },
    "trades_today": 5
  }
}
```

---

## Market Data

### Get Current Prices
```http
GET /api/market/prices
```

**Response:**
```json
{
  "success": true,
  "data": {
    "BTC": {
      "price": 50234.56,
      "change": 1.23
    },
    "ETH": {
      "price": 3012.45,
      "change": -0.56
    },
    "BNB": { ... },
    "SOL": { ... }
  }
}
```

---

## Predictions

### Get AI Prediction for Symbol
```http
GET /api/predictions/{symbol}
```

**Parameters:**
- `symbol` (path): Symbol to predict (BTC, ETH, BNB, SOL)

**Example:**
```http
GET /api/predictions/BTC
```

**Response:**
```json
{
  "success": true,
  "symbol": "BTC",
  "prediction": {
    "signal": "BUY",
    "confidence": 0.785,
    "buy_score": 5.5,
    "sell_score": 2.0,
    "risk_score": 45,
    "position_size": 12.5,
    "indicators": {
      "rsi": 35.6,
      "ma_5": 50100.00,
      "ma_20": 49800.00,
      "macd": 150.25,
      "bb_upper": 51500.00,
      "bb_lower": 48500.00,
      "volatility": 0.025,
      "current_price": 50234.56
    },
    "timestamp": "2024-12-03T10:30:00"
  }
}
```

---

## Trading

### Execute Trade
```http
POST /api/trades/execute
```

**Request Body:**
```json
{
  "symbol": "BTC",
  "force_execute": false
}
```

**Parameters:**
- `symbol` (required): Trading symbol
- `force_execute` (optional): Skip validations (default: false)

**Success Response:**
```json
{
  "success": true,
  "trade": {
    "trade_id": "TRD_1",
    "symbol": "BTC",
    "type": "BUY",
    "quantity": 0.024567,
    "price": 50234.56,
    "value": 1234.56,
    "profit_loss": 45.67,
    "confidence": 0.785,
    "timestamp": "2024-12-03T10:30:00"
  },
  "oracle_verification": {
    "verification_id": 1,
    "signal_hash": "abc123...",
    "is_verified": true,
    "reasons": ["All checks passed"],
    "timestamp": "2024-12-03T10:30:00"
  },
  "validation": {
    "validation_id": 1,
    "is_valid": true,
    "validations": [
      {
        "rule": "min_confidence",
        "passed": true,
        "message": "OK"
      },
      ...
    ],
    "timestamp": "2024-12-03T10:30:00",
    "block_hash": "def456..."
  },
  "on_chain_record": {
    "record_id": 1,
    "block_number": 1,
    "block_hash": "ghi789...",
    "previous_hash": "000...",
    "timestamp": "2024-12-03T10:30:00"
  },
  "settlement": {
    "settlement_id": 1,
    "trade_id": "TRD_1",
    "profit_loss": 45.67,
    "status": "SETTLED",
    "timestamp": "2024-12-03T10:30:00"
  }
}
```

**Failure Response (Oracle):**
```json
{
  "success": false,
  "stage": "oracle_verification",
  "reason": "Oracle verification failed",
  "verification": {
    "is_verified": false,
    "reasons": ["Confidence suspiciously high"]
  }
}
```

**Failure Response (Smart Contract):**
```json
{
  "success": false,
  "stage": "smart_contract_validation",
  "reason": "Validation failed",
  "validation": {
    "is_valid": false,
    "validations": [
      {
        "rule": "max_daily_loss",
        "passed": false,
        "message": "Daily loss limit exceeded"
      }
    ]
  }
}
```

### Get Trade History
```http
GET /api/trades/history?limit=20
```

**Parameters:**
- `limit` (optional): Number of trades to return (default: 20)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "trade_id": "TRD_1",
      "symbol": "BTC",
      "type": "BUY",
      "quantity": 0.024567,
      "price": 50234.56,
      "value": 1234.56,
      "profit_loss": 45.67,
      "confidence": 0.785,
      "timestamp": "2024-12-03T10:30:00"
    },
    ...
  ],
  "count": 20
}
```

### Get Performance Metrics
```http
GET /api/trades/performance
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_trades": 25,
    "winning_trades": 18,
    "losing_trades": 7,
    "win_rate": 72.0,
    "total_profit": 1250.50,
    "avg_profit": 50.02,
    "best_trade": 234.56,
    "worst_trade": -123.45
  }
}
```

---

## Smart Contract

### Get On-Chain Records
```http
GET /api/smartcontract/records?limit=20
```

**Parameters:**
- `limit` (optional): Number of records (default: 20)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "record_id": 1,
      "trade": { ... },
      "block_number": 1,
      "block_hash": "abc123...",
      "previous_hash": "000...",
      "timestamp": "2024-12-03T10:30:00"
    },
    ...
  ],
  "count": 20
}
```

### Get Validations
```http
GET /api/smartcontract/validations?limit=20
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "validation_id": 1,
      "is_valid": true,
      "validations": [
        {
          "rule": "min_confidence",
          "passed": true,
          "message": "OK"
        },
        ...
      ],
      "timestamp": "2024-12-03T10:30:00",
      "block_hash": "abc123..."
    },
    ...
  ],
  "count": 20
}
```

### Get Risk Limits
```http
GET /api/smartcontract/risk-limits
```

**Response:**
```json
{
  "success": true,
  "data": {
    "max_position_size_pct": 20,
    "max_daily_loss_pct": 5,
    "min_confidence": 0.65,
    "max_daily_trades": 50
  }
}
```

### Update Risk Limits
```http
POST /api/smartcontract/risk-limits
```

**Request Body:**
```json
{
  "max_position_size_pct": 15,
  "max_daily_loss_pct": 3,
  "min_confidence": 0.7
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "max_position_size_pct": 15,
    "max_daily_loss_pct": 3,
    "min_confidence": 0.7,
    "max_daily_trades": 50
  }
}
```

---

## Oracle

### Get Verifications
```http
GET /api/oracle/verifications?limit=20
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "verification_id": 1,
      "signal_hash": "abc123...",
      "is_verified": true,
      "reasons": ["All checks passed"],
      "timestamp": "2024-12-03T10:30:00"
    },
    ...
  ],
  "count": 20
}
```

---

## WebSocket

### Real-time Market Updates
```
WS /ws
```

**Connection:**
```javascript
const ws = new WebSocket('ws://localhost:8000/ws');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(data);
};
```

**Message Format:**
```json
{
  "type": "market_update",
  "prices": {
    "BTC": 50234.56,
    "ETH": 3012.45,
    "BNB": 305.67,
    "SOL": 102.34
  },
  "pnl": 500.00,
  "balance": 10000.00,
  "timestamp": "2024-12-03T10:30:00"
}
```

**Update Frequency:** Every 2 seconds

---

## Error Responses

### 404 Not Found
```json
{
  "detail": "Symbol not found"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Error message here"
}
```

---

## Rate Limiting

Currently no rate limiting is implemented. For production use, consider:
- 100 requests per minute per IP
- 10 trade executions per minute
- WebSocket: 1 connection per user

---

## Authentication

Currently no authentication is required. For production use, implement:
- JWT tokens
- API keys
- OAuth 2.0

---

## Testing with cURL

### Get Dashboard
```bash
curl http://localhost:8000/api/dashboard
```

### Execute Trade
```bash
curl -X POST http://localhost:8000/api/trades/execute \
  -H "Content-Type: application/json" \
  -d '{"symbol": "BTC", "force_execute": false}'
```

### Get Predictions
```bash
curl http://localhost:8000/api/predictions/BTC
```

---

## Interactive API Documentation

FastAPI provides interactive API documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

These interfaces allow you to:
- View all endpoints
- Test API calls
- See request/response schemas
- Download OpenAPI specification

---

**Note**: This API is for demonstration purposes. Production deployment requires additional security, authentication, and rate limiting.
