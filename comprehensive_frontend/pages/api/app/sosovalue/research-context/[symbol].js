import { buildBackendApiUrl } from '../../../../../lib/backendOrigin';

const REQUEST_TIMEOUT_MS = 30000; // Increased to 30s for large ETF responses
const researchSnapshotCache = new Map();

function buildCacheKey(symbol, newsLimit) {
  return `${String(symbol || '').toUpperCase()}::${String(newsLimit || 5)}`;
}

export default async function handler(req, res) {
  const { symbol } = req.query;
  const newsLimit = req.query.news_limit || 5;
  const cacheKey = buildCacheKey(symbol, newsLimit);

  if (!symbol) {
    return res.status(400).json({ success: false, error: 'Symbol is required' });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const backendUrl = new URL(buildBackendApiUrl(`sosovalue/research-context/${encodeURIComponent(symbol)}`));
  backendUrl.searchParams.set('news_limit', String(newsLimit));

  try {
    const response = await fetch(backendUrl, { signal: controller.signal });
    const text = await response.text();

    clearTimeout(timeoutId);

    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }

    if (!response.ok) {
      const cached = researchSnapshotCache.get(cacheKey);
      if (cached) {
        return res.status(200).json({
          ...cached,
          fallback: true,
          proxyFallback: true,
          message: `Serving cached research context because the backend returned ${response.status}.`,
        });
      }

      return res.status(response.status).json({
        success: false,
        error: data?.error || text || `Backend returned ${response.status}`
      });
    }

    if (data?.success !== false) {
      researchSnapshotCache.set(cacheKey, data);
    }

    res.status(200).json(data);

  } catch (error) {
    clearTimeout(timeoutId);
    const cached = researchSnapshotCache.get(cacheKey);

    if (cached) {
      return res.status(200).json({
        ...cached,
        fallback: true,
        proxyFallback: true,
        message:
          error.name === 'AbortError'
            ? 'Serving cached research context because the live request timed out.'
            : `Serving cached research context because the live request failed: ${error.message}`,
      });
    }

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
