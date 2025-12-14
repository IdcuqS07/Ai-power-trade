#!/bin/bash

# ============================================
# Render Auto Deploy Script
# Semi-automated deployment to Render
# ============================================

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

clear
echo -e "${BLUE}"
cat << "EOF"
╔══════════════════════════════════════════════════════════════════╗
║        🚀 Render Auto Deploy - Semi Automated                   ║
╚══════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# ============================================
# Check if .env exists
# ============================================

echo -e "${YELLOW}📋 Checking Configuration${NC}\n"

if [ -f "comprehensive_backend/.env" ]; then
    echo -e "${GREEN}✓${NC} Found .env file"
    
    # Read API keys from .env
    source comprehensive_backend/.env
    
    if [ -n "$BINANCE_TESTNET_API_KEY" ] && [ -n "$BINANCE_TESTNET_SECRET" ]; then
        echo -e "${GREEN}✓${NC} API Keys loaded from .env"
        echo -e "   API Key: ${BINANCE_TESTNET_API_KEY:0:10}..."
        echo -e "   Secret: ${BINANCE_TESTNET_SECRET:0:10}..."
    else
        echo -e "${RED}✗${NC} API Keys not found in .env"
        echo ""
        read -p "Enter BINANCE_TESTNET_API_KEY: " BINANCE_TESTNET_API_KEY
        read -p "Enter BINANCE_TESTNET_SECRET: " BINANCE_TESTNET_SECRET
    fi
else
    echo -e "${YELLOW}⚠${NC} .env file not found"
    echo ""
    read -p "Enter BINANCE_TESTNET_API_KEY: " BINANCE_TESTNET_API_KEY
    read -p "Enter BINANCE_TESTNET_SECRET: " BINANCE_TESTNET_SECRET
fi

# ============================================
# Verify GitHub push
# ============================================

echo -e "\n${BLUE}📦 Verifying GitHub${NC}\n"

# Check if render.yaml exists
if [ ! -f "render.yaml" ]; then
    echo -e "${RED}✗${NC} render.yaml not found!"
    exit 1
fi

echo -e "${GREEN}✓${NC} render.yaml found"

# Check git status
if git diff-index --quiet HEAD --; then
    echo -e "${GREEN}✓${NC} All changes committed"
else
    echo -e "${YELLOW}⚠${NC} Uncommitted changes detected"
    read -p "Commit and push now? (y/n): " COMMIT_NOW
    
    if [ "$COMMIT_NOW" = "y" ]; then
        git add .
        git commit -m "Update for Render deployment"
        git push origin main
        echo -e "${GREEN}✓${NC} Changes pushed to GitHub"
    fi
fi

# ============================================
# Open Render Dashboard
# ============================================

echo -e "\n${BLUE}🌐 Opening Render Dashboard${NC}\n"

# Detect OS and open browser
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open "https://dashboard.render.com/"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    xdg-open "https://dashboard.render.com/"
else
    echo "Please open: https://dashboard.render.com/"
fi

echo -e "${GREEN}✓${NC} Browser opened"

# ============================================
# Interactive Instructions
# ============================================

echo -e "\n${BLUE}📋 Follow These Steps in Render Dashboard:${NC}\n"

echo "1. Click 'New +' → 'Blueprint'"
echo "2. Connect repository: Ai-power-trade"
echo "3. Render will detect render.yaml → Click 'Apply'"
echo ""
echo "4. Set Environment Variables:"
echo -e "   ${YELLOW}BINANCE_TESTNET_API_KEY${NC} = ${BINANCE_TESTNET_API_KEY}"
echo -e "   ${YELLOW}BINANCE_TESTNET_SECRET${NC} = ${BINANCE_TESTNET_SECRET}"
echo ""
echo "5. Click 'Apply' and wait 2-3 minutes"
echo ""

# Copy to clipboard if available
if command -v pbcopy &> /dev/null; then
    echo "$BINANCE_TESTNET_API_KEY" | pbcopy
    echo -e "${GREEN}✓${NC} API Key copied to clipboard (paste with Cmd+V)"
elif command -v xclip &> /dev/null; then
    echo "$BINANCE_TESTNET_API_KEY" | xclip -selection clipboard
    echo -e "${GREEN}✓${NC} API Key copied to clipboard (paste with Ctrl+V)"
fi

read -p "Press Enter after deployment is complete..."

# ============================================
# Get Backend URL
# ============================================

echo -e "\n${BLUE}🔗 Backend Configuration${NC}\n"

read -p "Enter your backend URL (https://...): " BACKEND_URL

if [ -z "$BACKEND_URL" ]; then
    echo -e "${RED}✗${NC} Backend URL is required"
    exit 1
fi

echo -e "${GREEN}✓${NC} Backend URL: $BACKEND_URL"

# ============================================
# Update Vercel
# ============================================

echo -e "\n${BLUE}🔄 Updating Vercel${NC}\n"

cd comprehensive_frontend

# Check if vercel is installed
if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm install -g vercel
fi

# Add environment variable
echo "$BACKEND_URL" | vercel env add NEXT_PUBLIC_API_URL production

# Redeploy
echo "Redeploying frontend..."
vercel --prod --yes > /dev/null 2>&1

cd ..

echo -e "${GREEN}✓${NC} Vercel updated and redeployed"

# ============================================
# Test Deployment
# ============================================

echo -e "\n${BLUE}🧪 Testing Deployment${NC}\n"

echo "Testing backend..."
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/status")

if [ "$BACKEND_STATUS" = "200" ]; then
    echo -e "${GREEN}✓${NC} Backend is responding (HTTP $BACKEND_STATUS)"
else
    echo -e "${YELLOW}⚠${NC} Backend returned HTTP $BACKEND_STATUS"
fi

# ============================================
# Summary
# ============================================

echo -e "\n${GREEN}"
cat << "EOF"
╔══════════════════════════════════════════════════════════════════╗
║                    🎉 Deployment Complete!                       ║
╚══════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo "📍 Your URLs:"
echo "   Backend:  $BACKEND_URL"
echo ""
echo "🧪 Test your deployment:"
echo "   curl $BACKEND_URL/api/status"
echo ""
echo "📚 Next Steps:"
echo "   1. Open your frontend URL"
echo "   2. Check if prices are loading"
echo "   3. Verify Binance connection"
echo "   4. Execute a test trade"
echo ""

# Save deployment info
cat > DEPLOYMENT_INFO.txt << EOF
AI Trading Platform - Deployment Information
============================================

Deployment Date: $(date)

URLs:
  Backend: $BACKEND_URL

Configuration:
  Binance Mode: testnet
  API Key: ${BINANCE_TESTNET_API_KEY:0:10}...

Status: ✅ Deployed

Test Commands:
  curl $BACKEND_URL/api/status

Next Steps:
  1. Test all features
  2. Monitor logs
  3. Execute test trades
EOF

echo -e "${GREEN}✓${NC} Deployment info saved to DEPLOYMENT_INFO.txt"
echo ""
echo -e "${GREEN}Happy Trading! 📈${NC}"
