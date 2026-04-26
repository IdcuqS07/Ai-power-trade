import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';

import { useWallet } from '../contexts/WalletContext';
import { formatUsd } from '../lib/formatters';
import { aiSignals } from '../lib/premiumData';
import { parseChainIdValue, shortenAddress } from '../lib/walletNetwork';
import styles from '../styles/ai-power-trade-workspace.module.css';

const QUICK_AMOUNTS = [25, 50, 75, 100];
const DEFAULT_PREVIEW_BALANCE = 10000;
const TERMINAL_REFRESH_MS = 30000;
const FALLBACK_UPDATED_AT = '2026-04-26T12:00:00.000Z';

const DEMO_HISTORY = [
  {
    tradeId: 'APT-DEMO-0042',
    symbol: 'BTC',
    type: 'BUY',
    amount: 1000,
    price: 64200,
    pnl: 3.2,
    status: 'Closed',
    timestamp: '2026-04-26T12:08:52.000Z',
    txHash: '0x8a91f0c2a4d9',
  },
  {
    tradeId: 'APT-DEMO-0041',
    symbol: 'ETH',
    type: 'BUY',
    amount: 500,
    price: 3180,
    pnl: 1.8,
    status: 'Closed',
    timestamp: '2026-04-26T11:08:52.000Z',
    txHash: '0x2b45ad7c9102',
  },
  {
    tradeId: 'APT-DEMO-0040',
    symbol: 'SOL',
    type: 'BUY',
    amount: 750,
    price: 128.45,
    pnl: 5.4,
    status: 'Closed',
    timestamp: '2026-04-26T10:08:52.000Z',
    txHash: '0x9c12dd83ab10',
  },
];

function classes(...names) {
  return names
    .filter(Boolean)
    .map((name) => styles[name])
    .join(' ');
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function extractNumbers(value = '') {
  const matches = String(value).match(/\d[\d,]*(?:\.\d+)?/g) || [];
  return matches
    .map((entry) => Number(entry.replace(/,/g, '')))
    .filter((entry) => Number.isFinite(entry));
}

function resolveAction(signalLabel = '') {
  if (/short|sell/i.test(signalLabel)) {
    return 'SELL';
  }

  if (/watch|hold/i.test(signalLabel)) {
    return 'HOLD';
  }

  return 'BUY';
}

function inferTradeType(actionLabel = 'BUY') {
  if (actionLabel === 'SELL') {
    return 'SHORT';
  }

  if (actionLabel === 'HOLD') {
    return 'WATCH';
  }

  return 'LONG';
}

function parseEntryPrice(signal) {
  const zone = extractNumbers(signal?.entryZone);

  if (zone.length >= 2) {
    return (zone[0] + zone[1]) / 2;
  }

  return zone[0] || Number(signal?.price || 0);
}

function parseTargetPrice(signal, fallbackPrice) {
  const targets = extractNumbers(signal?.targetZone);
  return targets[0] || fallbackPrice;
}

function parseStopPrice(signal, fallbackPrice) {
  const stops = extractNumbers(signal?.stopLoss);
  return stops[0] || fallbackPrice;
}

function formatSignedPercent(value, digits = 1) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return '0.0%';
  }

  return `${amount >= 0 ? '+' : ''}${amount.toFixed(digits)}%`;
}

function formatTokenAmount(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return '0';
  }

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: amount >= 100 ? 0 : 2,
    maximumFractionDigits: amount >= 100 ? 0 : 2,
  }).format(amount);
}

