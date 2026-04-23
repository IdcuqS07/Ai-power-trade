#!/bin/bash

# ============================================
# Polygon Amoy Migration Script
# ============================================
# Migrates AI Power Trade from BSC to Polygon Amoy
# Target: GitHub 0xCryptotech account
# ============================================

set -e  # Exit on error

echo "🔷 AI Power Trade - Polygon Amoy Migration"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="ai-power-trade-polygon"
GITHUB_USER="0xCryptotech"
GITHUB_REPO="https://github.com/${GITHUB_USER}/${PROJECT_NAME}.git"
TARGET_DIR="../${PROJECT_NAME}"

echo -e "${BLUE}Configuration:${NC}"
echo "  Project: ${PROJECT_NAME}"
echo "  GitHub: ${GITHUB_USER}"
echo "  Target: ${TARGET_DIR}"
echo ""

# Step 1: Clone current project
echo -e "${YELLOW}Step 1: Cloning current project...${NC}"
if [ -d "$TARGET_DIR" ]; then
    echo -e "${RED}Directory ${TARGET_DIR} already exists!${NC}"
    read -p "Delete and recreate? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf "$TARGET_DIR"
    else
        echo "Aborted."
        exit 1
    fi
fi

cp -r . "$TARGET_DIR"
cd "$TARGET_DIR"
echo -e "${GREEN}✓ Project cloned${NC}"
echo ""

# Step 2: Clean up
echo -e "${YELLOW}Step 2: Cleaning up...${NC}"
rm -rf .git
rm -rf node_modules
rm -rf comprehensive_frontend/node_modules
rm -rf comprehensive_frontend/.next
rm -rf .vercel
echo -e "${GREEN}✓ Cleaned up${NC}"
echo ""

# Step 3: Initialize new git repo
echo -e "${YELLOW}Step 3: Initializing new git repository...${NC}"
git init
git add .
git commit -m "Initial commit: Polygon Amoy migration from BSC

- Cloned from IdcuqS07/Ai-power-trade
- Preparing for Polygon Amoy Testnet migration
- Target network: Chain ID 80002
- 8 quality coins: BTC, ETH, BNB, SOL, XRP, ADA, MATIC, LINK"
echo -e "${GREEN}✓ Git initialized${NC}"
echo ""

# Step 4: Create polygon-specific files
echo -e "${YELLOW}Step 4: Creating Polygon-specific configuration...${NC}"

# Create network config
cat > comprehensive_frontend/config/networks.js << 'EOF'
// Polygon Amoy Network Configuration
export const NETWORKS = {
  polygon_amoy: {
    chainId: '0x13882', // 80002 in hex
    chainName: 'Polygon Amoy Testnet',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18
    },
    rpcUrls: [
      'https://rpc-amoy.polygon.technology/',
      'https://polygon-amoy.drpc.org',
      'https://polygon-amoy-bor-rpc.publicnode.com'
    ],
    blockExplorerUrls: ['https://amoy.polygonscan.com/']
  }
};

export const CURRENT_NETWORK = NETWORKS.polygon_amoy;
export const CHAIN_ID = 80002;
export const NETWORK_NAME = 'Polygon Amoy';
export const EXPLORER_URL = 'https://amoy.polygonscan.com';
export const FAUCET_URL = 'https://faucet.polygon.technology/';
EOF

# Create Polygon deploy script
cat > blockchain/deploy_polygon.py << 'EOF'
#!/usr/bin/env python3
"""
Deploy AITradeUSDT to Polygon Amoy Testnet
"""
from web3 import Web3
import json
import os
from dotenv import load_dotenv
from pathlib import Path

load_dotenv()

# Polygon Amoy Configuration
POLYGON_RPC = os.getenv('POLYGON_RPC_URL', 'https://rpc-amoy.polygon.technology/')
CHAIN_ID = 80002
PRIVATE_KEY = os.getenv('PRIVATE_KEY')

if not PRIVATE_KEY:
    print("❌ Error: PRIVATE_KEY not found in .env")
    exit(1)

