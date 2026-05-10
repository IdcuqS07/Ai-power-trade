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
        console.log('[useMarketPulse] Fetching prices...');

        const cached = cache.get(CACHE_KEY);

        if (cached && mounted) {
          console.log('[useMarketPulse] Using cached data:', {
            symbols: Object.keys(cached),
            btcPrice: cached['BTC']?.price
          });
          setSignals(mergeSignalsWithLivePrices(aiSignals, cached));
          setSource('Live market overlay');
          setLoading(false);
          // Don't return - continue to fetch fresh data in background
        }

        const response = await fetch('/api/market/prices');

        if (!response.ok) {
          throw new Error(`Market API returned ${response.status}`);
        }

        const payload = await response.json();
        const liveData = payload?.data || {};

        console.log('[useMarketPulse] Fresh data received:', {
          symbols: Object.keys(liveData),
          btcPrice: liveData['BTC']?.price,
          source: payload?.source,
          mergedSignals: mergeSignalsWithLivePrices(aiSignals, liveData).map(s => ({ symbol: s.symbol, price: s.price }))
        });

        cache.set(CACHE_KEY, liveData, 45);

        if (mounted) {
          setSignals(mergeSignalsWithLivePrices(aiSignals, liveData));
          setSource(payload?.source === 'cache' ? 'Cached market overlay' : 'Live market overlay');
        }
      } catch (error) {
        console.error('[useMarketPulse] Error:', error);
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
