// tests/helpers/jwks-server.js
// Generates a throwaway RS256 key pair, serves its JWKS, and writes the
// private key next to this file so tests/helpers/token.js can sign with it.
// This key exists only inside the test environment and is never used elsewhere.

const { createServer } = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');

const serviceRequire = createRequire(path.join(__dirname, '../../service/package.json'));
const { generateKeyPair, exportJWK } = serviceRequire('jose');

const PORT = Number(process.env.TEST_JWKS_PORT || 9999);
const KEY_FILE = process.env.TEST_KEY_FILE || path.join(__dirname, '.test-key.json');

async function main() {
  const { publicKey, privateKey } = await generateKeyPair('RS256');
  const publicJwk = { ...(await exportJWK(publicKey)), kid: 'test-key', alg: 'RS256', use: 'sig' };
  const privateJwk = await exportJWK(privateKey);
  fs.writeFileSync(KEY_FILE, JSON.stringify(privateJwk));

  const server = createServer((req, res) => {
    if (req.url === '/jwks.json') {
      res.setHeader('content-type', 'application/json');
      return res.end(JSON.stringify({ keys: [publicJwk] }));
    }
    res.statusCode = 404;
    res.end();
  });

  server.listen(PORT, '127.0.0.1', () => {
    console.log(`[TEST JWKS] listening on http://127.0.0.1:${PORT}/jwks.json`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
