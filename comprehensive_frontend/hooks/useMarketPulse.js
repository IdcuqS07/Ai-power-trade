import { useEffect, useState } from 'react';

import { cache } from '../utils/cache';
import { aiSignals, mergeSignalsWithLivePrices } from '../lib/premiumData';

const CACHE_KEY = 'premium_market_prices';
const REFRESH_INTERVAL_MS = 30000;

export function useMarketPulse() {
  const [signals, setSignals] = useState(aiSignals);
  const [source, setSource] = useState('Curated AI model');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchPrices = async () => {
      try {
        const cached = cache.get(CACHE_KEY);

        if (cached && mounted) {
          setSignals(mergeSignalsWithLivePrices(aiSignals, cached));
          setSource('Live market overlay');
          setLoading(false);
          return;
        }

        const response = await fetch('/api/market/prices');

        if (!response.ok) {
          throw new Error(`Market API returned ${response.status}`);
        }

        const payload = await response.json();
        const liveData = payload?.data || {};

        cache.set(CACHE_KEY, liveData, 45);

        if (mounted) {
          setSignals(mergeSignalsWithLivePrices(aiSignals, liveData));
          setSource(payload?.source === 'cache' ? 'Cached market overlay' : 'Live market overlay');
        }
      } catch (error) {
        if (mounted) {
          setSignals(aiSignals);
          setSource('Curated AI model');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, REFRESH_INTERVAL_MS);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return { signals, source, loading };
}
