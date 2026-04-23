#!/bin/bash
# Simple fix for backend - kill all and restart one

echo "🔧 Fixing Backend..."

ssh root@143.198.205.88 << 'EOF'
# Kill ALL uvicorn
pkill -9 -f uvicorn
sleep 3

# Go to backend directory
cd /opt/Ai-power-trade/comprehensive_backend

# Clear cache
find . -name "*.pyc" -delete 2>/dev/null
find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null

# Start ONE instance
nohup venv/bin/python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 > backend.log 2>&1 &

# Wait and check
sleep 5
if pgrep -f "uvicorn" > /dev/null; then
    echo "✅ Backend started"
    pgrep -f "uvicorn" | wc -l | xargs echo "Running processes:"
else
    echo "❌ Failed to start"
    tail -20 backend.log
fi
EOF

echo ""
echo "Testing API in 3 seconds..."
sleep 3

curl -s "http://143.198.205.88:8000/api/market/prices" | python3 -c "import sys, json; data=json.load(sys.stdin); print('Coins:', ', '.join(sorted(data['data'].keys())))"

echo ""
echo "Expected: ADA, BNB, BTC, ETH, LINK, MATIC, SOL, XRP"
