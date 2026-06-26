'use strict';

const express = require('express');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const waitlistController = require('../controllers/waitlistController');

const router = express.Router();

router.get('/', authenticate, authorize('admin'), waitlistController.list);
router.get('/section/:crn', authenticate, authorize('admin'), waitlistController.bySection);
router.get('/student/:studentId', authenticate, waitlistController.byStudent);
router.get('/:id', authenticate, authorize('admin'), waitlistController.getById);
router.post('/', authenticate, waitlistController.addToWaitlist);
router.delete('/:id', authenticate, waitlistController.remove);

module.exports = router;
