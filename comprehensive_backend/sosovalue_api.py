"""
SoSoValue API integration for research, news, and ETF context.
"""

from __future__ import annotations

import json
import logging
import os
from typing import Any, Dict, List, Optional

import requests
from dotenv import load_dotenv

from sosovalue_cache import TTLCache

load_dotenv()

logger = logging.getLogger(__name__)


class SoSoValueAPIError(Exception):
    """Raised when a SoSoValue request cannot be completed."""

    def __init__(self, message: str, status_code: Optional[int] = None):
        super().__init__(message)
        self.status_code = status_code


class SoSoValueAPI:
    """Backend-safe client for the SoSoValue REST API."""

    DEFAULT_CATEGORY_LIST = [1, 2, 3, 4, 5, 6, 7, 9, 10]

    def __init__(self) -> None:
        self.base_url = os.getenv("SOSO_BASE_URL", "https://openapi.sosovalue.com").rstrip("/")
        self.api_key = os.getenv("SOSO_API_KEY", "").strip()
        self.feature_enabled = os.getenv("ENABLE_SOSOVALUE", "true").strip().lower() in {
            "1",
            "true",
            "yes",
            "on",
        }
        self.timeout_seconds = int(os.getenv("SOSO_TIMEOUT_SECONDS", "15"))
        self.cache = TTLCache()
        self.session = requests.Session()
        self.session.headers.update(
            {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "User-Agent": "AI-Power-Trade/1.0",
            }
        )

        if self.api_key:
            self.session.headers["x-soso-api-key"] = self.api_key

    @property
    def is_enabled(self) -> bool:
        return self.feature_enabled and bool(self.api_key)

    def get_status(self) -> Dict[str, Any]:
        """Return current client configuration status."""
        return {
            "enabled": self.is_enabled,
            "feature_enabled": self.feature_enabled,
            "has_api_key": bool(self.api_key),
            "base_url": self.base_url,
            "timeout_seconds": self.timeout_seconds,
        }

    def _build_cache_key(
        self,
        method: str,
        endpoint: str,
        params: Optional[Dict[str, Any]] = None,
        json_body: Optional[Dict[str, Any]] = None,
    ) -> str:
        return json.dumps(
            {
                "method": method.upper(),
                "endpoint": endpoint,
                "params": params or {},
                "json": json_body or {},
            },
            sort_keys=True,
        )

    def _normalize_params(self, params: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        normalized = {}
        for key, value in (params or {}).items():
            if value is None:
                continue
            if isinstance(value, list):
                normalized[key] = ",".join(str(item) for item in value)
            else:
                normalized[key] = value
        return normalized

    def _make_request(
        self,
        method: str,
        endpoint: str,
        params: Optional[Dict[str, Any]] = None,
        json_body: Optional[Dict[str, Any]] = None,
        cache_ttl: int = 0,
    ) -> Any:
        if not self.feature_enabled:
            raise SoSoValueAPIError("SoSoValue integration is disabled by ENABLE_SOSOVALUE")

        if not self.api_key:
            raise SoSoValueAPIError("SoSoValue API key is missing")

        normalized_params = self._normalize_params(params)
        cache_key = self._build_cache_key(method, endpoint, normalized_params, json_body)

        if cache_ttl > 0:
            cached_value = self.cache.get(cache_key)
            if cached_value is not None:
                return cached_value

        url = f"{self.base_url}{endpoint}"

        try:
            response = self.session.request(
                method=method.upper(),
                url=url,
                params=normalized_params or None,
                json=json_body,
                timeout=self.timeout_seconds,
            )
        except requests.exceptions.RequestException as exc:
            raise SoSoValueAPIError(f"SoSoValue request failed: {exc}") from exc

        if response.status_code == 401:
            raise SoSoValueAPIError("SoSoValue authentication failed", status_code=401)
        if response.status_code == 403:
            raise SoSoValueAPIError("SoSoValue permission denied", status_code=403)
        if response.status_code == 429:
            raise SoSoValueAPIError("SoSoValue rate limit reached", status_code=429)

        try:
            response.raise_for_status()
            payload = response.json()
        except ValueError as exc:
            raise SoSoValueAPIError("SoSoValue returned invalid JSON", status_code=response.status_code) from exc
        except requests.exceptions.RequestException as exc:
            raise SoSoValueAPIError(
                f"SoSoValue HTTP error: {response.status_code}",
                status_code=response.status_code,
            ) from exc

        if payload.get("code") not in (None, 0, "0"):
            raise SoSoValueAPIError(
                payload.get("msg") or "SoSoValue returned an error",
                status_code=response.status_code,
            )

        data = payload.get("data")
        if cache_ttl > 0:
            self.cache.set(cache_key, data, cache_ttl)

        return data

    def get_listed_currencies(self) -> List[Dict[str, Any]]:
        """Fetch all SoSoValue listed currencies."""
        data = self._make_request(
            method="POST",
            endpoint="/openapi/v1/data/default/coin/list",
            json_body={},
            cache_ttl=6 * 60 * 60,
        )
        return data or []

    def get_featured_news(
        self,
        page_num: int = 1,
        page_size: int = 10,
        category_list: Optional[List[int]] = None,
    ) -> Dict[str, Any]:
        """Fetch the general featured SoSoValue news feed."""
        return self._make_request(
            method="GET",
            endpoint="/api/v1/news/featured",
            params={
                "pageNum": page_num,
                "pageSize": page_size,
                "categoryList": category_list or self.DEFAULT_CATEGORY_LIST,
            },
            cache_ttl=5 * 60,
        ) or {}

    def get_featured_news_by_currency(
        self,
        currency_id: str,
        page_num: int = 1,
        page_size: int = 10,
        category_list: Optional[List[int]] = None,
    ) -> Dict[str, Any]:
        """Fetch the featured SoSoValue news feed for a specific currency."""
        return self._make_request(
            method="GET",
            endpoint="/api/v1/news/featured/currency",
            params={
                "currencyId": str(currency_id),
                "pageNum": page_num,
                "pageSize": page_size,
                "categoryList": category_list or self.DEFAULT_CATEGORY_LIST,
            },
            cache_ttl=5 * 60,
        ) or {}

    def get_current_etf_metrics(self, etf_type: str = "us-btc-spot") -> Dict[str, Any]:
        """Fetch current ETF data metrics for BTC or ETH spot ETFs."""
        return self._make_request(
            method="POST",
            endpoint="/openapi/v2/etf/currentEtfDataMetrics",
            json_body={"type": etf_type},
            cache_ttl=10 * 60,
        ) or {}


sosovalue_api = SoSoValueAPI()
