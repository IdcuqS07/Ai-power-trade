// API Proxy for AI explanation
export default async function handler(req, res) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://143.198.205.88:8000'
  const { symbol } = req.query
  
  try {
    const response = await fetch(`${API_URL}/api/ai/explain/${symbol}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    const data = await response.json()
    res.status(200).json(data)
  } catch (error) {
    console.error('Error fetching AI explanation:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch AI explanation',
      message: error.message 
    })
  }
}
