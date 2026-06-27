'use strict';

const db = require('../db');

// builds standard data access for a table. table, idColumn, and columns come
// from code (never user input), so they are safe to interpolate. all values are
// parameterized.
function baseRepository(table, idColumn, columns) {
  const pick = (data) => columns.filter((c) => data[c] !== undefined);

  const repo = {
    async findAll({ limit = 100, offset = 0 } = {}) {
      const lim = Number.parseInt(limit, 10) || 100;
      const off = Number.parseInt(offset, 10) || 0;
      return db.query(`SELECT * FROM ${table} ORDER BY ${idColumn} LIMIT ${lim} OFFSET ${off}`);
    },

    async findById(id) {
      return db.queryOne(`SELECT * FROM ${table} WHERE ${idColumn} = ?`, [id]);
    },

    async create(data) {
      const cols = pick(data);
      const placeholders = cols.map(() => '?').join(', ');
      const values = cols.map((c) => data[c]);
      const result = await db.query(
        `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders})`,
        values
      );
      return repo.findById(result.insertId);
    },

    async update(id, data) {
      const cols = pick(data);
      if (cols.length > 0) {
        const setClause = cols.map((c) => `${c} = ?`).join(', ');
        const values = [...cols.map((c) => data[c]), id];
        await db.query(`UPDATE ${table} SET ${setClause} WHERE ${idColumn} = ?`, values);
      }
      return repo.findById(id);
    },

    async remove(id) {
      const result = await db.query(`DELETE FROM ${table} WHERE ${idColumn} = ?`, [id]);
      return result.affectedRows > 0;
    },
  };

  return repo;
}

module.exports = baseRepository;
