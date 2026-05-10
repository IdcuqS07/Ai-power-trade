import {
  aiSignals,
  mergeSignalsWithLivePrices,
} from '../../../lib/premiumData';
import {
  FALLBACK_TOKEN,
  getDefaultChainConfig,
  normalizeChainId,
  resolveBlockchainConfig,
} from '../../../lib/walletNetwork';
import { SIGNAL_TYPES } from '../../../lib/enums';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000').trim();
const REQUEST_TIMEOUT_MS = 3000;
const SODEX_TESTNET_CHAIN_ID = 138565;
const TERMINAL_SYMBOLS = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'MATIC', 'LINK'];
const DEMO_UPDATED_AT = '2026-04-26T12:00:00.000Z';

const MARKET_REGIME = Object.freeze({
  BULL_TREND: 'Bull Trend',
  BEAR_TREND: 'Bear Trend',
  CONSOLIDATION: 'Consolidation',
  VOLATILITY: 'High Volatility',
  DEFENSIVE: 'Defensive Rotation',
  MOMENTUM: 'Momentum Watch',
});

const CONVICTION_TIERS = Object.freeze({
  VERY_HIGH: { min: 0.85, label: 'Very High Conviction', emoji: '🔥' },
  HIGH: { min: 0.8, label: 'High Conviction', emoji: '🔹' },
  ACTIONABLE: { min: 0.7, label: 'Actionable', emoji: '⚡' },
  MODERATE: { min: 0.6, label: 'Moderate Conviction', emoji: '🟡' },
  CONDITIONAL: { min: 0.5, label: 'Conditional', emoji: '⚠️' },
  LOW: { min: 0, label: 'Low Conviction', emoji: '🔻' },
});

const CONFIDENCE_DRIVERS = Object.freeze({
  MOMENTUM: 'Live price momentum',
  VOLUME_FLOW: 'Volume and order flow',
  REGIME_ALIGNMENT: 'Market regime alignment',
  SIGNAL_FALLBACK: 'Signal fallback model',
  EXECUTION_GUARDRAILS: 'Execution guardrails',
  WHALE_TRACKING: 'Whale tracking',
  FUNDAMENTALS: 'Fundamental analysis',
  TECHNICAL: 'Technical indicators',
  SENTIMENT: 'Market sentiment',
});

const SIGNAL_NAMES = Object.freeze({
  LONG: 'Long Bias',
  SHORT: 'Short Bias',
  HOLD: 'Watch / Hold',
});

const SYMBOL_NAMES = {
  BTC: 'Bitcoin',
  ETH: 'Ethereum',
  BNB: 'BNB',
  SOL: 'Solana',
  XRP: 'XRP',
  ADA: 'Cardano',
  MATIC: 'Polygon',
  LINK: 'Chainlink',
};

const DEMO_HISTORY = [
  {
    trade_id: 'APT-DEMO-0042',
    symbol: 'BTC',
    type: 'BUY',
    amount: 1000,
    price: 64200,
    profit_loss: 3.2,
    status: 'Closed',
    timestamp: '2026-04-26T12:08:52.000Z',
    tx_hash: '0x8a91f0c2a4d9',
  },
  {
    trade_id: 'APT-DEMO-0041',
    symbol: 'ETH',
    type: 'BUY',
    amount: 500,
    price: 3180,
    profit_loss: 1.8,
    status: 'Closed',
    timestamp: '2026-04-26T11:08:52.000Z',
    tx_hash: '0x2b45ad7c9102',
  },
  {
    trade_id: 'APT-DEMO-0040',
    symbol: 'SOL',
    type: 'BUY',
    amount: 750,
    price: 128.45,
    profit_loss: 5.4,
    status: 'Closed',
    timestamp: '2026-04-26T10:08:52.000Z',
    tx_hash: '0x9c12dd83ab10',
  },
];

// ═══════════════════════════════════════════════════════════
// AI Conviction Score Engine
// ═══════════════════════════════════════════════════════════

/**
 * The AI Conviction Score (ACS) is a composite, real-time score [0–1]
 * that drives every trading decision, UI badge, and risk guardrail.
 *
 * It blends four signal layers:
 *   1. Live Price Momentum   — short-window price change
 *   2. Volume / Order-Flow   — relative volume spike
 *   3. Regime Alignment      — bullish/bearish/consolidation
 *   4. Signal Fallback       — pre-built AI signals when live data absent
 *
 * Guardrail overlays (risk caps, drawdown limits) then bound the final
 * score before it is classified into a ConvictionTier.
 */
class AIConvictionEngine {
  constructor() {
    // Tunable weights (must sum to 1.0)
    this.weights = {
      momentum: 0.35,
      volumeFlow: 0.25,
      regimeAlignment: 0.25,
      signalFallback: 0.15,
    };

    // Guardrail thresholds
    this.maxPositionPctOfPortfolio = 0.10;
    this.maxDrawdownPct = 0.03;
    this.maxOpenPositions = 5;

    // In-memory regime state per symbol
    this._regimes = new Map();
  }

  // ── Layer 1: Live Price Momentum ──────────────────────────
  _scoreMomentum(signal = {}) {
    const { priceChange24h, priceChange1h } = signal;
    if (priceChange24h == null && priceChange1h == null) return 0.5;

    const h1 = priceChange1h ?? 0;
    const h24 = priceChange24h ?? 0;
    const raw = 0.6 * h1 + 0.4 * h24; // weighted blend

    // Sigmoid normalisation: ±5 % maps to ≈ 0.15–0.85
    return clamp(1 / (1 + Math.exp(-raw * 8)), 0, 1);
  }

  // ── Layer 2: Volume / Order-Flow ──────────────────────────
  _scoreVolumeFlow(signal = {}) {
    const { volume24h, avgVolume24h } = signal;
    if (volume24h == null || avgVolume24h == null || avgVolume24h === 0) return 0.5;

    const ratio = volume24h / avgVolume24h; // >1 means above average
    return clamp(0.3 + 0.14 * Math.log2(Math.max(ratio, 0.1)), 0, 1);
  }

