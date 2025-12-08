#!/bin/bash

# ============================================
# AI Trading Platform - VPS Auto Setup
# ============================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

clear
echo -e "${BLUE}"
cat << "EOF"
╔══════════════════════════════════════════════════════════════════╗
║        🚀 AI Trading Platform - VPS Auto Setup                  ║
╚══════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}✗${NC} Please run as root (use: sudo su)"
    exit 1
fi

echo -e "${GREEN}✓${NC} Running as root"
echo ""

# ============================================
# Step 1: Update System
# ============================================

echo -e "${BLUE}📦 Step 1: Updating System${NC}"
apt update -y
apt upgrade -y
echo -e "${GREEN}✓${NC} System updated"
echo ""

# ============================================
# Step 2: Install Dependencies
# ============================================

echo -e "${BLUE}📦 Step 2: Installing Dependencies${NC}"

# Python
apt install -y python3.11 python3.11-venv python3-pip
echo -e "${GREEN}✓${NC} Python 3.11 installed"

# Nginx
apt install -y nginx
echo -e "${GREEN}✓${NC} Nginx installed"

# Git
apt install -y git curl wget
echo -e "${GREEN}✓${NC} Git installed"

# Certbot (SSL)
apt install -y certbot python3-certbot-nginx
echo -e "${GREEN}✓${NC} Certbot installed"

echo ""

# ============================================
# Step 3: Clone Repository
# ============================================

echo -e "${BLUE}📥 Step 3: Cloning Repository${NC}"

cd /opt

if [ -d "Ai-power-trade" ]; then
    echo -e "${YELLOW}⚠${NC} Repository already exists, pulling latest..."
    cd Ai-power-trade
    git pull
else
    git clone https://github.com/IdcuqS07/Ai-power-trade.git
    cd Ai-power-trade
fi

echo -e "${GREEN}✓${NC} Repository ready"
echo ""

# ============================================
# Step 4: Setup Python Environment
# ============================================

echo -e "${BLUE}🐍 Step 4: Setting up Python Environment${NC}"

cd /opt/Ai-power-trade/comprehensive_backend

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install requirements
pip install --upgrade pip
pip install -r requirements.txt

echo -e "${GREEN}✓${NC} Python environment ready"
echo ""

# ============================================
# Step 5: Configure Environment Variables
# ============================================

echo -e "${BLUE}⚙️ Step 5: Configuring Environment${NC}"

if [ ! -f ".env" ]; then
    cp .env.example .env
    echo -e "${YELLOW}⚠${NC} .env file created from template"
    echo ""
    echo -e "${YELLOW}Please edit .env file with your API keys:${NC}"
    echo "  nano /opt/Ai-power-trade/comprehensive_backend/.env"
    echo ""
    read -p "Press Enter after editing .env file..."
else
    echo -e "${GREEN}✓${NC} .env file already exists"
fi

echo ""

# ============================================
# Step 6: Setup Systemd Service
# ============================================

echo -e "${BLUE}🔧 Step 6: Setting up Systemd Service${NC}"

cat > /etc/systemd/system/ai-trading.service << 'EOF'
[Unit]
Description=AI Trading Backend
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/Ai-power-trade/comprehensive_backend
Environment="PATH=/opt/Ai-power-trade/comprehensive_backend/venv/bin"
ExecStart=/opt/Ai-power-trade/comprehensive_backend/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --workers 2
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable ai-trading
systemctl start ai-trading

echo -e "${GREEN}✓${NC} Systemd service configured"
echo ""

# ============================================
# Step 7: Setup Nginx
# ============================================

echo -e "${BLUE}🌐 Step 7: Setting up Nginx${NC}"

# Get server IP
SERVER_IP=$(curl -s ifconfig.me)

cat > /etc/nginx/sites-available/ai-trading << EOF
server {
    listen 80;
    server_name $SERVER_IP;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/ai-trading /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and restart nginx
nginx -t
systemctl restart nginx

echo -e "${GREEN}✓${NC} Nginx configured"
echo ""

# ============================================
# Step 8: Setup Firewall
# ============================================

echo -e "${BLUE}🔒 Step 8: Setting up Firewall${NC}"

ufw --force enable
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS

echo -e "${GREEN}✓${NC} Firewall configured"
echo ""

# ============================================
# Step 9: Test Deployment
# ============================================

echo -e "${BLUE}🧪 Step 9: Testing Deployment${NC}"

sleep 3

# Test backend
if curl -s http://localhost:8000/ > /dev/null; then
    echo -e "${GREEN}✓${NC} Backend is running"
else
    echo -e "${RED}✗${NC} Backend test failed"
    echo "Check logs: journalctl -u ai-trading -n 50"
fi

echo ""

# ============================================
# Summary
# ============================================

echo -e "${GREEN}"
cat << "EOF"
╔══════════════════════════════════════════════════════════════════╗
║                    🎉 Setup Complete!                            ║
╚══════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo -e "${BLUE}📍 Your Backend URLs:${NC}"
echo "  • HTTP:  http://$SERVER_IP"
echo "  • API:   http://$SERVER_IP/api/status"
echo ""

echo -e "${BLUE}🔧 Useful Commands:${NC}"
echo "  • Status:  systemctl status ai-trading"
echo "  • Logs:    journalctl -u ai-trading -f"
echo "  • Restart: systemctl restart ai-trading"
echo "  • Update:  cd /opt/Ai-power-trade && git pull && systemctl restart ai-trading"
echo ""

echo -e "${BLUE}📝 Next Steps:${NC}"
echo "  1. Edit .env file: nano /opt/Ai-power-trade/comprehensive_backend/.env"
echo "  2. Add your Binance API keys"
echo "  3. Restart service: systemctl restart ai-trading"
echo "  4. Test API: curl http://$SERVER_IP/api/status"
echo ""

echo -e "${BLUE}🔒 Optional - Setup SSL:${NC}"
echo "  1. Point your domain to: $SERVER_IP"
echo "  2. Run: certbot --nginx -d yourdomain.com"
echo ""

echo -e "${GREEN}Happy Trading! 📈${NC}"
