import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

import AppWorkspaceShell from '../components/AppWorkspaceShell';
import { resolveBlockchainConfig, shortenAddress } from '../lib/walletNetwork';
import { cache } from '../utils/cache';
import workspaceStyles from '../styles/workspace-page.module.css';
import historyStyles from '../styles/trade-history-page.module.css';

const HISTORY_CACHE_KEY = 'backend_trade_history';
const DEFAULT_TOKEN_SYMBOL = 'atUSDT';

function getTradeTone(tradeType = '') {
  const normalized = tradeType.toLowerCase();

  if (normalized === 'buy') {
    return historyStyles.badgeBuy;
  }

  if (normalized === 'sell') {
    return historyStyles.badgeSell;
  }

  return historyStyles.badgeHold;
}

function getStatusTone(status = '') {
  const normalized = String(status).toLowerCase();

  if (normalized.includes('settled') || normalized.includes('closed')) {
    return historyStyles.statusGood;
  }

  if (normalized.includes('process') || normalized.includes('submit') || normalized.includes('pending')) {
    return historyStyles.statusPending;
  }

  return historyStyles.statusNeutral;
}

function getTimeSince(timestamp) {
  if (!timestamp) {
    return 'Unknown';
  }

  const source = new Date(timestamp);
  const diff = Date.now() - source.getTime();

  if (!Number.isFinite(diff) || diff < 0) {
    return 'Just now';
  }

  if (diff < 60_000) return `${Math.max(1, Math.floor(diff / 1000))}s ago`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

function formatSignedAmount(value) {
  const amount = Number(value || 0);
  return `${amount >= 0 ? '+' : ''}${amount.toFixed(2)}`;
}

function normalizeTrade(item, index = 0) {
  const typeSource = item?.type || item?.trade_type || item?.signal || 'BUY';

  return {
    tradeId: item?.trade_id || item?.id || `APT-HISTORY-${index + 1}`,
    trader: item?.user || item?.wallet_address || 'Unknown account',
    symbol: String(item?.symbol || 'BTC').toUpperCase(),
    tradeType: /sell|short/i.test(typeSource) ? 'SELL' : /hold|watch/i.test(typeSource) ? 'HOLD' : 'BUY',
    amount: Number(item?.amount || item?.value || 0),
    price: Number(item?.price || 0),
    pnl: Number(item?.profit_loss || item?.pnl || 0),
    status: item?.status || (item?.settled ? 'Settled' : 'Processing'),
    timestamp: item?.timestamp || item?.created_at || new Date().toISOString(),
    txHash: item?.tx_hash || item?.transaction_hash || null,
    recordHash: item?.record_hash || item?.block_hash || item?.on_chain_record?.block_hash || null,
    verification: null,
  };
}

async function fetchJson(path, init) {
  const response = await fetch(path, init);
  const payload = await response.json();

  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.detail || payload?.error || payload?.message || `Request failed with ${response.status}`);
  }

  return payload;
}

async function verifyTransaction(txHash) {
  return fetchJson(`/api/backend/blockchain/verify-transaction?tx_hash=${encodeURIComponent(txHash)}`, {
    method: 'POST',
  });
}

function buildStats(trades) {
  const uniqueTraders = new Set(trades.map((trade) => String(trade.trader || '').toLowerCase()).filter(Boolean));
  const totalVolume = trades.reduce((sum, trade) => sum + Number(trade.amount || 0), 0);

  return {
    totalTrades: trades.length,
    totalVolume: Number(totalVolume.toFixed(2)),
    uniqueTraders: uniqueTraders.size,
    latestTrade: trades[0]?.timestamp || null,
  };
}

