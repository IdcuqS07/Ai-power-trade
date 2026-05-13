# Environment Variable Audit Report — AI Power Trade

> **Generated:** 2026-05-23
> **Scope:** `comprehensive_backend/`, `comprehensive_frontend/`, root `.env`

---

## 1. Executive Summary

The application is a full-stack crypto trading platform (FastAPI backend + Flutter/JS frontend). It integrates multiple external services: Binance, WeeX, SoDEX, SoSoValue, CryptoPanic, OpenRouter, and Groq. A total of **42 distinct environment variables** are referenced across the codebase. Several have live credentials committed to the repo.

---

## 2. Critical Security Findings

### 2.1 Secrets Committed to `.env` in Repository

| Variable | Risk | Notes |
|---|---|---|
| `GROQ_API_KEY` | **HIGH** | Live key (`gsk_rmi4W...`) present in `.env` |
| `SOSO_API_KEY` | **HIGH** | Live key (`SOSO-723f2d...`) present in `.env` |
| `OPENROUTER_API_KEY` | **HIGH** | Live key (`sk-or-v1-3b88...`) present (commented out but still visible) |
| `PRIVATE_KEY` | **CRITICAL** | Placeholder says `YOUR_PRIVATE_KEY_HERE` but field exists for blockchain private key |
| `BINANCE_API_KEY` / `BINANCE_API_SECRET` | **HIGH** | Placeholders in `.env` — no live key but structure invites committing real ones |
| `WEEX_API_KEY` / `WEEX_API_SECRET` | **HIGH** | Same as Binance |

**Recommendation:** Add `.env` to `.gitignore` immediately. Rotate all exposed keys. Use `.env.example` with placeholder values only.

### 2.2 Hardcoded Fallback Secrets

| File | Variable | Default | Risk |
|---|---|---|---|
| `auth.py:17` | `SECRET_KEY` | `"your-secret-key-change-in-production-please"` | **HIGH** — JWT signing with known default |
| `database.py:11` | `DATABASE_URL` | `"sqlite:///./trading.db"` | **MEDIUM** — SQLite not production-grade |
| `main.py` | `BINANCE_MODE` | `"testnet"` | **LOW** — safe default |

### 2.3 `.gitignore` Status — Fixed

The root and all `.gitignore` files now include `.env*` pattern (excludes `.env`, `.env.local`, `.env.*` except `.env.example`). `.env.example` files have been created at both root and `comprehensive_frontend/` with placeholder values only. No `.env` files are currently tracked in git.

---

## 3. Environment Variable Inventory

### 3.1 Core Server

| Variable | File(s) | Default | Required | Description |
|---|---|---|---|---|
| `PORT` | `main.py` | `8000` | No | Server port |
| `HOST` | `main.py` | `0.0.0.0` | No | Server bind address |
| `SECRET_KEY` | `auth.py` | hardcoded string | **Yes** | JWT signing key |
| `DATABASE_URL` | `database.py` | `sqlite:///./trading.db` | No | Database connection string |
| `ENVIRONMENT` | `main.py` | — | No | Runtime environment tag |
| `CORS_ORIGINS` | `main.py` | — | No | CORS allowed origins |
| `LOG_LEVEL` | `main.py` | — | No | Logging verbosity |

### 3.2 Blockchain / Smart Contract

| Variable | File(s) | Default | Required | Description |
|---|---|---|---|---|
| `BLOCKCHAIN_NETWORK` | `.env` | — | No | Network name (e.g. `polygon_amoy`) |
| `POLYGON_RPC_URL` | `.env` | — | Yes | RPC endpoint URL |
| `POLYGON_CHAIN_ID` | `.env` | `80002` | No | Chain ID |
| `CONTRACT_ADDRESS` | `.env` | — | Yes | Deployed smart contract address |
| `PRIVATE_KEY` | `.env` | — | **Yes** | Deployer wallet private key |
| `OWNER_PRIVATE_KEY` | `settlement_service.py:69` | — | Yes | Settlement signing key |

### 3.3 Binance Trading

