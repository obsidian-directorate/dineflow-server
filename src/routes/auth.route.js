const express = require('express');
const router = express.Router();

const authCtrl = require('../controllers/auth.controller');
const authMdw = require('../middleware/auth');

// Public routes
router.post('/register', authCtrl.register);
router.post('/login', authCtrl.login);

// Protected routes (login required)
router.get('/profile', authMdw.protect, authCtrl.getProfile);
router.post('/logout', authMdw.protect, authCtrl.logout);

module.exports = router;
