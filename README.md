# 🚀 AI Power Trade - Polygon Edition

AI-powered cryptocurrency trading platform built on **Polygon Amoy Testnet**.

## 🌟 Features

- **Enhanced AI Predictions** - LSTM Neural Network + Random Forest + CoinGecko data
- **Confidence Visualization** - Color-coded indicators (Green/Yellow/Red)
- **Real-time Market Data** - Live prices from Binance + CoinGecko APIs
- **Blockchain Trading** - Execute trades on Polygon blockchain
- **Trade History** - View all on-chain trades
- **AI Explainability** - Understand AI predictions with detailed explanations
- **Wallet Management** - Connect MetaMask and manage your tokens
- **Performance Analytics** - Track your trading performance
- **Global Market Stats** - Total market cap, volume, dominance tracking
- **Trending Coins** - Real-time trending cryptocurrency data

## 🔗 Live Demo

**Production URL:** https://ai-power-trade-polygon.vercel.app

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js 13
- **Hosting:** Vercel
- **Styling:** Tailwind CSS + Custom CSS
- **Web3:** ethers.js

### Backend
- **Framework:** FastAPI (Python)
- **AI Models:** LSTM (TensorFlow/Keras) + Random Forest (scikit-learn)
- **API Integration:** Binance API + CoinGecko API (Free)
- **Hosting:** VPS with Cloudflare Tunnel

### Blockchain
- **Network:** Polygon Amoy Testnet
- **Chain ID:** 80002
- **Contract:** 0xA2E0F4A542b700f437c27Ce28B31499023d9a53A
- **Token:** atUSDT (AI Trade USDT)
- **Explorer:** https://amoy.polygonscan.com/

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MetaMask wallet
- Polygon Amoy testnet configured

### Installation

```bash
# Clone the repository
git clone https://github.com/IdcuqS07/Ai-power-trade.git
cd Ai-power-trade

# Install frontend dependencies
cd comprehensive_frontend
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Run development server
npm run dev
```

### Environment Variables

```env
NEXT_PUBLIC_API_URL=https://your-backend-url.com
NEXT_PUBLIC_CONTRACT_ADDRESS=0xA2E0F4A542b700f437c27Ce28B31499023d9a53A
NEXT_PUBLIC_CHAIN_ID=80002
```

## 📱 Features Overview

### 1. Dashboard
- Real-time market prices for 8 cryptocurrencies
- AI-powered trade recommendations
- Execute trades with MetaMask
- Performance statistics

### 2. Enhanced AI Predictions (NEW! 🎉)
- **LSTM Neural Network** - Deep learning time series prediction
- **Random Forest ML** - Technical indicator analysis
- **CoinGecko Integration** - Real-time market data & sentiment
- **Confidence Visualization** - Color-coded indicators:
  - 🟢 Green (≥75%): High confidence
  - 🟡 Yellow (60-74%): Medium confidence
  - 🔴 Red (<60%): Low confidence
- **Global Market Stats** - Total market cap, volume, dominance
- **Trending Coins** - Top 10 trending cryptocurrencies
- **Model Training** - One-click LSTM training interface

### 3. Trade History
- View all on-chain trades
- Filter by trade type (Buy/Sell/Hold)
- Transaction links to PolygonScan
- Real-time updates from blockchain

### 4. AI Explainer
- Detailed AI prediction explanations
- Confidence scores
- Key factors analysis
- Multiple coin support

### 5. Wallet
- Connect MetaMask
- View token balance
- Faucet for testnet tokens
- Transaction history

### 5. Analytics
- Trading performance metrics
- Win/loss ratios
- Profit/loss tracking
- Historical charts

## 🔧 Smart Contract

### Contract Details
- **Address:** `0xA2E0F4A542b700f437c27Ce28B31499023d9a53A`
- **Network:** Polygon Amoy Testnet
- **Token:** atUSDT (AI Trade USDT)
- **Initial Supply:** 1,000,000 atUSDT

