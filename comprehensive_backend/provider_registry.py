"""
Application provider registry.

Keeps one backend source of truth for which external provider powers each
product feature, plus the current implementation status inside this repo.
"""

from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Dict, List


def _has_env(name: str) -> bool:
    return bool(os.getenv(name, "").strip())


def _env_flag(name: str, default: bool = False) -> bool:
    raw_value = os.getenv(name)
    if raw_value is None:
        return default
    return raw_value.strip().lower() in {"1", "true", "yes", "on"}


def _provider_status(configured: bool, status: str, role: str, notes: str) -> Dict:
    return {
        "configured": configured,
        "status": status,
        "role": role,
        "notes": notes,
    }


def get_provider_registry() -> Dict:
    sosovalue_enabled = _env_flag("ENABLE_SOSOVALUE", True)
    sosovalue_ready = sosovalue_enabled and _has_env("SOSO_API_KEY")
    openrouter_ready = _has_env("OPENROUTER_API_KEY")
    cryptopanic_ready = _has_env("CRYPTOPANIC_API_KEY")
    ssi_enabled = _env_flag("ENABLE_SSI", True)
    sodex_ready = _has_env("SODEX_API_URL") and (
        _has_env("SODEX_API_KEY") or _has_env("SODEX_API_SECRET")
    )
    graph_ready = _has_env("THE_GRAPH_URL")
    explorer_ready = _has_env("ETHERSCAN_API_KEY") or _has_env("POLYGONSCAN_API_KEY")

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "network": {
            "active_chain": "Polygon Amoy Testnet",
            "explorer_family": "Etherscan-compatible",
        },
        "features": [
            {
                "key": "market_prices",
                "label": "Harga BTC/ETH",
                "status": "active",
                "target_providers": ["Binance", "CoinGecko"],
                "current_runtime": ["Binance", "CoinGecko overlay"],
                "backend_paths": ["/api/market/prices"],
                "notes": "Live market prices are served from Binance, while CoinGecko remains available for enrichment and fallback logic.",
            },
            {
                "key": "candle_chart",
                "label": "Candle Chart",
                "status": "active",
                "target_providers": ["Binance"],
                "current_runtime": ["Binance"],
                "backend_paths": ["/api/market/candles/{symbol}"],
                "notes": "Candlestick data is sourced from Binance klines with simulated fallback only when the exchange is unavailable.",
            },
            {
                "key": "ai_signal",
                "label": "AI Signal",
                "status": "partial",
                "target_providers": ["Backend", "OpenRouter"],
                "current_runtime": ["Local backend predictors", "CoinGecko", "SoSoValue research context", "Optional Groq/OpenRouter overlay"],
                "backend_paths": ["/api/ai/explain/{symbol}", "/api/ai/enhanced-prediction/{symbol}", "/api/ai/explainability/{symbol}"],
                "notes": "The backend signal stack is live today. The explainability bundle can attach Groq or OpenRouter reasoning overlays when keys are configured, while deterministic predictors remain the base signal engine.",
            },
            {
                "key": "news_sentiment",
                "label": "News Sentiment",
                "status": "partial",
                "target_providers": ["CryptoPanic"],
                "current_runtime": ["CryptoPanic news/sentiment", "SoSoValue research transition layer"],
                "backend_paths": ["/api/cryptopanic/news/{symbol}", "/api/cryptopanic/sentiment/{symbol}", "/api/sosovalue/news", "/api/sosovalue/news/{symbol}"],
                "notes": "CryptoPanic endpoints and sentiment normalization are already wired. SoSoValue remains a secondary research source while the app finishes the migration.",
            },
            {
                "key": "wallet_connect",
                "label": "Wallet Connect",
                "status": "partial",
                "target_providers": ["MetaMask", "wagmi"],
                "current_runtime": ["MetaMask-compatible injected provider"],
                "backend_paths": ["/api/blockchain/status", "/api/blockchain/balance/{address}"],
                "notes": "Wallet flows currently use a custom injected-provider adapter. wagmi remains the target frontend connection layer.",
            },
            {
                "key": "execute_trade",
                "label": "Execute Trade",
                "status": "partial",
                "target_providers": ["SoDEX"],
                "current_runtime": ["Browser-signed SoDEX flow", "Local trading engine fallback", "Polygon settlement service fallback"],
                "backend_paths": ["/api/trades/execute", "/api/sodex/prepare-order"],
                "notes": "The app can now prepare and submit browser-signed SoDEX orders when the gateway env is configured. Internal execution remains the preview and fallback path.",
            },
            {
                "key": "trade_history",
                "label": "Trade History",
                "status": "partial",
                "target_providers": ["SoDEX", "Etherscan", "The Graph"],
                "current_runtime": ["Unified backend trade history feed", "SoDEX account history", "Settlement contract reads", "Runtime verification helpers"],
                "backend_paths": ["/api/trades/history", "/api/trades/performance", "/api/blockchain/verify-transaction", "/api/sodex/history/{user_address}"],
                "notes": "The backend can now aggregate settlement reads and SoDEX account history into one execution feed, while explorer/indexer-backed reconciliation is still pending.",
            },
            {
                "key": "staking_participation",
                "label": "Staking / Participation",
                "status": "partial",
                "target_providers": ["SSI"],
                "current_runtime": ["Derived SSI participation overview", "atUSDT holding data", "Unified execution activity"],
                "backend_paths": ["/api/ssi/status", "/api/ssi/overview/{address}"],
                "notes": "SSI participation is now modeled in the backend as a truthful preview layer driven by holdings and execution activity, while direct SSI contract settlement is still pending.",
            },
        ],
        "providers": {
            "binance": _provider_status(
                configured=True,
                status="active",
                role="Spot prices and candle data",
                notes="Primary live market data provider.",
            ),
            "coingecko": _provider_status(
                configured=True,
                status="active",
                role="Market overlays and sentiment enrichment",
                notes="Already used by enhanced prediction and global market context endpoints.",
            ),
            "openrouter": _provider_status(
                configured=openrouter_ready,
                status="planned" if not openrouter_ready else "ready_for_wiring",
                role="LLM reasoning layer for AI signal narratives",
                notes="The runtime overlay is already wired into /api/ai/explainability/{symbol}; add OPENROUTER_API_KEY to activate it when the OpenRouter path is needed.",
            ),
            "cryptopanic": _provider_status(
                configured=cryptopanic_ready,
                status="planned" if not cryptopanic_ready else "ready_for_wiring",
                role="News and sentiment feed",
                notes="The backend endpoints and explainability integration are wired; add CRYPTOPANIC_API_KEY to activate live news and sentiment in this environment.",
            ),
            "metamask": _provider_status(
                configured=True,
                status="active",
                role="Injected wallet provider",
                notes="Current frontend wallet flow already prefers MetaMask-compatible injection.",
            ),
            "wagmi": _provider_status(
                configured=False,
                status="planned",
                role="Frontend wallet connector layer",
                notes="Not installed or integrated in the current frontend shell yet.",
            ),
            "sodex": _provider_status(
                configured=sodex_ready,
                status="partial" if not sodex_ready else "active",
                role="External trade execution and fill history",
                notes="Browser-signed execution and account history are wired. Add SoDEX credentials to enable live routing in this environment.",
            ),
            "ssi": _provider_status(
                configured=ssi_enabled,
                status="partial" if ssi_enabled else "planned",
                role="Staking participation, holding tiers, and reward previews",
                notes="Current SSI outputs are derived from atUSDT holdings and execution activity until a dedicated SSI contract or API is connected.",
            ),
            "etherscan": _provider_status(
                configured=explorer_ready,
                status="planned" if not explorer_ready else "ready_for_wiring",
                role="Explorer-backed transaction verification",
                notes="Use an Etherscan-compatible key such as PolygonScan for the active Amoy network.",
            ),
            "the_graph": _provider_status(
                configured=graph_ready,
                status="planned" if not graph_ready else "ready_for_wiring",
                role="Indexed trade and settlement queries",
                notes="Provide THE_GRAPH_URL when a subgraph is ready.",
            ),
            "sosovalue": _provider_status(
                configured=sosovalue_ready,
                status="active" if sosovalue_ready else "optional_fallback",
                role="Current research and catalyst context",
                notes="Still used as research context and a transition-layer fallback while the app shifts app-level news sentiment toward CryptoPanic.",
            ),
        },
    }


__all__: List[str] = ["get_provider_registry"]
