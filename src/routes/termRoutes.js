'use strict';

const express = require('express');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const termController = require('../controllers/termController');

const router = express.Router();

router.get('/', termController.list);
router.get('/:id', termController.getById);
router.post('/', authenticate, authorize('admin'), termController.create);
router.put('/:id', authenticate, authorize('admin'), termController.update);
router.delete('/:id', authenticate, authorize('admin'), termController.remove);

module.exports = router;
