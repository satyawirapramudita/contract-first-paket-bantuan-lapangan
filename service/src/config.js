// service/src/config.js
// Single place that reads and validates environment configuration.
// The service refuses to start when a required variable is missing.

require('dotenv').config();

const REQUIRED = ['DATABASE_URL', 'PORT', 'OIDC_ISSUER', 'OIDC_JWKS_URI', 'OIDC_AUDIENCE'];
const missing = REQUIRED.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(`[FATAL] Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

const config = {
  databaseUrl: process.env.DATABASE_URL,
  port: Number(process.env.PORT),
  baseUrl: process.env.BASE_URL || 'https://bantuan-lapangan.internal',
  oidcIssuer: process.env.OIDC_ISSUER,
  oidcJwksUri: process.env.OIDC_JWKS_URI,
  oidcAudience: process.env.OIDC_AUDIENCE,
  nodeEnv: process.env.NODE_ENV || 'development',
};

module.exports = { config };