| Variable | File(s) | Default | Required | Description |
|---|---|---|---|---|
| `BINANCE_MODE` | `binance_trading.py:24` | `testnet` | No | `testnet` or `production` |
| `BINANCE_API_KEY` | `binance_trading.py:29` | `""` | Yes (prod) | Production API key |
| `BINANCE_SECRET` | `binance_trading.py:30` | `""` | Yes (prod) | Production API secret |
| `BINANCE_TESTNET_API_KEY` | `binance_trading.py:33` | `""` | Yes (test) | Testnet API key |
| `BINANCE_TESTNET_SECRET` | `binance_trading.py:34` | `""` | Yes (test) | Testnet API secret |

### 3.4 WeeX Exchange

| Variable | File(s) | Default | Required | Description |
|---|---|---|---|---|
| `WEEX_API_KEY` | `weex_api.py:39` | `None` | Yes | WeeX API key |
| `WEEX_SECRET_KEY` | `weex_api.py:40` | `None` | Yes | WeeX API secret |

### 3.5 SoDEX (Decentralized Exchange)

| Variable | File(s) | Default | Required | Description |
|---|---|---|---|---|
| `SODEX_API_URL` | `sodex_service.py:61` | `""` | Yes | SoDEX API base URL |
| `SODEX_API_KEY` | `sodex_service.py:62` | `""` | Yes | API key |
| `SODEX_API_SECRET` | `sodex_service.py:63` | `""` | Yes | API secret |
| `SODEX_ACCOUNT_ID` | `sodex_service.py:64` | `""` | Yes | Account identifier |
| `SODEX_TIMEOUT_SECONDS` | `sodex_service.py:65` | `12` | No | Request timeout |
| `SODEX_SIGNING_RPC_URLS` | `sodex_service.py:108` | — | Yes | RPC URLs for signing |
| `SODEX_SIGNING_EXPLORER_URLS` | `sodex_service.py:111` | — | No | Explorer URLs |
| `SODEX_SIGNING_CHAIN_NAME` | `sodex_service.py:113` | — | No | Chain name for signing |
| `SODEX_SIGNING_NATIVE_SYMBOL` | `sodex_service.py:114` | — | No | Native token symbol |

### 3.6 SoSoValue (Research & News)

| Variable | File(s) | Default | Required | Description |
|---|---|---|---|---|
| `ENABLE_SOSOVALUE` | `sosovalue_api.py:38` | `true` | No | Feature toggle |
| `SOSO_API_KEY` | `sosovalue_api.py:37` | `""` | Yes | API key |
| `SOSO_BASE_URL` | `sosovalue_api.py:36` | `https://openapi.sosovalue.com` | No | API base URL |
| `SOSO_TIMEOUT_SECONDS` | `sosovalue_api.py:44` | `15` | No | Request timeout |

### 3.7 CryptoPanic (News & Sentiment)

| Variable | File(s) | Default | Required | Description |
|---|---|---|---|---|
| `CRYPTOPANIC_API_KEY` | `provider_registry.py:150` | `""` | Yes | API key |

### 3.8 LLM Providers

| Variable | File(s) | Default | Required | Description |
|---|---|---|---|---|
| `GROQ_API_KEY` | `groq_service.py` | — | Yes | Groq API key |
| `GROQ_MODEL` | `.env` | `llama-3.1-8b-instant` | No | Model ID |
| `GROQ_TIMEOUT_SECONDS` | `.env` | `20` | No | Request timeout |
| `OPENROUTER_API_KEY` | `openrouter_service.py` | — | Yes | OpenRouter API key |
| `OPENROUTER_BASE_URL` | `.env` | `https://openrouter.ai/api/v1` | No | API base URL |
| `OPENROUTER_MODEL` | `.env` | `meta-llama/llama-3.2-3b-instruct:free` | No | Model ID |
| `OPENROUTER_TIMEOUT_SECONDS` | `.env` | `20` | No | Request timeout |

---

## 4. Architecture & Integration Map

