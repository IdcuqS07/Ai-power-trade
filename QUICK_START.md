# Quick Start Guide - AI Trading Platform

## 🚀 Cara Cepat Memulai

### Untuk macOS/Linux:

```bash
# 1. Berikan permission
chmod +x run.sh

# 2. Jalankan aplikasi
./run.sh
```

### Untuk Windows:

```bash
# Double-click file run.bat
# atau jalankan di Command Prompt:
run.bat
```

## 📱 Akses Aplikasi

Setelah aplikasi berjalan, buka browser dan akses:

- **Frontend Dashboard**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## 🎯 Fitur yang Tersedia

### 1. Dashboard (/)
- Real-time market prices untuk BTC, ETH, BNB, SOL
- AI trading signal dengan confidence score
- Portfolio overview (balance, P&L, positions)
- Performance statistics
- Smart Contract & Oracle status
- Execute trade button

### 2. Trade History (/trades)
- Complete list of all executed trades
- Trade details: ID, symbol, type, price, quantity, P&L
- Summary statistics
- Real-time updates

### 3. Analytics (/analytics)
- On-chain records (blockchain simulation)
- Smart Contract validations
- Oracle verifications
- System monitoring

## 🔧 Troubleshooting

### Port sudah digunakan?

**Backend (Port 8000):**
```bash
# macOS/Linux
lsof -ti:8000 | xargs kill -9

# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

**Frontend (Port 3000):**
```bash
# macOS/Linux
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Dependencies error?

**Backend:**
```bash
cd comprehensive_backend
pip install -r requirements.txt
```

**Frontend:**
```bash
cd comprehensive_frontend
rm -rf node_modules package-lock.json
npm install
```

## 📊 Testing the System

### 1. Monitor Real-time Prices
- Prices update every 5 seconds
- Watch BTC, ETH, BNB, SOL prices change

### 2. Check AI Signal
- Signal changes based on technical indicators
- Confidence level shows prediction strength
- Risk score indicates trade risk

### 3. Execute Trade
- Click "Execute Trade" button
- System will:
  1. Verify with Oracle
  2. Validate with Smart Contract
  3. Execute if all checks pass
  4. Record on blockchain
  5. Update portfolio

### 4. View Results
- Check trade history page
- Monitor on-chain records
- Review validations

## 🛑 Stop the Application

### macOS/Linux:
Press `Ctrl+C` in terminal

### Windows:
Press `Ctrl+C` in Command Prompt or close the window

## 📝 Notes

- Ini adalah demo platform untuk pembelajaran
- Data market adalah simulasi
- Jangan gunakan dengan uang sungguhan
- Semua trades adalah simulasi

## 🆘 Need Help?

Jika mengalami masalah:
1. Check apakah Python 3.8+ dan Node.js 16+ terinstall
2. Pastikan port 8000 dan 3000 tidak digunakan
3. Review error messages di terminal
4. Check README_COMPREHENSIVE.md untuk detail lengkap

---

**Happy Trading! 🚀**
