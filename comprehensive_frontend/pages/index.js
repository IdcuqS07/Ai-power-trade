import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import Link from 'next/link'
import { ethers } from 'ethers'
import { TrendingUp, TrendingDown, Activity, DollarSign, BarChart3, Shield, CheckCircle, XCircle, History, LineChart, BarChart3 as BacktestIcon, Wallet, User, Brain } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://soon-damages-wide-drive.trycloudflare.com'
const CONTRACT_ADDRESS = '0xA2E0F4A542b700f437c27Ce28B31499023d9a53A'

// Use proper ABI from contract
const CONTRACT_ABI = [
  {
    "inputs": [
      {"internalType": "string", "name": "_symbol", "type": "string"},
      {"internalType": "string", "name": "_tradeType", "type": "string"},
      {"internalType": "uint256", "name": "_amount", "type": "uint256"},
      {"internalType": "uint256", "name": "_price", "type": "uint256"}
    ],
    "name": "executeTrade",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
]

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState({
    current_price: 0,
    prediction: 0,
    confidence: 0,
    recommendation: 'HOLD',
    balance: 10000,
    total_trades: 0,
    win_rate: 0,
    total_profit: 0,
    active_position: null,
    recent_trades: [],
    market_data: {
      symbol: 'BTC',
      price: 0,
      change_24h: 0
    },
    prices: {
      'BTC': { price: 0, change_24h: 0 },
      'ETH': { price: 0, change_24h: 0 },
      'BNB': { price: 0, change_24h: 0 },
      'SOL': { price: 0, change_24h: 0 },
      'XRP': { price: 0, change_24h: 0 },
      'ADA': { price: 0, change_24h: 0 },
      'MATIC': { price: 0, change_24h: 0 },
      'LINK': { price: 0, change_24h: 0 }
    },
    current_signal: {
      signal: 'HOLD',
      confidence: 0,
      risk_score: 0,
      position_size: 0,
      buy_score: 0,
      combined_confidence: 0
    },
    portfolio: {
      total_value: 10000,
      profit_loss: 0,
      profit_loss_pct: 0,
      positions_count: 0
    },
    performance: {
      total_trades: 0,
      winning_trades: 0,
      losing_trades: 0,
      win_rate: 0,
      total_profit: 0
    },
    smart_contract: {
      risk_limits: {
        max_position_size_pct: 10,
        max_daily_loss_pct: 5,
        min_confidence: 0.7
      }
    },
    oracle: {}
  })
  const [loading, setLoading] = useState(true)
  const [executing, setExecuting] = useState(false)
  const [tradeResult, setTradeResult] = useState(null)
  const [dataSource, setDataSource] = useState('Loading...')
  const [account, setAccount] = useState(null)
  const [blockchainBalance, setBlockchainBalance] = useState(0)
  const [tradePercentage, setTradePercentage] = useState(10)
  const [selectedCoin, setSelectedCoin] = useState('BTC')
  const [fullPerformance, setFullPerformance] = useState(null)
  const [user, setUser] = useState(null)

  // Logout function
  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
    setUser(null)
  }

  // Define functions before useEffect
  const addTokenToMetaMask = async () => {
    if (typeof window === 'undefined' || !window.ethereum) return
    
    try {
      await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: CONTRACT_ADDRESS,
            symbol: 'atUSDT',
            decimals: 18,
            image: 'https://cryptologos.cc/logos/tether-usdt-logo.png'
          },
        },
      })
    } catch (error) {
      // User rejected or error - silently fail
      console.log('Token add skipped:', error.message)
    }
  }

  const fetchBlockchainBalance = useCallback(async (address) => {
    if (typeof window === 'undefined' || !window.ethereum) {
      console.log('Window.ethereum not available')
      return
    }
    
    try {
      console.log('Fetching balance for address:', address)
      console.log('Contract address:', CONTRACT_ADDRESS)
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const network = await provider.getNetwork()
      console.log('Connected to network:', network.name, network.chainId)
      
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider)
      const balance = await contract.balanceOf(address)
      const formattedBalance = parseFloat(ethers.utils.formatEther(balance))
      console.log('Blockchain balance:', formattedBalance)
      setBlockchainBalance(formattedBalance)
    } catch (error) {
      console.error('Balance fetch error:', error.message)
      console.error('Full error:', error)
    }
  }, [])

  const fetchFullPerformance = useCallback(async () => {
    try {
      // Use proxy API to avoid mixed content issues (HTTPS -> HTTP blocked)
      const response = await fetch('/api/performance')
      const data = await response.json()
      if (data && data.data) {
        setFullPerformance(data.data)
      }
    } catch (error) {
      console.error('Error fetching full performance:', error.message)
      // Set fallback data
      setFullPerformance({
        total_trades: 0,
        winning_trades: 0,
        losing_trades: 0,
        win_rate: 0,
        total_profit: 0,
        avg_profit: 0
      })
    }
  }, [])

  const fetchDashboard = useCallback(async () => {
    console.log('=== FETCHING DASHBOARD FOR COIN:', selectedCoin, '===')
    
    // ALWAYS fetch Binance prices first (highest priority)
    let binancePrices = {}
    try {
      console.log('→ Fetching Binance prices from proxy API...')
      const pricesResponse = await fetch('/api/market/prices')
      console.log('→ Prices response status:', pricesResponse.status)
      
      if (pricesResponse.ok) {
        const pricesData = await pricesResponse.json()
        console.log('→ Binance prices data:', pricesData)
        
        if (pricesData.success && pricesData.data) {
          // Convert Binance format to our format
          Object.entries(pricesData.data).forEach(([symbol, info]) => {
            binancePrices[symbol] = {
              price: info.price,
              change_24h: info.change_24h
            }
          })
          console.log('✓ Successfully formatted Binance prices:', Object.keys(binancePrices).length, 'coins')
        }
      }
    } catch (priceError) {
      console.error('✗ Error fetching Binance prices:', priceError.message)
    }

    // If we got Binance prices, use them immediately
    if (Object.keys(binancePrices).length > 0) {
      console.log('✓ Using Binance prices directly, count:', Object.keys(binancePrices).length)
      console.log('✓ Sample price BTC:', binancePrices['BTC'])
      
      const newData = {
        ...dashboardData,
        prices: { ...binancePrices },
        market_data: {
          symbol: selectedCoin,
          price: binancePrices[selectedCoin]?.price || 0,
          change_24h: binancePrices[selectedCoin]?.change_24h || 0
        }
      }
      console.log('✓ Setting dashboard data with prices:', Object.keys(newData.prices).length)
      setDashboardData(newData)
      setDataSource('🟢 Binance Live')
      setLoading(false)
    } else {
      console.log('✗ No Binance prices received - using demo data')
      setDataSource('🟡 Demo Mode (API unavailable)')
      setLoading(false)
    }

    // Then try to fetch full dashboard data from backend (includes AI signal)
    try {
      console.log('→ Fetching backend dashboard data for', selectedCoin, 'via proxy...')
      
      // Use proxy API to avoid CORS and mixed content issues
      const response = await fetch(`/api/dashboard?symbol=${selectedCoin}`)
      
      if (response.ok) {
        const data = await response.json()
        if (data && data.data) {
          const isCached = data.source === 'cache' || data.data.cache_hit
          console.log('✓ Got backend dashboard data', isCached ? '(from cache ⚡)' : '(fresh)')
          console.log('  → Signal:', data.data.current_signal?.signal)
          console.log('  → Confidence:', data.data.current_signal?.confidence)
          console.log('  → Risk Score:', data.data.current_signal?.risk_score)
          console.log('  → Buy Score:', data.data.current_signal?.buy_score)
          console.log('  → Sell Score:', data.data.current_signal?.sell_score)
          
          // Merge backend data with Binance prices (Binance prices take priority)
          const mergedData = {
            ...data.data,
            prices: Object.keys(binancePrices).length > 0 ? { ...binancePrices } : data.data.prices
          }
          
          console.log('✓ Setting dashboard with AI signal data')
          setDashboardData(mergedData)
          setDataSource(isCached ? '🟢 Binance + AI (cached ⚡)' : '🟢 Binance + AI Live')
          
          // Fetch full performance stats in background
          fetchFullPerformance()
        }
      }
    } catch (backendError) {
      console.log('✗ Backend dashboard not available:', backendError.message)
      // This is OK - we already have Binance prices
    }
    
    console.log('=== DASHBOARD FETCH COMPLETE ===')
  }, [fetchFullPerformance, selectedCoin])

  const checkMetaMask = useCallback(async () => {
    if (typeof window === 'undefined') return
    
    // First, try to load from localStorage
    const savedAddress = localStorage.getItem('wallet_address')
    if (savedAddress) {
      console.log('Loading wallet from localStorage:', savedAddress)
      setAccount(savedAddress)
      fetchBlockchainBalance(savedAddress)
    }
    
    // Then check MetaMask
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' })
        if (accounts.length > 0) {
          console.log('MetaMask connected:', accounts[0])
          setAccount(accounts[0])
          // Save to localStorage for persistence
          localStorage.setItem('wallet_address', accounts[0])
          fetchBlockchainBalance(accounts[0])
          // Auto-add token to MetaMask
          await addTokenToMetaMask()
        }
      } catch (error) {
        console.error('MetaMask error:', error)
      }
    }
  }, [fetchBlockchainBalance])

  useEffect(() => {
    let mounted = true
    let intervalId = null
    
    const init = async () => {
      if (!mounted) return
      
      // IMMEDIATELY load wallet from localStorage (before any async operations)
      if (typeof window !== 'undefined') {
        const savedAddress = localStorage.getItem('wallet_address')
        if (savedAddress) {
          console.log('🔵 Loading wallet from localStorage immediately:', savedAddress)
          setAccount(savedAddress)
          // Start fetching balance in background
          fetchBlockchainBalance(savedAddress)
        }
        
        // Check if user is logged in
        const storedUser = localStorage.getItem('user')
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser))
          } catch (e) {
            console.error('Error parsing user data:', e)
          }
        }
      }
      
      // Fetch dashboard data
      await fetchDashboard()
      
      if (!mounted) return
      
      // Check MetaMask (this will update if different from localStorage)
      await checkMetaMask()
      
      // Start interval after initial load
      if (mounted) {
        intervalId = setInterval(() => {
          if (mounted) {
            fetchDashboard()
          }
        }, 10000)
      }
    }
    
    init()
    
    return () => {
      mounted = false
      if (intervalId) {
        clearInterval(intervalId)
        intervalId = null
      }
    }
  }, [fetchDashboard, checkMetaMask, selectedCoin])

  const executeTrade = async (symbol) => {
    if (!account) {
      setTradeResult({ success: false, reason: 'Please connect MetaMask first! Go to Wallet page.' })
      return
    }

    setExecuting(true)
    setTradeResult(null)
    
    if (typeof window === 'undefined' || !window.ethereum) {
      setTradeResult({ success: false, message: 'MetaMask not available' })
      setExecuting(false)
      return
    }
    
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
      
      const signal = dashboardData.current_signal
      const currentPrice = dashboardData.prices[symbol]?.price || 50000
      
      // Calculate trade amount (percentage of balance)
      const tradeAmountFloat = blockchainBalance * (tradePercentage / 100)
      
      if (blockchainBalance < 1) {
        setTradeResult({ success: false, reason: 'Insufficient balance. Claim tokens from Wallet page first!' })
        setExecuting(false)
        return
      }
      
      if (tradeAmountFloat < 0.01) {
        setTradeResult({ success: false, reason: 'Trade amount too small. Minimum 0.01 atUSDT' })
        setExecuting(false)
        return
      }
      
      // Convert to Wei (18 decimals) - use parseEther for clean conversion
      const tradeAmount = ethers.utils.parseEther(tradeAmountFloat.toString())
      
      // Price as simple integer (no decimals for now to avoid issues)
      // Example: 50000.50 -> 50000
      const priceInteger = Math.floor(currentPrice)
      
      // Clean string parameters
      const cleanSymbol = String(symbol).trim().toUpperCase()
      const cleanTradeType = String(signal.signal).trim().toUpperCase()
      
      console.log('Trade params:', {
        symbol: cleanSymbol,
        tradeType: cleanTradeType,
        amount: tradeAmount.toString(),
        amountHex: tradeAmount.toHexString(),
        price: priceInteger,
        amountInTokens: tradeAmountFloat,
        accountBalance: blockchainBalance
      })
      
      // Check MATIC balance for gas
      const bnbBalance = await provider.getBalance(account)
      const bnbBalanceEth = ethers.utils.formatEther(bnbBalance)
      console.log('MATIC balance:', bnbBalanceEth)
      
      if (parseFloat(bnbBalanceEth) < 0.001) {
        setTradeResult({ 
          success: false, 
          reason: `Insufficient MATIC for gas! You have ${parseFloat(bnbBalanceEth).toFixed(4)} MATIC. Get free MATIC from: https://testnet.faucet.polygon.technology` 
        })
        setExecuting(false)
        return
      }
      
      // Check actual contract balance
      const contractBalance = await contract.balanceOf(account)
      const contractBalanceFormatted = parseFloat(ethers.utils.formatEther(contractBalance))
      console.log('Contract balance:', contractBalanceFormatted)
      
      if (contractBalanceFormatted < tradeAmountFloat) {
        setTradeResult({ 
          success: false, 
          reason: `Insufficient atUSDT balance. You have ${contractBalanceFormatted.toFixed(2)} atUSDT but trying to trade ${tradeAmountFloat.toFixed(2)} atUSDT` 
        })
        setExecuting(false)
        return
      }
      
      setTradeResult({ success: true, message: 'Estimating gas...' })
      
      // Estimate gas first
      try {
        const gasEstimate = await contract.estimateGas.executeTrade(
          cleanSymbol,
          cleanTradeType,
          tradeAmount,
          priceInteger
        )
        console.log('Gas estimate:', gasEstimate.toString())
        
        setTradeResult({ success: true, message: 'Sending transaction to blockchain...' })
        
        // Send transaction with gas buffer
        const tx = await contract.executeTrade(
          cleanSymbol,
          cleanTradeType,
          tradeAmount,
          priceInteger,
          {
            gasLimit: gasEstimate.mul(120).div(100) // 20% buffer
          }
        )
        
        console.log('Transaction sent:', tx.hash)
        setTradeResult({ success: true, message: `Transaction sent! Hash: ${tx.hash.slice(0, 10)}... Waiting for confirmation...` })
        
        const receipt = await tx.wait()
        console.log('Transaction confirmed:', receipt)
        
        if (receipt.status === 0) {
          setTradeResult({ success: false, reason: 'Transaction failed on blockchain. Check BscScan for details.' })
          setExecuting(false)
          return
        }
      } catch (estimateError) {
        console.error('Gas estimation failed:', estimateError)
        console.log('⚠️ Blockchain trade failed, falling back to simulated trade...')
        
        // FALLBACK: Execute simulated trade via backend API
        try {
          setTradeResult({ success: true, message: 'Blockchain unavailable, executing simulated trade...' })
          
          const simulatedTradeData = {
            symbol: cleanSymbol,
            trade_type: cleanTradeType,
            amount: tradeAmountFloat,
            price: priceInteger,
            wallet_address: account,
            confidence: signal.confidence,
            risk_score: signal.risk_score
          }
          
          console.log('Sending simulated trade:', simulatedTradeData)
          
          const response = await fetch('/api/trades/execute-simulated', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(simulatedTradeData)
          })
          
          if (!response.ok) {
            throw new Error('Simulated trade API failed')
          }
          
          const result = await response.json()
          console.log('Simulated trade result:', result)
          
          if (result.success) {
            setTradeResult({ 
              success: true, 
              trade: {
                trade_id: result.trade_id || 'SIM-' + Date.now(),
                symbol: cleanSymbol,
                type: cleanTradeType,
                price: priceInteger,
                confidence: signal.confidence,
                amount: tradeAmountFloat,
                mode: 'SIMULATED'
              }
            })
            
            // Refresh dashboard to show updated stats
            setTimeout(() => {
              fetchDashboard()
            }, 1000)
          } else {
            throw new Error(result.message || 'Simulated trade failed')
          }
          
          setExecuting(false)
          return
          
        } catch (simulatedError) {
          console.error('Simulated trade also failed:', simulatedError)
          
          // If even simulated trade fails, show error
          let revertReason = 'Unknown error'
          if (estimateError.reason) {
            revertReason = estimateError.reason
          } else if (estimateError.message) {
            if (estimateError.message.includes('Insufficient balance')) {
              revertReason = 'Insufficient atUSDT balance in contract'
            } else if (estimateError.message.includes('Amount must be > 0')) {
              revertReason = 'Trade amount must be greater than 0'
            } else {
              revertReason = estimateError.message
            }
          }
          
          setTradeResult({ 
            success: false, 
            reason: `Contract error: ${revertReason}. Simulated trade also failed: ${simulatedError.message}` 
          })
          setExecuting(false)
          return
        }
      }
      
      setTradeResult({ 
        success: true, 
        trade: {
          trade_id: 'On-Chain',
          symbol: symbol,
          type: signal.signal,
          price: currentPrice,
          confidence: signal.confidence,
          tx_hash: tx.hash
        }
      })
      
      fetchBlockchainBalance(account)
      
    } catch (error) {
      console.error('Trade error:', error)
      
      let errorMessage = 'Trade failed: '
      
      if (error.code === 4001) {
        errorMessage += 'Transaction rejected by user'
      } else if (error.code === -32603) {
        errorMessage += 'Internal error. Check your balance and gas.'
      } else if (error.message?.includes('insufficient funds')) {
        errorMessage += 'Insufficient MATIC for gas fees'
      } else if (error.message?.includes('Insufficient balance')) {
        errorMessage += 'Insufficient atUSDT balance'
      } else if (error.message?.includes('Amount must be > 0')) {
        errorMessage += 'Trade amount must be greater than 0'
      } else if (error.reason) {
        errorMessage += error.reason
      } else if (error.message) {
        errorMessage += error.message
      } else {
        errorMessage += 'Unknown error. Check console for details.'
      }
      
      setTradeResult({ success: false, reason: errorMessage })
    }
    
    setExecuting(false)
  }

  if (loading || !dashboardData) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <div className="text-white text-xl">Loading Dashboard...</div>
          <div className="text-gray-400 text-sm mt-2">Fetching market data and performance stats</div>
        </div>
      </div>
    )
  }

  const { 
    prices = {}, 
    current_signal = { signal: 'HOLD', confidence: 0.5, risk_score: 50, position_size: 5, buy_score: 0, sell_score: 0, combined_confidence: 0.5 }, 
    portfolio = { total_value: 10000, profit_loss: 0, profit_loss_pct: 0, positions_count: 0 }, 
    performance = { total_trades: 0, winning_trades: 0, losing_trades: 0, win_rate: 0, total_profit: 0 }, 
    smart_contract = { 
      risk_limits: { max_position_size_pct: 10, max_daily_loss_pct: 5, min_confidence: 0.7 },
      total_validations: 0,
      validation_pass_rate: 0,
      total_records: 0,
      total_settlements: 0
    }, 
    oracle = {
      total_verifications: 0,
      verification_rate: 0
    } 
  } = dashboardData || {}
  
  console.log('Rendering with prices:', prices)
  
  // Use full performance if available, otherwise use quick stats from dashboard
  const displayPerformance = fullPerformance || performance

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">AI Trading Platform</h1>
            <p className="text-gray-400">Comprehensive Trading System dengan AI, Smart Contract & Oracle</p>
            <div className="mt-2 flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Data Source:</span>
                <span className={`text-sm font-semibold ${
                  dataSource.includes('Binance') ? 'text-green-500' : 
                  dataSource === 'WEEX Live' ? 'text-green-500' : 'text-yellow-500'
                }`}>
                  {dataSource.includes('Binance') ? '🟢 ' + dataSource : 
                   dataSource === 'WEEX Live' ? '🟢 WEEX Live' : '🟡 ' + dataSource}
                </span>
              </div>
              {dataSource.includes('cache') && (
                <span className="text-xs bg-blue-600 px-2 py-1 rounded">⚡ Cached</span>
              )}
            </div>
          </div>
          
          {/* Auth Buttons */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg">
                  <User size={18} className="text-blue-400" />
                  <span className="text-sm font-medium">{user.username}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors">
                    Login
                  </button>
                </Link>
                <Link href="/register">
                  <button className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium transition-colors">
                    Register
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
        
        {/* Navigation Links */}
        <div className="mt-6">
          <div className="flex gap-3 flex-wrap">
            <Link href="/ai-explainer" className="flex items-center gap-2 bg-purple-800 hover:bg-purple-700 px-4 py-2 rounded-lg transition border-2 border-purple-400 animate-pulse">
              <Brain size={20} />
              <span>AI Explainer</span>
              <span className="text-xs bg-purple-600 px-2 py-0.5 rounded">🔥 NEW</span>
            </Link>
            <Link href="/wallet" className="flex items-center gap-2 bg-green-800 hover:bg-green-700 px-4 py-2 rounded-lg transition border border-green-500">
              <Wallet size={20} />
              <span>Wallet</span>
            </Link>
            <Link href="/profile" className="flex items-center gap-2 bg-blue-800 hover:bg-blue-700 px-4 py-2 rounded-lg transition border border-blue-500">
              <User size={20} />
              <span>Profile</span>
            </Link>
            <Link href="/trades" className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition">
              <History size={20} />
              <span>Trades</span>
            </Link>
            <Link href="/analytics" className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition">
              <LineChart size={20} />
              <span>Analytics</span>
            </Link>
            <Link href="/backtest" className="flex items-center gap-2 bg-purple-800 hover:bg-purple-700 px-4 py-2 rounded-lg transition border border-purple-500">
              <BarChart3 size={20} />
              <span>Backtest</span>
            </Link>
          </div>
        </div>
      </div>

      {/* MetaMask Warning */}
      {!account && (
        <div className="bg-yellow-900/30 border border-yellow-500 rounded-lg p-4 mb-6">
          <p className="text-yellow-400 font-semibold">
            ⚠️ Connect MetaMask on Wallet page to use blockchain trading!
          </p>
        </div>
      )}

      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400">Total Value</span>
            <DollarSign className="text-green-500" size={20} />
          </div>
          <div className="text-2xl font-bold">${(portfolio?.total_value || 10000).toFixed(2)}</div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400">P&L</span>
            {(portfolio?.profit_loss || 0) >= 0 ? 
              <TrendingUp className="text-green-500" size={20} /> : 
              <TrendingDown className="text-red-500" size={20} />
            }
          </div>
          <div className={`text-2xl font-bold ${(portfolio?.profit_loss || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            ${(portfolio?.profit_loss || 0).toFixed(2)} ({(portfolio?.profit_loss_pct || 0).toFixed(2)}%)
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400">Win Rate</span>
            <BarChart3 className="text-blue-500" size={20} />
          </div>
          <div className="text-2xl font-bold">{displayPerformance.win_rate}%</div>
          <div className="text-sm text-gray-400">{displayPerformance.winning_trades}/{displayPerformance.total_trades} trades</div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400">Positions</span>
            <Activity className="text-purple-500" size={20} />
          </div>
          <div className="text-2xl font-bold">{portfolio?.positions_count || 0}</div>
        </div>

        {account && (
          <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-purple-200">Blockchain Balance</span>
              <Wallet className="text-purple-200" size={20} />
            </div>
            <div className="text-2xl font-bold">{blockchainBalance.toFixed(2)} atUSDT</div>
            <div className="text-sm text-purple-200">On Polygon Amoy Testnet</div>
          </div>
        )}
      </div>

      {/* Market Prices */}
      <div className="bg-gray-800 rounded-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Market Prices</h2>
          <span className="text-sm text-gray-400">{Object.keys(prices).length} Trading Pairs</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Object.entries(prices).map(([symbol, data]) => (
            <div key={symbol} className="bg-gray-700 rounded-lg p-4">
              <div className="text-gray-400 text-sm mb-1">{symbol}</div>
              <div className="text-xl font-bold mb-1">${data?.price?.toFixed(2) || '0.00'}</div>
              <div className={`text-sm ${(data?.change_24h || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {(data?.change_24h || 0) >= 0 ? '+' : ''}{(data?.change_24h || 0).toFixed(2)}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Signal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">AI Trading Signal</h2>
            {loading ? (
              <div className="h-5 w-24 bg-gray-700 rounded animate-pulse"></div>
            ) : current_signal.ml_prediction && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-purple-400 font-semibold">ML Enhanced</span>
              </div>
            )}
          </div>
          
          {loading ? (
            <div className="space-y-4 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="h-4 w-16 bg-gray-700 rounded"></div>
                <div className="h-10 w-24 bg-gray-700 rounded-lg"></div>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-2">
                    <div className="h-4 w-20 bg-gray-700 rounded"></div>
                    <div className="h-4 w-12 bg-gray-700 rounded"></div>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2"></div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <div className="h-4 w-24 bg-gray-700 rounded"></div>
                    <div className="h-4 w-12 bg-gray-700 rounded"></div>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2"></div>
                </div>
                <div className="flex justify-between">
                  <div className="h-4 w-28 bg-gray-700 rounded"></div>
                  <div className="h-4 w-12 bg-gray-700 rounded"></div>
                </div>
              </div>
              <div className="text-center text-sm text-gray-500 mt-4">
                Loading {selectedCoin} signal...
              </div>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400">Signal</span>
                  <span className={`px-4 py-2 rounded-lg font-bold ${
                    current_signal.signal === 'BUY' ? 'bg-green-600' :
                    current_signal.signal === 'SELL' ? 'bg-red-600' : 'bg-gray-600'
                  }`}>
                    {current_signal.signal}
                  </span>
                </div>
              </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Confidence</span>
                <span>{((current_signal?.confidence || 0) * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full" 
                  style={{ width: `${(current_signal?.confidence || 0) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Risk Score</span>
                <span>{current_signal?.risk_score || 0}/100</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    (current_signal?.risk_score || 0) < 40 ? 'bg-green-500' :
                    (current_signal?.risk_score || 0) < 70 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${current_signal?.risk_score || 0}%` }}
                />
              </div>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">Position Size</span>
              <span className="font-bold">{current_signal?.position_size || 0}%</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">Buy Score</span>
              <span className="text-green-500">{current_signal?.buy_score || 0}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">Sell Score</span>
              <span className="text-red-500">{current_signal.sell_score}</span>
            </div>
          </div>

          {/* ML Prediction Section */}
          {current_signal.ml_prediction && (
            <div className="mt-4 p-4 bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-lg border border-purple-500/30">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-2 animate-pulse"></div>
                  <span className="text-sm font-semibold text-purple-300">Machine Learning Prediction</span>
                </div>
                <span className="text-xs bg-purple-700 px-2 py-1 rounded">
                  {current_signal.ml_prediction.model}
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">ML Signal</span>
                  <span className={`px-3 py-1 rounded-lg font-bold text-sm ${
                    current_signal.ml_prediction.prediction === 'BUY' ? 'bg-green-600' : 'bg-red-600'
                  }`}>
                    {current_signal.ml_prediction.prediction}
                  </span>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Win Probability</span>
                    <span className="text-green-400">{(current_signal.ml_prediction.win_probability * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-green-400 h-2 rounded-full" 
                      style={{ width: `${current_signal.ml_prediction.win_probability * 100}%` }}
                    />
                  </div>
                </div>

                {current_signal.combined_confidence && (
                  <div className="pt-2 border-t border-purple-500/30">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Combined Confidence</span>
                      <span className="text-purple-300 font-bold">
                        {((current_signal?.combined_confidence || 0) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Rule-based + ML Average
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Coin Selector - Binance Trading Pairs */}
          <div className="mt-6 p-4 bg-gray-700 rounded-lg">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-gray-400 text-sm">Select Coin (Binance Trading)</span>
              <span className="text-xs text-gray-500">{Object.keys(prices).length} pairs</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 max-h-96 overflow-y-auto">
              {Object.entries(prices).map(([symbol, data]) => (
                <button
                  key={symbol}
                  onClick={() => setSelectedCoin(symbol)}
                  className={`p-2 rounded-lg transition ${
                    selectedCoin === symbol
                      ? 'bg-blue-600 text-white border-2 border-blue-400'
                      : 'bg-gray-600 text-gray-300 hover:bg-gray-500 border-2 border-transparent'
                  }`}
                >
                  <div className="font-bold text-xs">{symbol}</div>
                  <div className="text-xs mt-1">${data?.price?.toFixed(data?.price > 1 ? 2 : 4) || '0'}</div>
                  <div className={`text-xs ${(data?.change_24h || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {(data?.change_24h || 0) >= 0 ? '+' : ''}{(data?.change_24h || 0).toFixed(1)}%
                  </div>
                </button>
              ))}
            </div>
          </div>

              {/* Trade Amount Selector */}
              <div className="mt-4 p-4 bg-gray-700 rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-gray-400">Trade Amount</span>
                  <span className="text-xl font-bold text-blue-400">{tradePercentage}%</span>
                </div>
                
                {/* Slider */}
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={tradePercentage}
                  onChange={(e) => setTradePercentage(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${tradePercentage}%, #4b5563 ${tradePercentage}%, #4b5563 100%)`
                  }}
                />
            
            {/* Preset Buttons */}
            <div className="flex gap-2 mt-3">
              {[10, 25, 50, 75, 100].map(percent => (
                <button
                  key={percent}
                  onClick={() => setTradePercentage(percent)}
                  className={`flex-1 py-2 px-3 rounded text-sm font-semibold transition ${
                    tradePercentage === percent 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                  }`}
                >
                  {percent}%
                </button>
              ))}
            </div>
            
            {/* Amount Preview */}
            <div className="mt-3 text-center text-sm text-gray-400">
              = {(blockchainBalance * (tradePercentage / 100)).toFixed(2)} atUSDT
            </div>
          </div>

          {/* Wallet Connection Status */}
          {!account ? (
            <div className="mt-4 p-4 bg-yellow-900/30 border border-yellow-500 rounded-lg">
              <div className="text-yellow-400 text-sm mb-2">⚠️ MetaMask Not Connected</div>
              <div className="text-gray-300 text-xs mb-3">
                Connect your wallet to execute trades on blockchain
              </div>
              <Link href="/wallet" className="block w-full text-center bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition">
                Go to Wallet Page to Connect
              </Link>
            </div>
          ) : (
            <div className="mt-4 p-3 bg-green-900/30 border border-green-500 rounded-lg">
              <div className="text-green-400 text-xs mb-1">✅ Wallet Connected</div>
              <div className="text-gray-300 text-xs font-mono">
                {account.slice(0, 6)}...{account.slice(-4)}
              </div>
              <div className="text-gray-400 text-xs mt-1">
                Balance: {blockchainBalance.toFixed(2)} atUSDT
              </div>
            </div>
          )}

          <button
                onClick={() => executeTrade(selectedCoin)}
                disabled={executing || !account}
                className="w-full mt-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition"
              >
                {executing ? 'Executing...' : !account ? 'Connect Wallet First' : `Execute Trade - ${selectedCoin}`}
              </button>
            </>
          )}
        </div>

        {/* Smart Contract & Oracle */}
        <div className="space-y-4">
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Shield className="text-blue-500 mr-2" size={24} />
              <h2 className="text-xl font-bold">Smart Contract</h2>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Total Validations</span>
                <span className="font-bold">{smart_contract.total_validations}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Pass Rate</span>
                <span className="text-green-500 font-bold">{smart_contract.validation_pass_rate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">On-Chain Records</span>
                <span className="font-bold">{smart_contract.total_records}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Settlements</span>
                <span className="font-bold">{smart_contract.total_settlements}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-700">
              <div className="text-sm text-gray-400 mb-2">Risk Limits</div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Max Position</span>
                  <span>{smart_contract?.risk_limits?.max_position_size_pct || 10}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Max Daily Loss</span>
                  <span>{smart_contract?.risk_limits?.max_daily_loss_pct || 5}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Min Confidence</span>
                  <span>{((smart_contract?.risk_limits?.min_confidence || 0.7) * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <CheckCircle className="text-green-500 mr-2" size={24} />
              <h2 className="text-xl font-bold">Oracle Layer</h2>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Total Verifications</span>
                <span className="font-bold">{oracle.total_verifications}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Verification Rate</span>
                <span className="text-green-500 font-bold">{oracle.verification_rate}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trade Result */}
      {tradeResult && (
        <div className={`rounded-lg p-6 mb-8 ${tradeResult.success ? 'bg-green-900/30 border border-green-500' : 'bg-red-900/30 border border-red-500'}`}>
          <div className="flex items-center mb-4">
            {tradeResult.success ? 
              <CheckCircle className="text-green-500 mr-2" size={24} /> :
              <XCircle className="text-red-500 mr-2" size={24} />
            }
            <h3 className="text-xl font-bold">
              {tradeResult.success ? 'Trade Executed Successfully' : 'Trade Failed'}
            </h3>
          </div>
          
          {tradeResult.success && tradeResult.trade ? (
            <div className="space-y-2 text-sm">
              {tradeResult.trade.mode === 'SIMULATED' && (
                <div className="mb-3 p-2 bg-yellow-900/30 border border-yellow-500 rounded">
                  <div className="text-yellow-400 text-xs font-semibold">⚠️ SIMULATED TRADE</div>
                  <div className="text-gray-300 text-xs mt-1">
                    Blockchain unavailable. Trade recorded in database for testing.
                  </div>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-400">Trade ID</span>
                <span className="font-mono">{tradeResult.trade.trade_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Type</span>
                <span className={tradeResult.trade.type === 'BUY' ? 'text-green-500' : 'text-red-500'}>
                  {tradeResult.trade.type}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Symbol</span>
                <span className="font-bold">{tradeResult.trade.symbol}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Price</span>
                <span>${tradeResult.trade.price?.toFixed(2)}</span>
              </div>
              {tradeResult.trade.amount && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Amount</span>
                  <span>{tradeResult.trade.amount.toFixed(2)} atUSDT</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-400">Confidence</span>
                <span>{(tradeResult.trade.confidence * 100).toFixed(1)}%</span>
              </div>
              {tradeResult.trade.tx_hash && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Transaction</span>
                  <a 
                    href={`https://testnet.bscscan.com/tx/${tradeResult.trade.tx_hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 font-mono text-xs"
                  >
                    {tradeResult.trade.tx_hash.slice(0, 10)}...
                  </a>
                </div>
              )}
            </div>
          ) : tradeResult.message ? (
            <div className="text-green-400">
              {tradeResult.message}
            </div>
          ) : (
            <div className="text-red-400">
              {tradeResult.reason || 'Unknown error occurred'}
            </div>
          )}
        </div>
      )}

      {/* Performance Stats */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Performance Statistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-gray-400 text-sm">Total Trades</div>
            <div className="text-2xl font-bold">{displayPerformance.total_trades}</div>
          </div>
          <div>
            <div className="text-gray-400 text-sm">Winning Trades</div>
            <div className="text-2xl font-bold text-green-500">
              {displayPerformance.winning_trades}
              {!fullPerformance && <span className="text-xs text-gray-500 ml-1">loading...</span>}
            </div>
          </div>
          <div>
            <div className="text-gray-400 text-sm">Losing Trades</div>
            <div className="text-2xl font-bold text-red-500">
              {displayPerformance.losing_trades}
              {!fullPerformance && <span className="text-xs text-gray-500 ml-1">loading...</span>}
            </div>
          </div>
          <div>
            <div className="text-gray-400 text-sm">Total Profit</div>
            <div className={`text-2xl font-bold ${displayPerformance.total_profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              ${displayPerformance.total_profit}
              {!fullPerformance && <span className="text-xs text-gray-500 ml-1">loading...</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
