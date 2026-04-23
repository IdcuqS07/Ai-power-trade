# 🚀 Render.com Deployment - Step by Step

## Quick Deploy Checklist for Render

### ✅ Backend Deployment

#### 1. Create Web Service
- Go to: https://dashboard.render.com/
- Click: **New +** → **Web Service**
- Connect your GitHub repository

#### 2. Service Configuration

| Setting | Value |
|---------|-------|
| **Name** | `ai-trading-backend` |
| **Language** | `Python` |
| **Branch** | `main` |
| **Root Directory** | `comprehensive_backend` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn main:app --host 0.0.0.0 --port $PORT` |

#### 3. Environment Variables

Click **Advanced** → **Add Environment Variable**

```bash
BINANCE_MODE=testnet
BINANCE_TESTNET_API_KEY=your_testnet_api_key
BINANCE_TESTNET_SECRET=your_testnet_secret
```

**Optional variables:**
```bash
WEEX_API_KEY=your_weex_key
WEEX_SECRET_KEY=your_weex_secret
OWNER_PRIVATE_KEY=your_private_key
ENVIRONMENT=production
LOG_LEVEL=INFO
```

#### 4. Deploy
- Click **Create Web Service**
- Wait 3-5 minutes for deployment
- Your backend will be at: `https://ai-trading-backend.onrender.com`

---

### ✅ Frontend Deployment (Vercel)

#### 1. Install Vercel CLI
```bash
npm install -g vercel
```

#### 2. Deploy
```bash
cd comprehensive_frontend
vercel
```

#### 3. Add Environment Variable
In Vercel Dashboard:
```bash
NEXT_PUBLIC_API_URL=https://ai-trading-backend.onrender.com
```

---

## 🔑 Get Binance Testnet Keys

### Quick Steps:
1. Visit: https://testnet.binance.vision/
2. Click **"Login with GitHub"**
3. Go to **"API Keys"** section
4. Click **"Generate HMAC_SHA256 Key"**
5. Copy both API Key and Secret (secret shown only once!)
6. Go to **"Faucet"** and get test USDT

---

## 🧪 Test Your Deployment

### Backend Health Check
```bash
curl https://ai-trading-backend.onrender.com/
```

Expected response:
```json
{
  "name": "AI Trading Platform - Binance Edition",
  "version": "3.0",
  "status": "operational"
}
```

### API Status Check
```bash
curl https://ai-trading-backend.onrender.com/api/status
```

### Dashboard Data
```bash
curl https://ai-trading-backend.onrender.com/api/dashboard
```

---

## 🐛 Common Issues

### Issue: Build fails
**Solution:** Check Python version in Render settings (should be 3.9+)

### Issue: App crashes on start
**Solution:** Check logs in Render dashboard, verify environment variables

### Issue: Binance connection fails
**Solution:** 
- Verify API keys are correct
- Check `BINANCE_MODE=testnet`
- Ensure testnet account has funds

### Issue: Frontend can't connect
**Solution:**
- Verify `NEXT_PUBLIC_API_URL` is set correctly
- Check CORS settings in backend
- Ensure backend is running

---

## 📊 Monitor Your App

### Render Dashboard
- View logs: Dashboard → Your Service → Logs
- Check metrics: Dashboard → Your Service → Metrics
- View events: Dashboard → Your Service → Events

### Health Monitoring
Set up monitoring at:
- https://uptimerobot.com/ (free)
- https://www.pingdom.com/

---

## 🎯 Next Steps

After successful deployment:

1. **Test thoroughly** - Execute test trades on testnet
2. **Monitor logs** - Watch for errors or issues
3. **Check performance** - Verify response times
4. **Document URLs** - Save your backend and frontend URLs
5. **Set up alerts** - Configure uptime monitoring

---

## 📞 Need Help?

- Render Docs: https://render.com/docs
- Binance Testnet: https://testnet.binance.vision/
- Project Issues: [Your GitHub Issues]

---

**Happy Deploying! 🎉**
