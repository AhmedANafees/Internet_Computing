'use strict';

const crudService = require('./crudService');
const repo = require('../repositories/termRepository');

module.exports = crudService(repo, 'Term');
