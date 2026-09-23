const express = require('express');
const router = express.Router();
const { problem, instanceOf } = require('../problem');
const { requireScope } = require('../auth/require-scope');
const { mayReadDistribution } = require('../auth/ownership');
const store = require('../store/distributions');
const { toDistribution } = require('../representations/distributions');

// GET /v1/distributions — koleksi dibatasi di dalam query
router.get('/', requireScope('distributions:read'), async (req, res, next) => {
  try {
    const rows = await store.findAllForPrincipal(req.principal);
    return res.status(200).json({ data: rows.map(toDistribution) });
  } catch (err) { next(err); }
});

// GET /v1/distributions/:distributionId
router.get('/:distributionId', requireScope('distributions:read'), async (req, res, next) => {
  try {
    const { distributionId } = req.params;

    if (!/^dst_[A-Za-z0-9]+$/.test(distributionId)) {
      return problem(res, 400, 'invalid-request-payload', 'Invalid Request Payload',
        `ID distribusi '${distributionId}' tidak sesuai format yang diharapkan (dst_XXXXX).`,
        instanceOf(req));
    }

    const row = await store.findById(distributionId);
    if (!row || !mayReadDistribution(req.principal, row)) {
      // "tidak ada" dan "bukan miliknya" dijawab identik
      return problem(res, 404, 'resource-not-found', 'Resource Not Found',
        'Distribusi tidak ditemukan.',
        instanceOf(req));
    }

    return res.status(200).json(toDistribution(row));
  } catch (err) { next(err); }
});

module.exports = router;
