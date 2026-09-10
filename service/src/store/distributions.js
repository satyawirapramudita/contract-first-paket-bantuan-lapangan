const db = require('./db');
async function findAll() {
  const { rows } = await db.query('SELECT * FROM distributions ORDER BY allocated_at DESC');
  return rows;
}
module.exports = { findAll };
