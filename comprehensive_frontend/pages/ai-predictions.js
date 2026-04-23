/**
 * Enhanced AI Predictions Page
 * LSTM + ML + CoinGecko Integration
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import EnhancedPredictionCard from '../components/EnhancedPredictionCard';
import ConfidenceIndicator from '../components/ConfidenceIndicator';
import { Brain, TrendingUp, Globe, Activity, RefreshCw, CheckCircle, XCircle } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const SYMBOLS = ['BTC', 'ETH', 'BNB', 'SOL', 'ADA', 'XRP', 'MATIC', 'LINK'];

export default function AIPredictionsPage() {
  const [selectedSymbol, setSelectedSymbol] = useState('BTC');
  const [modelStatus, setModelStatus] = useState(null);
  const [globalMarket, setGlobalMarket] = useState(null);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchModelStatus();
    fetchGlobalMarket();
    fetchTrending();
  }, []);

  const fetchModelStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/api/ai/model-status`);
      const data = await response.json();
      if (data.success) {
        setModelStatus(data.data);
      }
    } catch (error) {
      console.error('Error fetching model status:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGlobalMarket = async () => {
    try {
      const response = await fetch(`${API_URL}/api/ai/global-market`);
      const data = await response.json();
      if (data.success) {
        setGlobalMarket(data.data);
      }
    } catch (error) {
      console.error('Error fetching global market:', error);
    }
  };

  const fetchTrending = async () => {
    try {
      const response = await fetch(`${API_URL}/api/ai/trending`);
      const data = await response.json();
      if (data.success) {
        setTrending(data.data);
      }
    } catch (error) {
      console.error('Error fetching trending:', error);
    }
  };

  const trainLSTM = async () => {
    if (!confirm(`Train LSTM model for ${selectedSymbol}? This may take a few minutes.`)) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/ai/lstm/train?symbol=${selectedSymbol}&epochs=50`, {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.success) {
        alert(`LSTM model trained successfully!\nSamples: ${data.data.samples}\nLoss: ${data.data.train_loss.toFixed(6)}`);
        fetchModelStatus();
      } else {
        alert(`Training failed: ${data.data.error}`);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <>
      <Head>
        <title>Enhanced AI Predictions - AI Power Trade</title>
        <meta name="description" content="Advanced AI predictions using LSTM, ML, and CoinGecko data" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
        {/* Header */}
        <div className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Brain className="w-8 h-8 text-purple-500" />
                <div>
                  <h1 className="text-2xl font-bold text-white">Enhanced AI Predictions</h1>
                  <p className="text-sm text-gray-400">LSTM + Random Forest + CoinGecko</p>
                </div>
              </div>
              <button
                onClick={() => window.location.href = '/'}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Global Market Stats */}
          {globalMarket && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="w-4 h-4 text-blue-400" />
                  <span className="text-xs text-gray-400">Total Market Cap</span>
                </div>
                <div className="text-xl font-bold text-white">
                  ${(globalMarket.total_market_cap_usd / 1e12).toFixed(2)}T
                </div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-gray-400">24h Volume</span>
                </div>
                <div className="text-xl font-bold text-white">
                  ${(globalMarket.total_volume_24h_usd / 1e9).toFixed(2)}B
                </div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-orange-400" />
                  <span className="text-xs text-gray-400">BTC Dominance</span>
                </div>
                <div className="text-xl font-bold text-white">
                  {globalMarket.bitcoin_dominance.toFixed(1)}%
                </div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                  <span className="text-xs text-gray-400">Active Coins</span>
                </div>
                <div className="text-xl font-bold text-white">
                  {globalMarket.active_cryptocurrencies.toLocaleString()}
                </div>
              </div>
            </div>
          )}

          {/* Model Status */}
          {modelStatus && (
            <div className="bg-gray-800 rounded-lg p-6 mb-8 border border-gray-700">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-500" />
                AI Model Status
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* LSTM */}
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-white">LSTM Neural Network</span>
                    {modelStatus.lstm?.is_trained ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  <div className="text-xs text-gray-400">
                    Status: {modelStatus.lstm?.is_trained ? 'Trained' : 'Not Trained'}
                  </div>
                  {modelStatus.lstm?.sequence_length && (
                    <div className="text-xs text-gray-400">
                      Sequence: {modelStatus.lstm.sequence_length} points
                    </div>
                  )}
                </div>

                {/* Random Forest */}
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-white">Random Forest</span>
                    {modelStatus.random_forest?.is_trained ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  <div className="text-xs text-gray-400">
                    Status: {modelStatus.random_forest?.is_trained ? 'Trained' : 'Not Trained'}
                  </div>
                  {modelStatus.random_forest?.n_estimators && (
                    <div className="text-xs text-gray-400">
                      Trees: {modelStatus.random_forest.n_estimators}
                    </div>
                  )}
                </div>

                {/* CoinGecko */}
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-white">CoinGecko API</span>
                    {modelStatus.coingecko?.available ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  <div className="text-xs text-gray-400">
                    Status: {modelStatus.coingecko?.available ? 'Connected' : 'Unavailable'}
                  </div>
                  <div className="text-xs text-gray-400">
                    Free Tier
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Symbol Selector */}
          <div className="bg-gray-800 rounded-lg p-6 mb-8 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Select Cryptocurrency</h2>
              <button
                onClick={trainLSTM}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Train LSTM Model
              </button>
            </div>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
              {SYMBOLS.map(symbol => (
                <button
                  key={symbol}
                  onClick={() => setSelectedSymbol(symbol)}
                  className={`px-4 py-3 rounded-lg font-semibold transition ${
                    selectedSymbol === symbol
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {symbol}
                </button>
              ))}
            </div>
          </div>

          {/* Enhanced Prediction Card */}
          <div className="mb-8">
            <EnhancedPredictionCard symbol={selectedSymbol} apiUrl={API_URL} />
          </div>

          {/* Trending Coins */}
          {trending.length > 0 && (
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-orange-500" />
                Trending Cryptocurrencies
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {trending.slice(0, 10).map((coin, index) => (
                  <div key={coin.id} className="bg-gray-700/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg font-bold text-purple-400">#{index + 1}</span>
                      <span className="text-sm font-semibold text-white">{coin.symbol.toUpperCase()}</span>
                    </div>
                    <div className="text-xs text-gray-400">{coin.name}</div>
                    {coin.market_cap_rank && (
                      <div className="text-xs text-gray-500 mt-1">
                        Rank: #{coin.market_cap_rank}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
