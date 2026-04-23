import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Brain, TrendingUp, TrendingDown, Activity, AlertCircle, CheckCircle, BarChart3, Lightbulb, Target, Shield } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://143.198.205.88:8001'

export default function AIExplainer() {
  const [selectedCoin, setSelectedCoin] = useState('BTC')
  const [explanation, setExplanation] = useState(null)
  const [loading, setLoading] = useState(true) // Start with loading true for initial load
  const [prices, setPrices] = useState({
    'BTC': { price: 0, change_24h: 0 },
    'ETH': { price: 0, change_24h: 0 },
    'BNB': { price: 0, change_24h: 0 },
    'SOL': { price: 0, change_24h: 0 },
    'XRP': { price: 0, change_24h: 0 },
    'ADA': { price: 0, change_24h: 0 },
    'MATIC': { price: 0, change_24h: 0 },
    'LINK': { price: 0, change_24h: 0 }
  })
  const [dataSource, setDataSource] = useState('Loading...')

  useEffect(() => {
    fetchPrices()
    // Increased interval to 30 seconds for better performance (cache is 90s)
    const interval = setInterval(fetchPrices, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (selectedCoin) {
      fetchExplanation(selectedCoin)
    }
  }, [selectedCoin])

  const fetchPrices = async () => {
    try {
      console.log('[AI Explainer] Fetching prices from proxy API...')
      // Use proxy API to avoid CORS and mixed content issues
      const response = await fetch('/api/market/prices')
      console.log('[AI Explainer] Response status:', response.status)
      const data = await response.json()
      console.log('[AI Explainer] Prices data:', data)
      
      if (data.success && data.data) {
        // Convert Binance format to our format
        const formattedPrices = {}
        Object.entries(data.data).forEach(([symbol, info]) => {
          formattedPrices[symbol] = {
            price: info.price,
            change_24h: info.change_24h
          }
        })
        console.log('[AI Explainer] ✓ Formatted prices:', Object.keys(formattedPrices).length, 'coins')
        setPrices(formattedPrices)
        setDataSource(data.source === 'cache' ? '🟢 Cached ⚡' : '🟢 Live')
      } else {
        console.log('[AI Explainer] ✗ API returned unsuccessful response')
        setDataSource('🟡 Demo')
      }
    } catch (error) {
      console.error('[AI Explainer] ✗ Error fetching prices:', error)
      setDataSource('🟡 Demo')
      // Keep default prices if API fails
    }
  }

  const fetchExplanation = async (symbol) => {
    setLoading(true)
    try {
      // Parallel fetch: prices and explanation at the same time for faster loading
      const [pricesResponse, explanationResponse] = await Promise.all([
        fetch('/api/market/prices').catch(e => null),
        fetch(`/api/ai/explain/${symbol}`).catch(e => null)
      ])
      
      // Update prices if available
      if (pricesResponse && pricesResponse.ok) {
        const pricesData = await pricesResponse.json()
        if (pricesData.success && pricesData.data) {
          const formattedPrices = {}
          Object.entries(pricesData.data).forEach(([sym, info]) => {
            formattedPrices[sym] = {
              price: info.price,
              change_24h: info.change_24h
            }
          })
          setPrices(formattedPrices)
        }
      }
      
      // Update explanation if available
      if (explanationResponse && explanationResponse.ok) {
        const data = await explanationResponse.json()
        if (data.success) {
          setExplanation(data.data)
        }
      } else {
        // Set demo explanation if API fails
        const currentPrice = prices[symbol]?.price || 45000
        setExplanation({
          symbol: symbol,
          signal: 'BUY',
          confidence: 0.75,
          indicators_analyzed: 8,
          buy_score: 7.5,
          sell_score: 2.5,
          price: currentPrice,
          reasoning: [
            { indicator: 'RSI Oversold', explanation: 'RSI at 28 indicates oversold conditions, suggesting potential reversal', impact: 2.5 },
            { indicator: 'MACD Bullish Cross', explanation: 'MACD line crossed above signal line, indicating bullish momentum', impact: 2.0 },
            { indicator: 'Golden Cross', explanation: 'Short-term MA crossed above long-term MA', impact: 1.5 },
            { indicator: 'Volume Increase', explanation: 'Trading volume increased by 45% in last 24h', impact: 1.5 }
          ],
          indicators: {
            rsi: 28,
            macd: 150,
            ma_5: currentPrice * 1.02,
            ma_20: currentPrice * 0.98,
            ma_diff: currentPrice * 0.04,
            bb_upper: currentPrice * 1.05,
            bb_lower: currentPrice * 0.95,
            current_price: currentPrice,
            bb_position: 0.3,
            volatility: 0.035
          },
          risk_score: 45,
          position_size: 15,
          ml_prediction: {
            model: 'Random Forest',
            prediction: 'BUY',
            win_probability: 0.72,
            feature_importance: {
              rsi: 0.25,
              macd: 0.20,
              volume: 0.18,
              ma_diff: 0.15,
              volatility: 0.12,
              bb_position: 0.10
            }
          }
        })
      }
    } catch (error) {
      console.error('Error fetching explanation:', error)
    } finally {
      setLoading(false)
    }
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
            <div className="mt-2 text-sm">
              <span className="text-gray-500">Data Source: </span>
              <span className="font-semibold">{dataSource}</span>
            </div>
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
              <div className="text-sm mt-1">${(data?.price || 0).toFixed(2)}</div>
              <div className={`text-xs mt-1 ${(data?.change_24h || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {(data?.change_24h || 0) >= 0 ? '+' : ''}{(data?.change_24h || 0).toFixed(2)}%
              </div>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-6 animate-pulse">
          {/* Skeleton for AI Decision Summary */}
          <div className="rounded-lg p-6 border-2 border-gray-700 bg-gray-800/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-700 rounded"></div>
                <div>
                  <div className="h-8 w-48 bg-gray-700 rounded mb-2"></div>
                  <div className="h-4 w-32 bg-gray-700 rounded"></div>
                </div>
              </div>
              <div className="text-right">
                <div className="h-4 w-20 bg-gray-700 rounded mb-2"></div>
                <div className="h-10 w-16 bg-gray-700 rounded"></div>
              </div>
            </div>
            <div className="bg-black/30 rounded-lg p-4">
              <div className="h-4 w-32 bg-gray-700 rounded mb-3"></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="h-8 bg-gray-700 rounded"></div>
                <div className="h-8 bg-gray-700 rounded"></div>
              </div>
            </div>
          </div>
          
          {/* Skeleton for indicators */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <div className="h-6 w-3/4 bg-gray-700 rounded mb-2"></div>
                <div className="h-4 w-full bg-gray-700 rounded mb-2"></div>
                <div className="h-4 w-5/6 bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
          
          <div className="text-center text-gray-400 text-sm mt-4">
            <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500 mr-2"></div>
            Analyzing {selectedCoin} with AI... (Cached data loads instantly ⚡)
          </div>
        </div>
      ) : explanation ? (
        <div className="space-y-6">
          {/* AI Decision Summary */}
          <div className={`rounded-lg p-6 border-2 ${getSignalColor(explanation?.signal || 'HOLD')}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Target size={32} />
                <div>
                  <h2 className="text-2xl font-bold">AI Recommendation: {explanation?.signal || 'HOLD'}</h2>
                  <p className="text-sm opacity-80">Based on {explanation?.indicators_analyzed || 0} technical indicators</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm opacity-80">Confidence</div>
                <div className="text-3xl font-bold">{((explanation?.confidence || 0) * 100).toFixed(1)}%</div>
              </div>
            </div>

            {/* Confidence Breakdown */}
            <div className="bg-black/30 rounded-lg p-4">
              <div className="text-sm font-semibold mb-2">Confidence Breakdown</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Buy Signals</span>
                    <span className="text-green-400 font-bold">{(explanation?.buy_score || 0).toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${((explanation?.buy_score || 0) / 10) * 100}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Sell Signals</span>
                    <span className="text-red-400 font-bold">{(explanation?.sell_score || 0).toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-red-500 h-2 rounded-full" style={{ width: `${((explanation?.sell_score || 0) / 10) * 100}%` }} />
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
              {(explanation?.reasoning || []).map((reason, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-gray-700 rounded-lg">
                  {(reason?.impact || 0) > 0 ? (
                    <CheckCircle className="text-green-500 flex-shrink-0 mt-1" size={20} />
                  ) : (
                    <AlertCircle className="text-red-500 flex-shrink-0 mt-1" size={20} />
                  )}
                  <div className="flex-1">
                    <div className="font-semibold">{reason?.indicator || 'Unknown'}</div>
                    <div className="text-sm text-gray-300 mt-1">{reason?.explanation || ''}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-400">Impact:</span>
                      <div className="flex-1 bg-gray-600 rounded-full h-2 max-w-xs">
                        <div 
                          className={`h-2 rounded-full ${(reason?.impact || 0) > 0 ? 'bg-green-500' : 'bg-red-500'}`}
                          style={{ width: `${Math.abs(reason?.impact || 0) * 10}%` }}
                        />
                      </div>
                      <span className={`text-xs font-bold ${(reason?.impact || 0) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {(reason?.impact || 0) > 0 ? '+' : ''}{(reason?.impact || 0).toFixed(1)}
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
                  <span className="font-bold text-xl">{(explanation?.indicators?.rsi || 0).toFixed(2)}</span>
                </div>
                <div className="relative w-full bg-gray-700 rounded-full h-4">
                  <div className="absolute inset-0 flex">
                    <div className="w-1/3 bg-green-500/30 rounded-l-full"></div>
                    <div className="w-1/3 bg-gray-600"></div>
                    <div className="w-1/3 bg-red-500/30 rounded-r-full"></div>
                  </div>
                  <div 
                    className="absolute top-0 h-4 w-1 bg-white rounded"
                    style={{ left: `${explanation?.indicators?.rsi || 0}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>Oversold (&lt;30)</span>
                  <span>Neutral</span>
                  <span>Overbought (&gt;70)</span>
                </div>
              </div>
              <div className="text-sm text-gray-300">
                {(explanation?.indicators?.rsi || 0) < 30 && '🟢 Oversold - Strong buy signal'}
                {(explanation?.indicators?.rsi || 0) > 70 && '🔴 Overbought - Strong sell signal'}
                {(explanation?.indicators?.rsi || 0) >= 30 && (explanation?.indicators?.rsi || 0) <= 70 && '⚪ Neutral - No strong signal'}
              </div>
            </div>

            {/* MACD */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-bold mb-4">MACD (Moving Average Convergence Divergence)</h3>
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Current Value</span>
                  <span className={`font-bold text-xl ${(explanation?.indicators?.macd || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {(explanation?.indicators?.macd || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-center h-16 bg-gray-700 rounded-lg">
                  <div className="relative w-full h-1 bg-gray-600">
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-8 bg-white"></div>
                    <div 
                      className={`absolute top-1/2 transform -translate-y-1/2 h-4 rounded ${
                        (explanation?.indicators?.macd || 0) >= 0 ? 'bg-green-500' : 'bg-red-500'
                      }`}
                      style={{
                        left: (explanation?.indicators?.macd || 0) >= 0 ? '50%' : `${50 + ((explanation?.indicators?.macd || 0) / 100) * 50}%`,
                        right: (explanation?.indicators?.macd || 0) >= 0 ? `${50 - ((explanation?.indicators?.macd || 0) / 100) * 50}%` : '50%'
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-300">
                {(explanation?.indicators?.macd || 0) > 0 && '🟢 Positive MACD - Bullish momentum'}
                {(explanation?.indicators?.macd || 0) < 0 && '🔴 Negative MACD - Bearish momentum'}
                {(explanation?.indicators?.macd || 0) === 0 && '⚪ Zero MACD - No clear trend'}
              </div>
            </div>

            {/* Moving Averages */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-bold mb-4">Moving Averages</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>MA 5 (Short-term)</span>
                    <span className="font-bold">${(explanation?.indicators?.ma_5 || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>MA 20 (Long-term)</span>
                    <span className="font-bold">${(explanation?.indicators?.ma_20 || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Difference</span>
                    <span className={`font-bold ${(explanation?.indicators?.ma_diff || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {(explanation?.indicators?.ma_diff || 0) >= 0 ? '+' : ''}{(explanation?.indicators?.ma_diff || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="text-sm text-gray-300 p-3 bg-gray-700 rounded">
                  {(explanation?.indicators?.ma_5 || 0) > (explanation?.indicators?.ma_20 || 0) && 
                    '🟢 Golden Cross - Short-term MA above long-term MA (Bullish)'}
                  {(explanation?.indicators?.ma_5 || 0) < (explanation?.indicators?.ma_20 || 0) && 
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
                  <span className="font-bold">${(explanation?.indicators?.bb_upper || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Current Price</span>
                  <span className="font-bold text-blue-400">${(explanation?.indicators?.current_price || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Lower Band</span>
                  <span className="font-bold">${(explanation?.indicators?.bb_lower || 0).toFixed(2)}</span>
                </div>
                <div className="relative w-full h-8 bg-gray-700 rounded-lg">
                  <div 
                    className="absolute top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full"
                    style={{ left: `${(explanation?.indicators?.bb_position || 0) * 100}%` }}
                  />
                </div>
                <div className="text-sm text-gray-300 p-3 bg-gray-700 rounded">
                  {(explanation?.indicators?.bb_position || 0) < 0.2 && '🟢 Near lower band - Potential buy opportunity'}
                  {(explanation?.indicators?.bb_position || 0) > 0.8 && '🔴 Near upper band - Potential sell opportunity'}
                  {(explanation?.indicators?.bb_position || 0) >= 0.2 && (explanation?.indicators?.bb_position || 0) <= 0.8 && 
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
                <div className="text-3xl font-bold mb-2">{explanation?.risk_score || 0}/100</div>
                <div className="w-full bg-gray-600 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      (explanation?.risk_score || 0) < 40 ? 'bg-green-500' :
                      (explanation?.risk_score || 0) < 70 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${explanation?.risk_score || 0}%` }}
                  />
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  {(explanation?.risk_score || 0) < 40 && 'Low Risk'}
                  {(explanation?.risk_score || 0) >= 40 && (explanation?.risk_score || 0) < 70 && 'Medium Risk'}
                  {(explanation?.risk_score || 0) >= 70 && 'High Risk'}
                </div>
              </div>

              <div className="p-4 bg-gray-700 rounded-lg">
                <div className="text-sm text-gray-400 mb-2">Volatility</div>
                <div className="text-3xl font-bold mb-2">{((explanation?.indicators?.volatility || 0) * 100).toFixed(2)}%</div>
                <div className="text-xs text-gray-400">
                  {(explanation?.indicators?.volatility || 0) < 0.02 && 'Low volatility - Stable market'}
                  {(explanation?.indicators?.volatility || 0) >= 0.02 && (explanation?.indicators?.volatility || 0) < 0.05 && 'Medium volatility'}
                  {(explanation?.indicators?.volatility || 0) >= 0.05 && 'High volatility - Risky market'}
                </div>
              </div>

              <div className="p-4 bg-gray-700 rounded-lg">
                <div className="text-sm text-gray-400 mb-2">Recommended Position</div>
                <div className="text-3xl font-bold mb-2">{(explanation?.position_size || 0).toFixed(1)}%</div>
                <div className="text-xs text-gray-400">
                  Of your total portfolio
                </div>
              </div>
            </div>
          </div>

          {/* ML Prediction (if available) */}
          {explanation?.ml_prediction && (
            <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-lg p-6 border border-purple-500/30">
              <div className="flex items-center gap-2 mb-4">
                <Brain className="text-purple-400" size={24} />
                <h2 className="text-xl font-bold">Machine Learning Prediction</h2>
                <span className="text-xs bg-purple-700 px-2 py-1 rounded">{explanation?.ml_prediction?.model || 'Unknown'}</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-gray-400 mb-2">ML Recommendation</div>
                  <div className={`text-2xl font-bold px-4 py-2 rounded-lg inline-block ${
                    (explanation?.ml_prediction?.prediction || 'HOLD') === 'BUY' ? 'bg-green-600' : 'bg-red-600'
                  }`}>
                    {explanation?.ml_prediction?.prediction || 'HOLD'}
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Win Probability</span>
                      <span className="text-green-400 font-bold">
                        {((explanation?.ml_prediction?.win_probability || 0) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${(explanation?.ml_prediction?.win_probability || 0) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-400 mb-2">Feature Importance</div>
                  <div className="space-y-2">
                    {Object.entries(explanation?.ml_prediction?.feature_importance || {})
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 5)
                      .map(([feature, importance]) => (
                        <div key={feature}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="capitalize">{feature.replace('_', ' ')}</span>
                            <span>{((importance || 0) * 100).toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-1.5">
                            <div 
                              className="bg-purple-500 h-1.5 rounded-full"
                              style={{ width: `${(importance || 0) * 100}%` }}
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
              Based on this analysis, the AI recommends a <span className="font-bold text-white">{explanation?.signal || 'HOLD'}</span> position
              with <span className="font-bold text-white">{((explanation?.confidence || 0) * 100).toFixed(1)}%</span> confidence.
            </p>
            <Link href="/">
              <button className={`px-8 py-3 rounded-lg font-bold text-lg transition ${
                (explanation?.signal || 'HOLD') === 'BUY' ? 'bg-green-600 hover:bg-green-700' :
                (explanation?.signal || 'HOLD') === 'SELL' ? 'bg-red-600 hover:bg-red-700' :
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
