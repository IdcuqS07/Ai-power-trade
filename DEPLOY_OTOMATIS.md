# 🤖 Deploy Otomatis - AI Trading Platform

## 3 Cara Deploy Otomatis

---

## 🚀 Opsi 1: Script Bash (Paling Mudah)

### Cara Pakai:

```bash
# Jalankan script
./deploy-simple.sh
```

### Apa yang dilakukan:
1. ✅ Check dependencies
2. ✅ Install Vercel CLI
3. ✅ Deploy frontend ke Vercel
4. ✅ Instruksi deploy backend
5. ✅ Update frontend config
6. ✅ Test deployment

### Waktu: ~5 menit

---

## ⚡ Opsi 2: One-Line Command

```bash
# Install Vercel CLI dan deploy frontend
npm install -g vercel && cd comprehensive_frontend && vercel --prod
```

Kemudian:
1. Deploy backend manual ke Render (3 menit)
2. Update `NEXT_PUBLIC_API_URL` di Vercel
3. Redeploy frontend

### Waktu: ~8 menit

---

## 🔄 Opsi 3: GitHub Actions (CI/CD)

### Setup (One-time):

1. **Push code ke GitHub**
   ```bash
   git add .
   git commit -m "Setup auto deploy"
   git push origin main
   ```

2. **Setup Secrets di GitHub**
   
   Go to: Repository → Settings → Secrets → Actions
   
   Tambahkan secrets:
   ```
   VERCEL_TOKEN=your_vercel_token
   VERCEL_ORG_ID=your_org_id
   VERCEL_PROJECT_ID=your_project_id
   RENDER_API_KEY=your_render_key
   RENDER_SERVICE_ID=your_service_id
   BACKEND_URL=https://your-backend.onrender.com
   FRONTEND_URL=https://your-frontend.vercel.app
   ```

3. **Enable GitHub Actions**
   
   File sudah dibuat: `.github/workflows/deploy.yml`

### Cara Pakai:

Setelah setup, setiap kali push ke `main`:
```bash
git push origin main
```

GitHub Actions akan otomatis:
- ✅ Deploy frontend ke Vercel
- ✅ Deploy backend ke Render
- ✅ Test deployment
- ✅ Notify hasil

### Waktu: Otomatis! (~5 menit per deploy)

---

## 📋 Perbandingan

| Opsi | Waktu | Otomatis | Setup |
|------|-------|----------|-------|
| **Script Bash** | 5 min | Semi | Mudah |
| **One-Line** | 8 min | Minimal | Sangat Mudah |
| **GitHub Actions** | 5 min | Penuh | Medium |

---

## 🎯 Rekomendasi

### Untuk Quick Test:
→ Gunakan **Opsi 2** (One-Line Command)

### Untuk Development:
→ Gunakan **Opsi 1** (Script Bash)

### Untuk Production:
→ Gunakan **Opsi 3** (GitHub Actions)

---

## 📝 Cara Menggunakan Script

### 1. Deploy Simple (Recommended)

```bash
# Beri permission
chmod +x deploy-simple.sh

# Jalankan
./deploy-simple.sh
```

**Script akan:**
- Check dependencies
- Deploy frontend ke Vercel
- Berikan instruksi untuk backend
- Update configuration
- Test deployment

### 2. Deploy Full Auto

```bash
# Beri permission
chmod +x deploy-auto.sh

# Jalankan
./deploy-auto.sh
```

**Script akan:**
- Check semua prerequisites
- Install dependencies
- Test backend locally
- Deploy frontend
- Instruksi backend deployment
- Update frontend config
- Test deployment
- Save deployment info

---

## 🔑 Yang Anda Butuhkan

### Untuk Script Bash:
- ✅ Binance Testnet API Keys
- ✅ Vercel account (login via CLI)
- ✅ Render account (manual setup)

### Untuk GitHub Actions:
- ✅ Semua di atas, plus:
- ✅ GitHub repository
- ✅ Vercel token
- ✅ Render API key

---

## 🧪 Test Deployment

Setelah deploy, test dengan:

```bash
# Test backend
curl https://your-backend-url/api/status

# Test frontend
open https://your-frontend-url

# Test trading
curl -X POST https://your-backend-url/api/trades/execute \
  -H "Content-Type: application/json" \
  -d '{"symbol": "BTC"}'
```

---

## 🐛 Troubleshooting

### Script gagal?
```bash
# Check permissions
ls -la deploy-*.sh

# Beri permission
chmod +x deploy-simple.sh deploy-auto.sh

# Jalankan lagi
./deploy-simple.sh
```

### Vercel CLI error?
```bash
# Install ulang
npm uninstall -g vercel
npm install -g vercel

# Login
vercel login
```

### Backend tidak deploy?
- Render.com perlu setup manual (3 menit)
- Ikuti instruksi di script
- Atau baca: PANDUAN_DEPLOY_INDONESIA.md

---

## 📚 Dokumentasi Lengkap

- **Quick Deploy:** DEPLOY_SEKARANG.md
- **Panduan Lengkap:** PANDUAN_DEPLOY_INDONESIA.md
- **Checklist:** CHECKLIST_DEPLOY.md
- **Troubleshooting:** TROUBLESHOOTING.md

---

## 💡 Tips

### Untuk Development:
```bash
# Deploy ke preview (bukan production)
cd comprehensive_frontend
vercel
```

### Untuk Production:
```bash
# Deploy ke production
cd comprehensive_frontend
vercel --prod
```

### Untuk Rollback:
```bash
# List deployments
vercel ls

# Rollback ke deployment sebelumnya
vercel rollback [deployment-url]
```

---

## 🎉 Selesai!

Pilih opsi yang sesuai dan mulai deploy!

**Paling Mudah:** `./deploy-simple.sh`

**Paling Lengkap:** `./deploy-auto.sh`

**Paling Otomatis:** GitHub Actions

---

**Happy Deploying! 🚀**
