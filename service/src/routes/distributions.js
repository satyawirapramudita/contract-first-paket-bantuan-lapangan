const express = require('express');
const router = express.Router();
const { problem, instanceOf } = require('../problem');
const { requireScope } = require('../auth/require-scope');
const { mayReadDistribution } = require('../auth/ownership');
const store = require('../store/distributions');
const { toDistribution } = require('../representations/distributions');
const { generateETag } = require('../utils/etag');

// GET /v1/distributions
router.get('/', requireScope('distributions:read'), async (req, res, next) => {
  try {
    const rows = await store.findAllForPrincipal(req.principal);
    const representations = rows.map(toDistribution);
    
    const etag = generateETag(representations);
    res.setHeader('ETag', etag);

    const clientETag = req.headers['if-none-match'];
    if (clientETag && clientETag === etag) {
      // Data belum berubah — kembalikan 304 tanpa body (menghemat bandwidth)
      return res.status(304).end();
    }

    return res.status(200).json({ data: representations });
  } catch (err) { next(err); }
});

// GET /v1/distributions/:distributionId
router.get('/:distributionId', requireScope('distributions:read'), async (req, res, next) => {
  try {
    const { distributionId } = req.params;
    // ... validasi format id & lookup db ...
    const row = await store.findById(distributionId);
    if (!row || !mayReadDistribution(req.principal, row)) {
      return problem(res, 404, 'resource-not-found', 'Resource Not Found',
        `Distribusi dengan ID ${distributionId} tidak ditemukan.`, instanceOf(req));
    }

    const representation = toDistribution(row);
    const etag = generateETag(representation);
    res.setHeader('ETag', etag);

    if (req.headers['if-none-match'] === etag) {
      return res.status(304).end();
    }

    return res.status(200).json(representation);
  } catch (err) { next(err); }
});


module.exports = router;
