const express = require('express');
const router = express.Router();
const { requireScope } = require('../auth/require-scope');
const store = require('../store/packages');
const { toPackage } = require('../representations/packages');

// Inventaris gudang bersifat bersama; akses dijaga oleh scope packages:read.
router.get('/', requireScope('packages:read'), async (req, res, next) => {
  try {
    const rows = await store.findAll();
    return res.status(200).json({ data: rows.map(toPackage) });
  } catch (err) { next(err); }
});

module.exports = router;
