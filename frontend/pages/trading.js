import React, { useState, useEffect } from 'react';
import { Activity, TrendingUp, Shield, Database, Zap, CheckCircle, AlertCircle, ArrowRight, BarChart3, DollarSign } from 'lucide-react';

const API_URL = 'http://localhost:8000';

export default function AITradingSmartContract() {
  const [activeStep, setActiveStep] = useState(0);
  const [marketData, setMarketData] = useState({ price: 50000, change: 0, volume: 0 });
  const [aiSignal, setAiSignal] = useState(null);
  const [contractStatus, setContractStatus] = useState('idle');
  const [tradeHistory, setTradeHistory] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [systemStatus, setSystemStatus] = useState({ balance: 10000, pnl: 0, daily_loss: 0 });
  const [riskCheck, setRiskCheck] = useState(null);
  const [oracleData, setOracleData] = useState(null);
  const [onChainRecords, setOnChainRecords] = useState([]);

  // Fetch market data from backend
  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const response = await fetch(`${API_URL}/api/market-data`);
        const data = await response.json();
        setMarketData(data);
      } catch (error) {
        console.error('Failed to fetch market data:', error);
      }
    };

    fetchMarketData();
    const interval = setInterval(fetchMarketData, 2000);
    return () => clearInterval(interval);
  }, []);

  // Fetch system status
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch(`${API_URL}/api/status`);
        const data = await response.json();
        setSystemStatus(data);
      } catch (error) {
        console.error('Failed to fetch status:', error);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  // Fetch on-chain records
  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const response = await fetch(`${API_URL}/api/on-chain-records`);
        const data = await response.json();
        setOnChainRecords(data);
      } catch (error) {
        console.error('Failed to fetch records:', error);
      }
    };

    fetchRecords();
    const interval = setInterval(fetchRecords, 5000);
    return () => clearInterval(interval);
  }, []);

  // Run full trading cycle with backend integration
  const runTradingCycle = async () => {
    setIsRunning(true);
    setRiskCheck(null);
    setOracleData(null);
    
    try {
      // Step 0: Market Data Ingestion
      setActiveStep(0);
      await delay(1000);
      
      // Step 1: AI Analysis
      setActiveStep(1);
      await delay(1500);
      
      // Call backend API for full trading cycle
      const response = await fetch(`${API_URL}/api/trading-cycle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const result = await response.json();
      
      // Update AI Signal
      if (result.ai_signal) {
        setAiSignal({
          type: result.ai_signal.signal,
          confidence: result.ai_signal.confidence,
          price: result.ai_signal.price
        });
      }
      
      // Step 2: Risk Management
      setActiveStep(2);
      await delay(1500);
      if (result.risk_check) {
        setRiskCheck(result.risk_check);
      }
      
      // Step 3: Oracle Verification
      setActiveStep(3);
      await delay(1500);
      if (result.oracle_data) {
        setOracleData(result.oracle_data);
      }
      
      // Step 4: Smart Contract Validation
      setActiveStep(4);
      setContractStatus('validating');
      await delay(2000);
      
      if (!result.success) {
        setContractStatus('rejected');
        await delay(2000);
        setActiveStep(0);
        setContractStatus('idle');
        setIsRunning(false);
        return;
      }
      
      setContractStatus('approved');
      
      // Step 5: Execution
      setActiveStep(5);
      await delay(1500);
      
      // Step 6: Settlement
      setActiveStep(6);
      await delay(1500);
      
      // Add to trade history
      if (result.trade_result) {
        setTradeHistory(prev => [{
          id: Date.now(),
          signal: result.trade_result.signal,
          price: result.trade_result.price,
          profit: result.trade_result.profit,
          timestamp: new Date(result.trade_result.timestamp).toLocaleTimeString(),
          blockHash: result.on_chain_record?.block_hash
        }, ...prev.slice(0, 9)]);
      }
      
    } catch (error) {
      console.error('Trading cycle error:', error);
      setContractStatus('rejected');
    }
    
    await delay(1000);
    setActiveStep(0);
    setContractStatus('idle');
    setIsRunning(false);
  };

  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

  const steps = [
    { icon: Database, label: 'Market Data Ingestion', desc: 'Mengambil data dari WEEX API' },
    { icon: Activity, label: 'AI Analysis', desc: 'Prediksi & Signal Generation' },
    { icon: Shield, label: 'Risk Management', desc: 'Evaluasi Risk Parameters' },
    { icon: Zap, label: 'Oracle Verification', desc: 'Verifikasi & Enkripsi Data' },
    { icon: CheckCircle, label: 'Smart Contract', desc: 'Validasi On-chain Rules' },
    { icon: TrendingUp, label: 'Order Execution', desc: 'Eksekusi ke Exchange' },
    { icon: Database, label: 'Settlement', desc: 'Pencatatan On-chain' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            AI Trading + Smart Contract 2.0
          </h1>
          <p className="text-slate-300">Sistem Trading Terdesentralisasi dengan Validasi On-chain</p>
        </div>

        {/* System Status Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-800/50 backdrop-blur rounded-lg p-4 border border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-green-400" />
              <span className="text-sm text-slate-400">Balance</span>
            </div>
            <div className="text-2xl font-bold">${systemStatus.balance?.toFixed(2)}</div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur rounded-lg p-4 border border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-slate-400">Total P&L</span>
            </div>
            <div className={`text-2xl font-bold ${systemStatus.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {systemStatus.pnl >= 0 ? '+' : ''}{systemStatus.pnl?.toFixed(2)}
            </div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur rounded-lg p-4 border border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-slate-400">Daily Loss</span>
            </div>
            <div className="text-2xl font-bold text-yellow-400">${systemStatus.daily_loss?.toFixed(2)}</div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur rounded-lg p-4 border border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-slate-400">Trades</span>
            </div>
            <div className="text-2xl font-bold">{tradeHistory.length}</div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Market Data */}
          <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Market Data</h3>
              <Database className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-3xl font-bold mb-2">
              ${marketData.price?.toFixed(2)}
            </div>
            <div className={`text-sm ${marketData.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {marketData.change >= 0 ? '↑' : '↓'} {Math.abs(marketData.change || 0).toFixed(2)}%
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Vol: {marketData.volume?.toFixed(0)}
            </div>
          </div>

          {/* AI Signal */}
          <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">AI Signal</h3>
              <Activity className="w-5 h-5 text-cyan-400" />
            </div>
            {aiSignal ? (
              <>
                <div className={`text-3xl font-bold mb-2 ${aiSignal.type === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>
                  {aiSignal.type}
                </div>
                <div className="text-sm text-slate-400">
                  Confidence: {aiSignal.confidence}%
                </div>
              </>
            ) : (
              <div className="text-slate-500">Waiting for signal...</div>
            )}
          </div>

          {/* Smart Contract Status */}
          <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Contract Status</h3>
              <Shield className="w-5 h-5 text-purple-400" />
            </div>
            <div className="text-2xl font-bold capitalize mb-2">
              {contractStatus === 'idle' && <span className="text-slate-400">Idle</span>}
              {contractStatus === 'validating' && <span className="text-yellow-400">Validating...</span>}
              {contractStatus === 'approved' && <span className="text-green-400">✓ Approved</span>}
              {contractStatus === 'rejected' && <span className="text-red-400">✗ Rejected</span>}
            </div>
          </div>
        </div>

        {/* Control Panel */}
        <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700 mb-8">
          <button
            onClick={runTradingCycle}
            disabled={isRunning}
            className={`w-full py-4 rounded-lg font-semibold text-lg transition-all ${
              isRunning
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg hover:shadow-xl'
            }`}
          >
            {isRunning ? 'Trading Cycle Running...' : 'Start Trading Cycle'}
          </button>
        </div>

        {/* Process Flow */}
        <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700 mb-8">
          <h3 className="text-xl font-semibold mb-6">Alur Data End-to-End</h3>
          <div className="space-y-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = activeStep === index;
              const isPassed = activeStep > index;
              
              return (
                <div key={index} className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    isActive ? 'bg-blue-600 ring-4 ring-blue-400/30 scale-110' :
                    isPassed ? 'bg-green-600' :
                    'bg-slate-700'
                  }`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className={`font-semibold ${isActive ? 'text-blue-400' : isPassed ? 'text-green-400' : 'text-slate-400'}`}>
                      {step.label}
                    </div>
                    <div className="text-sm text-slate-500">{step.desc}</div>
                  </div>
                  {index < steps.length - 1 && (
                    <ArrowRight className={`w-5 h-5 ${isPassed ? 'text-green-400' : 'text-slate-700'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Additional Info Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Risk Management Status */}
          {riskCheck && (
            <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-yellow-400" />
                Risk Management
              </h3>
              <div className={`p-4 rounded-lg ${riskCheck.approved ? 'bg-green-600/20' : 'bg-red-600/20'}`}>
                <div className="font-semibold mb-2">
                  {riskCheck.approved ? '✓ Approved' : '✗ Rejected'}
                </div>
                <div className="text-sm text-slate-300">{riskCheck.reason}</div>
              </div>
            </div>
          )}

          {/* Oracle Verification */}
          {oracleData && (
            <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                Oracle Layer
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-sm">Data Verified</span>
                </div>
                <div className="text-xs text-slate-400 font-mono break-all">
                  Hash: {oracleData.hash?.substring(0, 16)}...
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Trade History */}
        <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700">
          <h3 className="text-xl font-semibold mb-4">Trade History (On-chain Records)</h3>
          {tradeHistory.length === 0 ? (
            <div className="text-center text-slate-500 py-8">
              No trades yet. Start a trading cycle to see results.
            </div>
          ) : (
            <div className="space-y-3">
              {tradeHistory.map((trade) => (
                <div key={trade.id} className="bg-slate-700/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-4">
                      <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        trade.signal === 'BUY' ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'
                      }`}>
                        {trade.signal}
                      </div>
                      <div>
                        <div className="font-semibold">${trade.price}</div>
                        <div className="text-xs text-slate-400">{trade.timestamp}</div>
                      </div>
                    </div>
                    <div className={`text-lg font-bold ${parseFloat(trade.profit) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {parseFloat(trade.profit) >= 0 ? '+' : ''}{trade.profit} USDT
                    </div>
                  </div>
                  {trade.blockHash && (
                    <div className="text-xs text-slate-500 font-mono">
                      Block: {trade.blockHash}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* On-chain Records */}
        {onChainRecords.length > 0 && (
          <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700 mt-8">
            <h3 className="text-xl font-semibold mb-4">Recent On-chain Records</h3>
            <div className="space-y-2">
              {onChainRecords.slice(0, 5).map((record) => (
                <div key={record.id} className="bg-slate-700/30 rounded-lg p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Block #{record.id}</span>
                    <span className="font-mono text-xs text-slate-500">{record.block_hash}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          <div className="bg-slate-800/30 backdrop-blur rounded-lg p-4 border border-slate-700">
            <h4 className="font-semibold mb-2 text-blue-400">🔍 Transparansi Penuh</h4>
            <p className="text-sm text-slate-400">Semua keputusan tercatat di blockchain</p>
          </div>
          <div className="bg-slate-800/30 backdrop-blur rounded-lg p-4 border border-slate-700">
            <h4 className="font-semibold mb-2 text-cyan-400">🛡️ Audit Trail</h4>
            <p className="text-sm text-slate-400">Keputusan AI dapat diverifikasi</p>
          </div>
          <div className="bg-slate-800/30 backdrop-blur rounded-lg p-4 border border-slate-700">
            <h4 className="font-semibold mb-2 text-purple-400">⚡ Otomatis & Aman</h4>
            <p className="text-sm text-slate-400">Settlement diatur oleh smart contract</p>
          </div>
        </div>
      </div>
    </div>
  );
}