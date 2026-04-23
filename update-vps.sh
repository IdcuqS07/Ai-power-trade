#!/bin/bash

# ============================================
# Update Backend di VPS
# ============================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔄 Updating AI Trading Backend...${NC}"
echo ""

# Navigate to project
cd /opt/Ai-power-trade

# Pull latest code
echo -e "${BLUE}📥 Pulling latest code...${NC}"
git pull

# Update dependencies
echo -e "${BLUE}📦 Updating dependencies...${NC}"
cd comprehensive_backend
source venv/bin/activate
pip install -r requirements.txt --upgrade

# Restart service
echo -e "${BLUE}🔄 Restarting service...${NC}"
systemctl restart ai-trading

# Check status
sleep 2
if systemctl is-active --quiet ai-trading; then
    echo -e "${GREEN}✓ Backend updated and running!${NC}"
else
    echo -e "${RED}✗ Service failed to start${NC}"
    echo "Check logs: journalctl -u ai-trading -n 50"
    exit 1
fi

echo ""
echo -e "${GREEN}Update complete! 🎉${NC}"
