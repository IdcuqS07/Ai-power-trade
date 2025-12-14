#!/bin/bash
# Script untuk update backend di VPS
# Usage: ./update-backend-vps.sh

VPS_HOST="root@143.198.205.88"
VPS_PORT="8000"
VPS_BACKEND_PATH="/opt/Ai-power-trade/comprehensive_backend"

echo "🚀 Starting VPS Backend Update..."
echo ""

# Step 1: Upload modified main.py
echo "📤 Step 1: Uploading modified main.py to VPS..."
scp comprehensive_backend/main.py ${VPS_HOST}:${VPS_BACKEND_PATH}/main.py

if [ $? -eq 0 ]; then
    echo "✅ File uploaded successfully"
else
    echo "❌ Upload failed. Please check SSH connection."
    exit 1
fi

echo ""

# Step 2: Restart backend service
echo "🔄 Step 2: Restarting backend service..."
ssh ${VPS_HOST} << ENDSSH
    # Kill old process
    echo "Stopping old backend process..."
    pkill -f "uvicorn main:app"
    sleep 2
    
    # Start new process
    echo "Starting new backend process..."
    cd ${VPS_BACKEND_PATH}
    nohup venv/bin/python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 > backend.log 2>&1 &
    sleep 3
    
    # Check if running
    if pgrep -f "uvicorn main:app" > /dev/null; then
        echo "✅ Backend started successfully"
    else
        echo "❌ Backend failed to start. Check logs:"
        tail -20 ${VPS_BACKEND_PATH}/backend.log
        exit 1
    fi
ENDSSH

if [ $? -eq 0 ]; then
    echo "✅ Backend restarted successfully"
else
    echo "❌ Restart failed"
    exit 1
fi

echo ""

# Step 3: Test the endpoint
echo "🧪 Step 3: Testing endpoints..."
echo ""

echo "Testing BTC (default):"
curl -s "http://143.198.205.88:${VPS_PORT}/api/dashboard" | python3 -c "import sys, json; data=json.load(sys.stdin); print(f\"Signal: {data['data']['current_signal']['signal']}, Confidence: {data['data']['current_signal']['confidence']}\")" 2>/dev/null || echo "❌ BTC test failed"

echo ""
echo "Testing ETH:"
curl -s "http://143.198.205.88:${VPS_PORT}/api/dashboard?symbol=ETH" | python3 -c "import sys, json; data=json.load(sys.stdin); print(f\"Signal: {data['data']['current_signal']['signal']}, Confidence: {data['data']['current_signal']['confidence']}\")" 2>/dev/null || echo "❌ ETH test failed"

echo ""
echo "Testing SOL:"
curl -s "http://143.198.205.88:${VPS_PORT}/api/dashboard?symbol=SOL" | python3 -c "import sys, json; data=json.load(sys.stdin); print(f\"Signal: {data['data']['current_signal']['signal']}, Confidence: {data['data']['current_signal']['confidence']}\")" 2>/dev/null || echo "❌ SOL test failed"

echo ""
echo "✅ VPS Backend Update Complete!"
echo ""
echo "📝 Next steps:"
echo "1. Test frontend: https://comprehensivefrontend-k48wxhp76-idcuq-santosos-projects.vercel.app"
echo "2. Click different coins in coin selector"
echo "3. AI Trading Signal should update for each coin"
echo ""
