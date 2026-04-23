#!/bin/bash

# 🚀 Super Fast Polygon Migration Script
# Migrasi AI Power Trade ke Polygon Amoy dalam 2 menit!

set -e  # Exit on error

echo "🔷 ============================================"
echo "🔷 SUPER FAST POLYGON MIGRATION"
echo "🔷 ============================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
CURRENT_DIR=$(pwd)
NEW_DIR="../ai-power-trade-polygon"
GITHUB_USER="0xCryptotech"
REPO_NAME="ai-power-trade-polygon"

echo -e "${BLUE}📋 Configuration:${NC}"
echo "   Current: $CURRENT_DIR"
echo "   New Dir: $NEW_DIR"
echo "   GitHub: $GITHUB_USER/$REPO_NAME"
echo ""

# Step 1: Clone project
echo -e "${YELLOW}[1/7]${NC} 📦 Cloning project..."
if [ -d "$NEW_DIR" ]; then
    echo "   ⚠️  Directory exists, removing..."
    rm -rf "$NEW_DIR"
fi

cp -r . "$NEW_DIR"
cd "$NEW_DIR"
echo -e "${GREEN}   ✅ Project cloned${NC}"

# Step 2: Clean up
echo -e "${YELLOW}[2/7]${NC} 🧹 Cleaning up..."
rm -rf .git
rm -rf node_modules
rm -rf comprehensive_frontend/node_modules
rm -rf comprehensive_frontend/.next
rm -rf comprehensive_backend/__pycache__
rm -rf .vercel
echo -e "${GREEN}   ✅ Cleaned${NC}"

# Step 3: Update configurations
echo -e "${YELLOW}[3/7]${NC} ⚙️  Updating configurations..."

# Create config directory if not exists
mkdir -p comprehensive_frontend/config

# Update frontend network config
cat > comprehensive_frontend/config/networks.js << 'EOF'
// Polygon Amoy Testnet Configuration
export const NETWORKS = {
  polygon_amoy: {
    chainId: '0x13882', // 80002 in hex
    chainIdDecimal: 80002,
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
    blockExplorerUrls: ['https://amoy.polygonscan.com/'],
    faucetUrl: 'https://faucet.polygon.technology/'
  }
};

export const CURRENT_NETWORK = NETWORKS.polygon_amoy;
export const CHAIN_ID = 80002;
export const NETWORK_NAME = "Polygon Amoy";
export const EXPLORER_URL = "https://amoy.polygonscan.com";
export const FAUCET_URL = "https://faucet.polygon.technology/";
EOF

# Create backend directory if not exists
mkdir -p comprehensive_backend

# Create backend .env template
cat > comprehensive_backend/.env.polygon << 'EOF'
# Polygon Amoy Configuration
BLOCKCHAIN_NETWORK=polygon_amoy
POLYGON_RPC_URL=https://rpc-amoy.polygon.technology/
POLYGON_CHAIN_ID=80002

# Contract Address (update after deployment)
CONTRACT_ADDRESS=YOUR_CONTRACT_ADDRESS_HERE

# Wallet Private Key (update with your key)
PRIVATE_KEY=YOUR_PRIVATE_KEY_HERE

# Binance API (keep existing)
BINANCE_API_KEY=your_binance_api_key
BINANCE_API_SECRET=your_binance_api_secret

# WeeX API (keep existing)
WEEX_API_KEY=your_weex_api_key
WEEX_API_SECRET=your_weex_api_secret

# Server
PORT=8000
HOST=0.0.0.0
EOF

echo -e "${GREEN}   ✅ Configurations updated${NC}"

# Step 4: Create deployment scripts
echo -e "${YELLOW}[4/7]${NC} 📝 Creating deployment scripts..."

# Create blockchain directory if not exists
mkdir -p blockchain

# Contract deployment script
cat > blockchain/deploy_polygon.py << 'EOF'
#!/usr/bin/env python3
"""
Deploy AITradeUSDT to Polygon Amoy Testnet
"""
from web3 import Web3
import json
import os
from dotenv import load_dotenv

load_dotenv()

# Polygon Amoy Configuration
POLYGON_RPC = os.getenv('POLYGON_RPC_URL', 'https://rpc-amoy.polygon.technology/')
CHAIN_ID = int(os.getenv('POLYGON_CHAIN_ID', '80002'))
PRIVATE_KEY = os.getenv('PRIVATE_KEY')

