'use strict';

const express = require('express');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const departmentController = require('../controllers/departmentController');

const router = express.Router();

router.get('/', departmentController.list);
router.get('/:id/courses', departmentController.courses);
router.get('/:id', departmentController.getById);
router.post('/', authenticate, authorize('admin'), departmentController.create);
router.put('/:id', authenticate, authorize('admin'), departmentController.update);
router.delete('/:id', authenticate, authorize('admin'), departmentController.remove);

module.exports = router;
