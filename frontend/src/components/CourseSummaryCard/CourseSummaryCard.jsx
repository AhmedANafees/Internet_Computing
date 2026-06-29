import { useEffect, useMemo, useState } from 'react';
import './CourseSummaryCard.css';

export default function CourseSummaryCard({
  course,
  onClose,
  mode = 'registration',
  initialTerm = '',
  onAddSection,
}) {
  const [selectedCrn, setSelectedCrn] = useState(null);
  const [selectedTerm, setSelectedTerm] = useState(initialTerm);
  const isTimetableMode = mode === 'timetable';
  const normalizedLevel = Number(course?.level);
  const displayLevel = Number.isFinite(normalizedLevel) && normalizedLevel > 0 ? normalizedLevel : 'N/A';
  const normalizedCredits = Number(course?.credits);
  const displayCredits = Number.isFinite(normalizedCredits) && normalizedCredits > 0 ? normalizedCredits : 'N/A';

  if (!course) return null;

  const prereqsMet = !course.prerequisites || course.prerequisites.length === 0;

  const termOptions = useMemo(
    () => [...new Set((course.sections || []).map((section) => section.term).filter(Boolean))],
    [course.sections],
  );

  useEffect(() => {
    if (termOptions.length === 0) {
      setSelectedTerm('');
      return;
    }
    if (initialTerm && termOptions.includes(initialTerm)) {
      setSelectedTerm(initialTerm);
      return;
    }
    setSelectedTerm(termOptions[0]);
  }, [initialTerm, termOptions]);

  const visibleSections = useMemo(() => {
    if (!selectedTerm) return course.sections || [];
    return (course.sections || []).filter((section) => section.term === selectedTerm);
  }, [course.sections, selectedTerm]);

  useEffect(() => {
    if (!selectedCrn) return;
    if (!visibleSections.some((section) => section.id === selectedCrn)) {
      setSelectedCrn(null);
    }
  }, [selectedCrn, visibleSections]);

  const selectedSection = useMemo(
    () => visibleSections.find((section) => section.id === selectedCrn) || null,
    [selectedCrn, visibleSections],
  );

  return (
    <div className="csc-overlay" onClick={onClose}>
      <div className={`csc-modal ${isTimetableMode ? 'csc-modal--timetable' : ''}`} onClick={e => e.stopPropagation()}>

        <div className="csc-header">
          <div>
            <span className="csc-code">{course.code}</span>
            <span className="csc-meta">{displayLevel}-level · {displayCredits} credit</span>
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

          <div className="csc-details-grid">
            <div>
              <p className="csc-label">Faculty</p>
              <p className="csc-detail-value">{course.faculty || 'N/A'}</p>
            </div>
            <div>
              <p className="csc-label">Department</p>
              <p className="csc-detail-value">{course.department || 'N/A'}</p>
            </div>
            <div>
              <p className="csc-label">Term</p>
              {!isTimetableMode && termOptions.length > 0 ? (
                <select
                  className="csc-term-select"
                  value={selectedTerm}
                  onChange={(event) => setSelectedTerm(event.target.value)}
                >
                  {termOptions.map((term) => (
                    <option key={term} value={term}>
                      {term}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="csc-detail-value">{course.term || selectedTerm || 'N/A'}</p>
              )}
            </div>
          </div>

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
                <th>Room</th>
                <th>Campus</th>
                <th>Seats</th>
              </tr>
            </thead>
            <tbody>
              {visibleSections.map(sec => {
                const remaining = sec.seatsRemaining ?? 0;
                const full = remaining <= 0;
                const isSelected = selectedCrn === sec.id;
                return (
                  <tr
                    key={sec.id}
                    className={`csc-row-sec ${isSelected ? 'selected' : ''} ${full ? 'full' : ''}`}
                    onClick={() => {
                      if (isTimetableMode || full) return;
                      setSelectedCrn(isSelected ? null : sec.id);
                    }}
                  >
                    <td>{sec.sectionNumber}</td>
                    <td>{sec.instructor}</td>
                    <td>{sec.meetingTimes || '-'}</td>
                    <td>{sec.deliveryMode || '-'}</td>
                    <td>{sec.room || '-'}</td>
                    <td>{sec.campus || '-'}</td>
                    <td className={`csc-seats ${full ? 'full' : remaining <= 10 ? 'low' : 'ok'}`}>
                      {full ? 'Full' : `${remaining} / ${sec.seatsTotal}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!isTimetableMode ? (
          <div className="csc-footer">
            <button
              className="csc-add-btn"
              disabled={!selectedCrn}
              onClick={() => {
                if (!selectedSection || !onAddSection) return;
                onAddSection(selectedSection);
                onClose();
              }}
            >
              Add to cart
            </button>
          </div>
        ) : null}

      </div>
    </div>
  );
}