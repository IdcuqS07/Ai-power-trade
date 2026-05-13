"""
SoDEX market-data, account-read, and signed-order helpers.
"""

from __future__ import annotations

import json
import logging
import os
import re
import time
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation, ROUND_DOWN
from typing import Any, Dict, List, Optional

import requests
from eth_account import Account
from eth_account.messages import encode_typed_data
from web3 import Web3

logger = logging.getLogger(__name__)

SODEX_MAINNET_CHAIN_ID = 286623
SODEX_TESTNET_CHAIN_ID = 138565
SODEX_VERIFYING_CONTRACT = "0x0000000000000000000000000000000000000000"
SODEX_MAINNET_NETWORK_NAME = "ValueChain"
SODEX_MAINNET_RPC_URLS = ["https://mainnet.valuechain.xyz"]
SODEX_MAINNET_EXPLORER_URLS = ["https://main-scan.valuechain.xyz"]
SODEX_DEFAULT_NATIVE_SYMBOL = "SOSO"
SODEX_TYPED_DATA_TYPES = {
    "EIP712Domain": [
        {"name": "name", "type": "string"},
        {"name": "version", "type": "string"},
        {"name": "chainId", "type": "uint256"},
        {"name": "verifyingContract", "type": "address"},
    ],
    "ExchangeAction": [
        {"name": "payloadHash", "type": "bytes32"},
        {"name": "nonce", "type": "uint64"},
    ],
}
SPOT_BUY = 1
SPOT_SELL = 2
ORDER_TYPE_LIMIT = 1
ORDER_TYPE_MARKET = 2
TIME_IN_FORCE_GTC = 1
TIME_IN_FORCE_IOC = 3
PERPS_MODIFIER_NORMAL = 1
PERPS_POSITION_SIDE_BOTH = 1
RAW_SIGNATURE_HEX_LENGTH = 130
TYPED_SIGNATURE_HEX_LENGTH = 132
SODEX_STATE_DISCONNECTED = "DISCONNECTED"
SODEX_STATE_CONNECTED = "CONNECTED"
SODEX_STATE_SIMULATION_READY = "SIMULATION_READY"
SODEX_STATE_LIVE_READY = "LIVE_READY"
SODEX_STATE_DEGRADED = "DEGRADED"