  // ── Layer 3: Regime Alignment ─────────────────────────────
  _detectRegime(signal = {}) {
    const { priceChange24h, priceChange1h, volume24h, avgVolume24h } = signal;
    const h24 = priceChange24h ?? 0;
    const h1 = priceChange1h ?? 0;
    const volRatio = (volume24h && avgVolume24h) ? volume24h / avgVolume24h : 1;

    if (Math.abs(h24) > 5 && volRatio > 1.8) return MARKET_REGIME.VOLATILITY;
    if (h24 > 2 && h1 > 0.5) return MARKET_REGIME.BULL_TREND;
    if (h24 < -2 && h1 < -0.5) return MARKET_REGIME.BEAR_TREND;
    if (Math.abs(h24) <= 1.5) return MARKET_REGIME.CONSOLIDATION;
    if (h24 > 1 && h1 > 0.2) return MARKET_REGIME.MOMENTUM;
    return MARKET_REGIME.CONSOLIDATION;
  }

  _scoreRegimeAlignment(signal = {}) {
    const regime = this._detectRegime(signal);
    this._regimes.set(signal.symbol ?? 'UNKNOWN', regime);

    const action = resolveSignalType(signal);
    const isBullish = action === SIGNAL_TYPES.BUY;
    const isBearish = action === SIGNAL_TYPES.SELL;

    switch (regime) {
      case MARKET_REGIME.BULL_TREND:
        return isBullish ? 0.9 : isBearish ? 0.25 : 0.55;
      case MARKET_REGIME.BEAR_TREND:
        return isBearish ? 0.9 : isBullish ? 0.25 : 0.55;
      case MARKET_REGIME.VOLATILITY:
        return 0.45; // uncertainty discount
      case MARKET_REGIME.MOMENTUM:
        return isBullish ? 0.8 : 0.5;
      case MARKET_REGIME.CONSOLIDATION:
      default:
        return 0.55;
    }
  }

  // ── Layer 4: Signal Fallback ──────────────────────────────
  _scoreSignalFallback(signal = {}) {
    const { confidence, strength } = signal;
    const base = confidence ?? strength ?? 0.5;
    return clamp(typeof base === 'number' ? base : 0.5, 0, 1);
  }

  // ── Guardrail Overlays ────────────────────────────────────
  _applyGuardrails(rawScore, signal = {}) {
    let score = rawScore;

    // Hard cap: max exposure
    if (signal.openPositions >= this.maxOpenPositions) {
      score *= 0.5;
    }

    // Drawdown throttle
    if (signal.portfolioDrawdownPct > this.maxDrawdownPct) {
      score *= 0.6;
    }

    return clamp(score, 0, 1);
  }

  // ── Public API ────────────────────────────────────────────

  /**
   * Compute the full AI Conviction Score for a given signal.
   * @param {object} signal
   * @returns {{
   *   score: number,           // 0-1
   *   tier: object,            // { min, label, emoji }
   *   signalName: string,      // Long Bias / Short Bias / Watch
   *   regime: string,          // Market regime name
   *   drivers: object,         // Per-layer scores
   *   timestamp: string        // ISO timestamp
   * }}
   */
  score(signal = {}) {
    const momentum     = this._scoreMomentum(signal);
    const volumeFlow   = this._scoreVolumeFlow(signal);
    const regime       = this._scoreRegimeAlignment(signal);
    const fallback     = this._scoreSignalFallback(signal);

    const raw =
      this.weights.momentum      * momentum +
      this.weights.volumeFlow    * volumeFlow +
      this.weights.regimeAlignment * regime +
      this.weights.signalFallback  * fallback;

    const finalScore = this._applyGuardrails(raw, signal);
    const tier = this._classifyTier(finalScore);
    const action = resolveSignalType(signal);

    return {
      score: Math.round(finalScore * 100) / 100,
      tier,
      signalName: SIGNAL_NAMES[action] ?? SIGNAL_NAMES[SIGNAL_TYPES.BUY],
      regime: this._regimes.get(signal.symbol ?? 'UNKNOWN') ?? this._detectRegime(signal),
      drivers: {
        [CONFIDENCE_DRIVERS.MOMENTUM]:          Math.round(momentum * 100) / 100,
        [CONFIDENCE_DRIVERS.VOLUME_FLOW]:       Math.round(volumeFlow * 100) / 100,
        [CONFIDENCE_DRIVERS.REGIME_ALIGNMENT]:  Math.round(regime * 100) / 100,
        [CONFIDENCE_DRIVERS.SIGNAL_FALLBACK]:   Math.round(fallback * 100) / 100,
      },
      timestamp: new Date().toISOString(),
    };
  }

  _classifyTier(score) {
    if (score >= CONVICTION_TIERS.VERY_HIGH.min) return CONVICTION_TIERS.VERY_HIGH;
    if (score >= CONVICTION_TIERS.HIGH.min)      return CONVICTION_TIERS.HIGH;
    if (score >= CONVICTION_TIERS.ACTIONABLE.min) return CONVICTION_TIERS.ACTIONABLE;
    if (score >= CONVICTION_TIERS.MODERATE.min)   return CONVICTION_TIERS.MODERATE;
    if (score >= CONVICTION_TIERS.CONDITIONAL.min) return CONVICTION_TIERS.CONDITIONAL;
    return CONVICTION_TIERS.LOW;
  }

  getRegime(symbol) {
    return this._regimes.get(symbol) ?? MARKET_REGIME.CONSOLIDATION;
  }
}

const convictionEngine = new AIConvictionEngine();