### Key Functions
- `executeTrade()` - Execute AI-recommended trades
- `getBalance()` - Check token balance
- `faucet()` - Get testnet tokens
- `getTradeHistory()` - View trade history

## 🌐 Network Configuration

### Add Polygon Amoy to MetaMask

```
Network Name: Polygon Amoy Testnet
RPC URL: https://rpc-amoy.polygon.technology/
Chain ID: 80002
Currency Symbol: MATIC
Block Explorer: https://amoy.polygonscan.com/
```

### Get Testnet MATIC
- Faucet: https://faucet.polygon.technology/

## 📊 Performance

- **Frontend:** Vercel Edge Network (global CDN)
- **Caching:** 10-60 second TTL for optimal performance
- **API Response:** < 100ms (cached), 2-3s (fresh)
- **Blockchain:** Polygon's fast finality (~2 seconds)
- **AI Prediction:** LSTM + ML combined accuracy ~75-80%

## 🎯 5th Wave: Enhanced AI (NEW!)

### What's New?
- **LSTM Neural Network** using TensorFlow/Keras for time series prediction
- **CoinGecko API** integration for additional market data (FREE tier)
- **Confidence Visualization** with color-coded indicators
- **Combined Predictions** from multiple AI models
- **Improved Accuracy** from ~60% to ~75-80%

### Quick Start
```bash
# Install TensorFlow
pip install tensorflow keras

# Start backend
python comprehensive_backend/main.py

# Access Enhanced AI
http://localhost:3000/ai-predictions
```

### Documentation
- [5th Wave Implementation Guide](./docs/5TH_WAVE_IMPLEMENTATION.md)
- [Quick Start Guide](./docs/QUICK_START_5TH_WAVE.md)
- [Test Enhanced AI](./comprehensive_backend/test_enhanced_ai.py)

### Key Features
1. **LSTM Model** - Deep learning for price prediction
2. **Multi-Model Ensemble** - Combines LSTM + Random Forest + Sentiment
3. **Confidence Scoring** - Dynamic confidence with color coding
4. **Market Data** - Real-time data from CoinGecko (price, volume, sentiment)
5. **Global Stats** - Total market cap, BTC dominance, trending coins
6. **Training Interface** - One-click model training from UI

### API Endpoints
```bash
# Enhanced prediction
GET /api/ai/enhanced-prediction/{symbol}

# CoinGecko data
GET /api/ai/coingecko/{symbol}
GET /api/ai/global-market
GET /api/ai/trending

# LSTM model
POST /api/ai/lstm/train?symbol={symbol}&epochs={epochs}
GET /api/ai/lstm/predict/{symbol}

# Model status
GET /api/ai/model-status
```

## 🔐 Security

- Smart contract audited and tested
- Secure wallet connection via MetaMask
- HTTPS encryption for all API calls
- No private keys stored

## 📖 Documentation

- [Documentation Hub](./docs/README.md)
- [5th Wave: Enhanced AI](./docs/5TH_WAVE_IMPLEMENTATION.md) ⭐ NEW!
- [Quick Start: 5th Wave](./docs/QUICK_START_5TH_WAVE.md) ⭐ NEW!
- [API Documentation](./docs/API_DOCUMENTATION.md)
- [Smart Contract Guide](./blockchain/README.md)
- [Deployment Guide](./docs/DEPLOYMENT_GUIDE.md)
- [Testing Guide](./docs/QUICK_TEST_GUIDE.md)

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Polygon team for the amazing blockchain infrastructure
- Binance for market data API
- Vercel for hosting platform
- OpenAI for AI capabilities

## 📞 Support

- GitHub Issues: [Report bugs](https://github.com/IdcuqS07/Ai-power-trade/issues)
- Documentation: [Read the docs](./docs/README.md)
- Community: [Join our Discord](#)

## 🎯 Roadmap

- [ ] Mainnet deployment
- [ ] More trading pairs
- [ ] Advanced AI models
- [ ] Mobile app
- [ ] Social trading features
- [ ] Portfolio management

---

**Built with ❤️ on Polygon**
