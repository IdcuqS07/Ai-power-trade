import { useEffect, useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { formatUsd } from '../lib/formatters';
import { aiSignals, assetLookup, mergeSignalsWithLivePrices, researchFeed } from '../lib/premiumData';
import { shortenAddress } from '../lib/walletNetwork';
import { useWallet } from '../contexts/WalletContext';
import { cache } from '../utils/cache';
import dashboardStyles from '../styles/ai-power-trade-dashboard.module.css';
import styles from '../styles/ai-power-trade-explainer.module.css';

const EXPLAINER_SYMBOLS = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'MATIC', 'LINK'];
const MARKET_CACHE_KEY = 'signal_explainer_market_overlay';
const EXPLAIN_CACHE_PREFIX = 'signal_explainer_overlay_';
const MARKET_REFRESH_MS = 30000;
const EXPLAIN_REFRESH_MS = 60000;
const EXPLAINER_ASSET_META = {
  BTC: { name: 'Bitcoin', icon: '₿', basePrice: 94280, baseChange: 2.18 },
  ETH: { name: 'Ethereum', icon: 'Ξ', basePrice: 4875, baseChange: 1.42 },
  BNB: { name: 'BNB Chain', icon: 'B', basePrice: 642, baseChange: 1.16 },
  SOL: { name: 'Solana', icon: 'S', basePrice: 214.7, baseChange: 4.11 },
  XRP: { name: 'XRP', icon: 'X', basePrice: 1.18, baseChange: 1.94 },
  ADA: { name: 'Cardano', icon: 'A', basePrice: 0.94, baseChange: 1.37 },
  MATIC: { name: 'Polygon', icon: 'P', basePrice: 1.21, baseChange: 1.08 },
  LINK: { name: 'Chainlink', icon: 'L', basePrice: 29.34, baseChange: 3.68 },
};

const cx = (...classes) => classes.filter(Boolean).join(' ');

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getIndicatorBiasClass(bias) {
  if (bias === 'bullish') {
    return styles.indicatorBiasBullish;
  }

  if (bias === 'bearish') {
    return styles.indicatorBiasBearish;
  }

  return styles.indicatorBiasNeutral;
}

function getRsiInsight(rsi) {
  if (rsi < 30) {
    return {
      label: 'Oversold',
      bias: 'bullish',
      detail: 'Momentum is stretched lower and may support a reversal higher.',
    };
  }

  if (rsi > 70) {
    return {
      label: 'Overbought',
      bias: 'bearish',
      detail: 'Momentum is extended and can invite profit-taking or a pullback.',
    };
  }

  return {
    label: 'Neutral',
    bias: 'neutral',
    detail: 'Momentum is balanced and needs confirmation from other signals.',
  };
}

function getMacdInsight(macd) {
  if (macd > 0) {
    return {
      label: 'Bullish Momentum',
      bias: 'bullish',
      detail: 'Short-term momentum is stronger than long-term trend pressure.',
    };
  }

  if (macd < 0) {
    return {
      label: 'Bearish Momentum',
      bias: 'bearish',
      detail: 'Short-term momentum is weaker and trend pressure remains defensive.',
    };
  }

  return {
    label: 'Flat Momentum',
    bias: 'neutral',
    detail: 'The trend engine is balanced and waiting for a cleaner move.',
  };
}

function getMovingAverageInsight(ma5, ma20) {
  if (ma5 > ma20) {
    return {
      label: 'Golden Cross Setup',
      bias: 'bullish',
      detail: 'Short-term trend is leading the long-term average, which supports continuation.',
    };
  }

  if (ma5 < ma20) {
    return {
      label: 'Death Cross Setup',
      bias: 'bearish',
      detail: 'Short-term trend is lagging the long-term average, which warns of weaker structure.',
    };
  }

  return {
    label: 'Trend Compression',
    bias: 'neutral',
    detail: 'The moving averages are tightly aligned and do not show a strong trend edge.',
  };
}

function getBollingerInsight(bbPosition) {
  if (bbPosition <= 0.2) {
    return {
      label: 'Lower Band',
      bias: 'bullish',
      detail: 'Price is pressing the lower volatility envelope and may be trading at a discount.',
    };
  }

  if (bbPosition >= 0.8) {
    return {
      label: 'Upper Band',
      bias: 'bearish',
      detail: 'Price is pressing the upper volatility envelope and may be vulnerable to mean reversion.',
    };
  }

  return {
    label: 'Middle Range',
    bias: 'neutral',
    detail: 'Price is trading inside the middle of the band structure without an extreme signal.',
  };
}

function getVolatilityInsight(volatility) {
  if (volatility >= 0.05) {
    return 'High volatility requires smaller size and tighter execution discipline.';
  }

  if (volatility >= 0.02) {
    return 'Moderate volatility keeps the setup tradable, but execution still matters.';
  }

  return 'Low volatility supports steadier positioning with less noise in the tape.';
}

function fetchJson(path, options = {}) {
  return fetch(path, options).then(async (response) => {
    let payload = null;

    try {
      payload = await response.json();
    } catch (error) {
      payload = null;
    }

    if (!response.ok) {
      throw new Error(
        payload?.detail ||
          payload?.error ||
          payload?.message ||
          `Request failed with status ${response.status}`
      );
    }

    if (payload?.success === false) {
      throw new Error(payload.detail || payload.error || payload.message || 'Request failed');
    }

    return payload;
  });
}

function fetchExplainabilityBundle(symbol, options = {}) {
  const params = new URLSearchParams({
    news_limit: '3',
    candle_limit: '24',
    candle_interval: '1h',
  });

  if (options.forceRefresh) {
    params.set('force_refresh', 'true');
  }

  return fetchJson(`/api/backend/ai/explainability/${encodeURIComponent(symbol)}?${params.toString()}`, {
    signal: options.signal,
  });
}

function fetchSymbolPerformance(symbol, options = {}) {
  const params = new URLSearchParams({
    symbol: String(symbol || '').toUpperCase(),
    limit: '120',
  });

  return fetchJson(`/api/backend/trades/performance?${params.toString()}`, {
    signal: options.signal,
  });
}

function getWalletPresentation(wallet) {
  const balanceLabel =
    typeof wallet.tokenBalance === 'number'
      ? `${wallet.tokenBalance.toFixed(wallet.tokenBalance >= 100 ? 0 : 2)} ${wallet.tokenMeta.symbol}`
      : null;

  if (wallet.initializing) {
    return {
      buttonLabel: 'Syncing Access',
      buttonTone: '',
      statusText: 'Loading execution access...',
      statusTone: '',
    };
  }

  if (!wallet.providerAvailable) {
    return {
      buttonLabel: 'Install MetaMask',
      buttonTone: dashboardStyles.connectButtonWarning,
      statusText: 'Install MetaMask to enable execution access',
      statusTone: dashboardStyles.walletStatusWarning,
    };
  }

  if (!wallet.isConnected) {
    return {
      buttonLabel: 'Connect Wallet',
      buttonTone: '',
      statusText: wallet.message || 'Execution wallet not connected',
      statusTone: '',
    };
  }

  if (wallet.isWrongNetwork) {
    return {
      buttonLabel: 'Switch Network',
      buttonTone: dashboardStyles.connectButtonWarning,
      statusText: `Connected ${shortenAddress(wallet.account)} on ${wallet.chainLabel}. Switch to ${wallet.networkConfig.chainName} to continue.`,
      statusTone: dashboardStyles.walletStatusWarning,
    };
  }

  return {
    buttonLabel: shortenAddress(wallet.account),
    buttonTone: dashboardStyles.connectButtonConnected,
    statusText: `Execution ready · ${shortenAddress(wallet.account)}${balanceLabel ? ` · ${balanceLabel}` : ''} · ${wallet.networkConfig.chainName}`,
    statusTone: dashboardStyles.walletStatusConnected,
  };
}

function getSignalTone(signalLabel = '') {
  return /short|sell/i.test(signalLabel) ? styles.pillBearish : styles.pillBullish;
}

function getImpactTone(impact = '') {
  const normalized = String(impact).toLowerCase();

  if (normalized.includes('high') || normalized.includes('bullish')) {
    return styles.impactHigh;
  }

  if (normalized.includes('low') || normalized.includes('defensive')) {
    return styles.impactLow;
  }

  return styles.impactMedium;
}

function getRiskTone(value) {
  if (value >= 45) {
    return styles.riskHigh;
  }

  if (value >= 30) {
    return styles.riskMedium;
  }

  return styles.riskLow;
}

function getRecommendationSignal(liveExplain, fallbackSignalLabel = '') {
  if (liveExplain?.signal) {
    return String(liveExplain.signal).toUpperCase();
  }

  if (/sell|short/i.test(fallbackSignalLabel)) {
    return 'SELL';
  }

  if (/hold|wait|neutral/i.test(fallbackSignalLabel)) {
    return 'HOLD';
  }

  return 'BUY';
}

function getRecommendationTone(recommendation = '') {
  if (/sell|short/i.test(recommendation)) {
    return styles.recommendationSignalBearish;
  }

  if (/hold|neutral/i.test(recommendation)) {
    return styles.recommendationSignalNeutral;
  }

  return styles.recommendationSignalBullish;
}

function getSourceTone(source = '', options = {}) {
  const normalized = String(source).toLowerCase();

  if (options.loading || options.refreshing || normalized.includes('loading') || normalized.includes('refresh')) {
    return styles.dataSourceRefreshing;
  }

  if (normalized.includes('live')) {
    return styles.dataSourceLive;
  }

  if (normalized.includes('cache')) {
    return styles.dataSourceCached;
  }

  return styles.dataSourceFallback;
}

function getDataSourceLabel(kind, status = {}) {
  if (status.loading) {
    return kind === 'market' ? 'Loading market overlay...' : 'Loading explainability layer...';
  }

  if (status.refreshing) {
    return kind === 'market' ? 'Refreshing live market overlay...' : 'Refreshing live explainability...';
  }

  const normalized = String(status.source || '').toLowerCase();

  if (normalized.includes('cache')) {
    return kind === 'market' ? 'Cached market overlay active' : 'Cached explainability active';
  }

  if (normalized.includes('demo') || normalized.includes('fallback')) {
    return kind === 'market' ? 'Demo market overlay active' : 'Demo explainability active';
  }

  return kind === 'market' ? 'Live market overlay' : 'Live explainability layer';
}

function getChangeTone(change) {
  return Number(change || 0) >= 0 ? styles.assetSelectorChangePositive : styles.assetSelectorChangeNegative;
}

