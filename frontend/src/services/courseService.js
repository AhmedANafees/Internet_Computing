function normalizeApiBase(rawValue) {
  const trimmed = String(rawValue || '').trim().replace(/\/$/, '');
  if (!trimmed) return 'http://localhost:3001';
  return trimmed.replace(/\/api$/i, '');
}

const API_ROOT = normalizeApiBase(import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001');
const API_BASE = `${API_ROOT}/api`;
const CANDIDATE_ENDPOINTS = [
  `${API_BASE}/sections`,
  `${API_BASE}/courses`,
  `${API_BASE}/course-catalog`,
  `${API_BASE}/courses/all`,
];

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

function coerceArray(value) {
  return Array.isArray(value) ? value : [];
}

function parseAndFormatMeetingTimes(meetingTimesStr) {
  if (!meetingTimesStr || typeof meetingTimesStr !== 'string') return '';

  // Day order for sorting
  const dayOrder = { Monday: 0, Tuesday: 1, Wednesday: 2, Thursday: 3, Friday: 4, Saturday: 5, Sunday: 6 };
  const dayShort = { Monday: 'M', Tuesday: 'Tu', Wednesday: 'W', Thursday: 'Th', Friday: 'F', Saturday: 'Sa', Sunday: 'Su' };

  // Parse each schedule entry: "Monday 09:00-10:30, Tuesday 09:00-10:30, ..."
  const schedules = meetingTimesStr.split(',').map(s => s.trim()).filter(Boolean);
  const timeMap = {}; // { "09:00-10:30": [Monday, Tuesday, ...] }

  schedules.forEach((schedule) => {
    const match = schedule.match(/^(\w+)\s+(\d{2}:\d{2})-(\d{2}:\d{2})$/);
    if (match) {
      const [, day, start, end] = match;
      const time = `${start}-${end}`;
      if (!timeMap[time]) timeMap[time] = [];
      timeMap[time].push(day);
    }
  });

  // Sort times and format output
  const result = Object.entries(timeMap)
    .sort(([, days1], [, days2]) => {
      const minDay1 = Math.min(...days1.map(d => dayOrder[d] ?? 999));
      const minDay2 = Math.min(...days2.map(d => dayOrder[d] ?? 999));
      return minDay1 - minDay2;
    })
    .map(([time, days]) => {
      const sortedDays = days.sort((a, b) => (dayOrder[a] ?? 999) - (dayOrder[b] ?? 999));
      const dayStr = sortedDays.map(d => dayShort[d] ?? d).join(',');
      return `${dayStr} ${time}`;
    })
    .join('; ');

  return result;
}

function extractDaysOfWeek(meetingTimesStr) {
  if (!meetingTimesStr || typeof meetingTimesStr !== 'string') return [];
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const daysFound = new Set();
  dayNames.forEach(day => {
    if (meetingTimesStr.includes(day)) {
      daysFound.add(day);
    }
  });
  return Array.from(daysFound);
}

function normalizeSchedule(value) {
  if (Array.isArray(value)) return value;
  return [];
}

function normalizeSection(section, sectionIndex, courseMeta) {
  const capacity = Number(section.capacity ?? section.seatsTotal ?? 0);
  const enrolledCount = Number(section.enrolled_count ?? section.enrolledCount ?? 0);
  const remaining = Number(section.seats_remaining ?? section.seatsRemaining ?? capacity - enrolledCount);

  return {
    id: section.crn ?? section.section_id ?? `${courseMeta.code}-${section.section_number ?? sectionIndex + 1}`,
    sectionNumber: section.section_number ?? section.section ?? `${sectionIndex + 1}`,
    instructor: section.instructor_first_name || section.instructor_last_name
      ? `${section.instructor_first_name ?? ''} ${section.instructor_last_name ?? ''}`.trim()
      : (section.instructor_name ?? section.instructor ?? ''),
    room: section.room_number ?? section.room ?? '',
    campus: section.campus ?? 'Unknown',
    seatsTotal: capacity,
    seatsRemaining: remaining,
    term: section.term_name ?? section.term ?? '',
    status: section.status ?? 'Open',
    deliveryMode: section.delivery_mode ?? section.deliveryMode ?? '',
    schedule: normalizeSchedule(section.schedule),
    meetingTimes: section.meeting_times ?? '',
    daysOfWeek: extractDaysOfWeek(section.meeting_times ?? ''),
    parentCrn: section.parent_crn ?? section.parentCrn ?? null,
  };
}

function normalizeSectionData(rawSections) {
  const sections = coerceArray(rawSections);
  const courseMap = {};

  // Group sections by course
  sections.forEach((section) => {
    const code = section.course_code ?? section.code ?? 'UNKNOWN';
    if (!courseMap[code]) {
      courseMap[code] = {
        id: section.course_id ?? code,
        code,
        title: section.course_name ?? section.title ?? 'Untitled Course',
        subject: section.subject ?? (typeof code === 'string' ? code.split(/[^A-Za-z]/)[0].toUpperCase() : 'N/A'),
        faculty:
          section.faculty_name
          ?? section.faculty
          ?? section.department_name
          ?? section.subject
          ?? (typeof code === 'string' ? code.split(/[^A-Za-z]/)[0].toUpperCase() : 'Unknown'),
        department: section.subject ?? section.department_name ?? section.department ?? '',
        level: Number(section.course_level ?? section.level ?? 0),
        credits: Number(section.credits ?? section.credit_hours ?? 0.5),
        description: section.course_description ?? section.description ?? '',
        prerequisites: Array.isArray(section.prerequisites) ? section.prerequisites : [],
        sections: [],
      };
    }

    // Add section to course
    const capacity = Number(section.capacity ?? section.seatsTotal ?? 0);
    const enrolledCount = Number(section.enrolled_count ?? section.enrolledCount ?? 0);
    const remaining = Number(section.seats_remaining ?? section.seatsRemaining ?? capacity - enrolledCount);

    // Parse meeting times to extract day of week and format them
    const meetingTimesStr = section.meeting_times ?? '';
    const formattedTimes = parseAndFormatMeetingTimes(meetingTimesStr);
    const daysOfWeek = extractDaysOfWeek(meetingTimesStr);

    courseMap[code].sections.push({
      id: section.crn ?? section.section_id ?? `${code}-${section.section_number}`,
      sectionNumber: section.section_number ?? section.section ?? '1',
      instructor: section.instructor_first_name || section.instructor_last_name 
        ? `${section.instructor_first_name ?? ''} ${section.instructor_last_name ?? ''}`.trim()
        : (section.instructor_name ?? section.instructor ?? ''),
      room: section.room_number ?? section.room ?? '',
      campus: section.campus ?? 'Unknown',
      seatsTotal: capacity,
      seatsRemaining: remaining,
      term: section.term_name ?? section.term ?? '',
      status: section.status ?? 'Open',
      deliveryMode: section.delivery_mode ?? section.deliveryMode ?? '',
      schedule: normalizeSchedule(section.schedule),
      meetingTimes: formattedTimes,
      daysOfWeek,
    });
  });

  return Object.values(courseMap);
}

function normalizeCourses(rawData) {
  // If raw data is array of sections (from backend /api/sections)
  if (Array.isArray(rawData) && rawData.length > 0 && rawData[0].course_code) {
    return normalizeSectionData(rawData);
  }

  // Fallback: if it's array of courses with nested sections
  const courses = coerceArray(rawData);
  return courses.map((course, index) => {
    const code = course.course_code ?? course.courseCode ?? course.code ?? course.id ?? `COURSE-${index}`;
    const title = course.course_name ?? course.title ?? course.name ?? course.courseName ?? 'Untitled Course';
    const subject = course.subject ?? course.subject_code ?? course.department_name ?? course.department?.name ?? (typeof code === 'string' ? code.split(/[^A-Za-z]/)[0].toUpperCase() : 'N/A');
    const faculty = course.faculty_name ?? course.faculty ?? course.department?.faculty_name ?? 'Unknown';
    const department = course.department_name ?? course.department?.name ?? '';

    const sections = coerceArray(course.sections ?? course.sectionDetails ?? course.section_details).map((section, sectionIndex) =>
      normalizeSection(section, sectionIndex, { id: course.course_id ?? course.id ?? code, code })
    );

    return {
      id: course.course_id ?? course.id ?? code,
      code,
      title,
      subject,
      faculty,
      department,
      level: Number(course.course_level ?? course.level ?? 0),
      credits: Number(course.credits ?? course.credit_hours ?? 0.5),
      description: course.course_description ?? course.description ?? '',
      prerequisites: Array.isArray(course.prerequisites) ? course.prerequisites : [],
      sections,
    };
  });
}

function normalizeTerms(terms, courses) {
  const termValues = coerceArray(terms).filter(Boolean);
  const fromSections = courses.flatMap((course) => course.sections.map((section) => section.term)).filter(Boolean);
  const uniqueTerms = [...new Set([...termValues, ...fromSections])];
  return uniqueTerms;
}

function unwrapPayload(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.courses)) return payload.courses;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
}

