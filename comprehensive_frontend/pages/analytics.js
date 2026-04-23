import { useState, useEffect } from 'react'
import axios from 'axios'
import { ArrowLeft, Shield, CheckCircle, Activity } from 'lucide-react'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://soon-damages-wide-drive.trycloudflare.com'

export default function Analytics() {
  const [records, setRecords] = useState([])
  const [validations, setValidations] = useState([])
  const [verifications, setVerifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      const [recordsRes, validationsRes, verificationsRes] = await Promise.all([
        axios.get(`${API_URL}/api/smartcontract/records?limit=20`),
        axios.get(`${API_URL}/api/smartcontract/validations?limit=20`),
        axios.get(`${API_URL}/api/oracle/verifications?limit=20`)
      ])
      
      setRecords(recordsRes.data.data)
      setValidations(validationsRes.data.data)
      setVerifications(verificationsRes.data.data)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching data:', error)
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
        <h1 className="text-4xl font-bold">Analytics & Monitoring</h1>
        <p className="text-gray-400">Smart Contract, Oracle, and System Analytics</p>
      </div>

      {/* On-Chain Records */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Activity className="text-blue-500 mr-2" size={24} />
          <h2 className="text-2xl font-bold">On-Chain Records</h2>
        </div>
        
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Block #</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Block Hash</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Trade ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {records.map((record, index) => (
                  <tr key={index} className="hover:bg-gray-750">
                    <td className="px-6 py-4 text-sm font-bold">#{record.block_number}</td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-400">
                      {record.block_hash.substring(0, 16)}...
                    </td>
                    <td className="px-6 py-4 text-sm font-mono">{record.trade.trade_id}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {new Date(record.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Validations */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Shield className="text-green-500 mr-2" size={24} />
          <h2 className="text-2xl font-bold">Smart Contract Validations</h2>
        </div>
        
        <div className="space-y-4">
          {validations.map((validation, index) => (
            <div key={index} className={`bg-gray-800 rounded-lg p-6 border-l-4 ${
              validation.is_valid ? 'border-green-500' : 'border-red-500'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    validation.is_valid ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
                  }`}>
                    {validation.is_valid ? 'VALID' : 'INVALID'}
                  </span>
                  <span className="ml-4 text-gray-400 text-sm">
                    Validation #{validation.validation_id}
                  </span>
                </div>
                <span className="text-gray-400 text-sm">
                  {new Date(validation.timestamp).toLocaleString()}
                </span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {validation.validations.map((v, i) => (
                  <div key={i} className="flex items-center">
                    {v.passed ? (
                      <CheckCircle size={16} className="text-green-500 mr-2" />
                    ) : (
                      <CheckCircle size={16} className="text-red-500 mr-2" />
                    )}
                    <div>
                      <div className="text-sm font-semibold">{v.rule}</div>
                      <div className="text-xs text-gray-400">{v.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Oracle Verifications */}
      <div>
        <div className="flex items-center mb-4">
          <CheckCircle className="text-purple-500 mr-2" size={24} />
          <h2 className="text-2xl font-bold">Oracle Verifications</h2>
        </div>
        
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Verification ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Signal Hash</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Reasons</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {verifications.map((verification, index) => (
                  <tr key={index} className="hover:bg-gray-750">
                    <td className="px-6 py-4 text-sm">#{verification.verification_id}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        verification.is_verified ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
                      }`}>
                        {verification.is_verified ? 'VERIFIED' : 'FAILED'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-400">
                      {verification.signal_hash.substring(0, 16)}...
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {verification.reasons.join(', ')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {new Date(verification.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