export default function TradeHistoryPage() {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [refreshNote, setRefreshNote] = useState(null);
  const [stats, setStats] = useState({
    totalTrades: 0,
    totalVolume: 0,
    uniqueTraders: 0,
    latestTrade: null,
  });
  const [filter, setFilter] = useState('all');
  const [networkLabel, setNetworkLabel] = useState('Execution review feed');
  const [tokenSymbol, setTokenSymbol] = useState(DEFAULT_TOKEN_SYMBOL);

  useEffect(() => {
    fetchTrades();
  }, []);

  const applySnapshot = (snapshot) => {
    setTrades(snapshot.trades || []);
    setStats(
      snapshot.stats || {
        totalTrades: 0,
        totalVolume: 0,
        uniqueTraders: 0,
        latestTrade: null,
      }
    );
    setNetworkLabel(snapshot.networkLabel || 'Execution review feed');
    setTokenSymbol(snapshot.tokenSymbol || DEFAULT_TOKEN_SYMBOL);
  };

  const fetchTrades = async () => {
    const cached = cache.get(HISTORY_CACHE_KEY);

    if (cached) {
      applySnapshot(cached);
      setLoading(false);
      setRefreshing(true);
      setRefreshNote('Showing the current cached review while live execution history refreshes.');
    } else {
      setLoading(true);
      setRefreshing(false);
      setRefreshNote(null);
    }

    setError(null);

    try {
      const [historyPayload, blockchainPayload] = await Promise.allSettled([
        fetchJson('/api/backend/trades/history?limit=50'),
        fetchJson('/api/backend/blockchain/status'),
      ]);

      if (historyPayload.status !== 'fulfilled') {
        throw historyPayload.reason;
      }

      const baseTrades = (historyPayload.value?.data || []).map(normalizeTrade);
      const txHashes = Array.from(new Set(baseTrades.map((trade) => trade.txHash).filter(Boolean))).slice(0, 12);
      const verificationResults = await Promise.allSettled(txHashes.map((txHash) => verifyTransaction(txHash)));
      const verificationMap = new Map();

      txHashes.forEach((txHash, index) => {
        const result = verificationResults[index];
        if (result?.status === 'fulfilled') {
          verificationMap.set(txHash, result.value?.data || null);
        }
      });

      const enrichedTrades = baseTrades.map((trade) => ({
        ...trade,
        verification: trade.txHash ? verificationMap.get(trade.txHash) || null : null,
      }));
      const nextStats = buildStats(enrichedTrades);

      let nextNetworkLabel = 'Execution review feed';
      let nextTokenSymbol = DEFAULT_TOKEN_SYMBOL;

      if (blockchainPayload.status === 'fulfilled') {
        const blockchainConfig = resolveBlockchainConfig(blockchainPayload.value);
        nextNetworkLabel = blockchainConfig.network?.chainName || nextNetworkLabel;
        nextTokenSymbol = blockchainConfig.token?.symbol || nextTokenSymbol;
      }

      setTrades(enrichedTrades);
      setStats(nextStats);
      setNetworkLabel(nextNetworkLabel);
      setTokenSymbol(nextTokenSymbol);
      setRefreshing(false);
      setRefreshNote(null);
      cache.set(
        HISTORY_CACHE_KEY,
        {
          trades: enrichedTrades,
          stats: nextStats,
          networkLabel: nextNetworkLabel,
          tokenSymbol: nextTokenSymbol,
        },
        30
      );
      setLoading(false);
    } catch (requestError) {
      console.error('Error fetching trades:', requestError);
      if (cached) {
        setRefreshing(false);
        setRefreshNote(
          `Cached execution review remains visible while live history reconnects. ${requestError.message}`
        );
        setError(null);
      } else {
        setError(requestError.message);
      }
      setLoading(false);
    }
  };

  const filteredTrades = useMemo(() => {
    if (filter === 'all') {
      return trades;
    }

    return trades.filter((trade) => trade.tradeType.toLowerCase() === filter);
  }, [filter, trades]);

  const buyCount = trades.filter((trade) => trade.tradeType.toLowerCase() === 'buy').length;
  const sellCount = trades.filter((trade) => trade.tradeType.toLowerCase() === 'sell').length;
  const holdCount = trades.filter((trade) => trade.tradeType.toLowerCase() === 'hold').length;

  return (
    <>
      <Head>
        <title>Trade History | AI Power Trade</title>
      </Head>

      <AppWorkspaceShell activeNav="history">
        <section className={workspaceStyles.hero}>
          <div className={workspaceStyles.eyebrow}>Execution Review</div>
          <h1 className={workspaceStyles.heroTitle}>Trade History</h1>
          <p className={workspaceStyles.heroSubtitle}>
            Review executed positions, track aggregate flow, and inspect available confirmation references
            across the current execution stream.
          </p>

          <div className={workspaceStyles.heroActions}>
            <Link href="/app?symbol=BTC" className={workspaceStyles.buttonPrimary}>
              Open Execution Workspace
            </Link>
            <Link href="/ai-explainer?symbol=BTC" className={workspaceStyles.buttonSecondary}>
              Open AI Explainer
            </Link>
          </div>
        </section>

        <section className={workspaceStyles.statsGrid}>
          <article className={workspaceStyles.statCard}>
            <div className={workspaceStyles.statLabel}>Total Executions</div>
            <div className={workspaceStyles.statValue}>{stats.totalTrades}</div>
            <p className={workspaceStyles.statCaption}>Loaded into the active review surface from recent execution history.</p>
          </article>
          <article className={workspaceStyles.statCard}>
            <div className={workspaceStyles.statLabel}>Total Volume</div>
            <div className={workspaceStyles.statValue}>{stats.totalVolume} {tokenSymbol}</div>
            <p className={workspaceStyles.statCaption}>Aggregate notional carried by the current execution stream.</p>
          </article>
          <article className={workspaceStyles.statCard}>
            <div className={workspaceStyles.statLabel}>Unique Accounts</div>
            <div className={workspaceStyles.statValue}>{stats.uniqueTraders}</div>
            <p className={workspaceStyles.statCaption}>Distinct accounts currently represented in the execution flow.</p>
          </article>
          <article className={workspaceStyles.statCard}>
            <div className={workspaceStyles.statLabel}>Latest Execution</div>
            <div className={workspaceStyles.statValue}>
              {stats.latestTrade ? getTimeSince(stats.latestTrade) : 'No data'}
            </div>
            <p className={workspaceStyles.statCaption}>Measured from the most recent execution returned by the review feed.</p>
          </article>
        </section>

        <section className={workspaceStyles.sectionPanel}>
          <div className={historyStyles.toolbar}>
            <div>
              <div className={workspaceStyles.sectionEyebrow}>Filters</div>
              <h2 className={workspaceStyles.sectionTitle}>Execution Stream</h2>
            </div>

            <div className={historyStyles.filterRail}>
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`${historyStyles.filterButton} ${filter === 'all' ? historyStyles.filterButtonActive : ''}`}
              >
                All ({trades.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('buy')}
                className={`${historyStyles.filterButton} ${filter === 'buy' ? historyStyles.filterButtonActive : ''}`}
              >
                Buy ({buyCount})
              </button>
              <button
                type="button"
                onClick={() => setFilter('sell')}
                className={`${historyStyles.filterButton} ${filter === 'sell' ? historyStyles.filterButtonActive : ''}`}
              >
                Sell ({sellCount})
              </button>
              <button
                type="button"
                onClick={() => setFilter('hold')}
                className={`${historyStyles.filterButton} ${filter === 'hold' ? historyStyles.filterButtonActive : ''}`}
              >
                Hold ({holdCount})
              </button>
            </div>
          </div>

          <p className={workspaceStyles.note}>
            Source: execution history plus runtime context. When a transaction hash exists, this page also
            checks for any available confirmation reference before rendering the last column. Active network
            context: {networkLabel}.
          </p>

          {(refreshing || refreshNote) && !loading ? (
            <div className={historyStyles.noticeBox}>
              <strong>{refreshing ? 'Refreshing live review...' : 'Cached review active.'}</strong>
              <div className={historyStyles.muted}>
                {refreshing
                  ? 'Checking for newer executions and updated references.'
                  : refreshNote}
              </div>
            </div>
          ) : null}

          {loading ? (
            <div className={`${workspaceStyles.sectionPanel} ${historyStyles.statusCard}`}>
              <div>
                <div className={historyStyles.spinner} />
                <h3 className={historyStyles.statusTitle}>Fetching recent executions...</h3>
                <p className={historyStyles.muted}>Refreshing execution history, runtime context, and any available references.</p>
              </div>
            </div>
          ) : null}

          {!loading && error ? (
            <div className={historyStyles.errorBox}>
              <strong>Unable to load recent executions.</strong>
              <div className={historyStyles.muted}>{error}</div>
              <div className={historyStyles.statusActions}>
                <button type="button" onClick={fetchTrades} className={historyStyles.buttonPrimary}>
                  Try Again
                </button>
                <Link href="/app?symbol=BTC" className={historyStyles.buttonSecondary}>
                  Open App
                </Link>
              </div>
            </div>
          ) : null}

          {!loading && !error ? (
            <div className={historyStyles.tableShell}>
              {filteredTrades.length === 0 ? (
                <div className={historyStyles.statusCard}>
                  <div>
                    <h3 className={historyStyles.statusTitle}>No executions found for this filter.</h3>
                    <p className={historyStyles.muted}>
                      Try another trade type or execute a new setup to populate recent history.
                    </p>
                    <div className={historyStyles.statusActions}>
                      <Link href="/app?symbol=BTC" className={historyStyles.buttonPrimary}>
                        Open BTC Workspace
                      </Link>
                      <Link href="/ai-explainer?symbol=BTC" className={historyStyles.buttonSecondary}>
                        Open BTC Explainer
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={historyStyles.tableWrap}>
                  <table className={historyStyles.table}>
                    <thead>
                      <tr>
                        <th>Execution ID</th>
                        <th>Time</th>
                        <th>Account</th>
                        <th>Asset</th>
                        <th>Type</th>
                        <th>Amount</th>
                        <th>PnL</th>
                        <th>Status</th>
                        <th>Reference</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTrades.map((trade) => (
                        <tr key={trade.tradeId}>
                          <td>
                            <span className={historyStyles.tradeId}>#{trade.tradeId}</span>
                          </td>
                          <td>
                            <span className={historyStyles.muted}>
                              {new Date(trade.timestamp).toLocaleString()}
                            </span>
                            <span className={historyStyles.timeAgo}>{getTimeSince(trade.timestamp)}</span>
                          </td>
                          <td>
                            <span className={historyStyles.address}>
                              {String(trade.trader || '').startsWith('0x') ? shortenAddress(trade.trader) : trade.trader}
                            </span>
                          </td>
                          <td>
                            <span className={historyStyles.tradeId}>{trade.symbol}</span>
                          </td>
                          <td>
                            <span className={`${historyStyles.badge} ${getTradeTone(trade.tradeType)}`}>
                              {trade.tradeType}
                            </span>
                          </td>
                          <td>
                            <span className={historyStyles.amount}>{trade.amount.toFixed(2)} {tokenSymbol}</span>
                          </td>
                          <td>
                            <span className={historyStyles.amount} style={{ color: Number(trade.pnl || 0) >= 0 ? 'var(--color-emerald)' : 'var(--color-bearish)' }}>
                              {formatSignedAmount(trade.pnl)} {tokenSymbol}
                            </span>
                          </td>
                          <td>
                            <span className={`${historyStyles.badge} ${getStatusTone(trade.status)}`}>
                              {trade.status}
                            </span>
                          </td>
                          <td>
                            {trade.txHash ? (
                              <div className={historyStyles.verificationStack}>
                                <span className={historyStyles.explorerLink}>
                                  {trade.verification?.transaction_hash ? 'Confirmed' : 'Captured'}
                                </span>
                                <span className={historyStyles.muted}>{shortenAddress(trade.txHash)}</span>
                              </div>
                            ) : trade.recordHash ? (
                              <div className={historyStyles.verificationStack}>
                                <span className={historyStyles.explorerLink}>Reference</span>
                                <span className={historyStyles.muted}>{shortenAddress(trade.recordHash)}</span>
                              </div>
                            ) : (
                              <span className={historyStyles.muted}>Captured</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : null}
        </section>
      </AppWorkspaceShell>
    </>
  );
}
