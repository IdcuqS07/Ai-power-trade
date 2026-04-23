import { cache } from './cache';

/**
 * Fetch with automatic caching
 * @param {string} url - API endpoint
 * @param {object} options - Fetch options
 * @param {number} cacheTTL - Cache duration in seconds (0 = no cache)
 */
export async function cachedFetch(url, options = {}, cacheTTL = 30) {
  // Generate cache key from URL and method
  const method = options.method || 'GET';
  const cacheKey = `api_${method}_${url}`;
  
  // Check cache for GET requests
  if (method === 'GET' && cacheTTL > 0) {
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log('📦 Cache hit:', url);
      return cached;
    }
  }
  
  console.log('🔄 Fetching:', url);
  
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    
    // Cache successful GET requests
    if (response.ok && method === 'GET' && cacheTTL > 0) {
      cache.set(cacheKey, data, cacheTTL);
      console.log('✅ Cached:', url, `(${cacheTTL}s)`);
    }
    
    return data;
  } catch (error) {
    console.error('❌ Fetch error:', url, error);
    throw error;
  }
}

/**
 * Fetch market prices with caching
 */
export async function fetchMarketPrices(cacheTTL = 10) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://belle-creativity-mile-dream.trycloudflare.com';
  return cachedFetch(`${API_URL}/api/market/prices`, {}, cacheTTL);
}

/**
 * Fetch specific coin price with caching
 */
export async function fetchCoinPrice(symbol, cacheTTL = 10) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://belle-creativity-mile-dream.trycloudflare.com';
  return cachedFetch(`${API_URL}/api/market/prices/${symbol}`, {}, cacheTTL);
}

/**
 * Fetch user profile with caching
 */
export async function fetchUserProfile(userId, cacheTTL = 60) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://belle-creativity-mile-dream.trycloudflare.com';
  return cachedFetch(`${API_URL}/api/users/${userId}`, {}, cacheTTL);
}

/**
 * Fetch wallet balance with caching
 */
export async function fetchWalletBalance(address, cacheTTL = 30) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://belle-creativity-mile-dream.trycloudflare.com';
  return cachedFetch(`${API_URL}/api/wallet/${address}`, {}, cacheTTL);
}

/**
 * Clear all API cache
 */
export function clearApiCache() {
  cache.clear();
  console.log('🗑️ API cache cleared');
}

/**
 * Fetch with timeout (5 seconds)
 */
export async function fetchWithTimeout(url, options = {}, timeout = 5000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}
