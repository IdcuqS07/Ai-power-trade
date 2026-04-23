# 🚀 Deploy Sekarang ke VPS: 143.198.205.88

## Opsi 1: Deploy Otomatis (Recommended)

### Dari komputer lokal Anda:

```bash
./deploy-to-vps.sh
```

Script ini akan:
- Upload setup script ke VPS
- Install semua dependencies
- Setup backend service
- Configure Nginx
- Start backend

---

## Opsi 2: Manual Deploy

### 1. Login ke VPS
```bash
ssh root@143.198.205.88
```

### 2. Download & Run Setup
```bash
curl -o setup.sh https://raw.githubusercontent.com/IdcuqS07/Ai-power-trade/main/setup-vps.sh
chmod +x setup.sh
./setup.sh
```

### 3. Configure API Keys
```bash
nano /opt/Ai-power-trade/comprehensive_backend/.env
```

Isi dengan:
```env
BINANCE_MODE=testnet
BINANCE_TESTNET_API_KEY=your_key_here
BINANCE_TESTNET_SECRET=your_secret_here
```

### 4. Restart Service
```bash
systemctl restart ai-trading
```

---

## ✅ Test Backend

```bash
# Test dari VPS
curl http://localhost:8000/

# Test dari luar
curl http://143.198.205.88:8000/

# Test API
curl http://143.198.205.88:8000/api/status
```

---

## 🔧 Useful Commands

```bash
# Status
systemctl status ai-trading

# Logs
journalctl -u ai-trading -f

# Restart
systemctl restart ai-trading

# Update
cd /opt/Ai-power-trade && git pull && systemctl restart ai-trading
```

---

## 📍 Your URLs

- **Backend**: http://143.198.205.88:8000
- **API Status**: http://143.198.205.88:8000/api/status
- **API Docs**: http://143.198.205.88:8000/docs
- **WebSocket**: ws://143.198.205.88:8000/ws/prices

---

## 🔒 Setup SSL (Optional)

Jika punya domain:

```bash
# Point domain ke 143.198.205.88
# Lalu jalankan:
certbot --nginx -d api.yourdomain.com
```

---

## 🆘 Troubleshooting

### Backend tidak jalan
```bash
systemctl status ai-trading
journalctl -u ai-trading -n 50
```

### Port 8000 sudah dipakai
```bash
lsof -i :8000
kill -9 PID
systemctl restart ai-trading
```

### Firewall blocking
```bash
ufw allow 8000/tcp
ufw reload
```

---

## 📞 Need Help?

Cek dokumentasi lengkap: [VPS_DEPLOYMENT_GUIDE.md](VPS_DEPLOYMENT_GUIDE.md)
