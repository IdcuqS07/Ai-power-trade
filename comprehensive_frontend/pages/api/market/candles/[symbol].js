import { aiSignals } from '../../../../lib/premiumData';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000').trim();
const REQUEST_TIMEOUT_MS = 3000;

function buildFallbackCandles(symbol = 'BTC', interval = '1h', limit = 48) {
  const asset =
    aiSignals.find((entry) => entry.symbol === String(symbol || '').toUpperCase()) || aiSignals[0];
  const series = Array.isArray(asset.chart) && asset.chart.length ? asset.chart : [];
  const endTimestamp = Date.now();
  const intervalMs =
    interval === '1d'
      ? 86_400_000
      : interval === '4h'
        ? 14_400_000
        : interval === '15m'
          ? 900_000
          : interval === '5m'
            ? 300_000
            : interval === '1m'
              ? 60_000
              : 3_600_000;

  const candles = series.map((point, index) => {
    const previousPoint = series[index - 1];
    const open = Number(previousPoint?.price || asset.price || 0);
    const close = Number(point?.price || open);
    const high = Math.max(open, close) * 1.0015;
    const low = Math.min(open, close) * 0.9985;

    return {
      timestamp: endTimestamp - ((series.length - 1 - index) * intervalMs),
      open: Number(open.toFixed(6)),
      high: Number(high.toFixed(6)),
      low: Number(low.toFixed(6)),
      close: Number(close.toFixed(6)),
      volume: Number((point?.volume || 100).toFixed(6)),
    };
  });
  const normalizedLimit = Math.max(1, Number(limit || candles.length));
  const limitedCandles = candles.slice(-normalizedLimit);

  return {
    symbol: asset.symbol,
    pair: `${asset.symbol}/USDT`,
    interval,
    limit: limitedCandles.length,
    candles: limitedCandles,
  };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const symbol = String(req.query.symbol || 'BTC').toUpperCase();
  const interval = String(req.query.interval || '1h');
  const limit = Number(req.query.limit || 48);
  const targetUrl = new URL(`${API_URL}/api/market/candles/${encodeURIComponent(symbol)}`);

  targetUrl.searchParams.set('interval', interval);
  targetUrl.searchParams.set('limit', String(limit));

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(200).json({
      success: true,
      data: buildFallbackCandles(symbol, interval, limit),
      source: 'Curated fallback',
      message: 'Live candle data is temporarily unavailable, so a curated chart fallback is active.',
    });
  }
}
