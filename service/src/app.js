// service/src/app.js
// Assembly: routes, global error handler, config validation.

const { config } = require('./config');
const express = require('express');
const { problem } = require('./problem');
const { authenticate } = require('./auth/authenticate');
const { logger } = require('./logger');

const app = express();
app.use(express.json());

// --- Health endpoint (public; no dependency check) ---
app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));

// --- Layer 1: authentication for every /v1 route ---
// Sets req.principal (null when anonymous); routes enforce what follows.
app.use('/v1', authenticate);

// --- Routes ---
app.use('/v1/assistance-requests', require('./routes/assistanceRequests'));
app.use('/v1/packages', require('./routes/packages'));
app.use('/v1/distributions', require('./routes/distributions'));
app.use('/v1/handovers', require('./routes/handovers'));

// --- 404 for unknown routes ---
app.use((req, res) => {
  problem(res, 404, 'resource-not-found', 'Resource Not Found',
    `Route ${req.method} ${req.path} tidak ditemukan.`, req.path);
});

// --- Global error handler ---
// Logs method, path, and message only — never headers, never the token.
app.use((err, req, res, _next) => {
  logger.error({ method: req.method, path: req.path, message: err.message }, 'unhandled error');
  problem(res, 500, 'internal-server-error', 'Internal Server Error',
    'Terjadi kesalahan internal saat memproses transaksi logistik. Silakan coba kembali.',
    req.path, { suggestedNextAction: 'Lakukan retry dengan exponential backoff.' });
});

app.listen(config.port, () => {
  logger.info({ port: config.port }, 'service running');
});

module.exports = app;
