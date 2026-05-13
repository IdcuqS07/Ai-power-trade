import { buildBackendApiUrl } from '../../../../lib/backendOrigin';
import { aiSignals, researchFeed } from '../../../../lib/premiumData';

const REQUEST_TIMEOUT_MS = 8000;
const EXPLAINABILITY_CACHE_SECONDS = 900;
const explainabilitySnapshotCache = new Map();

const CURATED_FALLBACK_PRICES = {
  BTC: { price: 94280, change_24h: 2.18, volume_24h: 48600000000 },
  ETH: { price: 4875, change_24h: 1.42, volume_24h: 22100000000 },
  SOL: { price: 214.7, change_24h: 4.11, volume_24h: 4100000000 },
  LINK: { price: 29.34, change_24h: 3.68, volume_24h: 940000000 },
  BNB: { price: 692.4, change_24h: 1.06, volume_24h: 1880000000 },
  XRP: { price: 2.41, change_24h: 1.84, volume_24h: 3270000000 },
  ADA: { price: 0.91, change_24h: 1.37, volume_24h: 1080000000 },
  MATIC: { price: 0.74, change_24h: 0.92, volume_24h: 412000000 },
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function buildCacheKey(symbol, query = {}) {
  return JSON.stringify({
    symbol: String(symbol || '').toUpperCase(),
    news_limit: Number(query.news_limit || 3),
    candle_limit: Number(query.candle_limit || 24),
    candle_interval: String(query.candle_interval || '1h'),
  });
}

function resolveSignalDirection(signalLabel = '') {
  const normalized = String(signalLabel || '').toLowerCase();

  if (normalized.includes('sell') || normalized.includes('short')) {
    return 'SELL';
  }

  if (normalized.includes('hold') || normalized.includes('watch') || normalized.includes('neutral')) {
    return 'HOLD';
  }

  return 'BUY';
}

function formatRelativeFallbackMessage(symbol, reason) {
  return `Live ${String(symbol || 'BTC').toUpperCase()} explainability is temporarily unavailable, so curated fallback context is active. ${reason}`;
}

function getCuratedSignal(symbol) {
  const normalizedSymbol = String(symbol || 'BTC').toUpperCase();
  return aiSignals.find((item) => item.symbol === normalizedSymbol) || aiSignals[0];
}

function buildFallbackMarketSnapshot(symbol) {
  const normalizedSymbol = String(symbol || 'BTC').toUpperCase();
  const curatedSignal = getCuratedSignal(normalizedSymbol);
  const fallbackItem = CURATED_FALLBACK_PRICES[normalizedSymbol] || {};
  const price = Number(curatedSignal?.price || fallbackItem.price || 0);
  const change24h = Number(curatedSignal?.change24h ?? fallbackItem.change_24h ?? 0);

  return {
    symbol: normalizedSymbol,
    price,
    change_24h: change24h,
    high_24h: Number((price * 1.018).toFixed(2)),
    low_24h: Number((price * 0.982).toFixed(2)),
    volume_24h: Number(fallbackItem.volume_24h || 0),
    source: 'Curated explainability fallback',
  };
}

function buildFallbackResearch(symbol, reason) {
  const normalizedSymbol = String(symbol || 'BTC').toUpperCase();
  const relatedEntries = researchFeed.filter((item) =>
    Array.isArray(item.related) && item.related.includes(normalizedSymbol)
  );
  const selectedEntries = (relatedEntries.length ? relatedEntries : researchFeed.slice(0, 2)).slice(0, 3);
  const timestamp = new Date().toISOString();

  const articles = selectedEntries.map((item, index) => ({
    id: item.id || `explain-fallback-${normalizedSymbol}-${index}`,
    title: item.title,
    summary: item.summary,
    category_label: item.tag || 'Research',
    category: item.tag || 'Research',
    sentiment: item.sentiment || 'Neutral',
    importance_score: 58 - index * 4,
    published_at: timestamp,
    source: 'Curated Research',
  }));

  return {
    symbol: normalizedSymbol,
    summary:
      selectedEntries[0]?.summary ||
      `Curated ${normalizedSymbol} research fallback is active while the live research providers reconnect.`,
    news_count: articles.length,
    catalyst_score: articles.length ? 52 : 40,
    catalyst_label: articles.length ? 'MEDIUM' : 'LOW',
    sentiment: {
      label: articles.length ? 'NEUTRAL' : 'STANDBY',
      score: articles.length ? 53 : 45,
      description: reason,
    },
    rationale: [
      selectedEntries[0]?.whyItMatters ||
        `Curated ${normalizedSymbol} narrative context is standing in until the live explainability stack is back.`,
      reason,
    ],
    latest_news: articles,
    macro_regime: 'UNAVAILABLE',
    macro_context: {
      overall_regime: 'UNAVAILABLE',
      error: reason,
    },
    timestamp,
    source: 'Curated explainability fallback',
    fallback: true,
  };
}

function buildFallbackSentiment(signal, reason) {
  const change24h = Number(signal?.change24h || 0);
  const sentimentUp = clamp(Math.round(50 + change24h * 4), 35, 68);

  return {
    symbol: signal.symbol,
    sentiment_up: sentimentUp,
    sentiment_down: 100 - sentimentUp,
    twitter_followers: 0,
    reddit_subscribers: 0,
    github_stars: 0,
    github_forks: 0,
    timestamp: new Date().toISOString(),
    source: 'Curated explainability fallback',
    fallback: true,
    message: reason,
  };
}

function buildFallbackPerformance() {
  return {
    total_trades: 0,
    winning_trades: 0,
    losing_trades: 0,
    win_rate: 0,
    total_profit: 0,
    avg_profit: 0,
    best_trade: 0,
    worst_trade: 0,
    pending_trades: 0,
    total_volume: 0,
  };
}

function buildFallbackExplain(signal, marketSnapshot, research, reason) {
  const recommendation = resolveSignalDirection(signal?.signal);
  const confidence = clamp(Number(signal?.confidence || 0.72), 0.55, 0.93);
  const riskScore = clamp(Math.round(Number(signal?.riskScore || 45)), 18, 78);
  const currentPrice = Number(marketSnapshot?.price || signal?.price || 0);
  const marketChange = Number(marketSnapshot?.change_24h ?? signal?.change24h ?? 0);
  const volatility = clamp(0.018 + riskScore / 2400 + Math.abs(marketChange) / 300, 0.015, 0.065);
  const rsi =
    recommendation === 'BUY'
      ? clamp(44 - confidence * 8 - marketChange, 30, 50)
      : recommendation === 'SELL'
        ? clamp(56 + confidence * 8 + Math.abs(Math.min(marketChange, 0)), 50, 72)
        : 50;
  const macdMagnitude = clamp(confidence * 2.1 + Math.abs(marketChange) * 0.08, 0.35, 3.2);
  const macd = recommendation === 'SELL' ? -macdMagnitude : recommendation === 'HOLD' ? 0 : macdMagnitude;
  const maSpread = currentPrice * clamp(0.015 + confidence * 0.01, 0.012, 0.035);
  const ma5 = recommendation === 'SELL' ? currentPrice - maSpread / 2 : currentPrice + maSpread / 2;
  const ma20 = recommendation === 'SELL' ? currentPrice + maSpread / 2 : currentPrice - maSpread / 2;
  const bbRange = currentPrice * clamp(0.03 + volatility, 0.03, 0.08);
  const fallbackReasoning = Array.isArray(signal?.confidenceDrivers) ? signal.confidenceDrivers : [];

  return {
    symbol: signal.symbol,
    signal: recommendation,
    confidence,
    combined_confidence: confidence,
    buy_score: recommendation === 'BUY' ? clamp(Number((confidence * 8.8).toFixed(2)), 5.5, 9.4) : recommendation === 'HOLD' ? 5 : 2.1,
    sell_score: recommendation === 'SELL' ? clamp(Number((confidence * 8.8).toFixed(2)), 5.5, 9.4) : recommendation === 'HOLD' ? 5 : 2.1,
    risk_score: riskScore,
    position_size: Number(clamp(confidence * 17 * (1 - riskScore / 200), 1, 20).toFixed(1)),
    indicators: {
      rsi: Number(rsi.toFixed(2)),
      macd: Number(macd.toFixed(2)),
      ma_5: Number(ma5.toFixed(2)),
      ma_20: Number(ma20.toFixed(2)),
      ma_diff: Number((ma5 - ma20).toFixed(2)),
      bb_upper: Number((currentPrice + bbRange).toFixed(2)),
      bb_lower: Number(Math.max(currentPrice - bbRange, currentPrice * 0.5).toFixed(2)),
      bb_position: recommendation === 'SELL' ? 0.68 : recommendation === 'BUY' ? 0.32 : 0.5,
      current_price: Number(currentPrice.toFixed(2)),
      volatility: Number(volatility.toFixed(4)),
    },
    reasoning: fallbackReasoning.length
      ? fallbackReasoning.slice(0, 4).map((item) => ({
          indicator: item.label,
          explanation: item.detail,
          impact: recommendation === 'SELL' ? -1 : recommendation === 'HOLD' ? 0 : 1,
          signal: recommendation === 'SELL' ? 'SELL' : recommendation === 'HOLD' ? 'NEUTRAL' : 'BUY',
        }))
      : [
          {
            indicator: 'Curated fallback signal',
            explanation: signal?.setup || reason,
            impact: recommendation === 'SELL' ? -1.2 : recommendation === 'BUY' ? 1.2 : 0,
            signal: recommendation === 'SELL' ? 'SELL' : recommendation === 'BUY' ? 'BUY' : 'NEUTRAL',
          },
          {
            indicator: 'Narrative overlay',
            explanation: research?.rationale?.[0] || signal?.catalystSummary || reason,
            impact: 0.8,
            signal: recommendation === 'SELL' ? 'SELL' : recommendation === 'BUY' ? 'BUY' : 'NEUTRAL',
          },
        ],
    indicators_analyzed: 5,
    timestamp: new Date().toISOString(),
    ml_prediction: {
      model: 'Curated Fallback Overlay',
      prediction: recommendation,
      win_probability: Number(clamp(confidence * 0.92, 0.54, 0.88).toFixed(3)),
      feature_importance: {
        rsi: 0.24,
        macd: 0.21,
        ma_diff: 0.18,
        volatility: 0.16,
        bb_position: 0.13,
        price_change: 0.08,
      },
    },
    fallback: true,
    message: formatRelativeFallbackMessage(signal.symbol, reason),
  };
}

function buildFallbackPayload(symbol, reason = 'Live explainability is temporarily unavailable.') {
  const signal = getCuratedSignal(symbol);
  const marketSnapshot = buildFallbackMarketSnapshot(signal.symbol);
  const research = buildFallbackResearch(signal.symbol, reason);
  const sentiment = buildFallbackSentiment(signal, reason);
  const performance = buildFallbackPerformance();
  const explain = buildFallbackExplain(signal, marketSnapshot, research, reason);
  const timestamp = new Date().toISOString();

  return {
    success: true,
    fallback: true,
    source: 'Curated explainability fallback',
    cache_hit: false,
    cached_only: false,
    signal_available: true,
    generation_allowed: true,
    generation_locked: false,
    cache_duration_seconds: EXPLAINABILITY_CACHE_SECONDS,
    next_refresh_in_seconds: 0,
    message: formatRelativeFallbackMessage(signal.symbol, reason),
    data: {
      explain,
      research,
      sentiment,
      news: {
        articles: research.latest_news,
        source: 'Curated explainability fallback',
      },
      etf: {
        regime: 'ETF overlay pending',
        regime_explanation: 'Live ETF context is temporarily unavailable while the fallback explainability layer is active.',
        aggregate: {},
        funds: [],
      },
      llm: {
        market_narrative: signal.catalystSummary,
        setup: signal.setup,
        execution_summary: signal.setup,
      },
      performance,
      market: marketSnapshot,
      candles: [],
      providers: {
        market_prices: 'Curated explainability fallback',
        research: 'Curated explainability fallback',
        explainability: 'Curated explainability fallback',
      },
      warnings: [reason],
      generated_at: timestamp,
    },
  };
}

export default async function handler(req, res) {
  const { symbol } = req.query;

  if (!symbol) {
    return res.status(400).json({ success: false, error: 'Symbol is required' });
  }

  const cacheKey = buildCacheKey(symbol, req.query);
  const backendUrl = new URL(buildBackendApiUrl(`ai/explainability/${encodeURIComponent(symbol)}`));

  Object.entries(req.query || {}).forEach(([key, value]) => {
    if (key === 'symbol' || typeof value === 'undefined') {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((entry) => backendUrl.searchParams.append(key, String(entry)));
      return;
    }

    backendUrl.searchParams.set(key, String(value));
  });

  try {
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    const text = await response.text();
    let data = null;

    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }

    if (!response.ok || data?.success === false) {
      const cached = explainabilitySnapshotCache.get(cacheKey);
      if (cached) {
        return res.status(200).json({
          ...cached,
          fallback: true,
          source: 'Cached explainability layer',
          message: `Serving cached explainability because the backend returned ${response.status || 500}.`,
        });
      }

      return res.status(200).json(
        buildFallbackPayload(
          symbol,
          data?.detail || data?.error || text || `Backend returned ${response.status}`
        )
      );
    }

    explainabilitySnapshotCache.set(cacheKey, data);
    return res.status(200).json(data);
  } catch (error) {
    const cached = explainabilitySnapshotCache.get(cacheKey);
    if (cached) {
      return res.status(200).json({
        ...cached,
        fallback: true,
        source: 'Cached explainability layer',
        message:
          error.name === 'AbortError'
            ? 'Serving cached explainability because the live request timed out.'
            : `Serving cached explainability because the live request failed: ${error.message}`,
      });
    }

    return res.status(200).json(
      buildFallbackPayload(symbol, error.name === 'AbortError' ? 'Request timeout' : error.message)
    );
  }
}
