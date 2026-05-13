// API Proxy to bypass CORS and Mixed Content issues
import { buildBackendApiUrl } from '../../../lib/backendOrigin';

let cachedMarketSnapshot = null;

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

      throw new Error(`Backend returned ${response.status}`)
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
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch prices',
      message: error.message 
    })
  }
}