# Connect to Polygon Amoy
w3 = Web3(Web3.HTTPProvider(POLYGON_RPC))

if not w3.is_connected():
    print("❌ Error: Cannot connect to Polygon Amoy RPC")
    exit(1)

print("✅ Connected to Polygon Amoy Testnet")
print(f"   Chain ID: {w3.eth.chain_id}")
print(f"   Latest Block: {w3.eth.block_number}")

# Get account
account = w3.eth.account.from_key(PRIVATE_KEY)
print(f"\n📍 Deploying from: {account.address}")

# Check balance
balance = w3.eth.get_balance(account.address)
balance_matic = w3.from_wei(balance, 'ether')
print(f"   Balance: {balance_matic} MATIC")

if balance_matic < 0.1:
    print("\n⚠️  Warning: Low MATIC balance!")
    print("   Get MATIC from: https://faucet.polygon.technology/")
    exit(1)

# Load contract
contract_path = Path(__file__).parent / 'AITradeUSDT.sol'
with open(contract_path, 'r') as f:
    contract_source = f.read()

print("\n🔨 Compiling contract...")
# Note: You'll need to compile with solc or use Remix
print("   Please compile AITradeUSDT.sol and paste ABI and bytecode")
print("   Or use Remix IDE: https://remix.ethereum.org/")

print("\n📝 Next steps:")
print("   1. Compile contract in Remix")
print("   2. Deploy to Polygon Amoy")
print("   3. Verify on PolygonScan")
print("   4. Update CONTRACT_ADDRESS in .env")
EOF

chmod +x blockchain/deploy_polygon.py

# Update .env.example
cat > comprehensive_backend/.env.polygon.example << 'EOF'
# Polygon Amoy Configuration
BLOCKCHAIN_NETWORK=polygon_amoy
POLYGON_RPC_URL=https://rpc-amoy.polygon.technology/
POLYGON_CHAIN_ID=80002
CONTRACT_ADDRESS=your_polygon_contract_address_here
PRIVATE_KEY=your_private_key_here

# Binance API (keep existing)
BINANCE_API_KEY=your_binance_api_key
BINANCE_API_SECRET=your_binance_api_secret

# WeeX API (keep existing)
WEEX_API_KEY=your_weex_api_key
WEEX_API_SECRET=your_weex_api_secret

# Database
DATABASE_URL=sqlite:///./trading.db

# JWT
JWT_SECRET_KEY=your_jwt_secret_key_here
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24
EOF

echo -e "${GREEN}✓ Polygon configuration created${NC}"
echo ""

# Step 5: Update README
echo -e "${YELLOW}Step 5: Updating README...${NC}"
cat > README_POLYGON.md << 'EOF'
# 🔷 AI Power Trade - Polygon Amoy Edition

AI-Powered Trading Platform on Polygon Amoy Testnet

## 🌟 Why Polygon?

- **10x Cheaper Gas**: ~$0.001 vs BSC ~$0.01
- **Faster Transactions**: ~2 seconds block time
- **Larger Ecosystem**: More DeFi & NFT projects
- **Better Legitimacy**: More recognized in crypto space

## 🚀 Quick Start

### 1. Get Polygon Amoy MATIC
```bash
# Visit faucet
https://faucet.polygon.technology/

# Select: Amoy Testnet
# Paste your wallet address
# Receive: 0.5 MATIC
```

### 2. Add Polygon Amoy to MetaMask
```
Network Name: Polygon Amoy Testnet
RPC URL: https://rpc-amoy.polygon.technology/
Chain ID: 80002
Currency: MATIC
Explorer: https://amoy.polygonscan.com/
```

### 3. Deploy Smart Contract
```bash
cd blockchain
python deploy_polygon.py
```

### 4. Configure Backend
```bash
cd comprehensive_backend
cp .env.polygon.example .env
# Edit .env with your contract address and private key
```

