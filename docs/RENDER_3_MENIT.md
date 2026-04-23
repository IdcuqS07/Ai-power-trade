# ⚡ Render Deploy - 3 Menit!

## Vercel ✅ → Render ⏳

---

## 🎯 3 Langkah Saja!

### 1️⃣ CREATE SERVICE (1 menit)

```
🌐 https://dashboard.render.com/

New + → Web Service → Connect GitHub
```

---

### 2️⃣ CONFIGURE (1 menit)

```yaml
Name: ai-trading-backend
Root Directory: comprehensive_backend
Build: pip install -r requirements.txt
Start: uvicorn main:app --host 0.0.0.0 --port $PORT

Environment Variables:
  BINANCE_MODE = testnet
  BINANCE_TESTNET_API_KEY = [your key]
  BINANCE_TESTNET_SECRET = [your secret]
```

**API Keys dari:** https://testnet.binance.vision/

---

### 3️⃣ DEPLOY (1 menit)

```
Create Web Service → Wait 3-5 min → Done!

Copy URL: https://ai-trading-backend-xxxx.onrender.com
```

---

## 🔄 UPDATE VERCEL

```bash
# Opsi A: Dashboard
vercel.com → Project → Settings → Environment Variables
→ NEXT_PUBLIC_API_URL = [backend URL]
→ Save → Redeploy

# Opsi B: CLI
cd comprehensive_frontend
vercel env add NEXT_PUBLIC_API_URL production
# Paste backend URL
vercel --prod
```

---

## ✅ TEST

```bash
# Backend
curl https://your-backend-url/api/status

# Frontend
open https://your-frontend-url
```

**Expected:**
- ✅ Backend returns JSON
- ✅ Frontend shows "Binance: Connected"
- ✅ Prices loading
- ✅ Can execute trades

---

## 🎉 DONE!

**Backend:** `https://ai-trading-backend-xxxx.onrender.com`  
**Frontend:** `https://your-app.vercel.app`

**Total Time:** ~5 menit  
**Cost:** $0/bulan

---

## 🐛 Quick Fix

### Build failed?
→ Check Python version in Settings

### Won't start?
→ Verify environment variables

### Binance error?
→ Check API keys are correct

### Service sleeping?
→ Normal for free tier (wakes in 30s)

---

## 📚 More Help

- **Detailed Guide:** RENDER_DEPLOY_SEKARANG.md
- **Full Docs:** PANDUAN_DEPLOY_INDONESIA.md
- **Troubleshooting:** TROUBLESHOOTING.md

---

**That's it! You're live! 🚀**
