#!/bin/bash

echo "🚀 Deploying to Vercel..."
echo "================================"

# Navigate to frontend directory
cd comprehensive_frontend || exit 1

echo "📂 Current directory: $(pwd)"
echo ""

# Deploy to production
echo "🔨 Running vercel --prod..."
vercel --prod

echo ""
echo "================================"
echo "✅ Deployment command executed!"
echo ""
echo "Check output above for deployment URL"
echo "Or visit: https://vercel.com/dashboard"
