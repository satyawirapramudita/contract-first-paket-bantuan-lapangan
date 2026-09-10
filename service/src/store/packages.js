const db = require('./db');
async function findAll() {
  const { rows } = await db.query('SELECT * FROM packages ORDER BY ready_at DESC');
  return rows;
}
module.exports = { findAll };
