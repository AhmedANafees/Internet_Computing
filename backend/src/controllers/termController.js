'use strict';

const crudController = require('./crudController');
const service = require('../services/termService');

module.exports = crudController(service, 'Term');
