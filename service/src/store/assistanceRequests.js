// service/src/store/assistanceRequests.js
// Only layer that runs SQL for assistance_requests.

const db = require('./db');

async function findById(id) {
  const { rows } = await db.query(
    'SELECT * FROM assistance_requests WHERE id = $1',
    [id]
  );
  return rows[0] ?? null;
}

async function findAll({ status, urgency, cursor, limit = 20 }) {
  const params = [];
  const conditions = [];
  let idx = 1;

  if (status) { conditions.push(`status = $${idx++}`); params.push(status); }
  if (urgency) { conditions.push(`urgency = $${idx++}`); params.push(urgency); }
  if (cursor) {
    // cursor = base64(requested_at:id) — decode for keyset pagination
    const decoded = Buffer.from(cursor, 'base64').toString('utf8');
    const [cursorTs, cursorId] = decoded.split('|');
    conditions.push(`(requested_at, id) < ($${idx++}, $${idx++})`);
    params.push(cursorTs, cursorId);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const effectiveLimit = Math.min(limit, 100);
  params.push(effectiveLimit + 1); // fetch one extra to determine hasMore

  const { rows } = await db.query(
    `SELECT * FROM assistance_requests ${where} ORDER BY requested_at DESC, id DESC LIMIT $${idx}`,
    params
  );

  const hasMore = rows.length > effectiveLimit;
  const data = hasMore ? rows.slice(0, effectiveLimit) : rows;
  const nextCursor = hasMore
    ? Buffer.from(`${data[data.length - 1].requested_at}|${data[data.length - 1].id}`).toString('base64')
    : null;

  return { data, hasMore, nextCursor };
}

async function insert(record) {
  const { rows } = await db.query(
    `INSERT INTO assistance_requests
       (id, applicant_national_id, applicant_name, family_member_count,
        target_location, required_package_type, status, urgency, requested_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING *`,
    [record.id, record.applicantNationalId, record.applicantName,
     record.familyMemberCount, record.targetLocation, record.requiredPackageType,
     record.status, record.urgency, record.requestedAt]
  );
  return rows[0];
}

module.exports = { findById, findAll, insert };
