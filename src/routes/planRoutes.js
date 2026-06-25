'use strict';

const express = require('express');
const authenticate = require('../middleware/authenticate');
const planController = require('../controllers/planController');

const router = express.Router();

router.use(authenticate);

router.get('/', planController.list);
router.get('/:id', planController.getById);
router.post('/', planController.create);
router.post('/:id/items', planController.addItem);
router.delete('/:id/items/:crn', planController.removeItem);
router.post('/:id/submit', planController.submit);

module.exports = router;
