# 🏆 WEEX Competition Trading Pairs

## ✅ **All 8 Required Pairs Supported**

Platform sekarang mendukung **semua 8 trading pairs** yang diwajibkan untuk WEEX AI Trading Hackathon:

### **Competition Pairs:**

1. **cmt_btcusdt** - Bitcoin (BTC)
2. **cmt_ethusdt** - Ethereum (ETH)
3. **cmt_solusdt** - Solana (SOL)
4. **cmt_dogeusdt** - Dogecoin (DOGE)
5. **cmt_xrpusdt** - Ripple (XRP)
6. **cmt_adausdt** - Cardano (ADA)
7. **cmt_bnbusdt** - Binance Coin (BNB)
8. **cmt_ltcusdt** - Litecoin (LTC)

---

## 📊 **Implementation Details**

### **Backend Support:**
```python
# All 8 pairs initialized
COMPETITION_SYMBOLS = ["BTC", "ETH", "SOL", "DOGE", "XRP", "ADA", "BNB", "LTC"]

# CoinGecko mapping
COIN_IDS = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'SOL': 'solana',
    'DOGE': 'dogecoin',
    'XRP': 'ripple',
    'ADA': 'cardano',
    'BNB': 'binancecoin',
    'LTC': 'litecoin'
}
```

### **Frontend Display:**
- Grid layout: 2x4 (mobile) or 4x2 (desktop)
- Real-time prices for all 8 coins
- 24h change indicators
- Click to select for trading

---

## 🎯 **Features Per Coin**

Each coin supports:
- ✅ Real-time price data (CoinGecko API)
- ✅ AI signal generation (BUY/SELL/HOLD)
- ✅ ML predictions (Random Forest)
- ✅ Technical indicators (RSI, MACD, MA, etc.)
- ✅ On-chain trade execution
- ✅ Auto-settlement
- ✅ Performance tracking

---

## 🚀 **How to Use**

### **1. View All Pairs**
Open dashboard: http://localhost:3000

You'll see coin selector with all 8 pairs:
```
┌──────┬──────┬──────┬──────┐
│ BTC  │ ETH  │ SOL  │ DOGE │
│$89K  │$3.0K │$131  │$0.31 │
├──────┼──────┼──────┼──────┤
│ XRP  │ ADA  │ BNB  │ LTC  │
│$2.10 │$0.85 │$887  │$98   │
└──────┴──────┴──────┴──────┘
```

### **2. Select Any Coin**
Click on any coin card to select it for trading

### **3. Get AI Signal**
AI will analyze selected coin and provide:
- Signal (BUY/SELL/HOLD)
- Confidence score
- ML prediction
- Risk assessment

### **4. Execute Trade**
Click "Execute Trade - [COIN]" to trade selected pair

---

## 📈 **Price Ranges**

Typical price ranges for each coin:

| Coin | Symbol | Price Range | Decimals |
|------|--------|-------------|----------|
| Bitcoin | BTC | $80,000 - $100,000 | 2 |
| Ethereum | ETH | $2,500 - $4,000 | 2 |
| Solana | SOL | $100 - $200 | 2 |
| Dogecoin | DOGE | $0.10 - $0.50 | 4 |
| Ripple | XRP | $1.50 - $3.00 | 4 |
| Cardano | ADA | $0.50 - $1.50 | 4 |
| BNB | BNB | $500 - $1,000 | 2 |
| Litecoin | LTC | $80 - $150 | 2 |

---

## 🔄 **Data Sources**

### **Primary: CoinGecko API**
- Real-time prices
- 24h change
- Volume data
- Free tier (rate limited)

### **Fallback: Simulated Data**
- If API rate limit hit
- Realistic price movements
- Based on historical patterns

### **Future: WEEX Official API**
- Direct integration with WEEX
- Competition-specific data
- Lower latency
- Higher rate limits

---

## ✅ **Compliance Check**

**Requirement:** Only designated trading pairs permitted

**Status:** ✅ **COMPLIANT**

Platform exclusively supports the 8 required pairs:
- ✅ cmt_btcusdt
- ✅ cmt_ethusdt
- ✅ cmt_solusdt
- ✅ cmt_dogeusdt
- ✅ cmt_xrpusdt
- ✅ cmt_adausdt
- ✅ cmt_bnbusdt
- ✅ cmt_ltcusdt

No other pairs are available for trading.

---

## 🎯 **Verification**

To verify all 8 pairs are active:

```bash
# Check API
curl http://localhost:8000/api/dashboard | jq '.data.prices | keys'

# Expected output:
# ["ADA", "BNB", "BTC", "DOGE", "ETH", "LTC", "SOL", "XRP"]
```

Or visit dashboard and count coin cards in selector.

---

## 📊 **Trading Statistics**

Platform tracks performance across all 8 pairs:
- Total trades per coin
- Win rate per coin
- Best performing coin
- Most traded coin
- Aggregate P&L

---

## 🏆 **Competition Ready**

Platform is **fully compliant** with WEEX Competition requirements:
- ✅ All 8 required pairs supported
- ✅ Real-time price data
- ✅ AI/ML predictions for each pair
- ✅ On-chain execution
- ✅ Performance tracking

**Ready for submission!** 🚀
