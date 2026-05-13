// Proxy API for performance data to avoid mixed content issues
import { buildBackendApiUrl } from '../../lib/backendOrigin';

export default async function handler(req, res) {
  try {
    const targetUrl = new URL(buildBackendApiUrl('trades/performance'));

    Object.entries(req.query || {}).forEach(([key, value]) => {
      if (typeof value === 'undefined') {
        return;
      }

      if (Array.isArray(value)) {
        value.forEach((entry) => targetUrl.searchParams.append(key, String(entry)));
        return;
      }

      targetUrl.searchParams.set(key, String(value));
    });

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(8000),
    })
    
    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`)
    }
    
    const data = await response.json()
    res.status(200).json(data)
  } catch (error) {
    console.error('Performance proxy error:', error)
    
    // Return fallback data
    res.status(200).json({
      success: true,
      data: {
        total_trades: 0,
        winning_trades: 0,
        losing_trades: 0,
        win_rate: 0,
        total_profit: 0,
        avg_profit: 0
      }
    })
  }
}
