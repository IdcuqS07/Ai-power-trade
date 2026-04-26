export default async function handler(req, res) {
  res.status(410).json({
    success: false,
    error: 'Dashboard proxy deprecated',
    message:
      'The legacy dashboard endpoint is retained behind the backend, but it is not part of the current core surface.',
    suggestedRoutes: ['/api/app/terminal', '/api/market/prices'],
  });
}
