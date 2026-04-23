import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

export default function TradingChart({ marketData }) {
  const [priceHistory, setPriceHistory] = useState([]);
  const [timeframe, setTimeframe] = useState('1H');

  useEffect(() => {
    if (marketData?.price) {
      setPriceHistory(prev => {
        const newHistory = [...prev, {
          price: marketData.price,
          timestamp: Date.now(),
          volume: marketData.volume || 0
        }].slice(-50);
        return newHistory;
      });
    }
  }, [marketData]);

  const maxPrice = Math.max(...priceHistory.map(p => p.price));
  const minPrice = Math.min(...priceHistory.map(p => p.price));
  const priceRange = maxPrice - minPrice || 1;

  return (
    <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white">Price Chart</h3>
        <div className="flex gap-2">
          {['1M', '5M', '15M', '1H', '4H', '1D'].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                timeframe === tf
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Price Display */}
      <div className="mb-6">
        <div className="text-3xl font-bold text-white mb-2">
          ${marketData?.price?.toFixed(2) || '0.00'}
        </div>
        <div className={`flex items-center gap-2 ${
          (marketData?.change || 0) >= 0 ? 'text-green-400' : 'text-red-400'
        }`}>
          {(marketData?.change || 0) >= 0 ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
          <span>{Math.abs(marketData?.change || 0).toFixed(2)}%</span>
          <span className="text-slate-400 text-sm">
            Vol: {(marketData?.volume || 0).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Chart Area */}
      <div className="relative h-64 bg-slate-900/50 rounded-lg p-4">
        {priceHistory.length > 1 ? (
          <svg className="w-full h-full">
            <defs>
              <linearGradient id="priceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
              </linearGradient>
            </defs>
            
            {/* Price Line */}
            <polyline
              fill="none"
              stroke="#3B82F6"
              strokeWidth="2"
              points={priceHistory.map((point, index) => {
                const x = (index / (priceHistory.length - 1)) * 100;
                const y = 100 - ((point.price - minPrice) / priceRange) * 100;
                return `${x},${y}`;
              }).join(' ')}
              vectorEffect="non-scaling-stroke"
            />
            
            {/* Fill Area */}
            <polygon
              fill="url(#priceGradient)"
              points={`0,100 ${priceHistory.map((point, index) => {
                const x = (index / (priceHistory.length - 1)) * 100;
                const y = 100 - ((point.price - minPrice) / priceRange) * 100;
                return `${x},${y}`;
              }).join(' ')} 100,100`}
            />
          </svg>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-500">
            <Activity className="w-8 h-8 mr-2" />
            Waiting for price data...
          </div>
        )}
      </div>

      {/* Technical Indicators */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="text-center">
          <div className="text-sm text-slate-400">RSI</div>
          <div className="text-lg font-semibold text-yellow-400">
            {(Math.random() * 40 + 30).toFixed(1)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-slate-400">MACD</div>
          <div className="text-lg font-semibold text-green-400">
            {(Math.random() * 2 - 1).toFixed(3)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-slate-400">BB</div>
          <div className="text-lg font-semibold text-blue-400">
            {(marketData?.price * 0.98)?.toFixed(2) || '0.00'}
          </div>
        </div>
      </div>
    </div>
  );
}