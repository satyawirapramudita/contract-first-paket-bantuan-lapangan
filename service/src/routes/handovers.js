const express = require('express');
const router = express.Router();
const { problem } = require('../problem');
const { checkIdempotency } = require('../middleware/idempotency');
const idempotencyStore = require('../store/idempotency');
const store = require('../store/handovers');
const { toHandover } = require('../representations/handovers');
const { validateCreate } = require('../schemas/handovers');
const { randomId } = require('../utils/id');

// POST /v1/handovers
router.post('/', checkIdempotency, async (req, res, next) => {
  try {
    // Part 2: Validate
    const valid = validateCreate(req.body);
    if (!valid) {
      return problem(res, 400, 'invalid-request-payload', 'Invalid Request Payload',
        'Body request tidak sesuai schema yang didokumentasikan.',
        req.path, { invalidFields: validateCreate.errors });
    }

    const { distributionId, recipientNationalId, handedOverAt, fieldOfficerId, recipientNotes } = req.body;

    // Part 3: Work — cek distribution ada (404)
    const dist = await store.findDistributionById(distributionId);
    if (!dist) {
      return problem(res, 404, 'resource-not-found', 'Resource Not Found',
        `Distribusi dengan ID ${distributionId} tidak ditemukan.`, req.path);
    }

    // Part 3: Domain rule — cek sudah ada handover (409)
    const existingHandover = await store.findByDistributionId(distributionId);
    if (existingHandover) {
      return problem(res, 409, 'aid-already-dispensed', 'Aid Package Already Dispensed',
        `Paket distribusi ${distributionId} telah berstatus handed_over dan tidak dapat diserahkan kembali.`,
        req.path, {
          requestId: dist.request_id,
          currentStatus: dist.distribution_status,
          suggestedNextAction: "Jangan ulangi penyerahan paket. Tampilkan informasi 'Bantuan Sudah Diterima' di antarmuka."
        });
    }

    // Domain rule — cek status distribution valid untuk handover (422)
    if (!['assigned', 'in_transit'].includes(dist.distribution_status)) {
      return problem(res, 422, 'invalid-state-transition', 'Invalid State Transition',
        `Distribusi ${distributionId} dalam status '${dist.distribution_status}' dan tidak dapat menerima handover.`,
        req.path, { currentStatus: dist.distribution_status });
    }

    // Create handover
    const newId = randomId('hnd');
    const row = await store.insert({ id: newId, distributionId, recipientNationalId, handedOverAt, fieldOfficerId, recipientNotes });
    await store.updateDistributionStatus(distributionId, 'handed_over');

    const representation = toHandover(row);
    await idempotencyStore.save(res.locals.idempotencyKey, res.locals.idempotencyBodyHash, 201, representation);

    return res.status(201).location(`/v1/handovers/${newId}`).json(representation);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
