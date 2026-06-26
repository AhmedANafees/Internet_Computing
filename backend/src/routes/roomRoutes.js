'use strict';

const express = require('express');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const roomController = require('../controllers/roomController');

const router = express.Router();

router.get('/', roomController.list);
router.get('/:id', roomController.getById);
router.post('/', authenticate, authorize('admin'), roomController.create);
router.put('/:id', authenticate, authorize('admin'), roomController.update);
router.delete('/:id', authenticate, authorize('admin'), roomController.remove);

module.exports = router;
