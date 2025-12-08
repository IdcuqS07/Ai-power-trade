#!/bin/bash

# ============================================
# AI Trading Platform - Auto Deploy Script
# ============================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "\n${BLUE}╔══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC}  $1"
    echo -e "${BLUE}╚══════════════════════════════════════════════════════════════════╝${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${YELLOW}ℹ${NC} $1"
}

# ============================================
# Main Script
# ============================================

clear
print_header "🚀 AI Trading Platform - Auto Deploy"

echo -e "${BLUE}Deployment akan dilakukan ke:${NC}"
echo "  • Backend: Render.com (via CLI)"
echo "  • Frontend: Vercel (via CLI)"
echo ""

# ============================================
# Step 1: Check Prerequisites
# ============================================

print_header "📋 Step 1: Checking Prerequisites"

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Node.js installed: $NODE_VERSION"
else
    print_error "Node.js not found. Please install Node.js 16+"
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_success "npm installed: $NPM_VERSION"
else
    print_error "npm not found"
    exit 1
fi

# Check Python
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    print_success "Python installed: $PYTHON_VERSION"
else
    print_error "Python not found. Please install Python 3.9+"
    exit 1
fi

# Check Git
if command -v git &> /dev/null; then
    print_success "Git installed"
else
    print_error "Git not found. Please install Git"
    exit 1
fi

# ============================================
# Step 2: Install Vercel CLI
# ============================================

print_header "📦 Step 2: Installing Vercel CLI"

if command -v vercel &> /dev/null; then
    print_success "Vercel CLI already installed"
else
    print_info "Installing Vercel CLI..."
    npm install -g vercel
    print_success "Vercel CLI installed"
fi

# ============================================
# Step 3: Get Binance API Keys
# ============================================

print_header "🔑 Step 3: Binance API Configuration"

echo -e "${YELLOW}Anda perlu Binance Testnet API Keys.${NC}"
echo ""
echo "Cara mendapatkan:"
echo "  1. Buka: https://testnet.binance.vision/"
echo "  2. Login with GitHub"
echo "  3. API Keys → Generate HMAC_SHA256"
echo "  4. Copy API Key dan Secret"
echo ""

read -p "Sudah punya API Keys? (y/n): " HAS_KEYS

if [ "$HAS_KEYS" != "y" ]; then
    print_info "Silakan dapatkan API Keys terlebih dahulu"
    echo "Buka: https://testnet.binance.vision/"
    exit 0
fi

echo ""
read -p "Masukkan BINANCE_TESTNET_API_KEY: " BINANCE_API_KEY
read -p "Masukkan BINANCE_TESTNET_SECRET: " BINANCE_SECRET

if [ -z "$BINANCE_API_KEY" ] || [ -z "$BINANCE_SECRET" ]; then
    print_error "API Keys tidak boleh kosong"
    exit 1
fi

print_success "API Keys configured"

# ============================================
# Step 4: Create .env files
# ============================================

print_header "⚙️ Step 4: Creating Environment Files"

# Backend .env
cat > comprehensive_backend/.env << EOF
BINANCE_MODE=testnet
BINANCE_TESTNET_API_KEY=$BINANCE_API_KEY
BINANCE_TESTNET_SECRET=$BINANCE_SECRET
EOF

print_success "Backend .env created"

# ============================================
# Step 5: Test Backend Locally
# ============================================

print_header "🧪 Step 5: Testing Backend Locally"

print_info "Installing backend dependencies..."
cd comprehensive_backend
python3 -m pip install -r requirements.txt --quiet

print_info "Starting backend server..."
python3 -c "
from main import app
import uvicorn
import threading
import time
import requests

def start_server():
    uvicorn.run(app, host='127.0.0.1', port=8888, log_level='error')

# Start server in background
server_thread = threading.Thread(target=start_server, daemon=True)
server_thread.start()

# Wait for server to start
time.sleep(3)

# Test health endpoint
try:
    response = requests.get('http://127.0.0.1:8888/', timeout=5)
    if response.status_code == 200:
        print('✓ Backend test passed')
        exit(0)
    else:
        print('✗ Backend test failed')
        exit(1)
except Exception as e:
    print(f'✗ Backend test failed: {e}')
    exit(1)
" && print_success "Backend test passed" || (print_error "Backend test failed" && exit 1)

cd ..

# ============================================
# Step 6: Deploy Frontend to Vercel
# ============================================

print_header "🎨 Step 6: Deploying Frontend to Vercel"

print_info "Deploying to Vercel..."
cd comprehensive_frontend

