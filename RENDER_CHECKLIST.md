# ✅ Render Deploy Checklist

**Vercel:** ✅ Done  
**Render:** ⏳ Let's do it!

---

## 📋 PRE-DEPLOY

- [ ] Binance Testnet account created
- [ ] API Key obtained: `_______________________________`
- [ ] Secret Key obtained: `_______________________________`
- [ ] Render.com account created
- [ ] GitHub repository ready

---

## 🔧 RENDER CONFIGURATION

### Step 1: Create Service
- [ ] Go to https://dashboard.render.com/
- [ ] Click "New +"
- [ ] Select "Web Service"
- [ ] Connect GitHub repository

### Step 2: Basic Settings
- [ ] **Name:** `ai-trading-backend`
- [ ] **Region:** Singapore (or closest)
- [ ] **Branch:** `main`
- [ ] **Root Directory:** `comprehensive_backend`
- [ ] **Runtime:** Python 3

### Step 3: Build & Start
- [ ] **Build Command:** `pip install -r requirements.txt`
- [ ] **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
- [ ] **Instance Type:** Free

### Step 4: Environment Variables
- [ ] `BINANCE_MODE` = `testnet`
- [ ] `BINANCE_TESTNET_API_KEY` = `[your key]`
- [ ] `BINANCE_TESTNET_SECRET` = `[your secret]`

### Step 5: Deploy
- [ ] Click "Create Web Service"
- [ ] Wait for build (3-5 minutes)
- [ ] Build successful
- [ ] Service is live

### Step 6: Save URL
- [ ] Backend URL: `_______________________________`

---

## 🔄 UPDATE VERCEL

- [ ] Go to Vercel dashboard
- [ ] Select frontend project
- [ ] Settings → Environment Variables
- [ ] Update `NEXT_PUBLIC_API_URL` with backend URL
- [ ] Save changes
- [ ] Redeploy frontend

---

## ✅ TESTING

### Backend Tests
- [ ] Health check: `curl https://your-backend/`
- [ ] Status check: `curl https://your-backend/api/status`
- [ ] Response shows `"configured": true`
- [ ] Response shows `"mode": "testnet"`
- [ ] No errors in logs

### Frontend Tests
- [ ] Open frontend URL
- [ ] Prices are loading
- [ ] Status shows "Binance: Connected"
- [ ] Dashboard displays data
- [ ] No console errors

### Integration Tests
- [ ] Frontend connects to backend
- [ ] Can execute test trade
- [ ] Trade appears in history
- [ ] Balance updates correctly

---

## 📊 POST-DEPLOY

### Documentation
- [ ] Backend URL documented
- [ ] Frontend URL documented
- [ ] Deployment date recorded
- [ ] Environment variables saved (securely)

### Monitoring
- [ ] Logs checked for errors
- [ ] Response time acceptable
- [ ] No memory issues
- [ ] Service responding correctly

### Optional
- [ ] UptimeRobot configured
- [ ] Slack notifications set up
- [ ] Team notified

---

## 🎉 SUCCESS!

**Deployment Complete:**

| Item | Value |
|------|-------|
| Backend | `_______________________________` |
| Frontend | `_______________________________` |
| Status | ✅ Live |
| Date | `_______________________________` |
| Time Taken | `_______________________________` |

---

## 🐛 TROUBLESHOOTING

### If Build Fails:
- [ ] Check Python version (Settings)
- [ ] Verify requirements.txt exists
- [ ] Check Root Directory path
- [ ] Review build logs

### If Service Won't Start:
- [ ] Verify environment variables
- [ ] Check Start Command syntax
- [ ] Ensure port is $PORT
- [ ] Review service logs

### If Binance Not Connected:
- [ ] Verify API keys are correct
- [ ] Check BINANCE_MODE=testnet
- [ ] Regenerate keys if needed
- [ ] Test at testnet.binance.vision

### If Service Sleeping:
- [ ] Normal for free tier
- [ ] Wakes in ~30 seconds
- [ ] Consider paid tier ($7/mo)
- [ ] Or use uptime monitor

---

## 📚 RESOURCES

- **Render Dashboard:** https://dashboard.render.com/
- **Render Docs:** https://render.com/docs
- **Binance Testnet:** https://testnet.binance.vision/
- **Detailed Guide:** RENDER_DEPLOY_SEKARANG.md
- **Quick Guide:** RENDER_3_MENIT.md

---

## 💡 TIPS

### View Logs:
Dashboard → Your Service → Logs

### Update Env Vars:
Settings → Environment → Edit → Save → Redeploy

### Rollback:
Deployments → Previous → Rollback

### Metrics:
Dashboard → Your Service → Metrics

---

**Print this checklist and check off items as you go!**

**Good luck! 🚀**
