const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000').trim();
const REQUEST_TIMEOUT_MS = 30000; // Increased to 30s for large ETF responses

export default async function handler(req, res) {
  const { symbol } = req.query;

  if (!symbol) {
    return res.status(400).json({ success: false, error: 'Symbol is required' });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(
      `${API_URL}/api/sosovalue/research-context/${encodeURIComponent(symbol)}`,
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        success: false,
        error: errorText || `Backend returned ${response.status}`
      });
    }

    const data = await response.json();
    res.status(200).json(data);

  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      return res.status(504).json({
        success: false,
        error: 'Request timeout'
      });
    }
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
