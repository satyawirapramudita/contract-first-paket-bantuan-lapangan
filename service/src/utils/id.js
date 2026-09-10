// service/src/utils/id.js
const { randomBytes } = require('crypto');

function randomId(prefix) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = prefix + '_';
  const bytes = randomBytes(7);
  for (const b of bytes) result += chars[b % chars.length];
  return result;
}

module.exports = { randomId };
