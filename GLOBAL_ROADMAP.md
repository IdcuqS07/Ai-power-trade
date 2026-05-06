# LOCAL DEVELOPER ROADMAP

Working roadmap for the active AI Power Trade workspace.

This document is local-only and is written for developer execution inside the current repository. It is not a deploy plan, not a fundraising brief, and not a public product roadmap.

## Guardrails

- Build and validate everything locally first.
- Keep the active surface limited to `comprehensive_frontend`, `comprehensive_backend`, and `blockchain`.
- Treat `README.md` and this file as the source of truth for the current local stack.
- Do not expand scope to legacy modules unless a local blocker forces it.
- Prefer browser-signed SoDEX execution over server-side signing for the user-facing app flow.

## Current Local Stack

- Frontend: `Next.js 14` in `comprehensive_frontend`
- Backend: `FastAPI` in `comprehensive_backend`
- Contract demo layer: `AITradeUSDT_V2.sol` on Polygon Amoy
- Market data: `Binance` primary, `CoinGecko` enrichment
- Research and explainability: `SoSoValue`, `CryptoPanic`, optional `Groq` and `OpenRouter`
- Live-ready execution path: `SoDEX` prepare -> wallet EIP-712 sign -> backend submit
- Participation layer: `SSI` preview and derived profile logic

## Wave 1: Local Baseline

Goal:
Stabilize the local workspace so every active route can boot and load without relying on legacy files.

Focus:

- keep `/`, `/app`, `/ai-explainer`, and `/trade-history` as the only primary frontend routes
- ensure backend startup works from `comprehensive_backend/main.py`
- keep env examples aligned with the actual local runtime
- make `README.md` truthful about what is already wired versus what still needs env setup

Tasks:

- verify `npm run build` succeeds in `comprehensive_frontend`
- verify backend imports and core startup succeed locally
- keep `.env.example` files aligned with the active stack
- remove or ignore any local-only confusion coming from archived modules

Done when:

- frontend build is green
- backend imports are green
- docs point to the correct active directories

## Wave 2: Market Data And AI Explainability

Goal:
Make market data, candles, signals, and research overlays reliable enough for daily local iteration.

Focus:

- keep Binance as the canonical live market source
- keep candle APIs dedicated and chart-ready
- make explainability outputs coherent across deterministic models and optional LLM overlays
- keep research and sentiment provider roles explicit

Tasks:

- verify `/api/market/prices`
- verify `/api/market/candles/{symbol}`
- verify `/api/ai/explainability/{symbol}`
- verify SoSoValue context and CryptoPanic overlays still normalize cleanly
- keep UI cards consistent with backend response shapes

Done when:

- local charts no longer depend on inferred data
- explainability pages render cleanly from live backend payloads
- provider fallbacks remain readable in the UI

## Wave 3: Wallet And SoDEX Execution

Goal:
Finish the local browser-signed execution path so it is safe to test repeatedly on SoDEX.

Focus:

- preserve current MetaMask injected-provider support
- keep Polygon Amoy as the app network for the token demo layer
- allow SoDEX signing to use its own EIP-712 domain and signing network
- make signer validation strict before submit

Tasks:

- keep `POST /api/sodex/prepare-order` stable
- keep EIP-712 payload generation deterministic
- keep signature normalization and signer recovery checks in place
- support wallet switching for SoDEX signing and then restore the app network
- document required env values for SoDEX testnet execution

Done when:

- wallet can connect locally
- order payload can be prepared locally
- EIP-712 signature can be requested and normalized correctly
- backend rejects signer mismatch before forwarding to SoDEX

## Wave 4: History, SSI, And Provider Hardening

Goal:
Unify post-trade visibility so local testing can inspect outcomes without guessing which provider owns the result.

Focus:

- aggregate trade history from internal records and SoDEX history paths
- keep SSI profile generation tied to holdings plus execution activity
- keep provider registry truthful about runtime readiness

Tasks:

- verify `/api/trades/history`
- verify `/api/trades/performance`
- verify `/api/sodex/history/{user_address}`
- verify `/api/ssi/overview/{address}`
- refresh provider status messaging for SoDEX, SoSoValue, CryptoPanic, and LLM overlays

Done when:

- history pages show consistent records across fallback and SoDEX paths
- SSI previews stay coherent after local trade execution
- provider status surfaces match real local env readiness

## Wave 5: Local Release Rehearsal

Goal:
Treat the local stack like a release candidate before any remote deployment cleanup or wider repo publishing.

Focus:

- run repeatable checks locally
- tighten docs for the active app only
- reduce the chance of pushing stale assumptions

Tasks:

- run backend compile and smoke checks
- run frontend production build
- review the current git diff before each push
- keep README and roadmap synchronized with actual code behavior
- isolate active files from legacy cleanup noise when committing

Done when:

- local verification steps are repeatable
- push-ready commits are scoped to active work
- a new developer can clone the repo and understand the local stack from docs alone

## Recommended Execution Order

1. Finish Wave 1 before expanding feature work.
2. Use Wave 2 to stabilize data and explainability contracts.
3. Use Wave 3 to complete the SoDEX execution loop.
4. Use Wave 4 to make outcomes auditable in the UI.
5. Use Wave 5 before any major push, branch cut, or deployment effort.

## Local Verification Checklist

- `cd comprehensive_frontend && npm run build`
- `cd comprehensive_backend && python3 -m py_compile main.py sodex_service.py blockchain_service.py`
- boot the backend locally and inspect `/docs`
- load `/app` and `/trade-history`
- test wallet connect and SoDEX prepare flow with a safe local test account

## Out Of Scope For This Roadmap

- production deployment automation
- CI or GitHub Actions restoration
- VPS or Railway rollout steps
- legacy app resurrection
- broad archive cleanup outside what blocks the active stack