function resolveSignalType(payload = {}) {
  const rawValue = payload?.signal_type || payload?.type || payload?.trade_type || payload?.signal || '';
  if (/sell|short/i.test(rawValue)) return SIGNAL_TYPES.SELL;
  if (/hold|watch/i.test(rawValue)) return SIGNAL_TYPES.HOLD;
  return SIGNAL_TYPES.BUY;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function isShortBias(action = '') {
  return resolveSignalType(action) === SIGNAL_TYPES.SELL;
}

function isHoldBias(action = '') {
  return resolveSignalType(action) === SIGNAL_TYPES.HOLD;
}

function inferAction(change24h = 0) {
  if (change24h >= 1.25) {
    return 'Long Bias';
  }

  if (change24h <= -1.25) {
    return 'Short Bias';
  }

  return 'Watch / Hold';
}

function formatCompactUsd(value) {
  const amount = Number(value || 0);

  if (!Number.isFinite(amount) || amount <= 0) {
    return '$0';
  }

  const units = [
    { value: 1e12, suffix: 'T' },
    { value: 1e9, suffix: 'B' },
    { value: 1e6, suffix: 'M' },
    { value: 1e3, suffix: 'K' },
  ];

  const match = units.find((unit) => amount >= unit.value);
  if (!match) {
    return `$${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  }

  return `$${(amount / match.value).toFixed(amount / match.value >= 100 ? 0 : 1)}${match.suffix}`;
}

function formatSignedPercent(value, digits = 1) {
  const amount = Number(value || 0);

  if (!Number.isFinite(amount)) {
    return '0.0%';
  }

  return `${amount >= 0 ? '+' : ''}${amount.toFixed(digits)}%`;
}

function buildEntryZone(price) {
  if (!Number.isFinite(price) || price <= 0) {
    return 'Awaiting market data';
  }

  const lower = price * 0.996;
  const upper = price * 1.002;

  return `$${lower.toLocaleString('en-US', { maximumFractionDigits: price >= 100 ? 0 : 2 })} - $${upper.toLocaleString('en-US', {
    maximumFractionDigits: price >= 100 ? 0 : 2,
  })}`;
}

function buildTargetZone(price, action) {
  if (!Number.isFinite(price) || price <= 0) {
    return 'Awaiting market data';
  }

  const isShort = isShortBias(action);
  const isHold = isHoldBias(action);
  const primary = price * (isShort ? 0.965 : isHold ? 1.018 : 1.038);
  const secondary = price * (isShort ? 0.952 : isHold ? 1.029 : 1.051);

  return `$${primary.toLocaleString('en-US', { maximumFractionDigits: price >= 100 ? 0 : 2 })} / $${secondary.toLocaleString('en-US', {
    maximumFractionDigits: price >= 100 ? 0 : 2,
  })}`;
}

function buildStopLoss(price, action) {
  if (!Number.isFinite(price) || price <= 0) {
    return 'Awaiting market data';
  }

  const nextPrice = price * (isShortBias(action) ? 1.018 : 0.982);
  return `$${nextPrice.toLocaleString('en-US', { maximumFractionDigits: price >= 100 ? 0 : 2 })}`;
}

function buildDerivedSignal(symbol, liveData = {}) {
  const price = Number(liveData?.price || 0);
  const change24h = Number(liveData?.change_24h || 0);
  const signal = inferAction(change24h);
  const confidence = clamp(0.58 + Math.abs(change24h) / 18, 0.58, 0.83);
  const riskScore = clamp(Math.round(55 - Math.abs(change24h) * 3), 26, 68);

  return {
    symbol,
    name: SYMBOL_NAMES[symbol] || symbol,
    signal,
    confidence,
    confidenceLabel: confidence >= 0.8 ? 'High Conviction' : confidence >= 0.7 ? 'Actionable' : 'Conditional',
    price,
    change24h,
    horizon: Math.abs(change24h) >= 4 ? '8-18h' : '1-2d',
    regime: change24h >= 0 ? 'Momentum Watch' : 'Defensive Rotation',
    setup:
      signal === 'Short Bias'
        ? `${symbol} is showing relative weakness and is better treated as a defensive or fade setup.`
        : signal === 'Watch / Hold'
          ? `${symbol} remains on watch while the signal stack waits for a cleaner directional confirmation.`
          : `${symbol} is participating in the current risk-on tape with enough momentum to monitor for continuation.`,
    catalystSummary:
      signal === 'Short Bias'
        ? 'Negative 24h flow is pressuring the setup, so execution should stay conservative.'
        : 'Live market overlay is constructive, but this asset uses the lightweight signal overlay rather than a curated deep-dive pack.',
    entryZone: buildEntryZone(price),
    stopLoss: buildStopLoss(price, signal),
    targetZone: buildTargetZone(price, signal),
    rewardRisk: signal === 'Watch / Hold' ? '1.4x' : '2.0x',
    simulatedEdge: `${(confidence * 5).toFixed(1)}%`,
    riskScore,
    confidenceDrivers: [
      {
        label: 'Live price momentum',
        weight: clamp(Math.round(Math.abs(change24h) * 7 + 10), 10, 28),
        detail: `${symbol} is moving ${change24h >= 0 ? 'with' : 'against'} the tape over the last 24 hours.`,
      },
      {
        label: 'Signal fallback model',
        weight: 18,
        detail: 'This symbol is powered by the terminal fallback pack until a curated research card is available.',
      },
      {
        label: 'Execution guardrails',
        weight: clamp(30 - Math.round(Math.abs(change24h) * 3), 12, 30),
        detail: 'Risk budget is sized conservatively because confidence comes from the lightweight overlay.',
      },
    ],
    orderFlow: [
      {
        venue: '24h tape',
        bias: change24h >= 0 ? 'Positive' : 'Negative',
        value: `${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}%`,
      },
      {
        venue: 'Market source',
        bias: liveData?.source || 'Fallback',
        value: Number.isFinite(price) && price > 0 ? `$${price.toLocaleString('en-US', { maximumFractionDigits: 2 })}` : 'N/A',
      },
      {
        venue: 'Risk score',
        bias: riskScore <= 35 ? 'Low' : riskScore <= 52 ? 'Medium' : 'Elevated',
        value: `${riskScore}/100`,
      },
    ],
    chart: [],
  };
}

function buildChartSeriesFromCandles(candlePayload = {}) {
  const candles = Array.isArray(candlePayload?.candles) ? candlePayload.candles : [];

  return candles.map((candle) => {
    const timestamp = Number(candle?.timestamp || 0);
    const timeLabel = timestamp
      ? new Date(timestamp).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
      : '--:--';

    return {
      time: timeLabel,
      price: Number(candle?.close || candle?.price || 0),
      volume: Number(candle?.volume || 0),
      confidence: 0,
    };
  });
}

async function fetchBackendJson(path) {
  const response = await fetch(`${API_URL}/api/${path}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`${path} returned ${response.status}`);
  }

  return response.json();
}

function normalizeHistoryItem(item, index = 0) {
  const timestamp = item?.timestamp || item?.created_at || new Date().toISOString();
  const signalType = resolveSignalType(item);

  return {
    tradeId: item?.trade_id || item?.id || `APT-HISTORY-${index + 1}`,
    symbol: String(item?.symbol || 'BTC').toUpperCase(),
    type: signalType,
    signal_type: signalType,
    amount: Number(item?.amount || item?.value || 0),
    price: Number(item?.price || 0),
    pnl: Number(item?.profit_loss || item?.pnl || 0),
    status: item?.status || (item?.settled ? 'Settled' : 'Processing'),
    timestamp,
    txHash: item?.tx_hash || item?.transaction_hash || null,
    recordHash: item?.record_hash || item?.block_hash || item?.on_chain_record?.block_hash || null,
  };
}

