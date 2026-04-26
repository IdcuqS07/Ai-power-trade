const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
const LOW_PRIORITY_BACKEND_PREFIXES = [
  ['auth'],
  ['user'],
  ['wallet'],
  ['dashboard'],
  ['backtest'],
  ['ml'],
  ['binance'],
  ['smartcontract'],
  ['oracle'],
  ['admin'],
  ['ai', 'lstm'],
];

function matchLowPriorityBackendPath(pathSegments = []) {
  const normalizedSegments = pathSegments.map((segment) => String(segment).toLowerCase());
  const matchedPrefix = LOW_PRIORITY_BACKEND_PREFIXES.find((prefix) =>
    prefix.every((segment, index) => normalizedSegments[index] === segment)
  );

  return matchedPrefix ? matchedPrefix.join('/') : null;
}

function appendQueryParams(url, query) {
  Object.entries(query).forEach(([key, value]) => {
    if (key === 'path' || typeof value === 'undefined') {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => url.searchParams.append(key, String(item)));
      return;
    }

    url.searchParams.append(key, String(value));
  });
}

function buildForwardHeaders(req) {
  const headers = {};
  const contentType = req.headers['content-type'];
  const accept = req.headers.accept;
  const authorization = req.headers.authorization;

  if (contentType) {
    headers['Content-Type'] = contentType;
  }

  if (accept) {
    headers.Accept = accept;
  }

  if (authorization) {
    headers.Authorization = authorization;
  }

  return headers;
}

export default async function handler(req, res) {
  const rawPath = req.query.path;
  const pathSegments = Array.isArray(rawPath) ? rawPath : rawPath ? [rawPath] : [];
  const blockedNamespace = matchLowPriorityBackendPath(pathSegments);

  if (!pathSegments.length) {
    res.status(400).json({
      success: false,
      error: 'Missing backend path',
    });
    return;
  }

  if (blockedNamespace) {
    res.status(410).json({
      success: false,
      error: 'Backend namespace hidden from core surface',
      message: `${blockedNamespace} is retained in the backend but intentionally not exposed in the current product shell.`,
    });
    return;
  }

  const url = new URL(`${API_URL}/api/${pathSegments.join('/')}`);
  appendQueryParams(url, req.query);

  try {
    const init = {
      method: req.method,
      headers: buildForwardHeaders(req),
    };

    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body && Object.keys(req.body).length > 0) {
      init.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    const response = await fetch(url, init);
    const text = await response.text();
    const contentType = response.headers.get('content-type') || 'application/json; charset=utf-8';

    res.status(response.status);
    res.setHeader('Content-Type', contentType);

    try {
      const json = JSON.parse(text);
      res.json(json);
    } catch {
      res.send(text);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Backend proxy failed',
      message: error.message,
      target: url.toString(),
    });
  }
}
