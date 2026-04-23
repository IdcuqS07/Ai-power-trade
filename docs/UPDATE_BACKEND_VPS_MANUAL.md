# Manual Update Backend di VPS

## 🎯 Tujuan
Update backend di VPS agar AI Signal bisa berubah sesuai coin yang dipilih

## 📝 Perubahan yang Dibuat
File `comprehensive_backend/main.py` line 673-681:
```python
# SEBELUM:
@app.get("/api/dashboard")
async def get_dashboard():
    signal = ai_predictor.generate_signal("BTC")  # Hardcoded BTC

# SESUDAH:
@app.get("/api/dashboard")
async def get_dashboard(symbol: str = "BTC"):
    signal = ai_predictor.generate_signal(symbol)  # Dynamic symbol
```

## 🚀 Cara Update (Manual via SSH)

### Step 1: Login ke VPS
```bash
ssh root@143.198.205.88
# Masukkan password VPS
```

### Step 2: Cari lokasi backend
```bash
# Cari file main.py
find ~ -name "main.py" -type f 2>/dev/null | grep -v __pycache__

# Atau cek process yang running
ps aux | grep uvicorn
```

### Step 3: Backup file lama
```bash
# Ganti /path/to dengan path yang ditemukan di step 2
cp /path/to/main.py /path/to/main.py.backup
```

### Step 4: Edit file main.py
```bash
# Gunakan nano atau vim
nano /path/to/main.py

# Cari baris ini (sekitar line 673-681):
@app.get("/api/dashboard")
async def get_dashboard():
    signal = ai_predictor.generate_signal("BTC")

# Ubah menjadi:
@app.get("/api/dashboard")
async def get_dashboard(symbol: str = "BTC"):
    signal = ai_predictor.generate_signal(symbol)

# Save: Ctrl+O, Enter, Ctrl+X
```

### Step 5: Restart backend
```bash
# Kill process lama
pkill -f "uvicorn main:app"

# Start process baru
cd /path/to/backend
nohup python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 > backend.log 2>&1 &

# Cek apakah running
ps aux | grep uvicorn
```

### Step 6: Test
```bash
# Test dengan BTC (default)
curl http://localhost:8000/api/dashboard | python3 -m json.tool | grep -A 5 "current_signal"

# Test dengan ETH
curl "http://localhost:8000/api/dashboard?symbol=ETH" | python3 -m json.tool | grep -A 5 "current_signal"

# Test dengan SOL
curl "http://localhost:8000/api/dashboard?symbol=SOL" | python3 -m json.tool | grep -A 5 "current_signal"
```

## ✅ Verifikasi
Setelah update, test dari browser:
- http://143.198.205.88:8000/api/dashboard?symbol=BTC
- http://143.198.205.88:8000/api/dashboard?symbol=ETH
- http://143.198.205.88:8000/api/dashboard?symbol=SOL

Setiap coin harus return signal yang berbeda (RSI, MACD, dll berbeda).

## 🌐 Test Frontend
Setelah backend di-update:
1. Buka: https://comprehensivefrontend-k48wxhp76-idcuq-santosos-projects.vercel.app
2. Hard refresh (Ctrl+Shift+R)
3. Klik coin berbeda di coin selector
4. AI Trading Signal card harus update sesuai coin yang dipilih

## 🔧 Troubleshooting

### Backend tidak start
```bash
# Cek log error
tail -50 backend.log

# Cek port 8000 sudah dipakai
lsof -i :8000
```

### Signal tidak berubah
```bash
# Cek apakah parameter symbol diterima
tail -f backend.log
# Lalu test dari terminal lain:
curl "http://localhost:8000/api/dashboard?symbol=ETH"
```

### Permission denied
```bash
# Pastikan file executable
chmod +x /path/to/main.py
```

## 📊 Expected Result
Setelah update berhasil, setiap coin akan punya signal berbeda:
- **BTC**: RSI ~32, MACD ~-5, Signal: SELL
- **ETH**: RSI berbeda, MACD berbeda, Signal bisa BUY/SELL/HOLD
- **SOL**: RSI berbeda, MACD berbeda, Signal bisa BUY/SELL/HOLD

## 💡 Alternative: Copy File dari Local
Jika edit manual sulit, bisa copy file dari local:
```bash
# Dari local machine
scp comprehensive_backend/main.py root@143.198.205.88:/path/to/backend/

# Lalu SSH dan restart
ssh root@143.198.205.88
pkill -f "uvicorn main:app"
cd /path/to/backend
nohup python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 > backend.log 2>&1 &
```
