'use strict';

const express = require('express');

const authRoutes = require('./authRoutes');
const courseRoutes = require('./courseRoutes');
const sectionRoutes = require('./sectionRoutes');
const studentRoutes = require('./studentRoutes');
const enrollmentRoutes = require('./enrollmentRoutes');
const planRoutes = require('./planRoutes');
const waitlistRoutes = require('./waitlistRoutes');
const departmentRoutes = require('./departmentRoutes');
const programRoutes = require('./programRoutes');
const instructorRoutes = require('./instructorRoutes');
const scheduleRoutes = require('./scheduleRoutes');
const termRoutes = require('./termRoutes');
const facultyRoutes = require('./facultyRoutes');
const roomRoutes = require('./roomRoutes');

const router = express.Router();

const routes = [
  '/api/auth',
  '/api/courses',
  '/api/sections',
  '/api/students',
  '/api/enrollments',
  '/api/plans',
  '/api/waitlists',
  '/api/departments',
  '/api/programs',
  '/api/instructors',
  '/api/schedules',
  '/api/terms',
  '/api/faculties',
  '/api/rooms',
];

router.get('/', (req, res) => {
  res.json({ message: 'Course Registration API', routes });
});

router.use('/auth', authRoutes);
router.use('/courses', courseRoutes);
router.use('/sections', sectionRoutes);
router.use('/students', studentRoutes);
router.use('/enrollments', enrollmentRoutes);
router.use('/plans', planRoutes);
router.use('/waitlists', waitlistRoutes);
router.use('/departments', departmentRoutes);
router.use('/programs', programRoutes);
router.use('/instructors', instructorRoutes);
router.use('/schedules', scheduleRoutes);
router.use('/terms', termRoutes);
router.use('/faculties', facultyRoutes);
router.use('/rooms', roomRoutes);

module.exports = router;
