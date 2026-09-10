// service/src/app.js
// Assembly: routes, global error handler, config validation.

require('dotenv').config();

// --- Config validation: service refuses to start if required vars are missing ---
const REQUIRED_ENV = ['DATABASE_URL', 'PORT'];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length > 0) {
  console.error(`[FATAL] Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

const express = require('express');
const { problem } = require('./problem');

const app = express();
app.use(express.json());

// --- Health endpoint (no dependency check) ---
app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));

// --- Routes (mounted as phases are completed) ---
app.use('/v1/assistance-requests', require('./routes/assistanceRequests'));
// app.use('/v1/packages', require('./routes/packages'));
// app.use('/v1/distributions', require('./routes/distributions'));
// app.use('/v1/handovers', require('./routes/handovers'));

// --- 404 for unknown routes ---
app.use((req, res) => {
  problem(res, 404, 'resource-not-found', 'Resource Not Found',
    `Route ${req.method} ${req.path} tidak ditemukan.`, req.path);
});

// --- Global error handler (catch-all for unexpected failures) ---
// Internal detail goes to log ONLY, not to response body.
app.use((err, req, res, _next) => {
  console.error('[UNHANDLED ERROR]', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });
  problem(res, 500, 'internal-server-error', 'Internal Server Error',
    'Terjadi kesalahan internal saat memproses transaksi logistik. Silakan coba kembali.',
    req.path, { suggestedNextAction: 'Lakukan retry dengan exponential backoff.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[SERVICE] Running on port ${PORT}`);
});

module.exports = app;
