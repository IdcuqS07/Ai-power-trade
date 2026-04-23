#!/bin/bash

# Deploy AI Explainability Feature to VPS
# This script updates the backend on the VPS with the new AI explanation endpoint

echo "🚀 Deploying AI Explainability Feature to VPS..."
echo "================================================"

# VPS details
VPS_HOST="143.198.205.88"
VPS_USER="root"
VPS_PATH="/opt/Ai-power-trade/comprehensive_backend"

echo ""
echo "📡 Connecting to VPS: $VPS_HOST"
echo ""

# SSH into VPS and update
ssh ${VPS_USER}@${VPS_HOST} << 'ENDSSH'
    echo "📂 Navigating to project directory..."
    cd /opt/Ai-power-trade
    
    echo "📥 Pulling latest changes from GitHub..."
    git pull origin main
    
    echo "🔄 Restarting backend service..."
    sudo systemctl restart ai-trading-backend
    
    echo "⏳ Waiting for service to start..."
    sleep 3
    
    echo "✅ Checking service status..."
    sudo systemctl status ai-trading-backend --no-pager | head -n 10
    
    echo ""
    echo "🧪 Testing new AI Explainer endpoint..."
    curl -s https://ai-powertrade.duckdns.org/api/ai/explain/BTC | head -c 200
    echo ""
    echo ""
    
    echo "✅ Deployment complete!"
    echo ""
    echo "🔗 Test the new feature:"
    echo "   Frontend: https://ai-power-trade.vercel.app/ai-explainer"
    echo "   API: https://ai-powertrade.duckdns.org/api/ai/explain/BTC"
ENDSSH

echo ""
echo "================================================"
echo "✅ AI Explainability Feature Deployed!"
echo ""
echo "📝 Next Steps:"
echo "   1. Test frontend: https://ai-power-trade.vercel.app/ai-explainer"
echo "   2. Test API: https://ai-powertrade.duckdns.org/api/ai/explain/BTC"
echo "   3. Review documentation: AI_EXPLAINABILITY_FEATURE.md"
echo ""
echo "🎯 For DoraHacks Demo:"
echo "   - Show the AI Explainer button on dashboard"
echo "   - Walk through BTC analysis"
echo "   - Highlight indicator explanations"
echo "   - Show ML feature importance"
echo "   - Emphasize transparency = Web3 philosophy"
echo ""
echo "Good luck with DoraHacks! 🏆"
