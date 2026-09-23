const db = require('./db');

async function findById(id) {
  const { rows } = await db.query('SELECT * FROM distributions WHERE id = $1', [id]);
  return rows[0] ?? null;
}

// Visibility is constrained inside the query, never filtered afterwards.
async function findAllForPrincipal(principal) {
  if (principal.scopes.includes('requests:review') || principal.kind === 'service') {
    const { rows } = await db.query('SELECT * FROM distributions ORDER BY allocated_at DESC');
    return rows;
  }
  const { rows } = await db.query(
    'SELECT * FROM distributions WHERE field_officer_subject = $1 ORDER BY allocated_at DESC',
    [principal.subject]
  );
  return rows;
}

async function existsForRequestAndOfficer(requestId, subject) {
  const { rows } = await db.query(
    'SELECT 1 FROM distributions WHERE request_id = $1 AND field_officer_subject = $2 LIMIT 1',
    [requestId, subject]
  );
  return rows.length > 0;
}

module.exports = { findById, findAllForPrincipal, existsForRequestAndOfficer };
