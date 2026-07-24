import { useEffect, useMemo, useState } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import './TimetablePage.css';

const API_ROOT = normalizeApiBase(import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001');
const API_BASE = `${API_ROOT}/api`;
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const DEFAULT_HOURS = { minHour: 8, maxHour: 17 };
function normalizeApiBase(rawValue) {
  const trimmed = String(rawValue || '').trim().replace(/\/$/, '');
  if (!trimmed) return 'http://localhost:3001';
  return trimmed.replace(/\/api$/i, '');
}

function getJsonHeaders(includeAuth = false) {
  const headers = { Accept: 'application/json' };
  if (includeAuth) {
    const token = localStorage.getItem('token');
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }
  return headers;
}

function getCurrentUser() {
  try {
    const raw = localStorage.getItem('currentUser');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function parseTimeToHour(timeValue) {
  if (!timeValue) return null;
  const [hourPart] = String(timeValue).split(':');
  const hour = Number.parseInt(hourPart, 10);
  return Number.isFinite(hour) ? hour : null;
}

function formatTimeLabel(timeValue) {
  if (!timeValue) return '';
  const parts = String(timeValue).split(':');
  if (parts.length < 2) return String(timeValue);
  return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
}

function buildRoomLabel(row) {
  const roomParts = [row.building, row.room_number].filter(Boolean);
  if (roomParts.length > 0) {
    return roomParts.join(' ');
  }
  return row.campus || 'TBA';
}

function hashColor(key) {
  const palette = ['blue', 'green', 'orange', 'red', 'purple', 'teal'];
  const text = String(key || '');
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
  }
  return palette[hash % palette.length];
}

function buildTermLabel(row) {
  if (!row || typeof row !== 'object') return '';
  const termName = String(row.term_label ?? row.term_name ?? '').trim();
  if (termName) return termName;
  return [row.semester, row.year].filter(Boolean).join(' ').trim();
}

function normalizeDay(dayValue) {
  const raw = String(dayValue || '').trim();
  if (!raw) return '';

  const normalized = raw.toLowerCase();
  const map = {
    mon: 'Monday',
    monday: 'Monday',
    tue: 'Tuesday',
    tues: 'Tuesday',
    tuesday: 'Tuesday',
    wed: 'Wednesday',
    weds: 'Wednesday',
    wednesday: 'Wednesday',
    thu: 'Thursday',
    thur: 'Thursday',
    thurs: 'Thursday',
    thursday: 'Thursday',
    fri: 'Friday',
    friday: 'Friday',
    sat: 'Saturday',
    saturday: 'Saturday',
    sun: 'Sunday',
    sunday: 'Sunday',
  };

  return map[normalized] || raw;
}

async function getSchedule(studentId, termId) {
  const query = termId ? `?termId=${encodeURIComponent(termId)}` : '';
  const response = await fetch(`${API_BASE}/students/${studentId}/schedule${query}`, {
    headers: getJsonHeaders(true),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.message || 'Could not load your timetable.');
  }

  return Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload)
      ? payload
      : [];
}

function normalizeScheduleRow(row) {
  const startHour = parseTimeToHour(row.start_time);
  const endHour = parseTimeToHour(row.end_time);
  const termLabel = buildTermLabel(row);

  return {
    crn: row.crn,
    termId: row.term_id !== null && row.term_id !== undefined ? String(row.term_id) : '',
    term: termLabel,
    day: normalizeDay(row.day_of_week),
    startHour,
    endHour,
    startLabel: formatTimeLabel(row.start_time),
    endLabel: formatTimeLabel(row.end_time),
    title: row.course_code || row.course_name || 'Registered Course',
    subtitle: row.course_name || '',
    room: buildRoomLabel(row),
    color: hashColor(`${row.course_code}-${row.crn}-${row.day_of_week}`),
  };
}

const TimetablePage = () => {
  const [selectedTermId, setSelectedTermId] = useState('');
  const [scheduleRows, setScheduleRows] = useState([]);
  const [terms, setTerms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadTimetable() {
      setIsLoading(true);
      setErrorMessage('');

      const currentUser = getCurrentUser();
      const studentId = currentUser?.studentId ?? currentUser?.student_id ?? null;

      if (!studentId) {
        if (!cancelled) {
          setScheduleRows([]);
          setTerms([]);
          setSelectedTermId('');
          setErrorMessage('Sign in as a student to view your timetable.');
          setIsLoading(false);
        }
        return;
      }

      try {
        const [scheduleData, termsRes] = await Promise.all([
          getSchedule(studentId, selectedTermId),
          fetch(`${API_BASE}/terms`, {
            headers: getJsonHeaders(true),
          }),
        ]);
        const termsPayload = await termsRes.json().catch(() => ({}));

        const termsData = Array.isArray(termsPayload?.data)
          ? termsPayload.data
          : Array.isArray(termsPayload)
            ? termsPayload
            : [];

        const nextRows = scheduleData
          .map(normalizeScheduleRow)
          .filter((row) => row.day && row.startHour !== null);

        const nextTerms = termsData
          .map((term) => {
            const label = buildTermLabel(term);
            const value = term?.term_id;
            if (!label || value === null || value === undefined) return null;
            return { value: String(value), label };
          })
          .filter(Boolean);

        if (cancelled) return;
        setScheduleRows(nextRows);
        setTerms(nextTerms);

        // Auto-select first term if none is selected or current selection is invalid
        if (!selectedTermId && nextTerms.length > 0) {
          setSelectedTermId(nextTerms[0].value);
        } else if (selectedTermId && !nextTerms.some((term) => term.value === selectedTermId)) {
          setSelectedTermId(nextTerms.length > 0 ? nextTerms[0].value : '');
        }
      } catch (error) {
        if (cancelled) return;
        setScheduleRows([]);
        setTerms([]);
        setSelectedTermId('');
        setErrorMessage(error?.message || 'Failed to load your timetable.');
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadTimetable();

    return () => {
      cancelled = true;
    };
  }, [selectedTermId]);

  const visibleRows = useMemo(
    () => (selectedTermId ? scheduleRows.filter((row) => row.termId === selectedTermId) : scheduleRows),
    [scheduleRows, selectedTermId],
  );

  // Dynamically calculate the time range: 1 hour before first class, 1 hour after last class
  const { minHour, maxHour } = useMemo(() => {
    if (visibleRows.length === 0) return DEFAULT_HOURS;

    const startTimes = visibleRows.map((row) => row.startHour).filter((value) => Number.isFinite(value));
    const endTimes = visibleRows.map((row) => row.endHour).filter((value) => Number.isFinite(value));

    if (startTimes.length === 0) return DEFAULT_HOURS;

    return {
      minHour: Math.max(0, Math.min(...startTimes) - 1),
      maxHour: Math.max(...startTimes, ...endTimes) + 1,
    };
  }, [visibleRows]);

  const hours = Array.from({ length: maxHour - minHour + 1 }, (_, i) => minHour + i);
  const currentTermLabel = terms.find((term) => term.value === selectedTermId)?.label || '';

  return (
    <div className="tt-layout">
      <Sidebar />

      <div className="tt-main">
        <div className="tt-header">
          <h1 className="tt-header__title">Timetable</h1>
        </div>

        <div className="tt-body">
          <section className="schedule-card">
            <div className="schedule-header">
              {/* Invisible spacer to balance the flexbox and perfectly center the title */}
              <div className="header-left-spacer" />
              
              <h2 className="schedule-title">{currentTermLabel} Schedule</h2>
              
              <div className="schedule-meta">
                <select
                  className="schedule-term-select"
                  value={selectedTermId}
                  onChange={(e) => setSelectedTermId(e.target.value)}
                  disabled={terms.length === 0}
                >
                  {terms.length === 0 ? (
                    <option value="">No terms available</option>
                  ) : (
                    terms.map((term) => (
                      <option key={term.value} value={term.value}>{term.label}</option>
                    ))
                  )}
                </select>
                <span className="chip chip-success">{`${visibleRows.length} meeting${visibleRows.length === 1 ? '' : 's'}`}</span>
              </div>
            </div>

            <div className="table-wrap">
              {isLoading ? (
                <div className="schedule-empty-state">Loading your registered courses...</div>
              ) : errorMessage ? (
                <div className="schedule-empty-state schedule-empty-state--error">{errorMessage}</div>
              ) : visibleRows.length === 0 ? (
                <div className="schedule-empty-state">No registered classes found for this term.</div>
              ) : (
                <table className="timetable">
                  <thead>
                    <tr>
                      <th className="time-col">Time</th>
                      {DAYS.map((day) => <th key={day}>{day}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {hours.map((hour) => (
                      <tr key={hour}>
                        <th className="time-col">{hour.toString().padStart(2, '0')}:00</th>
                        {DAYS.map((day) => {
                          const entries = visibleRows.filter((row) => row.day === day && row.startHour === hour);
                          return (
                            <td key={`${day}-${hour}`}>
                              {entries.map((entry) => (
                                <div key={`${entry.crn}-${entry.day}-${entry.startHour}`} className={`slot ${entry.color}`}>
                                  <strong>{entry.title}</strong>
                                  <small>{entry.room}</small>
                                </div>
                              ))}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TimetablePage;