function formatPercentChange(change) {
  const value = Number(change || 0);
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

function formatUpdateTime(timestamp) {
  if (!timestamp) {
    return 'Awaiting live overlay';
  }

  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRelativeTime(timestamp) {
  if (!timestamp) {
    return 'Awaiting update';
  }

  const value = new Date(timestamp).getTime();

  if (!Number.isFinite(value)) {
    return 'Awaiting update';
  }

  const deltaSeconds = Math.max(0, Math.floor((Date.now() - value) / 1000));

  if (deltaSeconds < 60) {
    return 'Just now';
  }

  const deltaMinutes = Math.floor(deltaSeconds / 60);

  if (deltaMinutes < 60) {
    return `${deltaMinutes}m ago`;
  }

  const deltaHours = Math.floor(deltaMinutes / 60);

  if (deltaHours < 24) {
    return `${deltaHours}h ago`;
  }

  return `${Math.floor(deltaHours / 24)}d ago`;
}

function formatRefreshWindow(seconds) {
  const totalSeconds = Math.max(0, Math.ceil(Number(seconds || 0)));

  if (!totalSeconds) {
    return 'now';
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;

  const parts = [];

  if (hours) {
    parts.push(`${hours}h`);
  }

  if (minutes || hours) {
    parts.push(`${minutes}m`);
  }

  parts.push(`${remainingSeconds}s`);

  return parts.join(' ');
}

function formatCompactCount(value) {
  const amount = Number(value || 0);

  if (!Number.isFinite(amount) || amount <= 0) {
    return '0';
  }

  return new Intl.NumberFormat('en-US', {
    notation: amount >= 1000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(amount);
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
    return formatUsd(amount, { fractionDigits: 0 });
  }

  return `$${(amount / match.value).toFixed(amount / match.value >= 100 ? 0 : 1)}${match.suffix}`;
}

function getSentimentLabel(value) {
  const score = Number(value || 0);

  if (score >= 70) {
    return 'Bullish Crowd';
  }

  if (score >= 55) {
    return 'Constructive';
  }

  if (score >= 45) {
    return 'Balanced';
  }

  return 'Defensive';
}

function getEtfFlowLabel(etfMetrics) {
  const dailyInflow = Number(etfMetrics?.aggregate?.daily_net_inflow_usd?.value || 0);

  if (!Number.isFinite(dailyInflow) || dailyInflow === 0) {
    return etfMetrics?.regime || 'ETF overlay pending';
  }

  return `${dailyInflow >= 0 ? '+' : ''}${formatCompactUsd(Math.abs(dailyInflow))}`;
}

function deriveConfidenceLabel(confidence) {
  const normalized = Number(confidence || 0);

  if (normalized >= 0.9) {
    return 'Institutional Grade';
  }

  if (normalized >= 0.8) {
    return 'High Confidence';
  }

  if (normalized >= 0.7) {
    return 'Actionable';
  }

  if (normalized >= 0.6) {
    return 'Developing';
  }

  return 'Explainability Only';
}

function deriveHoldWindow(explain, fallbackHorizon = '12-36h', marketChange = 0) {
  const volatility = Number(explain?.indicators?.volatility || 0);
  const confidence = Number(explain?.combined_confidence ?? explain?.confidence ?? 0);
  const absoluteMove = Math.abs(Number(marketChange || 0));

  if (volatility >= 0.05 || absoluteMove >= 5) {
    return '4-12h';
  }

  if (volatility >= 0.03 || confidence >= 0.82) {
    return '8-24h';
  }

  if (volatility >= 0.018) {
    return '12-36h';
  }

  return fallbackHorizon || '24-48h';
}

function getPatternConfirmationPercent(explain) {
  const buyScore = Number(explain?.buy_score || 0);
  const sellScore = Number(explain?.sell_score || 0);
  const totalScore = buyScore + sellScore;

  if (totalScore <= 0) {
    return 50;
  }

  const bullishBias = buyScore >= sellScore;
  const indicators = explain?.indicators || {};
  const maAligned = bullishBias
    ? Number(indicators.ma_5 || 0) >= Number(indicators.ma_20 || 0)
    : Number(indicators.ma_5 || 0) <= Number(indicators.ma_20 || 0);
  const macdAligned = bullishBias
    ? Number(indicators.macd || 0) >= 0
    : Number(indicators.macd || 0) <= 0;

  return clamp(
    Math.round((Math.max(buyScore, sellScore) / totalScore) * 70 + (maAligned ? 15 : 6) + (macdAligned ? 15 : 6)),
    0,
    100
  );
}

function getSentimentSupportPercent(recommendation, sentimentUp, marketChange = 0) {
  const sentimentValue = Number(sentimentUp);

  if (Number.isFinite(sentimentValue) && sentimentValue > 0) {
    if (recommendation === 'SELL') {
      return clamp(Math.round(100 - sentimentValue), 0, 100);
    }

    if (recommendation === 'HOLD') {
      return clamp(Math.round(100 - Math.abs(sentimentValue - 50) * 2), 0, 100);
    }

    return clamp(Math.round(sentimentValue), 0, 100);
  }

  const changeBias = Number(marketChange || 0) * (recommendation === 'SELL' ? -6 : recommendation === 'HOLD' ? 2 : 6);
  return clamp(Math.round(50 + changeBias), 0, 100);
}

function formatPnlStat(performance) {
  const totalProfit = Number(performance?.total_profit || 0);
  const totalVolume = Number(performance?.total_volume || 0);

  if (Number.isFinite(totalProfit) && Number.isFinite(totalVolume) && totalVolume > 0) {
    const percent = (totalProfit / totalVolume) * 100;
    return {
      label: `${percent >= 0 ? '+' : ''}${percent.toFixed(1)}%`,
      positive: percent >= 0,
    };
  }

  return {
    label: `${totalProfit >= 0 ? '+' : ''}${totalProfit.toFixed(1)} atUSDT`,
    positive: totalProfit >= 0,
  };
}

function deriveRegimeLabel(explain) {
  if (!explain) {
    return 'Live Explainability';
  }

  const volatility = Number(explain.indicators?.volatility || 0);
  const scoreSpread = Number(explain.buy_score || 0) - Number(explain.sell_score || 0);

  if (volatility >= 0.05) {
    return 'High Volatility';
  }

  if (scoreSpread >= 2) {
    return 'Momentum Expansion';
  }

  if (scoreSpread <= -2) {
    return 'Defensive Rotation';
  }

  return 'Balanced Flow';
}

function buildLiveSignalProfile({
  symbol,
  curatedSignal,
  explain,
  marketSnapshot,
  research,
  sentiment,
  news,
  performance,
  llm,
}) {
  if (!explain) {
    return null;
  }

  const fallbackMeta = EXPLAINER_ASSET_META[symbol] || { name: symbol, icon: symbol.slice(0, 1) };
  const baseSignal = curatedSignal || assetLookup[symbol] || null;

  // CRITICAL: Use baseSignal.price (live from useMarketPulse) as the primary source
  // If baseSignal.price is not available, use marketSnapshot.price as fallback
  const basePrice = Number(baseSignal?.price || marketSnapshot?.price || 0);
  const hasLivePrice = basePrice > 0;

  // For calculations only (entry, stop, target) - use fallback chain if no live price
  const calculationPrice = hasLivePrice ? basePrice : Number(
    explain?.indicators?.current_price ??
    fallbackMeta.basePrice ??
    0
  );

  console.log('[buildLiveSignalProfile] Price strategy:', {
    symbol,
    baseSignalPrice: baseSignal?.price,
    marketSnapshotPrice: marketSnapshot?.price,
    basePrice,
    hasLivePrice,
    calculationPrice,
    willReturnPrice: basePrice, // This is what gets returned as signal.price
    source: baseSignal?.price ? 'baseSignal.price (LIVE from useMarketPulse) ✅' :
            marketSnapshot?.price ? 'marketSnapshot.price (LIVE from marketOverlay) ✅' :
            'fallback chain ❌'
  });
  const change24h = Number(marketSnapshot?.change_24h ?? baseSignal?.change24h ?? fallbackMeta.baseChange ?? 0);
  const recommendation = getRecommendationSignal(explain, baseSignal?.signal || '');
  const confidence = clamp(Number(explain?.combined_confidence ?? explain?.confidence ?? baseSignal?.confidence ?? 0.5), 0.35, 0.95);
  const riskScore = clamp(Math.round(Number(explain?.risk_score ?? baseSignal?.riskScore ?? 50)), 0, 100);
  const volatility = Math.max(Number(explain?.indicators?.volatility || 0), 0.008);
  const moveUnit = calculationPrice ? calculationPrice * volatility : 0;
  const isSell = recommendation === 'SELL';
  const isHold = recommendation === 'HOLD';
  const entryLow = calculationPrice ? calculationPrice + (isSell ? moveUnit * 0.15 : -moveUnit * 0.2) : 0;
  const entryHigh = calculationPrice ? calculationPrice + (isSell ? moveUnit * 0.45 : moveUnit * 0.15) : 0;
  const stopPrice = calculationPrice ? calculationPrice + (isSell ? moveUnit * 1.15 : -moveUnit * 1.15) : 0;
  const targetPrimary = calculationPrice ? calculationPrice + (isSell ? -moveUnit * 1.6 : moveUnit * 1.6) : 0;
  const targetSecondary = calculationPrice ? calculationPrice + (isSell ? -moveUnit * 2.4 : moveUnit * 2.4) : 0;
  const rewardDistance = Math.abs(targetPrimary - calculationPrice);
  const riskDistance = Math.max(0.000001, Math.abs(calculationPrice - stopPrice));
  const rewardRisk = rewardDistance && riskDistance ? rewardDistance / riskDistance : 1;
  const reasoning = Array.isArray(explain?.reasoning) ? explain.reasoning : [];
  const researchArticles = Array.isArray(research?.latest_news) ? research.latest_news : [];
  const newsArticles = Array.isArray(news?.articles) ? news.articles : [];
  const totalPnlStat = formatPnlStat(performance);
  const catalysts = Array.from(
    new Map(
      [...researchArticles, ...newsArticles].map((item) => [
        item.title,
        {
          title: item.title,
          impact: item.category_label || research?.catalyst_label || item.source || 'Research',
          detail: item.summary || item.source_link || 'Recent live research context.',
        },
      ])
    ).values()
  )
    .slice(0, 3);
  const confidenceDrivers = reasoning.slice(0, 4).map((item) => ({
    label: item.indicator,
    weight: clamp(Math.round(Math.abs(Number(item.impact || 0)) * 14 + 10), 8, 32),
    detail: item.explanation,
  }));
  const orderFlow = [];

  if (sentiment?.sentiment_up) {
    orderFlow.push({
      venue: 'Community sentiment',
      bias: getSentimentLabel(sentiment.sentiment_up),
      value: `${Math.round(Number(sentiment.sentiment_up || 0))}% up`,
    });
  }

  if (performance?.total_volume) {
    orderFlow.push({
      venue: 'Trade volume',
      bias: 'History',
      value: formatCompactUsd(performance.total_volume),
    });
  }

  if (newsArticles[0]) {
    orderFlow.push({
      venue: newsArticles[0].source || 'Latest headline',
      bias: newsArticles[0].category_label || 'News',
      value: formatRelativeTime(newsArticles[0].published_at),
    });
  }

  if (!orderFlow.length && baseSignal?.orderFlow?.length) {
    orderFlow.push(...baseSignal.orderFlow.slice(0, 3));
  }

  if (!orderFlow.length) {
    orderFlow.push(
      {
        venue: 'Buy / Sell',
        bias: recommendation,
        value: `${Number(explain?.buy_score || 0).toFixed(2)} / ${Number(explain?.sell_score || 0).toFixed(2)}`,
      },
      {
        venue: 'Volatility',
        bias: riskScore >= 60 ? 'High' : riskScore >= 35 ? 'Moderate' : 'Low',
        value: `${(volatility * 100).toFixed(2)}%`,
      }
    );
  }

  return {
    ...baseSignal,
    symbol,
    name: baseSignal?.name || fallbackMeta.name || symbol,
    signal: isSell ? 'Short Bias' : isHold ? 'Watch / Hold' : 'Long Bias',
    confidence,
    confidenceLabel: deriveConfidenceLabel(confidence),
    price: basePrice, // CRITICAL: Use basePrice (live from useMarketPulse), NOT calculationPrice!
    change24h,
    horizon: deriveHoldWindow(explain, baseSignal?.horizon, change24h),
    regime: deriveRegimeLabel(explain),
    setup:
      llm?.setup ||
      llm?.execution_summary ||
      reasoning[0]?.explanation ||
      baseSignal?.setup ||
      `Live ${symbol} model snapshot is active.`,
    catalystSummary:
      llm?.market_narrative ||
      research?.rationale?.[0] ||
      newsArticles[0]?.summary ||
      reasoning[1]?.explanation ||
      baseSignal?.catalystSummary ||
      `Live ${symbol} signal combines technical structure and market context.`,
    entryZone:
      calculationPrice && !isHold
        ? `${formatUsd(Math.min(entryLow, entryHigh))} - ${formatUsd(Math.max(entryLow, entryHigh))}`
        : baseSignal?.entryZone || 'Awaiting live entry band',
    stopLoss: calculationPrice && !isHold ? formatUsd(stopPrice) : baseSignal?.stopLoss || 'Awaiting live invalidation',
    targetZone:
      calculationPrice && !isHold
        ? `${formatUsd(targetPrimary)} / ${formatUsd(targetSecondary)}`
        : baseSignal?.targetZone || 'Awaiting live target band',
    rewardRisk: `${Number.isFinite(rewardRisk) ? rewardRisk.toFixed(1) : '1.0'}x`,
    simulatedEdge: totalPnlStat.label,
    riskScore,
    confidenceDrivers: confidenceDrivers.length ? confidenceDrivers : baseSignal?.confidenceDrivers || [],
    catalysts: catalysts.length ? catalysts : baseSignal?.catalysts || [],
    orderFlow,
    chart: baseSignal?.chart || [],
    liveSnapshot: true,
  };
}

function getDemoMarketSnapshot(symbol, marketSnapshot = {}) {
  const meta = EXPLAINER_ASSET_META[symbol] || {};

  return {
    price: Number(marketSnapshot?.price ?? meta.basePrice ?? 0),
    change_24h: Number(marketSnapshot?.change_24h ?? meta.baseChange ?? 0),
  };
}

function buildExplainabilityOnlySignal(symbol, marketSnapshot, explain, sources = {}) {
  const meta = EXPLAINER_ASSET_META[symbol] || { name: symbol, icon: symbol.slice(0, 1) };
  const resolvedMarket = getDemoMarketSnapshot(symbol, marketSnapshot);
  const currentPrice = Number(resolvedMarket.price || explain?.indicators?.current_price || meta.basePrice || 0);
  const confidence = clamp(Number(explain?.confidence ?? 0.58), 0.35, 0.95);
  const riskScore = clamp(Math.round(Number(explain?.risk_score ?? 48)), 0, 100);
  const reasoning = explain?.reasoning || [];
  const recommendation = getRecommendationSignal(explain, '');

  return {
    symbol,
    name: meta.name,
    signal: /SELL/i.test(recommendation) ? 'Short Bias' : /HOLD/i.test(recommendation) ? 'Watch / Hold' : 'Long Bias',
    confidence,
    confidenceLabel: deriveConfidenceLabel(confidence),
    price: currentPrice,
    change24h: Number(resolvedMarket.change_24h ?? 0),
    horizon: 'Real-time',
    regime: deriveRegimeLabel(explain),
    setup: explain
      ? `Explainability-first view for ${meta.name} using ${explain.indicators_analyzed || reasoning.length || 0} live indicator inputs.`
      : `Explainability-first view for ${meta.name}. Waiting for the live overlay to hydrate this asset.`,
    catalystSummary:
      reasoning[0]?.explanation ||
      `${meta.name} is available in the AI Explainer even though it does not yet have a curated signal pack.`,
    entryZone: currentPrice ? `Around ${formatUsd(currentPrice)}` : 'Awaiting live market feed',
    stopLoss: explain ? `Risk model ${riskScore}/100` : 'Awaiting live signal overlay',
    targetZone:
      explain && /SELL/i.test(recommendation) ? 'Downside map from live signal overlay' : 'Upside map from live signal overlay',
    rewardRisk: explain ? `${Math.max(1.1, confidence * 3).toFixed(1)}x model-est` : 'Model-managed',
    simulatedEdge: explain ? `${(confidence * 4.5).toFixed(1)}% model edge` : 'Awaiting overlay',
    riskScore,
    confidenceDrivers: [],
    catalysts: reasoning.slice(0, 3).map((item) => ({
      title: item.indicator,
      impact: item.signal === 'BUY' ? 'Bullish' : item.signal === 'SELL' ? 'Defensive' : 'Live',
      detail: item.explanation,
    })),
    orderFlow: [
      {
        venue: 'Market source',
        bias: sources.marketSource || 'Waiting',
        value: currentPrice ? formatUsd(currentPrice) : 'No price yet',
      },
      {
        venue: '24h change',
        bias: Number(resolvedMarket.change_24h ?? 0) >= 0 ? 'Positive' : 'Negative',
        value: formatPercentChange(resolvedMarket.change_24h || 0),
      },
      {
        venue: 'Explainability layer',
        bias: sources.explainSource || 'Pending',
        value: `${explain?.indicators_analyzed || 0} inputs`,
      },
    ],
  };
}

function buildDemoExplainability(signal, marketSnapshot = {}) {
  const resolvedMarket = getDemoMarketSnapshot(signal.symbol, marketSnapshot);
  const currentPrice = Number(resolvedMarket.price || signal.price || 0);
  const marketChange = Number(resolvedMarket.change_24h ?? signal.change24h ?? 0);
  const confidence = clamp(Number(signal.confidence ?? 0.72), 0.55, 0.93);
  const recommendation = getRecommendationSignal(null, signal.signal);
  const riskScore = clamp(Math.round(Number(signal.riskScore ?? 45)), 18, 78);
  const bullish = recommendation === 'BUY';
  const bearish = recommendation === 'SELL';
  const buyScore = bullish ? clamp(Number((confidence * 8.9).toFixed(2)), 5.5, 9.4) : bearish ? 2.1 : 5.0;
  const sellScore = bearish ? clamp(Number((confidence * 8.9).toFixed(2)), 5.5, 9.4) : bullish ? 2.1 : 5.0;
  const volatility = clamp(0.014 + riskScore / 2200 + Math.abs(marketChange) / 300, 0.015, 0.065);
  const rsi = bullish
    ? clamp(46 - confidence * 10 - marketChange * 1.1, 28, 49)
    : bearish
      ? clamp(54 + confidence * 10 + Math.abs(Math.min(marketChange, 0)) * 1.1, 51, 72)
      : 50;
  const macdMagnitude = clamp(confidence * 2.2 + Math.abs(marketChange) * 0.08, 0.35, 3.2);
  const macd = bullish ? macdMagnitude : bearish ? -macdMagnitude : 0;
  const maSpread = currentPrice * clamp(0.015 + confidence * 0.012, 0.012, 0.035);
  const ma5 = bullish ? currentPrice + maSpread / 2 : bearish ? currentPrice - maSpread / 2 : currentPrice;
  const ma20 = bullish ? currentPrice - maSpread / 2 : bearish ? currentPrice + maSpread / 2 : currentPrice;
  const maDiff = ma5 - ma20;
  const bandWidth = currentPrice * clamp(0.03 + volatility, 0.03, 0.085);
  const bbUpper = currentPrice + bandWidth;
  const bbLower = Math.max(currentPrice - bandWidth, currentPrice * 0.5);
  const bbPosition = bullish ? clamp(0.32 + marketChange / 100, 0.2, 0.58) : bearish ? clamp(0.68 - marketChange / 100, 0.42, 0.82) : 0.5;
  const positionSize = clamp(confidence * 17 * (1 - riskScore / 200), 1, 20);
  const prediction = bullish ? 'BUY' : bearish ? 'SELL' : 'HOLD';
  const winProbability = clamp(confidence * 0.92, 0.54, 0.88);

  return {
    symbol: signal.symbol,
    signal: prediction,
    confidence,
    buy_score: buyScore,
    sell_score: sellScore,
    risk_score: riskScore,
    position_size: Number(positionSize.toFixed(1)),
    indicators: {
      rsi: Number(rsi.toFixed(2)),
      macd: Number(macd.toFixed(2)),
      ma_5: Number(ma5.toFixed(2)),
      ma_20: Number(ma20.toFixed(2)),
      ma_diff: Number(maDiff.toFixed(2)),
      bb_upper: Number(bbUpper.toFixed(2)),
      bb_lower: Number(bbLower.toFixed(2)),
      bb_position: Number(bbPosition.toFixed(2)),
      current_price: Number(currentPrice.toFixed(2)),
      volatility: Number(volatility.toFixed(4)),
    },
    reasoning: [
      {
        indicator: 'RSI (Estimated)',
        explanation:
          rsi < 30
            ? `RSI is modeled near ${rsi.toFixed(1)}, which implies oversold conditions and supports reversal potential.`
            : rsi > 70
              ? `RSI is modeled near ${rsi.toFixed(1)}, which implies overbought conditions and a more defensive stance.`
              : `RSI is modeled near ${rsi.toFixed(1)}, which keeps momentum balanced while waiting for stronger confirmation.`,
        impact: bullish ? 1.8 : bearish ? -1.8 : 0,
        signal: bullish ? 'BUY' : bearish ? 'SELL' : 'NEUTRAL',
      },
      {
        indicator: 'MACD (Estimated)',
        explanation:
          macd >= 0
            ? `Estimated MACD stays positive at ${macd.toFixed(2)}, indicating constructive trend pressure.`
            : `Estimated MACD stays negative at ${macd.toFixed(2)}, indicating defensive momentum pressure.`,
        impact: macd >= 0 ? 1.4 : -1.4,
        signal: macd >= 0 ? 'BUY' : 'SELL',
      },
      {
        indicator: 'Moving Average Structure',
        explanation:
          maDiff >= 0
            ? `Modeled MA5 (${formatUsd(ma5)}) is above MA20 (${formatUsd(ma20)}), keeping the setup in a bullish crossover posture.`
            : `Modeled MA5 (${formatUsd(ma5)}) is below MA20 (${formatUsd(ma20)}), which keeps the structure more defensive.`,
        impact: maDiff >= 0 ? 1.1 : -1.1,
        signal: maDiff >= 0 ? 'BUY' : 'SELL',
      },
      {
        indicator: 'Bollinger Bands (Estimated)',
        explanation:
          bbPosition <= 0.2
            ? `Price is modeled near the lower Bollinger band, which favors a discount-entry interpretation.`
            : bbPosition >= 0.8
              ? `Price is modeled near the upper Bollinger band, which raises mean-reversion risk.`
              : `Price is modeled in the middle Bollinger range, so valuation pressure is not yet at an extreme.`,
        impact: bullish ? 1.0 : bearish ? -1.0 : 0,
        signal: bullish ? 'BUY' : bearish ? 'SELL' : 'NEUTRAL',
      },
      {
        indicator: 'Volatility Envelope',
        explanation:
          volatility >= 0.05
            ? `Estimated volatility is ${(volatility * 100).toFixed(2)}%, so the overlay assumes smaller size and tighter execution.`
            : `Estimated volatility is ${(volatility * 100).toFixed(2)}%, which keeps the setup tradable without extreme noise.`,
        impact: 0,
        signal: 'RISK_FACTOR',
      },
    ],
    indicators_analyzed: 5,
    timestamp: new Date().toISOString(),
    ml_prediction: {
      model: 'Decision Model (Demo Overlay)',
      prediction,
      win_probability: Number(winProbability.toFixed(3)),
      feature_importance: {
        rsi: 0.24,
        macd: 0.21,
        ma_diff: 0.18,
        volatility: 0.16,
        bb_position: 0.13,
        price_change: 0.08,
      },
    },
  };
}

function buildFallbackTechnicalItems(signal) {
  return [
    {
      label: 'Signal Bias',
      value: signal.signal,
    },
    {
      label: 'Confidence Label',
      value: signal.confidenceLabel,
    },
    {
      label: 'Risk Score',
      value: `${signal.riskScore}/100`,
    },
    {
      label: 'Simulated Edge',
      value: signal.simulatedEdge,
    },
  ];
}

export default function SignalExplainabilityPage({ initialSymbol = 'BTC' }) {
  const router = useRouter();
  const wallet = useWallet();
  const walletMenuRef = useRef(null);
  const [signals, setSignals] = useState([]);
  const [marketLoading, setMarketLoading] = useState(true);
  const [walletMenuOpen, setWalletMenuOpen] = useState(false);
  const [intelligence, setIntelligence] = useState({
    explain: null,
    research: null,
    sentiment: null,
    news: null,
    etf: null,
    llm: null,
    performance: null,
  });
  const [marketOverlay, setMarketOverlay] = useState({
    prices: {},
    source: 'Loading market overlay...',
    updatedAt: null,
    loading: true,
    refreshing: false,
    note: null,
  });
  const [explainStatus, setExplainStatus] = useState({
    source: 'Loading explainability layer...',
    updatedAt: null,
    loading: true,
    refreshing: false,
    note: null,
  });
  const [signalRuntime, setSignalRuntime] = useState({
    message: 'Live signal runtime is syncing...',
    nextRefreshAt: null,
    generationAllowed: true,
    generationLocked: false,
    signalAvailable: false,
    generating: false,
  });
  const [reloadToken, setReloadToken] = useState(0);
  const [marketError, setMarketError] = useState(null);
  const [explainError, setExplainError] = useState(null);
  const [clockNow, setClockNow] = useState(Date.now());

  const handleForceRefreshPrice = () => {
    console.log('[Force Refresh] Clearing cache and reloading...');
    cache.cache.delete(MARKET_CACHE_KEY); // Access internal Map
    setReloadToken(prev => prev + 1);
  };

  const requestedSymbol = useMemo(() => {
    const querySymbol =
      typeof router.query.symbol === 'string' && router.query.symbol
        ? router.query.symbol
        : initialSymbol;

    return String(querySymbol || 'BTC').toUpperCase();
  }, [initialSymbol, router.query.symbol]);

  const activeSymbol = requestedSymbol;
  const walletView = getWalletPresentation(wallet);
  const latestMarketSnapshotRef = useRef(null);
  const latestExplainSnapshotRef = useRef(null);

  // Load live signals from the same endpoint as AI Decision
  const loadLiveSignals = async () => {
    try {
      setMarketLoading(true);

      const response = await fetch(`/api/app/terminal?symbol=${activeSymbol}`);

      if (!response.ok) {
        throw new Error(`Terminal API returned ${response.status}`);
      }

      const payload = await response.json();
      const liveSignals = payload?.data?.signals || [];

      console.log('[AI Explainer] Live signals loaded:', {
        count: liveSignals.length,
        symbols: liveSignals.map(s => s.symbol),
        btcPrice: liveSignals.find(s => s.symbol === 'BTC')?.price
      });

      setSignals(liveSignals);
    } catch (error) {
      console.error('[AI Explainer] Failed to load live signals:', error);
      // Fallback to aiSignals if fetch fails
      setSignals(aiSignals);
    } finally {
      setMarketLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setInterval(() => {
      setClockNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  // Load live signals on mount and refresh every 15 seconds
  useEffect(() => {
    loadLiveSignals();

    const interval = setInterval(loadLiveSignals, 15000);

    return () => clearInterval(interval);
  }, [activeSymbol]);

  useEffect(() => {
    latestMarketSnapshotRef.current = marketOverlay;
  }, [marketOverlay]);

  useEffect(() => {
    latestExplainSnapshotRef.current = {
      symbol: activeSymbol,
      explain: intelligence.explain,
      research: intelligence.research,
      sentiment: intelligence.sentiment,
      news: intelligence.news,
      etf: intelligence.etf,
      llm: intelligence.llm,
      performance: intelligence.performance,
      source: explainStatus.source,
      updatedAt: explainStatus.updatedAt,
      signalRuntime,
    };
  }, [activeSymbol, explainStatus.source, explainStatus.updatedAt, intelligence, signalRuntime]);

  useEffect(() => {
    let active = true;
    let intervalId = null;
    let activeController = null;

    const loadMarketOverlay = async () => {
      const cached = cache.get(MARKET_CACHE_KEY) || latestMarketSnapshotRef.current;
      const hasCachedSnapshot = Boolean(cached?.updatedAt || Object.keys(cached?.prices || {}).length);
      const hasDemoSnapshot = cached?.source === 'Demo market overlay';

      console.log('[loadMarketOverlay] Cache check:', {
        hasCachedSnapshot,
        hasDemoSnapshot,
        cachedSource: cached?.source,
        cachedSymbols: Object.keys(cached?.prices || {}),
        sampleCachedPrice: cached?.prices?.['BTC']?.price
      });

      if (hasCachedSnapshot && active) {
        setMarketOverlay((current) => ({
          prices: cached?.prices || current.prices || {},
          source: cached?.source || current.source || 'Live market overlay',
          updatedAt: cached?.updatedAt || current.updatedAt || null,
          loading: false,
          refreshing: true,
          note: 'Showing the current cached market context while live prices refresh in the background.',
        }));
      } else if (!hasDemoSnapshot && active) {
        setMarketOverlay({
          prices: {},
          source: 'Loading market overlay...',
          updatedAt: null,
          loading: true,
          refreshing: false,
          note: null,
        });
      }

      activeController?.abort();
      const controller = new AbortController();
      activeController = controller;

      try {
        console.log('[loadMarketOverlay] Fetching from /api/market/prices...');
        const payload = await fetchJson('/api/market/prices', {
          signal: controller.signal,
        });

        if (!active || controller.signal.aborted) {
          return;
        }

        const nextOverlay = {
          prices: payload?.data || {},
          source: payload?.source === 'cache' ? 'Cached market overlay' : 'Live market overlay',
          updatedAt: Date.now(),
          loading: false,
          refreshing: false,
          note: null,
        };

        console.log('[AI Explainer] Market prices loaded:', {
          symbols: Object.keys(nextOverlay.prices),
          count: Object.keys(nextOverlay.prices).length,
          source: nextOverlay.source,
          samplePrice: nextOverlay.prices['BTC']?.price
        });

        cache.set(
          MARKET_CACHE_KEY,
          {
            prices: nextOverlay.prices,
            source: nextOverlay.source,
            updatedAt: nextOverlay.updatedAt,
          },
          45
        );
        setMarketOverlay(nextOverlay);
        setMarketError(null);
      } catch (error) {
        if (error.name === 'AbortError' || !active || controller.signal.aborted) {
          return;
        }

        console.error('[AI Explainer] Market prices fetch failed:', error);
        setMarketError(error.message || 'Unable to refresh live market overlay');
        setMarketOverlay((current) => {
          const hasCurrentSnapshot = Boolean(current.updatedAt || Object.keys(current.prices || {}).length);

          if (hasCurrentSnapshot) {
            return {
              ...current,
              source: 'Cached market overlay',
              loading: false,
              refreshing: false,
              note: 'Live market data is unavailable right now, so the latest market context stays visible.',
            };
          }

          return {
            prices: {},
            source: 'Demo market overlay',
            updatedAt: null,
            loading: false,
            refreshing: false,
            note: 'Live market data is unavailable right now, so demo market context is active until retry.',
          };
        });
      }
    };

    loadMarketOverlay();
    intervalId = window.setInterval(() => {
      loadMarketOverlay();
    }, MARKET_REFRESH_MS);

    return () => {
      active = false;
      if (intervalId) {
        window.clearInterval(intervalId);
      }
      if (activeController) {
        activeController.abort();
      }
    };
  }, [reloadToken]);

  useEffect(() => {
    let active = true;
    let intervalId = null;
    let activeController = null;

    const loadExplainability = async () => {
      const cacheKey = `${EXPLAIN_CACHE_PREFIX}${activeSymbol}`;
      const latestSnapshot =
        latestExplainSnapshotRef.current?.symbol === activeSymbol ? latestExplainSnapshotRef.current : null;
      const cached = cache.get(cacheKey) || latestSnapshot;
      const hasCachedSnapshot = Boolean(cached?.explain || cached?.updatedAt);
      const hasDemoSnapshot = cached?.source === 'Demo explainability layer';

      if (hasCachedSnapshot && active) {
        setIntelligence({
          explain: cached.explain,
          research: cached.research,
          sentiment: cached.sentiment,
          news: cached.news,
          etf: cached.etf,
          llm: cached.llm || null,
          performance: cached.performance || null,
        });
        setExplainStatus({
          source: cached.source || 'Live explainability layer',
          updatedAt: cached.updatedAt || null,
          loading: false,
          refreshing: true,
          note: `Showing the current cached explainability layer for ${activeSymbol} while live analysis refreshes in the background.`,
        });
        if (cached.signalRuntime) {
          setSignalRuntime((current) => ({
            ...current,
            ...cached.signalRuntime,
            generating: false,
          }));
        }
      } else if (!hasDemoSnapshot && active) {
        setIntelligence({
          explain: null,
          research: null,
          sentiment: null,
          news: null,
          etf: null,
          llm: null,
          performance: null,
        });
        setExplainStatus({
          source: 'Loading explainability layer...',
          updatedAt: null,
          loading: true,
          refreshing: false,
          note: null,
        });
        setSignalRuntime({
          message: `Loading ${activeSymbol} live signal runtime...`,
          nextRefreshAt: null,
          generationAllowed: true,
          generationLocked: false,
          signalAvailable: false,
          generating: false,
        });
      }

      activeController?.abort();
      const controller = new AbortController();
      activeController = controller;

      const results = await Promise.allSettled([
        fetchExplainabilityBundle(activeSymbol, {
          signal: controller.signal,
        }),
        fetchSymbolPerformance(activeSymbol, {
          signal: controller.signal,
        }),
      ]);

      if (!active || controller.signal.aborted) {
        return;
      }

      const explainBundleSucceeded = results[0].status === 'fulfilled' && Boolean(results[0].value?.data);
      const explainBundle = results[0].status === 'fulfilled' ? results[0].value || null : null;
      const bundleData = explainBundle?.data || {};
      const performancePayload = results[1].status === 'fulfilled' ? results[1].value || null : null;
      const explainErrorMessage =
        results[0].status === 'rejected'
          ? results[0].reason?.message || 'Unable to refresh live explainability layer'
          : explainBundleSucceeded
            ? null
            : 'Unable to refresh live explainability layer';
      const nextExplain =
        explainBundleSucceeded ? bundleData.explain || cached?.explain || null : cached?.explain || null;
      const nextResearch = explainBundleSucceeded ? bundleData.research || cached?.research || null : cached?.research || null;
      const nextSentiment =
        explainBundleSucceeded ? bundleData.sentiment || cached?.sentiment || null : cached?.sentiment || null;
      const nextNews = explainBundleSucceeded ? bundleData.news || cached?.news || null : cached?.news || null;
      const nextEtf = explainBundleSucceeded ? bundleData.etf || cached?.etf || null : cached?.etf || null;
      const nextLlm = explainBundleSucceeded ? bundleData.llm || cached?.llm || null : cached?.llm || null;
      const nextPerformance =
        performancePayload?.data || (explainBundleSucceeded ? bundleData.performance || null : null) || cached?.performance || null;
      const nextSource = explainBundleSucceeded
        ? explainBundle?.cache_hit
          ? 'Cached explainability layer'
          : 'Live explainability layer'
        : nextExplain
          ? 'Cached explainability layer'
          : cached?.source || 'Demo explainability layer';
      const nextUpdatedAt = explainBundleSucceeded ? Date.now() : cached?.updatedAt || null;
      const nextRuntime = {
        message:
          explainBundle?.message ||
          (explainBundleSucceeded
            ? explainBundle?.cache_hit
              ? `Latest ${activeSymbol} signal snapshot is active.`
              : `Fresh signal generated. The next manual generation window opens in ${formatRefreshWindow(
                  explainBundle?.next_refresh_in_seconds
                )}.`
            : cached?.signalRuntime?.message || 'Live signal runtime is syncing...'),
        nextRefreshAt:
          typeof explainBundle?.next_refresh_in_seconds === 'number'
            ? Date.now() + Math.max(0, Number(explainBundle.next_refresh_in_seconds || 0)) * 1000
            : cached?.signalRuntime?.nextRefreshAt || null,
        generationAllowed: Boolean(
          explainBundle?.generation_allowed ?? cached?.signalRuntime?.generationAllowed ?? true
        ),
        generationLocked: Boolean(
          explainBundle?.generation_locked ?? cached?.signalRuntime?.generationLocked ?? false
        ),
        signalAvailable: Boolean(explainBundle?.signal_available ?? nextExplain),
        generating: false,
      };

      setIntelligence({
        explain: nextExplain,
        research: nextResearch,
        sentiment: nextSentiment,
        news: nextNews,
        etf: nextEtf,
        llm: nextLlm,
        performance: nextPerformance,
      });
      setExplainStatus({
        source: nextSource,
        updatedAt: nextUpdatedAt,
        loading: false,
        refreshing: false,
        note: explainBundleSucceeded
          ? null
          : nextExplain
            ? `Live explainability is unavailable right now, so the latest ${activeSymbol} review stays visible.`
            : `Live explainability is unavailable right now, so demo explainability is active for ${activeSymbol} until retry.`,
      });
      setExplainError(explainErrorMessage);
      setSignalRuntime(nextRuntime);

      if (nextExplain) {
        cache.set(
          cacheKey,
          {
            explain: nextExplain,
            research: nextResearch,
            sentiment: nextSentiment,
            news: nextNews,
            etf: nextEtf,
            llm: nextLlm,
            performance: nextPerformance,
            source: nextSource,
            updatedAt: nextUpdatedAt,
            signalRuntime: nextRuntime,
          },
          60
        );
      }
    };

    loadExplainability();
    intervalId = window.setInterval(() => {
      loadExplainability();
    }, EXPLAIN_REFRESH_MS);

    return () => {
      active = false;
      if (intervalId) {
        window.clearInterval(intervalId);
      }
      if (activeController) {
        activeController.abort();
      }
    };
  }, [activeSymbol, reloadToken]);

  // SIMPLE: Just use signals from terminal API (same as AI Decision)
  const signal = useMemo(() => {
    const found = signals.find((item) => item.symbol === activeSymbol);

    if (found) {
      console.log('[signal] Using signal from terminal API:', {
        symbol: found.symbol,
        price: found.price,
        name: found.name
      });
      return found;
    }

    // Fallback to first signal or aiSignals
    const fallback = signals[0] || aiSignals.find(s => s.symbol === activeSymbol) || aiSignals[0];
    console.log('[signal] Using fallback:', {
      symbol: fallback?.symbol,
      price: fallback?.price
    });

    return fallback;
  }, [activeSymbol, signals]);

  const tickerSignals = useMemo(() => {
    if (!signals.length) {
      return [];
    }

    return [...signals, ...signals];
  }, [signals]);

  const symbolTabs = useMemo(() => {
    return EXPLAINER_SYMBOLS.map((symbolCode) => {
      // Priority: signals from terminal API (same as AI Decision)
      const liveSignal = signals.find((item) => item.symbol === symbolCode);
      const fallbackSignal = aiSignals.find((item) => item.symbol === symbolCode);
      const curatedAsset = liveSignal || fallbackSignal || null;

      const confidence =
        symbolCode === activeSymbol && intelligence.explain?.confidence
          ? Number(intelligence.explain.confidence)
          : curatedAsset?.confidence ?? null;

      return {
        symbol: symbolCode,
        name: curatedAsset?.name || EXPLAINER_ASSET_META[symbolCode]?.name || symbolCode,
        icon: EXPLAINER_ASSET_META[symbolCode]?.icon || symbolCode.slice(0, 1),
        price: Number(curatedAsset?.price || 0),
        change24h: Number(curatedAsset?.change24h || 0),
        confidence,
        isCurated: Boolean(liveSignal),
      };
    });
  }, [activeSymbol, intelligence.explain?.confidence, signals]);

  const confidencePercent = Math.round(
    clamp(
      Number((intelligence.explain?.combined_confidence ?? intelligence.explain?.confidence ?? signal.confidence) || 0) *
        100,
      0,
      100
    )
  );
  const ringCircumference = 2 * Math.PI * 70;
  const ringOffset = ringCircumference - (confidencePercent / 100) * ringCircumference;
  const demoExplain = useMemo(() => buildDemoExplainability(signal, marketOverlay.prices[activeSymbol]), [activeSymbol, marketOverlay.prices, signal]);
  const hasLiveExplain = Boolean(intelligence.explain);
  const explainOverlay = intelligence.explain || demoExplain;

  const technicalItems = useMemo(() => {
    const explain = explainOverlay;

    if (!explain?.indicators) {
      return buildFallbackTechnicalItems(signal);
    }

    return [
      {
        label: 'RSI',
        value: Number(explain.indicators.rsi || 0).toFixed(1),
      },
      {
        label: 'MACD',
        value: Number(explain.indicators.macd || 0).toFixed(2),
      },
      {
        label: 'Volatility',
        value: `${(Number(explain.indicators.volatility || 0) * 100).toFixed(2)}%`,
      },
      {
        label: 'Buy / Sell',
        value: `${Math.round(Number(explain.buy_score || 0))} / ${Math.round(Number(explain.sell_score || 0))}`,
      },
    ];
  }, [explainOverlay, signal]);

  const liveExplain = explainOverlay;
  const indicatorSnapshot = explainOverlay?.indicators || null;
  const mlPrediction = explainOverlay?.ml_prediction || null;
  const recommendation = getRecommendationSignal(explainOverlay, signal.signal);
  const marketPrice = Number(marketOverlay.prices[activeSymbol]?.price ?? signal.price ?? 0);
  const marketChange = Number(marketOverlay.prices[activeSymbol]?.change_24h ?? signal.change24h ?? 0);
  const hasLivePrice = Boolean(marketOverlay.prices[activeSymbol]?.price);
  const priceSource = hasLivePrice ? marketOverlay.source : 'Fallback data';

  console.log('[AI Explainer] Price data:', {
    symbol: activeSymbol,
    hasLivePrice,
    marketPrice,
    marketChange,
    source: priceSource,
    overlayStatus: marketOverlay.source,
    overlayLoading: marketOverlay.loading,
    overlayRefreshing: marketOverlay.refreshing
  });
  const sentimentSummary = useMemo(() => {
    const sentimentUp = Number(intelligence.sentiment?.sentiment_up || 0);

    return {
      value: sentimentUp ? `${Math.round(sentimentUp)}% up` : 'Awaiting',
      label: sentimentUp ? getSentimentLabel(sentimentUp) : 'Pending sentiment',
      caption: intelligence.sentiment
        ? `${formatCompactCount(intelligence.sentiment.twitter_followers)} X followers · ${formatCompactCount(intelligence.sentiment.reddit_subscribers)} Reddit members`
        : 'Community sentiment will appear here when the live overlay responds.',
    };
  }, [intelligence.sentiment]);
  const etfSummary = useMemo(() => {
    const metrics = intelligence.etf || null;
    const aggregate = metrics?.aggregate || {};

    return {
      regime: metrics?.regime || 'ETF overlay pending',
      flowLabel: getEtfFlowLabel(metrics),
      caption:
        metrics?.regime_explanation ||
        (Number(aggregate?.daily_net_inflow_usd?.value || 0)
          ? `Daily net flow ${getEtfFlowLabel(metrics)} with ${formatCompactUsd(aggregate?.total_net_assets_usd?.value || 0)} in net assets.`
          : 'Spot ETF regime context will appear here when available.'),
    };
  }, [intelligence.etf]);
  const newsArticles = intelligence.news?.articles || [];

  const attributionItems = useMemo(() => {
    if (signal.confidenceDrivers?.length) {
      return signal.confidenceDrivers.map((item) => ({
        title: item.label,
        score: item.weight,
        detail: item.detail,
        impact: null,
      }));
    }

    return ((explainOverlay?.reasoning || []).slice(0, 4) || []).map((item) => ({
      title: item.indicator,
      score: clamp(Math.round(Math.abs(Number(item.impact || 0)) * 14 + 8), 8, 32),
      detail: item.explanation,
      impact: Number(item.impact || 0),
    }));
  }, [explainOverlay, signal.confidenceDrivers]);

  const fallbackResearchCards = useMemo(() => {
    return researchFeed
      .filter((item) => item.related.includes(activeSymbol))
      .slice(0, 2)
      .map((item) => ({
        title: item.title,
        impact: item.sentiment,
        detail: item.whyItMatters,
      }));
  }, [activeSymbol]);

  const catalystCards = useMemo(() => {
    const localCatalysts = (signal.catalysts || []).map((item) => ({
      title: item.title,
      impact: item.impact,
      detail: item.detail,
    }));

    const researchCards = ((intelligence.research?.latest_news || []).slice(0, 2) || []).map((item) => ({
      title: item.title,
      impact: item.category_label || intelligence.research?.catalyst_label || 'Research',
      detail: item.summary || 'Recent research context from SoSoValue.',
    }));
    const newsCards = (newsArticles.slice(0, 2) || []).map((item) => ({
      title: item.title,
      impact: item.category_label || item.source || 'News',
      detail: item.summary || item.source_link || 'Recent symbol-specific news from SoSoValue.',
    }));
    const mergedCards = Array.from(
      new Map(
        [...localCatalysts, ...researchCards, ...newsCards, ...fallbackResearchCards].map((item) => [item.title, item])
      ).values()
    ).slice(0, 4);

    if (mergedCards.length) {
      return mergedCards;
    }

    return [
      {
        title: `Waiting for ${activeSymbol} live catalyst overlay`,
        impact: 'Live',
        detail:
          'This asset is available in the AI Explainer, but catalyst cards will populate once the live explainability or research layer returns.',
      },
    ];
  }, [activeSymbol, fallbackResearchCards, intelligence.research, newsArticles, signal.catalysts]);

  const riskRows = useMemo(() => {
    if (signal.riskVectors?.length) {
      return signal.riskVectors.map((item) => ({
        label: item.label,
        value: clamp(Math.round(Number(item.value || 0)), 0, 100),
        detail: item.commentary,
      }));
    }

    return [
      {
        label: 'Invalidation Risk',
        value: clamp(Math.round(Number(explainOverlay?.risk_score || signal.riskScore || 35)), 0, 100),
        detail: 'Technical invalidation is tied to the current signal confidence and price structure.',
      },
      {
        label: 'Crowding Risk',
        value: intelligence.sentiment?.sentiment_up
          ? clamp(Math.round(Math.abs(Number(intelligence.sentiment.sentiment_up) - 50) * 1.4), 12, 74)
          : 24,
        detail: intelligence.sentiment
          ? `Community votes are reading ${Math.round(Number(intelligence.sentiment.sentiment_up || 0))}% bullish, which helps estimate crowding pressure.`
          : 'Crowding estimate is moderate without a live derivative stress signal.',
      },
      {
        label: 'Slippage Risk',
        value: activeSymbol === 'BTC' || activeSymbol === 'ETH' ? 14 : 28,
        detail: 'Liquidity depth is stronger on majors and thinner on higher-beta assets.',
      },
    ];
  }, [activeSymbol, explainOverlay, intelligence.sentiment, signal.riskScore, signal.riskVectors]);

  const orderFlowItems = useMemo(() => {
    const baseItems = signal.orderFlow || [];
    const liveItems = [];

    if (intelligence.sentiment?.sentiment_up) {
      liveItems.push({
        venue: 'Community sentiment',
        bias: getSentimentLabel(intelligence.sentiment.sentiment_up),
        value: `${Math.round(Number(intelligence.sentiment.sentiment_up || 0))}% up`,
      });
    }

    if (intelligence.etf?.aggregate?.daily_net_inflow_usd?.value) {
      liveItems.push({
        venue: 'ETF daily flow',
        bias: intelligence.etf.regime || 'ETF',
        value: getEtfFlowLabel(intelligence.etf),
      });
    }

    if (newsArticles[0]?.source) {
      liveItems.push({
        venue: 'Latest headline',
        bias: newsArticles[0].source,
        value: newsArticles[0].category_label || 'News',
      });
    }

    // Merge and deduplicate by venue, prioritizing liveItems
    const venueMap = new Map();
    [...baseItems, ...liveItems].forEach(item => {
      if (!venueMap.has(item.venue)) {
        venueMap.set(item.venue, item);
      }
    });

    return Array.from(venueMap.values()).slice(0, 4);
  }, [intelligence.etf, intelligence.sentiment, newsArticles, signal.orderFlow]);
  // Simple: Just use signal.price directly (already merged by useMarketPulse)
  const currentPrice = Number(signal?.price || 0);
  const macroRegime =
    intelligence.etf?.regime || intelligence.research?.macro_context?.overall_regime || signal.regime;
  const researchLabel =
    intelligence.research?.catalyst_label || (intelligence.sentiment ? getSentimentLabel(intelligence.sentiment.sentiment_up) : signal.confidenceLabel);
  const analyzedIndicators = explainOverlay?.indicators_analyzed || attributionItems.length;
  const buyScore = Number(explainOverlay?.buy_score || 0);
  const sellScore = Number(explainOverlay?.sell_score || 0);
  const rsiValue = Number(indicatorSnapshot?.rsi || 0);
  const macdValue = Number(indicatorSnapshot?.macd || 0);
  const ma5Value = Number(indicatorSnapshot?.ma_5 || 0);
  const ma20Value = Number(indicatorSnapshot?.ma_20 || 0);
  const maDiffValue = Number(indicatorSnapshot?.ma_diff || ma5Value - ma20Value || 0);
  const bbUpperValue = Number(indicatorSnapshot?.bb_upper || 0);
  const bbLowerValue = Number(indicatorSnapshot?.bb_lower || 0);
  const bbPositionValue = clamp(Number(indicatorSnapshot?.bb_position || 0), 0, 1);
  const volatilityValue = Number(indicatorSnapshot?.volatility || 0);
  const rsiInsight = indicatorSnapshot ? getRsiInsight(rsiValue) : null;
  const macdInsight = indicatorSnapshot ? getMacdInsight(macdValue) : null;
  const movingAverageInsight = indicatorSnapshot ? getMovingAverageInsight(ma5Value, ma20Value) : null;
  const bollingerInsight = indicatorSnapshot ? getBollingerInsight(bbPositionValue) : null;
  const mlFeatureItems = useMemo(() => {
    return Object.entries(mlPrediction?.feature_importance || {})
      .sort(([, left], [, right]) => Number(right || 0) - Number(left || 0))
      .slice(0, 5);
  }, [mlPrediction]);

  const riskSummaryCards = useMemo(() => {
    return [
      {
        label: 'Risk Score',
        value: `${clamp(Math.round(Number(liveExplain?.risk_score || signal.riskScore || 35)), 0, 100)}/100`,
        caption: 'Composite invalidation risk across structure, volatility, and execution.',
      },
      {
        label: intelligence.sentiment ? 'Community Sentiment' : 'Volatility',
        value: intelligence.sentiment
          ? `${Math.round(Number(intelligence.sentiment.sentiment_up || 0))}% up`
          : indicatorSnapshot
            ? `${(volatilityValue * 100).toFixed(2)}%`
            : signal.confidenceLabel,
        caption: intelligence.sentiment
          ? sentimentSummary.caption
          : indicatorSnapshot
            ? getVolatilityInsight(volatilityValue)
            : 'Live volatility appears here when explainability is available.',
      },
      {
        label: intelligence.etf ? 'ETF Flow Regime' : 'Position Size',
        value: intelligence.etf
          ? etfSummary.flowLabel
          : liveExplain?.position_size
            ? `${Number(liveExplain.position_size).toFixed(1)}%`
            : signal.rewardRisk,
        caption: intelligence.etf
          ? etfSummary.caption
          : liveExplain?.position_size
            ? 'Suggested max allocation from the live explainability layer before execution approval.'
            : 'Curated reward-to-risk guidance remains active while live position sizing is unavailable.',
      },
    ];
  }, [
    etfSummary.caption,
    etfSummary.flowLabel,
    indicatorSnapshot,
    intelligence.etf,
    intelligence.sentiment,
    liveExplain,
    sentimentSummary.caption,
    signal.confidenceLabel,
    signal.rewardRisk,
    signal.riskScore,
    volatilityValue,
  ]);

  const nextRefreshInSeconds = signalRuntime.nextRefreshAt
    ? Math.max(0, Math.ceil((signalRuntime.nextRefreshAt - clockNow) / 1000))
    : 0;
  const scoreBreakdownRows = useMemo(() => {
    return [
      {
        label: 'Signal Forecast',
        value: confidencePercent,
      },
      {
        label: 'Pattern Confirmation',
        value: getPatternConfirmationPercent(liveExplain),
      },
      {
        label: 'Market Sentiment',
        value: getSentimentSupportPercent(
          recommendation,
          intelligence.sentiment?.sentiment_up,
          marketChange
        ),
      },
    ];
  }, [confidencePercent, intelligence.sentiment?.sentiment_up, liveExplain, marketChange, recommendation]);
  const pnlStat = useMemo(() => formatPnlStat(intelligence.performance), [intelligence.performance]);
  const scorecardStats = useMemo(() => {
    const winRate = Number(
      intelligence.performance?.win_rate ||
        ((Number(mlPrediction?.win_probability || 0) || 0) * 100)
    );
    const totalTrades = Number(intelligence.performance?.total_trades || 0);

    return [
      {
        label: 'Win Rate',
        value: Number.isFinite(winRate) && winRate > 0 ? `${winRate.toFixed(1)}%` : 'Awaiting',
        tone: winRate >= 50 ? styles.statValueBullish : styles.statValueMuted,
      },
      {
        label: 'Total PnL',
        value: pnlStat.label,
        tone: pnlStat.positive ? styles.statValueBullish : styles.statValueBearish,
      },
      {
        label: 'Trades',
        value: totalTrades > 0 ? new Intl.NumberFormat('en-US').format(totalTrades) : '0',
        tone: styles.statValueNeutral,
      },
      {
        label: 'Avg Hold',
        value: deriveHoldWindow(liveExplain, signal.horizon, marketChange),
        tone: styles.statValueNeutral,
      },
    ];
  }, [intelligence.performance, liveExplain, marketChange, mlPrediction?.win_probability, pnlStat, signal.horizon]);
  const generateSignalHeading = signalRuntime.generationAllowed
    ? `Manual refresh is available ${signalRuntime.signalAvailable ? 'now' : 'for the first snapshot'}`
    : `Next manual refresh in ${formatRefreshWindow(nextRefreshInSeconds)}`;
  const generateSignalDetail =
    signalRuntime.message ||
    (signalRuntime.generationAllowed
      ? `Generate a fresh ${activeSymbol} signal snapshot from the live explainability stack.`
      : `The latest ${activeSymbol} signal snapshot is still inside the 15 minute cooldown window.`);

  const confidenceLabel = signal.confidenceLabel || deriveConfidenceLabel(confidencePercent / 100);
  const assetModeTitle = signal?.liveSnapshot
    ? 'Live Signal Snapshot'
    : signal?.symbol
      ? 'Curated Signal Pack'
      : 'Explainability-Only Asset';
  const marketSourceLabel = getDataSourceLabel('market', marketOverlay);
  const explainSourceLabel = getDataSourceLabel('explainability', explainStatus);
  const lastAiUpdateValue = explainStatus.loading
    ? 'Loading live overlay...'
    : hasLiveExplain
      ? formatUpdateTime(explainStatus.updatedAt)
      : 'Demo fallback active';
  const appHref = `/app?symbol=${activeSymbol}`;
  const explainerHref = `/ai-explainer?symbol=${activeSymbol}`;
  const liveFeedAlert = useMemo(() => {
    if (explainError && marketError) {
      return {
        title: 'Live explainer preview is active.',
        message: `${explainError} Market context also failed to refresh.`,
      };
    }

    if (explainError) {
      return {
        title: 'Live explainability preview is active.',
        message: explainError,
      };
    }

    if (marketError) {
      return {
        title: 'Live market context preview is active.',
        message: marketError,
      };
    }

    return null;
  }, [explainError, marketError]);
  const runtimeNotice = useMemo(() => {
    if (marketOverlay.refreshing && explainStatus.refreshing) {
      return {
        tone: 'info',
        title: 'Refreshing live overlay...',
        detail: `Showing the current cached market context and ${activeSymbol} explainability layer while live feeds refresh in the background.`,
      };
    }

    if (explainStatus.refreshing) {
      return {
        tone: 'info',
        title: 'Refreshing live explainability...',
        detail: explainStatus.note,
      };
    }

    if (marketOverlay.refreshing) {
      return {
        tone: 'info',
        title: 'Refreshing live market context...',
        detail: marketOverlay.note,
      };
    }

    if (explainStatus.note) {
      return {
        tone: 'warning',
        title: explainSourceLabel === 'Demo explainability active' ? 'Demo explainability active.' : 'Cached explainability active.',
        detail: explainStatus.note,
      };
    }

    if (marketOverlay.note) {
      return {
        tone: 'warning',
        title: marketSourceLabel === 'Demo market overlay active' ? 'Demo market overlay active.' : 'Cached market overlay active.',
        detail: marketOverlay.note,
      };
    }

    return null;
  }, [
    activeSymbol,
    explainSourceLabel,
    explainStatus.note,
    explainStatus.refreshing,
    marketOverlay.note,
    marketOverlay.refreshing,
    marketSourceLabel,
  ]);
  const recommendationRailItems = useMemo(() => {
    return [
      {
        label: 'AI Recommendation',
        value: recommendation,
        meta: hasLiveExplain ? `${liveExplain.indicators_analyzed} live inputs` : 'Demo explainability layer',
        tone: getRecommendationTone(recommendation),
      },
      {
        label: 'Asset Mode',
        value: assetModeTitle,
        meta: signal?.confidence
          ? 'Full signal pack with curated entries, catalysts, and risk commentary.'
          : 'Live explainability is available even without a curated signal pack.',
      },
      {
        label: 'Explainability Layer',
        value: explainSourceLabel,
        meta: explainStatus.refreshing
          ? 'Showing the current snapshot while live analysis refreshes.'
          : hasLiveExplain
            ? 'Live explainability layer'
            : 'Fallback explainability layer',
      },
      {
        label: 'Community Sentiment',
        value: sentimentSummary.label,
        meta: sentimentSummary.caption,
      },
      {
        label: 'ETF Regime',
        value: etfSummary.regime,
        meta: etfSummary.caption,
      },
      {
        label: 'Last Update',
        value: lastAiUpdateValue,
        meta: explainSourceLabel,
      },
    ];
  }, [
    assetModeTitle,
    explainSourceLabel,
    explainStatus.refreshing,
    hasLiveExplain,
    signal?.confidence,
    lastAiUpdateValue,
    liveExplain,
    recommendation,
    sentimentSummary.caption,
    sentimentSummary.label,
    etfSummary.caption,
    etfSummary.regime,
  ]);

  const recommendationSummaryCaption = hasLiveExplain
    ? `${liveExplain.indicators_analyzed} live indicators are contributing to this call, ${sentimentSummary.label.toLowerCase()} sentiment is in the backdrop, and the current overlay still reads as ${confidenceLabel.toLowerCase()} conviction.`
    : 'The live explainability layer is unavailable, so this recommendation is using the same demo-style fallback as the original AI Explainer.';

  const handleWalletAction = async () => {
    if (wallet.initializing) {
      return;
    }

    if (!wallet.providerAvailable) {
      wallet.openInstallWallet();
      return;
    }

    if (!wallet.isConnected) {
      await wallet.connectWallet();
      return;
    }

    if (wallet.isWrongNetwork) {
      try {
        await wallet.switchToSupportedNetwork();
      } catch (error) {
        console.error('Network switch failed:', error);
      }
      return;
    }

    setWalletMenuOpen((current) => !current);
  };

  const handleWalletSwitch = async () => {
    setWalletMenuOpen(false);
    await wallet.switchWallet();
  };

  const handleWalletDisconnect = async () => {
    setWalletMenuOpen(false);
    await wallet.disconnectWallet();
  };

  const handleGenerateSignal = async () => {
    const cacheKey = `${EXPLAIN_CACHE_PREFIX}${activeSymbol}`;
    const cached =
      cache.get(cacheKey) ||
      (latestExplainSnapshotRef.current?.symbol === activeSymbol ? latestExplainSnapshotRef.current : null);

    setSignalRuntime((current) => ({
      ...current,
      generating: true,
      message: `Generating a fresh ${activeSymbol} signal snapshot...`,
    }));
    setExplainError(null);

    const results = await Promise.allSettled([
      fetchExplainabilityBundle(activeSymbol, {
        forceRefresh: true,
      }),
      fetchSymbolPerformance(activeSymbol),
    ]);

    const explainBundleSucceeded = results[0].status === 'fulfilled' && Boolean(results[0].value?.data);
    const explainBundle = results[0].status === 'fulfilled' ? results[0].value || null : null;
    const bundleData = explainBundle?.data || {};
    const performancePayload = results[1].status === 'fulfilled' ? results[1].value || null : null;

    if (!explainBundleSucceeded && !cached?.explain) {
      const message =
        results[0].status === 'rejected'
          ? results[0].reason?.message || 'Unable to generate a fresh signal snapshot.'
          : 'Unable to generate a fresh signal snapshot.';
      setExplainError(message);
      setSignalRuntime((current) => ({
        ...current,
        generating: false,
        message,
      }));
      return;
    }

    const nextExplain = bundleData.explain || cached?.explain || null;
    const nextResearch = bundleData.research || cached?.research || null;
    const nextSentiment = bundleData.sentiment || cached?.sentiment || null;
    const nextNews = bundleData.news || cached?.news || null;
    const nextEtf = bundleData.etf || cached?.etf || null;
    const nextLlm = bundleData.llm || cached?.llm || null;
    const nextPerformance = performancePayload?.data || cached?.performance || null;
    const nextSource = explainBundle?.cache_hit ? 'Cached explainability layer' : 'Live explainability layer';
    const nextUpdatedAt = Date.now();
    const nextRuntime = {
      message:
        explainBundle?.message ||
        (explainBundle?.cache_hit
          ? `Latest ${activeSymbol} signal snapshot is still active.`
          : `Fresh signal generated. The next manual generation window opens in ${formatRefreshWindow(
              explainBundle?.next_refresh_in_seconds
            )}.`),
      nextRefreshAt:
        Date.now() + Math.max(0, Number(explainBundle?.next_refresh_in_seconds || 0)) * 1000,
      generationAllowed: Boolean(explainBundle?.generation_allowed),
      generationLocked: Boolean(explainBundle?.generation_locked),
      signalAvailable: Boolean(explainBundle?.signal_available ?? nextExplain),
      generating: false,
    };

    setIntelligence({
      explain: nextExplain,
      research: nextResearch,
      sentiment: nextSentiment,
      news: nextNews,
      etf: nextEtf,
      llm: nextLlm,
      performance: nextPerformance,
    });
    setExplainStatus({
      source: nextSource,
      updatedAt: nextUpdatedAt,
      loading: false,
      refreshing: false,
      note: explainBundle?.cache_hit && explainBundle?.generation_locked ? nextRuntime.message : null,
    });
    setSignalRuntime(nextRuntime);
    setExplainError(
      results[0].status === 'rejected'
        ? results[0].reason?.message || 'Unable to refresh live explainability layer'
        : null
    );

    if (nextExplain) {
      cache.set(
        cacheKey,
        {
          explain: nextExplain,
          research: nextResearch,
          sentiment: nextSentiment,
          news: nextNews,
          etf: nextEtf,
          llm: nextLlm,
          performance: nextPerformance,
          source: nextSource,
          updatedAt: nextUpdatedAt,
          signalRuntime: nextRuntime,
        },
        60
      );
    }
  };

  const showWalletManagement = wallet.providerAvailable && wallet.isConnected;
  const walletBusy = wallet.initializing || wallet.status === 'connecting';

  useEffect(() => {
    if (!walletMenuOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!walletMenuRef.current?.contains(event.target)) {
        setWalletMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setWalletMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [walletMenuOpen]);

  useEffect(() => {
    if (!wallet.isConnected || wallet.isWrongNetwork || wallet.status === 'connecting') {
      setWalletMenuOpen(false);
    }
  }, [wallet.isConnected, wallet.isWrongNetwork, wallet.status]);

  return (
    <>
      <Head>
        <title>{`${signal.name} AI Explainability - AI Power Trade`}</title>
      </Head>

      <div className={cx('apt-shell', dashboardStyles.page, styles.pageShell)}>
        <nav className={dashboardStyles.nav}>
          <div className={dashboardStyles.navContainer}>
            <Link href="/" className={dashboardStyles.logo}>
              AI POWER TRADE
            </Link>

            <ul className={dashboardStyles.navLinks}>
              <li>
                <Link href={appHref} className={dashboardStyles.navLink}>
                  App
                </Link>
              </li>
              <li>
                <Link href={explainerHref} className={cx(dashboardStyles.navLink, dashboardStyles.navLinkActive)}>
                  AI Explainer
                </Link>
              </li>
              <li>
                <Link href="/trade-history" className={dashboardStyles.navLink}>
                  Trade History
                </Link>
              </li>
            </ul>

            <div className={dashboardStyles.walletActions} ref={walletMenuRef}>
              <button
                type="button"
                onClick={handleWalletAction}
                disabled={walletBusy}
                className={cx(dashboardStyles.connectButton, walletView.buttonTone)}
                aria-haspopup={showWalletManagement ? 'menu' : undefined}
                aria-expanded={showWalletManagement ? walletMenuOpen : undefined}
              >
                <span className={dashboardStyles.walletButtonContent}>
                  <span>{walletView.buttonLabel}</span>
                  {showWalletManagement ? (
                    <span
                      className={cx(
                        dashboardStyles.walletButtonCaret,
                        walletMenuOpen && dashboardStyles.walletButtonCaretOpen
                      )}
                      aria-hidden="true"
                    >
                      ▾
                    </span>
                  ) : null}
                </span>
              </button>
              {showWalletManagement && walletMenuOpen ? (
                <div className={dashboardStyles.walletActionRail} role="menu" aria-label="Access actions">
                  <div className={dashboardStyles.walletMenuMeta}>
                    <span className={dashboardStyles.walletMenuLabel}>Execution Wallet</span>
                    <code className={dashboardStyles.walletMenuAddress}>{wallet.account}</code>
                    <span className={dashboardStyles.walletMenuNetwork}>{wallet.networkConfig.chainName}</span>
                  </div>
                  <button
                    type="button"
                    className={dashboardStyles.walletSecondaryButton}
                    onClick={handleWalletSwitch}
                    disabled={walletBusy}
                  >
                    Switch Account
                  </button>
                  <button
                    type="button"
                    className={cx(
                      dashboardStyles.walletSecondaryButton,
                      dashboardStyles.walletSecondaryButtonDanger
                    )}
                    onClick={handleWalletDisconnect}
                    disabled={walletBusy}
                  >
                    Disconnect
                  </button>
                </div>
              ) : null}
              <div className={cx(dashboardStyles.walletStatus, walletView.statusTone)} aria-live="polite">
                <span className={dashboardStyles.walletStatusDot} />
                <span>{walletView.statusText}</span>
              </div>
            </div>
          </div>
        </nav>

        <div className={dashboardStyles.tickerStrip}>
          <div className={dashboardStyles.tickerContent}>
            {tickerSignals.map((tickerSignal, index) => {
              const price = Number(
                tickerSignal.price ||
                tickerSignal.lastPrice ||
                tickerSignal.currentPrice ||
                tickerSignal.markPrice ||
                0
              );

              const change = Number(tickerSignal.change24h || 0);
              const positive = change >= 0;

              return (
                <div className={dashboardStyles.tickerItem} key={`${tickerSignal.symbol}-${index}`}>
                  <span className={dashboardStyles.tickerSymbol}>{tickerSignal.symbol}</span>
                  <span className={dashboardStyles.tickerPrice}>
                    {price > 0
                      ? `$${price.toLocaleString('en-US', {
                          minimumFractionDigits: price < 1 ? 4 : 2,
                          maximumFractionDigits: price < 1 ? 6 : 2,
                        })}`
                      : 'Loading...'}
                  </span>
                  <span
                    className={cx(
                      dashboardStyles.tickerChange,
                      positive
                        ? dashboardStyles.tickerChangePositive
                        : dashboardStyles.tickerChangeNegative
                    )}
                  >
                    {positive ? '+' : ''}
                    {change.toFixed(2)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <main className={dashboardStyles.container}>
          <section className={cx(dashboardStyles.glassElevated, styles.selectorPanel)}>
            <div className={styles.selectorHeader}>
              <div>
                <div className={styles.selectorEyebrow}>AI Explainer Assets</div>
                <h2 className={styles.selectorTitle}>Asset Rail</h2>
                <p className={styles.selectorText}>
                  Jump between assets from a compact selector, then use the summary row below to inspect the
                  currently active market, confidence, and overlay mode.
                </p>
              </div>
            </div>

            <div className={styles.assetRail}>
              {symbolTabs.map((item) => (
                <Link
                  key={item.symbol}
                  href={`/ai-explainer?symbol=${item.symbol}`}
                  className={cx(styles.assetChip, item.symbol === activeSymbol && styles.assetChipActive)}
                >
                  <div className={styles.assetChipTop}>
                    <span className={styles.assetChipSymbol}>
                      <span className={styles.assetSelectorIcon}>{item.icon}</span>
                      <span>{item.symbol}</span>
                    </span>
                    <span className={cx(styles.assetChipChange, getChangeTone(item.change24h))}>
                      {formatPercentChange(item.change24h)}
                    </span>
                  </div>
                  <div className={styles.assetChipMeta}>
                    <span>{item.name}</span>
                    <span>{item.isCurated ? 'Curated' : 'Explainer'}</span>
                  </div>
                </Link>
              ))}
            </div>

            <div className={styles.activeAssetBar}>
              <div className={styles.activeAssetPrimary}>
                <div className={styles.activeAssetLabel}>Selected Asset</div>
                <div className={styles.activeAssetIdentity}>
                  <span className={styles.assetSelectorIcon}>
                    {EXPLAINER_ASSET_META[activeSymbol]?.icon || activeSymbol.slice(0, 1)}
                  </span>
                  <div>
                    <div className={styles.activeAssetTitle}>
                      {signal.name} <span className={styles.activeAssetSymbol}>{activeSymbol}</span>
                    </div>
                    <div className={styles.activeAssetCaption}>
                      {assetModeTitle}
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.activeAssetMetric}>
                <div className={styles.activeAssetLabel}>
                  Price {!hasLivePrice && <span style={{ fontSize: '0.7em', opacity: 0.6 }}>(fallback)</span>}
                </div>
                <div className={styles.activeAssetMetricValue}>
                  {currentPrice ? formatUsd(currentPrice) : 'Awaiting feed'}
                </div>
              </div>

              <div className={styles.activeAssetMetric}>
                <div className={styles.activeAssetLabel}>Confidence</div>
                <div className={styles.activeAssetMetricValue}>{confidencePercent}%</div>
              </div>

              <div className={styles.activeAssetMetric}>
                <div className={styles.activeAssetLabel}>24h Move</div>
                <div className={cx(styles.activeAssetMetricValue, getChangeTone(marketChange))}>
                  {formatPercentChange(marketChange)}
                </div>
              </div>

              <div className={styles.activeAssetSources}>
                <span
                  className={cx(
                    styles.dataSourceBadge,
                    getSourceTone(marketOverlay.source, {
                      loading: marketOverlay.loading,
                      refreshing: marketOverlay.refreshing,
                    })
                  )}
                >
                  {marketSourceLabel}
                </span>
                <span
                  className={cx(
                    styles.dataSourceBadge,
                    getSourceTone(explainStatus.source, {
                      loading: explainStatus.loading,
                      refreshing: explainStatus.refreshing,
                    })
                  )}
                >
                  {explainSourceLabel}
                </span>
              </div>
            </div>

            <div className={styles.signalRefreshPanel}>
              <div className={styles.signalRefreshMeta}>
                <div className={styles.signalRefreshEyebrow}>Generate Signal</div>
                <h2 className={styles.signalRefreshHeadline}>{generateSignalHeading}</h2>
                <p className={styles.signalRefreshText}>{generateSignalDetail}</p>
              </div>
              <button
                type="button"
                className={styles.signalRefreshButton}
                onClick={handleGenerateSignal}
                disabled={signalRuntime.generating}
              >
                {signalRuntime.generating ? 'Generating...' : 'Generate Signal'}
              </button>
            </div>

            {runtimeNotice ? (
              <div
                className={cx(
                  styles.runtimeNotice,
                  runtimeNotice.tone === 'warning' ? styles.runtimeNoticeWarning : styles.runtimeNoticeInfo
                )}
              >
                <strong>{runtimeNotice.title}</strong>
                <span>{runtimeNotice.detail}</span>
              </div>
            ) : null}
          </section>

          <section className={cx(dashboardStyles.glassElevated, styles.scorecardPanel)}>
            <div className={styles.scorecardGrid}>
              <div className={styles.ringBlock}>
                <div className={styles.confidenceRing}>
                  <svg width="160" height="160" viewBox="0 0 160 160" className={styles.ringSvg}>
                    <circle className={styles.ringTrack} cx="80" cy="80" r="70" />
                    <circle
                      className={styles.ringProgress}
                      cx="80"
                      cy="80"
                      r="70"
                      strokeDasharray={ringCircumference}
                      strokeDashoffset={ringOffset}
                    />
                  </svg>
                  <div className={styles.ringText}>
                    <div className={styles.ringValue}>{confidencePercent}%</div>
                    <div className={styles.ringLabel}>Confidence</div>
                  </div>
                </div>
              </div>

              <div className={styles.scorecardContent}>
                <div className={styles.scorecardHeader}>
                  <div>
                    <h2 className={styles.scorecardTitle}>Signal Scorecard</h2>
                    <p className={styles.scorecardSummary}>
                      {signal.catalystSummary} Current live price: {formatUsd(currentPrice)}.
                    </p>
                  </div>
                </div>

                <div className={styles.scorecardBreakdown}>
                  {scoreBreakdownRows.map((item) => (
                    <div key={item.label} className={styles.scorecardBarRow}>
                      <div className={styles.scorecardBarHeader}>
                        <span>{item.label}</span>
                        <strong>{item.value}%</strong>
                      </div>
                      <div className={styles.scorecardBarTrack}>
                        <div className={styles.scorecardBarFill} style={{ width: `${item.value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className={styles.scorecardStatsGrid}>
                  {scorecardStats.map((item) => (
                    <article key={item.label} className={styles.scorecardStatTile}>
                      <div className={cx(styles.scorecardStatValue, item.tone)}>{item.value}</div>
                      <div className={styles.scorecardStatLabel}>{item.label}</div>
                    </article>
                  ))}
                </div>

              </div>
            </div>
          </section>

          <section className={cx(dashboardStyles.hero, styles.heroSection)}>
            <div className={styles.heroEyebrow}>AI Explainability</div>
            <h1 className={dashboardStyles.heroTitle}>{signal.name} Signal Intelligence</h1>
            <p className={cx(dashboardStyles.heroSubtitle, styles.heroSubtitleCentered)}>
              Complete explainability for this trading signal. Every assumption, catalyst, and risk factor is
              visible in operator-readable language. Current setup: {signal.setup}.
            </p>

            <div className={styles.pillRow}>
              <span className={cx(styles.pill, getSignalTone(signal.signal))}>{signal.signal}</span>
              <span className={styles.pill}>{signal.horizon}</span>
              <span className={styles.pill}>{macroRegime}</span>
              <span className={styles.pill}>{researchLabel}</span>
              <span className={styles.pill}>
                {hasLiveExplain
                  ? `${explainSourceLabel} · ${analyzedIndicators} inputs`
                  : `Demo explainability layer · ${analyzedIndicators} estimated inputs`}
              </span>
            </div>

            <div className={styles.heroActions}>
              <Link href={appHref} className={styles.heroPrimaryAction}>
                Open App
              </Link>
            </div>
          </section>

          <section className={styles.heroDeck}>
            <article className={styles.heroSignalCard}>
              <div className={styles.heroCardEyebrow}>Signal Cockpit</div>
              <div className={styles.heroSignalHeader}>
                <div>
                  <div className={styles.heroSignalTitle}>
                    <span className={cx(styles.recommendationSignal, getRecommendationTone(recommendation))}>
                      {recommendation}
                    </span>
                    <span>{signal.symbol} setup</span>
                  </div>
                  <p className={styles.heroSignalText}>{recommendationSummaryCaption}</p>
                </div>

                <div className={styles.heroConfidenceBadge}>
                  <strong>{confidencePercent}%</strong>
                  <span>confidence</span>
                </div>
              </div>

              <div className={styles.heroSignalGrid}>
                <div className={styles.heroSignalMetric}>
                  <span>Spot Reference</span>
                  <strong>{currentPrice ? formatUsd(currentPrice) : 'Awaiting feed'}</strong>
                </div>
                <div className={styles.heroSignalMetric}>
                  <span>Entry Zone</span>
                  <strong>{signal.entryZone}</strong>
                </div>
                <div className={styles.heroSignalMetric}>
                  <span>Target Zone</span>
                  <strong>{signal.targetZone}</strong>
                </div>
                <div className={styles.heroSignalMetric}>
                  <span>Stop Loss</span>
                  <strong>{signal.stopLoss}</strong>
                </div>
                <div className={styles.heroSignalMetric}>
                  <span>Reward / Risk</span>
                  <strong>{signal.rewardRisk}</strong>
                </div>
                <div className={styles.heroSignalMetric}>
                  <span>AI Inputs</span>
                  <strong>{analyzedIndicators}</strong>
                </div>
              </div>
            </article>

            <aside className={styles.heroContextCard}>
              <div className={styles.heroCardEyebrow}>Runtime Context</div>
              <div className={styles.contextList}>
                <div className={styles.contextRow}>
                  <span>Market source</span>
                  <strong>{marketSourceLabel}</strong>
                </div>
                <div className={styles.contextRow}>
                  <span>Explainability</span>
                  <strong>{explainSourceLabel}</strong>
                </div>
                <div className={styles.contextRow}>
                  <span>24h move</span>
                  <strong className={getChangeTone(marketChange)}>{formatPercentChange(marketChange)}</strong>
                </div>
                <div className={styles.contextRow}>
                  <span>Macro regime</span>
                  <strong>{macroRegime}</strong>
                </div>
                <div className={styles.contextRow}>
                  <span>Community sentiment</span>
                  <strong>{sentimentSummary.value}</strong>
                </div>
                <div className={styles.contextRow}>
                  <span>ETF regime</span>
                  <strong>{etfSummary.regime}</strong>
                </div>
                <div className={styles.contextRow}>
                  <span>Asset mode</span>
                  <strong>{assetModeTitle}</strong>
                </div>
                <div className={styles.contextRow}>
                  <span>Last update</span>
                  <strong>{lastAiUpdateValue}</strong>
                </div>
              </div>
            </aside>
          </section>

          <section className={cx(dashboardStyles.glassElevated, styles.recommendationPanel)}>
            <div className={styles.recommendationHeader}>
              <div>
                <div className={styles.recommendationEyebrow}>AI Recommendation</div>
                <h2 className={styles.recommendationTitle}>Decision Summary</h2>
                <p className={styles.recommendationText}>
                  This restores the explicit recommendation layer from the original AI Explainer before the
                  deeper signal breakdown begins.
                </p>
              </div>
            </div>

            <div className={styles.recommendationTagRail}>
              {recommendationRailItems.map((item) => (
                <div key={item.label} className={styles.recommendationTag}>
                  <div className={styles.recommendationTagLabel}>{item.label}</div>
                  <div className={cx(styles.recommendationTagValue, item.tone)}>{item.value}</div>
                  <div className={styles.recommendationTagMeta}>{item.meta}</div>
                </div>
              ))}
            </div>

            <div className={styles.recommendationSummaryBar}>
              <div className={styles.recommendationSummaryPrimary}>
                <div className={styles.recommendationSummaryLabel}>Recommendation Snapshot</div>
                <div className={styles.recommendationSummaryHeadline}>
                  <span className={cx(styles.recommendationSignal, getRecommendationTone(recommendation))}>
                    {recommendation}
                  </span>
                  <div className={styles.recommendationSummaryTitle}>{signal.name} decision summary</div>
                </div>
                <p className={styles.recommendationSummaryCaption}>{recommendationSummaryCaption}</p>
              </div>

              <div className={styles.recommendationSummaryMetric}>
                <div className={styles.recommendationSummaryMetricLabel}>Spot Reference</div>
                <div className={styles.recommendationSummaryMetricValue}>
                  {currentPrice ? formatUsd(currentPrice) : 'Awaiting live feed'}
                </div>
                <div className={cx(styles.recommendationSummaryMetricCaption, getChangeTone(marketChange))}>
                  {formatPercentChange(marketChange)}
                </div>
              </div>

              <div className={styles.recommendationSummaryMetric}>
                <div className={styles.recommendationSummaryMetricLabel}>Confidence</div>
                <div className={styles.recommendationSummaryMetricValue}>{confidencePercent}%</div>
                <div className={styles.recommendationSummaryMetricCaption}>{confidenceLabel}</div>
              </div>

              <div className={styles.recommendationSummaryMetric}>
                <div className={styles.recommendationSummaryMetricLabel}>24h Move</div>
                <div className={cx(styles.recommendationSummaryMetricValue, getChangeTone(marketChange))}>
                  {formatPercentChange(marketChange)}
                </div>
                <div className={styles.recommendationSummaryMetricCaption}>{assetModeTitle}</div>
              </div>

              <div className={styles.recommendationSummarySources}>
                <span
                  className={cx(
                    styles.dataSourceBadge,
                    getSourceTone(marketOverlay.source, {
                      loading: marketOverlay.loading,
                      refreshing: marketOverlay.refreshing,
                    })
                  )}
                >
                  {marketSourceLabel}
                </span>
                <span
                  className={cx(
                    styles.dataSourceBadge,
                    getSourceTone(explainStatus.source, {
                      loading: explainStatus.loading,
                      refreshing: explainStatus.refreshing,
                    })
                  )}
                >
                  {explainSourceLabel}
                </span>
                <span className={styles.recommendationSummaryFootnote}>Updated {lastAiUpdateValue}</span>
              </div>
            </div>
          </section>

          <section className={dashboardStyles.section}>
            <h2 className={dashboardStyles.sectionTitle}>Decision Breakdown</h2>
            <div className={cx(dashboardStyles.glassElevated, styles.sectionPanel)}>
              <p className={styles.sectionIntro}>
                This carries forward the original AI Explainer structure by exposing the live buy versus sell
                balance whenever the live explainability layer is available.
              </p>

              {liveExplain ? (
                <div className={styles.breakdownGrid}>
                  <article className={cx(styles.breakdownCard, dashboardStyles.glass)}>
                    <div className={styles.breakdownLabel}>AI Direction</div>
                    <div
                      className={cx(
                        styles.breakdownValue,
                        /sell/i.test(liveExplain.signal || '') ? styles.breakdownValueBearish : styles.breakdownValueBullish
                      )}
                    >
                      {liveExplain.signal}
                    </div>
                    <p className={styles.breakdownHint}>
                      {liveExplain.indicators_analyzed} indicators are currently contributing to the live signal.
                    </p>
                  </article>

                  <article className={cx(styles.breakdownCard, dashboardStyles.glass)}>
                    <div className={styles.breakdownLabel}>Buy Signals</div>
                    <div className={styles.breakdownValue}>{buyScore.toFixed(2)}</div>
                    <div className={styles.breakdownTrack}>
                      <div
                        className={cx(styles.breakdownFill, styles.breakdownFillBullish)}
                        style={{ width: `${clamp((buyScore / 10) * 100, 0, 100)}%` }}
                      />
                    </div>
                    <p className={styles.breakdownHint}>
                      Bullish inputs currently supporting the trade thesis.
                    </p>
                  </article>

                  <article className={cx(styles.breakdownCard, dashboardStyles.glass)}>
                    <div className={styles.breakdownLabel}>Sell Signals</div>
                    <div className={styles.breakdownValue}>{sellScore.toFixed(2)}</div>
                    <div className={styles.breakdownTrack}>
                      <div
                        className={cx(styles.breakdownFill, styles.breakdownFillBearish)}
                        style={{ width: `${clamp((sellScore / 10) * 100, 0, 100)}%` }}
                      />
                    </div>
                    <p className={styles.breakdownHint}>
                      Defensive or bearish inputs currently resisting the setup.
                    </p>
                  </article>
                </div>
              ) : (
                <div className={styles.fallbackPanel}>
                  Live buy and sell scoring will appear here once the live explainability layer responds for{' '}
                  {activeSymbol}. The curated signal layer above is still active.
                </div>
              )}
            </div>
          </section>

          <section className={dashboardStyles.section}>
            <h2 className={dashboardStyles.sectionTitle}>Why This Decision?</h2>
            <div className={cx(dashboardStyles.glassElevated, styles.sectionPanel)}>
              <div className={styles.sectionKicker}>Confidence Attribution</div>
              <p className={styles.sectionIntro}>
                These are the weighted drivers behind the current signal conviction, combining curated signal
                logic with live explainability when it is available.
              </p>

              {intelligence.research?.rationale?.length ? (
                <div className={styles.overlayNote}>
                  <strong>Research overlay:</strong> {intelligence.research.rationale[0]}
                </div>
              ) : null}

              <div className={styles.driverList}>
                {attributionItems.map((item) => (
                  <article key={item.title} className={cx(styles.driverCard, dashboardStyles.glass)}>
                    <div className={styles.driverHeader}>
                      <strong>{item.title}</strong>
                      <span className={styles.driverScore}>
                        {typeof item.impact === 'number'
                          ? `${item.impact > 0 ? '+' : ''}${item.impact.toFixed(1)}`
                          : `+${item.score}%`}
                      </span>
                    </div>
                    <p className={styles.driverDetail}>{item.detail}</p>

                    <div className={styles.driverImpactMeta}>
                      {typeof item.impact === 'number' ? 'Indicator impact' : 'Confidence weight'}
                    </div>
                    <div className={styles.driverImpactTrack}>
                      <div
                        className={cx(
                          styles.driverImpactFill,
                          typeof item.impact === 'number' && item.impact < 0
                            ? styles.driverImpactFillBearish
                            : styles.driverImpactFillBullish
                        )}
                        style={{
                          width: `${typeof item.impact === 'number'
                            ? clamp(Math.round(Math.abs(item.impact) * 25), 8, 100)
                            : clamp(Number(item.score || 0), 8, 100)}%`,
                        }}
                      />
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className={dashboardStyles.section}>
            <h2 className={dashboardStyles.sectionTitle}>Indicator Breakdown</h2>
            {indicatorSnapshot ? (
              <div className={styles.indicatorPanelGrid}>
                <article className={cx(styles.indicatorCard, dashboardStyles.glassElevated)}>
                  <div className={styles.indicatorHeader}>
                    <div>
                      <div className={styles.indicatorLabel}>RSI</div>
                      <h3 className={styles.indicatorTitle}>Relative Strength Index</h3>
                    </div>
                    <span className={cx(styles.indicatorBias, getIndicatorBiasClass(rsiInsight?.bias))}>
                      {rsiInsight?.label}
                    </span>
                  </div>

                  <div className={styles.indicatorValue}>{rsiValue.toFixed(2)}</div>
                  <div className={styles.rsiGauge}>
                    <div className={styles.rsiGaugeBull} />
                    <div className={styles.rsiGaugeNeutral} />
                    <div className={styles.rsiGaugeBear} />
                    <div className={styles.rsiGaugePointer} style={{ left: `${clamp(rsiValue, 0, 100)}%` }} />
                  </div>
                  <div className={styles.rsiGaugeLabels}>
                    <span>Oversold</span>
                    <span>Neutral</span>
                    <span>Overbought</span>
                  </div>
                  <p className={styles.indicatorNarrative}>{rsiInsight?.detail}</p>
                </article>

                <article className={cx(styles.indicatorCard, dashboardStyles.glassElevated)}>
                  <div className={styles.indicatorHeader}>
                    <div>
                      <div className={styles.indicatorLabel}>MACD</div>
                      <h3 className={styles.indicatorTitle}>Momentum Structure</h3>
                    </div>
                    <span className={cx(styles.indicatorBias, getIndicatorBiasClass(macdInsight?.bias))}>
                      {macdInsight?.label}
                    </span>
                  </div>

                  <div className={styles.indicatorValue}>{macdValue.toFixed(2)}</div>
                  <div className={styles.macdTrack}>
                    <div className={styles.macdCenterLine} />
                    <div
                      className={cx(styles.macdBar, macdValue >= 0 ? styles.macdBarBullish : styles.macdBarBearish)}
                      style={{
                        width: `${clamp(Math.abs(macdValue) * 8, 6, 100)}%`,
                        marginLeft: macdValue >= 0 ? '50%' : `${50 - clamp(Math.abs(macdValue) * 8, 6, 100)}%`,
                      }}
                    />
                  </div>
                  <p className={styles.indicatorNarrative}>{macdInsight?.detail}</p>
                </article>

                <article className={cx(styles.indicatorCard, dashboardStyles.glassElevated)}>
                  <div className={styles.indicatorHeader}>
                    <div>
                      <div className={styles.indicatorLabel}>Moving Averages</div>
                      <h3 className={styles.indicatorTitle}>Trend Alignment</h3>
                    </div>
                    <span className={cx(styles.indicatorBias, getIndicatorBiasClass(movingAverageInsight?.bias))}>
                      {movingAverageInsight?.label}
                    </span>
                  </div>

                  <div className={styles.statList}>
                    <div className={styles.statRow}>
                      <span>MA 5</span>
                      <strong>{formatUsd(ma5Value)}</strong>
                    </div>
                    <div className={styles.statRow}>
                      <span>MA 20</span>
                      <strong>{formatUsd(ma20Value)}</strong>
                    </div>
                    <div className={styles.statRow}>
                      <span>Difference</span>
                      <strong className={maDiffValue >= 0 ? styles.valueBullish : styles.valueBearish}>
                        {maDiffValue >= 0 ? '+' : ''}
                        {maDiffValue.toFixed(2)}
                      </strong>
                    </div>
                  </div>
                  <p className={styles.indicatorNarrative}>{movingAverageInsight?.detail}</p>
                </article>

                <article className={cx(styles.indicatorCard, dashboardStyles.glassElevated)}>
                  <div className={styles.indicatorHeader}>
                    <div>
                      <div className={styles.indicatorLabel}>Bollinger Bands</div>
                      <h3 className={styles.indicatorTitle}>Volatility Envelope</h3>
                    </div>
                    <span className={cx(styles.indicatorBias, getIndicatorBiasClass(bollingerInsight?.bias))}>
                      {bollingerInsight?.label}
                    </span>
                  </div>

                  <div className={styles.statList}>
                    <div className={styles.statRow}>
                      <span>Upper Band</span>
                      <strong>{formatUsd(bbUpperValue)}</strong>
                    </div>
                    <div className={styles.statRow}>
                      <span>Current Price</span>
                      <strong>{formatUsd(Number(indicatorSnapshot.current_price || currentPrice || 0))}</strong>
                    </div>
                    <div className={styles.statRow}>
                      <span>Lower Band</span>
                      <strong>{formatUsd(bbLowerValue)}</strong>
                    </div>
                  </div>

                  <div className={styles.bandTrack}>
                    <div className={styles.bandPointer} style={{ left: `${bbPositionValue * 100}%` }} />
                  </div>
                  <p className={styles.indicatorNarrative}>{bollingerInsight?.detail}</p>
                </article>
              </div>
            ) : (
              <div className={cx(dashboardStyles.glassElevated, styles.sectionPanel)}>
                <div className={styles.fallbackPanel}>
                  The new signal page is ready for RSI, MACD, moving-average, and Bollinger breakdowns, but it
                  needs a live response from `/api/ai/explain/{activeSymbol}` to populate the indicator layer.
                </div>
              </div>
            )}
          </section>

          <section className={dashboardStyles.section}>
            <h2 className={dashboardStyles.sectionTitle}>Catalyst & Market Context</h2>
            <div className={styles.marketBackdrop}>
              <div>
                <div className={styles.marketBackdropLabel}>Macro Regime</div>
                <div className={styles.marketBackdropValue}>{macroRegime}</div>
              </div>
              <p className={styles.marketBackdropText}>
                {intelligence.etf?.regime_explanation ||
                  intelligence.research?.rationale?.[1] ||
                  newsArticles[0]?.summary ||
                  signal.catalystSummary}
              </p>
            </div>

            <div className={styles.catalystGrid}>
              {catalystCards.map((item) => (
                <article key={`${item.title}-${item.impact}`} className={cx(styles.catalystCard, dashboardStyles.glassElevated)}>
                  <div className={styles.catalystHeader}>
                    <strong>{item.title}</strong>
                    <span className={cx(styles.catalystImpact, getImpactTone(item.impact))}>{item.impact}</span>
                  </div>
                  <p className={styles.catalystDetail}>{item.detail}</p>
                </article>
              ))}
            </div>
          </section>

          <section className={dashboardStyles.section}>
            <h2 className={dashboardStyles.sectionTitle}>Risk Analysis</h2>
            <div className={cx(dashboardStyles.glassElevated, styles.sectionPanel)}>
              <p className={styles.sectionIntro}>
                The model exposes the most likely failure modes before size is taken, so risk can be managed
                up front rather than explained after the move.
              </p>

              <div className={styles.riskSummaryGrid}>
                {riskSummaryCards.map((item) => (
                  <article key={item.label} className={cx(styles.riskSummaryCard, dashboardStyles.glass)}>
                    <div className={styles.riskSummaryLabel}>{item.label}</div>
                    <div className={styles.riskSummaryValue}>{item.value}</div>
                    <p className={styles.riskSummaryCaption}>{item.caption}</p>
                  </article>
                ))}
              </div>

              <div className={styles.riskList}>
                {riskRows.map((item) => (
                  <div key={item.label} className={styles.riskItem}>
                    <div className={styles.riskHeader}>
                      <strong>{item.label}</strong>
                      <span className={styles.riskValue}>{item.value}%</span>
                    </div>
                    <div className={styles.riskTrack}>
                      <div
                        className={cx(styles.riskFill, getRiskTone(item.value))}
                        style={{ width: `${item.value}%` }}
                      />
                    </div>
                    <p className={styles.riskDetail}>{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {mlPrediction ? (
            <section className={dashboardStyles.section}>
              <h2 className={dashboardStyles.sectionTitle}>Model Confidence Overlay</h2>
              <div className={cx(dashboardStyles.glassElevated, styles.mlPanel)}>
                <div className={styles.mlHeader}>
                  <div>
                    <div className={styles.indicatorLabel}>Model Overlay</div>
                    <h3 className={styles.scorecardTitle}>Feature Importance & Model Conviction</h3>
                  </div>
                  <span
                    className={cx(
                      styles.breakdownValue,
                      /sell/i.test(mlPrediction.prediction || '')
                        ? styles.breakdownValueBearish
                        : styles.breakdownValueBullish
                    )}
                  >
                    {mlPrediction.model || 'ML'} · {mlPrediction.prediction || 'HOLD'}
                  </span>
                </div>

                <div className={styles.mlGrid}>
                  <div className={styles.mlBlock}>
                    <div className={styles.breakdownLabel}>Win Probability</div>
                    <div className={styles.breakdownValue}>
                      {((Number(mlPrediction.win_probability || 0) || 0) * 100).toFixed(1)}%
                    </div>
                    <div className={styles.breakdownTrack}>
                      <div
                        className={cx(styles.breakdownFill, styles.breakdownFillBullish)}
                        style={{ width: `${clamp((Number(mlPrediction.win_probability || 0) || 0) * 100, 0, 100)}%` }}
                      />
                    </div>
                    <p className={styles.breakdownHint}>
                      Probability from the model layer that the current directional thesis resolves correctly.
                    </p>
                  </div>

                  <div className={styles.mlBlock}>
                    <div className={styles.breakdownLabel}>Top Features</div>
                    <div className={styles.featureList}>
                      {mlFeatureItems.map(([feature, importance]) => (
                        <div key={feature} className={styles.featureRow}>
                          <div className={styles.featureHeader}>
                            <span>{feature.replaceAll('_', ' ')}</span>
                            <strong>{(Number(importance || 0) * 100).toFixed(1)}%</strong>
                          </div>
                          <div className={styles.featureTrack}>
                            <div
                              className={styles.featureFill}
                              style={{ width: `${clamp((Number(importance || 0) || 0) * 100, 0, 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          <section className={dashboardStyles.section}>
            <h2 className={dashboardStyles.sectionTitle}>Order Flow Context</h2>
            <div className={styles.orderFlowGrid}>
              {orderFlowItems.map((item) => (
                <article key={item.venue} className={cx(styles.orderFlowCard, dashboardStyles.glass)}>
                  <div className={styles.orderFlowVenue}>{item.venue}</div>
                  <div className={styles.orderFlowBias}>{item.bias}</div>
                  <div className={styles.orderFlowValue}>{item.value}</div>
                </article>
              ))}
            </div>
          </section>

          <div className={styles.actionRow}>
            <div className={cx(styles.summaryPanel, dashboardStyles.glassElevated)}>
              <div className={styles.summaryLabel}>Execution Summary</div>
              <p className={styles.summaryText}>
                Based on the full explainability stack, the current recommendation for {signal.name} is{' '}
                <strong>{recommendation}</strong> with <strong>{confidencePercent}%</strong> confidence.
                {` `}Market source: {marketSourceLabel}. Explainability: {explainSourceLabel}.
              </p>
            </div>
          </div>

          {liveFeedAlert ? (
            <div className={styles.loadAlert}>
              <strong>{liveFeedAlert.title}</strong>
              <span>{liveFeedAlert.message}</span>
              <button
                type="button"
                className={styles.loadAlertButton}
                onClick={() => {
                  setExplainError(null);
                  setMarketError(null);
                  setReloadToken((current) => current + 1);
                }}
              >
                Retry Live Feed
              </button>
            </div>
          ) : null}
        </main>
      </div>
    </>
  );
}
