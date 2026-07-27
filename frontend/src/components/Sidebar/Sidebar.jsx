import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import './Sidebar.css';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Course Registration', path: '/courses' },
  { label: 'Timetable', path: '/timetable' },
];

function getStoredUserName() {
  try {
    const raw = localStorage.getItem('currentUser');
    if (!raw) return null;
    const user = JSON.parse(raw);
    const firstName = user.firstName ?? user.first_name;
    const lastName = user.lastName ?? user.last_name;
    const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
    return fullName || user.email || null;
  } catch {
    return null;
  }
}

export default function Sidebar({ userName, navItems }) {
  const navigate = useNavigate();
  const resolvedUserName = userName || getStoredUserName() || 'Student';
  const resolvedNavItems = Array.isArray(navItems) && navItems.length > 0 ? navItems : NAV_ITEMS;
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('sidebarCollapsed', String(next));
      return next;
    });
  }

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    navigate('/');
  }

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
      <div className="sidebar__top">
        <div className="sidebar__user">
          <svg className="sidebar__avatar" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
          </svg>
          {!collapsed ? <span className="sidebar__username">{resolvedUserName}</span> : null}
        </div>

        <nav className="sidebar__nav">
          {resolvedNavItems.map(({ label, path }) => (
            <NavLink
              key={path}
              to={path}
              title={label}
              className={({ isActive }) =>
                isActive ? 'sidebar__link sidebar__link--active' : 'sidebar__link'
              }
            >
              {collapsed ? label.slice(0, 1) : label}
            </NavLink>
          ))}
        </nav>
      </div>

      <button className="sidebar__edge-toggle" onClick={toggleCollapsed} aria-label="Toggle sidebar">
        {collapsed ? '>' : '<'}
      </button>

      <button className="sidebar__logout" onClick={handleLogout}>{collapsed ? 'Out' : 'Logout'}</button>
    </aside>
  );
}
