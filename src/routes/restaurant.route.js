const express = require('express');
const router = express.Router();

const restaurantCtrl = require('../controllers/restaurant.controller');
const authMdw = require('../middleware/auth');
const uploadMdw = require('../middleware/upload');

// Public routes
router.get('/', restaurantCtrl.getAllRestaurants);
router.get('/:id', restaurantCtrl.getRestaurant);

// Protected routes
router.use(authMdw.protect);

// Owner routes - with upload
router.post(
  '/',
  authMdw.restrictTo('owner', 'admin'),
  uploadMdw.upload.fields([
    { name: 'zones[0][backgroundImage]' },
    { name: 'zones[1][backgroundImage]' },
  ]),
  uploadMdw.handleUploadError,
  restaurantCtrl.createRestaurant
);

router.put(
  '/:id/floorplan',
  authMdw.restrictTo('owner'),
  uploadMdw.upload.fields([
    { name: 'zones[0][backgroundImage]' },
    { name: 'zones[1][backgroundImage]' },
  ]),
  uploadMdw.handleUploadError,
  restaurantCtrl.updateFloorPlan
);

// Other owner routes
router.put('/:id', authMdw.restrictTo('owner', 'admin'), restaurantCtrl.updateRestaurant);
router.delete('/:id', authMdw.restrictTo('owner', 'admin'), restaurantCtrl.deleteRestaurant);
router.get(
  '/my-restaurants',
  authMdw.restrictTo('owner', 'admin'),
  restaurantCtrl.getMyRestaurants
);

module.exports = router;
