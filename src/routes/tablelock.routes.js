const express = require('express');
const router = express.Router();

const tableLockCtrl = require('../controllers/tablelock.controller');
const authMdw = require('../middleware/auth');

router.use(authMdw.protect);

// Customer routes
router.post('/:tableID/lock', authMdw.restrictTo('customer'), tableLockCtrl.lockTable);
router.delete('/:tableID/lock', authMdw.restrictTo('customer'), tableLockCtrl.releaseTableLock);

// Owner routes
router.get(
  '/locks/:restaurantID',
  authMdw.restrictTo('owner', 'admin'),
  tableLockCtrl.getRestaurantLocks
);

module.exports = router;
