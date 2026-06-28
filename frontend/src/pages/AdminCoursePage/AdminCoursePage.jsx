import { useState } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import './AdminCoursePage.css';

const initialCourses = [
  {
    id: 1,
    title: 'Internet Computing',
    subject: 'Computer Science',
    courseNumber: '476',
    section: 'B',
    credits: '0.5',
    instructor: 'Raed Karim',
    meetingTime: 'TODO',
    campus: 'Waterloo',
    seats: '3 / 120 Available',
  },
  {
    id: 2,
    title: 'Internet Computing',
    subject: 'Computer Science',
    courseNumber: '476',
    section: 'B',
    credits: '0.5',
    instructor: 'Raed Karim',
    meetingTime: 'TODO',
    campus: 'Waterloo',
    seats: '3 / 120 Available',
  },
];

export default function AdminCoursePage() {
  const [courses, setCourses] = useState(initialCourses);
  const [showModal, setShowModal] = useState(false);
  const [newCourse, setNewCourse] = useState({
    courseCode: '',
    courseWeight: '',
    startTime: '',
    endTime: '',
    prerequisites: '',
    corequisites: '',
    seatCapacity: '',
    professorFirstName: '',
    professorLastName: '',
    department: 'Computer Science/Physics',
    campus: 'Waterloo',
    deliveryMode: 'Online',
    lab: '',
  });

  function handleChange(event) {
    const { name, value } = event.target;
    setNewCourse((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    const courseNumber = newCourse.courseCode.replace(/\D/g, '') || '000';

    const addedCourse = {
      id: Date.now(),
      title: newCourse.courseCode || 'New Course',
      subject: newCourse.department,
      courseNumber,
      section: 'A',
      credits: newCourse.courseWeight || '0.5',
      instructor: `${newCourse.professorFirstName} ${newCourse.professorLastName}`.trim() || 'TBD',
      meetingTime: `${newCourse.startTime || 'TBD'} - ${newCourse.endTime || 'TBD'}`,
      campus: newCourse.campus,
      seats: `0 / ${newCourse.seatCapacity || 0} Available`,
    };

    setCourses((prev) => [...prev, addedCourse]);
    setShowModal(false);

    setNewCourse({
      courseCode: '',
      courseWeight: '',
      startTime: '',
      endTime: '',
      prerequisites: '',
      corequisites: '',
      seatCapacity: '',
      professorFirstName: '',
      professorLastName: '',
      department: 'Computer Science/Physics',
      campus: 'Waterloo',
      deliveryMode: 'Online',
      lab: '',
    });
  }

  return (
    <div className="admin-layout">
      <Sidebar
        userName="Administrator"
        navItems={[{ label: 'Course List', path: '/admin/courses' }]}
        />

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
                {courses.map((course) => (
                  <tr key={course.id}>
                    <td>{course.title}</td>
                    <td>{course.subject}</td>
                    <td>{course.courseNumber}</td>
                    <td>{course.section}</td>
                    <td>{course.credits}</td>
                    <td>{course.instructor}</td>
                    <td>{course.meetingTime}</td>
                    <td>{course.campus}</td>
                    <td>{course.seats}</td>
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
            <button type="button" className="admin-modal-close" onClick={() => setShowModal(false)}>
              ×
            </button>

            <h2>Add New Course</h2>

            <div className="admin-form-grid">
              <div className="admin-form-column">
                <label>
                  Course Code
                  <input name="courseCode" value={newCourse.courseCode} onChange={handleChange} />
                </label>

                <label>
                  Course Weight
                  <input name="courseWeight" value={newCourse.courseWeight} onChange={handleChange} />
                </label>

                <div>
                  <p className="admin-field-title">Lecture Time</p>
                  <div className="admin-days">
                    <button type="button">S</button>
                    <button type="button">M</button>
                    <button type="button">T</button>
                    <button type="button">W</button>
                    <button type="button">T</button>
                    <button type="button">F</button>
                    <button type="button">S</button>
                  </div>
                </div>

                <label>
                  Starting Time
                  <input name="startTime" value={newCourse.startTime} onChange={handleChange} />
                </label>

                <label>
                  Ending Time
                  <input name="endTime" value={newCourse.endTime} onChange={handleChange} />
                </label>

                <p className="admin-section-title">Restrictions</p>

                <label>
                  Prerequisites
                  <input name="prerequisites" value={newCourse.prerequisites} onChange={handleChange} />
                </label>

                <label>
                  Co-requisites
                  <input name="corequisites" value={newCourse.corequisites} onChange={handleChange} />
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
                  <select name="department" value={newCourse.department} onChange={handleChange}>
                    <option>Computer Science/Physics</option>
                    <option>Mathematics</option>
                    <option>Business</option>
                    <option>Psychology</option>
                  </select>
                </label>

                <label>
                  Campus
                  <select name="campus" value={newCourse.campus} onChange={handleChange}>
                    <option>Waterloo</option>
                    <option>Brantford</option>
                    <option>Milton</option>
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
                  Link a Lab
                  <div className="admin-lab-row">
                    <button type="button">+</button>
                    <input name="lab" value={newCourse.lab} onChange={handleChange} />
                  </div>
                </label>
              </div>
            </div>

            <button className="admin-submit-btn" type="submit">
              Submit
            </button>
          </form>
        </div>
      )}
    </div>
  );
}