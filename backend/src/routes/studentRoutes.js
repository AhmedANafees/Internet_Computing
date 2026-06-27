'use strict';

const express = require('express');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const studentController = require('../controllers/studentController');

const router = express.Router();

router.get('/', authenticate, authorize('admin'), studentController.list);
router.get('/:id/schedule', authenticate, studentController.schedule);
router.get('/:id/enrollments', authenticate, studentController.enrollments);
router.get('/:id/waitlist', authenticate, studentController.waitlist);
router.get('/:id/degree-progress', authenticate, studentController.degreeProgress);
router.get('/:id/conflicts', authenticate, studentController.conflicts);
router.get('/:id', authenticate, studentController.getById);
router.post('/', authenticate, authorize('admin'), studentController.create);
router.put('/:id', authenticate, authorize('admin'), studentController.update);
router.delete('/:id', authenticate, authorize('admin'), studentController.remove);

module.exports = router;
