const express = require('express');
const router = express.Router();

const restaurantCtrl = require('../controllers/restaurant.controller');
const authMdw = require('../middleware/auth');

// Public routes
router.get('/', restaurantCtrl.getAllRestaurants);
router.get('/:id', restaurantCtrl.getRestaurant);

// Protected routes
router.use(authMdw.protect);

// Owner routes
router.post('/', authMdw.restrictTo('owner', 'admin'), restaurantCtrl.createRestaurant);
router.put('/:id', authMdw.restrictTo('owner', 'admin'), restaurantCtrl.updateRestaurant);
router.put('/:id/floorplan', authMdw.restrictTo('owner'), restaurantCtrl.updateFloorPlan);
router.delete('/:id', authMdw.restrictTo('owner', 'admin'), restaurantCtrl.deleteRestaurant);
router.get(
  '/my-restaurants',
  authMdw.restrictTo('owner', 'admin'),
  restaurantCtrl.getMyRestaurants
);

module.exports = router;
