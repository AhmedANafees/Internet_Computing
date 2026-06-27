'use strict';

const crudController = require('./crudController');
const service = require('../services/roomService');

module.exports = crudController(service, 'Room');
