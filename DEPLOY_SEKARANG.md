# 🚀 DEPLOY SEKARANG - 5 Menit!

## Ikuti 4 Langkah Ini:

---

## 1️⃣ BINANCE API KEYS (2 menit)

```
🌐 Buka: https://testnet.binance.vision/

👤 Login with GitHub

🔑 API Keys → Generate HMAC_SHA256

📋 COPY SEKARANG (secret hanya muncul sekali!):
   API Key: ___________________________________
   Secret:  ___________________________________

💰 Faucet → Request test USDT
```

---

## 2️⃣ DEPLOY BACKEND (3 menit)

```
🌐 Buka: https://dashboard.render.com/

➕ New + → Web Service → Connect GitHub

⚙️ ISI FORM:
   Name: ai-trading-backend
   Language: Python
   Branch: main
   Root Directory: comprehensive_backend
   Build: pip install -r requirements.txt
   Start: uvicorn main:app --host 0.0.0.0 --port $PORT

🔐 Advanced → Add Environment Variable:
   BINANCE_MODE = testnet
   BINANCE_TESTNET_API_KEY = [paste key]
   BINANCE_TESTNET_SECRET = [paste secret]

🚀 Create Web Service

⏳ Tunggu 3-5 menit...

✅ COPY URL: ___________________________________
```

---

## 3️⃣ DEPLOY FRONTEND (2 menit)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd comprehensive_frontend
vercel
```

```
🌐 Atau buka: https://vercel.com/new

📁 Import GitHub repo

⚙️ Settings:
   Framework: Next.js
   Root: comprehensive_frontend

🚀 Deploy

⏳ Tunggu 2 menit...

🔐 Settings → Environment Variables:
   NEXT_PUBLIC_API_URL = [backend URL dari step 2]

🔄 Redeploy

✅ COPY URL: ___________________________________
```

---

## 4️⃣ TEST (1 menit)

```bash
# Test Backend
curl https://your-backend-url/api/status

# Buka Frontend
open https://your-frontend-url
```

### Cek:
- ✅ Prices loading?
- ✅ Status "Binance: Connected"?
- ✅ Bisa execute trade?

---

## 🎉 SELESAI!

**Backend:** `___________________________________`  
**Frontend:** `___________________________________`  
**Status:** ✅ LIVE!

---

## 🐛 Masalah?

### Backend tidak start?
→ Cek logs di Render dashboard  
→ Verify env vars benar

### Frontend tidak connect?
→ Cek `NEXT_PUBLIC_API_URL` benar  
→ Pastikan backend running

### Binance error?
→ Verify API keys benar  
→ Cek `BINANCE_MODE=testnet`

---

## 📚 Butuh Detail?

- **Panduan Lengkap:** [PANDUAN_DEPLOY_INDONESIA.md](PANDUAN_DEPLOY_INDONESIA.md)
- **Checklist:** [CHECKLIST_DEPLOY.md](CHECKLIST_DEPLOY.md)
- **English Guide:** [DEPLOY_NOW.md](DEPLOY_NOW.md)
- **Troubleshooting:** [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

---

**TOTAL WAKTU: ~8 MENIT** ⚡

**BIAYA: $0/BULAN** 💰

**SELAMAT TRADING! 📈**
