# 🚀 VPS Quick Start - 5 Menit Deploy

## Pilihan VPS Terbaik

| Provider | Harga | Specs | Link |
|----------|-------|-------|------|
| **Contabo** ⭐ | $4.99/bln | 4 CPU, 6GB RAM | [contabo.com](https://contabo.com) |
| **Hetzner** | $5/bln | 2 CPU, 4GB RAM | [hetzner.com](https://hetzner.com) |
| **DigitalOcean** | $6/bln | 1 CPU, 1GB RAM | [digitalocean.com](https://digitalocean.com) |

---

## 🎯 Deploy dalam 3 Langkah

### 1️⃣ Login ke VPS
```bash
ssh root@YOUR_VPS_IP
```

### 2️⃣ Run Setup Script
```bash
curl -o setup.sh https://raw.githubusercontent.com/IdcuqS07/Ai-power-trade/main/setup-vps.sh
chmod +x setup.sh
./setup.sh
```

### 3️⃣ Configure API Keys
```bash
nano /opt/Ai-power-trade/comprehensive_backend/.env
```

Isi:
```env
BINANCE_MODE=testnet
BINANCE_TESTNET_API_KEY=your_key
BINANCE_TESTNET_SECRET=your_secret
```

Restart:
```bash
systemctl restart ai-trading
```

---

## ✅ Test Backend

```bash
curl http://YOUR_VPS_IP/api/status
```

---

## 🔄 Update Backend

```bash
cd /opt/Ai-power-trade
git pull
systemctl restart ai-trading
```

---

## 📊 Monitoring

```bash
# Status
systemctl status ai-trading

# Logs
journalctl -u ai-trading -f

# Resource
htop
```

---

## 🆘 Troubleshooting

```bash
# Restart
systemctl restart ai-trading

# Check logs
journalctl -u ai-trading -n 100

# Check port
netstat -tulpn | grep 8000
```

---

## 🔒 Security (Optional)

```bash
# Firewall
ufw enable
ufw allow 22,80,443/tcp

# SSL (jika punya domain)
certbot --nginx -d yourdomain.com
```

---

## 💡 Tips

- **Backup .env**: Simpan API keys di tempat aman
- **Monitor logs**: Cek logs secara berkala
- **Update rutin**: `git pull` untuk update terbaru
- **SSL**: Pakai domain + Cloudflare untuk SSL gratis

---

## 📞 Support

Dokumentasi lengkap: [VPS_DEPLOYMENT_GUIDE.md](VPS_DEPLOYMENT_GUIDE.md)
