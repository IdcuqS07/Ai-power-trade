import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FaBitcoin, FaRobot, FaChartLine, FaShieldAlt, FaCog, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trades, setTrades] = useState([]);
  const [onChainRecords, setOnChainRecords] = useState([]);
  const [validations, setValidations] = useState([]);
  const [executeLoading, setExecuteLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get(`${API}/analytics/dashboard`);
      if (response.data.success) {
        setDashboardData(response.data.data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      setLoading(false);
    }
  };

  const fetchTrades = async () => {
    try {
      const response = await axios.get(`${API}/trades/history?limit=20`);
      if (response.data.success) {
        setTrades(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching trades:', error);
    }
  };

  const fetchOnChainRecords = async () => {
    try {
      const response = await axios.get(`${API}/smartcontract/records?limit=20`);
      if (response.data.success) {
        setOnChainRecords(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching on-chain records:', error);
    }
  };

  const fetchValidations = async () => {
    try {
      const response = await axios.get(`${API}/smartcontract/validations?limit=20`);
      if (response.data.success) {
        setValidations(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching validations:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'trading') {
      fetchTrades();
    } else if (activeTab === 'smartcontract') {
      fetchOnChainRecords();
      fetchValidations();
    }
  }, [activeTab]);

  const executeTrade = async (symbol) => {
    setExecuteLoading(true);
    try {
      const response = await axios.post(`${API}/trades/execute`, {
        symbol: symbol,
        force_execute: false
      });
      
      if (response.data.success) {
        showNotification('success', `Trade executed successfully for ${symbol}!`);
        fetchDashboardData();
        fetchTrades();
      } else {
        showNotification('error', response.data.message || 'Trade execution failed');
      }
    } catch (error) {
      showNotification('error', 'Error executing trade: ' + error.message);
    }
    setExecuteLoading(false);
  };

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white" data-testid="app-container">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FaBitcoin className="text-4xl text-yellow-500" />
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-purple-500 bg-clip-text text-transparent" data-testid="app-title">
                  AI Trading SmartContract 2.0
                </h1>
                <p className="text-sm text-gray-400">Automated Trading with Blockchain Validation</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-green-500/20 px-4 py-2 rounded-lg border border-green-500/30">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium">Live</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Notification */}
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`fixed top-20 right-6 z-50 px-6 py-4 rounded-lg shadow-2xl ${
            notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          }`}
        >
          <div className="flex items-center space-x-3">
            {notification.type === 'success' ? <FaCheckCircle className="text-2xl" /> : <FaExclamationTriangle className="text-2xl" />}
            <p className="font-medium">{notification.message}</p>
          </div>
        </motion.div>
      )}

      {/* Navigation Tabs */}
      <nav className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-6">
          <div className="flex space-x-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: FaChartLine },
              { id: 'trading', label: 'Trading', icon: FaBitcoin },
              { id: 'smartcontract', label: 'Smart Contract', icon: FaShieldAlt },
              { id: 'analytics', label: 'Analytics', icon: FaCog }
            ].map(tab => (
              <button
                key={tab.id}
                data-testid={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-4 transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white border-b-2 border-blue-400'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <tab.icon />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {activeTab === 'dashboard' && <DashboardTab data={dashboardData} />}
        {activeTab === 'trading' && <TradingTab data={dashboardData} trades={trades} executeTrade={executeTrade} loading={executeLoading} />}
        {activeTab === 'smartcontract' && <SmartContractTab data={dashboardData} records={onChainRecords} validations={validations} />}
        {activeTab === 'analytics' && <AnalyticsTab data={dashboardData} />}
      </main>
    </div>
  );
}

// Dashboard Tab Component
function DashboardTab({ data }) {
  if (!data) return <LoadingState />;

  const { prices, portfolio, current_signal, performance, smart_contract, oracle } = data;

  return (
    <div className="space-y-6" data-testid="dashboard-tab">
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Portfolio Value"
          value={`$${portfolio.total_value.toLocaleString()}`}
          change={portfolio.profit_loss_pct}
          icon={FaChartLine}
          color="blue"
        />
        <StatCard
          title="Total Profit/Loss"
          value={`$${portfolio.profit_loss.toFixed(2)}`}
          change={portfolio.profit_loss_pct}
          icon={FaBitcoin}
          color={portfolio.profit_loss >= 0 ? 'green' : 'red'}
        />
        <StatCard
          title="Active Positions"
          value={portfolio.positions_count}
          subtitle={`${performance.total_trades} total trades`}
          icon={FaRobot}
          color="purple"
        />
        <StatCard
          title="Win Rate"
          value={`${performance.win_rate}%`}
          subtitle={`${performance.winning_trades}/${performance.total_trades} wins`}
          icon={FaShieldAlt}
          color="green"
        />
      </div>

      {/* Market Prices */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
        <h2 className="text-2xl font-bold mb-6 flex items-center space-x-2">
          <FaBitcoin className="text-yellow-500" />
          <span>Live Market Prices</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(prices).map(([symbol, data]) => (
            <PriceCard key={symbol} symbol={symbol} data={data} />
          ))}
        </div>
      </div>

      {/* AI Prediction */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
          <h2 className="text-2xl font-bold mb-6 flex items-center space-x-2">
            <FaRobot className="text-blue-500" />
            <span>AI Prediction</span>
          </h2>
          <AISignalPanel signal={current_signal} />
        </div>

        {/* System Status */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
          <h2 className="text-2xl font-bold mb-6 flex items-center space-x-2">
            <FaShieldAlt className="text-green-500" />
            <span>System Status</span>
          </h2>
          <div className="space-y-4">
            <StatusItem label="Smart Contract" value="Active" status="success" />
            <StatusItem label="Oracle Service" value={`${oracle.verification_rate}% verified`} status="success" />
            <StatusItem label="Validation Pass Rate" value={`${smart_contract.validation_pass_rate}%`} status="success" />
            <StatusItem label="On-Chain Records" value={smart_contract.total_on_chain_records} status="info" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Trading Tab Component
function TradingTab({ data, trades, executeTrade, loading }) {
  if (!data) return <LoadingState />;

  return (
    <div className="space-y-6" data-testid="trading-tab">
      {/* Trading Signals */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
        <h2 className="text-2xl font-bold mb-6">Live Trading Signals</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(data.prices).map(([symbol, priceData]) => (
            <TradingSignalCard
              key={symbol}
              symbol={symbol}
              price={priceData.price}
              executeTrade={executeTrade}
              loading={loading}
            />
          ))}
        </div>
      </div>

      {/* Trade History */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
        <h2 className="text-2xl font-bold mb-6">Trade History</h2>
        {trades.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No trades yet. Execute your first trade above!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-white/20">
                  <th className="pb-3">Symbol</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Quantity</th>
                  <th className="pb-3">Price</th>
                  <th className="pb-3">Value</th>
                  <th className="pb-3">P&L</th>
                  <th className="pb-3">Time</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((trade, index) => (
                  <tr key={index} className="border-b border-white/10 hover:bg-white/5">
                    <td className="py-3 font-bold">{trade.symbol}</td>
                    <td className="py-3">
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        trade.type === 'BUY' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {trade.type}
                      </span>
                    </td>
                    <td className="py-3">{trade.quantity.toFixed(6)}</td>
                    <td className="py-3">${trade.price.toFixed(2)}</td>
                    <td className="py-3">${trade.value.toFixed(2)}</td>
                    <td className="py-3">
                      {trade.profit_loss ? (
                        <span className={trade.profit_loss >= 0 ? 'text-green-400' : 'text-red-400'}>
                          ${trade.profit_loss.toFixed(2)}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="py-3 text-sm text-gray-400">
                      {new Date(trade.timestamp).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// Smart Contract Tab Component  
function SmartContractTab({ data, records, validations }) {
  if (!data) return <LoadingState />;

  return (
    <div className="space-y-6" data-testid="smartcontract-tab">
      {/* Contract Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total Validations"
          value={data.smart_contract.total_validations}
          subtitle={`${data.smart_contract.validation_pass_rate}% passed`}
          icon={FaShieldAlt}
          color="blue"
        />
        <StatCard
          title="On-Chain Records"
          value={data.smart_contract.total_on_chain_records}
          subtitle="Immutable records"
          icon={FaChartLine}
          color="green"
        />
        <StatCard
          title="Settlements"
          value={data.smart_contract.total_settlements}
          subtitle="Auto-settled trades"
          icon={FaCog}
          color="purple"
        />
        <StatCard
          title="Oracle Verification"
          value={`${data.oracle.verification_rate}%`}
          subtitle="Data integrity"
          icon={FaCheckCircle}
          color="cyan"
        />
      </div>

      {/* On-Chain Records */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
        <h2 className="text-2xl font-bold mb-6">On-Chain Trading Records</h2>
        {records.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No on-chain records yet</p>
        ) : (
          <div className="space-y-3">
            {records.map((record, index) => (
              <div key={index} className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="font-bold text-lg">{record.symbol}</span>
                      <span className={`px-3 py-1 rounded-full text-xs ${
                        record.type === 'BUY' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {record.type}
                      </span>
                      <span className="text-sm text-gray-400">Block #{record.block_number}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Quantity:</span> {record.quantity}
                      </div>
                      <div>
                        <span className="text-gray-400">Price:</span> ${record.price}
                      </div>
                      <div>
                        <span className="text-gray-400">Value:</span> ${record.value}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 font-mono">
                    {record.block_hash.substring(0, 16)}...
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Validations */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
        <h2 className="text-2xl font-bold mb-6">Validation History</h2>
        {validations.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No validations yet</p>
        ) : (
          <div className="space-y-3">
            {validations.map((validation, index) => (
              <div key={index} className={`rounded-lg p-4 ${
                validation.is_valid ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {validation.is_valid ? (
                      <FaCheckCircle className="text-green-400 text-xl" />
                    ) : (
                      <FaExclamationTriangle className="text-red-400 text-xl" />
                    )}
                    <span className="font-bold">{validation.signal}</span>
                    <span className="text-sm text-gray-400">Confidence: {(validation.confidence * 100).toFixed(1)}%</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs ${
                    validation.is_valid ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {validation.is_valid ? 'PASSED' : 'FAILED'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {validation.validations.map((v, i) => (
                    <div key={i} className="flex items-center space-x-2">
                      <span className={v.passed ? 'text-green-400' : 'text-red-400'}>●</span>
                      <span className="text-gray-300">{v.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Analytics Tab Component
function AnalyticsTab({ data }) {
  if (!data) return <LoadingState />;

  const { performance } = data;

  return (
    <div className="space-y-6" data-testid="analytics-tab">
      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Trades"
          value={performance.total_trades}
          subtitle={`${performance.winning_trades} wins / ${performance.losing_trades} losses`}
          icon={FaChartLine}
          color="blue"
        />
        <StatCard
          title="Profit Factor"
          value={performance.profit_factor.toFixed(2)}
          subtitle={`Total profit: $${performance.total_profit.toFixed(2)}`}
          icon={FaBitcoin}
          color="green"
        />
        <StatCard
          title="Average Profit"
          value={`$${performance.avg_profit.toFixed(2)}`}
          subtitle={`Avg loss: $${performance.avg_loss.toFixed(2)}`}
          icon={FaCog}
          color="purple"
        />
      </div>

      {/* Performance Chart */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
        <h2 className="text-2xl font-bold mb-6">Performance Overview</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[
              { name: 'Wins', value: performance.winning_trades },
              { name: 'Losses', value: performance.losing_trades },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" stroke="#fff" />
              <YAxis stroke="#fff" />
              <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: 'none', borderRadius: '8px' }} />
              <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Risk Limits */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
        <h2 className="text-2xl font-bold mb-6">Risk Management Limits</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <RiskLimitCard
            label="Max Position Size"
            value={`${data.smart_contract.risk_limits.max_position_size_pct}%`}
            description="Maximum allocation per position"
          />
          <RiskLimitCard
            label="Max Daily Loss"
            value={`${data.smart_contract.risk_limits.max_daily_loss_pct}%`}
            description="Daily loss limit threshold"
          />
          <RiskLimitCard
            label="Min Confidence"
            value={`${(data.smart_contract.risk_limits.min_confidence * 100).toFixed(0)}%`}
            description="Minimum AI confidence required"
          />
        </div>
      </div>
    </div>
  );
}

// Helper Components
function StatCard({ title, value, change, subtitle, icon: Icon, color }) {
  const colors = {
    blue: 'from-blue-500 to-cyan-500',
    green: 'from-green-500 to-emerald-500',
    red: 'from-red-500 to-pink-500',
    purple: 'from-purple-500 to-pink-500',
    cyan: 'from-cyan-500 to-blue-500'
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-white/40 transition-all"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-gray-400 text-sm font-medium">{title}</span>
        <div className={`bg-gradient-to-br ${colors[color]} p-3 rounded-lg`}>
          <Icon className="text-xl" />
        </div>
      </div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      {change !== undefined && (
        <div className={`text-sm flex items-center space-x-1 ${
          change >= 0 ? 'text-green-400' : 'text-red-400'
        }`}>
          <span>{change >= 0 ? '↑' : '↓'}</span>
          <span>{Math.abs(change).toFixed(2)}%</span>
        </div>
      )}
      {subtitle && <div className="text-sm text-gray-400 mt-1">{subtitle}</div>}
    </motion.div>
  );
}

function PriceCard({ symbol, data }) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:border-white/40 transition-all"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-lg font-bold">{symbol}</span>
        <span className={`text-sm px-2 py-1 rounded ${
          data.change_24h >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
        }`}>
          {data.change_24h >= 0 ? '+' : ''}{data.change_24h}%
        </span>
      </div>
      <div className="text-2xl font-bold mb-1">${data.price.toLocaleString()}</div>
      <div className="text-xs text-gray-400 space-y-1">
        <div>H: ${data.high_24h.toLocaleString()}</div>
        <div>L: ${data.low_24h.toLocaleString()}</div>
      </div>
    </motion.div>
  );
}

function AISignalPanel({ signal }) {
  const signalColors = {
    BUY: 'from-green-500 to-emerald-500',
    SELL: 'from-red-500 to-pink-500',
    HOLD: 'from-gray-500 to-gray-600'
  };

  return (
    <div className="space-y-4">
      <div className={`bg-gradient-to-br ${signalColors[signal.signal]} p-6 rounded-xl`}>
        <div className="text-3xl font-bold mb-2">{signal.signal}</div>
        <div className="text-lg">Confidence: {(signal.confidence * 100).toFixed(1)}%</div>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Risk Score</span>
          <span className="font-bold">{signal.risk_score}/100</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Position Size</span>
          <span className="font-bold">{signal.position_size}%</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Target Price</span>
          <span className="font-bold">${signal.price_prediction.target_price}</span>
        </div>
      </div>

      <div className="pt-4 border-t border-white/10">
        <p className="text-sm text-gray-300">{signal.reasoning}</p>
      </div>
    </div>
  );
}

function TradingSignalCard({ symbol, price, executeTrade, loading }) {
  const [prediction, setPrediction] = useState(null);
  const [loadingPrediction, setLoadingPrediction] = useState(false);

  useEffect(() => {
    fetchPrediction();
  }, [symbol]);

  const fetchPrediction = async () => {
    setLoadingPrediction(true);
    try {
      const response = await axios.get(`${API}/predictions/current/${symbol}`);
      if (response.data.success) {
        setPrediction(response.data.prediction);
      }
    } catch (error) {
      console.error('Error fetching prediction:', error);
    }
    setLoadingPrediction(false);
  };

  if (loadingPrediction || !prediction) {
    return <div className="bg-white/5 rounded-xl p-6 animate-pulse h-48" />;
  }

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:border-white/40 transition-all">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold">{symbol}</h3>
          <p className="text-2xl font-bold text-blue-400">${price}</p>
        </div>
        <div className={`text-2xl font-bold px-4 py-2 rounded-lg ${
          prediction.signal === 'BUY' ? 'bg-green-500/20 text-green-400' :
          prediction.signal === 'SELL' ? 'bg-red-500/20 text-red-400' :
          'bg-gray-500/20 text-gray-400'
        }`}>
          {prediction.signal}
        </div>
      </div>

      <div className="space-y-2 mb-4 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">Confidence</span>
          <span className="font-bold">{(prediction.confidence * 100).toFixed(1)}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Risk Score</span>
          <span className={`font-bold ${
            prediction.risk_score > 70 ? 'text-red-400' :
            prediction.risk_score > 40 ? 'text-yellow-400' : 'text-green-400'
          }`}>{prediction.risk_score}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Position Size</span>
          <span className="font-bold">{prediction.position_size}%</span>
        </div>
      </div>

      <button
        data-testid={`execute-trade-${symbol}`}
        onClick={() => executeTrade(symbol)}
        disabled={loading || prediction.signal === 'HOLD'}
        className={`w-full py-3 rounded-lg font-bold transition-all ${
          prediction.signal === 'HOLD' || loading
            ? 'bg-gray-500/20 text-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {loading ? 'Executing...' : prediction.signal === 'HOLD' ? 'No Action' : `Execute ${prediction.signal}`}
      </button>
    </div>
  );
}

function StatusItem({ label, value, status }) {
  const colors = {
    success: 'text-green-400',
    warning: 'text-yellow-400',
    error: 'text-red-400',
    info: 'text-blue-400'
  };

  return (
    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
      <span className="text-gray-300">{label}</span>
      <span className={`font-bold ${colors[status]}`}>{value}</span>
    </div>
  );
}

function RiskLimitCard({ label, value, description }) {
  return (
    <div className="bg-white/5 rounded-xl p-6 border border-white/10">
      <div className="text-sm text-gray-400 mb-2">{label}</div>
      <div className="text-3xl font-bold mb-2">{value}</div>
      <div className="text-xs text-gray-500">{description}</div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-20">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
      />
    </div>
  );
}

export default App;
