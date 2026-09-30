const { test, before } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { tokenFor } = require('../helpers/token');

const BASE = process.env.BASE_URL || 'http://127.0.0.1:3000';
let petugasToken;

before(async () => {
  petugasToken = await tokenFor('petugas-a', ['requests:read', 'distributions:read', 'handovers:write']);
});

test('CORS: Preflight OPTIONS request returns allowed origin and methods', async () => {
  const res = await fetch(`${BASE}/v1/distributions`, {
    method: 'OPTIONS',
    headers: {
      'Origin': 'http://localhost:5173',
      'Access-Control-Request-Method': 'GET',
      'Access-Control-Request-Headers': 'Authorization'
    }
  });
  assert.equal(res.status, 204);
  assert.equal(res.headers.get('access-control-allow-origin'), 'http://localhost:5173');
  assert.match(res.headers.get('access-control-allow-headers'), /authorization/i);
});

test('A.7 Conditional Read: GET /v1/distributions returns ETag and 304 on second call', async () => {
  const firstRes = await fetch(`${BASE}/v1/distributions`, {
    headers: { 'Authorization': `Bearer ${petugasToken}` }
  });
  assert.equal(firstRes.status, 200);
  const etag = firstRes.headers.get('etag');
  assert.ok(etag, 'ETag header must be present');

  const secondRes = await fetch(`${BASE}/v1/distributions`, {
    headers: {
      'Authorization': `Bearer ${petugasToken}`,
      'If-None-Match': etag
    }
  });
  assert.equal(secondRes.status, 304, 'Must return 304 Not Modified');
  assert.equal(await secondRes.text(), '', 'Body must be empty on 304');
});

test('A.8 Conditional Write: POST /v1/handovers with stale If-Match returns 412', async () => {
  const res = await fetch(`${BASE}/v1/handovers`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${petugasToken}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': randomUUID(),
      'If-Match': '"stale-etag-999"'
    },
    body: JSON.stringify({
      distributionId: 'dst_88bAa99',
      recipientNationalId: '3578021203920003',
      handedOverAt: new Date().toISOString(),
      fieldOfficerId: 'ofc_55xYz12'
    })
  });
  assert.equal(res.status, 412, 'Must return 412 Precondition Failed');
  const body = await res.json();
  assert.equal(body.title, 'Precondition Failed');
});
