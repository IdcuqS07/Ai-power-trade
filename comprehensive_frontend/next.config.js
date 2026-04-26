/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Keep dev and production build artifacts separate so `next build`
  // does not corrupt a running `next dev` session.
  distDir: process.env.NODE_ENV === 'development' ? '.next-dev' : '.next',
  
  // Optimize images
  images: {
    domains: ['amoy.polygonscan.com'],
    formats: ['image/avif', 'image/webp'],
  },
  
  // Enable compression
  compress: true,
  
  // Optimize production builds
  productionBrowserSourceMaps: false,
  
  // Cache optimization
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
  },

  async redirects() {
    return [
      // Collapse legacy workspace surfaces into the core product views.
      { source: '/dashboard/:path*', destination: '/app', permanent: false },
      { source: '/ai-predictions', destination: '/app', permanent: false },
      { source: '/execute', destination: '/app', permanent: false },
      { source: '/auth/:path*', destination: '/app', permanent: false },
      { source: '/user/:path*', destination: '/app', permanent: false },
      { source: '/wallet/:path*', destination: '/app', permanent: false },
      { source: '/wallet', destination: '/app', permanent: false },
      { source: '/profile', destination: '/app', permanent: false },
      { source: '/login', destination: '/app', permanent: false },
      { source: '/register', destination: '/app', permanent: false },
      { source: '/backtest/:path*', destination: '/trade-history', permanent: false },
      { source: '/analytics', destination: '/trade-history', permanent: false },
      { source: '/backtest', destination: '/trade-history', permanent: false },
      { source: '/trades', destination: '/trade-history', permanent: false },
      { source: '/ml/:path*', destination: '/ai-explainer', permanent: false },
      { source: '/ai/lstm/:path*', destination: '/ai-explainer', permanent: false },
      { source: '/binance/:path*', destination: '/app', permanent: false },
      { source: '/smartcontract/:path*', destination: '/trade-history', permanent: false },
      { source: '/oracle/:path*', destination: '/trade-history', permanent: false },
      { source: '/admin/:path*', destination: '/trade-history', permanent: false },
      { source: '/research', destination: '/ai-explainer', permanent: false },
      { source: '/copilot', destination: '/ai-explainer', permanent: false },
      { source: '/signals/:symbol', destination: '/ai-explainer?symbol=:symbol', permanent: false },
    ];
  },
  
  // Headers for caching
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
