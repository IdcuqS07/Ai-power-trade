import {
  aiSignals,
  mergeSignalsWithLivePrices,
} from '../../../lib/premiumData';
import {
  FALLBACK_TOKEN,
  getDefaultChainConfig,
  resolveBlockchainConfig,
} from '../../../lib/walletNetwork';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
const TERMINAL_SYMBOLS = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'MATIC', 'LINK'];
const DEMO_UPDATED_AT = '2026-04-26T12:00:00.000Z';
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

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function isShortBias(action = '') {
  return /short|sell/i.test(String(action));
}

function isHoldBias(action = '') {
  return /watch|hold/i.test(String(action));
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

async function fetchBackendJson(path) {
  const response = await fetch(`${API_URL}/api/${path}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`${path} returned ${response.status}`);
  }

  return response.json();
}

function normalizeHistoryItem(item, index = 0) {
  const timestamp = item?.timestamp || item?.created_at || new Date().toISOString();

  return {
    tradeId: item?.trade_id || item?.id || `APT-HISTORY-${index + 1}`,
    symbol: String(item?.symbol || 'BTC').toUpperCase(),
    type: /sell|short/i.test(item?.type || item?.trade_type || item?.signal || '') ? 'SELL' : /hold|watch/i.test(item?.type || item?.trade_type || item?.signal || '') ? 'HOLD' : 'BUY',
    amount: Number(item?.amount || item?.value || 0),
    price: Number(item?.price || 0),
    pnl: Number(item?.profit_loss || item?.pnl || 0),
    status: item?.status || (item?.settled ? 'Settled' : 'Processing'),
    timestamp,
    txHash: item?.tx_hash || item?.transaction_hash || null,
    recordHash: item?.record_hash || item?.block_hash || item?.on_chain_record?.block_hash || null,
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

function buildBackendSignal(symbol, baseSignal, liveData, prediction, enhanced, marketSentiment, globalMarket) {
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
    chart: baseSignal.chart || [],
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

function buildReadiness(blockchainPayload, activeSignal, enhanced) {
  const blockchainStatus = blockchainPayload?.status || {};
  const connected = Boolean(blockchainStatus.connected);
  const contractReady = Boolean(blockchainStatus.contract_deployed);
  const networkName = blockchainPayload?.network?.chainName || 'Execution network';
  const nativeSymbol = blockchainPayload?.network?.nativeCurrency?.symbol || 'tBNB';

  return {
    statusLabel: connected && contractReady ? 'READY' : connected ? 'LIMITED' : 'PREVIEW',
    statusTone: connected && contractReady ? 'var(--green)' : connected ? 'var(--yellow)' : 'var(--text-tertiary)',
    oracle: {
      label: enhanced?.signal_alignment === 'STRONG' ? 'Aligned' : connected ? 'Monitoring' : 'Preview',
      tone: enhanced?.signal_alignment === 'STRONG' ? 'var(--green)' : connected ? 'var(--purple)' : 'var(--text-tertiary)',
    },
    contract: {
      label: contractReady ? 'Ready' : 'Preview',
      tone: contractReady ? 'var(--purple)' : 'var(--yellow)',
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
    performanceResult,
    historyResult,
    blockchainResult,
    predictionResult,
    enhancedResult,
    modelStatusResult,
    globalMarketResult,
    trendingResult,
    tokenInfoResult,
    sentimentResult,
  ] = await Promise.allSettled([
    fetchBackendJson('market/prices'),
    fetchBackendJson('trades/performance'),
    fetchBackendJson('trades/history?limit=8'),
    fetchBackendJson('blockchain/status'),
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

  const blockchainBase =
    blockchainResult.status === 'fulfilled'
      ? resolveBlockchainConfig(blockchainResult.value)
      : {
          network: getDefaultChainConfig(97),
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
    globalMarket
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

  const readiness = buildReadiness(blockchain, activeSignal, enhanced);
  const updatedTimestamp =
    globalMarket?.timestamp ||
    enhanced?.timestamp ||
    prediction?.timestamp ||
    new Date().toISOString();

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
      modelStatus,
      readiness,
      updatedAt: globalMarket?.timestamp || enhanced?.timestamp || prediction?.timestamp || DEMO_UPDATED_AT,
    },
  });
}
