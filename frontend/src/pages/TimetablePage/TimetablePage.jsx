import { useEffect, useMemo, useState } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import CourseSummaryCard from '../../components/CourseSummaryCard';
import { fetchCourseDetail } from '../../services/courseService';
import './TimetablePage.css';

const API_ROOT = normalizeApiBase(import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001');
const API_BASE = `${API_ROOT}/api`;
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const DEFAULT_HOURS = { minHour: 8, maxHour: 17 };
const SLOT_CLASSES = ['blue', 'green', 'orange', 'red', 'purple', 'teal'];
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

function toNullableNumber(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function buildRoomLabel(row) {
  const roomParts = [row.building, row.room_number].filter(Boolean);
  if (roomParts.length > 0) {
    return roomParts.join(' ');
  }
  return row.campus || 'TBA';
}

function buildClassColorMap(rows) {
  const uniqueClassKeys = [...new Set(rows.map((row) => row.classKey).filter(Boolean))].sort();
  const colorMap = new Map();

  uniqueClassKeys.forEach((key, index) => {
    colorMap.set(key, SLOT_CLASSES[index % SLOT_CLASSES.length]);
  });

  return colorMap;
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
  const courseCode = String(row.course_code || '').trim();
  const courseName = String(row.course_name || '').trim();
  const courseKey = courseCode || courseName || String(row.course_id || row.crn || '').trim();

  return {
    enrollmentId: row.enrollment_id,
    crn: row.crn,
    courseId: row.course_id,
    termId: row.term_id !== null && row.term_id !== undefined ? String(row.term_id) : '',
    term: termLabel,
    day: normalizeDay(row.day_of_week),
    startHour,
    endHour,
    startLabel: formatTimeLabel(row.start_time),
    endLabel: formatTimeLabel(row.end_time),
    title: courseCode || courseName || 'Registered Course',
    subtitle: courseName && courseCode ? courseName : '',
    sectionNumber: row.section_number,
    room: buildRoomLabel(row),
    seatsTotal: toNullableNumber(row.capacity),
    seatsRemaining: toNullableNumber(row.seats_remaining),
    courseKey,
    classKey: String(row.crn ?? `${courseKey}-${row.day}-${row.start_time}`),
  };
}

const TimetablePage = () => {
  const [selectedTermId, setSelectedTermId] = useState('');
  const [scheduleRows, setScheduleRows] = useState([]);
  const [terms, setTerms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedCourseInitialTerm, setSelectedCourseInitialTerm] = useState('');

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
  const classColors = useMemo(() => buildClassColorMap(visibleRows), [visibleRows]);

  async function openTimetableCourse(entry) {
    const createFallbackCourse = () => ({
      id: entry.courseId,
      code: entry.title,
      title: entry.subtitle || entry.title,
      credits: 0,
      subject: '',
      faculty: '',
      department: '',
      level: 0,
      description: '',
      prerequisites: [],
      sections: [
        {
          id: entry.crn,
          sectionNumber: entry.sectionNumber,
          term: entry.term,
          instructor: '',
          room: entry.room,
          campus: '',
          seatsTotal: entry.seatsTotal,
          seatsRemaining: entry.seatsRemaining,
          status: 'Registered',
          deliveryMode: '',
          meetingTimes: `${entry.startLabel}-${entry.endLabel}`,
          schedule: [],
          daysOfWeek: [entry.day].filter(Boolean),
        },
      ],
    });

    try {
      const detail = await fetchCourseDetail(entry.courseId);
      if (!detail) {
        setSelectedCourse(createFallbackCourse());
        setSelectedCourseInitialTerm(entry.term);
        return;
      }

      const normalizedDetail = {
        code: detail.course_code ?? detail.courseCode ?? detail.code ?? entry.title,
        title: (detail.course_name ?? detail.courseName ?? detail.title ?? entry.subtitle) || entry.title,
        description: detail.course_description ?? detail.description ?? detail.courseDescription ?? '',
        faculty: detail.faculty_name ?? detail.faculty ?? '',
        department: detail.department_name ?? detail.department ?? '',
        level: Number(detail.course_level ?? detail.level ?? 0),
        credits: Number(detail.credits ?? detail.credit_hours ?? detail.creditHours ?? 0),
        prerequisites: Array.isArray(detail.prerequisites) ? detail.prerequisites : [],
        antirequisites: Array.isArray(detail.antirequisites) ? detail.antirequisites : [],
        corequisites: Array.isArray(detail.corequisites) ? detail.corequisites : [],
      };

      const normalizedSections = Array.isArray(detail.sections)
        ? detail.sections.map((section) => ({
            id: section.crn ?? section.section_id ?? section.id ?? entry.crn,
            sectionNumber: section.section_number ?? section.section ?? section.id ?? entry.sectionNumber,
            term: section.term_name ?? section.term ?? entry.term,
            instructor: section.instructor_first_name || section.instructor_last_name
              ? `${section.instructor_first_name ?? ''} ${section.instructor_last_name ?? ''}`.trim()
              : section.instructor_name ?? section.instructor ?? '',
            room: section.room_number ?? section.room ?? entry.room,
            campus: section.campus ?? 'Unknown',
            seatsTotal: toNullableNumber(section.capacity ?? section.seatsTotal),
            seatsRemaining: toNullableNumber(
              section.seats_remaining
              ?? section.seatsRemaining
              ?? (() => {
                const capacity = toNullableNumber(section.capacity ?? section.seatsTotal);
                const enrolled = toNullableNumber(section.enrolled_count ?? section.enrolledCount);
                if (capacity === null || enrolled === null) return null;
                return capacity - enrolled;
              })()
            ),
            status: section.status ?? 'Registered',
            deliveryMode: section.delivery_mode ?? section.deliveryMode ?? '',
            meetingTimes: section.meeting_times ?? `${entry.startLabel}-${entry.endLabel}`,
            schedule: Array.isArray(section.schedule) ? section.schedule : [],
            daysOfWeek: Array.isArray(section.daysOfWeek)
              ? section.daysOfWeek
              : extractDaysOfWeek(section.meeting_times ?? `${entry.day}`),
          }))
        : [];

      setSelectedCourse({
        ...normalizedDetail,
        sections: normalizedSections.length > 0 ? normalizedSections : createFallbackCourse().sections,
      });
      setSelectedCourseInitialTerm(entry.term);
    } catch {
      setSelectedCourse(createFallbackCourse());
      setSelectedCourseInitialTerm(entry.term);
    }
  }

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
                                <div
                                  key={`${entry.crn}-${entry.day}-${entry.startHour}`}
                                  className={`slot ${classColors.get(entry.classKey) || 'blue'}`}
                                  onClick={() => openTimetableCourse(entry)}
                                  style={{ cursor: 'pointer' }}
                                >
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
      {selectedCourse && (
        <CourseSummaryCard
          course={selectedCourse}
          initialTerm={selectedCourseInitialTerm}
          mode="timetable"
          onClose={() => setSelectedCourse(null)}
        />
      )}
    </div>
  );
};

export default TimetablePage;