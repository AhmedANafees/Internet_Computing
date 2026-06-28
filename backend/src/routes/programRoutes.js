'use strict';

const express = require('express');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const programController = require('../controllers/programController');

const router = express.Router();

router.get('/', programController.list);
router.get('/:id/courses', programController.requiredCourses);
router.get('/:id', programController.getById);
router.post('/', authenticate, authorize('admin'), programController.create);
router.put('/:id', authenticate, authorize('admin'), programController.update);
router.delete('/:id', authenticate, authorize('admin'), programController.remove);

module.exports = router;