```
                     ┌──────────────────────────────┐
                     │       Frontend (Flutter/JS)   │
                     │   comprehensive_frontend/     │
                     └──────────────┬───────────────┘
                                    │ HTTP/REST
                     ┌──────────────▼───────────────┐
                     │     FastAPI Backend           │
                     │     comprehensive_backend/    │
                     │                               │
                     │  ┌─────────┐  ┌────────────┐  │
                     │  │ Auth    │  │ Database   │  │
                     │  │ (JWT)   │  │ (SQLite)   │  │
                     │  └─────────┘  └────────────┘  │
                     │                               │
                     │  ┌──────────────────────────┐ │
                     │  │   Trading Providers       │ │
                     │  │  ┌────────┐ ┌─────────┐  │ │
                     │  │  │ Binance│ │  WeeX   │  │ │
                     │  │  └────────┘ └─────────┘  │ │
                     │  │  ┌────────┐              │ │
                     │  │  │ SoDEX  │              │ │
                     │  │  └────────┘              │ │
                     │  └──────────────────────────┘ │
                     │                               │
                     │  ┌──────────────────────────┐ │
                     │  │   Data / News Providers   │ │
                     │  │  ┌──────────┐ ┌────────┐ │ │
                     │  │  │CryptoPanic│ │SoSoValue│ │ │
                     │  │  └──────────┘ └────────┘ │ │
                     │  └──────────────────────────┘ │
                     │                               │
                     │  ┌──────────────────────────┐ │
                     │  │   LLM Providers (AI)      │ │
                     │  │  ┌─────┐  ┌────────────┐ │ │
                     │  │  │Groq │  │OpenRouter  │ │ │
                     │  │  └─────┘  └────────────┘ │ │
                     │  └──────────────────────────┘ │
                     │                               │
                     │  ┌──────────────────────────┐ │
                     │  │   Blockchain              │ │
                     │  │  Polygon Amoy Testnet     │ │
                     │  │  Settlement Service       │ │
                     │  └──────────────────────────┘ │
                     └──────────────────────────────┘
```

### Graceful Degradation

The backend uses a try/except import pattern for each external service. If a service's module or env vars are missing, it sets `*_AVAILABLE = False` and continues. The provider registry (`provider_registry.py`) tracks which providers are active and reports status via API.

Priority chain for LLM analysis: **Groq** (preferred) → **OpenRouter** (fallback).

---

## 5. Current Configuration State

### Active / Configured

| Service | Status | Config Level |
|---|---|---|
| Groq LLM | **Active** | Live API key present |
| SoSoValue | **Active** | Live API key present |
| Blockchain (Polygon Amoy) | **Configured** | Testnet RPC + contract address |
| SQLite Database | **Active** | Default, functional |
| **Railway Deployment** | **New** | All variables managed in Railway dashboard |

### Placeholder / Not Configured

| Service | Status | Notes |
|---|---|---|
| Binance | **Placeholder** | Testnet mode by default, no keys set |
| WeeX | **Placeholder** | No keys in `.env` |
| CryptoPanic | **Placeholder** | `your_cryptopanic_api_key_here` |
| SoDEX | **Not in .env** | Variables exist in code but not configured |
| OpenRouter | **Disabled** | Commented out in `.env` |

---

## 6. Recommendations

### Immediate (Security)

1. **Rotate all exposed API keys** — Groq, SoSoValue, and OpenRouter keys are in git history.
2. ~~**Add `.env` to `.gitignore`** — Create `.env.example` with placeholders only.~~ **COMPLETED** (2026-05-23).
3. **Generate a strong `SECRET_KEY`** — Replace the hardcoded default in `auth.py` with a cryptographically random value.
4. **Never commit `PRIVATE_KEY` or `OWNER_PRIVATE_KEY`** — Use a secrets manager or hardware wallet.

### Short-Term (Reliability)

5. **Add startup validation** — Fail fast if required vars for enabled features are missing.
6. **Centralize env loading** — Multiple files call `load_dotenv()` independently; consolidate into one config module.
7. **Add type coercion and validation** — Use pydantic `BaseSettings` for env vars to catch bad values at startup.

