'use strict';

const db = require('../db');

// data access for the three course relationship tables. table and column names
// come from the config below (never user input), so they are safe to inline.
function requisiteRepository(table, targetColumn) {
  return {
    list: (courseId) =>
      db.query(
        `SELECT c.course_id, c.course_code, c.course_name
           FROM ${table} r
           JOIN Courses c ON c.course_id = r.${targetColumn}
          WHERE r.course_id = ?
          ORDER BY c.course_code`,
        [courseId]
      ),

    add: async (courseId, targetId) => {
      const result = await db.query(
        `INSERT INTO ${table} (course_id, ${targetColumn}) VALUES (?, ?)`,
        [courseId, targetId]
      );
      return result.insertId;
    },

    remove: async (courseId, targetId) => {
      const result = await db.query(
        `DELETE FROM ${table} WHERE course_id = ? AND ${targetColumn} = ?`,
        [courseId, targetId]
      );
      return result.affectedRows > 0;
    },
  };
}

module.exports = {
  prerequisite: requisiteRepository('Prerequisites', 'required_course_id'),
  corequisite: requisiteRepository('Corequisites', 'corequisite_course_id'),
  antirequisite: requisiteRepository('Antirequisites', 'antirequisite_course_id'),
};
