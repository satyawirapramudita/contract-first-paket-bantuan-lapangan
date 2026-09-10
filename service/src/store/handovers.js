const db = require('./db');

async function findByDistributionId(distributionId) {
  const { rows } = await db.query(
    'SELECT * FROM handovers WHERE distribution_id = $1', [distributionId]
  );
  return rows[0] ?? null;
}

async function findDistributionById(distributionId) {
  const { rows } = await db.query(
    'SELECT * FROM distributions WHERE id = $1', [distributionId]
  );
  return rows[0] ?? null;
}

async function insert(record) {
  const { rows } = await db.query(
    `INSERT INTO handovers
       (id, distribution_id, recipient_national_id, field_officer_id, handed_over_at, status, recipient_notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING *`,
    [record.id, record.distributionId, record.recipientNationalId,
     record.fieldOfficerId, record.handedOverAt, 'confirmed', record.recipientNotes ?? null]
  );
  return rows[0];
}

async function updateDistributionStatus(distributionId, status) {
  await db.query(
    'UPDATE distributions SET distribution_status = $1 WHERE id = $2',
    [status, distributionId]
  );
}

module.exports = { findByDistributionId, findDistributionById, insert, updateDistributionStatus };
