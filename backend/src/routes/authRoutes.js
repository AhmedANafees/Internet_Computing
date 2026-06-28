'use strict';

const express = require('express');
const authenticate = require('../middleware/authenticate');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/login', authController.login);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.me);

module.exports = router;
