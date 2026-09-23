// service/src/auth/verify.js
// Cryptography and standard claims. The only place that knows about JWKS.

const { createRemoteJWKSet, jwtVerify } = require('jose');
const { config } = require('../config');

// Public keys are fetched once and cached. Building a new JWKSet per request
// would mean one outbound HTTP call per API request.
const jwks = createRemoteJWKSet(new URL(config.oidcJwksUri));

async function verifyAccessToken(raw) {
  const { payload } = await jwtVerify(raw, jwks, {
    issuer: config.oidcIssuer,
    audience: config.oidcAudience,
    algorithms: ['RS256'], // allowlist; closes the "none" algorithm
    clockTolerance: 5,
  });
  return payload;
}

module.exports = { verifyAccessToken };
