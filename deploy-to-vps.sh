#!/bin/bash

# ============================================
# Deploy to VPS: 143.198.205.88
# ============================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

VPS_IP="143.198.205.88"
VPS_USER="root"

clear
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        🚀 Deploy to VPS: $VPS_IP                    ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if we can connect
echo -e "${BLUE}🔍 Checking VPS connection...${NC}"
if ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no $VPS_USER@$VPS_IP "echo 'Connected'" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} VPS is reachable"
else
    echo -e "${YELLOW}⚠${NC} Cannot connect to VPS"
    echo ""
    echo "Please ensure:"
    echo "  1. VPS is running"
    echo "  2. SSH key is added: ssh-copy-id $VPS_USER@$VPS_IP"
    echo "  3. Or use password: ssh $VPS_USER@$VPS_IP"
    echo ""
    read -p "Continue anyway? (y/n): " CONTINUE
    if [ "$CONTINUE" != "y" ]; then
        exit 0
    fi
fi

echo ""
echo -e "${BLUE}📋 Deployment Steps:${NC}"
echo "  1. Upload setup script to VPS"
echo "  2. Run automated setup"
echo "  3. Configure environment"
echo "  4. Start backend service"
echo ""

read -p "Press Enter to continue..."

# ============================================
# Upload and Execute Setup Script
# ============================================

echo ""
echo -e "${BLUE}📤 Uploading setup script...${NC}"

# Upload setup script
scp -o StrictHostKeyChecking=no setup-vps.sh $VPS_USER@$VPS_IP:/root/

echo -e "${GREEN}✓${NC} Script uploaded"
echo ""

# Execute setup
echo -e "${BLUE}🚀 Running setup on VPS...${NC}"
echo -e "${YELLOW}This will take 3-5 minutes...${NC}"
echo ""

ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_IP "bash /root/setup-vps.sh"

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    🎉 Deployment Complete!                       ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${BLUE}📍 Your Backend:${NC}"
echo "  • URL:    http://$VPS_IP"
echo "  • API:    http://$VPS_IP/api/status"
echo "  • Docs:   http://$VPS_IP/docs"
echo ""

echo -e "${BLUE}🔧 Next Steps:${NC}"
echo "  1. Configure API keys:"
echo "     ssh $VPS_USER@$VPS_IP"
echo "     nano /opt/Ai-power-trade/comprehensive_backend/.env"
echo ""
echo "  2. Restart service:"
echo "     systemctl restart ai-trading"
echo ""
echo "  3. Test backend:"
echo "     curl http://$VPS_IP/api/status"
echo ""

echo -e "${BLUE}📊 Monitoring:${NC}"
echo "  • Status:  ssh $VPS_USER@$VPS_IP 'systemctl status ai-trading'"
echo "  • Logs:    ssh $VPS_USER@$VPS_IP 'journalctl -u ai-trading -f'"
echo ""

# Test backend
echo -e "${BLUE}🧪 Testing backend...${NC}"
sleep 3

if curl -s http://$VPS_IP/ > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Backend is responding!"
    echo ""
    echo "Response:"
    curl -s http://$VPS_IP/ | python3 -m json.tool 2>/dev/null || curl -s http://$VPS_IP/
else
    echo -e "${YELLOW}⚠${NC} Backend not responding yet"
    echo "  This is normal if .env is not configured"
    echo "  Configure .env and restart service"
fi

echo ""
echo -e "${GREEN}Happy Trading! 📈${NC}"