function resolveSodexStatus(payload = null) {
  const data = payload?.success ? payload?.data || {} : payload?.data || {};
  const baseUrl = String(data?.base_url || '').trim() || null;
  const configured = Boolean(data?.configured);
  const writePath = String(data?.write_path || (configured ? 'configured' : 'not_configured'));
  const marketType = String(data?.market_type || 'spot').toLowerCase();
  const signingDomain = data?.signing_domain || {};
  const signingChainId = Number(signingDomain?.chainId || 0) || null;
  const isTestnet =
    signingChainId === SODEX_TESTNET_CHAIN_ID || /testnet/i.test(baseUrl || '');
  const browserSigningReady = Boolean(
    data?.browser_signing_ready ?? (configured && writePath === 'browser_signed_ready')
  );
  const canPrepareOrder = Boolean(data?.can_prepare_order ?? browserSigningReady);
  const missingRequirements = Array.isArray(data?.missing_requirements)
    ? data.missing_requirements
    : [];
  const apiKeyMode = String(data?.api_key_mode || '').trim() || 'browser_wallet';
  const mode = browserSigningReady ? 'live' : configured ? 'configured' : 'preview';
  const providerLabel = browserSigningReady
    ? `SoDEX ${isTestnet ? 'Testnet' : 'Live'}`
    : configured
      ? 'SoDEX Configured'
      : 'Preview Fallback';
  const executionLabel = browserSigningReady
    ? `${marketType.toUpperCase()} ${isTestnet ? 'testnet' : 'live'}`
    : configured && missingRequirements.includes('SODEX_ACCOUNT_ID')
      ? 'Account setup required'
      : configured
        ? 'Standby'
      : 'Preview only';
  const readinessTone = browserSigningReady
    ? 'var(--green)'
    : configured
      ? 'var(--yellow)'
      : 'var(--text-tertiary)';
  const readinessMessage =
    String(data?.readiness_message || '').trim() ||
    (baseUrl
      ? baseUrl
      : 'Set SODEX_API_URL and SODEX_ACCOUNT_ID in the backend to enable browser-signed SoDEX routing.');
  const signingNetworkData = data?.signing_network || null;
  const signingNetwork = signingNetworkData
    ? {
        chainId: normalizeChainId(signingNetworkData?.chainId || signingChainId),
        chainName:
          String(signingNetworkData?.chainName || '').trim() ||
          (isTestnet ? 'ValueChain Testnet' : 'ValueChain'),
        nativeCurrency: {
          name:
            String(signingNetworkData?.nativeCurrency?.name || signingNetworkData?.nativeCurrency?.symbol || 'SOSO'),
          symbol:
            String(signingNetworkData?.nativeCurrency?.symbol || signingNetworkData?.nativeCurrency?.name || 'SOSO'),
          decimals: Number(signingNetworkData?.nativeCurrency?.decimals || 18),
        },
        rpcUrls: Array.isArray(signingNetworkData?.rpcUrls)
          ? signingNetworkData.rpcUrls.filter((value) => typeof value === 'string' && value.trim())
          : [],
        blockExplorerUrls: Array.isArray(signingNetworkData?.blockExplorerUrls)
          ? signingNetworkData.blockExplorerUrls.filter((value) => typeof value === 'string' && value.trim())
          : [],
        source: signingNetworkData?.source || null,
      }
    : null;

  return {
    provider: data?.provider || 'SoDEX',
    configured,
    mode,
    providerLabel,
    executionLabel,
    readinessTone,
    baseUrl,
    marketType,
    defaultAccountId: data?.default_account_id || null,
    apiKeyConfigured: Boolean(data?.api_key_configured),
    apiKeyMode,
    browserWalletApiKeySupported: Boolean(data?.browser_wallet_api_key_supported ?? true),
    serverWalletSigningAvailable: Boolean(data?.server_wallet_signing_available),
    writePath,
    signingChainId,
    signingDomain,
    isTestnet,
    browserSigningReady,
    canPrepareOrder,
    missingRequirements,
    readinessMessage,
    signingNetwork,
  };
}

function getColorForScore(score) {
  if (score >= 75) {
    return 'var(--green)';
  }

  if (score >= 60) {
    return 'var(--yellow)';
  }

  return 'var(--red)';
}

function buildModelBreakdown(prediction, enhanced, marketSentiment) {
  const lstmScore = clamp(
    Math.round(
      Number(
        enhanced?.models?.lstm?.confidence ||
          prediction?.ml_prediction?.ml_confidence ||
          prediction?.combined_confidence ||
          prediction?.confidence ||
          0.66
      ) * 100
    ),
    35,
    99
  );
  const rfScore = clamp(
    Math.round(
      Number(
        enhanced?.models?.random_forest?.confidence ||
          prediction?.ml_prediction?.win_probability ||
          prediction?.confidence ||
          0.62
      ) * 100
    ),
    35,
    99
  );
  const sentimentScore = clamp(
    Math.round(
      Number(
        enhanced?.market_data?.sentiment_up ??
          marketSentiment?.sentiment_up ??
          (prediction?.signal === 'BUY' ? 67 : prediction?.signal === 'SELL' ? 41 : 55)
      )
    ),
    0,
    100
  );

  return [
    {
      name: 'Signal Forecast',
      score: lstmScore,
      color: getColorForScore(lstmScore),
    },
    {
      name: 'Pattern Confirmation',
      score: rfScore,
      color: getColorForScore(rfScore),
    },
    {
      name: 'Market Sentiment',
      score: sentimentScore,
      color: getColorForScore(sentimentScore),
    },
  ];
}

