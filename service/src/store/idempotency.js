// service/src/store/idempotency.js
// Idempotency key is ALWAYS stored in DB table, never in process memory.
// Reason: retry window = failure window = most likely moment for process restart.

const db = require('./db');
const crypto = require('crypto');

function hashBody(body) {
  return crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex');
}

async function find(key) {
  const { rows } = await db.query(
    'SELECT * FROM idempotency_keys WHERE key = $1', [key]
  );
  return rows[0] ?? null;
}

async function save(key, bodyHash, statusCode, responseBody) {
  await db.query(
    `INSERT INTO idempotency_keys (key, body_hash, status_code, response_body)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (key) DO NOTHING`,
    [key, bodyHash, statusCode, JSON.stringify(responseBody)]
  );
}

module.exports = { hashBody, find, save };
