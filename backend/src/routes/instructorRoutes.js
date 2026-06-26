'use strict';

const express = require('express');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const instructorController = require('../controllers/instructorController');

const router = express.Router();

router.get('/', instructorController.list);
router.get('/:id/sections', instructorController.sections);
router.get('/:id', instructorController.getById);
router.post('/', authenticate, authorize('admin'), instructorController.create);
router.put('/:id', authenticate, authorize('admin'), instructorController.update);
router.delete('/:id', authenticate, authorize('admin'), instructorController.remove);

module.exports = router;
