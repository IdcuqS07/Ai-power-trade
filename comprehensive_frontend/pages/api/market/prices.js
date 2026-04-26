// API Proxy to bypass CORS and Mixed Content issues
export default async function handler(req, res) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'
  
  try {
    console.log('[API Proxy] Fetching from:', `${API_URL}/api/market/prices`)
    
    const response = await fetch(`${API_URL}/api/market/prices`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Add timeout
      signal: AbortSignal.timeout(10000) // 10 second timeout
    })
    
    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`)
    }
    
    const data = await response.json()
    console.log('[API Proxy] Success:', Object.keys(data.data || {}).length, 'coins')
    
    res.status(200).json(data)
  } catch (error) {
    console.error('[API Proxy] Error:', error.message)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch prices',
      message: error.message 
    })
  }
}
