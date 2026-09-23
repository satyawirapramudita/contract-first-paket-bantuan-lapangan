// service/src/routes/assistanceRequests.js
// Routes + handlers for /v1/assistance-requests
// Five parts of every operation: Route → Validate → Work → Represent → Respond
const express = require('express');
const router = express.Router();
const { problem, instanceOf } = require('../problem');
const { requireScope } = require('../auth/require-scope');
const { mayReadRequest } = require('../auth/ownership');
const { checkIdempotency } = require('../middleware/idempotency');
const idempotencyStore = require('../store/idempotency');
const store = require('../store/assistanceRequests');
const { toAssistanceRequest } = require('../representations/assistanceRequests');
const { validateCreate, validateListQuery } = require('../schemas/assistanceRequests');
const { randomId } = require('../utils/id');

// -------------------------------------------------------
// POST /v1/assistance-requests
// -------------------------------------------------------
router.post('/', requireScope('requests:write'), checkIdempotency, async (req, res, next) => {
  try {
    // Part 2: Validate body (sekali, terpusat)
    const valid = validateCreate(req.body);
    if (!valid) {
      return problem(res, 400, 'invalid-request-payload', 'Invalid Request Payload',
        'Body request tidak sesuai schema yang didokumentasikan.',
        instanceOf(req), { invalidFields: validateCreate.errors });
    }

    // Part 3: Work — domain rules
    const newId = randomId('req');
    const record = {
      id: newId,
      ...req.body,
      applicantSubject: req.principal.subject, // owner = authenticated principal
      status: 'submitted',
      urgency: req.body.urgency ?? 'medium',
      requestedAt: new Date().toISOString(),
    };
    const row = await store.insert(record);

    // Part 4+5: Represent & Respond 201 + Location header
    const representation = toAssistanceRequest(row);

    await idempotencyStore.save(
      res.locals.idempotencyKey,
      res.locals.idempotencyBodyHash,
      201,
      representation
    );

    return res
      .status(201)
      .location(`/v1/assistance-requests/${newId}`)
      .json(representation);
  } catch (err) {
    next(err);
  }
});

// -------------------------------------------------------
// GET /v1/assistance-requests/:requestId  (single entity)
// -------------------------------------------------------
router.get('/:requestId', requireScope('requests:read'), async (req, res, next) => {
  try {
    const { requestId } = req.params;

    // Part 2: Validate — pattern check sebelum DB lookup
    if (!/^req_[A-Za-z0-9]+$/.test(requestId)) {
      return problem(res, 400, 'invalid-request-payload', 'Invalid Request Payload',
        `ID permohonan '${requestId}' tidak sesuai format yang diharapkan (req_XXXXX).`,
        instanceOf(req));
    }

    // Part 3: Work — load the object, then Layer 3 object check
    const row = await store.findById(requestId);
    if (!row || !(await mayReadRequest(req.principal, row))) {
      // "tidak ada" dan "bukan miliknya" dijawab identik
      return problem(res, 404, 'resource-not-found', 'Resource Not Found',
        'Permohonan tidak ditemukan di basis data posko.',
        instanceOf(req));
    }

    // Part 4: Represent  |  Part 5: Respond
    return res.status(200).json(toAssistanceRequest(row));
  } catch (err) {
    next(err);
  }
});

// -------------------------------------------------------
// GET /v1/assistance-requests  (collection + pagination)
// -------------------------------------------------------
router.get('/', requireScope('requests:read'), async (req, res, next) => {
  try {
    // Part 2: Validate query params
    if (req.query.limit !== undefined) req.query.limit = parseInt(req.query.limit, 10);

    const valid = validateListQuery(req.query);
    if (!valid) {
      return problem(res, 400, 'invalid-request-payload', 'Invalid Request Payload',
        'Query parameter tidak valid.',
        instanceOf(req), { invalidFields: validateListQuery.errors });
    }

    // Part 3: Work — koleksi dibatasi di dalam query, bukan setelahnya
    const { status, urgency, cursor, limit } = req.query;
    const { data, hasMore, nextCursor } =
      await store.findAllForPrincipal(req.principal, { status, urgency, cursor, limit });

    // Part 4+5: Represent & Respond
    return res.status(200).json({
      data: data.map(toAssistanceRequest),
      pagination: { hasMore, nextCursor: nextCursor ?? null },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
