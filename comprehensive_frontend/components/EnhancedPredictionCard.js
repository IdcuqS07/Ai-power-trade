/**
 * Enhanced Prediction Card Component
 * Displays LSTM + ML + CoinGecko combined predictions
 */

import React, { useState, useEffect } from 'react';
import ConfidenceIndicator from './ConfidenceIndicator';
import { TrendingUp, TrendingDown, Minus, Brain, Activity, Globe } from 'lucide-react';

const EnhancedPredictionCard = ({ symbol, apiUrl }) => {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEnhancedPrediction();
    const interval = setInterval(fetchEnhancedPrediction, 10000); // Update every 10s
    return () => clearInterval(interval);
  }, [symbol]);

  const fetchEnhancedPrediction = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/ai/enhanced-prediction/${symbol}`);
      const data = await response.json();
      
      if (data.success) {
        setPrediction(data.data);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch prediction');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 animate-pulse">
        <div className="h-6 bg-gray-700 rounded w-1/2 mb-4"></div>
        <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-700 rounded w-2/3"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-yellow-500">
        <div className="flex items-center gap-2 text-yellow-500">
          <Activity className="w-5 h-5" />
          <span className="text-sm">{error}</span>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Enhanced AI features require TensorFlow. Using basic predictions.
        </p>
      </div>
    );
  }

  if (!prediction) return null;

  const getSignalIcon = () => {
    switch (prediction.signal) {
      case 'BUY':
        return <TrendingUp className="w-6 h-6 text-green-500" />;
      case 'SELL':
        return <TrendingDown className="w-6 h-6 text-red-500" />;
      default:
        return <Minus className="w-6 h-6 text-yellow-500" />;
    }
  };

  const getSignalColor = () => {
    switch (prediction.signal) {
      case 'BUY':
        return 'text-green-500 bg-green-500/10 border-green-500';
      case 'SELL':
        return 'text-red-500 bg-red-500/10 border-red-500';
      default:
        return 'text-yellow-500 bg-yellow-500/10 border-yellow-500';
    }
  };

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-gray-700 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-500" />
          <h3 className="text-lg font-bold text-white">Enhanced AI Prediction</h3>
        </div>
        <span className="text-xs text-gray-400">{symbol}</span>
      </div>

      {/* Signal */}
      <div className={`flex items-center gap-3 p-4 rounded-lg border mb-4 ${getSignalColor()}`}>
        {getSignalIcon()}
        <div>
          <div className="text-2xl font-bold">{prediction.signal}</div>
          <div className="text-xs opacity-75">AI Recommendation</div>
        </div>
      </div>

      {/* Confidence Indicator */}
      <div className="mb-4">
        <ConfidenceIndicator
          confidence={prediction.confidence}
          level={prediction.confidence_level}
          size="lg"
        />
      </div>

      {/* Models Used */}
      {prediction.models_used > 0 && (
        <div className="bg-gray-700/50 rounded-lg p-3 mb-4">
          <div className="text-xs text-gray-400 mb-2">Models Combined: {prediction.models_used}</div>
          <div className="space-y-2">
            {prediction.models?.lstm && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-300">🧠 LSTM Neural Network</span>
                <span className="text-purple-400">
                  {prediction.models.lstm.price_change > 0 ? '+' : ''}
                  {prediction.models.lstm.price_change.toFixed(2)}%
                </span>
              </div>
            )}
            {prediction.models?.random_forest && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-300">🌲 Random Forest</span>
                <span className={prediction.models.random_forest.signal === 'BUY' ? 'text-green-400' : 'text-red-400'}>
                  {prediction.models.random_forest.signal}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Market Data from CoinGecko */}
      {prediction.market_data && (
        <div className="bg-gray-700/50 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-gray-400">Market Data (CoinGecko)</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-400">Price:</span>
              <span className="text-white ml-1">${prediction.market_data.price.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-gray-400">24h:</span>
              <span className={prediction.market_data.price_change_24h >= 0 ? 'text-green-400 ml-1' : 'text-red-400 ml-1'}>
                {prediction.market_data.price_change_24h >= 0 ? '+' : ''}
                {prediction.market_data.price_change_24h.toFixed(2)}%
              </span>
            </div>
            <div>
              <span className="text-gray-400">Volume:</span>
              <span className="text-white ml-1">${(prediction.market_data.volume_24h / 1e9).toFixed(2)}B</span>
            </div>
            <div>
              <span className="text-gray-400">Sentiment:</span>
              <span className="text-blue-400 ml-1">{prediction.market_data.sentiment_up.toFixed(0)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Technical Indicators */}
      {prediction.technical_indicators && (
        <div className="bg-gray-700/50 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-2">Technical Indicators</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-400">RSI:</span>
              <span className={`ml-1 ${
                prediction.technical_indicators.rsi > 70 ? 'text-red-400' :
                prediction.technical_indicators.rsi < 30 ? 'text-green-400' :
                'text-yellow-400'
              }`}>
                {prediction.technical_indicators.rsi.toFixed(1)}
              </span>
            </div>
            <div>
              <span className="text-gray-400">MACD:</span>
              <span className={prediction.technical_indicators.macd >= 0 ? 'text-green-400 ml-1' : 'text-red-400 ml-1'}>
                {prediction.technical_indicators.macd.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-gray-400">MA5:</span>
              <span className="text-white ml-1">${prediction.technical_indicators.ma_5.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-gray-400">MA20:</span>
              <span className="text-white ml-1">${prediction.technical_indicators.ma_20.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Timestamp */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        Updated: {new Date(prediction.timestamp).toLocaleTimeString()}
      </div>
    </div>
  );
};

export default EnhancedPredictionCard;
