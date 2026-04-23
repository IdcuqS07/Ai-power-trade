#!/bin/bash

# ============================================
# Deploy Backend to Vercel
# ============================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

clear
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        🚀 Deploy Backend to Vercel                              ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}⚠${NC} Vercel CLI not found. Installing..."
    npm install -g vercel
    echo -e "${GREEN}✓${NC} Vercel CLI installed"
fi

# Navigate to backend directory
cd comprehensive_backend

echo -e "${BLUE}📋 Deployment Configuration${NC}"
echo ""
echo "Backend directory: comprehensive_backend"
echo "Entry point: api/index.py"
echo "Framework: FastAPI (Python)"
echo ""

# Check if .env exists
if [ -f ".env" ]; then
    echo -e "${GREEN}✓${NC} Found .env file"
    source .env
else
    echo -e "${YELLOW}⚠${NC} .env file not found"
    echo ""
    read -p "Enter BINANCE_TESTNET_API_KEY: " BINANCE_TESTNET_API_KEY
    read -p "Enter BINANCE_TESTNET_SECRET: " BINANCE_TESTNET_SECRET
fi

echo ""
echo -e "${BLUE}🚀 Deploying to Vercel...${NC}"
echo ""

# Deploy to Vercel
vercel --prod --yes

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    🎉 Deployment Complete!                       ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo "1. Set environment variables in Vercel dashboard:"
echo "   - BINANCE_MODE=testnet"
echo "   - BINANCE_TESTNET_API_KEY=your_key"
echo "   - BINANCE_TESTNET_SECRET=your_secret"
echo ""
echo "2. Test your backend:"
echo "   curl https://your-backend.vercel.app/"
echo ""
echo "3. Update frontend with backend URL"
echo ""

cd ..