if not PRIVATE_KEY or PRIVATE_KEY == 'YOUR_PRIVATE_KEY_HERE':
    print("❌ Error: Please set PRIVATE_KEY in .env file")
    exit(1)

# Connect to Polygon
w3 = Web3(Web3.HTTPProvider(POLYGON_RPC))

if not w3.is_connected():
    print("❌ Error: Cannot connect to Polygon Amoy")
    exit(1)

print(f"✅ Connected to Polygon Amoy")
print(f"   Chain ID: {w3.eth.chain_id}")

# Get account
account = w3.eth.account.from_key(PRIVATE_KEY)
print(f"   Deployer: {account.address}")

# Check balance
balance = w3.eth.get_balance(account.address)
balance_matic = w3.from_wei(balance, 'ether')
print(f"   Balance: {balance_matic} MATIC")

if balance_matic < 0.1:
    print("⚠️  Warning: Low MATIC balance. Get more from faucet:")
    print("   https://faucet.polygon.technology/")

# Load contract
with open('AITradeUSDT.sol', 'r') as f:
    contract_source = f.read()

print("\n📝 Contract loaded. Ready to deploy!")
print("\n⚠️  Manual deployment recommended via Remix:")
print("   1. Go to https://remix.ethereum.org/")
print("   2. Upload AITradeUSDT.sol")
print("   3. Compile with Solidity 0.8.19")
print("   4. Deploy to Polygon Amoy (Chain ID: 80002)")
print("   5. Copy contract address")
print("   6. Update .env: CONTRACT_ADDRESS=0x...")
print("\n🔗 Polygon Amoy Explorer: https://amoy.polygonscan.com/")
EOF

chmod +x blockchain/deploy_polygon.py

# Quick deploy script
cat > quick-deploy-polygon.sh << 'EOF'
#!/bin/bash

echo "🚀 Quick Deploy to Polygon Amoy"
echo ""

# Check contract address
if grep -q "YOUR_CONTRACT_ADDRESS_HERE" comprehensive_backend/.env.polygon; then
    echo "⚠️  Step 1: Deploy Smart Contract"
    echo "   1. Go to https://remix.ethereum.org/"
    echo "   2. Upload blockchain/AITradeUSDT.sol"
    echo "   3. Compile (Solidity 0.8.19)"
    echo "   4. Deploy to Polygon Amoy (80002)"
    echo "   5. Copy contract address"
    echo "   6. Update comprehensive_backend/.env.polygon"
    echo ""
    echo "   Then run this script again!"
    exit 1
fi

echo "✅ Contract address configured"
echo ""

# Deploy frontend
echo "📦 Deploying frontend to Vercel..."
cd comprehensive_frontend
npm install
vercel --prod

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🔗 Next steps:"
echo "   1. Test frontend URL"
echo "   2. Connect wallet to Polygon Amoy"
echo "   3. Get MATIC: https://faucet.polygon.technology/"
echo "   4. Test trading features"
EOF

chmod +x quick-deploy-polygon.sh

echo -e "${GREEN}   ✅ Deployment scripts created${NC}"

# Step 5: Initialize git
echo -e "${YELLOW}[5/7]${NC} 🔧 Initializing git..."
git init
git add .
git commit -m "Initial commit: Polygon Amoy migration

- Migrated from BSC Testnet to Polygon Amoy
- Updated network configurations
- Chain ID: 80002
- 10x cheaper gas fees
- 1.5x faster transactions
"
echo -e "${GREEN}   ✅ Git initialized${NC}"

# Step 6: Create GitHub repo and push
echo -e "${YELLOW}[6/7]${NC} 🌐 Creating GitHub repository..."

# Switch to 0xCryptotech account
gh auth switch --user $GITHUB_USER

# Create repo
gh repo create $GITHUB_USER/$REPO_NAME \
    --public \
    --description "AI-Powered Trading Platform on Polygon Amoy Testnet - 10x cheaper gas, 1.5x faster transactions" \
    --source=. \
    --remote=origin \
    --push

echo -e "${GREEN}   ✅ Repository created and pushed!${NC}"

# Step 7: Create README
echo -e "${YELLOW}[7/7]${NC} 📄 Creating README..."

cat > README_POLYGON.md << 'EOF'
# 🔷 AI Power Trade - Polygon Amoy

AI-Powered Trading Platform on Polygon Amoy Testnet

## 🚀 Quick Info

- **Network**: Polygon Amoy Testnet (Chain ID: 80002)
- **Gas Fees**: ~$0.001 per transaction (10x cheaper than BSC)
- **Speed**: ~2 seconds per block (1.5x faster than BSC)
- **Coins**: 8 major cryptocurrencies with AI predictions

