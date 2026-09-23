// service/src/auth/principal.js
// Translates provider-specific claims into a fixed internal shape.

function principalFrom(claims) {
  const username = claims.preferred_username;
  return {
    // preferred_username dipakai sebagai subject domain supaya baris database
    // dapat dicocokkan dengan aktor; fallback ke sub untuk token tanpa username.
    subject: username ?? claims.sub,
    kind: username ? 'user' : 'service',
    scopes: String(claims.scope ?? '').split(' ').filter(Boolean),
    tokenId: claims.jti,
  };
}

module.exports = { principalFrom };
