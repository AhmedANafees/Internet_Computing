import { Link } from 'react-router-dom';
import Sidebar from '../../components/Sidebar/Sidebar';
import './DashboardPage.css';

function getStoredUser() {
  try {
    const raw = localStorage.getItem('currentUser');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

const WEEK_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const WEEKLY_CLASSES = [
  { title: 'Programming I', day: 'Monday', time: '09:00', location: 'Room 104', type: 'Live' },
  { title: 'Calculus', day: 'Monday', time: '10:00', location: 'Room 210', type: 'Online' },
  { title: 'Web Design', day: 'Tuesday', time: '11:00', location: 'Room 302', type: 'Lab' },
  { title: 'Database Systems', day: 'Tuesday', time: '13:00', location: 'Room 115', type: 'Lecture' },
  { title: 'Physics', day: 'Wednesday', time: '09:30', location: 'Room 401', type: 'Live' },
  { title: 'Discrete Math', day: 'Wednesday', time: '12:00', location: 'Room 208', type: 'Lecture' },
  { title: 'Academic Writing', day: 'Thursday', time: '10:30', location: 'Room 220', type: 'Seminar' },
  { title: 'Networking Basics', day: 'Friday', time: '14:00', location: 'Room 118', type: 'Lab' },
];

function getNextThreeDaysClasses(classes) {
  const todayIndex = new Date().getDay();
  const rows = [];

  for (let offset = 0; offset < 3; offset += 1) {
    const dayIndex = (todayIndex + offset) % 7;
    const dayName = WEEK_DAYS[dayIndex];
    const dayLabel = offset === 0 ? 'Today' : offset === 1 ? 'Tomorrow' : dayName;

    const dayClasses = classes
      .filter((item) => item.day === dayName)
      .map((item) => ({ ...item, dayLabel }));

    rows.push(...dayClasses);
  }

  return rows;
}

export default function DashboardPage() {
  const user = getStoredUser();
  const firstName = user?.firstName || user?.first_name || 'Student';
  const lastName = user?.lastName || user?.last_name || '';
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim() || firstName;
  const initials = [firstName?.[0], lastName?.[0]].filter(Boolean).join('').toUpperCase() || 'ST';
  const upcomingClasses = getNextThreeDaysClasses(WEEKLY_CLASSES);

  return (
    <div className="dashboard-shell">
      <Sidebar userName={fullName} />
      <main className="main-content">
        <header className="topbar">
          <div className="topbar-title">
            <p className="eyebrow">Student Dashboard</p>
            <h1>Good morning, {firstName}</h1>
          </div>
          <div className="topbar-actions">
            <div className="profile-pill">
              <span>{initials}</span>
              <strong>{firstName}</strong>
            </div>
          </div>
        </header>

        <section className="hero-card">
          <div className="hero-copy">
            <p className="eyebrow">Weekly progress</p>
            <h2>You're ahead of schedule</h2>
            <p>Three assignments completed this week and two more due tomorrow.</p>
            <div className="hero-actions">
              <Link className="primary-btn" to="/timetable">
                Open timetable
              </Link>
              <Link className="text-link" to="/courses">
                Search courses
              </Link>
            </div>
            <div className="progress-row">
              <div className="progress-track"><span /></div>
              <small>82% of your weekly goal</small>
            </div>
          </div>
          <div className="hero-metric">
            <div className="ring">
              <span>82%</span>
              <small>completed</small>
            </div>
          </div>
        </section>

        <section className="stats-grid">
          <article className="stat-card accent-blue">
            <div className="stat-icon">✦</div>
            <p className="stat-label">Attendance</p>
            <h3>94%</h3>
            <span>+2% this month</span>
          </article>
          <article className="stat-card accent-green">
            <div className="stat-icon">✓</div>
            <p className="stat-label">Assignments</p>
            <h3>7 due</h3>
            <span>2 urgent today</span>
          </article>
          <article className="stat-card accent-purple">
            <div className="stat-icon">◆</div>
            <p className="stat-label">GPA</p>
            <h3>3.8</h3>
            <span>steady progress</span>
          </article>
        </section>

        <section className="content-grid">
          <article className="panel">
            <div className="panel-header">
              <h3>Classes in next 3 days</h3>
              <Link to="/timetable">See all</Link>
            </div>
            <ul className="class-list">
              {upcomingClasses.length === 0 ? (
                <li>
                  <div>
                    <strong>No classes scheduled</strong>
                    <span>You have no classes in the next three days.</span>
                  </div>
                </li>
              ) : (
                upcomingClasses.map((item) => (
                  <li key={`${item.day}-${item.title}-${item.time}`}>
                    <div>
                      <strong>{item.title}</strong>
                      <span>{item.dayLabel} • {item.time} • {item.location}</span>
                    </div>
                    <span className={`pill${item.type === 'Online' ? ' pill-soft' : ''}`}>{item.type}</span>
                  </li>
                ))
              )}
            </ul>
          </article>

          <article className="panel">
            <div className="panel-header">
              <h3>Focus tasks</h3>
              <Link to="/courses">Add</Link>
            </div>
            <ul className="task-list">
              <li>
                <label>
                  <input type="checkbox" defaultChecked />
                  <span>Submit UI mockups</span>
                </label>
                <small>11:30</small>
              </li>
              <li>
                <label>
                  <input type="checkbox" />
                  <span>Review database notes</span>
                </label>
                <small>13:00</small>
              </li>
              <li>
                <label>
                  <input type="checkbox" />
                  <span>Prepare for physics quiz</span>
                </label>
                <small>16:00</small>
              </li>
            </ul>
          </article>
        </section>
      </main>
    </div>
  );
}
