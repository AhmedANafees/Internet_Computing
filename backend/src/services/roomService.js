'use strict';

const crudService = require('./crudService');
const repo = require('../repositories/roomRepository');

module.exports = crudService(repo, 'Room');
