'use strict';

const ApiError = require('../utils/ApiError');

function crudService(repository, label) {
  return {
    list(options) {
      return repository.findAll(options);
    },

    async get(id) {
      const row = await repository.findById(id);
      if (!row) {
        throw ApiError.notFound(`${label} not found`);
      }
      return row;
    },

    create(data) {
      return repository.create(data);
    },

    async update(id, data) {
      await this.get(id);
      return repository.update(id, data);
    },

    async remove(id) {
      const removed = await repository.remove(id);
      if (!removed) {
        throw ApiError.notFound(`${label} not found`);
      }
      return { id, deleted: true };
    },
  };
}

module.exports = crudService;
