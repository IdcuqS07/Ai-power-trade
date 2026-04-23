import { useState } from 'react'
import axios from 'axios'
import Link from 'next/link'
import { ArrowLeft, Play, TrendingUp, Award, BarChart3 } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://143.198.205.88:8000'

export default function Backtest() {
  const [symbol, setSymbol] = useState('BTC')
  const [strategy, setStrategy] = useState('ai_multi_indicator')
  const [periodDays, setPeriodDays] = useState(30)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [comparison, setComparison] = useState(null)

  const runBacktest = async () => {
    setLoading(true)
    setResult(null)
    try {
      const response = await axios.get(
        `${API_URL}/api/backtest/${symbol}?strategy=${strategy}&period_days=${periodDays}`
      )
      setResult(response.data.data)
    } catch (error) {
      console.error('Error running backtest:', error)
    }
    setLoading(false)
  }

  const compareStrategies = async () => {
    setLoading(true)
    setComparison(null)
    try {
      const response = await axios.get(
        `${API_URL}/api/backtest/compare/${symbol}?period_days=${periodDays}`
      )
      setComparison(response.data.data)
    } catch (error) {
      console.error('Error comparing strategies:', error)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="mb-8">
        <Link href="/" className="inline-flex items-center text-blue-500 hover:text-blue-400 mb-4">
          <ArrowLeft size={20} className="mr-2" />
          Back to Dashboard
        </Link>
        <h1 className="text-4xl font-bold">Backtesting Engine</h1>
        <p className="text-gray-400">Test trading strategies with historical data</p>
        <div className="mt-2 px-3 py-1 bg-purple-900/30 border border-purple-500 rounded-lg inline-block">
          <span className="text-purple-400 text-sm font-semibold">🏆 Hackathon Feature</span>
        </div>
      </div>

      {/* Configuration */}
      <div className="bg-gray-800 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Backtest Configuration</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Symbol</label>
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
            >
              <option value="BTC">BTC</option>
              <option value="ETH">ETH</option>
              <option value="BNB">BNB</option>
              <option value="SOL">SOL</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Strategy</label>
            <select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
            >
              <option value="ai_multi_indicator">AI Multi-Indicator</option>
              <option value="momentum">Momentum</option>
              <option value="mean_reversion">Mean Reversion</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Period (Days)</label>
            <select
              value={periodDays}
              onChange={(e) => setPeriodDays(parseInt(e.target.value))}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
            >
              <option value="7">7 Days</option>
              <option value="14">14 Days</option>
              <option value="30">30 Days</option>
              <option value="60">60 Days</option>
              <option value="90">90 Days</option>
            </select>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={runBacktest}
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition"
          >
            <Play size={20} />
            {loading ? 'Running...' : 'Run Backtest'}
          </button>

          <button
            onClick={compareStrategies}
            disabled={loading}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition"
          >
            <BarChart3 size={20} />
            {loading ? 'Comparing...' : 'Compare Strategies'}
          </button>
        </div>
      </div>

      {/* Backtest Result */}
      {result && (
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Backtest Results</h2>
            <div className={`px-4 py-2 rounded-lg font-bold ${
              result.total_return >= 0 ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
            }`}>
              {result.total_return >= 0 ? '+' : ''}{result.total_return.toFixed(2)}% Return
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-gray-400 text-sm mb-1">Initial Balance</div>
              <div className="text-xl font-bold">${result.initial_balance.toFixed(2)}</div>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-gray-400 text-sm mb-1">Final Balance</div>
              <div className="text-xl font-bold">${result.final_balance.toFixed(2)}</div>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-gray-400 text-sm mb-1">Total Trades</div>
              <div className="text-xl font-bold">{result.total_trades}</div>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-gray-400 text-sm mb-1">Win Rate</div>
              <div className="text-xl font-bold text-green-500">{result.metrics.win_rate}%</div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-gray-400 text-sm mb-1">Winning Trades</div>
              <div className="text-xl font-bold text-green-500">{result.winning_trades}</div>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-gray-400 text-sm mb-1">Losing Trades</div>
              <div className="text-xl font-bold text-red-500">{result.losing_trades}</div>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-gray-400 text-sm mb-1">Sharpe Ratio</div>
              <div className="text-xl font-bold">{result.metrics.sharpe_ratio.toFixed(2)}</div>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-gray-400 text-sm mb-1">Max Drawdown</div>
              <div className="text-xl font-bold text-red-500">{result.metrics.max_drawdown.toFixed(2)}%</div>
            </div>
          </div>
        </div>
      )}

      {/* Strategy Comparison */}
      {comparison && (
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center mb-6">
            <Award className="text-yellow-500 mr-2" size={24} />
            <h2 className="text-2xl font-bold">Strategy Comparison</h2>
          </div>

          <div className="space-y-4">
            {comparison.strategies.map((strat, index) => (
              <div
                key={index}
                className={`bg-gray-700 rounded-lg p-4 border-2 ${
                  index === 0 ? 'border-yellow-500' : 'border-transparent'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {index === 0 && <Award className="text-yellow-500" size={20} />}
                    <span className="text-lg font-bold capitalize">
                      {strat.strategy.replace(/_/g, ' ')}
                    </span>
                    {index === 0 && (
                      <span className="px-2 py-1 bg-yellow-900/50 text-yellow-400 text-xs rounded">
                        Best
                      </span>
                    )}
                  </div>
                  <div className={`text-xl font-bold ${
                    strat.return >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {strat.return >= 0 ? '+' : ''}{strat.return.toFixed(2)}%
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-400">Win Rate</div>
                    <div className="font-bold">{strat.win_rate}%</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Sharpe</div>
                    <div className="font-bold">{strat.sharpe_ratio.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Max DD</div>
                    <div className="font-bold text-red-500">{strat.max_drawdown.toFixed(2)}%</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Trades</div>
                    <div className="font-bold">{strat.total_trades}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-900/30 border border-blue-500 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="text-blue-400" size={20} />
              <span className="font-bold text-blue-400">Recommendation</span>
            </div>
            <p className="text-gray-300">
              Based on {periodDays}-day backtest, <span className="font-bold text-white capitalize">
                {comparison.best_strategy?.replace(/_/g, ' ')}
              </span> strategy shows the best performance for {symbol} with highest returns and acceptable risk metrics.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
