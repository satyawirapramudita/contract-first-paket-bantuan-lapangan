const express = require('express');
const router = express.Router();
const store = require('../store/packages');
const { toPackage } = require('../representations/packages');

router.get('/', async (req, res, next) => {
  try {
    const rows = await store.findAll();
    return res.status(200).json({ data: rows.map(toPackage) });
  } catch (err) { next(err); }
});
module.exports = router;
