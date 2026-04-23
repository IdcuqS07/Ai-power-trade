# 🔷 AI Power Trade - Polygon Amoy

AI-Powered Trading Platform on Polygon Amoy Testnet

## 🚀 Quick Info

- **Network**: Polygon Amoy Testnet (Chain ID: 80002)
- **Gas Fees**: ~$0.001 per transaction (10x cheaper than BSC)
- **Speed**: ~2 seconds per block (1.5x faster than BSC)
- **Coins**: 8 major cryptocurrencies with AI predictions

## 🔗 Links

- **Frontend**: [Deploying soon]
- **Contract**: [Deploy first]
- **Explorer**: https://amoy.polygonscan.com/
- **Faucet**: https://faucet.polygon.technology/

## 📋 Setup

### 1. Get MATIC
```bash
# Visit faucet
https://faucet.polygon.technology/
# Request 0.5 MATIC
```

### 2. Add Network to MetaMask
```
Network Name: Polygon Amoy Testnet
RPC URL: https://rpc-amoy.polygon.technology/
Chain ID: 80002
Currency: MATIC
Explorer: https://amoy.polygonscan.com/
```

### 3. Deploy Contract
```bash
# Go to Remix IDE
https://remix.ethereum.org/

# Upload blockchain/AITradeUSDT.sol
# Compile with Solidity 0.8.19
# Deploy to Polygon Amoy (80002)
# Copy contract address
```

### 4. Configure Backend
```bash
cd comprehensive_backend
cp .env.polygon .env
# Edit .env and add:
# - CONTRACT_ADDRESS (from step 3)
# - PRIVATE_KEY (from MetaMask)
```

### 5. Deploy Frontend
```bash
./quick-deploy-polygon.sh
```

## 🎯 Features

- ✅ 8 Major Coins (BTC, ETH, BNB, SOL, XRP, ADA, DOGE, MATIC)
- ✅ Real-time Price Data (Binance + WeeX)
- ✅ AI-Powered Predictions
- ✅ Smart Contract Trading
- ✅ Auto Settlement Service
- ✅ AI Explainability Dashboard
- ✅ Performance Analytics

## 📊 Comparison: BSC vs Polygon

| Feature | BSC Testnet | Polygon Amoy |
|---------|-------------|--------------|
| Gas Fee | ~$0.01 | ~$0.001 |
| Block Time | ~3s | ~2s |
| Ecosystem | Smaller | Larger |
| Recognition | Lower | Higher |

## 🛠️ Tech Stack

- **Frontend**: Next.js, React, TailwindCSS
- **Backend**: FastAPI, Python
- **Blockchain**: Solidity, Web3.js
- **Network**: Polygon Amoy Testnet
- **APIs**: Binance, WeeX

## 📚 Documentation

- [Polygon Docs](https://docs.polygon.technology/)
- [Amoy Explorer](https://amoy.polygonscan.com/)
- [Faucet](https://faucet.polygon.technology/)

## 🤝 Contributing

This is an experimental migration from BSC to Polygon. Feedback welcome!

## 📄 License

MIT

---

**Status**: 🚧 In Development
**Network**: Polygon Amoy Testnet
**Gas Savings**: 10x cheaper than BSC
**Speed**: 1.5x faster than BSC
