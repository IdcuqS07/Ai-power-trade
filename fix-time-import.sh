#!/bin/bash
echo "🔧 Fixing time import and restarting backend..."

scp comprehensive_backend/main.py root@143.198.205.88:/opt/Ai-power-trade/comprehensive_backend/main.py

ssh root@143.198.205.88 << 'EOF'
cd /opt/Ai-power-trade/comprehensive_backend
pkill -9 -f uvicorn
sleep 2
nohup venv/bin/python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 > backend.log 2>&1 &
sleep 5
if pgrep -f "uvicorn" > /dev/null; then
    echo "✅ Backend restarted"
else
    echo "❌ Failed"
    tail -20 backend.log
fi
EOF

echo ""
echo "Testing AI Explain endpoint..."
sleep 3
curl -s "http://143.198.205.88:8000/api/ai/explain/BTC" | python3 -c "import sys, json; d=json.load(sys.stdin); print(f\"✓ Signal: {d['data']['signal']}, Confidence: {d['data']['confidence']}\")"