function formatMarketPrice(value) {
  const amount = Number(value || 0);
  const digits = amount >= 100 ? 2 : amount >= 1 ? 3 : 4;

  return amount.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function formatShortTime(value) {
  if (!value) {
    return 'Just now';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Just now';
  }

  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function formatElapsed(value) {
  if (!value) {
    return 'Just now';
  }

  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();

  if (Number.isNaN(diffMs) || diffMs < 60_000) {
    return 'Just now';
  }

  const diffHours = Math.floor(diffMs / 3_600_000);

  if (diffHours >= 1) {
    return `${diffHours}h ago`;
  }

  return `${Math.max(1, Math.floor(diffMs / 60_000))}m ago`;
}

function formatInteger(value) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function getTargetDelta(entryPrice, targetPrice, actionLabel) {
  if (!entryPrice) {
    return 0;
  }

  if (actionLabel === 'SELL') {
    return ((entryPrice - targetPrice) / entryPrice) * 100;
  }

  return ((targetPrice - entryPrice) / entryPrice) * 100;
}

function getVolatilityLabel(riskScore) {
  const score = Number(riskScore || 0);

  if (score <= 35) {
    return { label: 'Low', color: 'var(--green)' };
  }

  if (score <= 60) {
    return { label: 'Medium', color: 'var(--yellow)' };
  }

  return { label: 'High', color: 'var(--red)' };
}

function createFallbackTerminalData() {
  return {
    requestedSymbol: 'BTC',
    source: 'Curated signal model',
    signals: aiSignals,
    performance: {
      total_trades: 24,
      winning_trades: 17,
      losing_trades: 7,
      win_rate: 70.8,
      total_profit: 18.4,
      avg_profit: 2.7,
    },
    history: DEMO_HISTORY,
    marketOverview: {
      globalCapLabel: '$2.41T',
      btcDominanceLabel: '53.8%',
      totalVolumeLabel: '$94.4B',
      fearGreed: 72,
      trendingSymbol: 'SOL',
      aiAccuracyLabel: '87.3%',
      activityValue: '4',
      activityLabel: 'Tracked Assets',
      marketCapChangeLabel: '+2.4%',
      lastSyncLabel: 'Live',
    },
    blockchain: {
      network: {
        chainId: '0x13882',
        chainName: 'Polygon Amoy Testnet',
        nativeCurrency: {
          symbol: 'MATIC',
        },
      },
      token: {
        symbol: 'atUSDT',
      },
    },
    readiness: {
      statusLabel: 'READY',
      statusTone: 'var(--green)',
      oracle: {
        label: 'Aligned',
        tone: 'var(--green)',
      },
      contract: {
        label: 'Ready',
        tone: 'var(--purple)',
      },
      confirmation: {
        label: 'Cleared',
        tone: 'var(--green)',
      },
      volatility: {
        label: 'Low',
        tone: 'var(--green)',
      },
      estimatedGasLabel: '~0.003 MATIC',
      networkLabel: 'Polygon Amoy Testnet',
    },
    updatedAt: FALLBACK_UPDATED_AT,
  };
}

function getWalletButtonState(wallet) {
  if (wallet.initializing) {
    return {
      label: 'Syncing Access',
      tone: 'btn-connect-syncing',
      action: null,
      disabled: true,
    };
  }

  if (!wallet.providerAvailable) {
    return {
      label: 'Install MetaMask',
      tone: 'btn-connect-warning',
      action: wallet.openInstallWallet,
      disabled: false,
    };
  }

  if (!wallet.isConnected) {
    return {
      label: 'Connect Wallet',
      tone: '',
      action: wallet.connectWallet,
      disabled: wallet.status === 'connecting',
    };
  }

  if (wallet.isWrongNetwork) {
    return {
      label: 'Switch Network',
      tone: 'btn-connect-warning',
      action: wallet.switchToSupportedNetwork,
      disabled: false,
    };
  }

  return {
    label: shortenAddress(wallet.account),
    tone: 'btn-connect-connected',
    action: null,
    disabled: false,
  };
}

function getModelBreakdown(confidencePercent, signalChange) {
  return [
    {
      name: 'Signal Forecast',
      score: clamp(confidencePercent + 2, 65, 99),
      color: 'var(--green)',
    },
    {
      name: 'Pattern Confirmation',
      score: clamp(confidencePercent - 3, 60, 96),
      color: 'var(--green)',
    },
    {
      name: 'Market Sentiment',
      score: clamp(Math.round(68 + Math.abs(Number(signalChange || 0)) * 2.8), 55, 92),
      color: 'var(--yellow)',
    },
  ];
}

function getMetricTone(value) {
  return typeof value === 'string' && value ? value : 'var(--text-secondary)';
}

function getTopMovers(signals, activeSymbol) {
  const ranked = [...signals]
    .filter((signal) => signal?.symbol)
    .sort((left, right) => Math.abs(Number(right.change24h || 0)) - Math.abs(Number(left.change24h || 0)))
    .slice(0, 4);

  if (!ranked.length) {
    return [
      { symbol: activeSymbol || 'BTC', change24h: 3.2 },
      { symbol: 'SOL', change24h: 5.4 },
      { symbol: 'MATIC', change24h: 14.7 },
    ];
  }

  return ranked;
}

function getPriceLevels(activeSignal, entryPrice) {
  const currentPrice = Number(activeSignal?.price || entryPrice || 0);
  const chartPrices = Array.isArray(activeSignal?.chart)
    ? activeSignal.chart.map((point) => Number(point?.price || 0)).filter((value) => Number.isFinite(value) && value > 0)
    : [];

  if (chartPrices.length) {
    return {
      currentPrice,
      high24: Math.max(...chartPrices),
      low24: Math.min(...chartPrices),
    };
  }

  return {
    currentPrice,
    high24: currentPrice ? currentPrice * 1.014 : 0,
    low24: currentPrice ? currentPrice * 0.982 : 0,
  };
}

function WorkspaceHeader({
  headerExpanded,
  setHeaderExpanded,
  previewNetwork,
  chainId,
  wallet,
  walletButton,
  walletMenuOpen,
  walletMenuRef,
  handleWalletAction,
  handleWalletSwitch,
  handleWalletDisconnect,
  movers,
  activeSymbol,
  handleSignalSelect,
  marketOverview,
}) {
  const networkLabel = previewNetwork?.chainName?.replace(' Testnet', '') || 'Polygon Amoy';
  const showWalletManagement = wallet.providerAvailable && wallet.isConnected;
  const walletBusy = wallet.initializing || wallet.status === 'connecting';

  return (
    <header className={classes('header', headerExpanded && 'header-expanded')}>
      <div className={styles['header-top']}>
        <div className={styles['header-brand-group']}>
          <Link href="/" className={classes('header-home-link', 'header-brand-stack')} aria-label="Go home">
            <div className={styles.brand}>AI POWER TRADE</div>
            <div className={styles['header-subtitle']}>Execution Workspace</div>
          </Link>

          <div className={styles['header-badges']}>
            <span className={classes('badge', 'badge-network')}>{networkLabel}</span>
            <span className={classes('badge', 'badge-live')}>AI ONLINE</span>
          </div>
        </div>

        <div className={styles['header-actions']}>
          <button
            className={styles['header-menu-toggle']}
            type="button"
            aria-expanded={headerExpanded}
            aria-controls="header-bottom"
            onClick={() => setHeaderExpanded((current) => !current)}
          >
            Menu
          </button>
          <span className={classes('badge', 'badge-chain')}>Network {chainId || 80002}</span>
          <div className={styles['wallet-control-stack']} ref={walletMenuRef}>
            <button
              type="button"
              className={classes('btn-connect', walletButton.tone)}
              onClick={handleWalletAction}
              disabled={walletButton.disabled}
              aria-haspopup={showWalletManagement ? 'menu' : undefined}
              aria-expanded={showWalletManagement ? walletMenuOpen : undefined}
            >
              <span className={styles['wallet-button-content']}>
                <span>{walletButton.label}</span>
                {showWalletManagement ? (
                  <span
                    className={classes(
                      'wallet-button-caret',
                      walletMenuOpen && 'wallet-button-caret-open'
                    )}
                    aria-hidden="true"
                  >
                    ▾
                  </span>
                ) : null}
              </span>
            </button>

            {showWalletManagement && walletMenuOpen ? (
              <div className={styles['wallet-action-rail']} role="menu" aria-label="Access actions">
                <div className={styles['wallet-menu-meta']}>
                  <span className={styles['wallet-menu-label']}>Execution Wallet</span>
                  <code className={styles['wallet-menu-address']}>{wallet.account}</code>
                  <span className={styles['wallet-menu-network']}>{networkLabel}</span>
                </div>
                <button
                  type="button"
                  className={styles['wallet-action-button']}
                  onClick={handleWalletSwitch}
                  disabled={walletBusy}
                >
                  Switch Account
                </button>
                <button
                  type="button"
                  className={classes('wallet-action-button', 'wallet-action-button-danger')}
                  onClick={handleWalletDisconnect}
                  disabled={walletBusy}
                >
                  Disconnect
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className={styles['header-bottom']} id="header-bottom">
        <nav className={styles['header-nav']} aria-label="Primary">
          <Link href={`/app?symbol=${activeSymbol}`} className={classes('header-nav-link', 'active')} aria-current="page">
            App
          </Link>
          <Link href={`/ai-explainer?symbol=${activeSymbol}`} className={styles['header-nav-link']}>
            AI Explainer
          </Link>
          <Link href="/trade-history" className={styles['header-nav-link']}>
            Trade History
          </Link>
        </nav>

        <div className={styles['header-movers']} aria-label="Top movers">
          <div className={styles['header-movers-label']}>Top Movers</div>
          <div className={styles['header-movers-window']}>
            <div className={styles['header-movers-track']}>
              {movers.concat(movers).map((signal, index) => {
                const change = Number(signal.change24h || 0);

                return (
                  <button
                    key={`${signal.symbol}-${index}`}
                    type="button"
                    className={classes(
                      'mover-chip',
                      change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral',
                      signal.symbol === activeSymbol && 'current'
                    )}
                    onClick={() => handleSignalSelect(signal.symbol)}
                  >
                    <span className={styles['mover-symbol']}>{signal.symbol}</span>
                    <span className={styles['mover-change']}>{formatSignedPercent(change, 1)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className={styles['header-stats']}>
          <div className={styles.stat}>
            Global Cap <strong>{marketOverview.globalCapLabel || '$2.41T'}</strong>
          </div>
          <div className={styles.stat}>
            BTC Dom <strong>{marketOverview.btcDominanceLabel || '53.8%'}</strong>
          </div>
          <div className={styles.stat}>
            AI Accuracy <strong style={{ color: 'var(--green)' }}>{marketOverview.aiAccuracyLabel || '87.3%'}</strong>
          </div>
        </div>
      </div>
    </header>
  );
}

function PredictionsSidebar({
  signals,
  activeSymbol,
  handleSignalSelect,
  marketOverview,
}) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles['sidebar-header']}>
        <span className={styles['sidebar-title']}>Signal Watchlist</span>
        <span className={styles['sidebar-count']}>{signals.length} Assets</span>
      </div>

      <div className={styles['market-list']}>
        {signals.map((signal) => {
          const actionLabel = resolveAction(signal.signal);
          const confidencePercent = Math.round(Number(signal.confidence || 0) * 100);
          const change = Number(signal.change24h || 0);

          return (
            <button
              type="button"
              key={signal.symbol}
              className={classes('market-item', signal.symbol === activeSymbol && 'active')}
              onClick={() => handleSignalSelect(signal.symbol)}
            >
              <div className={styles['market-pair']}>
                <span>{signal.symbol}/USDT</span>
                <span className={classes('market-change', change >= 0 ? 'up' : 'down')}>
                  {formatSignedPercent(change, 1)}
                </span>
              </div>
              <div className={styles['market-price']}>{formatMarketPrice(signal.price || 0)}</div>
              <span
                className={styles['market-signal']}
                style={
                  actionLabel === 'HOLD'
                    ? {
                        background: 'rgba(255,215,79,0.12)',
                        borderColor: 'rgba(255,215,79,0.3)',
                        color: 'var(--yellow)',
                      }
                    : undefined
                }
              >
                {actionLabel === 'HOLD' ? '⚠️' : '🤖'} {actionLabel} · {confidencePercent}%
              </span>
              <div className={styles['confidence-bar']}>
                <div
                  className={styles['confidence-fill']}
                  style={{
                    width: `${confidencePercent}%`,
                    background: actionLabel === 'HOLD' ? 'var(--yellow)' : undefined,
                  }}
                />
              </div>
            </button>
          );
        })}
      </div>

      <div className={styles['sidebar-footer']}>
        <div className={styles['global-stats']}>
          <div className={styles['global-stat']}>
            <span className={styles['global-stat-value']}>{marketOverview.totalVolumeLabel || '$94.4B'}</span>
            <span className={styles['global-stat-label']}>24h Volume</span>
          </div>
          <div className={styles['global-stat']}>
            <span className={styles['global-stat-value']} style={{ color: 'var(--green)' }}>
              {marketOverview.fearGreed || 72}
            </span>
            <span className={styles['global-stat-label']}>Fear &amp; Greed</span>
          </div>
          <div className={styles['global-stat']}>
            <span className={styles['global-stat-value']} style={{ color: 'var(--purple)' }}>
              {marketOverview.trendingSymbol || 'AI'}
            </span>
            <span className={styles['global-stat-label']}>Trending</span>
          </div>
          <div className={styles['global-stat']}>
            <span className={styles['global-stat-value']}>
              {marketOverview.activityValue || marketOverview.lastSyncLabel || 'Live'}
            </span>
            <span className={styles['global-stat-label']}>
              {marketOverview.activityLabel || 'Live Sync'}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}

function MainDecisionSection({
  activeSignal,
  activeSymbol,
  entryPrice,
  targetPrice,
  stopPrice,
  actionLabel,
  confidencePercent,
  performance,
  marketOverview,
  readiness,
  change24h,
  explainerHref,
  handleAutoFill,
  previewNetwork,
  nativeSymbol,
}) {
  const modelBreakdown =
    Array.isArray(activeSignal?.modelBreakdown) && activeSignal.modelBreakdown.length
      ? activeSignal.modelBreakdown
      : getModelBreakdown(confidencePercent, change24h);
  const volatility = getVolatilityLabel(activeSignal.riskScore);
  const priceLevels = getPriceLevels(activeSignal, entryPrice);
  const readinessState = readiness || {};
  const confirmation = readinessState.confirmation || {
    label: 'Cleared',
    tone: 'var(--green)',
  };

  return (
    <main className={styles.main}>
      <div className={styles['ai-decision']}>
        <div className={styles['ai-decision-top']}>
          <div className={styles['decision-card']}>
            <div className={styles['decision-header']}>
              <div className={styles['decision-info']}>
                <h3>AI Decision</h3>
                <h1>
                  {actionLabel} {activeSignal.symbol}
                </h1>
                <p>{activeSignal.setup || activeSignal.catalystSummary}</p>
              </div>
              <div
                className={styles['confidence-ring']}
                style={{
                  background: `conic-gradient(var(--green) 0deg ${(confidencePercent / 100) * 360}deg, rgba(255,255,255,0.08) ${(confidencePercent / 100) * 360}deg 360deg)`,
                }}
              >
                <div className={styles['confidence-inner']}>
                  <span className={styles['confidence-value']}>{confidencePercent}%</span>
                  <span className={styles['confidence-label']}>Confidence</span>
                </div>
              </div>
            </div>

            <div className={styles['signal-metrics']}>
              <div className={styles['metric-box']}>
                <div className={styles['metric-label']}>Entry</div>
                <div className={styles['metric-value']} style={{ color: 'var(--cyan)' }}>
                  {formatUsd(entryPrice)}
                </div>
              </div>
              <div className={styles['metric-box']}>
                <div className={styles['metric-label']}>Take Profit</div>
                <div className={styles['metric-value']} style={{ color: 'var(--green)' }}>
                  {formatUsd(targetPrice)}
                </div>
              </div>
              <div className={styles['metric-box']}>
                <div className={styles['metric-label']}>Stop Loss</div>
                <div className={styles['metric-value']} style={{ color: 'var(--red)' }}>
                  {formatUsd(stopPrice)}
                </div>
              </div>
              <div className={styles['metric-box']}>
                <div className={styles['metric-label']}>Risk Level</div>
                <div className={styles['metric-value']} style={{ color: volatility.color }}>
                  {volatility.label}
                </div>
              </div>
              <div className={styles['metric-box']}>
                <div className={styles['metric-label']}>R/R Ratio</div>
                <div className={styles['metric-value']}>{activeSignal.rewardRisk || '2.0x'}</div>
              </div>
              <div className={styles['metric-box']}>
                <div className={styles['metric-label']}>Horizon</div>
                <div className={styles['metric-value']}>{activeSignal.horizon || '1-2d'}</div>
              </div>
            </div>

            <div className={styles['decision-actions']}>
              <Link href={explainerHref} className={classes('btn', 'btn-outline')} style={{ flex: 1 }}>
                Open AI Explainer
              </Link>
              <button type="button" className={classes('btn', 'btn-fill')} style={{ flex: 1 }} onClick={handleAutoFill}>
                Auto Fill Trade
              </button>
            </div>
          </div>

          <div className={styles['insight-card']}>
            <div className={styles['insight-title']}>Signal Breakdown</div>

            {modelBreakdown.map((item) => (
              <div key={item.name} className={styles['model-row']}>
                <div className={styles['model-header']}>
                  <span className={styles['model-name']}>{item.name}</span>
                  <span className={styles['model-score']} style={{ color: item.color }}>
                    {item.score}%
                  </span>
                </div>
                <div className={styles['progress-bar']}>
                  <div
                    className={styles['progress-fill']}
                    style={{
                      width: `${item.score}%`,
                      background: item.color === 'var(--yellow)' ? 'var(--yellow)' : undefined,
                    }}
                  />
                </div>
              </div>
            ))}

            <div className={styles['compact-stat-grid']} style={{ marginTop: 'var(--space-md)' }}>
              <div className={styles['compact-stat']}>
                <span className={styles['compact-stat-value']} style={{ color: 'var(--green)' }}>
                  {Number(performance.win_rate || 0).toFixed(1)}%
                </span>
                <span className={styles['compact-stat-label']}>Win Rate</span>
              </div>
              <div className={styles['compact-stat']}>
                <span className={styles['compact-stat-value']} style={{ color: 'var(--green)' }}>
                  {formatSignedPercent(performance.total_profit || 0, 1)}
                </span>
                <span className={styles['compact-stat-label']}>Total PnL</span>
              </div>
              <div className={styles['compact-stat']}>
                <span className={styles['compact-stat-value']}>{formatInteger(performance.total_trades || 0)}</span>
                <span className={styles['compact-stat-label']}>Trades</span>
              </div>
              <div className={styles['compact-stat']}>
                <span className={styles['compact-stat-value']}>{activeSignal.horizon || '4H'}</span>
                <span className={styles['compact-stat-label']}>Avg Hold</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles['ai-decision-bottom']}>
          <div className={styles['decision-card-compact']}>
            <div className={styles['decision-header-compact']}>
              <span className={styles['insight-title']} style={{ margin: 0 }}>
                Market Data
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--green)' }}>
                {marketOverview.liveMarketLabel || 'LIVE'}
              </span>
            </div>
            <div className={styles['info-row']}>
              <span>24h Volume</span>
              <strong>{marketOverview.totalVolumeLabel || '$94.4B'}</strong>
            </div>
            <div className={styles['info-row']}>
              <span>Market Cap</span>
              <strong>{marketOverview.globalCapLabel || '$2.41T'}</strong>
            </div>
            <div className={styles['info-row']}>
              <span>BTC Dominance</span>
              <strong>{marketOverview.btcDominanceLabel || '53.8%'}</strong>
            </div>
            <div className={styles['info-row']}>
              <span>{marketOverview.marketCapChangeLabel ? '24h Cap Change' : 'Fear & Greed'}</span>
              <strong
                style={{
                  color:
                    typeof marketOverview.marketCapChangeValue === 'number'
                      ? marketOverview.marketCapChangeValue >= 0
                        ? 'var(--green)'
                        : 'var(--red)'
                      : 'var(--green)',
                }}
              >
                {marketOverview.marketCapChangeLabel || `${marketOverview.fearGreed || 72} (Greed)`}
              </strong>
            </div>
          </div>

          <div className={styles['decision-card-compact']}>
            <div className={styles['decision-header-compact']}>
              <span className={styles['insight-title']} style={{ margin: 0 }}>
                Execution Readiness
              </span>
              <span style={{ fontSize: '0.7rem', color: readinessState.statusTone || 'var(--green)' }}>
                {readinessState.statusLabel || 'READY'}
              </span>
            </div>
            <div className={styles['readiness-grid']}>
              <div className={styles['readiness-item']}>
                <span
                  className={styles['readiness-status']}
                  style={{ color: getMetricTone(readinessState.oracle?.tone || 'var(--green)') }}
                >
                  {readinessState.oracle?.label || 'OK'}
                </span>
                <span className={styles['readiness-label']}>Signal Check</span>
              </div>
              <div className={styles['readiness-item']}>
                <span
                  className={styles['readiness-status']}
                  style={{ color: getMetricTone(readinessState.contract?.tone || 'var(--purple)') }}
                >
                  {readinessState.contract?.label || 'Ready'}
                </span>
                <span className={styles['readiness-label']}>Execution</span>
              </div>
              <div className={styles['readiness-item']}>
                <span
                  className={styles['readiness-status']}
                  style={{ color: getMetricTone(confirmation.tone || 'var(--green)') }}
                >
                  {confirmation.label}
                </span>
                <span className={styles['readiness-label']}>Confirm</span>
              </div>
              <div className={styles['readiness-item']}>
                <span className={styles['readiness-status']} style={{ color: volatility.color }}>
                  {readinessState.volatility?.label || volatility.label}
                </span>
                <span className={styles['readiness-label']}>Volatility</span>
              </div>
            </div>
            <div className={styles['info-row']} style={{ marginTop: 'var(--space-sm)' }}>
              <span>Est. Fee</span>
              <strong>{readinessState.estimatedGasLabel || `~0.003 ${nativeSymbol}`}</strong>
            </div>
            <div className={styles['info-row']}>
              <span>Network</span>
              <strong style={{ color: 'var(--purple)' }}>
                {readinessState.networkLabel || previewNetwork?.chainName || 'Execution network'}
              </strong>
            </div>
          </div>

          <div className={styles['decision-card-compact']}>
            <div className={styles['decision-header-compact']}>
              <span className={styles['insight-title']} style={{ margin: 0 }}>
                Price Levels
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--cyan)' }}>{activeSymbol}/USDT</span>
            </div>
            <div className={styles['info-row']}>
              <span>Current Price</span>
              <strong style={{ color: 'var(--cyan)' }}>{formatUsd(priceLevels.currentPrice)}</strong>
            </div>
            <div className={styles['info-row']}>
              <span>24h High</span>
              <strong>{formatUsd(priceLevels.high24)}</strong>
            </div>
            <div className={styles['info-row']}>
              <span>24h Low</span>
              <strong>{formatUsd(priceLevels.low24)}</strong>
            </div>
            <div className={styles['info-row']}>
              <span>24h Change</span>
              <strong style={{ color: change24h >= 0 ? 'var(--green)' : 'var(--red)' }}>
                {formatSignedPercent(change24h, 1)}
              </strong>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function RightExecutionPanel({
  wallet,
  previewNetwork,
  tokenSymbol,
  availableBalance,
  hasLiveBalance,
  nativeSymbol,
  actionLabel,
  activeSignal,
  confidencePercent,
  amountInput,
  setAmountInput,
  amountPercent,
  applyQuickAmount,
  safeAmount,
  entryPrice,
  targetPrice,
  executionState,
  feedback,
  handleExecuteTrade,
  chainId,
  readiness,
}) {
  const walletMode = !wallet.providerAvailable
    ? 'Wallet required'
    : wallet.isConnected
      ? 'Wallet connected'
      : 'Wallet ready';
  const walletSummary = wallet.isConnected ? shortenAddress(wallet.account) : 'No wallet connected';
  const readinessState = readiness || {};
  const contractStatus =
    executionState === 'success'
      ? 'Executed'
      : executionState === 'submitting'
        ? 'Submitting'
        : wallet.isWrongNetwork
          ? 'Switch Network'
          : wallet.isConnected
            ? readinessState.contract?.label || 'Ready'
            : 'Preview';
  const executeLabel =
    executionState === 'success'
      ? '✅ TRADE SUBMITTED'
      : executionState === 'submitting'
        ? '⏳ SUBMITTING TRADE'
        : actionLabel === 'HOLD'
          ? '⚠ AI SIGNAL ON HOLD'
          : '⚡ EXECUTE AI TRADE';
  const executeSubLabel =
    executionState === 'success'
      ? feedback?.tradeId || 'Open Trade History'
      : executionState === 'submitting'
        ? 'Waiting for execution confirmation'
        : actionLabel === 'HOLD'
          ? 'Wait for directional confirmation'
          : wallet.isWrongNetwork
            ? 'Switch network to continue'
            : wallet.isConnected
              ? 'Review and approve in wallet'
              : 'Connect wallet to continue';
  const stepsStatus =
    executionState === 'success'
      ? 'Executed'
      : executionState === 'submitting'
        ? 'Submitting'
        : executionState === 'error'
          ? 'Review'
          : 'Pre-check OK';

  return (
    <aside className={styles.panel}>
      <div className={styles['wallet-card']}>
        <strong>Execution Access</strong>
        <br />
        {walletMode} · {previewNetwork?.chainName || 'Polygon Amoy Testnet'} · {walletSummary}
        <br />
        Balance:{' '}
        <strong>
          {formatTokenAmount(availableBalance)} {tokenSymbol}
          {!hasLiveBalance ? ' preview' : ''}
        </strong>{' '}
        · Est. fee: ~0.003 {nativeSymbol}
      </div>

      <div className={styles['ai-lock']}>
        <div className={styles['ai-lock-header']}>
          <div className={styles['ai-lock-icon']}>🧠</div>
          <div className={styles['ai-lock-info']}>
            <strong>AI Recommendation Locked</strong>
            <p>Trade based on AI signal. Cannot be changed manually.</p>
          </div>
        </div>
        <div className={styles['ai-lock-grid']}>
          <div className={styles['ai-lock-item']}>
            <div className={styles['ai-lock-label']}>Symbol</div>
            <div className={styles['ai-lock-value']}>{activeSignal.symbol}</div>
          </div>
          <div className={styles['ai-lock-item']}>
            <div className={styles['ai-lock-label']}>Action</div>
            <div
              className={styles['ai-lock-value']}
              style={{
                color:
                  actionLabel === 'SELL'
                    ? 'var(--red)'
                    : actionLabel === 'HOLD'
                      ? 'var(--yellow)'
                      : 'var(--green)',
              }}
            >
              {actionLabel}
            </div>
          </div>
          <div className={styles['ai-lock-item']}>
            <div className={styles['ai-lock-label']}>Confidence</div>
            <div className={styles['ai-lock-value']} style={{ color: 'var(--green)' }}>
              {confidencePercent}%
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        className={styles['btn-execute-hero']}
        onClick={handleExecuteTrade}
        disabled={executionState === 'submitting' || actionLabel === 'HOLD'}
      >
        {executeLabel}
        <small>{executeSubLabel}</small>
      </button>

      {feedback && (
        <div className={classes('execution-feedback', feedback.tone === 'success' ? 'feedback-success' : 'feedback-error')}>
          <strong>{feedback.tone === 'success' ? 'Execution Ready' : 'Execution Blocked'}</strong>
          <p>{feedback.message}</p>
          {feedback.tradeId && <span>Trade ID: {feedback.tradeId}</span>}
          {feedback.oracleStatus && <span>Signal Check: {feedback.oracleStatus}</span>}
          {feedback.validationStatus && <span>Validation: {feedback.validationStatus}</span>}
          {feedback.settlementStatus && <span>Execution: {feedback.settlementStatus}</span>}
          {feedback.recordHash && <span>Reference: {shortenAddress(feedback.recordHash)}</span>}
        </div>
      )}

      <div className={styles.field}>
        <label className={styles['field-label']} htmlFor="html-workspace-amount">
          Execution Amount ({tokenSymbol})
        </label>
        <div className={styles['amount-input']}>
          <input
            id="html-workspace-amount"
            type="text"
            value={amountInput}
            onChange={(event) => setAmountInput(event.target.value.replace(/[^\d.]/g, ''))}
          />
          <button type="button" className={styles['btn-max']} onClick={() => applyQuickAmount(100)}>
            MAX
          </button>
          <span className={styles['amount-unit']}>{tokenSymbol}</span>
        </div>
        <div className={styles['quick-buttons']}>
          {QUICK_AMOUNTS.map((percent) => {
            const isActive =
              percent === 100
                ? amountPercent >= 99.5
                : amountPercent >= percent - 1 && amountPercent < percent + 1;

            return (
              <button
                type="button"
                key={percent}
                className={classes('btn-quick', isActive && 'active')}
                onClick={() => applyQuickAmount(percent)}
              >
                {percent}%
              </button>
            );
          })}
        </div>
        <div className={styles['amount-hint']}>
          <span>
            Available: <strong>{formatTokenAmount(availableBalance)}</strong>
          </span>
          <span>Minimum: 1</span>
        </div>
      </div>

      <div className={styles['summary-grid']}>
        <div className={styles['summary-item']}>
          <div className={styles['summary-label']}>You Allocate</div>
          <div className={styles['summary-value']}>{formatTokenAmount(safeAmount)} {tokenSymbol}</div>
        </div>
        <div className={styles['summary-item']}>
          <div className={styles['summary-label']}>Execution Price</div>
          <div className={styles['summary-value']}>{formatUsd(entryPrice)}</div>
        </div>
        <div className={styles['summary-item']}>
          <div className={styles['summary-label']}>Take Profit</div>
          <div className={styles['summary-value']} style={{ color: 'var(--green)' }}>
            {formatUsd(targetPrice)}
          </div>
        </div>
      </div>

      <div className={styles['contract-preview']}>
        <div className={styles['contract-header']}>
          <span className={styles['contract-title']}>Execution Preview</span>
          <span className={styles['contract-status']}>{contractStatus}</span>
        </div>
        <div className={styles['contract-body']}>
          <div className={styles['contract-code']}>
            executeTrade("{activeSignal.symbol}", "{actionLabel}", {Math.round(safeAmount || 0)}, {Math.round(entryPrice || 0)})
          </div>
          <div className={styles['contract-effects']}>
            <div className={styles['effect-item']}>Reserve {formatTokenAmount(safeAmount)} {tokenSymbol}</div>
            <div className={styles['effect-item']}>Run signal and validation checks</div>
            <div className={styles['effect-item']}>Create execution record</div>
          </div>
        </div>
      </div>

      <div className={styles['execution-steps']}>
        <div className={styles['steps-header']}>
          <span className={styles['contract-title']}>Execute Trade</span>
          <span className={styles['contract-status']}>{stepsStatus}</span>
        </div>
        <div className={styles['steps-body']}>
          <div className={classes('check-item', wallet.isConnected ? 'ok' : 'warn')}>
            <span>Wallet access</span>
            <span className={styles['check-value']}>{wallet.isConnected ? shortenAddress(wallet.account) : 'Connect wallet'}</span>
          </div>
          <div className={classes('check-item', wallet.isWrongNetwork ? 'warn' : 'ok')}>
            <span>Network</span>
            <span className={styles['check-value']}>{previewNetwork?.chainName || 'Polygon Amoy'} {chainId || 80002}</span>
          </div>
          <div className={classes('check-item', availableBalance >= safeAmount && safeAmount >= 1 ? 'ok' : 'warn')}>
            <span>Funds check</span>
            <span className={styles['check-value']}>
              {formatTokenAmount(availableBalance)} ≥ {formatTokenAmount(safeAmount || 0)}
            </span>
          </div>
          <div className={classes('check-item', safeAmount >= 1 ? 'ok' : 'warn')}>
            <span>Allocation</span>
            <span className={styles['check-value']}>{formatTokenAmount(safeAmount || 0)} {tokenSymbol}</span>
          </div>

          <div className={styles['steps-grid']}>
            <div className={classes('step-item', 'active')}>
              <span className={styles['step-number']}>1</span>
              <span className={styles['step-label']}>Pre-check</span>
            </div>
            <div className={classes('step-item', (executionState === 'submitting' || executionState === 'success') && 'active')}>
              <span className={styles['step-number']}>2</span>
              <span className={styles['step-label']}>Approve</span>
            </div>
            <div className={classes('step-item', executionState === 'success' && 'active')}>
              <span className={styles['step-number']}>3</span>
              <span className={styles['step-label']}>Confirmed</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function FooterTabs({
  activeTab,
  setActiveTab,
  historyRows,
  positions,
  orders,
}) {
  const footerTabs = [
    { id: 'history', label: 'Trade History' },
    { id: 'positions', label: 'Active Positions' },
    { id: 'orders', label: 'Queued Actions' },
  ];

  return (
    <footer className={styles.footer}>
      <div className={styles['footer-tabs']}>
        {footerTabs.map((tab) => (
          <button
            type="button"
            key={tab.id}
            className={classes('footer-tab', activeTab === tab.id && 'active')}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'history' && (
        <div className={styles['footer-section']}>
          <div className={classes('table-row', 'header')}>
            <span>Time</span>
            <span>Asset</span>
            <span>Type</span>
            <span>Amount</span>
            <span>Price</span>
            <span>PnL</span>
            <span>Status</span>
            <span>Ref</span>
          </div>

          {historyRows.length ? (
            historyRows.map((item) => (
              <div key={item.tradeId || `${item.symbol}-${item.timestamp}`} className={styles['table-row']}>
                <span>{formatShortTime(item.timestamp)}</span>
                <span>{item.symbol}</span>
                <span style={{ color: item.type === 'SELL' ? 'var(--red)' : 'var(--green)' }}>{item.type}</span>
                <span>{formatTokenAmount(item.amount)}</span>
                <span>{formatUsd(item.price)}</span>
                <span style={{ color: Number(item.pnl || 0) >= 0 ? 'var(--green)' : 'var(--red)' }}>
                  {formatSignedPercent(item.pnl || 0, 1)}
                </span>
                <span style={{ color: Number(item.pnl || 0) >= 0 ? 'var(--green)' : 'var(--red)' }}>{item.status}</span>
                <span style={{ color: 'var(--purple)' }}>
                  {shortenAddress(item.txHash || item.recordHash || item.tradeId || 'pending')}
                </span>
              </div>
            ))
          ) : (
            <div className={styles['empty-row']}>No execution history yet</div>
          )}
        </div>
      )}

      {activeTab === 'positions' && (
        <div className={styles['footer-section']}>
          <div className={classes('table-row', 'header')} style={{ gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
            <span>Asset</span>
            <span>Type</span>
            <span>Entry</span>
            <span>Current</span>
            <span>Amount</span>
            <span>PnL</span>
            <span>Action</span>
          </div>

          {positions.length ? (
            positions.map((item) => (
              <div
                key={item.id}
                className={styles['table-row']}
                style={{ gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}
              >
                <span>{item.symbol}</span>
                <span style={{ color: item.type === 'SELL' ? 'var(--red)' : 'var(--green)' }}>{item.type}</span>
                <span>{formatUsd(item.price)}</span>
                <span>{formatUsd(item.currentPrice || item.price)}</span>
                <span>{formatTokenAmount(item.amount)}</span>
                <span style={{ color: Number(item.pnl || 0) >= 0 ? 'var(--green)' : 'var(--red)' }}>
                  {formatSignedPercent(item.pnl || 0, 1)}
                </span>
                <span style={{ color: 'var(--cyan)' }}>Monitor</span>
              </div>
            ))
          ) : (
            <div className={styles['empty-row']}>No active positions</div>
          )}
        </div>
      )}

      {activeTab === 'orders' && (
        <div className={styles['footer-section']}>
          <div className={classes('table-row', 'header')} style={{ gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
            <span>Time</span>
            <span>Asset</span>
            <span>Type</span>
            <span>Amount</span>
            <span>Price</span>
            <span>Status</span>
            <span>Action</span>
          </div>

          {orders.length ? (
            orders.map((item) => (
              <div
                key={item.id}
                className={styles['table-row']}
                style={{ gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}
              >
                <span>{formatShortTime(item.timestamp)}</span>
                <span>{item.symbol}</span>
                <span style={{ color: item.type === 'SELL' ? 'var(--red)' : 'var(--green)' }}>{item.type}</span>
                <span>{formatTokenAmount(item.amount)}</span>
                <span>{formatUsd(item.price)}</span>
                <span style={{ color: 'var(--yellow)' }}>{item.status}</span>
                <span style={{ color: 'var(--yellow)' }}>Pending</span>
              </div>
            ))
          ) : (
            <div className={styles['empty-row']}>No queued approvals</div>
          )}
        </div>
      )}
    </footer>
  );
}

export default function AiPowerTradeFinalWorkspace() {
  const router = useRouter();
  const wallet = useWallet();
  const walletMenuRef = useRef(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [terminalData, setTerminalData] = useState(createFallbackTerminalData);
  const [terminalLoading, setTerminalLoading] = useState(true);
  const [terminalRefreshing, setTerminalRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [amountInput, setAmountInput] = useState('1000');
  const [executionState, setExecutionState] = useState('idle');
  const [feedback, setFeedback] = useState(null);
  const [activeTab, setActiveTab] = useState('history');
  const [headerExpanded, setHeaderExpanded] = useState(false);
  const [walletMenuOpen, setWalletMenuOpen] = useState(false);
  const [localHistory, setLocalHistory] = useState([]);
  const [localPositions, setLocalPositions] = useState([]);
  const [localOrders, setLocalOrders] = useState([]);

  const requestedSymbol =
    typeof router.query.symbol === 'string' ? router.query.symbol.trim().toUpperCase() : 'BTC';
  const signals = Array.isArray(terminalData?.signals) && terminalData.signals.length ? terminalData.signals : aiSignals;
  const activeSignal =
    signals.find((signal) => signal.symbol === requestedSymbol) ||
    signals.find((signal) => signal.symbol === terminalData?.requestedSymbol) ||
    signals[0] ||
    aiSignals[0];
  const activeSymbol = activeSignal?.symbol || 'BTC';
  const actionLabel = resolveAction(activeSignal?.signal);
  const tradeType = inferTradeType(actionLabel);
  const entryPrice = parseEntryPrice(activeSignal);
  const targetPrice = parseTargetPrice(activeSignal, entryPrice);
  const stopPrice = parseStopPrice(activeSignal, entryPrice);
  const confidencePercent = Math.round(Number(activeSignal?.confidence || 0) * 100);
  const previewNetwork =
    wallet.isConnected || wallet.isWrongNetwork
      ? wallet.networkConfig
      : terminalData?.blockchain?.network || wallet.networkConfig;
  const previewToken =
    wallet.isConnected || wallet.isWrongNetwork
      ? wallet.tokenMeta
      : terminalData?.blockchain?.token || wallet.tokenMeta;
  const hasLiveBalance =
    typeof wallet.tokenBalance === 'number' && Number.isFinite(wallet.tokenBalance);
  const availableBalance = hasLiveBalance ? wallet.tokenBalance : DEFAULT_PREVIEW_BALANCE;
  const nativeSymbol = previewNetwork?.nativeCurrency?.symbol || 'MATIC';
  const tokenSymbol = previewToken?.symbol || 'atUSDT';
  const chainId = parseChainIdValue(wallet.chainId || previewNetwork?.chainId);
  const amountValue = Number(amountInput);
  const safeAmount = Number.isFinite(amountValue) ? clamp(amountValue, 0, availableBalance) : 0;
  const amountPercent = availableBalance > 0 ? (safeAmount / availableBalance) * 100 : 0;
  const marketOverview = terminalData?.marketOverview || {};
  const performance = terminalData?.performance || {};
  const remoteHistory = Array.isArray(terminalData?.history) && terminalData.history.length ? terminalData.history : DEMO_HISTORY;
  const readiness = terminalData?.readiness || {};
  const mergedHistory = [...localHistory, ...remoteHistory].slice(0, 8);
  const walletButton = getWalletButtonState(wallet);
  const topMovers = getTopMovers(signals, activeSymbol);
  const explainerHref = `/ai-explainer?symbol=${activeSymbol}`;
  const change24h = Number(activeSignal?.change24h || 0);

  useEffect(() => {
    if (hasLiveBalance && Number(amountInput) > wallet.tokenBalance && wallet.tokenBalance > 0) {
      setAmountInput(String(Math.min(1000, Math.floor(wallet.tokenBalance))));
    }
  }, [amountInput, hasLiveBalance, wallet.tokenBalance]);

  useEffect(() => {
    let cancelled = false;
    let intervalId = null;
    let activeController = null;

    async function loadTerminalData(background = false) {
      if (background) {
        setTerminalRefreshing(true);
      } else {
        setTerminalLoading(true);
      }

      activeController?.abort();
      activeController = new AbortController();

      try {
        const response = await fetch(`/api/app/terminal?symbol=${encodeURIComponent(requestedSymbol)}`, {
          signal: activeController.signal,
        });

        if (!response.ok) {
          throw new Error(`Terminal API returned ${response.status}`);
        }

        const payload = await response.json();

        if (cancelled) {
          return;
        }

        if (payload?.success && payload?.data) {
          setTerminalData(payload.data);
          setLoadError(null);
        } else {
          throw new Error(payload?.message || 'Terminal data was unavailable');
        }
      } catch (error) {
        if (error.name === 'AbortError' || cancelled) {
          return;
        }

        setLoadError(error.message || 'Unable to refresh terminal data');
      } finally {
        if (!cancelled) {
          setTerminalLoading(false);
          setTerminalRefreshing(false);
        }
      }
    }

    loadTerminalData(false);
    intervalId = window.setInterval(() => {
      loadTerminalData(true);
    }, TERMINAL_REFRESH_MS);

    return () => {
      cancelled = true;
      if (intervalId) {
        window.clearInterval(intervalId);
      }
      if (activeController) {
        activeController.abort();
      }
    };
  }, [reloadToken, requestedSymbol]);

  useEffect(() => {
    setFeedback(null);
    setExecutionState('idle');
    setLocalOrders([]);
  }, [activeSymbol]);

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

  async function handleWalletAction() {
    if (wallet.providerAvailable && wallet.isConnected && !wallet.isWrongNetwork) {
      setWalletMenuOpen((current) => !current);
      return;
    }

    setWalletMenuOpen(false);

    if (walletButton.action) {
      await walletButton.action();
    }
  }

  async function handleWalletSwitch() {
    setWalletMenuOpen(false);
    await wallet.switchWallet();
  }

  async function handleWalletDisconnect() {
    setWalletMenuOpen(false);
    setFeedback(null);
    await wallet.disconnectWallet();
  }

  function handleSignalSelect(symbol) {
    router.push(
      {
        pathname: '/app',
        query: { symbol },
      },
      undefined,
      { shallow: true }
    );
  }

  function applyQuickAmount(percent) {
    const nextAmount = availableBalance * (percent / 100);
    setAmountInput(nextAmount >= 100 ? String(Math.round(nextAmount)) : nextAmount.toFixed(2));
    setFeedback(null);
  }

  function handleAutoFill() {
    const suggestion =
      availableBalance >= 1000
        ? Math.min(1000, Math.max(100, availableBalance * Math.max(0.08, Number(activeSignal?.confidence || 0) * 0.12)))
        : availableBalance;

    setAmountInput(suggestion >= 100 ? String(Math.round(suggestion)) : suggestion.toFixed(2));
  }

  async function handleExecuteTrade() {
    if (executionState === 'success') {
      setActiveTab('history');
      return;
    }

    setFeedback(null);

    if (actionLabel === 'HOLD') {
      setExecutionState('idle');
      setFeedback({
        tone: 'error',
        message: 'This setup is still on hold. Wait for a BUY or SELL bias before executing.',
      });
      return;
    }

    if (safeAmount < 1) {
      setExecutionState('idle');
      setFeedback({
        tone: 'error',
        message: `Enter at least 1 ${tokenSymbol} to continue.`,
      });
      return;
    }

    if (hasLiveBalance && safeAmount > availableBalance) {
      setExecutionState('idle');
      setFeedback({
        tone: 'error',
        message: `Amount exceeds available ${tokenSymbol} balance.`,
      });
      return;
    }

    const ready = await wallet.ensureWalletReady();

    if (!ready) {
      setExecutionState('idle');
      setFeedback({
        tone: 'error',
        message: 'Execution approval or network switch was not completed.',
      });
      return;
    }

    const pendingOrder = {
      id: `ORD-${Date.now()}`,
      symbol: activeSignal.symbol,
      type: actionLabel,
      amount: safeAmount,
      price: entryPrice,
      status: 'Submitting',
      timestamp: new Date().toISOString(),
    };

    setLocalOrders((current) => [pendingOrder, ...current].slice(0, 6));
    setExecutionState('submitting');

    try {
      const response = await fetch('/api/trades/execute-simulated', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol: activeSignal.symbol,
          trade_type: tradeType,
          amount: safeAmount,
          price: entryPrice,
          wallet_address: wallet.account,
          confidence: activeSignal.confidence,
          risk_score: activeSignal.riskScore,
        }),
      });

      const payload = await response.json();

      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.message || 'Trade execution failed');
      }

      const txHash = payload?.tx_hash || payload?.data?.tx_hash || null;
      let verification = null;

      if (txHash) {
        try {
          const verificationResponse = await fetch(
            `/api/backend/blockchain/verify-transaction?tx_hash=${encodeURIComponent(txHash)}`,
            {
              method: 'POST',
            }
          );

          if (verificationResponse.ok) {
            const verificationPayload = await verificationResponse.json();
            verification = verificationPayload?.data || null;
          }
        } catch (verificationError) {
          console.error('Transaction verification failed:', verificationError);
        }
      }

      const tradeRecord = {
        tradeId: payload?.trade_id || payload?.data?.trade_id || `APT-${Date.now()}`,
        symbol: activeSignal.symbol,
        type: actionLabel,
        amount: safeAmount,
        price: entryPrice,
        pnl: 0,
        status: payload?.data?.settlement?.status || payload?.data?.settlement_status || 'Submitted',
        timestamp: new Date().toISOString(),
        txHash,
        recordHash: payload?.record_hash || payload?.data?.record_hash || payload?.data?.on_chain_record?.block_hash || null,
      };

      setLocalOrders((current) => current.filter((item) => item.id !== pendingOrder.id));
      setLocalHistory((current) => [tradeRecord, ...current].slice(0, 6));
      setLocalPositions((current) => [
        {
          id: tradeRecord.tradeId,
          symbol: tradeRecord.symbol,
          type: tradeRecord.type,
          amount: tradeRecord.amount,
          price: tradeRecord.price,
          currentPrice: tradeRecord.price,
          pnl: 0,
        },
        ...current.filter((item) => item.id !== tradeRecord.tradeId),
      ].slice(0, 6));
      setExecutionState('success');
      setFeedback({
        tone: 'success',
        message: payload?.message || 'Execution request submitted successfully.',
        tradeId: tradeRecord.tradeId,
        oracleStatus:
          verification?.transaction_hash
            ? 'Confirmed'
            : payload?.data?.oracle_verification?.is_verified === true
            ? 'Validated'
            : payload?.data?.oracle_verification
              ? 'Assisted review'
              : null,
        validationStatus:
          payload?.data?.validation?.is_valid === true
            ? 'Passed'
            : payload?.data?.validation
              ? 'Review'
              : payload?.data?.validation_status || null,
        settlementStatus: payload?.data?.settlement?.status || payload?.data?.settlement_status || null,
        recordHash: tradeRecord.recordHash,
      });
      setActiveTab('history');

      if (wallet.account) {
        await wallet.refreshBalance(wallet.account);
      }
    } catch (error) {
      setLocalOrders((current) => current.filter((item) => item.id !== pendingOrder.id));
      setExecutionState('error');
      setFeedback({
        tone: 'error',
        message: error.message || 'Trade execution failed',
      });
    }
  }

  return (
    <>
      <Head>
        <title>{`${activeSymbol} Trading Workspace | AI Power Trade`}</title>
      </Head>

      <div className={styles.page}>
        <div className={styles.terminal}>
          <WorkspaceHeader
            headerExpanded={headerExpanded}
            setHeaderExpanded={setHeaderExpanded}
            previewNetwork={previewNetwork}
            chainId={chainId}
            wallet={wallet}
            walletButton={walletButton}
            walletMenuOpen={walletMenuOpen}
            walletMenuRef={walletMenuRef}
            handleWalletAction={handleWalletAction}
            handleWalletSwitch={handleWalletSwitch}
            handleWalletDisconnect={handleWalletDisconnect}
            movers={topMovers}
            activeSymbol={activeSymbol}
            handleSignalSelect={handleSignalSelect}
            marketOverview={marketOverview}
          />

          <PredictionsSidebar
            signals={signals.slice(0, 8)}
            activeSymbol={activeSymbol}
            handleSignalSelect={handleSignalSelect}
            marketOverview={marketOverview}
          />

          <MainDecisionSection
            activeSignal={activeSignal}
            activeSymbol={activeSymbol}
            entryPrice={entryPrice}
            targetPrice={targetPrice}
            stopPrice={stopPrice}
            actionLabel={actionLabel}
            confidencePercent={confidencePercent}
            performance={performance}
            marketOverview={marketOverview}
            readiness={readiness}
            change24h={change24h}
            explainerHref={explainerHref}
            handleAutoFill={handleAutoFill}
            previewNetwork={previewNetwork}
            nativeSymbol={nativeSymbol}
          />

          <RightExecutionPanel
            wallet={wallet}
            previewNetwork={previewNetwork}
            tokenSymbol={tokenSymbol}
            availableBalance={availableBalance}
            hasLiveBalance={hasLiveBalance}
            nativeSymbol={nativeSymbol}
            actionLabel={actionLabel}
            activeSignal={activeSignal}
            confidencePercent={confidencePercent}
            amountInput={amountInput}
            setAmountInput={setAmountInput}
            amountPercent={amountPercent}
            applyQuickAmount={applyQuickAmount}
            safeAmount={safeAmount}
            entryPrice={entryPrice}
            targetPrice={targetPrice}
            executionState={executionState}
            feedback={feedback}
            handleExecuteTrade={handleExecuteTrade}
            chainId={chainId}
            readiness={readiness}
          />

          <FooterTabs
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            historyRows={mergedHistory}
            positions={localPositions}
            orders={localOrders}
          />
        </div>

        {loadError && (
          <div className={styles['load-alert']}>
            <strong>Live workspace preview is active.</strong>
            <span>{loadError}</span>
            <button
              type="button"
              className={styles['load-alert-button']}
              onClick={() => {
                setLoadError(null);
                setReloadToken((current) => current + 1);
              }}
            >
              Retry Live Feed
            </button>
          </div>
        )}
        {terminalLoading && <div className={styles['screen-status']}>Loading workspace...</div>}
        {!terminalLoading && terminalRefreshing && (
          <div className={styles['screen-status']}>Refreshing live signal view...</div>
        )}
      </div>
    </>
  );
}
