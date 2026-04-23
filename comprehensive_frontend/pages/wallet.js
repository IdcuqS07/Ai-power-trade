import { useState, useEffect } from 'react'
import axios from 'axios'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { ethers } from 'ethers'
import { Wallet, ArrowUpCircle, ArrowDownCircle, History, DollarSign, TrendingUp, Home, Zap, ExternalLink } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const CONTRACT_ADDRESS = '0xC25e59ba79285018197152FF99a3BcD58D709Cf2'
const POLYGON_AMOY_PARAMS = {
  chainId: '0x13882',
  chainName: 'Polygon Amoy Testnet',
  nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
  rpcUrls: ['https://rpc-amoy.polygon.technology'],
  blockExplorerUrls: ['https://amoy.polygonscan.com']
}

// Full contract ABI for faucet function
const CONTRACT_ABI = [
  {
    "inputs": [],
    "name": "claimFaucet",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "_address", "type": "address"}],
    "name": "canClaimFaucet",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "_address", "type": "address"}],
    "name": "timeUntilNextClaim",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
]

export default function WalletPage() {
  const router = useRouter()
  const [wallet, setWallet] = useState(null)
  const [balances, setBalances] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  
  // MetaMask state
  const [account, setAccount] = useState(null)
  const [chainId, setChainId] = useState(null)
  const [tokenBalance, setTokenBalance] = useState(0)
  const [canClaim, setCanClaim] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [claiming, setClaiming] = useState(false)
  
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [operationResult, setOperationResult] = useState(null)
  
  const [depositAmount, setDepositAmount] = useState('')
  const [depositCurrency, setDepositCurrency] = useState('USDT')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawCurrency, setWithdrawCurrency] = useState('USDT')

  useEffect(() => {
    // Check if user is logged in
    if (typeof window === 'undefined') return
    
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    fetchWalletData()
    checkMetaMask()
    const interval = setInterval(fetchWalletData, 5000)
    return () => clearInterval(interval)
  }, [router])

  useEffect(() => {
    if (account) {
      fetchBlockchainBalance()
      const interval = setInterval(fetchBlockchainBalance, 10000)
      return () => clearInterval(interval)
    }
  }, [account])

  const checkMetaMask = async () => {
    if (typeof window === 'undefined' || typeof window.ethereum === 'undefined') return
    
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' })
      if (accounts.length > 0) {
        setAccount(accounts[0])
        // Save to localStorage for cross-page persistence
        localStorage.setItem('wallet_address', accounts[0])
        const chainId = await window.ethereum.request({ method: 'eth_chainId' })
        setChainId(chainId)
      }
    } catch (error) {
      console.error('MetaMask check error:', error)
    }
  }

  const connectWallet = async () => {
    if (typeof window === 'undefined' || typeof window.ethereum === 'undefined') {
      alert('Please install MetaMask!')
      window.open('https://metamask.io/download/', '_blank')
      return
    }

    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      setAccount(accounts[0])
      // Save to localStorage for cross-page persistence
      localStorage.setItem('wallet_address', accounts[0])
      console.log('Wallet connected and saved to localStorage:', accounts[0])
      
      const chainId = await window.ethereum.request({ method: 'eth_chainId' })
      setChainId(chainId)
      
      if (chainId !== POLYGON_AMOY_PARAMS.chainId) {
        await switchToPolygonAmoy()
      }
      
      // Auto-add atUSDT token to MetaMask
      await addTokenToMetaMask()
      
      setOperationResult({ success: true, message: 'Wallet connected & atUSDT token added! You can now trade on Dashboard.' })
      setTimeout(() => setOperationResult(null), 5000)
    } catch (error) {
      console.error('Connect wallet error:', error)
      setOperationResult({ success: false, message: error.message })
    }
  }

  const switchToPolygonAmoy = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: POLYGON_AMOY_PARAMS.chainId }],
      })
    } catch (switchError) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [POLYGON_AMOY_PARAMS],
          })
        } catch (addError) {
          console.error('Add network error:', addError)
        }
      }
    }
  }

  const fetchBlockchainBalance = async (retryCount = 0) => {
    if (!account) return
    
    try {
      // Try to get balance from blockchain directly first
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider)
        
        // Add timeout to prevent hanging
        const balancePromise = contract.balanceOf(account)
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('RPC timeout')), 5000)
        )
        
        const balance = await Promise.race([balancePromise, timeoutPromise])
        const balanceFormatted = parseFloat(ethers.utils.formatEther(balance))
        setTokenBalance(balanceFormatted)
        
        // Try to get claim status (with timeout)
        try {
          const canClaimPromise = contract.canClaimFaucet(account)
          const canClaimNow = await Promise.race([
            canClaimPromise, 
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
          ])
          setCanClaim(canClaimNow)
          
          const cooldownPromise = contract.timeUntilNextClaim(account)
          const cooldownSec = await Promise.race([
            cooldownPromise,
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
          ])
          setCooldown(parseInt(cooldownSec.toString()))
        } catch (claimError) {
          // Claim status failed, use defaults
          console.log('Could not fetch claim status, using defaults')
        }
        
        console.log('Balance updated:', balanceFormatted)
        return // Success, exit
      }
    } catch (error) {
      console.log('RPC error (normal on Polygon Amoy Testnet):', error.message)
      
      // Retry once if first attempt
      if (retryCount === 0) {
        console.log('Retrying balance fetch...')
        await new Promise(resolve => setTimeout(resolve, 1000))
        return fetchBlockchainBalance(1)
      }
    }
    
    // Fallback: Try backend API
    try {
      const response = await axios.get(`${API_URL}/api/blockchain/balance/${account}`, { timeout: 5000 })
      if (response.data.success) {
        setTokenBalance(response.data.data.balance)
        setCanClaim(response.data.data.can_claim_faucet)
        setCooldown(response.data.data.cooldown_seconds)
        console.log('Balance from backend API')
      }
    } catch (backendError) {
      console.log('Backend API also unavailable, keeping cached balance')
      // Keep existing balance, don't reset to 0
    }
  }

  const claimFaucet = async () => {
    if (!account) {
      alert('Please connect wallet first!')
      return
    }

    // Check if on correct network
    if (chainId !== POLYGON_AMOY_PARAMS.chainId) {
      setOperationResult({ success: false, message: 'Please switch to Polygon Amoy Testnet!' })
      await switchToPolygonAmoy()
      return
    }

    setClaiming(true)
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()
      
      // Check MATIC balance for gas
      const bnbBalance = await provider.getBalance(account)
      const bnbBalanceEth = ethers.utils.formatEther(bnbBalance)
      
      if (parseFloat(bnbBalanceEth) < 0.001) {
        setOperationResult({ 
          success: false, 
          message: `Insufficient MATIC for gas! You have ${parseFloat(bnbBalanceEth).toFixed(4)} MATIC. Get free MATIC from: https://faucet.polygon.technology` 
        })
        setClaiming(false)
        return
      }
      
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
      
      // Check if can claim
      const canClaim = await contract.canClaimFaucet(account)
      if (!canClaim) {
        const cooldownSeconds = await contract.timeUntilNextClaim(account)
        const hours = Math.floor(cooldownSeconds / 3600)
        const minutes = Math.floor((cooldownSeconds % 3600) / 60)
        setOperationResult({ 
          success: false, 
          message: `Please wait ${hours}h ${minutes}m before claiming again` 
        })
        setClaiming(false)
        return
      }
      
      setOperationResult({ success: true, message: 'Sending transaction...' })
      
      // Estimate gas first
      const gasEstimate = await contract.estimateGas.claimFaucet()
      console.log('Gas estimate:', gasEstimate.toString())
      
      // Send transaction with extra gas buffer
      const tx = await contract.claimFaucet({
        gasLimit: gasEstimate.mul(120).div(100) // 20% buffer
      })
      
      setOperationResult({ success: true, message: `Transaction sent! Hash: ${tx.hash.slice(0, 10)}... Waiting for confirmation...` })
      console.log('Transaction hash:', tx.hash)
      
      const receipt = await tx.wait()
      console.log('Transaction confirmed:', receipt)
      
      if (receipt.status === 1) {
        setOperationResult({ success: true, message: '🎉 Successfully claimed 100 atUSDT! Check your MetaMask.' })
        // Refresh balance
        setTimeout(() => {
          fetchBlockchainBalance()
        }, 2000)
      } else {
        setOperationResult({ success: false, message: 'Transaction failed. Please try again.' })
      }
      
      setTimeout(() => setOperationResult(null), 8000)
    } catch (error) {
      console.error('Claim faucet error:', error)
      
      let errorMessage = 'Claim failed: '
      
      if (error.code === 4001) {
        errorMessage += 'Transaction rejected by user'
      } else if (error.code === -32603) {
        errorMessage += 'Internal error. Please check your MATIC balance for gas.'
      } else if (error.message?.includes('insufficient funds')) {
        errorMessage += 'Insufficient MATIC for gas. Get free MATIC from: https://faucet.polygon.technology'
      } else if (error.message?.includes('Cooldown not finished')) {
        errorMessage += 'Please wait 24 hours between claims'
      } else {
        errorMessage += error.message || error.reason || 'Unknown error'
      }
      
      setOperationResult({ success: false, message: errorMessage })
    }
    setClaiming(false)
  }

  const addTokenToMetaMask = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: CONTRACT_ADDRESS,
            symbol: 'atUSDT',
            decimals: 18,
          },
        },
      })
    } catch (error) {
      console.error('Add token error:', error)
    }
  }

  const fetchWalletData = async () => {
    try {
      if (typeof window === 'undefined') return
      
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }
      
      const [walletRes, balancesRes, transactionsRes] = await Promise.all([
        axios.get(`${API_URL}/api/wallet`, { headers, timeout: 5000 }),
        axios.get(`${API_URL}/api/wallet/balances`, { headers, timeout: 5000 }),
        axios.get(`${API_URL}/api/wallet/transactions?limit=20`, { headers, timeout: 5000 })
      ])
      
      setWallet(walletRes.data.data)
      setBalances(balancesRes.data.data)
      setTransactions(transactionsRes.data.data)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching wallet data:', error)
      
      // Set demo data if backend not available
      if (!error.response || error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') {
        setWallet({
          address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
          total_balance_usd: 10000,
          available_balance: 10000,
          locked_balance: 0
        })
        setBalances([
          { currency: 'USDT', balance: 10000, locked: 0, available: 10000, usd_value: 10000 },
          { currency: 'BTC', balance: 0.1, locked: 0, available: 0.1, usd_value: 4500 },
          { currency: 'ETH', balance: 2, locked: 0, available: 2, usd_value: 5000 }
        ])
        setTransactions([])
        setLoading(false)
        return
      }
      
      if (error.response?.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
        }
        router.push('/login')
      }
    }
  }

  const handleDeposit = async () => {
    try {
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }
      const response = await axios.post(`${API_URL}/api/wallet/deposit`, {
        operation: 'deposit',
        amount: parseFloat(depositAmount),
        currency: depositCurrency
      }, { headers })
      
      setOperationResult({ success: true, message: response.data.message })
      setShowDepositModal(false)
      setDepositAmount('')
      fetchWalletData()
      
      setTimeout(() => setOperationResult(null), 5000)
    } catch (error) {
      setOperationResult({ success: false, message: error.response?.data?.detail || 'Deposit failed' })
    }
  }

  const handleWithdraw = async () => {
    try {
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }
      const response = await axios.post(`${API_URL}/api/wallet/withdraw`, {
        operation: 'withdraw',
        amount: parseFloat(withdrawAmount),
        currency: withdrawCurrency
      }, { headers })
      
      setOperationResult({ success: true, message: response.data.message })
      setShowWithdrawModal(false)
      setWithdrawAmount('')
      fetchWalletData()
      
      setTimeout(() => setOperationResult(null), 5000)
    } catch (error) {
      setOperationResult({ success: false, message: error.response?.data?.detail || 'Withdrawal failed' })
    }
  }

  const formatCooldown = (seconds) => {
    if (seconds <= 0) return 'Ready to claim!'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading wallet...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Wallet size={32} className="text-blue-500" />
              <h1 className="text-4xl font-bold">Wallet</h1>
            </div>
            <p className="text-gray-400">Manage your funds and blockchain assets</p>
          </div>
          <Link href="/" className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition">
            <Home size={20} />
            <span>Dashboard</span>
          </Link>
        </div>
      </div>

      {/* Operation Result */}
      {operationResult && (
        <div className={`rounded-lg p-4 mb-6 ${operationResult.success ? 'bg-green-900/30 border border-green-500' : 'bg-red-900/30 border border-red-500'}`}>
          <p className={operationResult.success ? 'text-green-400' : 'text-red-400'}>
            {operationResult.message}
          </p>
        </div>
      )}

      {/* MetaMask Connection & Faucet */}
      <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold mb-2">🎁 Polygon Amoy Testnet Faucet</h3>
            <p className="text-purple-200">Claim free atUSDT tokens for testing</p>
            {!account && (
              <p className="text-purple-100 text-sm mt-2">
                ⚠️ You need MATIC for gas fees. Get free MATIC first!
              </p>
            )}
          </div>
          {account && (
            <div className="text-right">
              <div className="text-sm text-purple-200">Your Balance</div>
              <div className="text-3xl font-bold">{(tokenBalance || 0).toFixed(2)} atUSDT</div>
            </div>
          )}
        </div>

        {!account ? (
          <button
            onClick={connectWallet}
            className="w-full bg-white text-purple-600 font-bold py-4 rounded-lg hover:bg-purple-50 transition flex items-center justify-center gap-2"
          >
            <Wallet size={20} />
            Connect MetaMask
          </button>
        ) : (
          <div className="space-y-4">
            <div className="bg-purple-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-purple-200">Connected Wallet</span>
                <span className="text-xs bg-green-500 px-2 py-1 rounded">Connected</span>
              </div>
              <div className="font-mono text-sm">{account.slice(0, 6)}...{account.slice(-4)}</div>
            </div>

            {canClaim ? (
              <button
                onClick={claimFaucet}
                disabled={claiming}
                className="w-full bg-white text-purple-600 font-bold py-4 rounded-lg hover:bg-purple-50 transition disabled:bg-gray-300 flex items-center justify-center gap-2"
              >
                <Zap size={20} />
                {claiming ? 'Claiming...' : 'Claim 100 atUSDT'}
              </button>
            ) : (
              <div className="text-center py-4 bg-purple-700 rounded-lg">
                <div className="text-sm text-purple-200 mb-1">Next claim available in:</div>
                <div className="text-xl font-bold">{formatCooldown(cooldown)}</div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={addTokenToMetaMask}
                className="bg-purple-700 hover:bg-purple-600 py-2 rounded-lg text-sm transition"
              >
                Add to MetaMask
              </button>
              <a
                href="https://faucet.polygon.technology"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-yellow-600 hover:bg-yellow-500 py-2 rounded-lg text-sm transition flex items-center justify-center gap-1 font-semibold"
              >
                Get MATIC
                <ExternalLink size={14} />
              </a>
              <a
                href={`https://amoy.polygonscan.com/address/${CONTRACT_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-purple-700 hover:bg-purple-600 py-2 rounded-lg text-sm transition flex items-center justify-center gap-1"
              >
                View Contract
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Wallet Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-blue-200">Total Value</span>
            <DollarSign className="text-blue-200" size={24} />
          </div>
          <div className="text-3xl font-bold mb-1">${(wallet?.total_value_usdt || wallet?.total_balance_usd || 0).toFixed(2)}</div>
          <div className="text-sm text-blue-200">Platform Balance</div>
        </div>

        <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-green-200">Available Balance</span>
            <TrendingUp className="text-green-200" size={24} />
          </div>
          <div className="text-3xl font-bold mb-1">${(wallet?.available_balance || 0).toFixed(2)}</div>
          <div className="text-sm text-green-200">Ready to Trade</div>
        </div>

        <div className="bg-gradient-to-br from-yellow-600 to-yellow-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-yellow-200">Locked Balance</span>
            <History className="text-yellow-200" size={24} />
          </div>
          <div className="text-3xl font-bold mb-1">${(wallet?.locked_balance || 0).toFixed(2)}</div>
          <div className="text-sm text-yellow-200">In Active Positions</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setShowDepositModal(true)}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-semibold transition"
        >
          <ArrowDownCircle size={20} />
          Deposit (Simulated)
        </button>
        <button
          onClick={() => setShowWithdrawModal(true)}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-semibold transition"
        >
          <ArrowUpCircle size={20} />
          Withdraw (Simulated)
        </button>
      </div>

      {/* Rest of the component remains the same... */}
      {/* Balances Table */}
      <div className="bg-gray-800 rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">Platform Balances</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4">Currency</th>
                <th className="text-right py-3 px-4">Balance</th>
                <th className="text-right py-3 px-4">Locked</th>
                <th className="text-right py-3 px-4">Available</th>
                <th className="text-right py-3 px-4">Price (USDT)</th>
                <th className="text-right py-3 px-4">Value (USDT)</th>
              </tr>
            </thead>
            <tbody>
              {balances.map((balance) => (
                <tr key={balance.currency} className="border-b border-gray-700 hover:bg-gray-700/50">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        balance.currency === 'USDT' ? 'bg-green-600' :
                        balance.currency === 'BTC' ? 'bg-orange-600' :
                        balance.currency === 'ETH' ? 'bg-blue-600' :
                        balance.currency === 'MATIC' ? 'bg-yellow-600' :
                        'bg-purple-600'
                      }`}>
                        {balance.currency[0]}
                      </div>
                      <span className="font-semibold">{balance.currency}</span>
                    </div>
                  </td>
                  <td className="text-right py-4 px-4 font-mono">{(balance?.balance || 0).toFixed(6)}</td>
                  <td className="text-right py-4 px-4 font-mono text-yellow-500">{(balance?.locked || 0).toFixed(6)}</td>
                  <td className="text-right py-4 px-4 font-mono text-green-500">{(balance?.available || 0).toFixed(6)}</td>
                  <td className="text-right py-4 px-4 font-mono">${(balance?.price_usdt || balance?.usd_value / balance?.balance || 0).toFixed(2)}</td>
                  <td className="text-right py-4 px-4 font-mono font-bold">${(balance?.value_usdt || balance?.usd_value || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Transaction History</h2>
        {transactions.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No transactions yet</p>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div key={tx.tx_id} className="bg-gray-700 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    tx.type === 'DEPOSIT' ? 'bg-green-600' :
                    tx.type === 'WITHDRAW' ? 'bg-red-600' :
                    'bg-blue-600'
                  }`}>
                    {tx.type === 'DEPOSIT' ? <ArrowDownCircle size={20} /> :
                     tx.type === 'WITHDRAW' ? <ArrowUpCircle size={20} /> :
                     <History size={20} />}
                  </div>
                  <div>
                    <div className="font-semibold">{tx.type}</div>
                    <div className="text-sm text-gray-400">{new Date(tx.timestamp).toLocaleString()}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold">
                    {tx.type === 'DEPOSIT' ? '+' : '-'}{tx.amount} {tx.currency}
                  </div>
                  <div className="text-sm text-gray-400">{tx.tx_id}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals remain the same... */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-2xl font-bold mb-4">Deposit Funds (Simulated)</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Currency</label>
                <select
                  value={depositCurrency}
                  onChange={(e) => setDepositCurrency(e.target.value)}
                  className="w-full bg-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="USDT">USDT</option>
                  <option value="BTC">BTC</option>
                  <option value="ETH">ETH</option>
                  <option value="MATIC">MATIC</option>
                  <option value="SOL">SOL</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Amount</label>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleDeposit}
                  disabled={!depositAmount || parseFloat(depositAmount) <= 0}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-2 rounded-lg font-semibold transition"
                >
                  Confirm Deposit
                </button>
                <button
                  onClick={() => setShowDepositModal(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg font-semibold transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-2xl font-bold mb-4">Withdraw Funds (Simulated)</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Currency</label>
                <select
                  value={withdrawCurrency}
                  onChange={(e) => setWithdrawCurrency(e.target.value)}
                  className="w-full bg-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="USDT">USDT</option>
                  <option value="BTC">BTC</option>
                  <option value="ETH">ETH</option>
                  <option value="MATIC">MATIC</option>
                  <option value="SOL">SOL</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Amount</label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleWithdraw}
                  disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 px-4 py-2 rounded-lg font-semibold transition"
                >
                  Confirm Withdraw
                </button>
                <button
                  onClick={() => setShowWithdrawModal(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg font-semibold transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