export async function fetchCourseCatalog() {
  let fetchedTerms = [];

  try {
    const termsResponse = await fetch(`${API_BASE}/terms`, {
      headers: getJsonHeaders(true),
    });

    if (termsResponse.ok) {
      const termsPayload = await termsResponse.json();
      const termRows = unwrapPayload(termsPayload);
      fetchedTerms = termRows
        .map((item) => item.term_name ?? item.termName ?? item.name ?? item.term)
        .filter(Boolean);
    }
  } catch {
    // Ignore terms endpoint failures and continue.
  }

  for (const endpoint of CANDIDATE_ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        headers: getJsonHeaders(true),
      });

      if (!response.ok) continue;

      const payload = await response.json();
      const rawCourses = unwrapPayload(payload);
      const courses = normalizeCourses(rawCourses);

      if (courses.length > 0) {
        return {
          courses,
          terms: normalizeTerms([...fetchedTerms, ...(payload?.terms ?? payload?.data?.terms ?? [])], courses),
        };
      }
    } catch {
      // Ignore and try the next endpoint.
    }
  }

  return {
    courses: [],
    terms: fetchedTerms,
  };
}

function extractErrorMessage(payload, fallback) {
  if (!payload || typeof payload !== 'object') return fallback;
  return payload?.error?.message ?? payload?.message ?? fallback;
}

