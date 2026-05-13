# AI Power Trade

AI-powered crypto trading platform built around a focused Next.js frontend, a FastAPI backend, and an on-chain demo token on Polygon Amoy.

This local README is the continuation of the older GitHub README: it keeps the product-facing story, but updates it to match the active workspace, the current contract deployment, and the ongoing SoSoValue integration.

## Features

- Enhanced AI predictions with LSTM, Random Forest, market sentiment, research confirmation, and optional LLM explainability overlays
- AI explainability views with confidence signals, technical indicators, and catalyst overlays
- Real-time BTC/ETH pricing from Binance with CoinGecko overlays available to the AI layer
- Binance candle data exposed for chart-ready frontend consumption
- CryptoPanic sentiment hooks plus SoSoValue-powered research context, featured news, and ETF flow regime analysis
- On-chain demo trading support through `AITradeUSDT` V2 on Polygon Amoy
- SSI participation previews for staking readiness, holding tiers, and reward modeling
- Trade history, wallet-aware flows, and performance surfaces in the current frontend shell

## Target Provider Map

This repo now tracks the requested app-level provider architecture explicitly:

| Feature | Target Provider(s) | Current Repo Status |
| --- | --- | --- |
| Harga BTC/ETH | `Binance` + `CoinGecko` | Active |
| Candle chart | `Binance` | Active via `/api/market/candles/{symbol}` |
| AI signal | `backend` + `OpenRouter` | Partial, backend live and the explainability layer can attach Groq/OpenRouter overlays when env keys are present |
| News sentiment | `CryptoPanic` | Partial, CryptoPanic endpoints and explainability hooks are wired while `SoSoValue` remains a secondary research source during migration |
| Wallet connect | `MetaMask` + `wagmi` | Partial, MetaMask flow live and wagmi planned |
| Execute trade | `SoDEX` | Partial, browser-signed SoDEX execution is wired and the internal engine remains the fallback when SoDEX env or signing is unavailable |
| Trade history | `SoDEX` + `Etherscan` / `The Graph` | Partial, SoDEX account history is wired while explorer/indexer reconciliation is still pending |
| Staking / participation | `SSI` | Partial, SSI participation is modeled through holding and execution-derived previews while direct SSI contract wiring is still pending |

The backend source of truth for this mapping is:

- `GET /api/integrations/providers`
- `comprehensive_backend/provider_registry.py`

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

### Current SoSoValue Endpoints

- `GET /api/sosovalue/status`
- `GET /api/sosovalue/currencies`
- `GET /api/sosovalue/news`
- `GET /api/sosovalue/news/{symbol}`
- `GET /api/sosovalue/etf-metrics`
- `GET /api/sosovalue/research-context/{symbol}`

### Related Cross-Stack Endpoints

- `GET /api/integrations/providers`
- `GET /api/market/candles/{symbol}`
- `GET /api/ai/explainability/{symbol}`
- `GET /api/cryptopanic/news/{symbol}`
- `GET /api/sodex/history/{user_address}`
- `GET /api/ssi/status`
- `GET /api/ssi/overview/{address}`

### What It Does Today

- Fetches listed currencies from SoSoValue
- Pulls featured news globally or by asset
- Pulls BTC and ETH spot ETF metrics
- Derives a macro regime from ETF flows
- Builds a normalized research context with catalyst scoring
- Uses that research context to confirm, soften, or contradict core AI signals
- Feeds the explainability stack alongside CryptoPanic when live sentiment/news is available

### Current Local Status

- `ENABLE_SOSOVALUE` defaults to enabled in the example env
- `SOSO_API_KEY` is required for live requests
- In this local workspace, `SOSO_API_KEY` is already present in the backend env files, so SoSoValue can run live as long as the backend is started with those envs loaded

## SoDEX Local Status

The active comprehensive app now uses a browser-signed SoDEX flow for live-ready execution preparation.

- Backend prepare/submit helper: `comprehensive_backend/sodex_service.py`
- Backend endpoints: `POST /api/sodex/prepare-order`, `GET /api/sodex/status`, `POST /api/trades/execute`
- Frontend execution surface: `comprehensive_frontend/components/AiPowerTradeFinalWorkspace.js`
- Wallet signing layer: `comprehensive_frontend/contexts/WalletContext.js`

What is wired locally today:

- SoDEX order preparation now builds an EIP-712 payload for browser signing
- Signature normalization now follows the SoDEX typed-signature rule by prefixing byte `1` to the raw signature bytes
- Backend submission now re-verifies the signer and payload hash before forwarding the order to SoDEX
- Frontend can switch to a dedicated SoDEX signing network for the signature step and then return to the app network

What is still environment-dependent:

- `SODEX_API_URL` and `SODEX_ACCOUNT_ID` are still required before live SoDEX routing becomes available
- `SODEX_API_KEY` is optional when the connected wallet address should act as the API key
- `SODEX_SIGNING_RPC_URL` and `SODEX_SIGNING_EXPLORER_URL` should be set for the cleanest automatic wallet-network switching on SoDEX testnet

## Developer Roadmap

Local developer planning now lives in `GLOBAL_ROADMAP.md`.

- Scope: local development only
- Format: Wave 1 through Wave 5
- Focus: complete the active comprehensive stack before any deployment-specific cleanup

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

For deployed frontend environments like Vercel, set `NEXT_PUBLIC_API_URL` or `NEXT_PUBLIC_BACKEND_URL`
to the Railway backend URL. The production frontend should not fall back to localhost.

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
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_TIMEOUT_SECONDS=20
CRYPTOPANIC_API_KEY=your_cryptopanic_api_key_here
CRYPTOPANIC_BASE_URL=https://cryptopanic.com/api/v1
CRYPTOPANIC_TIMEOUT_SECONDS=12
ENABLE_SSI=true
SSI_PROGRAM_NAME=SSI
SSI_MIN_STAKE_AMOUNT=100
SSI_BASE_APR=8.5
SSI_POINTS_PER_TOKEN=0.12
SSI_ACTIVITY_BOOST_CAP=1.75
SSI_STAKING_CONTRACT_ADDRESS=
SODEX_API_URL=https://testnet-gw.sodex.dev/api/v1/spot
SODEX_API_KEY=your_sodex_api_key_here
SODEX_ACCOUNT_ID=your_sodex_account_id_here
SODEX_TIMEOUT_SECONDS=12
SODEX_SIGNING_CHAIN_NAME=ValueChain Testnet
SODEX_SIGNING_RPC_URL=
SODEX_SIGNING_EXPLORER_URL=
SODEX_SIGNING_NATIVE_SYMBOL=SOSO
POLYGONSCAN_API_KEY=your_polygonscan_api_key_here
THE_GRAPH_URL=your_the_graph_subgraph_url_here
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
- `comprehensive_backend/provider_registry.py`
- `comprehensive_backend/cryptopanic_service.py`
- `comprehensive_backend/openrouter_service.py`
- `comprehensive_backend/sodex_service.py`
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
- `GLOBAL_ROADMAP.md` is the local-only developer roadmap for the active stack.
- Legacy docs, deployment notes, and one-off scripts were intentionally reduced from the active repo surface.
- Some frontend and backend files still contain in-progress local changes.
