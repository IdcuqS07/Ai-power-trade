// API Proxy for dashboard
export default async function handler(req, res) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://143.198.205.88:8000'
  const { symbol } = req.query
  
  try {
    // Forward symbol parameter to backend
    const url = symbol ? `${API_URL}/api/dashboard?symbol=${symbol}` : `${API_URL}/api/dashboard`
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    const data = await response.json()
    res.status(200).json(data)
  } catch (error) {
    console.error('Error fetching dashboard:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch dashboard',
      message: error.message 
    })
  }
}