class SoDEXService:
    def __init__(self) -> None:
        self.base_url = os.getenv("SODEX_API_URL", "").strip().rstrip("/")
        self.api_key = os.getenv("SODEX_API_KEY", "").strip()
        self.api_secret = os.getenv("SODEX_API_SECRET", "").strip()
        self.account_id = os.getenv("SODEX_ACCOUNT_ID", "").strip()
        self.timeout_seconds = float(os.getenv("SODEX_TIMEOUT_SECONDS", "12"))
        self.session = requests.Session()
        self.session.headers.update(
            {
                "Accept": "application/json",
                "User-Agent": "AI-Power-Trade/1.0",
            }
        )

    def is_available(self) -> bool:
        return bool(self.base_url)

    def get_market_type(self) -> Optional[str]:
        if not self.base_url:
            return None
        return "perps" if "/perps" in self.base_url else "spot"

    def is_testnet(self) -> bool:
        return "testnet" in self.base_url

    def get_signing_domain(self) -> Dict[str, Any]:
        market_type = self.get_market_type() or "spot"
        return {
            "name": "futures" if market_type == "perps" else "spot",
            "version": "1",
            "chainId": SODEX_TESTNET_CHAIN_ID if self.is_testnet() else SODEX_MAINNET_CHAIN_ID,
            "verifyingContract": SODEX_VERIFYING_CONTRACT,
        }

    @staticmethod
    def _split_env_urls(value: str) -> List[str]:
        return [item.strip() for item in str(value or "").split(",") if item.strip()]

    def get_signing_network_config(self) -> Optional[Dict[str, Any]]:
        if not self.is_available():
            return None

        signing_domain = self.get_signing_domain()
        chain_id = int(signing_domain.get("chainId"))
        is_mainnet = chain_id == SODEX_MAINNET_CHAIN_ID
        is_testnet = chain_id == SODEX_TESTNET_CHAIN_ID

        env_rpc_urls = self._split_env_urls(
            os.getenv("SODEX_SIGNING_RPC_URLS") or os.getenv("SODEX_SIGNING_RPC_URL")
        )
        env_explorer_urls = self._split_env_urls(
            os.getenv("SODEX_SIGNING_EXPLORER_URLS") or os.getenv("SODEX_SIGNING_EXPLORER_URL")
        )
        env_chain_name = os.getenv("SODEX_SIGNING_CHAIN_NAME", "").strip()
        env_native_symbol = os.getenv("SODEX_SIGNING_NATIVE_SYMBOL", "").strip()

        rpc_urls = (
            env_rpc_urls
            if env_rpc_urls
            else list(SODEX_MAINNET_RPC_URLS)
            if is_mainnet
            else []
        )
        explorer_urls = (
            env_explorer_urls
            if env_explorer_urls
            else list(SODEX_MAINNET_EXPLORER_URLS)
            if is_mainnet
            else []
        )
        default_chain_name = (
            SODEX_MAINNET_NETWORK_NAME if is_mainnet else "ValueChain Testnet" if is_testnet else "ValueChain"
        )
        chain_name = env_chain_name or default_chain_name
        native_symbol = env_native_symbol or SODEX_DEFAULT_NATIVE_SYMBOL

        return {
            "chainId": chain_id,
            "chainName": chain_name,
            "nativeCurrency": {
                "name": native_symbol,
                "symbol": native_symbol,
                "decimals": 18,
            },
            "rpcUrls": rpc_urls,
            "blockExplorerUrls": explorer_urls,
            "source": (
                "official_default"
                if is_mainnet and not env_rpc_urls and not env_explorer_urls and not env_chain_name and not env_native_symbol
                else "env"
                if env_rpc_urls or env_explorer_urls or env_chain_name or env_native_symbol
                else "derived"
            ),
        }

    @staticmethod
    def _build_health_check(status: str, label: str, message: str, **extra: Any) -> Dict[str, Any]:
        payload = {
            "status": status,
            "label": label,
            "message": message,
        }
        payload.update(extra)
        return payload

    def _probe_gateway_latency(self) -> Dict[str, Any]:
        if not self.is_available():
            return self._build_health_check(
                "UNAVAILABLE",
                "Unavailable",
                "Set SODEX_API_URL to enable gateway latency probes.",
                latencyMs=None,
                path=None,
            )

        probe_path = "/markets/tickers"
        started_at = time.perf_counter()

        try:
            response = self.session.get(
                f"{self.base_url}{probe_path}",
                params={},
                timeout=min(self.timeout_seconds, 2.5),
            )
            elapsed_ms = round((time.perf_counter() - started_at) * 1000, 1)

            if response.ok:
                status = "HEALTHY" if elapsed_ms <= 1200 else "DEGRADED"
                return self._build_health_check(
                    status,
                    f"{int(elapsed_ms)}ms",
                    "SoDEX gateway responded to the market-data probe.",
                    latencyMs=elapsed_ms,
                    path=probe_path,
                    httpStatus=response.status_code,
                )

            return self._build_health_check(
                "DEGRADED",
                f"HTTP {response.status_code}",
                "SoDEX gateway responded, but the latency probe did not complete cleanly.",
                latencyMs=elapsed_ms,
                path=probe_path,
                httpStatus=response.status_code,
            )
        except Exception as exc:
            elapsed_ms = round((time.perf_counter() - started_at) * 1000, 1)
            return self._build_health_check(
                "DEGRADED",
                "Probe failed",
                f"SoDEX gateway latency probe failed: {exc}",
                latencyMs=elapsed_ms,
                path=probe_path,
            )

    @staticmethod
    def _derive_state_machine(
        *,
        configured: bool,
        browser_signing_ready: bool,
        simulation_ready: bool,
        latency_status: str,
    ) -> Dict[str, Any]:
        normalized_latency = str(latency_status or "").upper()

        if not configured:
            state = SODEX_STATE_DISCONNECTED
            label = "Disconnected"
            description = "Backend routing is still in preview because SoDEX is not configured."
        elif normalized_latency == "DEGRADED":
            state = SODEX_STATE_DEGRADED
            label = "Degraded"
            description = "Gateway or signing health is degraded, so execution should stay conservative."
        elif browser_signing_ready:
            state = SODEX_STATE_LIVE_READY
            label = "Live Ready"
            description = "The backend can prepare browser-signed SoDEX orders."
        elif simulation_ready:
            state = SODEX_STATE_SIMULATION_READY
            label = "Simulation Ready"
            description = "SoDEX is configured and reachable. Execution route is simulation with live signing on standby."
        else:
            state = SODEX_STATE_CONNECTED
            label = "Connected"
            description = "SoDEX is reachable, but execution should stay in simulation until signing is fully armed."

        return {
            "state": state,
            "label": label,
            "description": description,
        }

    def get_service_status(self) -> Dict[str, Any]:
        market_type = self.get_market_type()
        configured = self.is_available()
        has_account_id = bool(self.account_id)
        has_env_api_key = bool(self.api_key)
        browser_signing_ready = configured and has_account_id
        signing_network = self.get_signing_network_config() if configured else None
        has_signing_rpc = bool(signing_network and signing_network.get("rpcUrls"))
        missing_requirements = []
        latency_check = self._probe_gateway_latency()

        if not configured:
            missing_requirements.append("SODEX_API_URL")

        if configured and not has_account_id:
            missing_requirements.append("SODEX_ACCOUNT_ID")

        if not configured:
            write_path = "not_configured"
            readiness_message = (
                "Set SODEX_API_URL and SODEX_ACCOUNT_ID in the backend to enable "
                "browser-signed SoDEX routing. The connected wallet address can be "
                "used as the API key."
            )
        elif not has_account_id:
            write_path = "account_id_required"
            readiness_message = (
                "Set SODEX_ACCOUNT_ID in the backend to enable browser-signed SoDEX "
                "routing. The connected wallet address can be used as the API key."
            )
        elif has_env_api_key:
            write_path = "browser_signed_ready"
            readiness_message = "Gateway and account ID are configured. "
            readiness_message += (
                "The connected wallet must match the configured SoDEX API key address before signing orders."
            )
        else:
            write_path = "browser_signed_ready"
            readiness_message = "Gateway and account ID are configured. "
            readiness_message += (
                "The connected wallet address will be used as the SoDEX API key during browser signing."
            )

        if browser_signing_ready and signing_network and not has_signing_rpc:
            readiness_message += (
                f" Wallets may need a manual switch to {signing_network['chainName']} "
                f"(chain ID {signing_network['chainId']}) unless SODEX_SIGNING_RPC_URL is configured."
            )

        simulation_ready = configured and not browser_signing_ready
        live_ready = browser_signing_ready and latency_check.get("status") != "DEGRADED"

        state_machine = self._derive_state_machine(
            configured=configured,
            browser_signing_ready=browser_signing_ready,
            simulation_ready=simulation_ready,
            latency_status=latency_check.get("status"),
        )

        execution_route = (
            "live"
            if live_ready
            else "simulation"
            if simulation_ready
            else "preview"
        )
        route_status = (
            "Live Ready"
            if live_ready
            else "Simulation"
            if simulation_ready
            else "Preview"
        )

        signing_check = self._build_health_check(
            "READY"
            if live_ready
            else "SIMULATION"
            if simulation_ready
            else "PREVIEW",
            "Active"
            if live_ready
            else "Ready"
            if simulation_ready
            else "Preview",
            "Typed-data signing payloads can be prepared."
            if browser_signing_ready
            else "Simulation signing is active; live signing stays on standby."
            if simulation_ready
            else "Signing is unavailable until SoDEX is configured.",
        )
        wallet_check = self._build_health_check(
            "CLIENT_REQUIRED" if configured else "UNAVAILABLE",
            "Ready" if configured else "Unavailable",
            "Wallet connectivity is verified in the browser runtime."
            if configured
            else "Browser wallet checks will stay disabled until SoDEX is configured.",
        )
        execution_engine = {
            "health": (
                "HEALTHY"
                if live_ready
                else "HEALTHY"
                if simulation_ready
                else "DEGRADED"
                if configured and latency_check.get("status") == "DEGRADED"
                else "STANDBY"
            ),
            "live_ready": live_ready,
            "simulation_ready": simulation_ready,
            "health_checks": {
                "wallet": wallet_check,
                "signing": signing_check,
                "latency": latency_check,
            },
            "last_checked_at": datetime.now(timezone.utc).isoformat(),
        }

        latency_ms = latency_check.get("latencyMs")

        return {
            "provider": "SoDEX",
            "configured": configured,
            "base_url": self.base_url or None,
            "market_type": market_type if self.base_url else None,
            "default_account_id": self.account_id or None,
            "api_key_configured": has_env_api_key,
            "api_key_mode": "env" if has_env_api_key else "browser_wallet",
            "browser_wallet_api_key_supported": True,
            "server_wallet_signing_available": bool(self.api_secret),
            "timeout_seconds": self.timeout_seconds,
            "write_path": write_path,
            "browser_signing_ready": browser_signing_ready,
            "can_prepare_order": browser_signing_ready,
            "missing_requirements": missing_requirements,
            "readiness_message": readiness_message,
            "signing_domain": self.get_signing_domain() if configured else None,
            "signing_network": signing_network,
            "state_machine": state_machine,
            "mode": execution_route,
            "route_status": route_status,
            "wallet_ready": configured,
            "wallet_address": None,
            "balance_ready": False,
            "atusdt_balance": None,
            "signing_ready": live_ready or simulation_ready,
            "latency_ms": latency_ms,
            "execution_ready": live_ready or simulation_ready,
            "simulation_ready": simulation_ready,
            "live_ready": live_ready,
            "execution_engine": execution_engine,
        }

    def _request(self, path: str, params: Optional[Dict[str, Any]] = None) -> Any:
        if not self.is_available():
            raise RuntimeError("SODEX_API_URL is not configured")

        response = self.session.get(
            f"{self.base_url}{path}",
            params=params or {},
            timeout=self.timeout_seconds,
        )
        response.raise_for_status()
        payload = response.json()

        if isinstance(payload, dict) and str(payload.get("code", "0")) not in {"0", "200", "None"}:
            raise RuntimeError(payload.get("error") or payload.get("message") or "SoDEX request failed")

        if isinstance(payload, dict) and "data" in payload:
            return payload.get("data")

        return payload

    def _submit_signed_request(
        self,
        method: str,
        path: str,
        body: Dict[str, Any],
        signature: str,
        nonce: int,
        api_key: Optional[str] = None,
    ) -> Any:
        if not self.is_available():
            raise RuntimeError("SODEX_API_URL is not configured")

        headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "X-API-Sign": self._normalize_signature(signature),
            "X-API-Nonce": str(int(nonce)),
        }

        resolved_api_key = (api_key or self.api_key).strip()
        if resolved_api_key:
            headers["X-API-Key"] = resolved_api_key

        response = self.session.request(
            method=method.upper(),
            url=f"{self.base_url}{path}",
            json=body,
            headers=headers,
            timeout=self.timeout_seconds,
        )
        response.raise_for_status()
        payload = response.json()

        if isinstance(payload, dict) and str(payload.get("code", "0")) not in {"0", "200", "None"}:
            raise RuntimeError(payload.get("error") or payload.get("message") or "SoDEX signed request failed")

        if isinstance(payload, dict) and "data" in payload:
            return payload.get("data")

        return payload

    def _with_account_id(self, params: Optional[Dict[str, Any]] = None, account_id: Optional[str] = None) -> Dict[str, Any]:
        merged = dict(params or {})
        resolved_account_id = account_id or self.account_id
        if resolved_account_id:
            merged["accountID"] = resolved_account_id
        return merged

    @staticmethod
    def _normalize_signature(signature: str) -> str:
        normalized = str(signature or "").strip()
        if not normalized:
            raise ValueError("Missing SoDEX signature")

        if not normalized.startswith("0x"):
            normalized = f"0x{normalized}"

        hex_body = normalized[2:]
        if not re.fullmatch(r"[0-9a-fA-F]+", hex_body):
            raise ValueError("SoDEX signature must be a hex string")

        if len(hex_body) == RAW_SIGNATURE_HEX_LENGTH:
            return f"0x01{hex_body}"

        if len(hex_body) == TYPED_SIGNATURE_HEX_LENGTH and hex_body.startswith("01"):
            return normalized

        raise ValueError("Unexpected SoDEX signature length")

    @classmethod
    def _extract_recoverable_signature(cls, signature: str) -> str:
        normalized = str(signature or "").strip()
        if not normalized:
            raise ValueError("Missing SoDEX signature")

        if not normalized.startswith("0x"):
            normalized = f"0x{normalized}"

        hex_body = normalized[2:]
        if not re.fullmatch(r"[0-9a-fA-F]+", hex_body):
            raise ValueError("SoDEX signature must be a hex string")

        if len(hex_body) == RAW_SIGNATURE_HEX_LENGTH:
            return normalized

        if len(hex_body) == TYPED_SIGNATURE_HEX_LENGTH and hex_body.startswith("01"):
            return f"0x{hex_body[2:]}"

        raise ValueError("Unexpected SoDEX signature length")

    def _build_exchange_action_typed_data(self, *, payload_hash: str, nonce: int) -> Dict[str, Any]:
        return {
            "types": SODEX_TYPED_DATA_TYPES,
            "domain": self.get_signing_domain(),
            "primaryType": "ExchangeAction",
            "message": {
                "payloadHash": payload_hash,
                "nonce": int(nonce),
            },
        }

    @staticmethod
    def _canonicalize_spot_order_item(item: Dict[str, Any]) -> Dict[str, Any]:
        canonical = {
            "symbolID": int(item["symbolID"]),
            "clOrdID": str(item["clOrdID"]),
            "side": int(item["side"]),
            "type": int(item["type"]),
            "timeInForce": int(item["timeInForce"]),
        }

        if item.get("price") not in {None, ""}:
            canonical["price"] = str(item["price"])

        if item.get("quantity") not in {None, ""}:
            canonical["quantity"] = str(item["quantity"])

        if item.get("funds") not in {None, ""}:
            canonical["funds"] = str(item["funds"])

        for optional_field in ("stopPrice", "stopType", "triggerType"):
            if item.get(optional_field) not in {None, ""}:
                canonical[optional_field] = item[optional_field]

        return canonical

    @staticmethod
    def _canonicalize_perps_order_item(item: Dict[str, Any]) -> Dict[str, Any]:
        canonical = {
            "clOrdID": str(item["clOrdID"]),
            "modifier": int(item["modifier"]),
            "side": int(item["side"]),
            "type": int(item["type"]),
            "timeInForce": int(item["timeInForce"]),
        }

        if item.get("price") not in {None, ""}:
            canonical["price"] = str(item["price"])

        if item.get("quantity") not in {None, ""}:
            canonical["quantity"] = str(item["quantity"])

        if item.get("funds") not in {None, ""}:
            canonical["funds"] = str(item["funds"])

        for optional_field in ("stopPrice", "stopType", "triggerType"):
            if item.get(optional_field) not in {None, ""}:
                canonical[optional_field] = item[optional_field]

        canonical["reduceOnly"] = bool(item.get("reduceOnly", False))
        canonical["positionSide"] = int(item["positionSide"])
        return canonical

    def _canonicalize_new_order_request_body(self, *, request_body: Dict[str, Any], endpoint_path: str) -> Dict[str, Any]:
        orders = request_body.get("orders")
        if not isinstance(orders, list) or not orders:
            raise ValueError("SoDEX request body must include at least one order")

        canonical_orders = []
        if endpoint_path == "/trade/orders/batch":
            for item in orders:
                canonical_orders.append(self._canonicalize_spot_order_item(item))
            return {
                "accountID": int(request_body["accountID"]),
                "orders": canonical_orders,
            }

        if endpoint_path == "/trade/orders":
            for item in orders:
                canonical_orders.append(self._canonicalize_perps_order_item(item))
            return {
                "accountID": int(request_body["accountID"]),
                "symbolID": int(request_body["symbolID"]),
                "orders": canonical_orders,
            }

        raise ValueError("Unsupported SoDEX endpoint path")

    def _build_new_order_signing_payload(self, *, request_body: Dict[str, Any], endpoint_path: str) -> Dict[str, Any]:
        return {
            "type": "newOrder",
            "params": self._canonicalize_new_order_request_body(
                request_body=request_body,
                endpoint_path=endpoint_path,
            ),
        }

    @staticmethod
    def _compute_payload_hash(payload: Dict[str, Any]) -> str:
        payload_json = json.dumps(payload, separators=(",", ":"))
        return Web3.keccak(text=payload_json).hex()

    def verify_prepared_order_signature(
        self,
        *,
        request_body: Dict[str, Any],
        signature: str,
        nonce: int,
        endpoint_path: str,
        expected_signer_address: str,
    ) -> Dict[str, Any]:
        payload = self._build_new_order_signing_payload(
            request_body=request_body,
            endpoint_path=endpoint_path,
        )
        payload_hash = self._compute_payload_hash(payload)
        typed_data = self._build_exchange_action_typed_data(
            payload_hash=payload_hash,
            nonce=nonce,
        )
        recoverable_signature = self._extract_recoverable_signature(signature)
        signable_message = encode_typed_data(full_message=typed_data)
        recovered_signer = Account.recover_message(
            signable_message,
            signature=recoverable_signature,
        )

        if recovered_signer.lower() != str(expected_signer_address).strip().lower():
            raise ValueError(
                "Submitted SoDEX signature does not match the expected API key signer address"
            )

        return {
            "payload_hash": payload_hash,
            "recovered_signer": recovered_signer,
            "typed_data": typed_data,
        }

    @staticmethod
    def _normalize_asset_code(value: Any) -> str:
        text = re.sub(r"[^A-Z0-9]+", "", str(value or "").upper())
        if text.startswith("V") and len(text) > 1:
            return text[1:]
        return text

    @classmethod
    def _normalize_market_symbol(cls, value: Any) -> str:
        raw_text = str(value or "").upper().replace("/", "_").replace("-", "_")
        parts = [part for part in raw_text.split("_") if part]
        normalized_parts = [cls._normalize_asset_code(part) for part in parts if part]

        if not normalized_parts:
            return ""

        return "_".join(normalized_parts)

    @classmethod
    def _symbol_variants(cls, value: Any) -> set[str]:
        normalized = cls._normalize_market_symbol(value)
        if not normalized:
            return set()
        return {normalized, normalized.replace("_", "")}

    @staticmethod
    def _decimal_from_value(value: Any, field_name: str) -> Decimal:
        try:
            decimal_value = Decimal(str(value))
        except (InvalidOperation, TypeError, ValueError) as exc:
            raise ValueError(f"{field_name} must be a valid decimal") from exc

        if decimal_value <= 0:
            raise ValueError(f"{field_name} must be greater than zero")

        return decimal_value

    @staticmethod
    def _apply_step(value: Decimal, step: Any) -> Decimal:
        if step in {None, "", 0, "0", "0.0"}:
            return value

        step_decimal = Decimal(str(step))
        if step_decimal <= 0:
            return value

        return (value / step_decimal).to_integral_value(rounding=ROUND_DOWN) * step_decimal

    @staticmethod
    def _apply_precision(value: Decimal, precision: Any) -> Decimal:
        if precision in {None, ""}:
            return value

        precision_int = int(precision)
        quantum = Decimal(1).scaleb(-precision_int)
        return value.quantize(quantum, rounding=ROUND_DOWN)

    @classmethod
    def _format_decimal_string(
        cls,
        value: Decimal,
        *,
        precision: Any = None,
        step: Any = None,
        field_name: str = "value",
    ) -> str:
        normalized = cls._apply_step(value, step)
        normalized = cls._apply_precision(normalized, precision)

        if normalized <= 0:
            raise ValueError(f"{field_name} became zero after SoDEX precision filters")

        text = format(normalized, "f")
        if "." in text:
            text = text.rstrip("0").rstrip(".")
        return text or "0"

    @staticmethod
    def _build_client_order_id(symbol: str) -> str:
        symbol_token = re.sub(r"[^A-Z0-9]+", "", str(symbol or "").upper())[:8] or "ORD"
        return f"APT-{symbol_token}-{int(datetime.now(timezone.utc).timestamp() * 1000)}"

    def resolve_symbol_metadata(self, symbol: str) -> Dict[str, Any]:
        target_variants = self._symbol_variants(symbol)
        target_asset = self._normalize_asset_code(symbol)

        if not target_variants and not target_asset:
            raise ValueError("Symbol is required")

        symbols = self.get_symbols()
        if not symbols:
            raise RuntimeError("SoDEX markets are unavailable")

        exact_matches = []
        base_matches = []
        fuzzy_matches = []

        for item in symbols:
            name_variants = self._symbol_variants(item.get("name"))
            display_variants = self._symbol_variants(item.get("displayName"))
            base_asset = self._normalize_asset_code(item.get("baseCoin"))
            quote_asset = self._normalize_asset_code(item.get("quoteCoin"))
            combined_variants = name_variants | display_variants

            if target_variants & combined_variants:
                exact_matches.append(item)
                continue

            if target_asset and target_asset == base_asset:
                base_matches.append(item)
                continue

            if target_asset and any(target_asset in variant for variant in combined_variants):
                fuzzy_matches.append(item)

        def candidate_key(item: Dict[str, Any]) -> tuple:
            quote_asset = self._normalize_asset_code(item.get("quoteCoin"))
            display_name = str(item.get("displayName") or item.get("name") or "")
            return (
                0 if quote_asset == "USDC" else 1,
                display_name,
            )

        candidates = exact_matches or base_matches or fuzzy_matches
        if not candidates:
            raise ValueError(f"Unable to map {symbol} to a SoDEX market")

        return sorted(candidates, key=candidate_key)[0]

    def prepare_order(
        self,
        *,
        symbol: str,
        trade_type: str,
        amount: float,
        price: float,
        wallet_address: Optional[str] = None,
        account_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        resolved_account_id = str(account_id or self.account_id or "").strip()
        if not resolved_account_id:
            raise ValueError("SODEX_ACCOUNT_ID is required for signed execution")

        resolved_wallet_address = str(wallet_address or "").strip()
        resolved_api_key = str(self.api_key or resolved_wallet_address).strip()

        if self.api_key and resolved_wallet_address and self.api_key.lower() != resolved_wallet_address.lower():
            raise ValueError(
                "Connected wallet must match the configured SODEX_API_KEY for browser-signed execution"
            )

        if not resolved_api_key:
            raise ValueError("Wallet address or SODEX_API_KEY is required for signed execution")

        symbol_meta = self.resolve_symbol_metadata(symbol)
        market_type = self.get_market_type() or "spot"
        trade_label = str(trade_type or "BUY").upper().strip()
        side = SPOT_SELL if trade_label in {"SELL", "SHORT"} else SPOT_BUY

        amount_decimal = self._decimal_from_value(amount, "amount")
        price_decimal = self._decimal_from_value(price, "price")
        price_string = self._format_decimal_string(
            price_decimal,
            precision=symbol_meta.get("pricePrecision"),
            step=symbol_meta.get("tickSize"),
            field_name="price",
        )
        client_order_id = self._build_client_order_id(symbol_meta.get("name") or symbol)
        quantity_precision = symbol_meta.get("quantityPrecision") or symbol_meta.get("baseCoinPrecision")
        quantity_step = symbol_meta.get("stepSize")
        quote_precision = symbol_meta.get("quoteCoinPrecision") or symbol_meta.get("pricePrecision")

        if market_type == "perps":
            endpoint_path = "/trade/orders"
            order_item: Dict[str, Any] = {
                "clOrdID": client_order_id,
                "modifier": PERPS_MODIFIER_NORMAL,
                "side": side,
                "type": ORDER_TYPE_MARKET,
                "timeInForce": TIME_IN_FORCE_IOC,
                "price": price_string,
            }
            estimated_quantity_decimal = amount_decimal / price_decimal

            if side == SPOT_BUY:
                order_item["funds"] = self._format_decimal_string(
                    amount_decimal,
                    precision=quote_precision,
                    field_name="funds",
                )
            else:
                order_item["quantity"] = self._format_decimal_string(
                    estimated_quantity_decimal,
                    precision=quantity_precision,
                    step=quantity_step,
                    field_name="quantity",
                )

            order_item["reduceOnly"] = False
            order_item["positionSide"] = PERPS_POSITION_SIDE_BOTH
            request_body = {
                "accountID": int(resolved_account_id),
                "symbolID": int(symbol_meta.get("id")),
                "orders": [order_item],
            }
        else:
            endpoint_path = "/trade/orders/batch"
            order_item = {
                "symbolID": int(symbol_meta.get("id")),
                "clOrdID": client_order_id,
                "side": side,
                "type": ORDER_TYPE_MARKET,
                "timeInForce": TIME_IN_FORCE_IOC,
                "price": price_string,
            }
            estimated_quantity_decimal = amount_decimal / price_decimal

            if side == SPOT_BUY:
                order_item["funds"] = self._format_decimal_string(
                    amount_decimal,
                    precision=quote_precision,
                    field_name="funds",
                )
            else:
                order_item["quantity"] = self._format_decimal_string(
                    estimated_quantity_decimal,
                    precision=quantity_precision,
                    step=quantity_step,
                    field_name="quantity",
                )

            request_body = {
                "accountID": int(resolved_account_id),
                "orders": [order_item],
            }

        payload = self._build_new_order_signing_payload(
            request_body=request_body,
            endpoint_path=endpoint_path,
        )
        nonce = int(datetime.now(timezone.utc).timestamp() * 1000)
        payload_hash = self._compute_payload_hash(payload)
        typed_data = self._build_exchange_action_typed_data(
            payload_hash=payload_hash,
            nonce=nonce,
        )

        return {
            "provider": "SoDEX",
            "market_type": market_type,
            "symbol": str(symbol).upper(),
            "symbol_name": symbol_meta.get("name"),
            "display_symbol": symbol_meta.get("displayName"),
            "wallet_address": resolved_wallet_address or None,
            "account_id": int(resolved_account_id),
            "endpoint_path": endpoint_path,
            "api_key": resolved_api_key,
            "api_key_source": "env" if self.api_key else "wallet_address",
            "required_signer_address": resolved_api_key,
            "request_body": request_body,
            "signing_payload": payload,
            "typed_data": typed_data,
            "nonce": nonce,
            "payload_hash": payload_hash,
            "cl_ord_id": client_order_id,
            "estimated_quantity": self._format_decimal_string(
                estimated_quantity_decimal,
                precision=quantity_precision,
                step=quantity_step,
                field_name="estimated_quantity",
            ),
            "estimated_notional": self._format_decimal_string(
                amount_decimal,
                precision=quote_precision,
                field_name="estimated_notional",
            ),
        }

    def submit_prepared_order(
        self,
        *,
        request_body: Dict[str, Any],
        signature: str,
        nonce: int,
        endpoint_path: str,
        api_key: Optional[str] = None,
    ) -> Any:
        if endpoint_path not in {"/trade/orders", "/trade/orders/batch"}:
            raise ValueError("Unsupported SoDEX endpoint path")

        resolved_api_key = str(api_key or self.api_key or "").strip()
        if not resolved_api_key:
            raise ValueError("SoDEX API key / signer address is required for signed execution")

        self.verify_prepared_order_signature(
            request_body=request_body,
            signature=signature,
            nonce=nonce,
            endpoint_path=endpoint_path,
            expected_signer_address=resolved_api_key,
        )

        return self._submit_signed_request(
            method="POST",
            path=endpoint_path,
            body=request_body,
            signature=signature,
            nonce=nonce,
            api_key=resolved_api_key,
        )

    def get_symbols(self, symbol: Optional[str] = None) -> List[Dict[str, Any]]:
        params = {"symbol": symbol} if symbol else None
        data = self._request("/markets/symbols", params=params)
        return data if isinstance(data, list) else []

    def get_tickers(self, symbol: Optional[str] = None) -> List[Dict[str, Any]]:
        params = {"symbol": symbol} if symbol else None
        data = self._request("/markets/tickers", params=params)
        return data if isinstance(data, list) else []

    def get_account_trades(
        self,
        user_address: str,
        symbol: Optional[str] = None,
        limit: int = 100,
        account_id: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        params = self._with_account_id(
            {
                "symbol": symbol,
                "limit": limit,
            },
            account_id=account_id,
        )
        data = self._request(f"/accounts/{user_address}/trades", params=params)
        return data if isinstance(data, list) else []

    def get_account_order_history(
        self,
        user_address: str,
        symbol: Optional[str] = None,
        limit: int = 50,
        account_id: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        params = self._with_account_id(
            {
                "symbol": symbol,
                "limit": limit,
            },
            account_id=account_id,
        )
        data = self._request(f"/accounts/{user_address}/orders/history", params=params)
        return data if isinstance(data, list) else []

    def normalize_history_items(self, items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        normalized = []

        for index, item in enumerate(items):
            symbol = str(item.get("symbol") or item.get("market") or item.get("instrument") or "").upper()
            side = str(item.get("side") or item.get("orderSide") or item.get("tradeSide") or "BUY").upper()
            price = float(item.get("price") or item.get("avgPrice") or item.get("tradePrice") or 0)
            quantity = float(item.get("quantity") or item.get("filledQuantity") or item.get("executedQty") or 0)
            funds = float(item.get("funds") or item.get("notional") or 0)
            amount = funds or (price * quantity if price and quantity else quantity)
            raw_timestamp = (
                item.get("tradeTime")
                or item.get("updateTime")
                or item.get("createdTime")
                or item.get("time")
                or item.get("timestamp")
            )

            if isinstance(raw_timestamp, (int, float)):
                timestamp = datetime.fromtimestamp(float(raw_timestamp) / 1000, tz=timezone.utc).isoformat()
            else:
                timestamp = str(raw_timestamp) if raw_timestamp else datetime.now(timezone.utc).isoformat()

            normalized.append(
                {
                    "trade_id": item.get("tradeID") or item.get("orderID") or item.get("id") or f"SODEX-{index + 1}",
                    "symbol": symbol or "UNKNOWN",
                    "type": side if side in {"BUY", "SELL"} else "BUY",
                    "amount": amount,
                    "price": price,
                    "profit_loss": float(item.get("realizedPnl") or item.get("pnl") or 0),
                    "status": item.get("status") or "Filled",
                    "timestamp": timestamp,
                    "tx_hash": item.get("txHash") or item.get("transactionHash"),
                    "source": "SoDEX",
                }
            )

        return normalized

    def claim_faucet(self, address: str) -> Dict[str, Any]:
        """Claim ETH from testnet faucet for SoDEX trading.

        For testnet networks, this requests native tokens from the official faucet.
        Mainnet networks do not have faucets.

        Args:
            address: The wallet address to receive faucet tokens

        Returns:
            Dict with status, message, and transaction details
        """
        if not self.is_available():
            return {
                "success": False,
                "status": "UNAVAILABLE",
                "message": "SoDEX service not configured. Set SODEX_API_URL.",
            }

        if not self.is_testnet():
            return {
                "success": False,
                "status": "NOT_APPLICABLE",
                "message": "Faucet is only available on testnet. Current network is mainnet.",
            }

        if not address or not Web3.is_address(address):
            return {
                "success": False,
                "status": "INVALID_ADDRESS",
                "message": "Invalid wallet address provided.",
            }

        try:
            checksum_address = Web3.to_checksum_address(address)

            faucet_url = "https://faucet.quicknode.com/linea/sepolia"
            payload = {"address": checksum_address}

            response = self.session.post(
                faucet_url,
                json=payload,
                timeout=30,
            )

            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    return {
                        "success": True,
                        "status": "CLAIMED",
                        "message": f"Successfully claimed testnet ETH for {checksum_address}",
                        "address": checksum_address,
                        "amount": data.get("amount", "0.01"),
                        "tx_hash": data.get("transactionHash") or data.get("txHash"),
                        "faucet_url": faucet_url,
                    }

            if response.status_code == 429:
                return {
                    "success": False,
                    "status": "RATE_LIMITED",
                    "message": "You have already claimed from the faucet. Please wait before claiming again.",
                    "address": checksum_address,
                }

            if response.status_code == 400:
                return {
                    "success": False,
                    "status": "ALREADY_CLAIMED",
                    "message": "Address has already received faucet funds recently.",
                    "address": checksum_address,
                }

            return {
                "success": False,
                "status": "FAUCET_ERROR",
                "message": f"Faucet request failed with status {response.status_code}: {response.text}",
                "address": checksum_address,
            }

        except requests.exceptions.Timeout:
            return {
                "success": False,
                "status": "TIMEOUT",
                "message": "Faucet request timed out. The service may be busy.",
                "address": address,
            }
        except Exception as e:
            logger.error(f"Faucet claim failed: {e}")
            return {
                "success": False,
                "status": "ERROR",
                "message": f"Faucet claim failed: {str(e)}",
                "address": address,
            }

    def get_faucet_info(self) -> Dict[str, Any]:
        """Get faucet information for the current network.

        Returns:
            Dict with faucet availability, URL, and network details
        """
        if not self.is_available():
            return {
                "available": False,
                "status": "UNAVAILABLE",
                "message": "SoDEX service not configured.",
            }

        network_config = self.get_signing_network_config()
        chain_id = network_config.get("chainId") if network_config else 0
        is_testnet = self.is_testnet()

        return {
            "available": is_testnet,
            "status": "AVAILABLE" if is_testnet else "NOT_APPLICABLE",
            "is_testnet": is_testnet,
            "chain_id": chain_id,
            "chain_name": network_config.get("chainName", "Unknown") if network_config else "Unknown",
            "faucet_url": "https://faucet.quicknode.com/linea/sepolia" if is_testnet else None,
            "message": (
                "Testnet faucet available for Linea Sepolia ETH."
                if is_testnet
                else "No faucet available on mainnet."
            ),
        }


sodex_service = SoDEXService()
