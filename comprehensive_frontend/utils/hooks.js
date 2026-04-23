import { useState, useEffect } from 'react';
import { cache } from './cache';

/**
 * Custom hook for fetching data with caching
 */
export function useCachedFetch(url, cacheTTL = 30) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      const cacheKey = `hook_${url}`;
      
      // Check cache first
      const cached = cache.get(cacheKey);
      if (cached && mounted) {
        console.log('📦 Hook cache hit:', url);
        setData(cached);
        setLoading(false);
        return;
      }

      console.log('🔄 Hook fetching:', url);
      
      try {
        const response = await fetch(url);
        const result = await response.json();
        
        if (mounted) {
          setData(result);
          cache.set(cacheKey, result, cacheTTL);
          console.log('✅ Hook cached:', url);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      mounted = false;
    };
  }, [url, cacheTTL]);

  return { data, loading, error };
}

/**
 * Hook for market prices with auto-refresh
 */
export function useMarketPrices(refreshInterval = 10000) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://belle-creativity-mile-dream.trycloudflare.com';
  const { data, loading, error } = useCachedFetch(`${API_URL}/api/market/prices`, 10);

  useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(() => {
        cache.clear(); // Clear cache to force refresh
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [refreshInterval]);

  return { prices: data, loading, error };
}
