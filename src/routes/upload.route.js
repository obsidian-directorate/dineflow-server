const express = require('express');
const router = express.Router();

const uploadCtrl = require('../controllers/upload.controller');
const authMdw = require('../middleware/auth');
const uploadMdw = require('../middleware/upload');

router.use(authMdw.protect);

// Upload single image
router.post(
  '/single',
  authMdw.restrictTo('owner', 'admin'),
  uploadMdw.upload.single('image'),
  uploadMdw.handleUploadError,
  uploadCtrl.uploadImage
);

// Upload multiple images
router.post(
  '/multiple',
  authMdw.restrictTo('owner', 'admin'),
  uploadMdw.upload.array('images', 10), // Up to 10 files
  uploadMdw.handleUploadError,
  uploadCtrl.uploadMultipleImages
);

module.exports = router;
