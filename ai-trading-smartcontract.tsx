import React, { useState, useEffect } from 'react';
import { Activity, TrendingUp, Shield, Database, Zap, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';

export default function AITradingSmartContract() {
  const [activeStep, setActiveStep] = useState(0);
  const [marketData, setMarketData] = useState({ price: 50000, change: 0 });
  const [aiSignal, setAiSignal] = useState(null);
  const [contractStatus, setContractStatus] = useState('idle');
  const [tradeHistory, setTradeHistory] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  // Simulasi market data real-time
  useEffect(() => {
    const interval = setInterval(() => {
      setMarketData(prev => ({
        price: prev.price + (Math.random() - 0.5) * 100,
        change: (Math.random() - 0.5) * 2
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Simulasi alur trading otomatis
  const runTradingCycle = async () => {
    setIsRunning(true);
    
    // Step 1: AI Analysis
    setActiveStep(1);
    await delay(1500);
    const signal = Math.random() > 0.5 ? 'BUY' : 'SELL';
    const confidence = (Math.random() * 30 + 70).toFixed(1);
    setAiSignal({ type: signal, confidence, price: marketData.price });
    
    // Step 2: Risk Management
    setActiveStep(2);
    await delay(1500);
    
    // Step 3: Oracle Verification
    setActiveStep(3);
    await delay(1500);
    
    // Step 4: Smart Contract Validation
    setActiveStep(4);
    setContractStatus('validating');
    await delay(2000);
    
    const isValid = Math.random() > 0.2;
    setContractStatus(isValid ? 'approved' : 'rejected');
    
    if (isValid) {
      // Step 5: Execution
      setActiveStep(5);
      await delay(1500);
      
      // Step 6: Settlement
      setActiveStep(6);
      await delay(1500);
      
      const profit = (Math.random() - 0.4) * 500;
      setTradeHistory(prev => [{
        id: Date.now(),
        signal,
        price: marketData.price.toFixed(2),
        profit: profit.toFixed(2),
        timestamp: new Date().toLocaleTimeString()
      }, ...prev.slice(0, 4)]);
    }
    
    await delay(1000);
    setActiveStep(0);
    setContractStatus('idle');
    setIsRunning(false);
  };

  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

  const steps = [
    { icon: Database, label: 'Market Data', desc: 'Mengambil data dari WEEX' },
    { icon: Activity, label: 'AI Analysis', desc: 'Prediksi & Signal Generation' },
    { icon: Shield, label: 'Risk Check', desc: 'Evaluasi Risk Management' },
    { icon: Zap, label: 'Oracle Layer', desc: 'Verifikasi & Enkripsi' },
    { icon: CheckCircle, label: 'Smart Contract', desc: 'Validasi On-chain' },
    { icon: TrendingUp, label: 'Execution', desc: 'Order ke Exchange' },
    { icon: CheckCircle, label: 'Settlement', desc: 'Pencatatan On-chain' }
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

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Market Data */}
          <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Market Data</h3>
              <Database className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-3xl font-bold mb-2">
              ${marketData.price.toFixed(2)}
            </div>
            <div className={`text-sm ${marketData.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {marketData.change >= 0 ? '↑' : '↓'} {Math.abs(marketData.change).toFixed(2)}%
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
                <div key={trade.id} className="bg-slate-700/50 rounded-lg p-4 flex items-center justify-between">
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
              ))}
            </div>
          )}
        </div>

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