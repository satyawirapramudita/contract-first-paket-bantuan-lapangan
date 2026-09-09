// service/src/middleware/idempotency.js
// Applies the four idempotency rules from docs/idempotency.md to any POST route.

const { problem } = require('../problem');
const idempotencyStore = require('../store/idempotency');

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function checkIdempotency(req, res, next) {
  const key = req.headers['idempotency-key'];

  // Rule 1: Header missing or malformed → 400 before any work
  if (!key || !UUID_V4.test(key)) {
    return problem(res, 400, 'invalid-request-payload', 'Invalid Request Payload',
      'Header Idempotency-Key wajib disertakan dengan format UUID v4 kanonik.',
      req.path, { suggestedNextAction: 'Periksa kembali header dan format request payload.' });
  }

  const bodyHash = idempotencyStore.hashBody(req.body);
  const existing = await idempotencyStore.find(key);

  if (existing) {
    // Rule 3: Same key, same body → return stored response (no reprocessing)
    if (existing.body_hash === bodyHash) {
      return res.status(existing.status_code)
        .type('application/json')
        .json(JSON.parse(existing.response_body));
    }
    // Rule 4: Same key, different body → 409
    return problem(res, 409, 'idempotency-key-reuse', 'Idempotency Key Reuse',
      'Idempotency-Key ini sudah digunakan dengan body request yang berbeda.',
      req.path, { originalRequestHash: existing.body_hash });
  }

  // Rule 2: New key → attach helpers to res for post-processing
  res.locals.idempotencyKey = key;
  res.locals.idempotencyBodyHash = bodyHash;
  next();
}

module.exports = { checkIdempotency };
