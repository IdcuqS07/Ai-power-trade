import { useState, useEffect } from 'react'
import axios from 'axios'
import { ArrowLeft, TrendingUp, TrendingDown, Clock, DollarSign } from 'lucide-react'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function Trades() {
  const [trades, setTrades] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTrades()
    const interval = setInterval(fetchTrades, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchTrades = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/trades/history?limit=50`)
      setTrades(response.data.data)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching trades:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="mb-8">
        <Link href="/" className="inline-flex items-center text-blue-500 hover:text-blue-400 mb-4">
          <ArrowLeft size={20} className="mr-2" />
          Back to Dashboard
        </Link>
        <h1 className="text-4xl font-bold">Trade History</h1>
        <p className="text-gray-400">Complete history of all executed trades</p>
      </div>

      {trades.length === 0 ? (
        <div className="bg-gray-800 rounded-lg p-12 text-center">
          <p className="text-gray-400 text-lg">No trades executed yet</p>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Trade ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Symbol</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Type</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold">Price</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold">Quantity</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold">Value</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold">P&L</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold">Confidence</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {trades.map((trade, index) => (
                  <tr key={index} className="hover:bg-gray-750">
                    <td className="px-6 py-4 text-sm font-mono">{trade.trade_id}</td>
                    <td className="px-6 py-4 text-sm font-bold">{trade.symbol}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                        trade.type === 'BUY' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
                      }`}>
                        {trade.type === 'BUY' ? (
                          <TrendingUp size={14} className="mr-1" />
                        ) : (
                          <TrendingDown size={14} className="mr-1" />
                        )}
                        {trade.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm">${trade.price.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right text-sm">{trade.quantity.toFixed(6)}</td>
                    <td className="px-6 py-4 text-right text-sm">${trade.value.toFixed(2)}</td>
                    <td className={`px-6 py-4 text-right text-sm font-bold ${
                      trade.profit_loss >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {trade.profit_loss >= 0 ? '+' : ''}${trade.profit_loss.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm">
                      {(trade.confidence * 100).toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      <div className="flex items-center">
                        <Clock size={14} className="mr-1" />
                        {new Date(trade.timestamp).toLocaleString()}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="text-gray-400 text-sm mb-2">Total Trades</div>
          <div className="text-3xl font-bold">{trades.length}</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="text-gray-400 text-sm mb-2">Winning Trades</div>
          <div className="text-3xl font-bold text-green-500">
            {trades.filter(t => t.profit_loss > 0).length}
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="text-gray-400 text-sm mb-2">Total P&L</div>
          <div className={`text-3xl font-bold ${
            trades.reduce((sum, t) => sum + t.profit_loss, 0) >= 0 ? 'text-green-500' : 'text-red-500'
          }`}>
            ${trades.reduce((sum, t) => sum + t.profit_loss, 0).toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  )
}
