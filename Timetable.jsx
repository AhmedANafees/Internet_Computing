import React from 'react';
import styles from './timetable.module.css';

export default function Timetable() {
  return (
    <div className={styles.page}>
      <div className={styles['schedule-card']}>
        <div className={styles['schedule-header']}>
          <div>
            <p className={styles.eyebrow}>Weekly timetable</p>
            <h1>Timetable</h1>
          </div>
          <div className={styles['schedule-meta']}>
            <div className={styles.chip}>This week</div>
            <div className={`${styles.chip} ${styles['chip-success']}`}>Updated</div>
          </div>
        </div>

        <div className={styles['table-wrap']}>
          <table className={styles.timetable}>
            <thead>
              <tr>
                <th>Time</th>
                <th>Mon</th>
                <th>Tue</th>
                <th>Wed</th>
                <th>Thu</th>
                <th>Fri</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th>09:00</th>
                <td><div className={`${styles.slot} ${styles.blue}`}><strong>Programming I</strong><small>Room 104</small></div></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
