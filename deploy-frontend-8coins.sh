#!/bin/bash
# Deploy frontend with 8 coins to Vercel

echo "🚀 Deploying Frontend with 8 Coins to Vercel..."
echo ""

cd comprehensive_frontend

echo "📦 Building and deploying..."
vercel --prod --yes

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "1. Wait 30 seconds for deployment to propagate"
echo "2. Open new incognito window"
echo "3. Visit: https://comprehensivefrontend-bx8bxvrcb-idcuq-santosos-projects.vercel.app/ai-explainer"
echo "4. Verify coins: BTC, ETH, BNB, SOL, XRP, ADA, MATIC, LINK"
echo "5. DOGE should be gone!"
echo ""
