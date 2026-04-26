# AI Power Trade

AI-powered crypto trading platform built around a focused Next.js frontend, a FastAPI backend, and an on-chain demo token on Polygon Amoy.

This local README is the continuation of the older GitHub README: it keeps the product-facing story, but updates it to match the active workspace, the current contract deployment, and the ongoing SoSoValue integration.

## Features

- Enhanced AI predictions with LSTM, Random Forest, market sentiment, and research confirmation
- AI explainability views with confidence signals, technical indicators, and catalyst overlays
- Real-time market context from backend aggregation layers
- SoSoValue-powered research context, featured news, and ETF flow regime analysis
- On-chain demo trading support through `AITradeUSDT` V2 on Polygon Amoy
- Trade history, wallet-aware flows, and performance surfaces in the current frontend shell

## Active App Surface

The current frontend intentionally focuses on a smaller set of routes:

- `/`
- `/app`
- `/ai-explainer`
- `/trade-history`

Lower-priority legacy modules may still exist in the codebase, but they are not part of the primary product shell.

## Tech Stack

### Frontend

- `Next.js 14`
- `React 18`
- Custom CSS modules and app-specific UI components
- Wallet/network helpers for Polygon Amoy

### Backend

- `FastAPI`
- `Web3.py`
- `SQLAlchemy`
- `scikit-learn`
- Optional `TensorFlow` and `Keras`
- SoSoValue, CoinGecko, and exchange data integrations

### Blockchain

- Network: `Polygon Amoy Testnet`
- Chain ID: `80002`
- Contract: `0xA2E0F4A542b700f437c27Ce28B31499023d9a53A`
- Token: `atUSDT`
- Explorer: `https://amoy.polygonscan.com/address/0xA2E0F4A542b700f437c27Ce28B31499023d9a53A`

## Smart Contract

The active contract artifact and source are:

- `blockchain/deployment.json`
- `blockchain/AITradeUSDT_V2.sol`

The deployed V2 contract supports:

- ERC-20 token balances and transfers
- Faucet claims with cooldown tracking
- Trade execution via `executeTrade()`
- Settlement via `settleTrade()`
- Trade inspection via `getTrade()` and user trade history helpers

`blockchain/deployment.json` is the runtime source of truth used by the backend blockchain services.

## SoSoValue Integration

SoSoValue is already partially integrated in the active stack and is one of the main areas for continued development.

### Current Scope

- Backend API client: `comprehensive_backend/sosovalue_api.py`
- Normalization/service layer: `comprehensive_backend/sosovalue_service.py`
- Cache layer: `comprehensive_backend/sosovalue_cache.py`
- FastAPI endpoints: `comprehensive_backend/main.py`
- Enhanced prediction fusion: `comprehensive_backend/enhanced_predictor.py`
- Frontend consumption: `comprehensive_frontend/components/SignalExplainabilityPage.js`

### Current Backend Endpoints

- `GET /api/sosovalue/status`
- `GET /api/sosovalue/currencies`
- `GET /api/sosovalue/news`
- `GET /api/sosovalue/news/{symbol}`
- `GET /api/sosovalue/etf-metrics`
- `GET /api/sosovalue/research-context/{symbol}`

### What It Does Today

- Fetches listed currencies from SoSoValue
- Pulls featured news globally or by asset
- Pulls BTC and ETH spot ETF metrics
- Derives a macro regime from ETF flows
- Builds a normalized research context with catalyst scoring
- Uses that research context to confirm, soften, or contradict core AI signals

### Current Local Status

- `ENABLE_SOSOVALUE` defaults to enabled in the example env
- `SOSO_API_KEY` is required for live requests
- In the current shell session, `SOSO_API_KEY` is not set, so live SoSoValue calls will stay unavailable until configured

## Local Development

### Frontend

```bash
cd comprehensive_frontend
npm install
npm run dev
```

Optional frontend env:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

### Backend

```bash
cd comprehensive_backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python main.py
```

Important backend env values from `comprehensive_backend/.env.example`:

```env
ENABLE_SOSOVALUE=true
SOSO_API_KEY=your_sosovalue_api_key_here
SOSO_BASE_URL=https://openapi.sosovalue.com
SOSO_TIMEOUT_SECONDS=15
OWNER_PRIVATE_KEY=your_private_key_here
BINANCE_MODE=testnet
```

Default local URLs:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- Backend docs: `http://localhost:8000/docs`

## Polygon Amoy Setup

Use this network in MetaMask:

```text
Network Name: Polygon Amoy Testnet
RPC URL: https://rpc-amoy.polygon.technology/
Chain ID: 80002
Currency Symbol: MATIC
Block Explorer: https://amoy.polygonscan.com/
```

Faucet:

- `https://faucet.polygon.technology/`

## Runtime Map

### Frontend

- `comprehensive_frontend/pages/`
- `comprehensive_frontend/components/`
- `comprehensive_frontend/lib/walletNetwork.js`
- `comprehensive_frontend/pages/api/backend/[...path].js`
- `comprehensive_frontend/pages/api/app/terminal.js`

### Backend

- `comprehensive_backend/main.py`
- `comprehensive_backend/blockchain_service.py`
- `comprehensive_backend/settlement_service.py`
- `comprehensive_backend/enhanced_predictor.py`
- `comprehensive_backend/sosovalue_api.py`
- `comprehensive_backend/sosovalue_service.py`

### Blockchain

- `blockchain/deployment.json`
- `blockchain/AITradeUSDT_V2.sol`

## Notes

- This README reflects the active workspace, not the broader historical repo state.
- Legacy docs, deployment notes, and one-off scripts were intentionally reduced from the active repo surface.
- Some frontend and backend files still contain in-progress local changes.
