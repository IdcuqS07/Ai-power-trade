#!/bin/bash

# ============================================
# AI Trading Platform - Simple Auto Deploy
# One-command deployment script
# ============================================

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

clear
echo -e "${BLUE}"
cat << "EOF"
╔══════════════════════════════════════════════════════════════════╗
║        🚀 AI Trading Platform - Auto Deploy (Simple)            ║
╚══════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# ============================================
# Configuration
# ============================================

echo -e "${YELLOW}📋 Konfigurasi Deployment${NC}\n"

# Check if .env exists
if [ -f "comprehensive_backend/.env" ]; then
    echo -e "${GREEN}✓${NC} File .env ditemukan"
    read -p "Gunakan .env yang ada? (y/n): " USE_EXISTING
    
    if [ "$USE_EXISTING" != "y" ]; then
        read -p "BINANCE_TESTNET_API_KEY: " API_KEY
        read -p "BINANCE_TESTNET_SECRET: " API_SECRET
        
        cat > comprehensive_backend/.env << EOF
BINANCE_MODE=testnet
BINANCE_TESTNET_API_KEY=$API_KEY
BINANCE_TESTNET_SECRET=$API_SECRET
EOF
    fi
else
    echo -e "${YELLOW}ℹ${NC} File .env tidak ditemukan, membuat baru..."
    echo ""
    echo "Dapatkan API Keys dari: https://testnet.binance.vision/"
    echo ""
    read -p "BINANCE_TESTNET_API_KEY: " API_KEY
    read -p "BINANCE_TESTNET_SECRET: " API_SECRET
    
    cat > comprehensive_backend/.env << EOF
BINANCE_MODE=testnet
BINANCE_TESTNET_API_KEY=$API_KEY
BINANCE_TESTNET_SECRET=$API_SECRET
EOF
    
    echo -e "${GREEN}✓${NC} File .env dibuat"
fi

# ============================================
# Install Dependencies
# ============================================

echo -e "\n${BLUE}📦 Installing Dependencies${NC}\n"

# Check Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm install -g vercel
fi

echo -e "${GREEN}✓${NC} Dependencies ready"

# ============================================
# Deploy Frontend
# ============================================

echo -e "\n${BLUE}🎨 Deploying Frontend${NC}\n"

cd comprehensive_frontend

# Check if already linked
if [ ! -f ".vercel/project.json" ]; then
    echo "Linking to Vercel..."
    vercel link --yes
fi

echo "Deploying to Vercel..."
DEPLOY_OUTPUT=$(vercel --prod --yes 2>&1)
FRONTEND_URL=$(echo "$DEPLOY_OUTPUT" | grep -o 'https://[^ ]*' | head -1)

if [ -z "$FRONTEND_URL" ]; then
    echo -e "${YELLOW}⚠${NC} Could not extract URL, checking Vercel..."
    FRONTEND_URL=$(vercel ls --prod 2>&1 | grep -o 'https://[^ ]*' | head -1)
fi

cd ..

echo -e "${GREEN}✓${NC} Frontend deployed: $FRONTEND_URL"

# ============================================
# Backend Instructions
# ============================================

echo -e "\n${BLUE}🔧 Backend Deployment${NC}\n"

echo -e "${YELLOW}Backend perlu di-deploy ke Render.com:${NC}"
echo ""
echo "1. Buka: https://dashboard.render.com/"
echo "2. New + → Web Service → Connect GitHub"
echo "3. Configure:"
echo "   Name: ai-trading-backend"
echo "   Root: comprehensive_backend"
echo "   Build: pip install -r requirements.txt"
echo "   Start: uvicorn main:app --host 0.0.0.0 --port \$PORT"
echo ""
echo "4. Environment Variables (copy dari .env):"
cat comprehensive_backend/.env | sed 's/^/   /'
echo ""

read -p "Tekan Enter setelah backend deployed..."
read -p "Backend URL: " BACKEND_URL

# ============================================
# Update Frontend Config
# ============================================

echo -e "\n${BLUE}🔄 Updating Frontend${NC}\n"

cd comprehensive_frontend

# Add environment variable
echo "$BACKEND_URL" | vercel env add NEXT_PUBLIC_API_URL production

# Redeploy
echo "Redeploying with backend URL..."
vercel --prod --yes > /dev/null 2>&1

cd ..

echo -e "${GREEN}✓${NC} Frontend updated"

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
echo "   Frontend: $FRONTEND_URL"
echo "   Backend:  $BACKEND_URL"
echo ""
echo "🧪 Test your deployment:"
echo "   curl $BACKEND_URL/api/status"
echo "   open $FRONTEND_URL"
echo ""
echo "📚 Documentation:"
echo "   • DEPLOY_SEKARANG.md"
echo "   • PANDUAN_DEPLOY_INDONESIA.md"
echo ""

# Save info
cat > DEPLOYMENT_INFO.txt << EOF
Deployment Information
======================

Date: $(date)

URLs:
  Frontend: $FRONTEND_URL
  Backend:  $BACKEND_URL

Configuration:
  Mode: testnet
  
Test Commands:
  curl $BACKEND_URL/api/status
  open $FRONTEND_URL

Status: ✅ Deployed
EOF

echo -e "${GREEN}✓${NC} Info saved to DEPLOYMENT_INFO.txt"
echo ""
echo -e "${GREEN}Happy Trading! 📈${NC}"
