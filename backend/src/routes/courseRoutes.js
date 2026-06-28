'use strict';

const express = require('express');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const courseController = require('../controllers/courseController');
const requisites = require('../controllers/requisiteController');

const router = express.Router();

const admin = [authenticate, authorize('admin')];

router.get('/', courseController.list);
router.get('/:id', courseController.getById);
router.post('/', ...admin, courseController.create);
router.put('/:id', ...admin, courseController.update);
router.delete('/:id', ...admin, courseController.remove);

// course relationships (admin manages; reads are public)
router.get('/:id/prerequisites', requisites.prerequisite.list);
router.post('/:id/prerequisites', ...admin, requisites.prerequisite.add);
router.delete('/:id/prerequisites/:targetId', ...admin, requisites.prerequisite.remove);

router.get('/:id/corequisites', requisites.corequisite.list);
router.post('/:id/corequisites', ...admin, requisites.corequisite.add);
router.delete('/:id/corequisites/:targetId', ...admin, requisites.corequisite.remove);

router.get('/:id/antirequisites', requisites.antirequisite.list);
router.post('/:id/antirequisites', ...admin, requisites.antirequisite.add);
router.delete('/:id/antirequisites/:targetId', ...admin, requisites.antirequisite.remove);

module.exports = router;