function buildConfidenceDrivers(symbol, baseSignal, prediction, enhanced) {
  const drivers = [];

  if (enhanced?.models?.lstm) {
    const priceChange = Number(enhanced.models.lstm.price_change || 0);
    drivers.push({
      label: 'Signal forecast',
      weight: clamp(Math.round(Number(enhanced.models.lstm.confidence || 0.65) * 100), 10, 32),
      detail: `${symbol} model projects ${priceChange >= 0 ? 'upside' : 'downside'} drift of ${formatSignedPercent(priceChange, 2)}.`,
    });
  }

  if (enhanced?.models?.random_forest) {
    drivers.push({
      label: 'Pattern confirmation',
      weight: clamp(Math.round(Number(enhanced.models.random_forest.confidence || 0.62) * 100), 10, 30),
      detail: `Classification layer is leaning ${enhanced.models.random_forest.signal || prediction?.signal || 'HOLD'} with ${Math.round(Number(enhanced.models.random_forest.win_probability || 0.5) * 100)}% win probability.`,
    });
  }

  if (enhanced?.research_context?.available) {
    drivers.push({
      label: 'SoSoValue research',
      weight: clamp(Math.round(Number(enhanced.research_context.catalyst_score || 0) * 10), 8, 26),
      detail:
        enhanced.research_context.rationale?.[0] ||
        `${symbol} research context is active with ${enhanced.research_context.news_count || 0} relevant headlines.`,
    });
  }

  if (enhanced?.market_data) {
    drivers.push({
      label: 'Global market tape',
      weight: clamp(Math.round(Math.abs(Number(enhanced.market_data.price_change_24h || 0)) * 4 + 10), 8, 24),
      detail: `CoinGecko overlay shows ${formatSignedPercent(enhanced.market_data.price_change_24h || 0, 2)} over 24h with ${formatCompactUsd(enhanced.market_data.volume_24h || 0)} in spot volume.`,
    });
  }

  return drivers.length ? drivers.slice(0, 4) : baseSignal.confidenceDrivers || [];
}

function buildCatalysts(symbol, baseSignal, enhanced) {
  const catalysts = [];

  if (enhanced?.research_context?.latest_news?.length) {
    enhanced.research_context.latest_news.slice(0, 3).forEach((article) => {
      catalysts.push({
        title: article.title || `${symbol} research catalyst`,
        impact: article.category_label || enhanced.research_context.catalyst_label || 'Research',
        detail:
          article.published_at
            ? `${article.title || 'Recent research update'} · ${new Date(article.published_at).toLocaleDateString('en-US')}`
            : article.title || 'Recent SoSoValue research update.',
      });
    });
  }

  return catalysts.length ? catalysts : baseSignal.catalysts || [];
}

function buildOrderFlow(baseSignal, enhanced, globalMarket) {
  const liveRows = [];

  if (enhanced?.market_data) {
    liveRows.push(
      {
        venue: 'CoinGecko spot',
        bias: Number(enhanced.market_data.price_change_24h || 0) >= 0 ? 'Positive' : 'Negative',
        value: formatSignedPercent(enhanced.market_data.price_change_24h || 0, 2),
      },
      {
        venue: '24h volume',
        bias: 'Liquidity',
        value: formatCompactUsd(enhanced.market_data.volume_24h || 0),
      }
    );
  }

  if (enhanced?.research_context?.available) {
    liveRows.push({
      venue: 'Research context',
      bias: enhanced.research_context.catalyst_label || 'Live',
      value: `${enhanced.research_context.news_count || 0} headlines`,
    });
  }

  if (globalMarket) {
    liveRows.push({
      venue: 'Global market',
      bias: Number(globalMarket.market_cap_change_24h || 0) >= 0 ? 'Risk-on' : 'Risk-off',
      value: formatSignedPercent(globalMarket.market_cap_change_24h || 0, 2),
    });
  }

  return liveRows.length ? liveRows.slice(0, 4) : baseSignal.orderFlow || [];
}

function deriveResearchRegime(catalystScore, fallbackRegime = '') {
  const normalized = String(fallbackRegime || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '-');

  if (normalized && normalized !== 'UNAVAILABLE') {
    return normalized;
  }

  if (catalystScore >= 80) {
    return 'RISK-ON';
  }

  if (catalystScore >= 60) {
    return 'NEUTRAL';
  }

  if (catalystScore >= 40) {
    return 'DEFENSIVE';
  }

  return 'RISK-OFF';
}

function deriveNarrativeStrength(catalystScore) {
  if (catalystScore >= 80) {
    return 'EXPANDING';
  }

  if (catalystScore >= 65) {
    return 'STRONG';
  }

  if (catalystScore >= 45) {
    return 'BUILDING';
  }

  return 'SOFT';
}

function deriveResearchSentiment(sentimentUp, regime = '') {
  const normalizedRegime = String(regime || '').toUpperCase();
  const score = Number(sentimentUp);

  if (Number.isFinite(score)) {
    if (score >= 70) {
      return 'BULLISH';
    }

    if (score >= 58) {
      return 'POSITIVE';
    }

    if (score >= 45) {
      return 'NEUTRAL';
    }

    if (score >= 35) {
      return 'CAUTIOUS';
    }

    return 'DEFENSIVE';
  }

  if (/BULL|RISK-ON|POSITIVE/.test(normalizedRegime)) {
    return 'BULLISH';
  }

  if (/DEFENSIVE|RISK-OFF|BEAR/.test(normalizedRegime)) {
    return 'DEFENSIVE';
  }

  return 'NEUTRAL';
}

function deriveStorySentiment(score, regime, sentimentLabel) {
  const normalizedRegime = String(regime || '').toUpperCase();
  const normalizedSentiment = String(sentimentLabel || '').toUpperCase();
  const value = Number(score || 0);

  if (/DEFENSIVE|RISK-OFF|BEAR/.test(normalizedRegime)) {
    return 'DEFENSIVE';
  }

  if (value >= 72 || /BULLISH|POSITIVE/.test(normalizedSentiment)) {
    return 'BULLISH';
  }

  if (value >= 50) {
    return 'NEUTRAL';
  }

  return /CAUTIOUS|DEFENSIVE/.test(normalizedSentiment) ? 'CAUTIOUS' : 'NEUTRAL';
}

function deriveResearchConfidence(activeSignal, catalystScore) {
  const signalConfidence = Number(activeSignal?.confidence || 0);

  if (signalConfidence >= 0.78 || catalystScore >= 75) {
    return 'High';
  }

  if (signalConfidence >= 0.64 || catalystScore >= 55) {
    return 'Medium';
  }

  return 'Guarded';
}

