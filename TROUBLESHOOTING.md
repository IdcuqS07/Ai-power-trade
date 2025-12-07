# Troubleshooting Guide - AI Trading Platform

## 🔧 Common Issues & Solutions

### 1. Backend Tidak Bisa Start

#### Error: "Python not found"
**Solusi:**
```bash
# Check Python installation
python3 --version

# Install Python jika belum ada
# macOS: brew install python3
# Ubuntu: sudo apt install python3
# Windows: Download dari python.org
```

#### Error: "Port 8000 already in use"
**Solusi:**

**macOS/Linux:**
```bash
# Find process using port 8000
lsof -ti:8000

# Kill the process
lsof -ti:8000 | xargs kill -9
```

**Windows:**
```bash
# Find process
netstat -ano | findstr :8000

# Kill process (replace PID with actual number)
taskkill /PID <PID> /F
```

#### Error: "Module not found"
**Solusi:**
```bash
cd comprehensive_backend

# Recreate virtual environment
rm -rf venv
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Reinstall dependencies
pip install -r requirements.txt
```

#### Error: "numpy import error"
**Solusi:**
```bash
# Upgrade pip first
pip install --upgrade pip

# Install numpy specifically
pip install numpy==1.24.3

# Then install other requirements
pip install -r requirements.txt
```

---

### 2. Frontend Tidak Bisa Start

#### Error: "Node not found"
**Solusi:**
```bash
# Check Node.js installation
node --version

# Install Node.js jika belum ada
# macOS: brew install node
# Ubuntu: sudo apt install nodejs npm
# Windows: Download dari nodejs.org
```

#### Error: "Port 3000 already in use"
**Solusi:**

**macOS/Linux:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

**Windows:**
```bash
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

#### Error: "Module not found" atau "Cannot find module"
**Solusi:**
```bash
cd comprehensive_frontend

# Remove node_modules and lock file
rm -rf node_modules package-lock.json

# Clear npm cache
npm cache clean --force

# Reinstall
npm install
```

#### Error: "Next.js build error"
**Solusi:**
```bash
# Remove .next folder
rm -rf .next

# Rebuild
npm run dev
```

---

### 3. Connection Issues

#### Error: "Failed to fetch" atau "Network Error"
**Penyebab:** Backend tidak running atau CORS issue

**Solusi:**
```bash
# 1. Pastikan backend running
curl http://localhost:8000

# 2. Check CORS settings di backend
# File: comprehensive_backend/main.py
# Pastikan ada:
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Restart backend
```

#### Error: "WebSocket connection failed"
**Solusi:**
```bash
# 1. Check backend WebSocket endpoint
curl http://localhost:8000/ws

# 2. Check browser console for errors

# 3. Disable WebSocket temporarily di frontend
# Edit: comprehensive_frontend/pages/index.js
# Comment out WebSocket code
```

---

### 4. API Errors

#### Error: 404 "Symbol not found"
**Penyebab:** Symbol tidak valid

**Solusi:**
```bash
# Gunakan symbol yang valid: BTC, ETH, BNB, SOL
curl http://localhost:8000/api/predictions/BTC
```

#### Error: 500 "Internal Server Error"
**Solusi:**
```bash
# 1. Check backend logs
# Look for error messages in terminal

# 2. Check data format
# Pastikan request body sesuai format

# 3. Restart backend
```

#### Error: "Trade failed - Validation failed"
**Penyebab:** Trade tidak lolos validasi smart contract

**Solusi:**
```bash
# Check risk limits
curl http://localhost:8000/api/smartcontract/risk-limits

# Adjust limits jika perlu
curl -X POST http://localhost:8000/api/smartcontract/risk-limits \
  -H "Content-Type: application/json" \
  -d '{"min_confidence": 0.5}'
```

---

### 5. Performance Issues

#### Dashboard Loading Lambat
**Solusi:**
```bash
# 1. Reduce update interval
# Edit: comprehensive_frontend/pages/index.js
# Change: setInterval(fetchDashboard, 10000) // 10 seconds

# 2. Disable auto-refresh temporarily
# Comment out setInterval

# 3. Check network tab di browser DevTools
```

#### High CPU Usage
**Solusi:**
```bash
# 1. Reduce WebSocket update frequency
# Edit: comprehensive_backend/main.py
# Change: await asyncio.sleep(5) // 5 seconds

# 2. Limit price history length
# Edit trading_state["price_history"]
# Keep only last 50 items instead of 100
```

---

### 6. Data Issues

#### Prices Not Updating
**Solusi:**
```bash
# 1. Check backend logs
# Look for errors in price generation

# 2. Restart backend
# Ctrl+C and run again

# 3. Clear browser cache
# Hard refresh: Ctrl+Shift+R (Windows/Linux)
# Cmd+Shift+R (macOS)
```

#### Trade History Empty
**Penyebab:** Belum ada trades yang dieksekusi

**Solusi:**
```bash
# Execute beberapa trades dulu
curl -X POST http://localhost:8000/api/trades/execute \
  -H "Content-Type: application/json" \
  -d '{"symbol": "BTC"}'
