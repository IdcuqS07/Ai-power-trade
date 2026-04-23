# 🔧 AI Explainer Troubleshooting Guide

## Issue: 404 Page Not Found

### Quick Diagnosis

**Where are you seeing the 404?**

1. **Local (http://localhost:3000/ai-explainer)** → See Section A
2. **Production (https://ai-power-trade.vercel.app/ai-explainer)** → See Section B

---

## Section A: Local Development

### ✅ Current Status
- Frontend is running on http://localhost:3000
- AI Explainer page exists at `comprehensive_frontend/pages/ai-explainer.js`
- Page is accessible (verified with curl)

### Test Steps:

1. **Open your browser**
   ```
   http://localhost:3000
   ```

2. **Click the purple "AI Explainer" button**
   - Should be in the top navigation
   - Has a brain icon 🧠
   - Says "NEW" badge

3. **Or go directly to:**
   ```
   http://localhost:3000/ai-explainer
   ```

### If Still Getting 404:

**Option 1: Restart Frontend**
```bash
# Stop the current process
# Then restart:
cd comprehensive_frontend
npm run dev
```

**Option 2: Clear Next.js Cache**
```bash
cd comprehensive_frontend
rm -rf .next
npm run dev
```

**Option 3: Check File Exists**
```bash
ls -la comprehensive_frontend/pages/ai-explainer.js
# Should show the file exists
```

---

## Section B: Production (Vercel)

### ✅ What We Know
- Code is pushed to GitHub
- Vercel auto-deploys from main branch
- Build takes 2-3 minutes

### Check Deployment Status:

1. **Go to Vercel Dashboard**
   ```
   https://vercel.com/dashboard
   ```

2. **Find "ai-power-trade" project**

3. **Check latest deployment:**
   - 🟡 **Building** → Wait 2-3 minutes
   - 🟢 **Ready** → Should work now
   - 🔴 **Failed** → See build logs

### If Deployment Failed:

**Check Build Logs:**
1. Click on the failed deployment
2. Look for errors in the build log
3. Common issues:
   - Missing dependencies
   - Syntax errors
   - Environment variables

**Manual Redeploy:**
1. Go to Vercel dashboard
2. Click "Redeploy" button
3. Wait for build to complete

### If Deployment Succeeded but Still 404:

**Option 1: Clear Browser Cache**
```
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)
```

**Option 2: Try Incognito/Private Window**
- Opens fresh session
- No cached data

**Option 3: Check URL**
Make sure you're using:
```
https://ai-power-trade.vercel.app/ai-explainer
```
NOT:
```
https://ai-power-trade.vercel.app/ai-explainer.js
https://ai-power-trade.vercel.app/pages/ai-explainer
```

**Option 4: Check Vercel Settings**
1. Go to Vercel project settings
2. Check "Root Directory" is set to `comprehensive_frontend`
3. Check "Framework Preset" is set to `Next.js`

---

## Section C: Backend API Issues

### If Page Loads but Shows "Loading..." Forever

This means the frontend can't reach the backend API.

### Check Backend Status:

**Local Backend:**
```bash
curl http://localhost:8000/api/ai/explain/BTC
```

**Production Backend:**
```bash
curl https://ai-powertrade.duckdns.org/api/ai/explain/BTC
```

### Expected Response:
```json
{
  "success": true,
  "data": {
    "symbol": "BTC",
    "signal": "BUY",
    "confidence": 0.87,
    ...
  }
}
```

### If Backend Not Responding:

**Local:**
```bash
cd comprehensive_backend
source venv/bin/activate
pip install -r requirements.txt
python3 main.py
```

**Production (VPS):**
```bash
./deploy-ai-explainer.sh
```

Or manually:
```bash
ssh root@143.198.205.88
cd /opt/Ai-power-trade
git pull origin main
cd comprehensive_backend
sudo systemctl restart ai-trading-backend
```

---

## Section D: Common Issues & Solutions

### Issue 1: "Cannot read property 'price' of undefined"

**Cause:** Backend API not returning price data

**Solution:**
1. Check backend is running
2. Verify Binance API is working
3. Check backend logs for errors

### Issue 2: Page is blank/white screen

**Cause:** JavaScript error in browser

**Solution:**
1. Open browser console (F12)
2. Look for red error messages
3. Check if API_URL is set correctly

### Issue 3: "Failed to fetch"

**Cause:** CORS or network issue

**Solution:**
1. Check backend CORS settings
2. Verify API_URL environment variable
3. Check if backend is accessible

### Issue 4: Styles not loading

**Cause:** Tailwind CSS not compiled

**Solution:**
```bash
cd comprehensive_frontend
npm run build
npm run dev
```

---

## Section E: Quick Fixes

### Fix 1: Complete Reset (Local)
```bash
# Stop all processes
# Then:
cd comprehensive_frontend
rm -rf .next node_modules
npm install
npm run dev
```

### Fix 2: Force Vercel Redeploy
```bash
git commit --allow-empty -m "Force redeploy"
git push origin main
```

### Fix 3: Check Environment Variables
```bash
# In comprehensive_frontend/.env.local
NEXT_PUBLIC_API_URL=https://ai-powertrade.duckdns.org

# Or for local testing:
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Section F: Verification Checklist

### ✅ Frontend Checklist:
- [ ] File exists: `comprehensive_frontend/pages/ai-explainer.js`
- [ ] Frontend is running (local or Vercel)
- [ ] Can access dashboard: `/`
- [ ] Can see "AI Explainer" button
- [ ] Button has brain icon and "NEW" badge

### ✅ Backend Checklist:
- [ ] Backend is running (local or VPS)
- [ ] API endpoint responds: `/api/ai/explain/BTC`
- [ ] Returns JSON with success: true
- [ ] No CORS errors in browser console

### ✅ Integration Checklist:
- [ ] Frontend can fetch from backend
- [ ] Prices display correctly
- [ ] Coin selector works
- [ ] Analysis loads when selecting coin
- [ ] No console errors

---

## Section G: Still Not Working?

### Debug Mode:

1. **Open Browser Console (F12)**
2. **Go to Network Tab**
3. **Navigate to /ai-explainer**
4. **Look for:**
   - Red requests (failed)
   - CORS errors
   - 404 errors
   - Timeout errors

5. **Check Console Tab for:**
   - JavaScript errors
   - API errors
   - Component errors

### Get Help:

**Provide this information:**
1. Where you're testing (local or production)
2. Browser console errors (screenshot)
3. Network tab errors (screenshot)
4. Backend logs (if accessible)
5. Vercel build logs (if production)

---

## Section H: Success Indicators

### ✅ You'll know it's working when:

1. **Dashboard loads** → http://localhost:3000 or https://ai-power-trade.vercel.app
2. **Purple "AI Explainer" button visible** → Top navigation
3. **Click button** → Redirects to `/ai-explainer`
4. **Page loads** → Shows "AI Explainability Dashboard" title
5. **Coin selector shows** → 8 cryptocurrencies
6. **Select BTC** → Analysis loads
7. **See indicators** → RSI, MACD, MA, Bollinger Bands
8. **See reasoning** → Step-by-step explanations
9. **See risk assessment** → Risk score, volatility
10. **No errors** → Console is clean

---

## Quick Test Script

```bash
# Test everything at once
echo "Testing Frontend..."
curl -s http://localhost:3000/ai-explainer | head -c 100

echo "\nTesting Backend..."
curl -s http://localhost:8000/api/ai/explain/BTC | head -c 200

echo "\nTesting Production Frontend..."
curl -s https://ai-power-trade.vercel.app/ai-explainer | head -c 100

echo "\nTesting Production Backend..."
curl -s https://ai-powertrade.duckdns.org/api/ai/explain/BTC | head -c 200

echo "\nDone!"
```

---

## Current Status (As of Now)

✅ **Frontend (Local):** Running on http://localhost:3000
✅ **AI Explainer Page:** Exists and accessible
⏳ **Backend (Local):** Not running (needs dependencies)
⏳ **Production:** Vercel deploying (check dashboard)

**Next Step:** Wait for Vercel deployment to complete, then test production URL.

---

**Need more help? Check:**
- `AI_EXPLAINABILITY_FEATURE.md` - Complete feature docs
- `DEPLOYMENT_STATUS_AI_EXPLAINER.md` - Deployment checklist
- `AI_EXPLAINER_QUICK_GUIDE.md` - User guide
