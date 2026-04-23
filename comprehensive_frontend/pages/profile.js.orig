import { useState, useEffect } from 'react'
import axios from 'axios'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { User, Settings, TrendingUp, Award, Calendar, Home } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://soon-damages-wide-drive.trycloudflare.com'

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [updateResult, setUpdateResult] = useState(null)
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    risk_tolerance: 'moderate',
    trading_strategy: 'ai_multi_indicator'
  })

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    fetchProfileData()
  }, [router])

  const fetchProfileData = async () => {
    try {
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }
      
      const [profileRes, statsRes] = await Promise.all([
        axios.get(`${API_URL}/api/user/profile`, { headers }),
        axios.get(`${API_URL}/api/user/stats`, { headers })
      ])
      
      setProfile(profileRes.data.data)
      setStats(statsRes.data.data)
      setFormData({
        username: profileRes.data.data.username,
        email: profileRes.data.data.email,
        risk_tolerance: profileRes.data.data.risk_tolerance,
        trading_strategy: profileRes.data.data.trading_strategy
      })
      setLoading(false)
    } catch (error) {
      console.error('Error fetching profile:', error)
      if (error.response?.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        router.push('/login')
      }
    }
  }

  const handleUpdate = async () => {
    try {
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }
      const response = await axios.put(`${API_URL}/api/user/profile`, formData, { headers })
      setProfile(response.data.data)
      setEditing(false)
      setUpdateResult({ success: true, message: 'Profile updated successfully!' })
      setTimeout(() => setUpdateResult(null), 3000)
    } catch (error) {
      setUpdateResult({ success: false, message: 'Failed to update profile' })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading profile...</div>
      </div>
    )
  }

  const getRiskColor = (risk) => {
    switch(risk) {
      case 'conservative': return 'text-green-500'
      case 'moderate': return 'text-yellow-500'
      case 'aggressive': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <User size={32} className="text-blue-500" />
              <h1 className="text-4xl font-bold">User Profile</h1>
            </div>
            <p className="text-gray-400">Manage your account and trading preferences</p>
          </div>
          <Link href="/" className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition">
            <Home size={20} />
            <span>Dashboard</span>
          </Link>
        </div>
      </div>

      {/* Update Result */}
      {updateResult && (
        <div className={`rounded-lg p-4 mb-6 ${updateResult.success ? 'bg-green-900/30 border border-green-500' : 'bg-red-900/30 border border-red-500'}`}>
          <p className={updateResult.success ? 'text-green-400' : 'text-red-400'}>
            {updateResult.message}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Profile Information</h2>
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition"
                >
                  <Settings size={18} />
                  Edit Profile
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleUpdate}
                    className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false)
                      setFormData({
                        username: profile.username,
                        email: profile.email,
                        risk_tolerance: profile.risk_tolerance,
                        trading_strategy: profile.trading_strategy
                      })
                    }}
                    className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">User ID</label>
                <div className="bg-gray-700 rounded-lg px-4 py-2 font-mono text-gray-300">
                  {profile.user_id}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Username</label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    className="w-full bg-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="bg-gray-700 rounded-lg px-4 py-2">{profile.username}</div>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Email</label>
                {editing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="bg-gray-700 rounded-lg px-4 py-2">{profile.email}</div>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Risk Tolerance</label>
                {editing ? (
                  <select
                    value={formData.risk_tolerance}
                    onChange={(e) => setFormData({...formData, risk_tolerance: e.target.value})}
                    className="w-full bg-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="conservative">Conservative (Lower Risk)</option>
                    <option value="moderate">Moderate (Balanced)</option>
                    <option value="aggressive">Aggressive (Higher Risk)</option>
                  </select>
                ) : (
                  <div className="bg-gray-700 rounded-lg px-4 py-2 flex items-center justify-between">
                    <span className="capitalize">{profile.risk_tolerance}</span>
                    <span className={`font-semibold ${getRiskColor(profile.risk_tolerance)}`}>
                      {profile.risk_tolerance === 'conservative' && '🛡️ Safe'}
                      {profile.risk_tolerance === 'moderate' && '⚖️ Balanced'}
                      {profile.risk_tolerance === 'aggressive' && '🚀 High Risk'}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Trading Strategy</label>
                {editing ? (
                  <select
                    value={formData.trading_strategy}
                    onChange={(e) => setFormData({...formData, trading_strategy: e.target.value})}
                    className="w-full bg-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ai_multi_indicator">AI Multi-Indicator</option>
                    <option value="momentum">Momentum</option>
                    <option value="mean_reversion">Mean Reversion</option>
                  </select>
                ) : (
                  <div className="bg-gray-700 rounded-lg px-4 py-2 capitalize">
                    {profile.trading_strategy.replace('_', ' ')}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Member Since</label>
                <div className="bg-gray-700 rounded-lg px-4 py-2 flex items-center gap-2">
                  <Calendar size={18} className="text-gray-400" />
                  {new Date(profile.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Trading Preferences</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-gray-700 rounded-lg px-4 py-3">
                <span>Auto Trading</span>
                <span className={profile.preferences.auto_trade ? 'text-green-500' : 'text-gray-500'}>
                  {profile.preferences.auto_trade ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className="flex items-center justify-between bg-gray-700 rounded-lg px-4 py-3">
                <span>Notifications</span>
                <span className={profile.preferences.notifications ? 'text-green-500' : 'text-gray-500'}>
                  {profile.preferences.notifications ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className="flex items-center justify-between bg-gray-700 rounded-lg px-4 py-3">
                <span>Max Daily Trades</span>
                <span className="font-semibold">{profile.preferences.max_daily_trades}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Award size={24} />
              <h2 className="text-xl font-bold">Trading Stats</h2>
            </div>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-blue-200 mb-1">Total Trades</div>
                <div className="text-3xl font-bold">{stats.total_trades}</div>
              </div>
              <div>
                <div className="text-sm text-blue-200 mb-1">Win Rate</div>
                <div className="text-3xl font-bold">{stats.win_rate.toFixed(1)}%</div>
              </div>
              <div>
                <div className="text-sm text-blue-200 mb-1">Total Profit</div>
                <div className={`text-3xl font-bold ${stats.total_profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${stats.total_profit.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-sm text-blue-200 mb-1">Best Trade</div>
                <div className="text-3xl font-bold text-green-400">${stats.best_trade.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-sm text-blue-200 mb-1">Days Active</div>
                <div className="text-3xl font-bold">{stats.days_active}</div>
              </div>
            </div>
          </div>

          {/* Risk Info */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-bold mb-3">Risk Tolerance Guide</h3>
            <div className="space-y-3 text-sm">
              <div className="bg-green-900/30 border border-green-500 rounded-lg p-3">
                <div className="font-semibold text-green-500 mb-1">🛡️ Conservative</div>
                <div className="text-gray-400">Min confidence: 75%, Max position: 10%</div>
              </div>
              <div className="bg-yellow-900/30 border border-yellow-500 rounded-lg p-3">
                <div className="font-semibold text-yellow-500 mb-1">⚖️ Moderate</div>
                <div className="text-gray-400">Min confidence: 65%, Max position: 20%</div>
              </div>
              <div className="bg-red-900/30 border border-red-500 rounded-lg p-3">
                <div className="font-semibold text-red-500 mb-1">🚀 Aggressive</div>
                <div className="text-gray-400">Min confidence: 55%, Max position: 30%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
