const express = require('express');
const router = express.Router();
const { problem, instanceOf } = require('../problem');
const { requireScope } = require('../auth/require-scope');
const { mayHandover } = require('../auth/ownership');
const { checkIdempotency } = require('../middleware/idempotency');
const idempotencyStore = require('../store/idempotency');
const store = require('../store/handovers');
const { toHandover } = require('../representations/handovers');
const { validateCreate } = require('../schemas/handovers');
const { randomId } = require('../utils/id');

const { generateETag } = require('../utils/etag');

// POST /v1/handovers
router.post('/', requireScope('handovers:write'), checkIdempotency, async (req, res, next) => {
  try {
    // Validasi payload ...
    const { distributionId, recipientNationalId, handedOverAt, fieldOfficerId, recipientNotes } = req.body;

    const dist = await store.findDistributionById(distributionId);
    if (!dist || !mayHandover(req.principal, dist)) {
      return problem(res, 404, 'resource-not-found', 'Resource Not Found',
        `Distribusi dengan ID ${distributionId} tidak ditemukan.`, instanceOf(req));
    }

    // A.8 Concurrency Check (If-Match ETag)
    const currentRepresentation = toDistribution(dist);
    const currentETag = generateETag(currentRepresentation);
    const ifMatch = req.headers['if-match'];

    if (ifMatch && ifMatch !== currentETag) {
      return problem(res, 412, 'precondition-failed', 'Precondition Failed',
        'Data distribusi telah diperbarui oleh sesi lain. Muat ulang data terbaru sebelum melanjutkan.',
        instanceOf(req), {
          currentETag,
          suggestedNextAction: 'Perbarui tampilan antarmuka dan verifikasi status terkini.'
        });
    }

    // Cek konflik domain apakah sudah pernah diserahkan
    const existingHandover = await store.findByDistributionId(distributionId);
    if (existingHandover) {
      return problem(res, 409, 'aid-already-dispensed', 'Aid Package Already Dispensed',
        `Paket distribusi ${distributionId} telah berstatus handed_over dan tidak dapat diserahkan kembali.`,
        instanceOf(req), {
          currentStatus: dist.distribution_status,
          suggestedNextAction: 'Jangan ulangi penyerahan paket. Tampilkan informasi Bantuan Sudah Diterima.'
        });
    }

    if (!['assigned', 'in_transit'].includes(dist.distribution_status)) {
      return problem(res, 422, 'invalid-state-transition', 'Invalid State Transition',
        `Distribusi ${distributionId} dalam status '${dist.distribution_status}' dan tidak dapat menerima handover.`,
        instanceOf(req));
    }

    // Eksekusi mutasi
    const newId = randomId('hnd');
    const row = await store.insert({ id: newId, distributionId, recipientNationalId, handedOverAt, fieldOfficerId, recipientNotes });
    await store.updateDistributionStatus(distributionId, 'handed_over');

    const representation = toHandover(row);
    await idempotencyStore.save(res.locals.idempotencyKey, res.locals.idempotencyBodyHash, 201, representation);

    return res.status(201).location(`/v1/handovers/${newId}`).json(representation);
  } catch (err) { next(err); }
});

module.exports = router;
