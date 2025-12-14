#!/bin/bash

echo "🚀 Deploying Frontend to Vercel..."
echo "=================================="
echo ""

# Check Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

echo "📋 Instructions:"
echo ""
echo "1. Go to: https://vercel.com/idcuq-santosos-projects/ai-power-trade/settings"
echo "2. Find 'Root Directory' setting"
echo "3. Change from 'comprehensive_frontend' to '.' (dot) or leave empty"
echo "4. Click 'Save'"
echo ""
echo "Then run this command:"
echo ""
echo "  cd comprehensive_frontend && vercel --prod"
echo ""
echo "=================================="
echo ""
echo "Or, deploy using Git push (automatic):"
echo ""
echo "  git add ."
echo "  git commit -m 'Deploy to Vercel'"
echo "  git push origin main"
echo ""
echo "Vercel will auto-deploy from GitHub!"
echo ""