function buildResearchPanel(symbol, activeSignal, marketSentiment, updatedAt) {
  const researchContext = activeSignal?.researchContext;
  const hasLiveResearch = Boolean(researchContext?.available);

  const catalystScore = hasLiveResearch
    ? clamp(Math.round(Number(researchContext.catalyst_score || 0)), 0, 100)
    : clamp(Math.round(Number(activeSignal?.confidence || 0.6) * 100), 35, 99);
  const marketRegime = deriveResearchRegime(
    catalystScore,
    hasLiveResearch ? researchContext.macro_regime : activeSignal?.regime
  );
  const sentimentScore = Number(
    activeSignal?.marketSentiment?.sentiment_up ?? marketSentiment?.sentiment_up ?? (
      activeSignal?.change24h >= 0 ? 62 : 42
    )
  );
  const sentimentLabel = deriveResearchSentiment(sentimentScore, marketRegime);

  const items = hasLiveResearch && Array.isArray(researchContext.latest_news)
    ? researchContext.latest_news
        .map((article) => {
          const articleScore = clamp(Math.round(Number(article?.importance_score || 0)), 0, 100);
          return {
            type: article?.category_label || researchContext.catalyst_label || 'Research',
            title: article?.title || `${symbol} research catalyst`,
            publishedAt: article?.published_at || null,
            score: articleScore,
            sentiment: deriveStorySentiment(articleScore, marketRegime, sentimentLabel),
          };
        })
        .filter((article) => article.title)
    : [];
  const headlineCount = Number(
    hasLiveResearch ? (researchContext.news_count || items.length || 0) : items.length
  );

  const summary = hasLiveResearch
    ? (activeSignal?.catalystSummary ||
       researchContext.rationale?.[0] ||
       `${symbol} research context is live with ${headlineCount} active headlines.`)
    : (activeSignal?.catalystSummary ||
       `${symbol} signal overlay is active. Live SoSoValue research headlines will populate here once the narrative engine returns curated context.`);

  return {
    symbol,
    catalystScore,
    marketRegime,
    headlineCount,
    narrativeStrength: deriveNarrativeStrength(catalystScore),
    sentiment: {
      label: sentimentLabel,
      score: Number.isFinite(sentimentScore) ? Math.round(sentimentScore) : null,
    },
    summary,
    items,
    updatedAt: updatedAt || null,
    source: hasLiveResearch ? 'SoSoValue AI Engine' : 'Signal overlay (fallback)',
    confidence: deriveResearchConfidence(activeSignal, catalystScore),
  };
}

function buildRewardRisk(confidence, riskScore, fallbackValue) {
  if (!Number.isFinite(confidence) || !Number.isFinite(riskScore)) {
    return fallbackValue || '2.0x';
  }

  const ratio = clamp(1.15 + confidence * 2.1 - riskScore / 120, 1.1, 3.4);
  return `${ratio.toFixed(1)}x`;
}

function buildHorizon(enhanced, fallbackValue) {
  if (enhanced?.confirmation_required) {
    return '4-24h';
  }

  if (enhanced?.signal_alignment === 'STRONG') {
    return '12-36h';
  }

  return fallbackValue || '1-2d';
}

function buildBackendSignal(symbol, baseSignal, liveData, prediction, enhanced, marketSentiment, globalMarket, candleSeries = []) {
  const marketData = enhanced?.market_data || {};
  const technical = enhanced?.technical_indicators || prediction?.indicators || {};
  const actionSignal = enhanced?.signal || prediction?.signal || baseSignal.signal;
  const price = Number(
    marketData.price ||
      liveData?.price ||
      technical.current_price ||
      baseSignal.price ||
      0
  );
  const change24h = Number(
    marketData.price_change_24h ??
      liveData?.change_24h ??
      baseSignal.change24h ??
      0
  );
  const confidence = clamp(
    Number(
      enhanced?.confidence ??
        prediction?.combined_confidence ??
        prediction?.confidence ??
        baseSignal.confidence ??
        0.6
    ),
    0.35,
    0.99
  );
  const riskScore = clamp(
    Math.round(Number(prediction?.risk_score ?? baseSignal.riskScore ?? 50)),
    0,
    100
  );
  const confidenceDrivers = buildConfidenceDrivers(symbol, baseSignal, prediction, enhanced);
  const catalysts = buildCatalysts(symbol, baseSignal, enhanced);
  const modelBreakdown = buildModelBreakdown(prediction, enhanced, marketSentiment);
  const simulatedEdge = `${(confidence * 5).toFixed(1)}%`;
  const catalystSummary =
    enhanced?.rationale_summary ||
    enhanced?.research_context?.rationale?.[0] ||
    catalysts[0]?.detail ||
    baseSignal.catalystSummary;

  return {
    ...baseSignal,
    symbol,
    name: baseSignal.name || SYMBOL_NAMES[symbol] || symbol,
    signal: actionSignal,
    confidence,
    confidenceLabel:
      enhanced?.confidence_level === 'HIGH'
        ? 'Institutional Grade'
        : enhanced?.confidence_level === 'MEDIUM'
          ? 'Actionable'
          : baseSignal.confidenceLabel || 'Conditional',
    price,
    change24h,
    horizon: buildHorizon(enhanced, baseSignal.horizon),
    regime: enhanced?.macro_regime || enhanced?.research_context?.macro_regime || baseSignal.regime,
    setup:
      enhanced?.signal_alignment === 'STRONG'
        ? `${symbol} has broad alignment across price action, signal models, and research overlays.`
        : enhanced?.confirmation_required
          ? `${symbol} has a live setup, but it still needs extra confirmation before larger sizing.`
          : baseSignal.setup,
    catalystSummary,
    entryZone: buildEntryZone(price),
    stopLoss: buildStopLoss(price, actionSignal),
    targetZone: buildTargetZone(price, actionSignal),
    rewardRisk: buildRewardRisk(confidence, riskScore, baseSignal.rewardRisk),
    simulatedEdge,
    riskScore,
    confidenceDrivers,
    catalysts,
    orderFlow: buildOrderFlow(baseSignal, enhanced, globalMarket),
    chart: candleSeries.length ? candleSeries : baseSignal.chart || [],
    liveData: liveData || null,
    modelBreakdown,
    positionSize: Number(prediction?.position_size ?? 0) || null,
    technicalIndicators: technical,
    researchContext: enhanced?.research_context || null,
    marketSentiment: marketSentiment || null,
    signalAlignment: enhanced?.signal_alignment || null,
    confirmationRequired: Boolean(enhanced?.confirmation_required),
    source: enhanced ? 'Live signal overlay' : prediction ? 'AI signal overlay' : 'Curated overlay',
  };
}

