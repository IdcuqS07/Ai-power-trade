# ⚡ Binance Trading - Quick Start

## 🚀 5-Minute Setup

### Step 1: Get API Key (2 minutes)

**Testnet** (Recommended):
1. Go to: https://testnet.binance.vision/
2. Login with GitHub
3. Click "Generate HMAC-SHA-256 Key"
4. Copy API Key & Secret

**Production** (Real money):
1. Go to: https://www.binance.com/en/my/settings/api-management
2. Create API Key
3. Enable: Spot Trading, Reading
4. Disable: Withdrawals
5. Copy API Key & Secret

---

### Step 2: Configure (1 minute)

```bash
cd comprehensive_backend
cp .env.example .env
nano .env  # or use your editor
```

**Paste your credentials:**

```bash
# For Testnet
BINANCE_MODE=testnet
BINANCE_TESTNET_API_KEY=your_key_here
BINANCE_TESTNET_SECRET=your_secret_here

# For Production
BINANCE_MODE=production
BINANCE_API_KEY=your_key_here
BINANCE_SECRET=your_secret_here
```

Save and exit.

---

### Step 3: Restart Backend (1 minute)

```bash
# Stop backend (Ctrl+C)

# Start again
cd comprehensive_backend
source venv/bin/activate
python main.py
```

---

### Step 4: Test (1 minute)

```bash
# Check status
curl http://localhost:8000/api/binance/status

# Check balance
curl http://localhost:8000/api/binance/balance
```

---

## ✅ You're Ready!

**Test trade:**
```bash
curl -X POST http://localhost:8000/api/binance/ai-trade?symbol=BTC/USDT&usdt_amount=10
```

---

## 📝 Quick Commands

```bash
# Check balance
curl http://localhost:8000/api/binance/balance

# Get all balances
curl http://localhost:8000/api/binance/balances

# View open orders
curl http://localhost:8000/api/binance/orders/open

# AI trade
curl -X POST http://localhost:8000/api/binance/ai-trade?symbol=BTC/USDT&usdt_amount=50
```

---

## 🎯 For Demo

1. Open dashboard: http://localhost:3000
2. Show Binance status
3. Execute AI trade
4. Show order history
5. Impress judges! 🏆

---

**Full Guide**: See [BINANCE_TRADING_SETUP.md](BINANCE_TRADING_SETUP.md)
