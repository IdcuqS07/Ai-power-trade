# 🎯 Quick Deploy Reference Card

**Print this or keep it handy during deployment!**

---

## 📋 Pre-Deployment

### Get Binance Testnet Keys
```
URL: https://testnet.binance.vision/
1. Login with GitHub
2. API Keys → Generate HMAC_SHA256
3. Copy both keys NOW!
4. Faucet → Get test USDT
```

---

## 🔧 Backend Deployment (Render)

### Service Settings
```yaml
Name: ai-trading-backend
Language: Python
Branch: main
Root: comprehensive_backend
Build: pip install -r requirements.txt
Start: uvicorn main:app --host 0.0.0.0 --port $PORT
```

### Environment Variables
```bash
BINANCE_MODE=testnet
BINANCE_TESTNET_API_KEY=your_key
BINANCE_TESTNET_SECRET=your_secret
```

### Deploy URL
```
https://ai-trading-backend-xxxx.onrender.com
```

---

## 🎨 Frontend Deployment (Vercel)

### Quick Deploy
```bash
npm install -g vercel
cd comprehensive_frontend
vercel
```

### Environment Variable
```bash
NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com
```

### Deploy URL
```
https://your-app.vercel.app
```

---

## ✅ Testing

### Backend Health
```bash
curl https://your-backend/api/status
```

### Expected Response
```json
{
  "binance": {
    "trading": {
      "configured": true,
      "mode": "testnet"
    }
  }
}
```

### Frontend Test
1. Open frontend URL
2. Check prices loading
3. Verify "Binance: Connected"
4. Execute test trade

---

## 🐛 Quick Fixes

| Problem | Solution |
|---------|----------|
| Build fails | Check Python 3.9+ |
| App crashes | Verify env vars |
| Binance error | Check API keys |
| Frontend 404 | Update API URL |

---

## 📞 Help

- Full Guide: `DEPLOYMENT_GUIDE.md`
- Env Vars: `ENVIRONMENT_VARIABLES.md`
- Checklist: `DEPLOYMENT_CHECKLIST.md`

---

## 🎉 Success!

- [ ] Backend deployed
- [ ] Frontend deployed
- [ ] Binance connected
- [ ] Test trade works

**Backend:** `___________________`  
**Frontend:** `___________________`  
**Date:** `___________________`

---

**Keep this card for future deployments!**
