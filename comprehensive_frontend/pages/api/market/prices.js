// API Proxy to bypass CORS and Mixed Content issues
import { buildBackendApiUrl } from '../../../lib/backendOrigin';
import { aiSignals } from '../../../lib/premiumData';

let cachedMarketSnapshot = null;

const CURATED_FALLBACK_PRICES = {
  BTC: { price: 94280, change_24h: 2.18, volume_24h: 48600000000 },
  ETH: { price: 4875, change_24h: 1.42, volume_24h: 22100000000 },
  SOL: { price: 214.7, change_24h: 4.11, volume_24h: 4100000000 },
  LINK: { price: 29.34, change_24h: 3.68, volume_24h: 940000000 },
  BNB: { price: 692.4, change_24h: 1.06, volume_24h: 1880000000 },
  XRP: { price: 2.41, change_24h: 1.84, volume_24h: 3270000000 },
  ADA: { price: 0.91, change_24h: 1.37, volume_24h: 1080000000 },
  MATIC: { price: 0.74, change_24h: 0.92, volume_24h: 412000000 },
};

function buildFallbackPrices() {
  const fallbackPrices = {};

  Object.entries(CURATED_FALLBACK_PRICES).forEach(([symbol, item]) => {
    const curatedSignal = aiSignals.find((entry) => entry.symbol === symbol);
    const price = Number(curatedSignal?.price || item.price || 0);
    const change = Number(curatedSignal?.change24h ?? item.change_24h ?? 0);

    fallbackPrices[symbol] = {
      price,
      change_24h: change,
      high_24h: Number((price * 1.018).toFixed(2)),
      low_24h: Number((price * 0.982).toFixed(2)),
      volume_24h: Number(item.volume_24h || 0),
      source: 'Curated fallback',
    };
  });

  return {
    success: true,
    data: fallbackPrices,
    source: 'Curated market fallback',
    fallback: true,
    message: 'Live market prices are temporarily unavailable, so curated fallback prices are active.',
  };
}

export default async function handler(req, res) {
  try {
    console.log('[API Proxy] Fetching from:', buildBackendApiUrl('market/prices'))
    
    const response = await fetch(buildBackendApiUrl('market/prices'), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Add timeout
      signal: AbortSignal.timeout(10000) // 10 second timeout
    })
    
    const data = await response.json()

    if (!response.ok) {
      if (cachedMarketSnapshot) {
        console.warn('[API Proxy] Using cached prices because backend returned', response.status)
        return res.status(200).json({
          ...cachedMarketSnapshot,
          source: 'cache',
          fallback: true,
          message: `Serving cached market prices because the backend returned ${response.status}.`,
        })
      }

      return res.status(200).json(buildFallbackPrices())
    }

    if (data?.success !== false) {
      cachedMarketSnapshot = data
    }

    console.log('[API Proxy] Success:', Object.keys(data.data || {}).length, 'coins')
    
    res.status(200).json(data)
  } catch (error) {
    if (cachedMarketSnapshot) {
      console.warn('[API Proxy] Using cached prices because fetch failed:', error.message)
      return res.status(200).json({
        ...cachedMarketSnapshot,
        source: 'cache',
        fallback: true,
        message: `Serving cached market prices because the live request failed: ${error.message}`,
      })
    }

    console.error('[API Proxy] Error:', error.message)
    res.status(200).json(buildFallbackPrices())
  }
}
