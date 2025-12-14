#!/bin/bash

echo "🔧 Fixing VPS Backend..."
echo "================================"

# SSH ke VPS dan fix backend
ssh root@143.198.205.88 << 'ENDSSH'
    echo "📍 Connected to VPS"
    
    echo "🛑 Stopping all uvicorn processes..."
    pkill -9 -f "uvicorn main:app" || true
    sleep 2
    
    echo "📂 Navigating to project..."
    cd /opt/Ai-power-trade
    
    echo "📥 Pulling latest code..."
    git stash
    git pull origin main
    
    echo "🔄 Restarting backend service..."
    sudo systemctl stop ai-trading-backend
    sleep 2
    sudo systemctl start ai-trading-backend
    sleep 5
    
    echo "✅ Checking service status..."
    sudo systemctl status ai-trading-backend --no-pager | head -15
    
    echo ""
    echo "🧪 Testing AI Explainer endpoint..."
    curl -s http://localhost:8000/api/ai/explain/BTC | head -c 300
    echo ""
    
    echo ""
    echo "✅ VPS Backend Fix Complete!"
ENDSSH

echo ""
echo "================================"
echo "🧪 Testing from outside..."
sleep 2
curl -s https://ai-powertrade.duckdns.org/api/ai/explain/BTC | head -c 300
echo ""
echo ""
echo "✅ Done! Check if you see JSON data above."
