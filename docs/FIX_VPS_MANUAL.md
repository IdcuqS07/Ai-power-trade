# 🔧 Fix VPS Backend - Manual Steps

## Langkah-langkah (5 Menit)

### 1. SSH ke VPS

```bash
ssh root@143.198.205.88
```

Masukkan password VPS Anda.

### 2. Kill Proses Lama

```bash
# Kill semua uvicorn
pkill -9 -f uvicorn

# Tunggu 2 detik
sleep 2
```

### 3. Update Code

```bash
# Masuk ke folder project
cd /opt/Ai-power-trade

# Simpan perubahan lokal (jika ada)
git stash

# Pull code terbaru
git pull origin main
```

### 4. Restart Service

```bash
# Stop service
sudo systemctl stop ai-trading-backend

# Tunggu 2 detik
sleep 2

# Start service
sudo systemctl start ai-trading-backend

# Tunggu 5 detik
sleep 5
```

### 5. Cek Status

```bash
# Lihat status service
sudo systemctl status ai-trading-backend

# Jika ada error, lihat log:
sudo journalctl -u ai-trading-backend -n 50
```

### 6. Test Endpoint

```bash
# Test dari dalam VPS
curl http://localhost:8000/api/ai/explain/BTC

# Jika berhasil, akan muncul JSON seperti:
# {"success":true,"data":{"symbol":"BTC",...}}
```

### 7. Test dari Luar

```bash
# Keluar dari VPS
exit

# Test dari local machine
curl https://ai-powertrade.duckdns.org/api/ai/explain/BTC
```

## ✅ Success Indicators

Backend berhasil jika:
- ✅ Service status: "active (running)"
- ✅ Curl localhost mengembalikan JSON
- ✅ Curl dari luar mengembalikan JSON
- ✅ Tidak ada error di log

## 🚨 Troubleshooting

### Jika Service Gagal Start:

```bash
# Cek apa yang salah
sudo journalctl -u ai-trading-backend -n 100

# Cek port 8000
sudo lsof -i :8000

# Jika ada proses lain, kill:
sudo kill -9 <PID>

# Restart lagi
sudo systemctl restart ai-trading-backend
```

### Jika Masih Error "Address already in use":

```bash
# Find dan kill semua proses di port 8000
sudo lsof -ti:8000 | xargs sudo kill -9

# Restart
sudo systemctl restart ai-trading-backend
```

### Jika Git Pull Gagal:

```bash
# Reset perubahan lokal
git reset --hard origin/main

# Pull lagi
git pull origin main
```

## 📋 Quick Command Sequence

Copy-paste semua command ini sekaligus:

```bash
ssh root@143.198.205.88 << 'EOF'
pkill -9 -f uvicorn
sleep 2
cd /opt/Ai-power-trade
git stash
git pull origin main
sudo systemctl stop ai-trading-backend
sleep 2
sudo systemctl start ai-trading-backend
sleep 5
sudo systemctl status ai-trading-backend --no-pager | head -15
echo ""
echo "Testing endpoint..."
curl -s http://localhost:8000/api/ai/explain/BTC | head -c 300
echo ""
EOF
```

Lalu test dari local:
```bash
curl https://ai-powertrade.duckdns.org/api/ai/explain/BTC
```

## ✅ Expected Output

Jika berhasil, Anda akan melihat:

```json
{
  "success": true,
  "data": {
    "symbol": "BTC",
    "signal": "BUY",
    "confidence": 0.87,
    "buy_score": 6.5,
    "sell_score": 2.0,
    "risk_score": 35,
    "position_size": 15.2,
    "indicators": {
      "rsi": 28.5,
      "macd": 15.3,
      "ma_5": 50234.5,
      "ma_20": 49876.2,
      ...
    },
    "reasoning": [
      {
        "indicator": "RSI",
        "explanation": "RSI is 28.5, oversold...",
        "impact": 2.0
      },
      ...
    ]
  }
}
```

---

**Setelah backend fix, lanjut cek Vercel!**
