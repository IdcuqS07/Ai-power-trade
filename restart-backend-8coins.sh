#!/bin/bash
# Force restart backend with 8 coins - Clear all caches

VPS_HOST="root@143.198.205.88"
VPS_BACKEND_PATH="/opt/Ai-power-trade/comprehensive_backend"

echo "🔥 Force Restarting Backend with 8 Coins..."
echo ""

# Upload the correct main.py
echo "📤 Step 1: Uploading main.py..."
scp comprehensive_backend/main.py ${VPS_HOST}:${VPS_BACKEND_PATH}/main.py

if [ $? -ne 0 ]; then
    echo "❌ Upload failed. Check SSH connection."
    exit 1
fi

echo "✅ File uploaded"
echo ""

# Force restart with cache clearing
echo "🔄 Step 2: Force restart (clearing caches)..."
ssh ${VPS_HOST} << 'ENDSSH'
    cd /opt/Ai-power-trade/comprehensive_backend
    
    # Clear Python cache
    echo "Clearing Python bytecode cache..."
    find . -name "*.pyc" -delete
    find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null
    
    # Kill ALL uvicorn processes
    echo "Killing all backend processes..."
    pkill -9 -f "uvicorn"
    sleep 3
    
    # Start fresh
    echo "Starting backend..."
    nohup venv/bin/python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload > backend.log 2>&1 &
    sleep 5
    
    # Verify
    if pgrep -f "uvicorn" > /dev/null; then
        echo "✅ Backend running"
    else
        echo "❌ Failed to start. Last 30 lines of log:"
        tail -30 backend.log
        exit 1
    fi
ENDSSH

if [ $? -ne 0 ]; then
    echo "❌ Restart failed"
    exit 1
fi

echo ""
echo "🧪 Step 3: Testing API (wait 5s for cache to clear)..."
sleep 5

# Test prices endpoint
echo ""
echo "Available coins from API:"
curl -s "http://143.198.205.88:8000/api/market/prices" | python3 -c "import sys, json; data=json.load(sys.stdin); print('Coins:', ', '.join(sorted(data['data'].keys())))" 2>/dev/null

echo ""
echo "Expected: ADA, BNB, BTC, ETH, LINK, MATIC, SOL, XRP"
echo ""

echo "✅ Backend restarted!"
echo ""
echo "📝 Next steps:"
echo "1. Hard refresh browser (Cmd+Shift+R)"
echo "2. Check AI Explainer: https://comprehensivefrontend-bx8bxvrcb-idcuq-santosos-projects.vercel.app/ai-explainer"
echo "3. DOGE should be gone, MATIC and LINK should appear"
echo ""
