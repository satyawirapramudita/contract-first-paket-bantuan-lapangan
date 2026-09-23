// tests/authz/authz.test.js
// Four negative tests, each crossing a different boundary, plus Layer 1 tests.
// Requires: service running with OIDC_* pointing at tests/helpers/jwks-server.js,
// and DATABASE_URL available for post-condition checks.

const { test, before } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { createRequire } = require('node:module');
const { randomUUID } = require('node:crypto');

const serviceRequire = createRequire(path.join(__dirname, '../../service/package.json'));
const { Client } = serviceRequire('pg');
const { tokenFor } = require('../helpers/token');

const BASE = process.env.BASE_URL || 'http://127.0.0.1:3000';

let pemohonA, pemohonB, petugasA, petugasB, koordinator;

before(async () => {
  pemohonA = await tokenFor('pemohon-a', ['requests:read', 'requests:write']);
  pemohonB = await tokenFor('pemohon-b', ['requests:read', 'requests:write']);
  petugasA = await tokenFor('petugas-a', ['requests:read', 'distributions:read', 'handovers:write']);
  petugasB = await tokenFor('petugas-b', ['requests:read', 'distributions:read', 'handovers:write']);
  koordinator = await tokenFor('koordinator-a', ['requests:read', 'requests:review', 'packages:read']);
});

async function request(method, urlPath, { token, body, idempotencyKey } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;

  const res = await fetch(`${BASE}${urlPath}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let parsed = null;
  try { parsed = JSON.parse(text); } catch { /* non-JSON body */ }
  return { status: res.status, body: parsed, headers: res.headers };
}

async function dbQuery(sql, params = []) {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const { rows } = await client.query(sql, params);
    return rows;
  } finally {
    await client.end();
  }
}

// ---------- Layer 1: authentication ----------

test('Layer 1: request without a token is refused with 401', async () => {
  const res = await request('GET', '/v1/assistance-requests');
  assert.equal(res.status, 401);
  assert.match(res.headers.get('www-authenticate') ?? '', /invalid_token/);
});

test('Layer 1: edited token payload is refused with 401', async () => {
  const [header, payload, signature] = pemohonA.split('.');
  const tampered = `${header}.${payload.slice(0, -2)}AA.${signature}`;
  const res = await request('GET', '/v1/assistance-requests', { token: tampered });
  assert.equal(res.status, 401);
});

// ---------- Boundary 1: pemohon vs pemohon (object) ----------

test('Boundary 1: pemohon-a cannot read pemohon-b request', async () => {
  const res = await request('GET', '/v1/assistance-requests/req_2Mn85Cd', { token: pemohonA });
  assert.equal(res.status, 404); // not 403
  assert.equal(res.body?.applicantName, undefined);
});

test('Boundary 1: "not yours" and "does not exist" are byte-identical', async () => {
  const notYours = await request('GET', '/v1/assistance-requests/req_2Mn85Cd', { token: pemohonA });
  const absent = await request('GET', '/v1/assistance-requests/req_ZZZZZZZ', { token: pemohonA });
  assert.equal(notYours.status, 404);
  assert.equal(absent.status, 404);
  assert.deepEqual(notYours.body, absent.body);
});

// ---------- Boundary 2: petugas vs petugas (write) ----------

test('Boundary 2: petugas-a cannot confirm handover on petugas-b distribution', async () => {
  const beforeRows = await dbQuery(
    'SELECT distribution_status FROM distributions WHERE id = $1', ['dst_99cBb00']);
  assert.equal(beforeRows[0].distribution_status, 'assigned');

  const res = await request('POST', '/v1/handovers', {
    token: petugasA,
    idempotencyKey: randomUUID(),
    body: {
      distributionId: 'dst_99cBb00',
      recipientNationalId: '3271056709800002',
      handedOverAt: '2026-09-19T10:00:00+07:00',
      fieldOfficerId: 'ofc_66zZa34',
    },
  });
  assert.equal(res.status, 404);

  // The right status is not enough: prove nothing changed.
  const afterRows = await dbQuery(
    'SELECT distribution_status FROM distributions WHERE id = $1', ['dst_99cBb00']);
  assert.equal(afterRows[0].distribution_status, 'assigned');

  const handovers = await dbQuery(
    'SELECT count(*)::int AS total FROM handovers WHERE distribution_id = $1', ['dst_99cBb00']);
  assert.equal(handovers[0].total, 0);
});

// ---------- Boundary 3: scope (Layer 2) ----------

test('Boundary 3: pemohon calling a staff-only operation is refused with 403', async () => {
  const res = await request('POST', '/v1/handovers', {
    token: pemohonA,
    idempotencyKey: randomUUID(),
    body: {
      distributionId: 'dst_88bAa99',
      recipientNationalId: '3578021203920003',
      handedOverAt: '2026-09-19T10:00:00+07:00',
      fieldOfficerId: 'ofc_55xYz12',
    },
  });
  assert.equal(res.status, 403);
  assert.match(res.headers.get('www-authenticate') ?? '', /insufficient_scope/);
});

// ---------- Boundary 4: petugas vs petugas (read, endpoint baru) ----------

test('Boundary 4: petugas-a cannot read petugas-b distribution', async () => {
  const res = await request('GET', '/v1/distributions/dst_99cBb00', { token: petugasA });
  assert.equal(res.status, 404);
});

test('Boundary 4: distribution "not yours" and "does not exist" are byte-identical', async () => {
  const notYours = await request('GET', '/v1/distributions/dst_99cBb00', { token: petugasA });
  const absent = await request('GET', '/v1/distributions/dst_ZZZZZZZ', { token: petugasA });
  assert.deepEqual(notYours.body, absent.body);
});

// ---------- Positive controls ----------

test('owner can read own request, assigned officer can read own distribution', async () => {
  const own = await request('GET', '/v1/assistance-requests/req_7Kq91Ab', { token: pemohonA });
  assert.equal(own.status, 200);

  const dist = await request('GET', '/v1/distributions/dst_88bAa99', { token: petugasA });
  assert.equal(dist.status, 200);

  const list = await request('GET', '/v1/distributions', { token: petugasA });
  assert.equal(list.status, 200);
  assert.ok(list.body.data.every((d) => d.id === 'dst_88bAa99'));
});

test('coordinator sees every request in the collection', async () => {
  const res = await request('GET', '/v1/assistance-requests', { token: koordinator });
  assert.equal(res.status, 200);
  assert.ok(res.body.data.length >= 3);
});
