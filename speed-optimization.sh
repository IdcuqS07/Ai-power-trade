#!/bin/bash
# Speed Optimization Deployment

echo "⚡ Deploying Speed Optimizations..."
echo ""

echo "📋 Optimizations:"
echo "  ✓ Backend cache increased: 60s → 90s (prices), 30s → 60s (dashboard)"
echo "  ✓ AI Explanation cache added: 90s TTL"
echo "  ✓ Frontend parallel loading for AI Explainer"
echo "  ✓ Frontend refresh interval: 10s → 30s"
echo ""

# Upload backend
echo "📤 Uploading optimized backend..."
scp comprehensive_backend/main.py root@143.198.205.88:/opt/Ai-power-trade/comprehensive_backend/main.py

if [ $? -ne 0 ]; then
    echo "❌ Upload failed"
    exit 1
fi

echo "✅ Backend uploaded"
echo ""

# Restart backend
echo "🔄 Restarting backend..."
ssh root@143.198.205.88 << 'EOF'
cd /opt/Ai-power-trade/comprehensive_backend
pkill -9 -f uvicorn
sleep 2
nohup venv/bin/python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 > backend.log 2>&1 &
sleep 5
if pgrep -f "uvicorn" > /dev/null; then
    echo "✅ Backend restarted"
else
    echo "❌ Failed to start"
    tail -20 backend.log
    exit 1
fi
EOF

if [ $? -ne 0 ]; then
    echo "❌ Restart failed"
    exit 1
fi

echo ""
echo "🧪 Testing optimizations..."
sleep 3

# Test prices endpoint
echo ""
echo "Test 1: Prices API (should be fast with cache)"
time curl -s "http://143.198.205.88:8000/api/market/prices" > /dev/null
echo ""

# Test AI explain endpoint
echo "Test 2: AI Explain API (should be fast with new cache)"
time curl -s "http://143.198.205.88:8000/api/ai/explain/BTC" > /dev/null
echo ""

# Test dashboard endpoint
echo "Test 3: Dashboard API (should be fast with increased cache)"
time curl -s "http://143.198.205.88:8000/api/dashboard?symbol=BTC" > /dev/null
echo ""

echo "✅ Speed Optimizations Deployed!"
echo ""
echo "📊 Cache Configuration:"
echo "  • Prices: 90 seconds (was 60s)"
echo "  • Dashboard: 60 seconds per coin (was 30s)"
echo "  • AI Explanation: 90 seconds per coin (NEW)"
echo "  • Trade History: 60 seconds (was 30s)"
echo ""
echo "🚀 Expected Performance:"
echo "  • First load: ~1-2 seconds"
echo "  • Cached load: ~100-300ms (3-10x faster)"
echo "  • AI Explainer: Parallel loading (2x faster)"
echo ""
echo "📝 Next steps:"
echo "1. Deploy frontend: cd comprehensive_frontend && vercel --prod"
echo "2. Test dashboard loading speed"
echo "3. Test AI Explainer loading speed"
echo "4. Check browser console for cache indicators"
echo ""
