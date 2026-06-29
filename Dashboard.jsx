import React from 'react';
import styles from './dashboatd.module.css';

export default function Dashboard() {
  return (
    <div className={styles['dashboard-shell']}>
      <aside className={styles.sidebar}>
        <div>
          <div className={styles.brand}>
            <div className={styles['brand-mark']}>CH</div>
            <div>
              <h2>Campus Hub</h2>
              <p>Student portal</p>
            </div>
          </div>

          <nav className={styles['sidebar-nav']}>
            <a className={styles.active} href="#">Overview</a>
            <a href="timetable.html">Timetable</a>
          </nav>
        </div>

        <div className={styles['sidebar-card']}>
          <p className={styles.eyebrow}>Next up</p>
          <h3>Web Design Lab</h3>
          <p>Room 302 • 11:00 AM</p>
        </div>
      </aside>

      <main className={styles['main-content']}>
        <header className={styles.topbar}>
          <div className={styles['topbar-title']}>
            <p className={styles.eyebrow}>Student Dashboard</p>
            <h1>Good morning, Maya</h1>
          </div>
          <div className={styles['topbar-actions']}>
            <div className={styles['search-pill']}>Search classes</div>
            <div className={styles['profile-pill']}>
              <span>MJ</span>
              <strong>Maya</strong>
            </div>
          </div>
        </header>

        <section className={styles['hero-card']}>
          <div className={styles['hero-copy']}>
            <p className={styles.eyebrow}>Weekly progress</p>
            <h2>You’re ahead of schedule</h2>
            <p>Three assignments completed this week and two more due tomorrow.</p>
            <div className={styles['hero-actions']}>
              <a className={styles['primary-btn']} href="timetable.html">Open timetable</a>
              <a className={styles['text-link']} href="#">View planner</a>
            </div>
          </div>
          <div className={styles['hero-metric']}>
            <div className={styles.ring}>
              <span>82%</span>
              <small>completed</small>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
