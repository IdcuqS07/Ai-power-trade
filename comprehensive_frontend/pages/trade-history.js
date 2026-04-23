import { useState, useEffect } from 'react';
import { cache } from '../utils/cache';
import Head from 'next/head';

const CONTRACT_ADDRESS = '0xA2E0F4A542b700f437c27Ce28B31499023d9a53A';
const RPC_URLS = [
  'https://rpc-amoy.polygon.technology/',
  'https://polygon-amoy.drpc.org',
  'https://polygon-amoy-bor-rpc.publicnode.com'
];
const EXPLORER_URL = 'https://amoy.polygonscan.com';
const TRADE_EXECUTED_TOPIC = '0x26fd4a093df4754ac881e791536e2d75dfd4589d79cd8f473f050683b7916f77';

export default function TradeHistoryPage() {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalTrades: 0,
    totalVolume: 0,
    uniqueTraders: 0,
    latestTrade: null
  });
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchTrades();
  }, []);

  const fetchTrades = async () => {
    // Check cache first
    const cacheKey = 'polygon_trades';
    const cached = cache.get(cacheKey);
    
    if (cached) {
      console.log('📦 Loading trades from cache...');
      setTrades(cached.trades);
      setStats(cached.stats);
      setLoading(false);
      return;
    }

    console.log('🔄 Fetching fresh trades from blockchain...');
    setLoading(true);
    setError(null);

    try {
      let logs = null;
      let lastError = null;

      for (let i = 0; i < RPC_URLS.length; i++) {
        try {
          const rpcUrl = RPC_URLS[i];
          console.log('Trying RPC ' + (i + 1) + '/' + RPC_URLS.length + ': ' + rpcUrl);

          const blockResponse = await fetch(rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 1,
              method: 'eth_blockNumber',
              params: []
            })
          });
          const blockData = await blockResponse.json();
          if (blockData.error) throw new Error(blockData.error.message);
          
          const blockNumber = parseInt(blockData.result, 16);
          const fromBlock = blockNumber > 100000 ? blockNumber - 100000 : 0;
          
          console.log('Fetching from block ' + fromBlock + ' to ' + blockNumber + '...');

          const logsResponse = await fetch(rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 2,
              method: 'eth_getLogs',
              params: [{
                address: CONTRACT_ADDRESS,
                topics: [TRADE_EXECUTED_TOPIC],
                fromBlock: '0x' + fromBlock.toString(16),
                toBlock: 'latest'
              }]
            })
          });
          const logsData = await logsResponse.json();
          if (logsData.error) throw new Error(logsData.error.message);
          
          logs = logsData.result;
          console.log('Found ' + logs.length + ' trades');
          break;
        } catch (err) {
          console.error('RPC ' + (i + 1) + ' failed:', err);
          lastError = err;
          if (i === RPC_URLS.length - 1) throw lastError;
        }
      }

      if (!logs || logs.length === 0) {
        setTrades([]);
        setLoading(false);
        return;
      }

      const decodedTrades = [];
      const traders = new Set();
      let totalVolume = 0;

      for (const log of logs) {
        try {
          const tradeId = parseInt(log.topics[1], 16);
          const trader = '0x' + log.topics[2].slice(26);
          
          const data = log.data.slice(2);
          
          const amountHex = data.slice(128, 192);
          const amountWei = parseInt(amountHex, 16);
          const amount = amountWei / 1e18;
          
          const timestampHex = data.slice(192, 256);
          const timestamp = parseInt(timestampHex, 16);
          
          const symbolLenHex = data.slice(256, 320);
          const symbolLen = parseInt(symbolLenHex, 16);
          const symbolHex = data.slice(320, 320 + symbolLen * 2);
          let symbol = '';
          for (let i = 0; i < symbolHex.length; i += 2) {
            const code = parseInt(symbolHex.substr(i, 2), 16);
            if (code !== 0) symbol += String.fromCharCode(code);
          }
          
          const tradeTypeLenHex = data.slice(384, 448);
          const tradeTypeLen = parseInt(tradeTypeLenHex, 16);
          const tradeTypeHex = data.slice(448, 448 + tradeTypeLen * 2);
          let tradeType = '';
          for (let i = 0; i < tradeTypeHex.length; i += 2) {
            const code = parseInt(tradeTypeHex.substr(i, 2), 16);
            if (code !== 0) tradeType += String.fromCharCode(code);
          }

          traders.add(trader);
          totalVolume += amount;

          decodedTrades.push({
            tradeId,
            trader,
            symbol,
            tradeType,
            amount,
            timestamp,
            txHash: log.transactionHash,
            blockNumber: parseInt(log.blockNumber, 16)
          });
        } catch (err) {
          console.error('Error decoding log:', err);
        }
      }

      decodedTrades.sort((a, b) => b.tradeId - a.tradeId);

      setTrades(decodedTrades);
      setStats({
        totalTrades: decodedTrades.length,
        totalVolume: totalVolume.toFixed(2),
        uniqueTraders: traders.size,
        latestTrade: decodedTrades.length > 0 ? decodedTrades[0].timestamp : null
      });
      
      // Cache for 30 seconds
      cache.set(cacheKey, { 
        trades: decodedTrades, 
        stats: {
          totalTrades: decodedTrades.length,
          totalVolume: totalVolume.toFixed(2),
          uniqueTraders: traders.size,
          latestTrade: decodedTrades.length > 0 ? decodedTrades[0].timestamp : null
        }
      }, 30);
      console.log('✅ Trades cached for 30 seconds');
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching trades:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const filteredTrades = trades.filter(trade => {
    if (filter === 'all') return true;
    return trade.tradeType.toLowerCase() === filter;
  });

  const getTimeSince = (timestamp) => {
    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;
    
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <>
      <Head>
        <title>Trade History - AI Power Trade</title>
      </Head>

      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>📊 Trade History</h1>
          <p style={styles.subtitle}>All trades executed on Polygon Amoy blockchain</p>
        </div>

        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Total Trades</div>
            <div style={styles.statValue}>{stats.totalTrades}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Total Volume</div>
            <div style={styles.statValue}>{stats.totalVolume} atUSDT</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Unique Traders</div>
            <div style={styles.statValue}>{stats.uniqueTraders}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Latest Trade</div>
            <div style={styles.statValue}>
              {stats.latestTrade ? getTimeSince(stats.latestTrade) : '-'}
            </div>
          </div>
        </div>

        <div style={styles.filterContainer}>
          <button
            style={filter === 'all' ? styles.filterButtonActive : styles.filterButton}
            onClick={() => setFilter('all')}
          >
            All ({trades.length})
          </button>
          <button
            style={filter === 'buy' ? styles.filterButtonActive : styles.filterButton}
            onClick={() => setFilter('buy')}
          >
            Buy ({trades.filter(t => t.tradeType.toLowerCase() === 'buy').length})
          </button>
          <button
            style={filter === 'sell' ? styles.filterButtonActive : styles.filterButton}
            onClick={() => setFilter('sell')}
          >
            Sell ({trades.filter(t => t.tradeType.toLowerCase() === 'sell').length})
          </button>
          <button
            style={filter === 'hold' ? styles.filterButtonActive : styles.filterButton}
            onClick={() => setFilter('hold')}
          >
            Hold ({trades.filter(t => t.tradeType.toLowerCase() === 'hold').length})
          </button>
        </div>

        {loading && (
          <div style={styles.loading}>
            <div style={styles.spinner}></div>
            <p>Fetching trades from blockchain...</p>
          </div>
        )}

        {error && (
          <div style={styles.error}>
            <strong>Error!</strong><br />
            {error}
            <button style={styles.retryButton} onClick={fetchTrades}>
              Retry
            </button>
          </div>
        )}

        {!loading && !error && (
          <div style={styles.tableContainer}>
            {filteredTrades.length === 0 ? (
              <div style={styles.noTrades}>
                <p>No trades found</p>
              </div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Trade ID</th>
                    <th style={styles.th}>Time</th>
                    <th style={styles.th}>Trader</th>
                    <th style={styles.th}>Symbol</th>
                    <th style={styles.th}>Type</th>
                    <th style={styles.th}>Amount</th>
                    <th style={styles.th}>Transaction</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTrades.map((trade) => (
                    <tr key={trade.tradeId} style={styles.tr}>
                      <td style={styles.td}>
                        <strong>#{trade.tradeId}</strong>
                      </td>
                      <td style={styles.td}>
                        {new Date(trade.timestamp * 1000).toLocaleString()}
                        <br />
                        <small style={styles.timeAgo}>{getTimeSince(trade.timestamp)}</small>
                      </td>
                      <td style={styles.td}>
                        <code style={styles.address}>
                          {trade.trader.slice(0, 6)}...{trade.trader.slice(-4)}
                        </code>
                      </td>
                      <td style={styles.td}>
                        <strong>{trade.symbol}</strong>
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.badge,
                          ...(trade.tradeType.toLowerCase() === 'buy' ? styles.badgeBuy :
                              trade.tradeType.toLowerCase() === 'sell' ? styles.badgeSell :
                              styles.badgeHold)
                        }}>
                          {trade.tradeType}
                        </span>
                      </td>
                      <td style={styles.td}>
                        {trade.amount.toFixed(2)} atUSDT
                      </td>
                      <td style={styles.td}>
                        <a
                          href={`${EXPLORER_URL}/tx/${trade.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={styles.link}
                        >
                          {trade.txHash.slice(0, 8)}...
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </>
  );
}

const styles = {
  container: { 
    maxWidth: '1400px', 
    margin: '0 auto', 
    padding: '20px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    minHeight: '100vh'
  },
  header: { marginBottom: '30px', textAlign: 'center' },
  title: { fontSize: '2.5em', color: 'white', marginBottom: '10px', textShadow: '2px 2px 4px rgba(0,0,0,0.2)' },
  subtitle: { color: 'rgba(255,255,255,0.9)', fontSize: '1.1em' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' },
  statCard: { 
    background: 'rgba(255, 255, 255, 0.95)', 
    color: '#333', 
    padding: '25px', 
    borderRadius: '15px', 
    boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
    border: '2px solid rgba(255,255,255,0.3)'
  },
  statLabel: { fontSize: '0.9em', color: '#666', marginBottom: '8px', fontWeight: '500' },
  statValue: { fontSize: '2em', fontWeight: 'bold', color: '#667eea' },
  filterContainer: { display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' },
  filterButton: { 
    padding: '10px 20px', 
    border: '2px solid white', 
    background: 'rgba(255,255,255,0.2)', 
    color: 'white', 
    borderRadius: '25px', 
    cursor: 'pointer', 
    fontWeight: '600', 
    transition: 'all 0.3s',
    backdropFilter: 'blur(10px)'
  },
  filterButtonActive: { 
    padding: '10px 20px', 
    border: '2px solid white', 
    background: 'white', 
    color: '#667eea', 
    borderRadius: '25px', 
    cursor: 'pointer', 
    fontWeight: '600', 
    transition: 'all 0.3s',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
  },
  loading: { textAlign: 'center', padding: '60px 20px', color: 'white' },
  spinner: { border: '4px solid rgba(255,255,255,0.3)', borderTop: '4px solid white', borderRadius: '50%', width: '50px', height: '50px', animation: 'spin 1s linear infinite', margin: '0 auto 20px' },
  error: { background: 'rgba(248, 215, 218, 0.95)', color: '#721c24', padding: '20px', borderRadius: '10px', marginBottom: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' },
  retryButton: { marginTop: '10px', padding: '8px 16px', background: '#721c24', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' },
  tableContainer: { 
    background: 'white', 
    borderRadius: '15px', 
    boxShadow: '0 8px 25px rgba(0,0,0,0.3)', 
    overflow: 'hidden',
    border: '2px solid rgba(255,255,255,0.3)'
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { 
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
    color: 'white', 
    padding: '18px 15px', 
    textAlign: 'left', 
    fontWeight: '600',
    fontSize: '0.95em',
    letterSpacing: '0.5px'
  },
  tr: { borderBottom: '1px solid #eee', transition: 'background 0.2s' },
  td: { 
    padding: '15px', 
    color: '#333',
    fontSize: '0.95em'
  },
  badge: { padding: '6px 14px', borderRadius: '20px', fontSize: '0.85em', fontWeight: '600', display: 'inline-block' },
  badgeBuy: { background: '#d4edda', color: '#155724', border: '1px solid #c3e6cb' },
  badgeSell: { background: '#f8d7da', color: '#721c24', border: '1px solid #f5c6cb' },
  badgeHold: { background: '#d1ecf1', color: '#0c5460', border: '1px solid #bee5eb' },
  address: { 
    background: '#f5f5f5', 
    padding: '5px 10px', 
    borderRadius: '6px', 
    fontSize: '0.9em',
    color: '#555',
    fontFamily: 'monospace',
    border: '1px solid #ddd'
  },
  link: { color: '#667eea', textDecoration: 'none', fontWeight: '600', borderBottom: '2px solid transparent', transition: 'border-color 0.2s' },
  timeAgo: { color: '#999', fontSize: '0.85em', display: 'block', marginTop: '4px' },
  noTrades: { textAlign: 'center', padding: '60px 20px', color: '#999' }
};
