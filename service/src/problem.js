// service/src/problem.js
// One function that produces every failure response in the API.
// Content-Type is always application/problem+json.

const { config } = require('./config');

/**
 * Build a Problem Details object (RFC 9457).
 */
function problem(res, status, typeSlug, title, detail, instance, extensions = {}) {
  return res.status(status).type('application/problem+json').json({
    type: `${config.baseUrl}/problems/${typeSlug}`,
    title,
    status,
    detail,
    instance,
    ...extensions,
  });
}

// Route pattern instead of the concrete path: "absent" and "not yours" must be
// indistinguishable, and a concrete path would contain the requested ID.
function instanceOf(req) {
  const base = req.baseUrl || '';
  const routePath = req.route?.path && req.route.path !== '/' ? req.route.path : '';
  return `${base}${routePath}` || req.path;
}

function unauthorized(res, instance, error = 'invalid_token') {
  res.set('WWW-Authenticate', `Bearer error="${error}"`);
  return problem(res, 401, 'unauthenticated', 'Unauthenticated',
    'Access token tidak ada atau tidak dapat diverifikasi. Sertakan access token yang valid pada header Authorization.',
    instance, { suggestedNextAction: 'Minta access token baru lalu ulangi request.' });
}

function forbidden(res, instance, needed) {
  res.set('WWW-Authenticate', `Bearer error="insufficient_scope", scope="${needed.join(' ')}"`);
  return problem(res, 403, 'insufficient-scope', 'Insufficient Scope',
    `Access token tidak memiliki scope yang dibutuhkan: ${needed.join(' ')}.`,
    instance, { requiredScopes: needed, suggestedNextAction: 'Gunakan token yang membawa scope yang dibutuhkan.' });
}

module.exports = { problem, instanceOf, unauthorized, forbidden };