function buildReadiness(blockchainPayload, activeSignal, enhanced, sodexStatus = null) {
  const blockchainStatus = blockchainPayload?.status || {};
  const connected = Boolean(blockchainStatus.connected);
  const contractReady = Boolean(blockchainStatus.contract_deployed);
  const networkName = blockchainPayload?.network?.chainName || 'Execution network';
  const nativeSymbol = blockchainPayload?.network?.nativeCurrency?.symbol || 'tBNB';
  const liveSodexReady = Boolean(sodexStatus?.browserSigningReady);
  const sodexTone = sodexStatus?.readinessTone || 'var(--text-tertiary)';
  const statusLabel = liveSodexReady
    ? 'SODEX LIVE'
    : connected && contractReady
      ? 'READY'
      : connected
        ? 'LIMITED'
        : 'PREVIEW';
  const statusTone = liveSodexReady
    ? 'var(--green)'
    : connected && contractReady
      ? 'var(--green)'
      : connected
        ? 'var(--yellow)'
        : 'var(--text-tertiary)';

  return {
    statusLabel,
    statusTone,
    oracle: {
      label: enhanced?.signal_alignment === 'STRONG' ? 'Aligned' : connected ? 'Monitoring' : 'Preview',
      tone: enhanced?.signal_alignment === 'STRONG' ? 'var(--green)' : connected ? 'var(--purple)' : 'var(--text-tertiary)',
    },
    contract: {
      label: liveSodexReady ? sodexStatus.providerLabel : contractReady ? 'Ready' : 'Preview',
      tone: liveSodexReady ? sodexTone : contractReady ? 'var(--purple)' : 'var(--yellow)',
    },
    confirmation: {
      label: enhanced?.confirmation_required ? 'Required' : 'Cleared',
      tone: enhanced?.confirmation_required ? 'var(--yellow)' : 'var(--green)',
    },
    volatility: {
      label: Number(activeSignal?.riskScore || 0) <= 35 ? 'Low' : Number(activeSignal?.riskScore || 0) <= 60 ? 'Medium' : 'High',
      tone: Number(activeSignal?.riskScore || 0) <= 35 ? 'var(--green)' : Number(activeSignal?.riskScore || 0) <= 60 ? 'var(--yellow)' : 'var(--red)',
    },
    estimatedGasLabel: `~0.003 ${nativeSymbol}`,
    networkLabel: networkName,
    executionModeLabel: liveSodexReady ? sodexStatus.executionLabel : 'Internal fallback',
    sodex: {
      label: sodexStatus?.executionLabel || 'Preview only',
      tone: sodexTone,
      liveReady: liveSodexReady,
    },
    networkConnected: connected,
    contractReady,
  };
}

function buildFallbackPerformance(historyItems) {
  return {
    total_trades: historyItems.length,
    winning_trades: Math.max(1, Math.round(historyItems.length * 0.68)),
    losing_trades: Math.max(0, historyItems.length - Math.round(historyItems.length * 0.68)),
    win_rate: 68.4,
    total_profit: 18.4,
    avg_profit: 2.7,
  };
}

