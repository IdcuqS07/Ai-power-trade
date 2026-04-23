import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
          AI Trading Platform
        </h1>
        <p className="text-xl text-slate-300 mb-8">
          Sistem Trading Terdesentralisasi dengan Smart Contract
        </p>
        <Link 
          href="/trading"
          className="inline-block bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 px-8 py-4 rounded-lg font-semibold text-lg transition-all shadow-lg hover:shadow-xl"
        >
          Launch Trading App
        </Link>
      </div>
    </div>
  )
}