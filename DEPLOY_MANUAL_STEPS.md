# 🚀 Deploy Manual - Step by Step

## VPS: 143.198.205.88

### Step 1: Login ke VPS
Buka terminal dan jalankan:
```bash
ssh root@143.198.205.88
```
Masukkan password VPS Anda.

---

### Step 2: Download Setup Script
```bash
curl -o setup.sh https://raw.githubusercontent.com/IdcuqS07/Ai-power-trade/main/setup-vps.sh
chmod +x setup.sh
```

---

### Step 3: Jalankan Setup (Otomatis)
```bash
./setup.sh
```

Script akan:
- ✅ Update system
- ✅ Install Python 3.11
- ✅ Install Nginx
- ✅ Clone repository
- ✅ Setup virtual environment
- ✅ Install dependencies
- ✅ Create systemd service
- ✅ Configure Nginx
- ✅ Setup firewall

**Waktu: ~3-5 menit**

---

### Step 4: Configure API Keys

Setelah setup selesai, edit file .env:
```bash
nano /opt/Ai-power-trade/comprehensive_backend/.env
```

Ubah baris berikut dengan API keys Anda:
```env
BINANCE_MODE=testnet
BINANCE_TESTNET_API_KEY=your_actual_key_here
BINANCE_TESTNET_SECRET=your_actual_secret_here
```

**Cara mendapatkan API keys:**
1. Buka: https://testnet.binance.vision/
2. Login with GitHub
3. API Keys → Generate HMAC_SHA256
4. Copy API Key dan Secret

Simpan file: `Ctrl+X`, lalu `Y`, lalu `Enter`

---

### Step 5: Restart Service
```bash
systemctl restart ai-trading
```

---

### Step 6: Cek Status
```bash
systemctl status ai-trading
```

Jika ada error, lihat logs:
```bash
journalctl -u ai-trading -n 50
```

---

## ✅ Test Backend

### Dari dalam VPS:
```bash
curl http://localhost:8000/
```

### Dari luar (komputer Anda):
```bash
curl http://143.198.205.88:8000/
curl http://143.198.205.88:8000/api/status
```

### Buka di browser:
- http://143.198.205.88:8000
- http://143.198.205.88:8000/docs (API Documentation)

---

## 🔧 Commands Berguna

```bash
# Lihat status
systemctl status ai-trading

# Lihat logs real-time
journalctl -u ai-trading -f

# Restart service
systemctl restart ai-trading

# Stop service
systemctl stop ai-trading

# Start service
systemctl start ai-trading

# Update backend
cd /opt/Ai-power-trade
git pull
systemctl restart ai-trading
```

---

## 🆘 Troubleshooting

### Backend tidak jalan
```bash
# Cek status
systemctl status ai-trading

# Lihat error logs
journalctl -u ai-trading -n 100

# Cek apakah port 8000 dipakai
lsof -i :8000
```

### Port 8000 sudah dipakai
```bash
# Cari process yang pakai port 8000
lsof -i :8000

# Kill process
kill -9 PID_NUMBER

# Restart service
systemctl restart ai-trading
```

### Firewall blocking
```bash
# Allow port 8000
ufw allow 8000/tcp

# Reload firewall
ufw reload

# Cek status
ufw status
```

### Dependencies error
```bash
cd /opt/Ai-power-trade/comprehensive_backend
source venv/bin/activate
pip install -r requirements.txt --upgrade
systemctl restart ai-trading
```

---

## 📊 Monitoring

### Resource Usage
```bash
# CPU & Memory
htop

# Disk usage
df -h

# Network
netstat -tulpn | grep 8000
```

### Logs
```bash
# Real-time logs
journalctl -u ai-trading -f

# Last 100 lines
journalctl -u ai-trading -n 100

# Today's logs
journalctl -u ai-trading --since today
```

---

## 🔒 Security (Optional)

### Setup Firewall
```bash
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
ufw allow 8000/tcp # Backend
ufw enable
```

### Change SSH Port (Recommended)
```bash
nano /etc/ssh/sshd_config
# Change: Port 22 to Port 2222
systemctl restart sshd

# Update firewall
ufw allow 2222/tcp
```

---

## 🎉 Selesai!

Backend Anda sekarang jalan di:
- **Backend**: http://143.198.205.88:8000
- **API Docs**: http://143.198.205.88:8000/docs
- **Status**: http://143.198.205.88:8000/api/status

Untuk update frontend, gunakan URL backend ini di environment variables.