export async function fetchCourseDetail(courseId) {
  const response = await fetch(`${API_BASE}/courses/${courseId}`, {
    headers: getJsonHeaders(true),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(extractErrorMessage(payload, 'Failed to fetch course details.'));
  }

  const payload = await response.json();
  return payload?.data ?? null;
}

export async function submitPlanRegistration(cartItems) {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Please sign in to register courses.');
  }

  const crns = cartItems
    .map((item) => Number(item.section.id))
    .filter((crn) => Number.isFinite(crn));

  if (crns.length === 0) {
    return [];
  }

  const response = await fetch(`${API_BASE}/enrollments/batch`, {
    method: 'POST',
    headers: {
      ...getJsonHeaders(true),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ crns }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const reason = extractErrorMessage(payload, 'Failed to register selected courses.');
    throw new Error(reason);
  }

  return Array.isArray(payload?.data) ? payload.data : [];
}

export async function fetchStudentEnrollments(studentId) {
  const response = await fetch(`${API_BASE}/students/${studentId}/enrollments`, {
    headers: getJsonHeaders(true),
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(extractErrorMessage(payload, 'Failed to fetch enrollments.'));
  }
  const payload = await response.json();
  return coerceArray(payload?.data ?? payload);
}

export async function dropEnrollment(enrollmentId) {
  const response = await fetch(`${API_BASE}/enrollments/${enrollmentId}`, {
    method: 'DELETE',
    headers: getJsonHeaders(true),
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(extractErrorMessage(payload, 'Failed to drop enrollment.'));
  }
  return true;
}
