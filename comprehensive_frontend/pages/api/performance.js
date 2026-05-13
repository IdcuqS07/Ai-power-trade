// Proxy API for performance data to avoid mixed content issues
import { buildBackendApiUrl } from '../../lib/backendOrigin';

export default async function handler(req, res) {
  try {
    const response = await fetch(buildBackendApiUrl('trades/performance'), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000
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
