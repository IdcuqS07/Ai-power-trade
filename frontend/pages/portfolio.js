import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { 
  PieChart, TrendingUp, TrendingDown, DollarSign, 
  Target, AlertTriangle, Activity, Zap 
} from 'lucide-react';

export default function Portfolio() {
  const [portfolioData, setPortfolioData] = useState({
    totalValue: 25000,
    totalPnL: 2500,
    dailyPnL: 150,
    positions: [
      { symbol: 'BTC/USDT', size: 0.5, value: 25000, pnl: 1200, pnlPercent: 5.2 },
      { symbol: 'ETH/USDT', size: 10, value: 18000, pnl: 800, pnlPercent: 4.6 },
      { symbol: 'SOL/USDT', size: 100, value: 8000, pnl: -200, pnlPercent: -2.4 }
    ]
  });

  const [riskMetrics, setRiskMetrics] = useState({
    sharpeRatio: 1.85,
    maxDrawdown: -5.2,
    winRate: 68.5,
    avgWin: 125,
    avgLoss: -85,
    riskScore: 'Medium'
  });

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Portfolio Management</h1>
          <p className="text-slate-400">Monitor your trading positions and performance</p>
        </div>

        {/* Portfolio Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <DollarSign className="w-8 h-8 text-green-400" />
              <div>
                <div className="text-sm text-slate-400">Total Value</div>
                <div className="text-2xl font-bold text-white">
                  ${portfolioData.totalValue.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-8 h-8 text-blue-400" />
              <div>
                <div className="text-sm text-slate-400">Total P&L</div>
                <div className={`text-2xl font-bold ${portfolioData.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {portfolioData.totalPnL >= 0 ? '+' : ''}${portfolioData.totalPnL.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <Activity className="w-8 h-8 text-purple-400" />
              <div>
                <div className="text-sm text-slate-400">Daily P&L</div>
                <div className={`text-2xl font-bold ${portfolioData.dailyPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {portfolioData.dailyPnL >= 0 ? '+' : ''}${portfolioData.dailyPnL}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <Target className="w-8 h-8 text-yellow-400" />
              <div>
                <div className="text-sm text-slate-400">Win Rate</div>
                <div className="text-2xl font-bold text-white">
                  {riskMetrics.winRate}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Positions Table */}
        <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700">
          <h3 className="text-xl font-semibold text-white mb-6">Active Positions</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 text-slate-400">Symbol</th>
                  <th className="text-right py-3 text-slate-400">Size</th>
                  <th className="text-right py-3 text-slate-400">Value</th>
                  <th className="text-right py-3 text-slate-400">P&L</th>
                  <th className="text-right py-3 text-slate-400">P&L %</th>
                  <th className="text-right py-3 text-slate-400">Action</th>
                </tr>
              </thead>
              <tbody>
                {portfolioData.positions.map((position, index) => (
                  <tr key={index} className="border-b border-slate-700/50">
                    <td className="py-4">
                      <div className="font-semibold text-white">{position.symbol}</div>
                    </td>
                    <td className="text-right py-4 text-slate-300">{position.size}</td>
                    <td className="text-right py-4 text-slate-300">
                      ${position.value.toLocaleString()}
                    </td>
                    <td className={`text-right py-4 font-semibold ${
                      position.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {position.pnl >= 0 ? '+' : ''}${position.pnl}
                    </td>
                    <td className={`text-right py-4 font-semibold ${
                      position.pnlPercent >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {position.pnlPercent >= 0 ? '+' : ''}{position.pnlPercent}%
                    </td>
                    <td className="text-right py-4">
                      <button className="px-3 py-1 bg-red-600/20 text-red-400 rounded hover:bg-red-600/30 transition-colors">
                        Close
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Risk Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700">
            <h3 className="text-xl font-semibold text-white mb-6">Risk Metrics</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Sharpe Ratio</span>
                <span className="text-white font-semibold">{riskMetrics.sharpeRatio}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Max Drawdown</span>
                <span className="text-red-400 font-semibold">{riskMetrics.maxDrawdown}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Average Win</span>
                <span className="text-green-400 font-semibold">${riskMetrics.avgWin}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Average Loss</span>
                <span className="text-red-400 font-semibold">${riskMetrics.avgLoss}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Risk Score</span>
                <span className={`font-semibold px-2 py-1 rounded ${
                  riskMetrics.riskScore === 'Low' ? 'bg-green-600/20 text-green-400' :
                  riskMetrics.riskScore === 'Medium' ? 'bg-yellow-600/20 text-yellow-400' :
                  'bg-red-600/20 text-red-400'
                }`}>
                  {riskMetrics.riskScore}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700">
            <h3 className="text-xl font-semibold text-white mb-6">Portfolio Allocation</h3>
            <div className="space-y-4">
              {portfolioData.positions.map((position, index) => {
                const percentage = (position.value / portfolioData.totalValue * 100);
                return (
                  <div key={index}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-300">{position.symbol}</span>
                      <span className="text-white font-semibold">{percentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Performance Chart Placeholder */}
        <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700">
          <h3 className="text-xl font-semibold text-white mb-6">Performance Chart</h3>
          <div className="h-64 bg-slate-900/50 rounded-lg flex items-center justify-center">
            <div className="text-center text-slate-500">
              <PieChart className="w-12 h-12 mx-auto mb-2" />
              <p>Portfolio performance visualization</p>
              <p className="text-sm">Chart integration coming soon</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}