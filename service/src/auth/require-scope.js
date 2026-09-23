// service/src/auth/require-scope.js
// Layer 2: compares the token's scopes with the operation's required scope.

const { unauthorized, forbidden } = require('../problem');

function requireScope(...needed) {
  return function (req, res, next) {
    const principal = req.principal;
    if (!principal) return unauthorized(res, req.path); // no valid token

    const ok = needed.every((scope) => principal.scopes.includes(scope));
    if (!ok) return forbidden(res, req.path, needed); // valid token, missing permission

    return next();
  };
}

module.exports = { requireScope };
