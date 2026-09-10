// service/src/routes/assistanceRequests.js
// Routes + handlers for /v1/assistance-requests
// Five parts of every operation: Route → Validate → Work → Represent → Respond
const { checkIdempotency } = require('../middleware/idempotency');
const idempotencyStore = require('../store/idempotency');
const { randomId } = require('../utils/id'); 
const express = require('express');
const router = express.Router();
const { problem } = require('../problem');
const store = require('../store/assistanceRequests');
const { toAssistanceRequest } = require('../representations/assistanceRequests');
const { validateCreate, validateListQuery } = require('../schemas/assistanceRequests');

// -------------------------------------------------------
// POST /v1/assistance-requests
// -------------------------------------------------------
router.post('/', checkIdempotency, async (req, res, next) => {
  try {
    // Part 2: Validate body (sekali, terpusat)
    const valid = validateCreate(req.body);
    if (!valid) {
      return problem(res, 400, 'invalid-request-payload', 'Invalid Request Payload',
        'Body request tidak sesuai schema yang didokumentasikan.',
        req.path, { invalidFields: validateCreate.errors });
    }

    // Part 3: Work — domain rules
    // (No 422 domain rules for create; 422 would be for referenced entity not existing)

    const newId = randomId('req');
    const record = {
      id: newId,
      ...req.body,
      status: 'submitted',
      urgency: req.body.urgency ?? 'medium',
      requestedAt: new Date().toISOString(),
    };
    const row = await store.insert(record);

    // Part 4+5: Represent & Respond 201 + Location header
    const representation = toAssistanceRequest(row);

    // Store idempotency response
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
router.get('/:requestId', async (req, res, next) => {
  try {
    const { requestId } = req.params;

    // Part 2: Validate — pattern check sebelum DB lookup
    if (!/^req_[A-Za-z0-9]+$/.test(requestId)) {
      return problem(res, 400, 'invalid-request-payload', 'Invalid Request Payload',
        `ID permohonan '${requestId}' tidak sesuai format yang diharapkan (req_XXXXX).`,
        req.path);
    }

    // Part 3: Work
    const row = await store.findById(requestId);
    if (!row) {
      return problem(res, 404, 'resource-not-found', 'Resource Not Found',
        `Permohonan dengan ID ${requestId} tidak ditemukan di basis data posko.`,
        req.path);
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
router.get('/', async (req, res, next) => {
  try {
    // Part 2: Validate query params
    // Coerce limit to integer for AJV
    if (req.query.limit !== undefined) req.query.limit = parseInt(req.query.limit, 10);

    const valid = validateListQuery(req.query);
    if (!valid) {
      return problem(res, 400, 'invalid-request-payload', 'Invalid Request Payload',
        'Query parameter tidak valid.',
        req.path, { invalidFields: validateListQuery.errors });
    }

    // Part 3: Work
    const { status, urgency, cursor, limit } = req.query;
    const { data, hasMore, nextCursor } = await store.findAll({ status, urgency, cursor, limit });

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
