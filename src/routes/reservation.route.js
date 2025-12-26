const express = require('express');
const router = express.Router();

const reservationCtrl = require('../controllers/reservation.controller');
const authMdw = require('../middleware/auth');

// All routes require login
router.use(authMdw.protect);

// Customer routes
router.post('/', authMdw.restrictTo('customer'), reservationCtrl.createReservation);
router.get('/my-reservations', authMdw.restrictTo('customer'), reservationCtrl.getMyReservations);
router.patch('/:id/status', reservationCtrl.updateReservationStatus); // Customer/Owner/Admin
router.get('/:id', authMdw.restrictTo('customer'), reservationCtrl.getReservation); // Customer/Owner/Admin
router.put('/:id', authMdw.restrictTo('customer'), reservationCtrl.updateReservation);

// Owner routes
router.get(
  '/restaurant/:restaurantID',
  authMdw.restrictTo('owner', 'admin'),
  reservationCtrl.getRestaurantReservations
);
router.post(
  '/:id/check-in',
  authMdw.restrictTo('owner', 'admin'),
  reservationCtrl.checkInReservation
);

module.exports = router;
