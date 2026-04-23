# 🚀 Deployment Guide - AI Trading Platform

## Quick Deploy to Render/Railway/Heroku

### 📋 Pre-Deployment Checklist

- [ ] Backend code ready in `comprehensive_backend/`
- [ ] Frontend code ready in `comprehensive_frontend/`
- [ ] Binance Testnet API keys obtained
- [ ] Environment variables prepared

---

## 🔧 Backend Deployment

### Option 1: Render.com (Recommended)

#### Step 1: Create New Web Service
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository

#### Step 2: Configure Service

```yaml
Name: ai-trading-backend
Language: Python
Branch: main
Root Directory: comprehensive_backend
Build Command: pip install -r requirements.txt
Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
```

#### Step 3: Add Environment Variables

Go to **Environment** tab and add:

```bash
# Required for Binance Trading
BINANCE_MODE=testnet
BINANCE_TESTNET_API_KEY=your_testnet_api_key
BINANCE_TESTNET_SECRET=your_testnet_secret

# Optional - WEEX Integration
WEEX_API_KEY=your_weex_key
WEEX_SECRET_KEY=your_weex_secret

# Optional - Blockchain
OWNER_PRIVATE_KEY=your_private_key

# Application Config
ENVIRONMENT=production
LOG_LEVEL=INFO
```

#### Step 4: Deploy
Click **"Create Web Service"** and wait for deployment (3-5 minutes)

---

### Option 2: Railway.app

#### Step 1: Create New Project
1. Go to [Railway](https://railway.app/)
2. Click **"New Project"** → **"Deploy from GitHub repo"**

#### Step 2: Configure
```bash
Root Directory: comprehensive_backend
Build Command: pip install -r requirements.txt
Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
```

#### Step 3: Add Variables
Same environment variables as Render (see above)

---

### Option 3: Heroku

#### Step 1: Create Procfile
```bash
cd comprehensive_backend
echo "web: uvicorn main:app --host 0.0.0.0 --port \$PORT" > Procfile
```

#### Step 2: Deploy
```bash
heroku create ai-trading-backend
heroku config:set BINANCE_MODE=testnet
heroku config:set BINANCE_TESTNET_API_KEY=your_key
heroku config:set BINANCE_TESTNET_SECRET=your_secret
git push heroku main
```

---

## 🎨 Frontend Deployment

### Option 1: Vercel (Recommended for Next.js)

#### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

#### Step 2: Deploy
```bash
cd comprehensive_frontend
vercel
```

#### Step 3: Configure Environment Variables
In Vercel Dashboard → Settings → Environment Variables:

```bash
NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com
```

---

### Option 2: Netlify

#### Step 1: Build Settings
```yaml
Base directory: comprehensive_frontend
Build command: npm run build
Publish directory: .next
```

#### Step 2: Environment Variables
```bash
NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com
```

---

## 🔑 Getting Binance Testnet API Keys

### Step 1: Visit Binance Testnet
Go to: https://testnet.binance.vision/

### Step 2: Login with GitHub
Click **"Login with GitHub"**

### Step 3: Generate API Key
1. Go to **"API Keys"** section
2. Click **"Generate HMAC_SHA256 Key"**
3. Save your API Key and Secret Key
4. **Important:** Copy both immediately - secret is shown only once!

### Step 4: Get Test Funds
1. Go to **"Faucet"** section
2. Request test BNB and USDT
3. You'll receive test funds instantly

---

## 🧪 Testing Your Deployment

### Test Backend
```bash
# Health check
curl https://your-backend-url.onrender.com/

# API status
curl https://your-backend-url.onrender.com/api/status

# Dashboard data
curl https://your-backend-url.onrender.com/api/dashboard
```

### Test Frontend
1. Open your frontend URL
2. Check if prices are loading
3. Try executing a test trade
4. Verify Binance connection status

---

## 📊 Environment Variables Reference

### Backend (.env)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `BINANCE_MODE` | Yes | Trading mode | `testnet` or `production` |
| `BINANCE_TESTNET_API_KEY` | Yes* | Testnet API key | `abc123...` |
| `BINANCE_TESTNET_SECRET` | Yes* | Testnet secret | `xyz789...` |
| `BINANCE_API_KEY` | No** | Production API key | `abc123...` |
| `BINANCE_SECRET` | No** | Production secret | `xyz789...` |
| `WEEX_API_KEY` | No | WEEX API key | `weex123...` |
| `WEEX_SECRET_KEY` | No | WEEX secret | `weex789...` |
| `OWNER_PRIVATE_KEY` | No | Blockchain private key | `0x123...` |
| `PORT` | No | Server port | `8000` |
| `ENVIRONMENT` | No | Environment name | `production` |

\* Required if `BINANCE_MODE=testnet`  
\** Required if `BINANCE_MODE=production`

### Frontend (.env.local)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Yes | Backend API URL | `https://api.example.com` |

---

## 🔒 Security Best Practices

### ✅ DO:
- Use testnet for initial deployment
- Store secrets in platform environment variables
- Use `.env.example` for documentation
- Rotate API keys regularly
- Enable 2FA on exchange accounts

### ❌ DON'T:
- Commit `.env` files to Git
- Share API keys publicly
- Use production keys in testnet
- Store private keys in code
- Deploy without testing locally first

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check logs
render logs --tail

# Verify Python version
python --version  # Should be 3.9+

# Test locally
cd comprehensive_backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend can't connect to backend
1. Check `NEXT_PUBLIC_API_URL` is set correctly
2. Verify backend is running: `curl https://your-backend-url/`
3. Check CORS settings in backend
4. Look at browser console for errors

### Binance API errors
1. Verify API keys are correct
2. Check `BINANCE_MODE` matches your keys (testnet vs production)
3. Ensure testnet has funds (use faucet)
4. Check API key permissions

### Build failures
```bash
# Clear cache and rebuild
rm -rf node_modules .next
npm install
npm run build
```

---

## 📈 Monitoring

### Backend Health
- Endpoint: `GET /api/status`
- Check every 5 minutes
- Monitor response time

### Trading Status
- Endpoint: `GET /api/binance/status`
- Verify connection to Binance
- Check account balance

### Logs
- Render: Dashboard → Logs
- Railway: Project → Deployments → Logs
- Heroku: `heroku logs --tail`

---

## 🎯 Post-Deployment

### 1. Verify Everything Works
- [ ] Backend health check passes
- [ ] Frontend loads correctly
- [ ] Binance connection active
- [ ] Test trade executes successfully

### 2. Configure Monitoring
- [ ] Set up uptime monitoring (UptimeRobot, Pingdom)
- [ ] Configure error alerts
- [ ] Set up log aggregation

### 3. Document Your Deployment
- [ ] Save backend URL
- [ ] Save frontend URL
- [ ] Document environment variables used
- [ ] Create runbook for common issues

---

## 🚀 Ready for Production?

Before switching to production mode:

1. **Test thoroughly on testnet** (at least 1 week)
2. **Review all trades** and ensure AI is working correctly
3. **Start with small amounts** in production
4. **Monitor closely** for first 24 hours
5. **Have a rollback plan** ready

---

## 📞 Support

- GitHub Issues: [Your Repo Issues]
- Documentation: See `README.md`
- API Docs: `API_DOCUMENTATION.md`

---

**Good luck with your deployment! 🎉**