### 5. Run Backend
```bash
cd comprehensive_backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### 6. Run Frontend
```bash
cd comprehensive_frontend
npm install
npm run dev
```

## 📊 Features

- ✅ 8 Quality Coins: BTC, ETH, BNB, SOL, XRP, ADA, MATIC, LINK
- ✅ AI-Powered Trading Signals
- ✅ Smart Contract Integration (Polygon)
- ✅ Real-time Binance Data
- ✅ ML Price Predictions
- ✅ AI Explainability Dashboard
- ✅ Automated Settlement
- ✅ User Wallet & Profile

## 🔗 Links

- **Frontend**: TBD (deploy to Vercel)
- **Backend**: TBD (deploy to VPS/Render)
- **Contract**: TBD (deploy to Polygon Amoy)
- **Explorer**: https://amoy.polygonscan.com/

## 📚 Documentation

- [Migration Guide](POLYGON_MIGRATION_GUIDE.md)
- [Deployment Guide](DEPLOYMENT_GUIDE.md)
- [API Documentation](API_DOCUMENTATION.md)

## 🛠️ Tech Stack

- **Blockchain**: Polygon Amoy Testnet
- **Smart Contract**: Solidity 0.8.19
- **Backend**: Python FastAPI
- **Frontend**: Next.js + React
- **AI/ML**: scikit-learn, TensorFlow
- **Data**: Binance API, WeeX API

## 📝 Migration from BSC

This is the Polygon version of the original BSC project:
- Original: https://github.com/IdcuqS07/Ai-power-trade
- Polygon: https://github.com/0xCryptotech/ai-power-trade-polygon

## 🤝 Contributing

This is an experimental R&D project. Feel free to:
- Report issues
- Suggest improvements
- Submit pull requests

## 📄 License

MIT License

## 🙏 Acknowledgments

- Original BSC version by IdcuqS07
- Polygon team for excellent testnet infrastructure
- Binance for market data API
EOF

echo -e "${GREEN}✓ README updated${NC}"
echo ""

# Step 6: Create deployment script
echo -e "${YELLOW}Step 6: Creating deployment script...${NC}"
cat > deploy-polygon-vercel.sh << 'EOF'
#!/bin/bash

echo "🔷 Deploying to Vercel (Polygon Edition)"
echo "========================================"

cd comprehensive_frontend

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build
echo "🔨 Building..."
npm run build

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

# Set alias
echo "🔗 Setting custom domain..."
vercel alias set ai-power-trade-polygon

echo ""
echo "✅ Deployment complete!"
echo "   URL: https://ai-power-trade-polygon.vercel.app"
EOF

chmod +x deploy-polygon-vercel.sh

echo -e "${GREEN}✓ Deployment script created${NC}"
echo ""

# Step 7: Summary
echo -e "${GREEN}=========================================="
echo "✅ Migration Setup Complete!"
echo "==========================================${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo ""
echo "1. Create GitHub repository:"
echo "   - Go to: https://github.com/new"
echo "   - Owner: 0xCryptotech"
echo "   - Name: ai-power-trade-polygon"
echo "   - Description: AI-Powered Trading Platform on Polygon Amoy"
echo ""
echo "2. Push to GitHub:"
echo "   cd ${TARGET_DIR}"
echo "   git remote add origin ${GITHUB_REPO}"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "3. Get Polygon Amoy MATIC:"
echo "   https://faucet.polygon.technology/"
echo ""
echo "4. Deploy Smart Contract:"
echo "   cd blockchain"
echo "   python deploy_polygon.py"
echo ""
echo "5. Update configuration:"
echo "   - Edit comprehensive_backend/.env"
echo "   - Add CONTRACT_ADDRESS"
echo "   - Add PRIVATE_KEY"
echo ""
echo "6. Deploy to Vercel:"
echo "   ./deploy-polygon-vercel.sh"
echo ""
echo -e "${YELLOW}📁 Project location: ${TARGET_DIR}${NC}"
echo ""
echo -e "${GREEN}Happy coding on Polygon! 🔷${NC}"
