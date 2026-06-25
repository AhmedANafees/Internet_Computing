'use strict';

const crudService = require('./crudService');
const repo = require('../repositories/scheduleRepository');

const service = crudService(repo, 'Schedule entry');

service.byCrn = (crn) => repo.findByCrn(crn);

module.exports = service;
