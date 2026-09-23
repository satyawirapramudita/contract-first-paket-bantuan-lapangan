// service/src/auth/authenticate.js
// Layer 1: decides only "who sent this request?".

const { verifyAccessToken } = require('./verify');
const { principalFrom } = require('./principal');
const { unauthorized } = require('../problem');
const { logger } = require('../logger');

async function authenticate(req, res, next) {
  const header = req.headers.authorization ?? '';
  if (!header.startsWith('Bearer ')) {
    req.principal = null; // anonymous; the routes decide whether that is allowed
    return next();
  }

  try {
    const claims = await verifyAccessToken(header.slice(7));
    req.principal = principalFrom(claims);
    return next();
  } catch (err) {
    // the reason for refusal is logged; the token never is
    logger.warn({ reason: err.code ?? err.name, path: req.path }, 'token rejected');
    return unauthorized(res, req.path);
  }
}

module.exports = { authenticate };