# Deploy to Vercel (production)
FRONTEND_URL=$(vercel --prod --yes 2>&1 | grep -o 'https://[^ ]*' | head -1)

if [ -z "$FRONTEND_URL" ]; then
    print_error "Frontend deployment failed"
    cd ..
    exit 1
fi

print_success "Frontend deployed: $FRONTEND_URL"
cd ..

# ============================================
# Step 7: Deploy Backend (Manual Instructions)
# ============================================

print_header "🔧 Step 7: Backend Deployment"

echo -e "${YELLOW}Backend perlu di-deploy manual ke Render.com${NC}"
echo ""
echo "Langkah-langkah:"
echo "  1. Buka: https://dashboard.render.com/"
echo "  2. New + → Web Service"
echo "  3. Connect GitHub repository"
echo "  4. Configure:"
echo "     - Name: ai-trading-backend"
echo "     - Language: Python"
echo "     - Root Directory: comprehensive_backend"
echo "     - Build: pip install -r requirements.txt"
echo "     - Start: uvicorn main:app --host 0.0.0.0 --port \$PORT"
echo "  5. Environment Variables:"
echo "     - BINANCE_MODE=testnet"
echo "     - BINANCE_TESTNET_API_KEY=$BINANCE_API_KEY"
echo "     - BINANCE_TESTNET_SECRET=$BINANCE_SECRET"
echo ""

read -p "Tekan Enter setelah backend deployed..."
read -p "Masukkan Backend URL (https://...): " BACKEND_URL

if [ -z "$BACKEND_URL" ]; then
    print_error "Backend URL tidak boleh kosong"
    exit 1
fi

# ============================================
# Step 8: Update Frontend Environment
# ============================================

print_header "🔄 Step 8: Updating Frontend Configuration"

print_info "Setting frontend environment variable..."

cd comprehensive_frontend

# Set environment variable in Vercel
vercel env add NEXT_PUBLIC_API_URL production <<< "$BACKEND_URL"

print_info "Redeploying frontend with new configuration..."
vercel --prod --yes

print_success "Frontend updated with backend URL"
cd ..

# ============================================
# Step 9: Test Deployment
# ============================================

print_header "✅ Step 9: Testing Deployment"

print_info "Testing backend..."
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/status")

if [ "$BACKEND_STATUS" = "200" ]; then
    print_success "Backend is responding"
else
    print_error "Backend test failed (HTTP $BACKEND_STATUS)"
fi

print_info "Testing frontend..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL")

if [ "$FRONTEND_STATUS" = "200" ]; then
    print_success "Frontend is responding"
else
    print_error "Frontend test failed (HTTP $FRONTEND_STATUS)"
fi

# ============================================
# Step 10: Summary
# ============================================

print_header "🎉 Deployment Complete!"

echo -e "${GREEN}Your AI Trading Platform is now live!${NC}"
echo ""
echo "📍 URLs:"
echo "  • Frontend: $FRONTEND_URL"
echo "  • Backend:  $BACKEND_URL"
echo ""
echo "🔑 Credentials:"
echo "  • Binance Mode: testnet"
echo "  • API Key: ${BINANCE_API_KEY:0:10}..."
echo ""
echo "📚 Next Steps:"
echo "  1. Open frontend: $FRONTEND_URL"
echo "  2. Check if prices are loading"
echo "  3. Verify Binance connection"
echo "  4. Execute a test trade"
echo ""
echo "📖 Documentation:"
echo "  • Quick Guide: DEPLOY_SEKARANG.md"
echo "  • Full Guide: PANDUAN_DEPLOY_INDONESIA.md"
echo "  • Troubleshooting: TROUBLESHOOTING.md"
echo ""

# Save deployment info
cat > DEPLOYMENT_INFO.txt << EOF
AI Trading Platform - Deployment Information
============================================

Deployment Date: $(date)

URLs:
  Frontend: $FRONTEND_URL
  Backend:  $BACKEND_URL

Configuration:
  Binance Mode: testnet
  API Key: ${BINANCE_API_KEY:0:10}...

Status: ✅ Deployed

Next Steps:
  1. Test the application
  2. Monitor logs
  3. Execute test trades
  4. Verify all features

Documentation:
  - DEPLOY_SEKARANG.md
  - PANDUAN_DEPLOY_INDONESIA.md
  - TROUBLESHOOTING.md
EOF

print_success "Deployment info saved to DEPLOYMENT_INFO.txt"

echo ""
echo -e "${GREEN}Happy Trading! 📈${NC}"
