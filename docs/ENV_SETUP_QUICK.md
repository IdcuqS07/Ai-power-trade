# ⚡ Quick Environment Setup

## 🎯 For Render.com Deployment

### Required Environment Variables:

```bash
BINANCE_MODE=testnet
BINANCE_TESTNET_API_KEY=your_key_here
BINANCE_TESTNET_SECRET=your_secret_here
```

### How to Add in Render:
1. Go to your service → **Environment** tab
2. Click **Add Environment Variable**
3. Add each variable above
4. Click **Save Changes**

---

## 🔑 Get Binance Testnet Keys (2 minutes)

1. **Visit:** https://testnet.binance.vision/
2. **Login:** Click "Login with GitHub"
3. **Generate Key:** 
   - Go to "API Keys" section
   - Click "Generate HMAC_SHA256 Key"
   - Copy both API Key and Secret immediately!
4. **Get Funds:**
   - Go to "Faucet" section
   - Request test USDT and BNB

---

## 📋 Deployment Settings

### Backend (Render/Railway/Heroku)

```yaml
Name: ai-trading-backend
Language: Python
Branch: main
Root Directory: comprehensive_backend
Build Command: pip install -r requirements.txt
Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
```

### Frontend (Vercel/Netlify)

```yaml
Framework: Next.js
Root Directory: comprehensive_frontend
Build Command: npm run build
Output Directory: .next
Environment Variable: NEXT_PUBLIC_API_URL=https://your-backend-url.com
```

---

## ✅ Verification Steps

### 1. Test Backend
```bash
curl https://your-backend-url.com/
curl https://your-backend-url.com/api/status
```

### 2. Test Binance Connection
```bash
curl https://your-backend-url.com/api/binance/status
```

Should return:
```json
{
  "configured": true,
  "mode": "testnet",
  "can_trade": true
}
```

### 3. Test Frontend
- Open your frontend URL
- Check if prices load
- Verify Binance status shows "Connected"

---

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Build fails | Check Python version (3.9+) |
| App crashes | Verify environment variables |
| Binance error | Check API keys and mode |
| Frontend can't connect | Update NEXT_PUBLIC_API_URL |

---

## 📞 Support

- Full Guide: See `DEPLOYMENT_GUIDE.md`
- Render Guide: See `RENDER_DEPLOY.md`
- API Docs: See `API_DOCUMENTATION.md`

---

**That's it! You're ready to deploy! 🚀**
