# 🚀 Quick Reference - AI Power Trade

## 🌐 URL Utama
**https://ai-power-trade.vercel.app**

## 📱 Halaman Penting

```
Dashboard       → https://ai-power-trade.vercel.app
AI Explainer    → https://ai-power-trade.vercel.app/ai-explainer
Wallet          → https://ai-power-trade.vercel.app/wallet
Trades          → https://ai-power-trade.vercel.app/trades
Analytics       → https://ai-power-trade.vercel.app/analytics
```

## 💰 8 Koin Trading

```
BTC   - Bitcoin          (Must Have)
ETH   - Ethereum         (Must Have)
BNB   - Binance Coin     (Must Have)
SOL   - Solana           (Fast & Popular)
XRP   - Ripple           (Payments)
ADA   - Cardano          (Popular)
MATIC - Polygon          (Layer 2 DeFi) ⭐
LINK  - Chainlink        (Oracle DeFi) ⭐
```

## ⚡ Performance

```
Dashboard:     0.3-0.5s (cached) - 8x lebih cepat
AI Explainer:  0.2-0.3s (cached) - 7x lebih cepat
API Response:  0.15-0.17s (cached) - 10x lebih cepat
```

## 🔧 Deployment Commands

```bash
# Deploy frontend ke ai-power-trade.vercel.app
./deploy-ai-power-trade.sh

# Update backend di VPS
./fix-backend-now.sh

# Test website
curl -s -o /dev/null -w "%{http_code}\n" https://ai-power-trade.vercel.app
```

## 🎯 Quick Start

### Untuk User
1. Buka: https://ai-power-trade.vercel.app
2. Pilih koin dari dropdown
3. Lihat AI signal (BUY/SELL/HOLD)
4. Klik "View AI Explanation" untuk detail
5. Connect MetaMask untuk trading

### Untuk Developer
```bash
# Local development
cd comprehensive_frontend
npm install
npm run dev

# Deploy to production
./deploy-ai-power-trade.sh
```

## 🐛 Troubleshooting

```bash
# Website tidak load
→ Hard refresh: Cmd+Shift+R (Mac) atau Ctrl+Shift+F5 (Windows)

# Data lama
→ Clear browser cache

# Backend error
→ ssh root@143.198.205.88 "tail -50 /opt/Ai-power-trade/comprehensive_backend/backend.log"

# Restart backend
→ ./fix-backend-now.sh
```

## 📊 Status Check

```bash
# Frontend status
curl -s -o /dev/null -w "Status: %{http_code}\n" https://ai-power-trade.vercel.app

# Backend status
curl -s http://143.198.205.88:8000/api/market/prices | python3 -c "import sys, json; print('✓ OK' if json.load(sys.stdin)['success'] else '✗ ERROR')"

# Check 8 coins
curl -s http://143.198.205.88:8000/api/market/prices | python3 -c "import sys, json; print('Coins:', ', '.join(sorted(json.load(sys.stdin)['data'].keys())))"
```

## 🔗 Important Links

```
Production:  https://ai-power-trade.vercel.app
Vercel:      https://vercel.com/idcuq-santosos-projects
Backend:     http://143.198.205.88:8000
Docs:        DEPLOYMENT_AI_POWER_TRADE.md
```

## ✅ Checklist Deployment

- [x] Frontend deployed to ai-power-trade.vercel.app
- [x] Backend running on VPS (143.198.205.88:8000)
- [x] 8 coins configured (BTC, ETH, BNB, SOL, XRP, ADA, MATIC, LINK)
- [x] Cache optimization (3-10x faster)
- [x] AI Explainer working
- [x] Mobile responsive
- [x] HTTPS enabled
- [x] All pages accessible

## 🎉 Status

```
✅ LIVE & OPTIMIZED
🌐 https://ai-power-trade.vercel.app
⚡ 3-10x Faster Loading
🤖 AI Trading Signals
📱 Mobile Responsive
🔒 Secure (HTTPS)
```

---

**Last Updated**: Dec 14, 2025
**Status**: Production Ready
**Performance**: Excellent
