'use strict';

const express = require('express');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const facultyController = require('../controllers/facultyController');

const router = express.Router();

router.get('/', facultyController.list);
router.get('/:id/departments', facultyController.departments);
router.get('/:id', facultyController.getById);
router.post('/', authenticate, authorize('admin'), facultyController.create);
router.put('/:id', authenticate, authorize('admin'), facultyController.update);
router.delete('/:id', authenticate, authorize('admin'), facultyController.remove);

module.exports = router;
