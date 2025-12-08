# 🚀 DEPLOY NOW - 5 Minute Guide

## Step 1: Get Binance Testnet Keys (2 min)

1. Go to: **https://testnet.binance.vision/**
2. Click: **"Login with GitHub"**
3. Click: **"API Keys"** → **"Generate HMAC_SHA256 Key"**
4. **COPY BOTH KEYS NOW!** (Secret shown only once)
5. Click: **"Faucet"** → Request test USDT

✅ You now have:
- API Key: `abc123...`
- Secret Key: `xyz789...`

---

## Step 2: Deploy Backend to Render (3 min)

1. Go to: **https://dashboard.render.com/**
2. Click: **"New +"** → **"Web Service"**
3. Connect your GitHub repo

### Fill in these fields:

```
Name: ai-trading-backend
Language: Python
Branch: main
Root Directory: comprehensive_backend
Build Command: pip install -r requirements.txt
Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
```

### Add Environment Variables:

Click **"Advanced"** → **"Add Environment Variable"**

```
BINANCE_MODE = testnet
BINANCE_TESTNET_API_KEY = [paste your API key]
BINANCE_TESTNET_SECRET = [paste your secret key]
```

4. Click: **"Create Web Service"**
5. Wait 3-5 minutes
6. Copy your backend URL: `https://ai-trading-backend-xxxx.onrender.com`

---

## Step 3: Deploy Frontend to Vercel (2 min)

### Option A: Vercel CLI (Recommended)
```bash
npm install -g vercel
cd comprehensive_frontend
vercel
```

### Option B: Vercel Dashboard
1. Go to: **https://vercel.com/new**
2. Import your GitHub repo
3. Set Root Directory: `comprehensive_frontend`
4. Click: **"Deploy"**

### Add Environment Variable:
1. Go to: **Settings** → **Environment Variables**
2. Add:
```
NEXT_PUBLIC_API_URL = https://ai-trading-backend-xxxx.onrender.com
```
3. Click: **"Redeploy"**

---

## Step 4: Test Everything (1 min)

### Test Backend:
```bash
curl https://your-backend-url.onrender.com/api/status
```

Should see:
```json
{
  "binance": {
    "trading": {
      "configured": true,
      "status": "Ready",
      "mode": "testnet"
    }
  }
}
```

### Test Frontend:
1. Open your frontend URL
2. Check prices are loading
3. Look for "Binance: Connected" status
4. Try executing a test trade

---

## ✅ Success Checklist

- [ ] Backend deployed and running
- [ ] Frontend deployed and running
- [ ] Binance shows "Connected"
- [ ] Prices are loading
- [ ] Test trade executes successfully

---

## 🎉 You're Live!

**Backend:** `_______________________`  
**Frontend:** `_______________________`

---

## 🐛 Quick Fixes

### Backend won't start?
- Check Render logs
- Verify environment variables are set
- Confirm Python version is 3.9+

### Frontend can't connect?
- Check `NEXT_PUBLIC_API_URL` is correct
- Verify backend is running
- Check browser console for errors

### Binance not working?
- Verify API keys are correct
- Check `BINANCE_MODE=testnet`
- Ensure testnet account has funds

---

## 📚 More Help

- **Full Guide:** `DEPLOYMENT_GUIDE.md`
- **Environment Vars:** `ENVIRONMENT_VARIABLES.md`
- **Checklist:** `DEPLOYMENT_CHECKLIST.md`
- **Troubleshooting:** `TROUBLESHOOTING.md`

---

**That's it! Start trading! 📈**
