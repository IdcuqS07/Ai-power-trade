#!/bin/bash
# Deploy to ai-power-trade.vercel.app

echo "🚀 Deploying AI Power Trade Platform..."
echo ""

cd comprehensive_frontend

echo "📦 Building..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo ""
echo "🌐 Deploying to Vercel Production..."
vercel --prod --yes > /tmp/vercel_deploy.log 2>&1

if [ $? -ne 0 ]; then
    echo "❌ Deployment failed"
    cat /tmp/vercel_deploy.log
    exit 1
fi

# Extract deployment URL
DEPLOYMENT_URL=$(cat /tmp/vercel_deploy.log | grep -o 'https://[^ ]*vercel.app' | head -1)

echo ""
echo "✅ Deployment successful!"
echo "📍 Deployment URL: $DEPLOYMENT_URL"
echo ""

# Try to set alias automatically
echo "🔗 Setting alias to ai-power-trade.vercel.app..."
vercel alias set "$DEPLOYMENT_URL" ai-power-trade.vercel.app --cwd . --yes 2>&1

if [ $? -eq 0 ]; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ SUCCESS! Platform is now live at:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "🌐 https://ai-power-trade.vercel.app"
    echo ""
    echo "📱 Pages:"
    echo "  • Dashboard: https://ai-power-trade.vercel.app"
    echo "  • AI Explainer: https://ai-power-trade.vercel.app/ai-explainer"
    echo "  • Wallet: https://ai-power-trade.vercel.app/wallet"
    echo "  • Trades: https://ai-power-trade.vercel.app/trades"
    echo "  • Analytics: https://ai-power-trade.vercel.app/analytics"
    echo ""
    echo "✨ Features:"
    echo "  ✓ 8 Quality Coins (BTC, ETH, BNB, SOL, XRP, ADA, MATIC, LINK)"
    echo "  ✓ 3-10x Faster Loading (with cache)"
    echo "  ✓ AI Explainability Dashboard"
    echo "  ✓ Real-time Trading Signals"
    echo ""
else
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "⚠️  Alias setup requires manual configuration"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Please choose one of these options:"
    echo ""
    echo "Option 1: Rename Project (Easiest)"
    echo "  1. Go to: https://vercel.com/idcuq-santosos-projects/comprehensive_frontend/settings"
    echo "  2. Scroll to 'Project Name'"
    echo "  3. Change to: ai-power-trade"
    echo "  4. Save → Your URL will be: https://ai-power-trade.vercel.app"
    echo ""
    echo "Option 2: Manual Alias Command"
    echo "  vercel alias set $DEPLOYMENT_URL ai-power-trade.vercel.app"
    echo ""
    echo "Option 3: Vercel Dashboard"
    echo "  1. Go to: https://vercel.com/idcuq-santosos-projects/comprehensive_frontend"
    echo "  2. Settings → Domains → Add: ai-power-trade.vercel.app"
    echo ""
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
