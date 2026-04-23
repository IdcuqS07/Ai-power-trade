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
