import { buildBackendApiUrl } from '../../../../../lib/backendOrigin';
import { researchFeed } from '../../../../../lib/premiumData';

const REQUEST_TIMEOUT_MS = 8000; // Keep below serverless limits so fallback can still respond
const researchSnapshotCache = new Map();

function buildCacheKey(symbol, newsLimit) {
  return `${String(symbol || '').toUpperCase()}::${String(newsLimit || 5)}`;
}

function buildFallbackResearchPayload(symbol, reason = 'Live research is temporarily unavailable.') {
  const normalizedSymbol = String(symbol || 'BTC').toUpperCase();
  const relatedEntries = researchFeed.filter((item) =>
    Array.isArray(item.related) && item.related.includes(normalizedSymbol)
  );
  const selectedEntries = (relatedEntries.length ? relatedEntries : researchFeed.slice(0, 2)).slice(0, 3);
  const timestamp = new Date().toISOString();

  return {
    success: true,
    fallback: true,
    message: reason,
    data: {
      symbol: normalizedSymbol,
      summary:
        selectedEntries[0]?.summary ||
        `Curated ${normalizedSymbol} research fallback is active while the live narrative feed reconnects.`,
      news_count: selectedEntries.length,
      headlineCount: selectedEntries.length,
      catalyst_score: selectedEntries.length ? 48 : 35,
      catalyst_label: selectedEntries.length ? 'MEDIUM' : 'LOW',
      sentiment: {
        label: selectedEntries.length ? 'NEUTRAL' : 'STANDBY',
        score: selectedEntries.length ? 52 : 45,
        description: reason,
      },
      rationale: [
        selectedEntries[0]?.whyItMatters ||
          `Curated ${normalizedSymbol} context is active while the live research provider recovers.`,
        reason,
      ],
      latest_news: selectedEntries.map((item, index) => ({
        id: item.id || `fallback-${normalizedSymbol}-${index}`,
        title: item.title,
        summary: item.summary,
        category_label: item.tag || 'Research',
        category: item.tag || 'Research',
        sentiment: item.sentiment || 'Neutral',
        importance_score: 55 - index * 4,
        published_at: timestamp,
      })),
      articles: selectedEntries.map((item, index) => ({
        id: item.id || `fallback-${normalizedSymbol}-${index}`,
        title: item.title,
        summary: item.summary,
        category_label: item.tag || 'Research',
        category: item.tag || 'Research',
        sentiment: item.sentiment || 'Neutral',
        importance_score: 55 - index * 4,
        published_at: timestamp,
      })),
      macro_regime: 'UNAVAILABLE',
      macro_context: {
        overall_regime: 'UNAVAILABLE',
        error: reason,
      },
      timestamp,
      source: 'Curated research fallback',
    },
  };
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

      return res.status(200).json(
        buildFallbackResearchPayload(
          symbol,
          data?.error || text || `Backend returned ${response.status}`
        )
      );
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

    return res.status(200).json(
      buildFallbackResearchPayload(
        symbol,
        error.name === 'AbortError' ? 'Request timeout' : error.message
      )
    );
  }
}
