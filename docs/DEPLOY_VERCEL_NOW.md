# 🚀 Deploy ke Vercel - Panduan Lengkap

## Status Saat Ini

✅ Vercel CLI terinstall (v49.1.2)
✅ Project sudah linked: `ai-power-trade`
✅ Code sudah di-push ke GitHub
❌ Root Directory setting salah (menyebabkan error)

## Masalah

Error: `The provided path "~/Documents/Weex Project/comprehensive_frontend/comprehensive_frontend" does not exist`

**Penyebab:** Root Directory di Vercel dashboard di-set ke `comprehensive_frontend`, tapi Vercel mencari path double.

## ✅ Solusi (Pilih Salah Satu)

### Opsi 1: Fix via Vercel Dashboard (RECOMMENDED)

1. **Buka Vercel Dashboard:**
   ```
   https://vercel.com/idcuq-santosos-projects/ai-power-trade/settings
   ```

2. **Scroll ke "Root Directory"**
   - Current value: `comprehensive_frontend`
   - Change to: `.` (dot saja) atau kosongkan

3. **Klik "Save"**

4. **Redeploy:**
   - Go to: https://vercel.com/idcuq-santosos-projects/ai-power-trade
   - Click "Deployments" tab
   - Click "..." pada deployment terakhir
   - Click "Redeploy"

5. **Tunggu 2-3 menit**, lalu test:
   ```bash
   curl -I https://ai-power-trade.vercel.app
   ```

### Opsi 2: Deploy via Git (Auto)

Jika Root Directory sudah di-fix:

```bash
# Make any change
echo "# Update" >> README.md

# Commit and push
git add .
git commit -m "Trigger Vercel deployment"
git push origin main

# Vercel will auto-deploy
```

### Opsi 3: Deploy via CLI (Manual)

Jika Root Directory sudah di-fix ke `.` atau kosong:

```bash
cd comprehensive_frontend
vercel --prod
```

## 🔍 Cek Status Deployment

```bash
# List deployments
vercel ls

# Check latest deployment
vercel inspect
```

## 🌐 URL Production

- **Main URL:** https://ai-power-trade.vercel.app
- **Dashboard:** https://vercel.com/idcuq-santosos-projects/ai-power-trade

## 📋 Environment Variables

Pastikan sudah di-set di Vercel Dashboard:

```
NEXT_PUBLIC_API_URL=https://ai-powertrade.duckdns.org
```

Atau URL backend lain yang Anda gunakan.

## ✅ Test Deployment

Setelah deploy berhasil:

```bash
# Test homepage
curl -I https://ai-power-trade.vercel.app

# Test AI Explainer page
curl -I https://ai-power-trade.vercel.app/ai-explainer

# Test API connection
curl https://ai-power-trade.vercel.app/api/health
```

## 🚨 Troubleshooting

### Error: "Command exited with 1"

**Solusi:** Check build logs di Vercel dashboard untuk detail error.

### Error: "Root Directory not found"

**Solusi:** Set Root Directory ke `.` atau kosongkan di dashboard.

### Error: "Module not found"

**Solusi:** 
```bash
cd comprehensive_frontend
rm -rf node_modules package-lock.json
npm install
git add package-lock.json
git commit -m "Update dependencies"
git push
```

### Build Success tapi 404

**Solusi:** Clear build cache di Vercel dashboard:
1. Settings → General
2. Scroll ke "Build & Development Settings"
3. Click "Clear Build Cache"
4. Redeploy

## 📞 Quick Commands

```bash
# Deploy production
vercel --prod

# Deploy preview
vercel

# Check status
vercel ls

# View logs
vercel logs

# Open in browser
vercel open
```

## 🎯 Next Steps

1. Fix Root Directory di dashboard (Opsi 1)
2. Redeploy
3. Test URL
4. Update frontend dengan backend URL jika perlu

---

**Current Status:** Waiting for Root Directory fix di Vercel dashboard.

**Action Required:** Go to https://vercel.com/idcuq-santosos-projects/ai-power-trade/settings and change Root Directory to `.`
