// service/src/utils/etag.js
const crypto = require('crypto');

function generateETag(data) {
  const content = typeof data === 'string' ? data : JSON.stringify(data);
  const hash = crypto.createHash('sha1').update(content).digest('hex').slice(0, 16);
  return `"${hash}"`;
}

module.exports = { generateETag };