### Long-Term (Production Readiness)

8. **Migrate from SQLite** — Use PostgreSQL (`DATABASE_URL`) for concurrent access. **Railway PostgreSQL provisioned** but `DATABASE_URL` not yet configured in Railway.
9. ~~**Use a secrets manager** — AWS Secrets Manager, HashiCorp Vault, or at minimum Docker secrets.~~ **Railway provides built-in environment variable management** — all secrets should be configured in Railway dashboard.
10. ~~**Add environment-specific configs** — Separate `.env.development`, `.env.staging`, `.env.production` with strict `.gitignore` rules.~~ **Railway supports multiple projects/environments** (e.g., dev/staging/production) with separate variable sets.

---

## 7. Deployment: Railway.app

The project is configured for Railway deployment via `railway.json` at the root. Railway provides:

- **Built-in PostgreSQL** service (not yet connected to `DATABASE_URL`)
- **Environment variable management** — all secrets configured in Railway dashboard (never committed)
- **Auto-deployment** — builds `comprehensive_frontend/` and `comprehensive_backend/` automatically
- **Multi-environment support** — dev/staging/production with isolated variables

### Railway Services Configuration (railway.json)

| Service | Build Command | Start Command |
|---|---|---|
| `web` (Frontend) | `npm run build --prefix comprehensive_frontend` | `npx serve comprehensive_frontend/dist -p 3000` |
| `backend` (FastAPI) | No build required | `python comprehensive_backend/main.py` |

### Next Steps for Railway

1. Configure `DATABASE_URL` to point to Railway PostgreSQL
2. Add all API keys via Railway UI:
   - `GROQ_API_KEY`, `SOSO_API_KEY`, `OPENROUTER_API_KEY`
   - `BINANCE_API_KEY`, `BINANCE_SECRET`
   - `WEEX_API_KEY`, `WEEX_SECRET_KEY`
   - `CRYPTOPANIC_API_KEY`
   - `POLYGON_RPC_URL`, `PRIVATE_KEY` (consider Railway ephemeral secrets)
3. Configure frontend to point to Railway backend URL

---

## 8. File-by-File Env Reference

| File | Env Vars Used |
|---|---|
| `main.py` | `PORT`, `HOST`, `ENVIRONMENT`, `CORS_ORIGINS`, `LOG_LEVEL`, `DATABASE_URL` |
| `auth.py` | `SECRET_KEY` |
| `database.py` | `DATABASE_URL` |
| `binance_trading.py` | `BINANCE_MODE`, `BINANCE_API_KEY`, `BINANCE_SECRET`, `BINANCE_TESTNET_API_KEY`, `BINANCE_TESTNET_SECRET` |
| `weex_api.py` | `WEEX_API_KEY`, `WEEX_SECRET_KEY` |
| `sodex_service.py` | `SODEX_API_URL`, `SODEX_API_KEY`, `SODEX_API_SECRET`, `SODEX_ACCOUNT_ID`, `SODEX_TIMEOUT_SECONDS`, `SODEX_SIGNING_RPC_URLS`, `SODEX_SIGNING_EXPLORER_URLS`, `SODEX_SIGNING_CHAIN_NAME`, `SODEX_SIGNING_NATIVE_SYMBOL` |
| `sosovalue_api.py` | `ENABLE_SOSOVALUE`, `SOSO_API_KEY`, `SOSO_BASE_URL`, `SOSO_TIMEOUT_SECONDS` |
| `settlement_service.py` | `OWNER_PRIVATE_KEY` |
| `provider_registry.py` | `CRYPTOPANIC_API_KEY` + reads others for status |
| `groq_service.py` | `GROQ_API_KEY`, `GROQ_MODEL`, `GROQ_TIMEOUT_SECONDS` |
| `openrouter_service.py` | `OPENROUTER_API_KEY`, `OPENROUTER_BASE_URL`, `OPENROUTER_MODEL`, `OPENROUTER_TIMEOUT_SECONDS` |
