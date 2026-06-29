import { NavLink, useNavigate } from 'react-router-dom';
import './Sidebar.css';

const NAV_ITEMS = [
  { label: 'Course Registration', path: '/courses' },
];

export default function Sidebar({ userName = 'Steve Smith' }) {
  const navigate = useNavigate();

  return (
    <aside className="sidebar">
      <div className="sidebar__top">
        <div className="sidebar__user">
          <svg className="sidebar__avatar" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
          </svg>
          <span className="sidebar__username">{userName}</span>
        </div>

        <nav className="sidebar__nav">
          {NAV_ITEMS.map(({ label, path }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                isActive ? 'sidebar__link sidebar__link--active' : 'sidebar__link'
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </div>

      <button className="sidebar__logout" onClick={() => navigate('/')}>
        Logout
      </button>
    </aside>
  );
}
