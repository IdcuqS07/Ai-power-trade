export const LOCAL_BACKEND_FALLBACK = 'http://127.0.0.1:8000';
export const PRODUCTION_BACKEND_FALLBACK = 'https://ai-powertrade.duckdns.org';

function normalizeOrigin(value) {
  const normalized = String(value || '').trim();

  if (!normalized) {
    return '';
  }

  return normalized.replace(/\/+$/, '');
}

export function resolveBackendOrigin() {
  const configuredOrigin = [
    process.env.NEXT_PUBLIC_API_URL,
    process.env.NEXT_PUBLIC_BACKEND_URL,
    process.env.API_URL,
    process.env.BACKEND_URL,
  ]
    .map(normalizeOrigin)
    .find(Boolean);

  if (configuredOrigin) {
    return configuredOrigin;
  }

  return process.env.NODE_ENV === 'development'
    ? LOCAL_BACKEND_FALLBACK
    : PRODUCTION_BACKEND_FALLBACK;
}

export function buildBackendApiUrl(path = '') {
  const normalizedPath = String(path || '').replace(/^\/+/, '');
  return `${resolveBackendOrigin()}/api/${normalizedPath}`;
}
