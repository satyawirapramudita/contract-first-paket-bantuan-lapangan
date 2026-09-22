// tests/helpers/token.js
// Signs test access tokens with the key written by jwks-server.js.
// CLI: node tests/helpers/token.js <subject> <scope...>

const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');

const serviceRequire = createRequire(path.join(__dirname, '../../service/package.json'));
const { importJWK, SignJWT } = serviceRequire('jose');

const KEY_FILE = process.env.TEST_KEY_FILE || path.join(__dirname, '.test-key.json');
const ISSUER = process.env.OIDC_ISSUER || 'http://127.0.0.1:9999';
const AUDIENCE = process.env.OIDC_AUDIENCE || 'bantuan-lapangan-api';

async function tokenFor(subject, scopes) {
  const privateJwk = JSON.parse(fs.readFileSync(KEY_FILE, 'utf8'));
  const privateKey = await importJWK(privateJwk, 'RS256');
  return new SignJWT({ scope: scopes.join(' '), preferred_username: subject })
    .setProtectedHeader({ alg: 'RS256', kid: 'test-key' })
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setSubject(subject)
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(privateKey);
}

async function main() {
  const [subject, ...scopes] = process.argv.slice(2);
  if (!subject || scopes.length === 0) {
    console.error('usage: node tests/helpers/token.js <subject> <scope...>');
    process.exit(1);
  }
  console.log(await tokenFor(subject, scopes));
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { tokenFor };