## 🔗 Links

- **Frontend**: [Deploying soon]
- **Contract**: [Deploy first]
- **Explorer**: https://amoy.polygonscan.com/
- **Faucet**: https://faucet.polygon.technology/

## 📋 Setup

### 1. Get MATIC
```bash
# Visit faucet
https://faucet.polygon.technology/
# Request 0.5 MATIC
```

### 2. Add Network to MetaMask
```
Network Name: Polygon Amoy Testnet
RPC URL: https://rpc-amoy.polygon.technology/
Chain ID: 80002
Currency: MATIC
Explorer: https://amoy.polygonscan.com/
```

### 3. Deploy Contract
```bash
# Go to Remix IDE
https://remix.ethereum.org/

# Upload blockchain/AITradeUSDT.sol
# Compile with Solidity 0.8.19
# Deploy to Polygon Amoy (80002)
# Copy contract address
```

### 4. Configure Backend
```bash
cd comprehensive_backend
cp .env.polygon .env
# Edit .env and add:
# - CONTRACT_ADDRESS (from step 3)
# - PRIVATE_KEY (from MetaMask)
```

### 5. Deploy Frontend
```bash
./quick-deploy-polygon.sh
```

## 🎯 Features

- ✅ 8 Major Coins (BTC, ETH, BNB, SOL, XRP, ADA, DOGE, MATIC)
- ✅ Real-time Price Data (Binance + WeeX)
- ✅ AI-Powered Predictions
- ✅ Smart Contract Trading
- ✅ Auto Settlement Service
- ✅ AI Explainability Dashboard
- ✅ Performance Analytics

## 📊 Comparison: BSC vs Polygon

| Feature | BSC Testnet | Polygon Amoy |
|---------|-------------|--------------|
| Gas Fee | ~$0.01 | ~$0.001 |
| Block Time | ~3s | ~2s |
| Ecosystem | Smaller | Larger |
| Recognition | Lower | Higher |

## 🛠️ Tech Stack

- **Frontend**: Next.js, React, TailwindCSS
- **Backend**: FastAPI, Python
- **Blockchain**: Solidity, Web3.js
- **Network**: Polygon Amoy Testnet
- **APIs**: Binance, WeeX

## 📚 Documentation

- [Polygon Docs](https://docs.polygon.technology/)
- [Amoy Explorer](https://amoy.polygonscan.com/)
- [Faucet](https://faucet.polygon.technology/)

## 🤝 Contributing

This is an experimental migration from BSC to Polygon. Feedback welcome!

## 📄 License

MIT

---

**Status**: 🚧 In Development
**Network**: Polygon Amoy Testnet
**Gas Savings**: 10x cheaper than BSC
**Speed**: 1.5x faster than BSC
EOF

git add README_POLYGON.md
git commit -m "docs: Add Polygon-specific README"
git push origin main

echo -e "${GREEN}   ✅ README created${NC}"

# Final summary
echo ""
echo -e "${GREEN}🎉 ============================================${NC}"
echo -e "${GREEN}🎉 MIGRATION COMPLETE!${NC}"
echo -e "${GREEN}🎉 ============================================${NC}"
echo ""
echo -e "${BLUE}📦 Repository:${NC}"
echo "   https://github.com/$GITHUB_USER/$REPO_NAME"
echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo "   1. Get MATIC from faucet:"
echo "      https://faucet.polygon.technology/"
echo ""
echo "   2. Deploy smart contract:"
echo "      - Go to https://remix.ethereum.org/"
echo "      - Upload blockchain/AITradeUSDT.sol"
echo "      - Deploy to Polygon Amoy (80002)"
echo "      - Copy contract address"
echo ""
echo "   3. Update backend config:"
echo "      cd comprehensive_backend"
echo "      cp .env.polygon .env"
echo "      nano .env  # Add CONTRACT_ADDRESS and PRIVATE_KEY"
echo ""
echo "   4. Deploy frontend:"
echo "      ./quick-deploy-polygon.sh"
echo ""
echo -e "${BLUE}🔗 Resources:${NC}"
echo "   Explorer: https://amoy.polygonscan.com/"
echo "   Faucet: https://faucet.polygon.technology/"
echo "   Remix: https://remix.ethereum.org/"
echo ""
echo -e "${GREEN}✨ Total time: ~2 minutes!${NC}"
echo ""
