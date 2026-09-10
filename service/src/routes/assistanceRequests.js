// service/src/routes/assistanceRequests.js
// Routes + handlers for /v1/assistance-requests
// Five parts of every operation: Route → Validate → Work → Represent → Respond

const express = require('express');
const router = express.Router();
const { problem } = require('../problem');
const store = require('../store/assistanceRequests');
const { toAssistanceRequest } = require('../representations/assistanceRequests');
const { validateCreate, validateListQuery } = require('../schemas/assistanceRequests');

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