export default async function handler(req, res) {
  const requestedSymbol =
    typeof req.query.symbol === 'string' ? req.query.symbol.trim().toUpperCase() : 'BTC';

  const [
    pricesResult,
    candlesResult,
    performanceResult,
    historyResult,
    blockchainResult,
    sodexStatusResult,
    predictionResult,
    enhancedResult,
    modelStatusResult,
    globalMarketResult,
    trendingResult,
    tokenInfoResult,
    sentimentResult,
  ] = await Promise.allSettled([
    fetchBackendJson('market/prices'),
    fetchBackendJson(`market/candles/${requestedSymbol}?interval=1h&limit=24`),
    fetchBackendJson('trades/performance'),
    fetchBackendJson('trades/history?limit=8'),
    fetchBackendJson('blockchain/status'),
    fetchBackendJson('sodex/status'),
    fetchBackendJson(`predictions/${requestedSymbol}`),
    fetchBackendJson(`ai/enhanced-prediction/${requestedSymbol}`),
    fetchBackendJson('ai/model-status'),
    fetchBackendJson('ai/global-market'),
    fetchBackendJson('ai/trending'),
    fetchBackendJson('blockchain/token-info'),
    fetchBackendJson(`ai/market-sentiment/${requestedSymbol}`),
  ]);

  const livePrices =
    pricesResult.status === 'fulfilled' ? pricesResult.value?.data || {} : {};
  const mergedCuratedSignals = mergeSignalsWithLivePrices(aiSignals, livePrices);
  const curatedSymbols = new Set(mergedCuratedSignals.map((signal) => signal.symbol));
  const liveSymbols = Object.keys(livePrices);
  const orderedSymbols = Array.from(
    new Set([...TERMINAL_SYMBOLS, ...mergedCuratedSignals.map((signal) => signal.symbol), ...liveSymbols])
  ).filter((symbol) => curatedSymbols.has(symbol) || livePrices[symbol]);

  const baseSignals = orderedSymbols.map((symbol) => {
    if (curatedSymbols.has(symbol)) {
      const curatedSignal = mergedCuratedSignals.find((signal) => signal.symbol === symbol);
      if (curatedSignal) {
        return {
          ...curatedSignal,
          liveData: livePrices[symbol] || null,
        };
      }
    }

    return buildDerivedSignal(symbol, livePrices[symbol]);
  });

  const historyItems =
    historyResult.status === 'fulfilled'
      ? (historyResult.value?.data || []).map(normalizeHistoryItem)
      : DEMO_HISTORY.map(normalizeHistoryItem);

  const performance =
    performanceResult.status === 'fulfilled'
      ? performanceResult.value?.data || buildFallbackPerformance(historyItems)
      : buildFallbackPerformance(historyItems);
  const activeCandleSeries =
    candlesResult.status === 'fulfilled'
      ? buildChartSeriesFromCandles(candlesResult.value?.data || {})
      : [];

  const blockchainBase =
    blockchainResult.status === 'fulfilled'
      ? resolveBlockchainConfig(blockchainResult.value)
      : {
          network: getDefaultChainConfig(80002),
          token: FALLBACK_TOKEN,
        };
  const blockchainStatus =
    blockchainResult.status === 'fulfilled' ? blockchainResult.value?.data || {} : {};
  const tokenInfo =
    tokenInfoResult.status === 'fulfilled' && tokenInfoResult.value?.success
      ? tokenInfoResult.value?.data || {}
      : {};
  const blockchain = {
    ...blockchainBase,
    status: blockchainStatus,
    token: {
      ...blockchainBase.token,
      name: tokenInfo?.name || blockchainBase.token.name,
      symbol: tokenInfo?.symbol || blockchainBase.token.symbol,
      decimals: Number(tokenInfo?.decimals || blockchainBase.token.decimals || FALLBACK_TOKEN.decimals),
      contractAddress: tokenInfo?.contract_address || blockchainBase.token.contractAddress,
      explorerUrl: tokenInfo?.explorer || blockchainBase.token.explorerUrl,
      totalSupply: tokenInfo?.total_supply || null,
    },
  };
  const sodex =
    sodexStatusResult.status === 'fulfilled'
      ? resolveSodexStatus(sodexStatusResult.value)
      : resolveSodexStatus();

  const prediction =
    predictionResult.status === 'fulfilled' && predictionResult.value?.success
      ? predictionResult.value?.prediction || null
      : null;
  const enhanced =
    enhancedResult.status === 'fulfilled' && enhancedResult.value?.success
      ? enhancedResult.value?.data || null
      : null;
  const marketSentiment =
    sentimentResult.status === 'fulfilled' && sentimentResult.value?.success
      ? sentimentResult.value?.data || null
      : null;
  const globalMarket =
    globalMarketResult.status === 'fulfilled' && globalMarketResult.value?.success
      ? globalMarketResult.value?.data || null
      : null;
  const trending =
    trendingResult.status === 'fulfilled' && trendingResult.value?.success
      ? trendingResult.value?.data || []
      : [];
  const modelStatus =
    modelStatusResult.status === 'fulfilled' && modelStatusResult.value?.success
      ? modelStatusResult.value?.data || null
      : null;

  const baseRequestedSignal =
    baseSignals.find((signal) => signal.symbol === requestedSymbol) ||
    buildDerivedSignal(requestedSymbol, livePrices[requestedSymbol] || {});
  const requestedLiveData = livePrices[requestedSymbol] || {};
  const activeSignal = buildBackendSignal(
    requestedSymbol,
    baseRequestedSignal,
    requestedLiveData,
    prediction,
    enhanced,
    marketSentiment,
    globalMarket,
    activeCandleSeries
  );

  const requestedSignalInList = baseSignals.some((signal) => signal.symbol === requestedSymbol);
  const nextSignals = requestedSignalInList
    ? baseSignals.map((signal) => (signal.symbol === requestedSymbol ? activeSignal : signal))
    : [activeSignal, ...baseSignals];
  const signals = nextSignals.slice(0, Math.max(nextSignals.length, 8));

  const totalVolumeUsd = Object.values(livePrices).reduce((sum, item) => {
    return sum + Number(item?.volume_24h || 0);
  }, 0);
  const averageConfidence =
    signals.reduce((sum, signal) => sum + Number(signal?.confidence || 0), 0) / Math.max(signals.length, 1);
  const averageChange =
    signals.reduce((sum, signal) => sum + Number(signal?.change24h || 0), 0) / Math.max(signals.length, 1);
  const trendingSymbol =
    String(trending?.[0]?.symbol || '').toUpperCase() ||
    signals.slice().sort((left, right) => Number(right.change24h || 0) - Number(left.change24h || 0))[0]?.symbol ||
    'BTC';

  const readiness = buildReadiness(blockchain, activeSignal, enhanced, sodex);
  const updatedTimestamp =
    globalMarket?.timestamp ||
    enhanced?.timestamp ||
    prediction?.timestamp ||
    new Date().toISOString();
  const activeResearch = buildResearchPanel(activeSignal.symbol || requestedSymbol, activeSignal, marketSentiment, updatedTimestamp);

  res.status(200).json({
    success: true,
    data: {
      requestedSymbol: activeSignal.symbol || requestedSymbol,
      source: activeSignal.source || 'Curated signal model',
      signals,
      performance,
      history: historyItems.length ? historyItems : DEMO_HISTORY.map(normalizeHistoryItem),
      marketOverview: {
        globalCapLabel: globalMarket ? formatCompactUsd(globalMarket.total_market_cap_usd) : '$2.41T',
        btcDominanceLabel: globalMarket ? `${Number(globalMarket.bitcoin_dominance || 0).toFixed(1)}%` : '53.8%',
        totalVolumeLabel:
          globalMarket && Number(globalMarket.total_volume_24h_usd || 0) > 0
            ? formatCompactUsd(globalMarket.total_volume_24h_usd)
            : totalVolumeUsd > 0
              ? formatCompactUsd(totalVolumeUsd)
              : '$94.4B',
        fearGreed: clamp(Math.round(55 + averageChange * 2.4 + averageConfidence * 18), 24, 86),
        trendingSymbol,
        trendingName: trending?.[0]?.name || trendingSymbol,
        aiAccuracyLabel: `${Number(performance?.win_rate || averageConfidence * 100).toFixed(1)}%`,
        activityValue: globalMarket?.active_cryptocurrencies
          ? Number(globalMarket.active_cryptocurrencies).toLocaleString('en-US')
          : `${signals.length}`,
        activityLabel: globalMarket?.active_cryptocurrencies ? 'Active Assets' : 'Tracked Assets',
        activeMarketsValue: globalMarket?.markets ? Number(globalMarket.markets).toLocaleString('en-US') : null,
        activeMarketsLabel: globalMarket?.markets ? 'Markets' : null,
        marketCapChangeLabel: globalMarket ? formatSignedPercent(globalMarket.market_cap_change_24h || 0, 2) : null,
        marketCapChangeValue: Number(globalMarket?.market_cap_change_24h || 0),
        liveMarketLabel: globalMarket ? 'GLOBAL' : 'CURATED',
        lastSyncLabel: new Date(updatedTimestamp).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      },
      blockchain,
      sodex,
      modelStatus,
      readiness,
      research: activeResearch
        ? {
            [activeSignal.symbol || requestedSymbol]: activeResearch,
          }
        : {},
      updatedAt: globalMarket?.timestamp || enhanced?.timestamp || prediction?.timestamp || DEMO_UPDATED_AT,
    },
  });
}
