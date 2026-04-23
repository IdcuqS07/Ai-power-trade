# 🚀 Deploy Backend ke Render - 3 Menit!

## Vercel Sudah ✅ Tinggal Render!

---

## 📋 Yang Anda Butuhkan

1. ✅ Binance Testnet API Keys
2. ✅ Render.com account (gratis)
3. ✅ GitHub repository (code sudah di-push)

---

## 🎯 Langkah Deploy Backend (3 Menit)

### 1. Buka Render Dashboard

```
🌐 https://dashboard.render.com/
```

Login dengan GitHub account Anda.

---

### 2. Create New Web Service

1. Klik tombol **"New +"** di pojok kanan atas
2. Pilih **"Web Service"**
3. Klik **"Connect a repository"** atau pilih repo yang sudah connected

---

### 3. Pilih Repository

- Pilih repository AI Trading Platform Anda
- Klik **"Connect"**

---

### 4. Configure Service

Isi form dengan nilai berikut:

| Field | Value |
|-------|-------|
| **Name** | `ai-trading-backend` |
| **Region** | Singapore (atau terdekat) |
| **Branch** | `main` |
| **Root Directory** | `comprehensive_backend` |
| **Runtime** | `Python 3` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn main:app --host 0.0.0.0 --port $PORT` |

**Instance Type:** Free

---

### 5. Environment Variables

Scroll ke bawah ke section **"Environment Variables"**

Klik **"Add Environment Variable"** dan tambahkan:

```bash
# Variable 1
Key: BINANCE_MODE
Value: testnet

# Variable 2
Key: BINANCE_TESTNET_API_KEY
Value: [paste API key Anda dari testnet.binance.vision]

# Variable 3
Key: BINANCE_TESTNET_SECRET
Value: [paste secret key Anda dari testnet.binance.vision]
```

**Cara mendapatkan API Keys:**
1. Buka: https://testnet.binance.vision/
2. Login with GitHub
3. API Keys → Generate HMAC_SHA256
4. Copy kedua keys

---

### 6. Deploy!

1. Scroll ke bawah
2. Klik **"Create Web Service"**
3. Tunggu 3-5 menit (Render akan build dan deploy)

**Progress yang akan Anda lihat:**
```
Building...
  → Installing dependencies
  → pip install -r requirements.txt
  → Build complete

Deploying...
  → Starting service
  → Health check passed
  → Live!
```

---

### 7. Copy Backend URL

Setelah deploy selesai, Anda akan melihat:

```
Your service is live at https://ai-trading-backend-xxxx.onrender.com
```

**COPY URL INI!** Anda akan butuh untuk update Vercel.

---

## 🔄 Update Vercel dengan Backend URL

### Opsi A: Via Vercel Dashboard

1. Buka: https://vercel.com/dashboard
2. Pilih project frontend Anda
3. Go to **Settings** → **Environment Variables**
4. Cari `NEXT_PUBLIC_API_URL`
5. Edit value dengan backend URL dari Render
6. Klik **"Save"**
7. Go to **Deployments** → Klik **"Redeploy"**

### Opsi B: Via CLI

```bash
cd comprehensive_frontend

# Add/update environment variable
vercel env add NEXT_PUBLIC_API_URL production
# Paste backend URL: https://ai-trading-backend-xxxx.onrender.com

# Redeploy
vercel --prod
```

---

## ✅ Test Deployment

### Test Backend

```bash
# Health check
curl https://ai-trading-backend-xxxx.onrender.com/

# API status
curl https://ai-trading-backend-xxxx.onrender.com/api/status
```

**Expected response:**
```json
{
  "success": true,
  "api_status": "operational",
  "binance": {
    "trading": {
      "configured": true,
      "status": "Ready",
      "mode": "testnet"
    }
  }
}
```

### Test Frontend

1. Buka frontend URL Anda
2. Cek apakah prices loading
3. Verify status shows "Binance: Connected"
4. Execute test trade

---

## 🎉 Selesai!

**Backend URL:** `https://ai-trading-backend-xxxx.onrender.com`  
**Frontend URL:** `https://your-app.vercel.app`

**Status:** ✅ Fully Deployed!

---

## 📊 Monitor Logs

### View Backend Logs

1. Go to Render Dashboard
2. Click your service
3. Click **"Logs"** tab
4. Monitor real-time logs

### Common Log Messages

```
✓ Application startup complete
✓ Uvicorn running on http://0.0.0.0:10000
✓ Using Binance API for all market data
✓ Binance Trading initialized in TESTNET mode
```

---

## 🐛 Troubleshooting

### Build Failed?

**Check:**
- Python version (should be 3.9+)
- requirements.txt exists
- Root directory is correct

**Fix:**
- Go to Settings → Change Python version
- Verify Build Command

### Service Won't Start?

**Check:**
- Environment variables are set
- Start command is correct
- Port is $PORT (not hardcoded)

**Fix:**
- Settings → Environment → Verify all 3 vars
- Settings → Start Command → Check syntax

### Binance Not Connected?

**Check:**
- API keys are correct
- Mode is "testnet"
- Testnet account has funds

**Fix:**
- Regenerate API keys
- Update environment variables
- Redeploy

### Service Sleeping?

Free tier sleeps after 15 minutes of inactivity.

**Solutions:**
1. Upgrade to paid tier ($7/month)
2. Use uptime monitor (UptimeRobot)
3. Accept 30s wake-up time

---

## 💡 Tips

### Keep Service Awake

Free service untuk monitoring:
- UptimeRobot: https://uptimerobot.com/
- Ping setiap 5 menit

### View Metrics

Render Dashboard → Your Service → Metrics
- CPU usage
- Memory usage
- Response times
- Request count

### Update Environment Variables

Settings → Environment → Edit → Save → Redeploy

### Rollback Deployment

Deployments → Previous deployment → Rollback

---

## 📚 Next Steps

1. ✅ Test all features
2. ✅ Execute test trades
3. ✅ Monitor logs for errors
4. ✅ Set up monitoring
5. ✅ Document URLs

---

## 🔗 Useful Links

- **Render Dashboard:** https://dashboard.render.com/
- **Render Docs:** https://render.com/docs
- **Binance Testnet:** https://testnet.binance.vision/
- **Your Backend:** `[your URL]`
- **Your Frontend:** `[your URL]`

---

## 📞 Need Help?

- **Render Issues:** Check Logs tab
- **API Issues:** Test with curl
- **Frontend Issues:** Check browser console
- **General Help:** TROUBLESHOOTING.md

---

**Congratulations! Your AI Trading Platform is now fully deployed! 🎉**

**Happy Trading! 📈**
