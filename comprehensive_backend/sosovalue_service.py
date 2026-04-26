"""
Normalization and product intelligence layer for SoSoValue data.
"""

from __future__ import annotations

import html
import logging
import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from sosovalue_api import SoSoValueAPIError, sosovalue_api

logger = logging.getLogger(__name__)


class SoSoValueService:
    """Service layer that converts raw SoSoValue payloads into product-friendly shapes."""

    CATEGORY_LABELS = {
        1: "News",
        2: "Research",
        3: "Institution",
        4: "Insights",
        5: "Macro News",
        6: "Macro Research",
        7: "Official Tweet",
        9: "Price Alert",
        10: "On-Chain",
    }

    CATEGORY_WEIGHTS = {
        1: 10,
        2: 14,
        3: 9,
        4: 12,
        5: 11,
        6: 13,
        7: 8,
        9: 7,
        10: 12,
    }

    SYMBOL_ALIASES = {
        "MATIC": ["MATIC", "POL"],
        "POL": ["POL", "MATIC"],
    }

    def __init__(self) -> None:
        self.api = sosovalue_api

    def is_available(self) -> bool:
        return self.api.is_enabled

    def get_unavailable_reason(self) -> str:
        status = self.api.get_status()
        if not status["feature_enabled"]:
            return "SoSoValue integration is disabled by ENABLE_SOSOVALUE"
        if not status["has_api_key"]:
            return "SOSO_API_KEY is not configured"
        return "SoSoValue integration is unavailable"

    def get_service_status(self) -> Dict[str, Any]:
        return {
            **self.api.get_status(),
            "supported_etf_types": ["us-btc-spot", "us-eth-spot"],
            "notes": {
                "cache_policy": {
                    "currencies": "6 hours",
                    "news": "5 minutes",
                    "etf_metrics": "10 minutes",
                },
                "fallback_behavior": "Existing dashboard remains active when SoSoValue is unavailable.",
            },
        }

    def _get_symbol_candidates(self, symbol: str) -> List[str]:
        normalized = symbol.upper().strip()
        aliases = self.SYMBOL_ALIASES.get(normalized, [])
        return [normalized, *aliases]

    def get_listed_currencies(self) -> List[Dict[str, Any]]:
        currencies = self.api.get_listed_currencies()
        normalized = []

        for item in currencies:
            normalized.append(
                {
                    "currency_id": str(
                        item.get("currencyId")
                        or item.get("id")
                        or item.get("currency_id")
                        or ""
                    ),
                    "symbol": str(
                        item.get("currencyName")
                        or item.get("name")
                        or ""
                    ).upper(),
                    "name": item.get("fullName", ""),
                }
            )

        return [item for item in normalized if item["currency_id"] and item["symbol"]]

    def resolve_currency(self, symbol: str) -> Optional[Dict[str, Any]]:
        candidates = self._get_symbol_candidates(symbol)

        for currency in self.get_listed_currencies():
            if currency["symbol"] in candidates:
                return currency

        return None

    def _pick_multilanguage_content(
        self,
        multilanguage_content: Optional[List[Dict[str, Any]]],
        preferred_language: str = "en",
    ) -> Dict[str, str]:
        entries = multilanguage_content or []

        for entry in entries:
            if entry.get("language") == preferred_language:
                return {
                    "language": entry.get("language", preferred_language),
                    "title": entry.get("title", ""),
                    "content": entry.get("content", ""),
                }

        if entries:
            return {
                "language": entries[0].get("language", preferred_language),
                "title": entries[0].get("title", ""),
                "content": entries[0].get("content", ""),
            }

        return {"language": preferred_language, "title": "", "content": ""}

    def _html_to_text(self, raw_html: str) -> str:
        without_tags = re.sub(r"<[^>]+>", " ", raw_html or "")
        return re.sub(r"\s+", " ", html.unescape(without_tags)).strip()

    def _to_iso(self, timestamp_ms: Optional[int]) -> Optional[str]:
        if not timestamp_ms:
            return None
        return datetime.fromtimestamp(timestamp_ms / 1000, tz=timezone.utc).isoformat()

    def _hours_since(self, timestamp_ms: Optional[int]) -> Optional[float]:
        if not timestamp_ms:
            return None

        published_at = datetime.fromtimestamp(timestamp_ms / 1000, tz=timezone.utc)
        delta = datetime.now(timezone.utc) - published_at
        return delta.total_seconds() / 3600

    def _calculate_article_importance(
        self,
        item: Dict[str, Any],
        matched_symbols: List[str],
        requested_symbol: str,
    ) -> int:
        score = 20
        category = item.get("category")
        score += self.CATEGORY_WEIGHTS.get(category, 8)

        hours_since = self._hours_since(item.get("releaseTime"))
        if hours_since is not None:
            if hours_since <= 6:
                score += 30
            elif hours_since <= 24:
                score += 22
            elif hours_since <= 72:
                score += 14
            elif hours_since <= 168:
                score += 8
            else:
                score += 3

        if requested_symbol and requested_symbol.upper() in matched_symbols:
            score += 18

        tags = item.get("tags") or []
        score += min(len(tags) * 2, 10)

        quote_info = item.get("quoteInfo") or {}
        engagement = (
            (quote_info.get("impressionCount") or 0)
            + (quote_info.get("likeCount") or 0) * 5
            + (quote_info.get("replyCount") or 0) * 8
            + (quote_info.get("retweetCount") or 0) * 10
        )

        if engagement >= 5000:
            score += 10
        elif engagement >= 1000:
            score += 6
        elif engagement > 0:
            score += 3

        return max(0, min(score, 100))

    def _normalize_news_item(self, item: Dict[str, Any], requested_symbol: str = "") -> Dict[str, Any]:
        content = self._pick_multilanguage_content(item.get("multilanguageContent"))
        matched_currencies = item.get("matchedCurrencies") or []
        matched_symbols = [
            str(currency.get("name") or currency.get("currencyName") or "").upper()
            for currency in matched_currencies
            if currency.get("name") or currency.get("currencyName")
        ]
        importance_score = self._calculate_article_importance(item, matched_symbols, requested_symbol)
        summary = self._html_to_text(content.get("content", ""))

        return {
            "id": str(item.get("id", "")),
            "title": content.get("title") or "(Untitled)",
            "summary": summary[:320],
            "source_link": item.get("sourceLink"),
            "source": item.get("author") or item.get("nickName") or "SoSoValue",
            "published_at": self._to_iso(item.get("releaseTime")),
            "category_id": item.get("category"),
            "category_label": self.CATEGORY_LABELS.get(item.get("category"), "Unknown"),
            "feature_image": item.get("featureImage"),
            "matched_symbols": matched_symbols,
            "matched_currencies": [
                {
                    "currency_id": str(currency.get("id") or currency.get("currencyId") or ""),
                    "symbol": str(currency.get("name") or currency.get("currencyName") or "").upper(),
                    "name": currency.get("fullName", ""),
                }
                for currency in matched_currencies
            ],
            "tags": item.get("tags") or [],
            "language": content.get("language"),
            "importance_score": importance_score,
        }

    def _score_label(self, score: float) -> str:
        if score >= 75:
            return "HIGH"
        if score >= 55:
            return "MEDIUM"
        return "LOW"

    def get_news_feed(
        self,
        symbol: Optional[str] = None,
        page_num: int = 1,
        page_size: int = 5,
    ) -> Dict[str, Any]:
        if symbol:
            currency = self.resolve_currency(symbol)
            if not currency:
                raise ValueError(f"Unsupported SoSoValue symbol: {symbol.upper()}")

            raw_feed = self.api.get_featured_news_by_currency(
                currency_id=currency["currency_id"],
                page_num=page_num,
                page_size=page_size,
            )
            requested_symbol = currency["symbol"]
        else:
            currency = None
            raw_feed = self.api.get_featured_news(page_num=page_num, page_size=page_size)
            requested_symbol = ""

        raw_items = raw_feed.get("list") or []
        normalized_items = [
            self._normalize_news_item(item, requested_symbol=requested_symbol)
            for item in raw_items
        ]

        return {
            "symbol": requested_symbol or None,
            "currency": currency,
            "page": {
                "page_num": int(raw_feed.get("pageNum") or page_num),
                "page_size": int(raw_feed.get("pageSize") or page_size),
                "total_pages": int(raw_feed.get("totalPages") or 0),
                "total_items": int(raw_feed.get("total") or len(normalized_items)),
            },
            "articles": normalized_items,
        }

    def _extract_metric(self, metrics: Dict[str, Any], field_name: str) -> Dict[str, Any]:
        field = metrics.get(field_name) or {}
        return {
            "value": field.get("value", 0),
            "last_update_date": field.get("lastUpdateDate"),
            "status": field.get("status"),
        }

    def _derive_regime(self, daily_net_inflow_usd: float) -> Dict[str, str]:
        if daily_net_inflow_usd >= 50_000_000:
            return {
                "label": "BULLISH",
                "explanation": "ETF net inflows are strongly positive, which supports risk-on conditions.",
            }
        if daily_net_inflow_usd <= -50_000_000:
            return {
                "label": "DEFENSIVE",
                "explanation": "ETF net outflows are materially negative, which supports a risk-off stance.",
            }
        return {
            "label": "NEUTRAL",
            "explanation": "ETF flow is mixed or modest, so macro confirmation remains limited.",
        }

    def get_etf_metrics(self, etf_type: str = "us-btc-spot") -> Dict[str, Any]:
        raw_metrics = self.api.get_current_etf_metrics(etf_type)
        funds = raw_metrics.get("list") or raw_metrics.get("etfList") or []

        normalized_funds = []
        for fund in funds:
            normalized_funds.append(
                {
                    "id": str(fund.get("id", "")),
                    "ticker": fund.get("ticker"),
                    "institute": fund.get("institute"),
                    "daily_net_inflow_usd": self._extract_metric(fund, "dailyNetInflow"),
                    "cumulative_net_inflow_usd": self._extract_metric(fund, "cumNetInflow"),
                    "net_assets_usd": self._extract_metric(fund, "netAssets"),
                    "daily_value_traded_usd": self._extract_metric(fund, "dailyValueTraded"),
                    "fee": self._extract_metric(fund, "fee"),
                }
            )

        daily_net_inflow = self._extract_metric(raw_metrics, "dailyNetInflow")
        regime = self._derive_regime(float(daily_net_inflow["value"] or 0))

        return {
            "type": etf_type,
            "regime": regime["label"],
            "regime_explanation": regime["explanation"],
            "aggregate": {
                "daily_net_inflow_usd": daily_net_inflow,
                "total_net_assets_usd": self._extract_metric(raw_metrics, "totalNetAssets"),
                "total_token_holdings": self._extract_metric(raw_metrics, "totalTokenHoldings"),
                "cumulative_net_inflow_usd": self._extract_metric(raw_metrics, "cumNetInflow"),
                "daily_total_value_traded_usd": self._extract_metric(raw_metrics, "dailyTotalValueTraded"),
            },
            "funds": normalized_funds,
        }

    def get_macro_context(self) -> Dict[str, Any]:
        btc_etf = self.get_etf_metrics("us-btc-spot")
        eth_etf = self.get_etf_metrics("us-eth-spot")

        regimes = {btc_etf["regime"], eth_etf["regime"]}
        if regimes == {"BULLISH"}:
            overall_regime = "BULLISH"
        elif regimes == {"DEFENSIVE"}:
            overall_regime = "DEFENSIVE"
        else:
            overall_regime = "NEUTRAL"

        return {
            "overall_regime": overall_regime,
            "btc_spot_etf": btc_etf,
            "eth_spot_etf": eth_etf,
        }

    def _build_research_rationale(
        self,
        symbol: str,
        articles: List[Dict[str, Any]],
        macro_context: Dict[str, Any],
    ) -> List[str]:
        rationale = []

        if articles:
            top_article = max(articles, key=lambda article: article["importance_score"])
            rationale.append(
                f"Top {symbol.upper()} catalyst scored {top_article['importance_score']}/100 from {top_article['category_label']} coverage."
            )
            rationale.append(
                f"{len(articles)} recent SoSoValue articles were mapped to {symbol.upper()}."
            )
        else:
            rationale.append(f"No recent SoSoValue catalyst articles were found for {symbol.upper()}.")

        if macro_context.get("overall_regime") == "UNAVAILABLE":
            rationale.append("Macro ETF backdrop is temporarily unavailable, so catalyst scoring is based on news only.")
        else:
            rationale.append(
                f"Macro ETF backdrop is {macro_context['overall_regime']} based on BTC and ETH spot ETF flows."
            )
        return rationale

    def get_research_context(self, symbol: str, news_limit: int = 5) -> Dict[str, Any]:
        symbol = symbol.upper().strip()
        currency = self.resolve_currency(symbol)
        if not currency:
            raise ValueError(f"Unsupported SoSoValue symbol: {symbol}")

        news_feed = self.get_news_feed(symbol=symbol, page_num=1, page_size=news_limit)
        articles = news_feed["articles"]
        try:
            macro_context = self.get_macro_context()
        except SoSoValueAPIError as exc:
            logger.warning("SoSoValue macro context unavailable for %s: %s", symbol, exc)
            macro_context = {
                "overall_regime": "UNAVAILABLE",
                "btc_spot_etf": None,
                "eth_spot_etf": None,
                "error": str(exc),
            }

        average_importance = (
            sum(article["importance_score"] for article in articles) / len(articles)
            if articles
            else 0
        )

        macro_bonus = {
            "BULLISH": 8,
            "NEUTRAL": 0,
            "DEFENSIVE": -8,
        }.get(macro_context["overall_regime"], 0)

        catalyst_score = max(0, min(round(average_importance + macro_bonus, 2), 100))

        return {
            "symbol": symbol,
            "currency": currency,
            "news_count": len(articles),
            "catalyst_score": catalyst_score,
            "catalyst_label": self._score_label(catalyst_score),
            "rationale": self._build_research_rationale(symbol, articles, macro_context),
            "latest_news": articles,
            "macro_context": macro_context,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }


sosovalue_service = SoSoValueService()
