'use strict';

const express = require('express');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const enrollmentController = require('../controllers/enrollmentController');

const router = express.Router();

router.get('/', authenticate, authorize('admin'), enrollmentController.list);
router.get('/:id', authenticate, enrollmentController.getById);
router.post('/', authenticate, enrollmentController.register);
router.delete('/:id', authenticate, enrollmentController.drop);
router.put('/:id', authenticate, authorize('admin'), enrollmentController.update);
router.post('/:id/switch', authenticate, enrollmentController.swap);

module.exports = router;
