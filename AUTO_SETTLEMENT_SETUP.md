# 🤖 Auto-Settlement Setup Guide

## What is Auto-Settlement?

Auto-settlement automatically closes trades after 1 minute and returns tokens to users with simulated P&L.

## Setup (2 minutes)

### Step 1: Create .env file

```bash
cd comprehensive_backend
cp .env.example .env
```

### Step 2: Add Your Private Key

Edit `.env` file:
```
OWNER_PRIVATE_KEY=your_private_key_here
```

**Important:**
- Use the SAME wallet that deployed the contract
- This is your testnet wallet private key
- Keep it SECRET!

### Step 3: Restart Backend

```bash
# Stop current backend (Ctrl+C)
# Then restart:
source venv/bin/activate
python main.py
```

You'll see:
```
🤖 Auto-settlement service started
```

## How It Works

```
User Execute Trade
    ↓
Tokens locked (immediate)
    ↓
Wait 1 minute
    ↓
Auto-settlement runs
    ↓
Calculate P&L (-5% to +8%)
    ↓
Return tokens to user
    ↓
User can trade again!
```

## Without Auto-Settlement

If you don't set OWNER_PRIVATE_KEY:
- ✅ Trading still works
- ✅ Tokens get locked
- ⚠️ Manual settlement needed
- 💡 Good for demo, but not production

## With Auto-Settlement

- ✅ Fully automatic
- ✅ Tokens returned after 1 min
- ✅ Real DeFi experience
- ✅ Production-ready

## Monitoring

Backend logs will show:
```
🤖 Auto-settlement service started
Settling trade 1: P&L = 850000000000000000
Settlement tx sent: 0x...
✓ Trade 1 settled successfully!
```

## Gas Costs

Each settlement costs ~0.0002 tBNB
- You have ~0.23 tBNB
- Can settle ~1000 trades
- More than enough for testing!

## For Production

In production, you'd:
1. Use secure key management (AWS KMS, etc)
2. Monitor settlement service health
3. Add retry logic
4. Scale horizontally

## Current Status

**Without .env:** Auto-settlement disabled (manual only)
**With .env:** Auto-settlement active (every 30 seconds check)

---

**Ready to enable auto-settlement? Follow steps above!** 🚀
