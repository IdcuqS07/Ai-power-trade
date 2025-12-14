#!/bin/bash
# Deploy to custom domain: ai-power-trade.vercel.app

echo "🚀 Deploying to ai-power-trade.vercel.app..."
echo ""

cd comprehensive_frontend

echo "📦 Step 1: Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Build successful"
echo ""

echo "🌐 Step 2: Deploying to Vercel..."
# Deploy to production
vercel --prod --yes

if [ $? -ne 0 ]; then
    echo "❌ Deployment failed"
    exit 1
fi

echo ""
echo "✅ Deployment successful!"
echo ""
echo "📝 Next steps:"
echo "1. Go to Vercel Dashboard: https://vercel.com/idcuq-santosos-projects/comprehensive_frontend"
echo "2. Click 'Settings' → 'Domains'"
echo "3. Add custom domain: ai-power-trade.vercel.app"
echo "4. Or use Vercel CLI: vercel alias <deployment-url> ai-power-trade.vercel.app"
echo ""
echo "🔗 Current production URL:"
vercel ls --cwd . | grep "Production" | head -1 | awk '{print $2}'
echo ""
