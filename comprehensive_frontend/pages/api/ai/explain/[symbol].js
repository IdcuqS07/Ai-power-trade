// API Proxy for AI explanation
import { buildBackendApiUrl } from '../../../../lib/backendOrigin';

export default async function handler(req, res) {
  const { symbol } = req.query
  
  try {
    const response = await fetch(buildBackendApiUrl(`ai/explain/${symbol}`), {
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
