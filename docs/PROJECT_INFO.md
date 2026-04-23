# AI Power Trade - Polygon Blockchain

## Project Overview

AI Power Trade is a decentralized trading platform built exclusively on **Polygon blockchain**. The platform combines artificial intelligence with blockchain technology to provide intelligent trading recommendations and seamless on-chain execution.

## Core Technology

### Blockchain
- **Primary Network:** Polygon Amoy Testnet
- **Future:** Polygon Mainnet
- **Why Polygon:** Fast, cheap, and eco-friendly

### Smart Contract
- **Token:** atUSDT (AI Trade USDT)
- **Standard:** ERC-20 compatible
- **Features:** Trading, faucet, history tracking

### AI Engine
- Machine learning models for price prediction
- Real-time market analysis
- Explainable AI for transparency

## Architecture

```
┌─────────────────┐
│   Frontend      │
│   (Next.js)     │
│   Vercel        │
└────────┬────────┘
         │
         ├─────────────┐
         │             │
┌────────▼────────┐   │
│   Backend       │   │
│   (FastAPI)     │   │
│   VPS           │   │
└────────┬────────┘   │
         │            │
         ├────────────┤
         │            │
┌────────▼────────┐  ┌▼──────────────┐
│   Binance API   │  │   Polygon     │
│   (Prices)      │  │   Blockchain  │
└─────────────────┘  └───────────────┘
```

## Key Features

1. **AI-Powered Trading** - Smart recommendations based on ML models
2. **On-Chain Execution** - All trades recorded on Polygon blockchain
3. **Real-Time Data** - Live market prices from Binance
4. **Explainable AI** - Understand why AI makes recommendations
5. **Wallet Integration** - Seamless MetaMask connection
6. **Trade History** - Complete on-chain transaction history

## Technology Stack

- **Frontend:** Next.js, React, Tailwind CSS
- **Backend:** Python, FastAPI, Binance API
- **Blockchain:** Solidity, ethers.js, Polygon
- **Hosting:** Vercel (frontend), VPS (backend)
- **Database:** PostgreSQL (user data)

## Network Information

- **Testnet:** Polygon Amoy (Chain ID: 80002)
- **RPC:** https://rpc-amoy.polygon.technology/
- **Explorer:** https://amoy.polygonscan.com/
- **Faucet:** https://faucet.polygon.technology/

## Contract Address

```
0xA2E0F4A542b700f437c27Ce28B31499023d9a53A
```

## Live Application

**Production:** https://ai-power-trade-polygon.vercel.app

## Development Status

✅ Smart contract deployed
✅ Frontend deployed on Vercel
✅ Backend running on VPS
✅ AI engine operational
✅ Trade execution working
✅ All features functional

## Future Plans

- Mainnet deployment
- More trading pairs
- Advanced AI models
- Mobile application
- Social trading features

---

**Built exclusively on Polygon blockchain** 🟣
