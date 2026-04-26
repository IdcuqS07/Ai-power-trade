"""
Simple TTL cache helpers for SoSoValue integration.
"""

from __future__ import annotations

import threading
import time
from typing import Any, Dict, Optional


class TTLCache:
    """Thread-safe in-memory TTL cache."""

    def __init__(self) -> None:
        self._values: Dict[str, Any] = {}
        self._expires_at: Dict[str, float] = {}
        self._lock = threading.Lock()

    def get(self, key: str) -> Optional[Any]:
        now = time.time()

        with self._lock:
            expires_at = self._expires_at.get(key)
            if expires_at is None:
                return None

            if expires_at <= now:
                self._values.pop(key, None)
                self._expires_at.pop(key, None)
                return None

            return self._values.get(key)

    def set(self, key: str, value: Any, ttl_seconds: int) -> Any:
        with self._lock:
            self._values[key] = value
            self._expires_at[key] = time.time() + ttl_seconds
        return value

    def clear(self) -> None:
        with self._lock:
            self._values.clear()
            self._expires_at.clear()
