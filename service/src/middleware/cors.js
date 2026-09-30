// service/src/middleware/cors.js
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://web-bantuan-lapangan.up.railway.app',
  'https://web-bantuan-lapangan.vercel.app'
];

function corsMiddleware(req, res, next) {
  const origin = req.headers.origin;

  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, Idempotency-Key, If-Match, If-None-Match');
    res.setHeader('Access-Control-Expose-Headers', 'ETag, Location, WWW-Authenticate');
  }

  // Preflight check
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  next();
}

module.exports = { corsMiddleware, ALLOWED_ORIGINS };
