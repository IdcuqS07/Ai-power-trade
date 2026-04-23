import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FaBitcoin, FaRobot, FaChartLine, FaShieldAlt } from 'react-icons/fa';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './App.css';

const API_BASE = 'http://localhost:8000/api';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trades, setTrades] = useState([]);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get(`${API_BASE}/dashboard`);
      if (response.data.success) {
        setDashboardData(response.data.data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  const fetchTrades = async () => {
    try {
      const response = await axios.get(`${API_BASE}/trades/history`);
      if (response.data.success) {
        setTrades(response.data.data);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const executeTrade = async (symbol) => {
    try {
      await axios.post(`${API_BASE}/trades/execute`, { symbol });
      fetchDashboardData();
      fetchTrades();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'trading') {
      fetchTrades();
    }
  }, [activeTab]);

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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center space-x-3">
            <FaBitcoin className="text-4xl text-yellow-500" />
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-purple-500 bg-clip-text text-transparent">
                Unified AI Trading Platform
              </h1>
              <p className="text-sm text-gray-400">Gabungan Ai-Trade & Backend Utama</p>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-6">
          <div className="flex space-x-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: FaChartLine },
              { id: 'trading', label: 'Trading', icon: FaBitcoin },
              { id: 'smartcontract', label: 'Smart Contract', icon: FaShieldAlt }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-4 transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <tab.icon />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="container mx-auto px-6 py-8">
        {activeTab === 'dashboard' && <DashboardTab data={dashboardData} />}
        {activeTab === 'trading' && <TradingTab data={dashboardData} trades={trades} executeTrade={executeTrade} />}
        {activeTab === 'smartcontract' && <SmartContractTab />}
      </main>
    </div>
  );
}

function DashboardTab({ data }) {
  if (!data) return <div>Loading...</div>;

  const { prices, portfolio, current_signal, performance } = data;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Portfolio Value"
          value={`$${portfolio.total_value.toLocaleString()}`}
          icon={FaChartLine}
          color="blue"
        />
        <StatCard
          title="P&L"
          value={`$${portfolio.profit_loss.toFixed(2)}`}
          icon={FaBitcoin}
          color={portfolio.profit_loss >= 0 ? 'green' : 'red'}
        />
        <StatCard
          title="Positions"
          value={portfolio.positions_count}
          icon={FaRobot}
          color="purple"
        />
        <StatCard
          title="Win Rate"
          value={`${performance.win_rate.toFixed(1)}%`}
          icon={FaShieldAlt}
          color="green"
        />
      </div>

      {/* Market Prices */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
        <h2 className="text-2xl font-bold mb-6">Market Prices</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Object.entries(prices).map(([symbol, data]) => (
            <PriceCard key={symbol} symbol={symbol} data={data} />
          ))}
        </div>
      </div>

      {/* AI Signal */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
        <h2 className="text-2xl font-bold mb-6">AI Signal</h2>
        <AISignalPanel signal={current_signal} />
      </div>
    </div>
  );
}

function TradingTab({ data, trades, executeTrade }) {
  if (!data) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Trading Signals */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
        <h2 className="text-2xl font-bold mb-6">Trading Signals</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(data.prices).map(([symbol, priceData]) => (
            <TradingCard
              key={symbol}
              symbol={symbol}
              price={priceData.price}
              executeTrade={executeTrade}
            />
          ))}
        </div>
      </div>

      {/* Trade History */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
        <h2 className="text-2xl font-bold mb-6">Trade History</h2>
        {trades.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No trades yet</p>
        ) : (
          <div className="space-y-3">
            {trades.map((trade, index) => (
              <div key={index} className="bg-white/5 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-bold">{trade.symbol}</span>
                    <span className={`ml-2 px-2 py-1 rounded text-sm ${
                      trade.type === 'BUY' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {trade.type}
                    </span>
                  </div>
                  <div className="text-right">
                    <div>${trade.price.toFixed(2)}</div>
                    <div className={trade.profit_loss >= 0 ? 'text-green-400' : 'text-red-400'}>
                      ${trade.profit_loss.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SmartContractTab() {
  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
      <h2 className="text-2xl font-bold mb-6">Smart Contract Status</h2>
      <div className="space-y-4">
        <div className="flex justify-between items-center p-4 bg-green-500/20 rounded-lg">
          <span>Contract Status</span>
          <span className="text-green-400 font-bold">Active</span>
        </div>
        <div className="flex justify-between items-center p-4 bg-blue-500/20 rounded-lg">
          <span>Validation Rate</span>
          <span className="text-blue-400 font-bold">95.2%</span>
        </div>
        <div className="flex justify-between items-center p-4 bg-purple-500/20 rounded-lg">
          <span>On-Chain Records</span>
          <span className="text-purple-400 font-bold">1,247</span>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }) {
  const colors = {
    blue: 'from-blue-500 to-cyan-500',
    green: 'from-green-500 to-emerald-500',
    red: 'from-red-500 to-pink-500',
    purple: 'from-purple-500 to-pink-500'
  };

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
      <div className="flex items-center justify-between mb-4">
        <span className="text-gray-400 text-sm">{title}</span>
        <div className={`bg-gradient-to-br ${colors[color]} p-3 rounded-lg`}>
          <Icon className="text-xl" />
        </div>
      </div>
      <div className="text-3xl font-bold">{value}</div>
    </div>
  );
}

function PriceCard({ symbol, data }) {
  return (
    <div className="bg-gradient-to-br from-white/10 to-white/5 rounded-xl p-4 border border-white/20">
      <div className="flex items-center justify-between mb-2">
        <span className="text-lg font-bold">{symbol}</span>
        <span className={`text-sm px-2 py-1 rounded ${
          data.change_24h >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
        }`}>
          {data.change_24h >= 0 ? '+' : ''}{data.change_24h}%
        </span>
      </div>
      <div className="text-2xl font-bold">${data.price.toLocaleString()}</div>
    </div>
  );
}

function AISignalPanel({ signal }) {
  const signalColors = {
    BUY: 'from-green-500 to-emerald-500',
    SELL: 'from-red-500 to-pink-500',
    HOLD: 'from-gray-500 to-gray-600'
  };

  return (
    <div className={`bg-gradient-to-br ${signalColors[signal.signal]} p-6 rounded-xl`}>
      <div className="text-3xl font-bold mb-2">{signal.signal}</div>
      <div className="text-lg">Confidence: {(signal.confidence * 100).toFixed(1)}%</div>
      <div className="text-sm mt-2">Risk Score: {signal.risk_score}/100</div>
    </div>
  );
}

function TradingCard({ symbol, price, executeTrade }) {
  return (
    <div className="bg-white/10 rounded-xl p-6 border border-white/20">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold">{symbol}</h3>
          <p className="text-2xl font-bold text-blue-400">${price}</p>
        </div>
      </div>
      <button
        onClick={() => executeTrade(symbol)}
        className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold transition-all"
      >
        Execute Trade
      </button>
    </div>
  );
}

export default App;