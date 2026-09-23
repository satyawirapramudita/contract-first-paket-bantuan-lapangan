// service/src/logger.js
// Application logger. Authorization headers are redacted at the logging
// boundary, so a token can never reach a log line.

const pino = require('pino');
const { config } = require('./config');

const logger = pino({
  level: 'info',
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'res.headers["set-cookie"]',
      'authorization',
      'token',
      'accessToken',
      'refreshToken',
    ],
    censor: '(redacted)',
  },
});

module.exports = { logger };
