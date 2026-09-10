// service/src/problem.js
// One function that produces every failure response in the API.
// Content-Type is always application/problem+json.

const BASE_URL = process.env.BASE_URL || 'https://bantuan-lapangan.internal';

/**
 * Build a Problem Details object (RFC 9457).
 * @param {object} res  - Express response object
 * @param {number} status - HTTP status code
 * @param {string} typeSlug - e.g. 'invalid-request-payload'
 * @param {string} title - short human-readable summary
 * @param {string} detail - contextual explanation
 * @param {string} instance - the request path, e.g. '/v1/assistance-requests'
 * @param {object} extensions - optional extra fields (currentStatus, suggestedNextAction, etc.)
 */
function problem(res, status, typeSlug, title, detail, instance, extensions = {}) {
  return res.status(status).type('application/problem+json').json({
    type: `${BASE_URL}/problems/${typeSlug}`,
    title,
    status,
    detail,
    instance,
    ...extensions,
  });
}

module.exports = { problem };
