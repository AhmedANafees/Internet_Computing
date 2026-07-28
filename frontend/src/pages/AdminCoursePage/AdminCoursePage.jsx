import { useCallback, useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import {
  addCorequisite,
  addPrerequisite,
  createCourse,
  createInstructor,
  createScheduleEntry,
  createSection,
  fetchCourseCatalog,
  fetchCourseRecords,
  fetchDepartments,
  fetchInstructors,
  fetchRooms,
  fetchTerms,
} from '../../services/courseService';
import './AdminCoursePage.css';
import { ADMIN_NAV_ITEMS } from '../../components/Sidebar/navigation';

const DAYS = [
  { short: 'S', name: 'Sunday' },
  { short: 'M', name: 'Monday' },
  { short: 'T', name: 'Tuesday' },
  { short: 'W', name: 'Wednesday' },
  { short: 'Th', name: 'Thursday' },
  { short: 'F', name: 'Friday' },
  { short: 'Sa', name: 'Saturday' },
];

const EMPTY_FORM = {
  courseCode: '',
  courseName: '',
  courseWeight: '',
  termId: '',
  startTime: '',
  endTime: '',
  prerequisites: '',
  corequisites: '',
  seatCapacity: '',
  professorFirstName: '',
  professorLastName: '',
  departmentId: '',
  campus: '',
  deliveryMode: 'Online',
  sectionNumber: 'A',
};

function getStoredRole() {
  try {
    const raw = localStorage.getItem('currentUser');
    if (!raw) return '';
    return JSON.parse(raw)?.role ?? '';
  } catch {
    return '';
  }
}

// The catalog is grouped by course; the admin table lists one row per section.
function flattenToRows(courses) {
  return courses.flatMap((course) =>
    course.sections.map((section) => ({
      key: `${course.id}-${section.id}`,
      title: course.title,
      subject: course.subject,
      courseNumber: String(course.code ?? '').replace(/\D/g, '') || String(course.code ?? ''),
      section: section.sectionNumber,
      credits: course.credits,
      instructor: section.instructor || 'TBD',
      meetingTime: section.meetingTimes || 'TBD',
      campus: section.campus,
      seats: `${section.seatsRemaining} / ${section.seatsTotal} Available`,
    }))
  );
}

function splitCodes(value) {
  return String(value || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function findCourseIdByCode(records, code) {
  const wanted = code.replace(/\s+/g, '').toUpperCase();
  const match = records.find(
    (record) => String(record.course_code ?? '').replace(/\s+/g, '').toUpperCase() === wanted
  );
  return match ? match.course_id : null;
}

export default function AdminCoursePage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [departments, setDepartments] = useState([]);
  const [terms, setTerms] = useState([]);
  const [rooms, setRooms] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [newCourse, setNewCourse] = useState(EMPTY_FORM);
  const [selectedDays, setSelectedDays] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const isAdmin = getStoredRole() === 'admin';

  const loadCourses = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const { courses } = await fetchCourseCatalog();
      setRows(flattenToRows(courses));
    } catch (error) {
      setLoadError(error.message || 'Failed to load courses.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  useEffect(() => {
    // Lookups populate the form's dropdowns. A failure here should not block the
    // course list, so each one falls back to an empty set.
    Promise.allSettled([fetchDepartments(), fetchTerms(), fetchRooms()]).then(
      ([departmentResult, termResult, roomResult]) => {
        if (departmentResult.status === 'fulfilled') setDepartments(departmentResult.value);
        if (termResult.status === 'fulfilled') setTerms(termResult.value);
        if (roomResult.status === 'fulfilled') setRooms(roomResult.value);
      }
    );
  }, []);

  const campuses = [...new Set(rooms.map((room) => room.campus).filter(Boolean))];

  function handleChange(event) {
    const { name, value } = event.target;
    setNewCourse((prev) => ({ ...prev, [name]: value }));
  }

  function toggleDay(dayName) {
    setSelectedDays((prev) =>
      prev.includes(dayName) ? prev.filter((day) => day !== dayName) : [...prev, dayName]
    );
  }

  function closeModal() {
    setShowModal(false);
    setSubmitError('');
  }

  async function resolveInstructorId() {
    const firstName = newCourse.professorFirstName.trim();
    const lastName = newCourse.professorLastName.trim();
    if (!firstName && !lastName) return null;

    const existing = (await fetchInstructors()).find(
      (instructor) =>
        String(instructor.first_name ?? '').toLowerCase() === firstName.toLowerCase() &&
        String(instructor.last_name ?? '').toLowerCase() === lastName.toLowerCase()
    );
    if (existing) return existing.instructor_id;

    const created = await createInstructor({
      first_name: firstName,
      last_name: lastName,
      department_id: newCourse.departmentId ? Number(newCourse.departmentId) : null,
    });
    return created?.instructor_id ?? null;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitError('');

    if (!newCourse.courseCode.trim() || !newCourse.courseName.trim()) {
      setSubmitError('Course code and course name are both required.');
      return;
    }
    if (!newCourse.termId) {
      setSubmitError('Select a term so the section can be scheduled.');
      return;
    }

    setSubmitting(true);
    try {
      const course = await createCourse({
        course_code: newCourse.courseCode.trim(),
        course_name: newCourse.courseName.trim(),
        course_level: Number(newCourse.courseCode.replace(/\D/g, '').slice(0, 3)) || null,
        credits: newCourse.courseWeight ? Number(newCourse.courseWeight) : null,
        department_id: newCourse.departmentId ? Number(newCourse.departmentId) : null,
      });

      const courseId = course?.course_id;
      if (!courseId) {
        throw new Error('The course was created but no identifier was returned.');
      }

      const instructorId = await resolveInstructorId();
      const room = rooms.find((candidate) => candidate.campus === newCourse.campus);

      const section = await createSection({
        course_id: courseId,
        term_id: Number(newCourse.termId),
        section_number: newCourse.sectionNumber.trim() || 'A',
        capacity: Number(newCourse.seatCapacity) || 0,
        instructor_id: instructorId,
        room_id: room?.room_id ?? null,
        delivery_mode: newCourse.deliveryMode,
        status: 'Open',
      });

      const crn = section?.crn;
      if (crn && newCourse.startTime && newCourse.endTime) {
        for (const day of selectedDays) {
          await createScheduleEntry({
            crn,
            day_of_week: day,
            start_time: newCourse.startTime,
            end_time: newCourse.endTime,
          });
        }
      }

      const requisiteCodes = [
        ...splitCodes(newCourse.prerequisites).map((code) => ({ code, kind: 'pre' })),
        ...splitCodes(newCourse.corequisites).map((code) => ({ code, kind: 'co' })),
      ];
      if (requisiteCodes.length > 0) {
        const records = await fetchCourseRecords();
        for (const { code, kind } of requisiteCodes) {
          const targetId = findCourseIdByCode(records, code);
          if (!targetId) continue;
          if (kind === 'pre') {
            await addPrerequisite(courseId, targetId);
          } else {
            await addCorequisite(courseId, targetId);
          }
        }
      }

      setNewCourse(EMPTY_FORM);
      setSelectedDays([]);
      setShowModal(false);
      await loadCourses();
    } catch (error) {
      setSubmitError(error.message || 'Failed to add the course.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!isAdmin) {
    return (
      <div className="admin-layout">
        <Sidebar navItems={ADMIN_NAV_ITEMS} />
        <main className="admin-main">
          <section className="admin-course-card">
            <h2>Administrator access required</h2>
            <p>Sign in with an administrator account to manage courses.</p>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <Sidebar navItems={ADMIN_NAV_ITEMS} />

      <main className="admin-main">
        <section className="admin-course-card">
          <div className="admin-course-toolbar">
            <h2>Course List</h2>

            <select className="admin-filter">
              <option>Filters</option>
              <option>Subject</option>
              <option>Campus</option>
              <option>Credits</option>
            </select>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Subject</th>
                  <th>Course No.</th>
                  <th>Section</th>
                  <th>Credits</th>
                  <th>Instructor</th>
                  <th>Meeting Time</th>
                  <th>Campus</th>
                  <th>Class Seats</th>
                  <th>
                    <button className="admin-add-btn" onClick={() => setShowModal(true)}>
                      +
                    </button>
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={10}>Loading courses...</td>
                  </tr>
                )}

                {!loading && loadError && (
                  <tr>
                    <td colSpan={10}>{loadError}</td>
                  </tr>
                )}

                {!loading && !loadError && rows.length === 0 && (
                  <tr>
                    <td colSpan={10}>No courses found.</td>
                  </tr>
                )}

                {!loading &&
                  !loadError &&
                  rows.map((row) => (
                    <tr key={row.key}>
                      <td>{row.title}</td>
                      <td>{row.subject}</td>
                      <td>{row.courseNumber}</td>
                      <td>{row.section}</td>
                      <td>{row.credits}</td>
                      <td>{row.instructor}</td>
                      <td>{row.meetingTime}</td>
                      <td>{row.campus}</td>
                      <td>{row.seats}</td>
                      <td></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {showModal && (
        <div className="admin-modal-overlay">
          <form className="admin-modal" onSubmit={handleSubmit}>
            <button type="button" className="admin-modal-close" onClick={closeModal}>
              ×
            </button>

            <h2>Add New Course</h2>

            {submitError && <p className="admin-form-error">{submitError}</p>}

            <div className="admin-form-grid">
              <div className="admin-form-column">
                <label>
                  Course Code
                  <input name="courseCode" value={newCourse.courseCode} onChange={handleChange} />
                </label>

                <label>
                  Course Name
                  <input name="courseName" value={newCourse.courseName} onChange={handleChange} />
                </label>

                <label>
                  Course Weight
                  <input name="courseWeight" value={newCourse.courseWeight} onChange={handleChange} />
                </label>

                <label>
                  Term
                  <select name="termId" value={newCourse.termId} onChange={handleChange}>
                    <option value="">Select a term</option>
                    {terms.map((term) => (
                      <option key={term.term_id} value={term.term_id}>
                        {term.term_name}
                      </option>
                    ))}
                  </select>
                </label>

                <div>
                  <p className="admin-field-title">Lecture Time</p>
                  <div className="admin-days">
                    {DAYS.map((day) => (
                      <button
                        key={day.name}
                        type="button"
                        className={selectedDays.includes(day.name) ? 'is-selected' : ''}
                        onClick={() => toggleDay(day.name)}
                      >
                        {day.short}
                      </button>
                    ))}
                  </div>
                </div>

                <label>
                  Starting Time
                  <input
                    type="time"
                    name="startTime"
                    value={newCourse.startTime}
                    onChange={handleChange}
                  />
                </label>

                <label>
                  Ending Time
                  <input
                    type="time"
                    name="endTime"
                    value={newCourse.endTime}
                    onChange={handleChange}
                  />
                </label>

                <p className="admin-section-title">Restrictions</p>

                <label>
                  Prerequisites
                  <input
                    name="prerequisites"
                    value={newCourse.prerequisites}
                    onChange={handleChange}
                    placeholder="Course codes, comma separated"
                  />
                </label>

                <label>
                  Co-requisites
                  <input
                    name="corequisites"
                    value={newCourse.corequisites}
                    onChange={handleChange}
                    placeholder="Course codes, comma separated"
                  />
                </label>

                <label>
                  Seat Capacity
                  <input name="seatCapacity" value={newCourse.seatCapacity} onChange={handleChange} />
                </label>
              </div>

              <div className="admin-form-column">
                <p className="admin-section-title">Professor Name</p>

                <div className="admin-name-row">
                  <label>
                    First Name
                    <input
                      name="professorFirstName"
                      value={newCourse.professorFirstName}
                      onChange={handleChange}
                    />
                  </label>

                  <label>
                    Last Name
                    <input
                      name="professorLastName"
                      value={newCourse.professorLastName}
                      onChange={handleChange}
                    />
                  </label>
                </div>

                <label>
                  Department
                  <select name="departmentId" value={newCourse.departmentId} onChange={handleChange}>
                    <option value="">Select a department</option>
                    {departments.map((department) => (
                      <option key={department.department_id} value={department.department_id}>
                        {department.department_name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Campus
                  <select name="campus" value={newCourse.campus} onChange={handleChange}>
                    <option value="">Select a campus</option>
                    {campuses.map((campus) => (
                      <option key={campus} value={campus}>
                        {campus}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Mode of Delivery
                  <select name="deliveryMode" value={newCourse.deliveryMode} onChange={handleChange}>
                    <option>Online</option>
                    <option>In Person</option>
                    <option>Hybrid</option>
                  </select>
                </label>

                <label>
                  Section Number
                  <input
                    name="sectionNumber"
                    value={newCourse.sectionNumber}
                    onChange={handleChange}
                  />
                </label>
              </div>
            </div>

            <button className="admin-submit-btn" type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : 'Submit'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
