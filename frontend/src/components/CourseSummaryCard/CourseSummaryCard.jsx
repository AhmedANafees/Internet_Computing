import { useState, useEffect } from 'react';
import './CourseSummaryCard.css';

export default function CourseSummaryCard({ course, onClose }) {
  const [selectedCrn, setSelectedCrn] = useState(null);

  if (!course) return null;

  const prereqsMet = !course.prerequisites || course.prerequisites.length === 0;

  return (
    <div className="csc-overlay" onClick={onClose}>
      <div className="csc-modal" onClick={e => e.stopPropagation()}>

        <div className="csc-header">
          <div>
            <span className="csc-code">{course.code}</span>
            <span className="csc-meta">{course.level}-level · {course.credits} credit</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="csc-prereq-badge">
              {prereqsMet ? '✓ Prereqs met' : '⚠ Prereqs not met'}
            </span>
            <button className="csc-close" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="csc-body">
          <h2 className="csc-title">{course.title}</h2>
          <p className="csc-description">{course.description || 'No description available.'}</p>

          <div className="csc-row">
            <div>
              <p className="csc-label">Prerequisites</p>
              <div className="csc-pills">
                {!course.prerequisites || course.prerequisites.length === 0
                  ? <span className="csc-none">None</span>
                  : course.prerequisites.map((p, i) => (
                      <span key={i} className="csc-pill neutral">{p.course_code || p}</span>
                    ))
                }
              </div>
            </div>
          </div>

          <p className="csc-label" style={{ marginTop: 16 }}>Sections</p>
          <table className="csc-table">
            <thead>
              <tr>
                <th>Section</th>
                <th>Instructor</th>
                <th>Meeting Times</th>
                <th>Mode</th>
                <th>Seats</th>
              </tr>
            </thead>
            <tbody>
              {(course.sections || []).map(sec => {
                const remaining = sec.seatsRemaining ?? 0;
                const full = remaining <= 0;
                const isSelected = selectedCrn === sec.id;
                return (
                  <tr
                    key={sec.id}
                    className={`csc-row-sec ${isSelected ? 'selected' : ''} ${full ? 'full' : ''}`}
                    onClick={() => !full && setSelectedCrn(isSelected ? null : sec.id)}
                  >
                    <td>{sec.sectionNumber}</td>
                    <td>{sec.instructor}</td>
                    <td>{sec.meetingTimes || '-'}</td>
                    <td>{sec.deliveryMode || '-'}</td>
                    <td className={`csc-seats ${full ? 'full' : remaining <= 10 ? 'low' : 'ok'}`}>
                      {full ? 'Full' : `${remaining} / ${sec.seatsTotal}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="csc-footer">
          <span className="csc-hint">
            {selectedCrn ? `Section selected` : 'Select a section'}
          </span>
          <button
            className="csc-add-btn"
            disabled={!selectedCrn}
            onClick={onClose}
          >
            Add to plan
          </button>
        </div>

      </div>
    </div>
  );
}