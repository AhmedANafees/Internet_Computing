'use strict';

const express = require('express');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const sectionController = require('../controllers/sectionController');

const router = express.Router();

router.get('/', sectionController.list);
router.get('/:id/seats', sectionController.seats);
router.get('/:id/students', authenticate, authorize('admin'), sectionController.enrolledStudents);
router.get('/:id', sectionController.getById);
router.post('/', authenticate, authorize('admin'), sectionController.create);
router.put('/:id', authenticate, authorize('admin'), sectionController.update);
router.delete('/:id', authenticate, authorize('admin'), sectionController.remove);

module.exports = router;
