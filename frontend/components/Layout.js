import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  Home, TrendingUp, PieChart, Settings, History, 
  Bell, User, Menu, X, Shield, BarChart3 
} from 'lucide-react';

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Trading', href: '/trading', icon: TrendingUp },
    { name: 'Portfolio', href: '/portfolio', icon: PieChart },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'History', href: '/history', icon: History },
    { name: 'Risk Management', href: '/risk', icon: Shield },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
        <div className="fixed left-0 top-0 h-full w-64 bg-slate-800 border-r border-slate-700">
          <div className="flex items-center justify-between p-4">
            <h2 className="text-xl font-bold text-white">Weex AI</h2>
            <button onClick={() => setSidebarOpen(false)}>
              <X className="w-6 h-6 text-slate-400" />
            </button>
          </div>
          <nav className="px-4 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    router.pathname === item.href
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-700'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:left-0 lg:top-0 lg:h-full lg:w-64 lg:bg-slate-800/50 lg:backdrop-blur lg:border-r lg:border-slate-700 lg:block">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-white bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Weex AI
          </h2>
        </div>
        <nav className="px-4 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  router.pathname === item.href
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top bar */}
        <div className="bg-slate-800/30 backdrop-blur border-b border-slate-700 px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-700"
            >
              <Menu className="w-6 h-6 text-slate-400" />
            </button>
            
            <div className="flex items-center gap-4">
              <button className="p-2 rounded-lg hover:bg-slate-700 relative">
                <Bell className="w-5 h-5 text-slate-400" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </button>
              <button className="p-2 rounded-lg hover:bg-slate-700">
                <User className="w-5 h-5 text-slate-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}