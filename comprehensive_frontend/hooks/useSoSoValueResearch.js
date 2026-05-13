import { useEffect, useState, useCallback } from 'react';

const RESEARCH_REFRESH_MS = 60000;

export function useSoSoValueResearch(activeSymbol) {
  const [researchData, setResearchData] = useState(null);
  const [researchLoading, setResearchLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadResearch = useCallback(async (symbol) => {
    if (!symbol) return;

    try {
      setResearchLoading(true);
      setError(null);

      const response = await fetch(
        `/api/app/sosovalue/research-context/${encodeURIComponent(symbol)}?news_limit=5`
      );

      if (!response.ok) {
        throw new Error(`SoSoValue API returned ${response.status}`);
      }

      const data = await response.json();
      const payload = data?.data || data || {};

      const normalizedResearch = {
        symbol,
        catalystScore: payload?.catalyst_score || 0,
        marketRegime: payload?.macro_regime || payload?.macro_context?.overall_regime || 'NEUTRAL',
        headlineCount: payload?.news_count || payload?.latest_news?.length || payload?.articles?.length || 0,
        summary: payload?.summary || payload?.rationale?.[0] || '',
        items: payload?.latest_news || payload?.articles || [],
        updatedAt: payload?.timestamp || payload?.last_updated || new Date().toISOString(),
      };

      setResearchData(normalizedResearch);
    } catch (err) {
      console.error('[useSoSoValueResearch] Failed to load research:', err);
      setError(err.message);
      setResearchData({
        symbol,
        catalystScore: 0,
        marketRegime: 'UNKNOWN',
        headlineCount: 0,
        summary: 'Unable to load research data',
        items: [],
        updatedAt: new Date().toISOString(),
      });
    } finally {
      setResearchLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!activeSymbol) return;

    loadResearch(activeSymbol);

    const interval = setInterval(() => {
      loadResearch(activeSymbol);
    }, RESEARCH_REFRESH_MS);

    return () => clearInterval(interval);
  }, [activeSymbol, loadResearch]);

  const refresh = useCallback(() => {
    if (activeSymbol) {
      loadResearch(activeSymbol);
    }
  }, [activeSymbol, loadResearch]);

  const getFreshness = useCallback((updatedAt) => {
    if (!updatedAt) return 'STALE';

    const updatedAgoMinutes = (Date.now() - new Date(updatedAt).getTime()) / 60000;

    if (updatedAgoMinutes < 5) return 'LIVE';
    if (updatedAgoMinutes < 30) return 'FRESH';
    return 'STALE';
  }, []);

  const getUpdatedAgoText = useCallback((updatedAt) => {
    if (!updatedAt) return 'Unknown';

    const updatedAgoMinutes = (Date.now() - new Date(updatedAt).getTime()) / 60000;

    if (updatedAgoMinutes < 1) return 'Just now';
    if (updatedAgoMinutes < 60) {
      const mins = Math.round(updatedAgoMinutes);
      return `${mins}m ago`;
    }

    const hours = Math.floor(updatedAgoMinutes / 60);
    const mins = Math.round(updatedAgoMinutes % 60);
    return mins > 0 ? `${hours}h ${mins}m ago` : `${hours}h ago`;
  }, []);

  return {
    research: researchData,
    loading: researchLoading,
    error,
    refresh,
    getFreshness,
    getUpdatedAgoText,
  };
}
