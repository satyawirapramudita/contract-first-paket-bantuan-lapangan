const express = require('express');
const router = express.Router();
const store = require('../store/distributions');
const { toDistribution } = require('../representations/distributions');

router.get('/', async (req, res, next) => {
  try {
    const rows = await store.findAll();
    return res.status(200).json({ data: rows.map(toDistribution) });
  } catch (err) { next(err); }
});
module.exports = router;
