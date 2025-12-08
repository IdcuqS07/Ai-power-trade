# 🤖 Auto Deploy - Quick Start

## ⚡ Deploy Otomatis dalam 1 Command!

---

## 🚀 Cara Tercepat

```bash
./deploy-simple.sh
```

**Itu saja!** Script akan handle semuanya.

---

## 📋 Apa yang Terjadi?

1. ✅ Check dependencies (Node.js, npm, Vercel CLI)
2. ✅ Setup environment variables
3. ✅ Deploy frontend ke Vercel
4. ✅ Instruksi deploy backend
5. ✅ Update frontend configuration
6. ✅ Test deployment
7. ✅ Save deployment info

**Total waktu: ~5 menit**

---

## 🎯 Prerequisites

Sebelum menjalankan script:

1. **Binance Testnet API Keys**
   - Buka: https://testnet.binance.vision/
   - Login with GitHub
   - Generate API Key
   - Copy API Key dan Secret

2. **Accounts**
   - Vercel account (gratis)
   - Render account (gratis)

3. **Installed**
   - Node.js 16+
   - npm
   - Git

---

## 📝 Step-by-Step

### 1. Beri Permission

```bash
chmod +x deploy-simple.sh
```

### 2. Jalankan Script

```bash
./deploy-simple.sh
```

### 3. Ikuti Prompts

Script akan tanya:
- Binance API Keys (jika belum ada .env)
- Backend URL (setelah deploy ke Render)

### 4. Done!

URLs akan ditampilkan:
```
Frontend: https://your-app.vercel.app
Backend:  https://your-api.onrender.com
```

---

## 🔧 Scripts Available

### deploy-simple.sh (Recommended)
```bash
./deploy-simple.sh
```
- Paling mudah
- Semi-automated
- ~5 menit

### deploy-auto.sh (Full Featured)
```bash
./deploy-auto.sh
```
- Lebih lengkap
- Test local backend
- ~8 menit

---

## 🎨 Manual Deploy (Alternative)

Jika script tidak work, deploy manual:

### Frontend:
```bash
npm install -g vercel
cd comprehensive_frontend
vercel --prod
```

### Backend:
1. Buka https://dashboard.render.com/
2. New + → Web Service
3. Configure (lihat PANDUAN_DEPLOY_INDONESIA.md)

---

## 🧪 Test Deployment

```bash
# Test backend
curl https://your-backend-url/api/status

# Test frontend
open https://your-frontend-url
```

Expected:
- ✅ Backend returns JSON
- ✅ Frontend loads
- ✅ Prices updating
- ✅ Can execute trades

---

## 🐛 Troubleshooting

### "Permission denied"
```bash
chmod +x deploy-simple.sh
```

### "Vercel not found"
```bash
npm install -g vercel
```

### "Backend deployment failed"
- Backend perlu deploy manual ke Render
- Ikuti instruksi di script
- Lihat: PANDUAN_DEPLOY_INDONESIA.md

### Script stuck?
- Press Ctrl+C
- Check error message
- Try manual deploy

---

## 📚 More Help

- **Panduan Lengkap:** DEPLOY_OTOMATIS.md
- **Manual Deploy:** PANDUAN_DEPLOY_INDONESIA.md
- **Troubleshooting:** TROUBLESHOOTING.md
- **Environment Vars:** ENVIRONMENT_VARIABLES.md

---

## 💡 Tips

### First Time?
→ Use `deploy-simple.sh`

### Need More Control?
→ Use `deploy-auto.sh`

### Production Ready?
→ Setup GitHub Actions (see DEPLOY_OTOMATIS.md)

---

## 🎉 Success!

Setelah deploy berhasil:

1. ✅ Open frontend URL
2. ✅ Check prices loading
3. ✅ Verify Binance connected
4. ✅ Execute test trade
5. ✅ Monitor logs

**You're live! 📈**

---

## 📞 Need Help?

1. Check DEPLOY_OTOMATIS.md
2. Read TROUBLESHOOTING.md
3. Review error messages
4. Try manual deploy

---

**Quick Command:**
```bash
./deploy-simple.sh
```

**That's it! Happy deploying! 🚀**
