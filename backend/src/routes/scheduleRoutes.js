'use strict';

const express = require('express');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const scheduleController = require('../controllers/scheduleController');

const router = express.Router();

router.get('/', scheduleController.list);
router.get('/section/:crn', scheduleController.byCrn);
router.get('/:id', scheduleController.getById);
router.post('/', authenticate, authorize('admin'), scheduleController.create);
router.put('/:id', authenticate, authorize('admin'), scheduleController.update);
router.delete('/:id', authenticate, authorize('admin'), scheduleController.remove);

module.exports = router;
