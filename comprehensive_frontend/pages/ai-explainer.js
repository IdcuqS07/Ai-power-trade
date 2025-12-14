import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Brain, TrendingUp, TrendingDown, Activity, AlertCircle, CheckCircle, BarChart3, Lightbulb, Target, Shield } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://143.198.205.88'

export default function AIExplainer() {
  const [selectedCoin, setSelectedCoin] = useState('BTC')
  const [explanation, setExplanation] = useState(null)
  const [loading, setLoading] = useState(false)
  const [prices, setPrices] = useState({})

  useEffect(() => {
    fetchPrices()
    const interval = setInterval(fetchPrices, 10000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (selectedCoin) {
      fetchExplanation(selectedCoin)
    }
  }, [selectedCoin])

  const fetchPrices = async () => {
    try {
      const response = await fetch(`${API_URL}/api/market/prices`)
      const data = await response.json()
      if (data.success) {
        setPrices(data.data)
      }
    } catch (error) {
      console.error('Error fetching prices:', error)
    }
  }

  const fetchExplanation = async (symbol) => {
    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/ai/explain/${symbol}`)
      const data = await response.json()
      if (data.success) {
        setExplanation(data.data)
      }
    } catch (error) {
      console.error('Error fetching explanation:', error)
    }
    setLoading(false)
  }

  const getSignalColor = (signal) => {
    if (signal === 'BUY') return 'text-green-500 bg-green-900/30 border-green-500'
    if (signal === 'SELL') return 'text-red-500 bg-red-900/30 border-red-500'
    return 'text-gray-500 bg-gray-900/30 border-gray-500'
  }

  const getIndicatorStatus = (value, thresholds) => {
    if (value >= thresholds.bullish) return { status: 'BULLISH', color: 'text-green-500', icon: TrendingUp }
    if (value <= thresholds.bearish) return { status: 'BEARISH', color: 'text-red-500', icon: TrendingDown }
    return { status: 'NEUTRAL', color: 'text-gray-500', icon: Activity }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Brain className="text-purple-500" size={40} />
              <h1 className="text-4xl font-bold">AI Explainability Dashboard</h1>
            </div>
            <p className="text-gray-400">Understand exactly why the AI makes each trading decision</p>
          </div>
          <Link href="/">
            <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition">
              ← Back to Dashboard
            </button>
          </Link>
        </div>
      </div>

      {/* Coin Selector */}
      <div className="bg-gray-800 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Select Cryptocurrency</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {Object.entries(prices).map(([symbol, data]) => (
            <button
              key={symbol}
              onClick={() => setSelectedCoin(symbol)}
              className={`p-4 rounded-lg transition border-2 ${
                selectedCoin === symbol
                  ? 'bg-purple-600 border-purple-400 text-white'
                  : 'bg-gray-700 border-transparent hover:bg-gray-600'
              }`}
            >
              <div className="font-bold text-lg">{symbol}</div>
              <div className="text-sm mt-1">${data?.price?.toFixed(2)}</div>
              <div className={`text-xs mt-1 ${(data?.change_24h || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {(data?.change_24h || 0) >= 0 ? '+' : ''}{(data?.change_24h || 0).toFixed(2)}%
              </div>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4"></div>
            <div className="text-xl">Analyzing {selectedCoin}...</div>
          </div>
        </div>
      ) : explanation ? (
        <div className="space-y-6">
          {/* AI Decision Summary */}
          <div className={`rounded-lg p-6 border-2 ${getSignalColor(explanation.signal)}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Target size={32} />
                <div>
                  <h2 className="text-2xl font-bold">AI Recommendation: {explanation.signal}</h2>
                  <p className="text-sm opacity-80">Based on {explanation.indicators_analyzed} technical indicators</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm opacity-80">Confidence</div>
                <div className="text-3xl font-bold">{(explanation.confidence * 100).toFixed(1)}%</div>
              </div>
            </div>

            {/* Confidence Breakdown */}
            <div className="bg-black/30 rounded-lg p-4">
              <div className="text-sm font-semibold mb-2">Confidence Breakdown</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Buy Signals</span>
                    <span className="text-green-400 font-bold">{explanation.buy_score.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(explanation.buy_score / 10) * 100}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Sell Signals</span>
                    <span className="text-red-400 font-bold">{explanation.sell_score.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-red-500 h-2 rounded-full" style={{ width: `${(explanation.sell_score / 10) * 100}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Why This Decision? */}
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="text-yellow-500" size={24} />
              <h2 className="text-xl font-bold">Why This Decision?</h2>
            </div>
            <div className="space-y-3">
              {explanation.reasoning.map((reason, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-gray-700 rounded-lg">
                  {reason.impact > 0 ? (
                    <CheckCircle className="text-green-500 flex-shrink-0 mt-1" size={20} />
                  ) : (
                    <AlertCircle className="text-red-500 flex-shrink-0 mt-1" size={20} />
                  )}
                  <div className="flex-1">
                    <div className="font-semibold">{reason.indicator}</div>
                    <div className="text-sm text-gray-300 mt-1">{reason.explanation}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-400">Impact:</span>
                      <div className="flex-1 bg-gray-600 rounded-full h-2 max-w-xs">
                        <div 
                          className={`h-2 rounded-full ${reason.impact > 0 ? 'bg-green-500' : 'bg-red-500'}`}
                          style={{ width: `${Math.abs(reason.impact) * 10}%` }}
                        />
                      </div>
                      <span className={`text-xs font-bold ${reason.impact > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {reason.impact > 0 ? '+' : ''}{reason.impact.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Technical Indicators Deep Dive */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* RSI */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-bold mb-4">RSI (Relative Strength Index)</h3>
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Current Value</span>
                  <span className="font-bold text-xl">{explanation.indicators.rsi.toFixed(2)}</span>
                </div>
                <div className="relative w-full bg-gray-700 rounded-full h-4">
                  <div className="absolute inset-0 flex">
                    <div className="w-1/3 bg-green-500/30 rounded-l-full"></div>
                    <div className="w-1/3 bg-gray-600"></div>
                    <div className="w-1/3 bg-red-500/30 rounded-r-full"></div>
                  </div>
                  <div 
                    className="absolute top-0 h-4 w-1 bg-white rounded"
                    style={{ left: `${explanation.indicators.rsi}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>Oversold (&lt;30)</span>
                  <span>Neutral</span>
                  <span>Overbought (&gt;70)</span>
                </div>
              </div>
              <div className="text-sm text-gray-300">
                {explanation.indicators.rsi < 30 && '🟢 Oversold - Strong buy signal'}
                {explanation.indicators.rsi > 70 && '🔴 Overbought - Strong sell signal'}
                {explanation.indicators.rsi >= 30 && explanation.indicators.rsi <= 70 && '⚪ Neutral - No strong signal'}
              </div>
            </div>

            {/* MACD */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-bold mb-4">MACD (Moving Average Convergence Divergence)</h3>
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Current Value</span>
                  <span className={`font-bold text-xl ${explanation.indicators.macd >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {explanation.indicators.macd.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-center h-16 bg-gray-700 rounded-lg">
                  <div className="relative w-full h-1 bg-gray-600">
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-8 bg-white"></div>
                    <div 
                      className={`absolute top-1/2 transform -translate-y-1/2 h-4 rounded ${
                        explanation.indicators.macd >= 0 ? 'bg-green-500' : 'bg-red-500'
                      }`}
                      style={{
                        left: explanation.indicators.macd >= 0 ? '50%' : `${50 + (explanation.indicators.macd / 100) * 50}%`,
                        right: explanation.indicators.macd >= 0 ? `${50 - (explanation.indicators.macd / 100) * 50}%` : '50%'
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-300">
                {explanation.indicators.macd > 0 && '🟢 Positive MACD - Bullish momentum'}
                {explanation.indicators.macd < 0 && '🔴 Negative MACD - Bearish momentum'}
                {explanation.indicators.macd === 0 && '⚪ Zero MACD - No clear trend'}
              </div>
            </div>

            {/* Moving Averages */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-bold mb-4">Moving Averages</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>MA 5 (Short-term)</span>
                    <span className="font-bold">${explanation.indicators.ma_5.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>MA 20 (Long-term)</span>
                    <span className="font-bold">${explanation.indicators.ma_20.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Difference</span>
                    <span className={`font-bold ${explanation.indicators.ma_diff >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {explanation.indicators.ma_diff >= 0 ? '+' : ''}{explanation.indicators.ma_diff.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="text-sm text-gray-300 p-3 bg-gray-700 rounded">
                  {explanation.indicators.ma_5 > explanation.indicators.ma_20 && 
                    '🟢 Golden Cross - Short-term MA above long-term MA (Bullish)'}
                  {explanation.indicators.ma_5 < explanation.indicators.ma_20 && 
                    '🔴 Death Cross - Short-term MA below long-term MA (Bearish)'}
                </div>
              </div>
            </div>

            {/* Bollinger Bands */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-bold mb-4">Bollinger Bands</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Upper Band</span>
                  <span className="font-bold">${explanation.indicators.bb_upper.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Current Price</span>
                  <span className="font-bold text-blue-400">${explanation.indicators.current_price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Lower Band</span>
                  <span className="font-bold">${explanation.indicators.bb_lower.toFixed(2)}</span>
                </div>
                <div className="relative w-full h-8 bg-gray-700 rounded-lg">
                  <div 
                    className="absolute top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full"
                    style={{ left: `${explanation.indicators.bb_position * 100}%` }}
                  />
                </div>
                <div className="text-sm text-gray-300 p-3 bg-gray-700 rounded">
                  {explanation.indicators.bb_position < 0.2 && '🟢 Near lower band - Potential buy opportunity'}
                  {explanation.indicators.bb_position > 0.8 && '🔴 Near upper band - Potential sell opportunity'}
                  {explanation.indicators.bb_position >= 0.2 && explanation.indicators.bb_position <= 0.8 && 
                    '⚪ Within bands - Normal trading range'}
                </div>
              </div>
            </div>
          </div>

          {/* Risk Assessment */}
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="text-blue-500" size={24} />
              <h2 className="text-xl font-bold">Risk Assessment</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-700 rounded-lg">
                <div className="text-sm text-gray-400 mb-2">Risk Score</div>
                <div className="text-3xl font-bold mb-2">{explanation.risk_score}/100</div>
                <div className="w-full bg-gray-600 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      explanation.risk_score < 40 ? 'bg-green-500' :
                      explanation.risk_score < 70 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${explanation.risk_score}%` }}
                  />
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  {explanation.risk_score < 40 && 'Low Risk'}
                  {explanation.risk_score >= 40 && explanation.risk_score < 70 && 'Medium Risk'}
                  {explanation.risk_score >= 70 && 'High Risk'}
                </div>
              </div>

              <div className="p-4 bg-gray-700 rounded-lg">
                <div className="text-sm text-gray-400 mb-2">Volatility</div>
                <div className="text-3xl font-bold mb-2">{(explanation.indicators.volatility * 100).toFixed(2)}%</div>
                <div className="text-xs text-gray-400">
                  {explanation.indicators.volatility < 0.02 && 'Low volatility - Stable market'}
                  {explanation.indicators.volatility >= 0.02 && explanation.indicators.volatility < 0.05 && 'Medium volatility'}
                  {explanation.indicators.volatility >= 0.05 && 'High volatility - Risky market'}
                </div>
              </div>

              <div className="p-4 bg-gray-700 rounded-lg">
                <div className="text-sm text-gray-400 mb-2">Recommended Position</div>
                <div className="text-3xl font-bold mb-2">{explanation.position_size.toFixed(1)}%</div>
                <div className="text-xs text-gray-400">
                  Of your total portfolio
                </div>
              </div>
            </div>
          </div>

          {/* ML Prediction (if available) */}
          {explanation.ml_prediction && (
            <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-lg p-6 border border-purple-500/30">
              <div className="flex items-center gap-2 mb-4">
                <Brain className="text-purple-400" size={24} />
                <h2 className="text-xl font-bold">Machine Learning Prediction</h2>
                <span className="text-xs bg-purple-700 px-2 py-1 rounded">{explanation.ml_prediction.model}</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-gray-400 mb-2">ML Recommendation</div>
                  <div className={`text-2xl font-bold px-4 py-2 rounded-lg inline-block ${
                    explanation.ml_prediction.prediction === 'BUY' ? 'bg-green-600' : 'bg-red-600'
                  }`}>
                    {explanation.ml_prediction.prediction}
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Win Probability</span>
                      <span className="text-green-400 font-bold">
                        {(explanation.ml_prediction.win_probability * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${explanation.ml_prediction.win_probability * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-400 mb-2">Feature Importance</div>
                  <div className="space-y-2">
                    {Object.entries(explanation.ml_prediction.feature_importance)
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 5)
                      .map(([feature, importance]) => (
                        <div key={feature}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="capitalize">{feature.replace('_', ' ')}</span>
                            <span>{(importance * 100).toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-1.5">
                            <div 
                              className="bg-purple-500 h-1.5 rounded-full"
                              style={{ width: `${importance * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <p className="text-gray-400 mb-4">
              Based on this analysis, the AI recommends a <span className="font-bold text-white">{explanation.signal}</span> position
              with <span className="font-bold text-white">{(explanation.confidence * 100).toFixed(1)}%</span> confidence.
            </p>
            <Link href="/">
              <button className={`px-8 py-3 rounded-lg font-bold text-lg transition ${
                explanation.signal === 'BUY' ? 'bg-green-600 hover:bg-green-700' :
                explanation.signal === 'SELL' ? 'bg-red-600 hover:bg-red-700' :
                'bg-gray-600 hover:bg-gray-700'
              }`}>
                Go to Dashboard to Execute Trade
              </button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 text-gray-400">
          Select a cryptocurrency to see AI analysis
        </div>
      )}
    </div>
  )
}
