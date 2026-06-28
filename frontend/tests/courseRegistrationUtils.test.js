import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRows, formatSchedule } from '../src/pages/CourseRegistrationPage/courseRegistrationUtils.js';

test('buildRows creates one row per section', () => {
  const courses = [
    {
      id: 'course-1',
      sections: [{ id: 'section-1' }, { id: 'section-2' }],
    },
  ];

  assert.deepEqual(buildRows(courses), [
    { course: courses[0], section: courses[0].sections[0] },
    { course: courses[0], section: courses[0].sections[1] },
  ]);
});

test('formatSchedule joins meeting blocks into a readable string', () => {
  const schedule = [
    { day: 'Mon', startTime: '09:00', endTime: '10:00' },
    { day: 'Wed', startTime: '09:00', endTime: '10:00' },
  ];

  assert.equal(formatSchedule(schedule), 'Mon 09:00–10:00, Wed 09:00–10:00');
});
