# 🚀 Panduan Deploy ke VPS

## Pilihan VPS Murah & Bagus

### 1. **Contabo** (Recommended) 💰
- **Harga**: $4.99/bulan
- **Specs**: 4 vCPU, 6GB RAM, 200GB SSD
- **Link**: https://contabo.com/
- **Lokasi**: Singapore tersedia

### 2. **DigitalOcean**
- **Harga**: $6/bulan
- **Specs**: 1 vCPU, 1GB RAM, 25GB SSD
- **Link**: https://www.digitalocean.com/
- **Bonus**: $200 credit untuk new user

### 3. **Vultr**
- **Harga**: $6/bulan
- **Specs**: 1 vCPU, 1GB RAM, 25GB SSD
- **Link**: https://www.vultr.com/
- **Lokasi**: Singapore tersedia

### 4. **Hetzner**
- **Harga**: €4.51/bulan (~$5)
- **Specs**: 2 vCPU, 4GB RAM, 40GB SSD
- **Link**: https://www.hetzner.com/

---

## 📋 Persiapan

### 1. Beli VPS
- Pilih OS: **Ubuntu 22.04 LTS**
- Lokasi: Singapore/Asia (untuk latency rendah)
- Catat: IP Address, Username (biasanya `root`), Password

### 2. Domain (Opsional)
- Beli domain di Namecheap/Cloudflare
- Arahkan A record ke IP VPS Anda
- Contoh: `api.yourdomain.com` → `123.45.67.89`

---

## 🔧 Setup VPS (Otomatis)

### Cara Cepat - Gunakan Script

1. **Login ke VPS**:
```bash
ssh root@YOUR_VPS_IP
```

2. **Download & Run Setup Script**:
```bash
curl -o setup-vps.sh https://raw.githubusercontent.com/IdcuqS07/Ai-power-trade/main/setup-vps.sh
chmod +x setup-vps.sh
./setup-vps.sh
```

3. **Selesai!** Backend akan berjalan di `http://YOUR_VPS_IP:8000`

---

## 🛠️ Setup Manual (Step by Step)

### Step 1: Update System
```bash
apt update && apt upgrade -y
```

### Step 2: Install Dependencies
```bash
# Install Python 3.11
apt install -y python3.11 python3.11-venv python3-pip

# Install Nginx (reverse proxy)
apt install -y nginx

# Install Certbot (SSL)
apt install -y certbot python3-certbot-nginx

# Install Git
apt install -y git
```

### Step 3: Clone Repository
```bash
cd /opt
git clone https://github.com/IdcuqS07/Ai-power-trade.git
cd Ai-power-trade/comprehensive_backend
```

### Step 4: Setup Python Environment
```bash
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Step 5: Configure Environment
```bash
cp .env.example .env
nano .env
```

Isi dengan API keys Anda:
```env
BINANCE_MODE=testnet
BINANCE_TESTNET_API_KEY=your_key_here
BINANCE_TESTNET_SECRET=your_secret_here
```

### Step 6: Setup Systemd Service
```bash
nano /etc/systemd/system/ai-trading.service
```

Paste konfigurasi ini:
```ini
[Unit]
Description=AI Trading Backend
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/Ai-power-trade/comprehensive_backend
Environment="PATH=/opt/Ai-power-trade/comprehensive_backend/venv/bin"
ExecStart=/opt/Ai-power-trade/comprehensive_backend/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable & Start:
```bash
systemctl daemon-reload
systemctl enable ai-trading
systemctl start ai-trading
systemctl status ai-trading
```

### Step 7: Setup Nginx (Reverse Proxy)
```bash
nano /etc/nginx/sites-available/ai-trading
```

Paste:
```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN_OR_IP;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Enable:
```bash
ln -s /etc/nginx/sites-available/ai-trading /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### Step 8: Setup SSL (Jika pakai domain)
```bash
certbot --nginx -d api.yourdomain.com
```

---

## ✅ Testing

```bash
# Test lokal
curl http://localhost:8000/

# Test dari luar
curl http://YOUR_VPS_IP/

# Test API
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

### Cek Status
```bash
systemctl status ai-trading
```

### Lihat Logs
```bash
journalctl -u ai-trading -f
```

### Cek Resource Usage
```bash
htop
```

---

## 🔒 Security Tips

1. **Firewall**:
```bash
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw enable
```

2. **Change SSH Port**:
```bash
nano /etc/ssh/sshd_config
# Change Port 22 to Port 2222
systemctl restart sshd
```

3. **Disable Root Login**:
```bash
adduser trader
usermod -aG sudo trader
# Edit /etc/ssh/sshd_config
# Set PermitRootLogin no
```

---

## 🆘 Troubleshooting

### Backend tidak jalan
```bash
systemctl status ai-trading
journalctl -u ai-trading -n 50
```

### Port sudah dipakai
```bash
lsof -i :8000
kill -9 PID
```

### Nginx error
```bash
nginx -t
systemctl status nginx
```

---

## 💰 Estimasi Biaya

| Provider | Harga/bulan | RAM | CPU | Storage |
|----------|-------------|-----|-----|---------|
| Contabo | $4.99 | 6GB | 4 vCPU | 200GB |
| DigitalOcean | $6 | 1GB | 1 vCPU | 25GB |
| Vultr | $6 | 1GB | 1 vCPU | 25GB |
| Hetzner | $5 | 4GB | 2 vCPU | 40GB |

**Rekomendasi**: Contabo (best value) atau Hetzner (good specs)

---

## 📞 Support

Jika ada masalah, cek:
1. Logs: `journalctl -u ai-trading -f`
2. Nginx: `nginx -t`
3. Firewall: `ufw status`
4. Port: `netstat -tulpn | grep 8000`