```

---

### 7. Installation Issues

#### pip install gagal
**Solusi:**
```bash
# Upgrade pip
pip install --upgrade pip

# Install dengan verbose
pip install -r requirements.txt -v

# Install satu per satu jika ada yang gagal
pip install fastapi
pip install uvicorn
pip install numpy
# dst...
```

#### npm install gagal
**Solusi:**
```bash
# Clear cache
npm cache clean --force

# Use different registry
npm install --registry=https://registry.npmjs.org/

# Try yarn instead
npm install -g yarn
yarn install
```

---

### 8. Browser Issues

#### Dashboard Tidak Tampil
**Solusi:**
```bash
# 1. Check browser console (F12)
# Look for JavaScript errors

# 2. Try different browser
# Chrome, Firefox, Safari, Edge

# 3. Disable browser extensions
# Especially ad blockers

# 4. Clear browser cache
```

#### Styling Tidak Muncul
**Solusi:**
```bash
# 1. Check Tailwind CSS
cd comprehensive_frontend

# 2. Rebuild
npm run dev

# 3. Check globals.css loaded
# View page source, look for <style> tags
```

---

### 9. Script Issues

#### run.sh tidak bisa dijalankan
**Solusi:**
```bash
# Give execute permission
chmod +x run.sh

# Check file format (Unix vs Windows)
dos2unix run.sh  # If available

# Run with bash explicitly
bash run.sh
```

#### run.bat tidak bisa dijalankan
**Solusi:**
```bash
# Run as administrator
# Right-click > Run as administrator

# Check Python in PATH
python --version

# Check Node in PATH
node --version
```

---

### 10. Development Issues

#### Hot Reload Tidak Bekerja
**Solusi:**
```bash
# Frontend
cd comprehensive_frontend
rm -rf .next
npm run dev

# Backend
# Restart manually setiap kali ada perubahan
```

#### Import Error di Python
**Solusi:**
```bash
# Make sure virtual environment is activated
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate     # Windows

# Check Python path
which python  # Should point to venv

# Reinstall packages
pip install -r requirements.txt
```

---

## 🔍 Debugging Tips

### 1. Check Logs

**Backend:**
```bash
# Terminal akan menampilkan logs
# Look for:
# - INFO: Application startup complete
# - ERROR messages
# - Stack traces
```

**Frontend:**
```bash
# Browser Console (F12)
# Look for:
# - Network errors
# - JavaScript errors
# - Failed API calls
```

### 2. Test API Manually

```bash
# Test backend health
curl http://localhost:8000

# Test dashboard endpoint
curl http://localhost:8000/api/dashboard

# Test with verbose
curl -v http://localhost:8000/api/dashboard
```

### 3. Check Processes

```bash
# macOS/Linux
ps aux | grep python
ps aux | grep node

# Windows
tasklist | findstr python
tasklist | findstr node
```

### 4. Check Ports

```bash
# macOS/Linux
lsof -i :8000
lsof -i :3000

# Windows
netstat -ano | findstr :8000
netstat -ano | findstr :3000
```

---

## 📞 Getting Help

Jika masih mengalami masalah:

1. **Check Documentation**
   - README_COMPREHENSIVE.md
   - API_DOCUMENTATION.md
   - ARCHITECTURE.md

2. **Check API Docs**
   - http://localhost:8000/docs
   - Interactive testing available

3. **Enable Debug Mode**
   ```python
   # comprehensive_backend/main.py
   # Add at bottom:
   if __name__ == "__main__":
       uvicorn.run(app, host="0.0.0.0", port=8000, log_level="debug")
   ```

4. **Check System Requirements**
   - Python 3.8+
   - Node.js 16+
   - 4GB RAM minimum
   - 1GB free disk space

---

## 🛠️ Quick Fixes

### Complete Reset

```bash
# Stop all processes
# Ctrl+C in all terminals

# Backend reset
cd comprehensive_backend
rm -rf venv __pycache__
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Frontend reset
cd ../comprehensive_frontend
rm -rf node_modules .next package-lock.json
npm install

# Start fresh
cd ..
./run.sh  # or run.bat on Windows
```

### Emergency Restart

```bash
# Kill all Python and Node processes
# macOS/Linux
pkill -9 python
pkill -9 node

# Windows
taskkill /F /IM python.exe
taskkill /F /IM node.exe

# Start again
./run.sh  # or run.bat
```

---

## ✅ Verification Checklist

Sebelum melaporkan issue, pastikan:

- [ ] Python 3.8+ terinstall
- [ ] Node.js 16+ terinstall
- [ ] Port 8000 dan 3000 tidak digunakan
- [ ] Dependencies terinstall (pip & npm)
- [ ] Virtual environment aktif (backend)
- [ ] Backend running di http://localhost:8000
- [ ] Frontend running di http://localhost:3000
- [ ] Browser console tidak ada error
- [ ] Network tab menunjukkan API calls berhasil

---

**Last Updated**: December 3, 2024
