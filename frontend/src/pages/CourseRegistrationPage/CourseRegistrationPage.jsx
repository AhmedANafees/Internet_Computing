import { useEffect, useMemo, useState } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import CourseRegistrationPageHeader from '../../components/CourseRegistrationPage/CourseRegistrationPageHeader';
import CourseRegistrationFilters from '../../components/CourseRegistrationPage/CourseRegistrationFilters';
import CourseRegistrationTable from '../../components/CourseRegistrationPage/CourseRegistrationTable';
import { useDebounce } from '../../hooks/useDebounce';
import { fetchCourseCatalog, fetchCourseDetail, submitPlanRegistration, fetchStudentEnrollments, dropEnrollment } from '../../services/courseService';
import { mockCourses, mockTerms } from '../../data/mockCourses';
import './CourseRegistrationPage.css';
import CourseSummaryCard from '../../components/CourseSummaryCard';

const ALL_COLUMNS = [
  { id: 'code', label: 'Code' },
  { id: 'title', label: 'Name' },
  { id: 'section', label: 'Section' },
  { id: 'credits', label: 'Credits' },
  { id: 'instructor', label: 'Instructor' },
  { id: 'meetingTimes', label: 'Meeting Times' },
  { id: 'room', label: 'Room' },
  { id: 'campus', label: 'Campus' },
  { id: 'deliveryMode', label: 'Delivery' },
  { id: 'status', label: 'Status' },
  { id: 'seats', label: 'Seats' },
  { id: 'term', label: 'Term' },
  { id: 'subject', label: 'Subject' },
];

const DEFAULT_VISIBLE = new Set(['code', 'title', 'section', 'credits', 'instructor', 'meetingTimes', 'seats']);
const DAY_OPTIONS = [
  { label: 'M', value: 'Monday' },
  { label: 'Tu', value: 'Tuesday' },
  { label: 'W', value: 'Wednesday' },
  { label: 'Th', value: 'Thursday' },
  { label: 'F', value: 'Friday' },
  { label: 'Sa', value: 'Saturday' },
  { label: 'Su', value: 'Sunday' },
];

export default function CourseRegistrationPage() {
  const [searchRaw, setSearchRaw] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [colPickerOpen, setColPickerOpen] = useState(false);
  const [visibleCols, setVisibleCols] = useState(DEFAULT_VISIBLE);
  const [activeFilters, setActiveFilters] = useState({
    faculties: [],
    levels: [],
    subjects: [],
    campuses: [],
    deliveryModes: [],
    days: [],
  });
  const [cart, setCart] = useState([]);
  const [initialCart, setInitialCart] = useState([]);
  const [rowFeedback, setRowFeedback] = useState({});
  const [reviewMode, setReviewMode] = useState(false);
  const [submissionResults, setSubmissionResults] = useState([]);
  const [courses, setCourses] = useState([]);
  const [apiTerms, setApiTerms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const search = useDebounce(searchRaw, 300);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedCourseInitialTerm, setSelectedCourseInitialTerm] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadCatalog() {
      setIsLoading(true);
      setApiError('');

      try {
        const { courses: nextCourses, terms: nextTerms } = await fetchCourseCatalog();
        if (cancelled) return;
        if (nextCourses.length > 0) {
          setCourses(nextCourses);
          setApiTerms(nextTerms);
        } else {
          setCourses(mockCourses);
          setApiTerms(mockTerms);
          setApiError('Backend returned no courses. Showing local mock catalog.');
        }
      } catch {
        if (cancelled) return;
        setCourses(mockCourses);
        setApiTerms(mockTerms);
        setApiError('Failed to load backend catalog. Showing local mock catalog.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadCatalog();
    return () => {
      cancelled = true;
    };
  }, []);

  const terms = useMemo(() => [...new Set([...apiTerms, ...courses.flatMap((course) => course.sections.map((section) => section.term))])], [apiTerms, courses]);

  // Load the student's active enrollments once after the course catalog loads.
  useEffect(() => {
    let cancelled = false;

    async function loadEnrollments() {
      try {
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
        const studentId = currentUser?.studentId ?? currentUser?.student_id;
        if (!studentId) return;

        const enrollments = await fetchStudentEnrollments(studentId);
        if (cancelled) return;

        const termEnrollments = enrollments.filter((e) => {
          const status = String(e.status || '').trim().toLowerCase();
          const inactiveStatuses = new Set(['dropped', 'withdrawn', 'completed', 'failed', 'cancelled']);
          if (inactiveStatuses.has(status)) return false;
          if (status) return true;

          const endDate = e.term_end_date ?? e.end_date ?? e.endDate;
          const startDate = e.term_start_date ?? e.start_date ?? e.startDate;
          const rawSemester = e.semester ?? e.term_semester ?? e.termSemester ?? '';
          const rawYear = e.term_year ?? e.year ?? e.termYear;
          const termName = e.term_name ?? e.termName ?? e.term ?? '';

          const normalizeSemester = (value) => {
            const input = String(value || '').trim().toLowerCase();
            if (!input) return '';
            if (input.startsWith('w')) return 'Winter';
            if (input.startsWith('sp')) return 'Spring';
            if (input.startsWith('su')) return 'Summer';
            if (input.startsWith('f')) return 'Fall';
            if (input.includes('winter')) return 'Winter';
            if (input.includes('spring')) return 'Spring';
            if (input.includes('summer')) return 'Summer';
            if (input.includes('fall') || input.includes('autumn')) return 'Fall';
            return '';
          };

          const parseTermName = (value) => {
            const match = String(value || '').trim().match(/(Winter|Spring|Summer|Fall)\s+(\d{4})/i);
            if (!match) return {};
            return { semester: normalizeSemester(match[1]), year: Number(match[2]) };
          };

          const semester = normalizeSemester(rawSemester) || parseTermName(termName).semester;
          const year = Number(rawYear ?? parseTermName(termName).year);
          const today = new Date();
          const todayIso = today.toISOString().slice(0, 10);

          if (startDate && endDate) {
            return endDate >= todayIso;
          }
          if (endDate) {
            return endDate >= todayIso;
          }
          if (startDate) {
            return startDate >= todayIso;
          }

          const semesterOrder = { Winter: 0, Spring: 1, Summer: 2, Fall: 3 };
          if (!Number.isFinite(year) || !semesterOrder.hasOwnProperty(semester)) {
            return true;
          }

          const currentMonth = today.getMonth() + 1;
          const currentSemester =
            currentMonth >= 1 && currentMonth <= 3 ? 'Winter'
              : currentMonth <= 5 ? 'Spring'
              : currentMonth <= 7 ? 'Summer'
              : 'Fall';
          const currentKey = today.getFullYear() * 10 + semesterOrder[currentSemester];
          const termKey = year * 10 + semesterOrder[semester];
          return termKey >= currentKey;
        });

        const cartItems = termEnrollments.map((e) => {
          let courseObj = null;
          let sectionObj = null;
          for (const c of courses) {
            const sec = c.sections.find((s) => String(s.id) === String(e.crn));
            if (sec) {
              courseObj = c;
              sectionObj = sec;
              break;
            }
          }
          if (!courseObj) {
            courseObj = {
              id: e.course_id,
              code: e.course_code,
              title: e.course_name,
              credits: Number(e.credits ?? 0),
              subject: '',
              faculty: '',
              department: '',
              level: 0,
              description: '',
              prerequisites: [],
              sections: [],
            };
          }
          if (!sectionObj) {
            sectionObj = {
              id: e.crn,
              sectionNumber: e.section_number,
              term: e.term_name,
              instructor: '',
              room: '',
              campus: '',
              seatsTotal: null,
              seatsRemaining: null,
              status: e.status || 'Registered',
              deliveryMode: '',
              meetingTimes: '',
              schedule: [],
              daysOfWeek: [],
            };
          }
          return { course: courseObj, section: sectionObj, enrollmentId: e.enrollment_id };
        });

        setCart(cartItems);
        setInitialCart(cartItems);
      } catch {
        // Silently fail — cart stays empty if enrollments can't be loaded
      }
    }

    loadEnrollments();
    return () => {
      cancelled = true;
    };
  }, [courses]);

  useEffect(() => {
    const raw = localStorage.getItem('selectedCourseOnOpen');
    if (!raw) return;
    localStorage.removeItem('selectedCourseOnOpen');

    try {
      const payload = JSON.parse(raw);
      if (!payload?.courseId) return;

      const matchingCourse = courses.find((course) => String(course.id) === String(payload.courseId));
      const matchingSection = matchingCourse
        ? matchingCourse.sections.find((section) => String(section.id) === String(payload.crn))
        : null;

      if (matchingCourse && matchingSection) {
        openCourseCard(matchingCourse, matchingSection);
        return;
      }

      if (matchingCourse) {
        openCourseCard(matchingCourse, matchingCourse.sections[0] || null);
        return;
      }

      fetchCourseDetail(payload.courseId)
        .then((detail) => {
          if (!detail) return;
          const course = {
            ...detail,
            sections: detail.sections || [],
          };
          const section = course.sections.find((sectionItem) => String(sectionItem.id) === String(payload.crn));
          setSelectedCourse(course);
          setSelectedCourseInitialTerm(section?.term || '');
        })
        .catch(() => {
          // ignore detail lookup failure
        });
    } catch {
      // ignore malformed storage values
    }
  }, [courses]);

  const faculties = useMemo(
    () => [...new Set(courses.map((course) => course.faculty).filter(Boolean))],
    [courses],
  );
  const levels = useMemo(() => [...new Set(courses.map((course) => course.level))], [courses]);
  const subjects = useMemo(() => [...new Set(courses.map((course) => course.subject))], [courses]);
  const campuses = useMemo(
    () => [...new Set(courses.flatMap((course) => course.sections.map((section) => section.campus)).filter(Boolean))],
    [courses],
  );
  const deliveryModes = useMemo(
    () => [...new Set(courses.flatMap((course) => course.sections.map((section) => section.deliveryMode)).filter(Boolean))],
    [courses],
  );

  const chips = useMemo(() => {
    const next = [];
    if (selectedTerm) next.push({ key: `term:${selectedTerm}`, label: selectedTerm });
    activeFilters.faculties.forEach((value) => next.push({ key: `faculties:${value}`, label: value }));
    activeFilters.levels.forEach((value) => next.push({ key: `levels:${value}`, label: `${value}-level` }));
    activeFilters.subjects.forEach((value) => next.push({ key: `subjects:${value}`, label: value }));
    activeFilters.campuses.forEach((value) => next.push({ key: `campuses:${value}`, label: value }));
    activeFilters.deliveryModes.forEach((value) => next.push({ key: `deliveryModes:${value}`, label: value }));
    activeFilters.days.forEach((value) => {
      const dayLabel = DAY_OPTIONS.find((day) => day.value === value)?.value ?? value;
      next.push({ key: `days:${value}`, label: dayLabel });
    });
    return next;
  }, [activeFilters, selectedTerm]);

  function toggleFilter(key, value) {
    setActiveFilters((prev) => ({
      ...prev,
      [key]: prev[key].includes(value) ? prev[key].filter((item) => item !== value) : [...prev[key], value],
    }));
  }

  function removeChip(chipKey) {
    const [key, value] = chipKey.split(':');
    if (key === 'term') {
      setSelectedTerm('');
      return;
    }
    setActiveFilters((prev) => ({ ...prev, [key]: prev[key].filter((item) => `${item}` !== value) }));
  }

  function clearAllFilters() {
    setSelectedTerm('');
    setActiveFilters({ faculties: [], levels: [], subjects: [], campuses: [], deliveryModes: [], days: [] });
  }

  function toggleCol(columnId) {
    setVisibleCols((prev) => {
      const next = new Set(prev);
      if (next.has(columnId)) {
        if (next.size === 1) return next;
        next.delete(columnId);
      } else {
        next.add(columnId);
      }
      return next;
    });
  }

  const cartSectionKeys = useMemo(
    () => new Set(cart.map((item) => `${item.course.id}:${item.section.id}`)),
    [cart],
  );

  function sectionMatchesNonTermFilters(course, section) {
    const sectionDays = Array.isArray(section.daysOfWeek) && section.daysOfWeek.length > 0
      ? section.daysOfWeek
      : (Array.isArray(section.schedule) ? section.schedule.map((slot) => slot.day).filter(Boolean) : []);

    if (activeFilters.faculties.length > 0 && !activeFilters.faculties.includes(course.faculty)) return false;
    if (activeFilters.levels.length > 0 && !activeFilters.levels.includes(course.level)) return false;
    if (activeFilters.subjects.length > 0 && !activeFilters.subjects.includes(course.subject)) return false;
    if (activeFilters.campuses.length > 0 && !activeFilters.campuses.includes(section.campus)) return false;
    if (activeFilters.deliveryModes.length > 0 && !activeFilters.deliveryModes.includes(section.deliveryMode)) return false;
    if (activeFilters.days.length > 0 && !activeFilters.days.some((day) => sectionDays.includes(day))) return false;
    return true;
  }

  async function openCourseCard(course, section) {
    const filteredSections = (course.sections || []).filter((item) => sectionMatchesNonTermFilters(course, item));
    const sectionsForCard = filteredSections.length > 0
      ? filteredSections
      : (course.sections && course.sections.length > 0 ? course.sections : (section ? [section] : []));
    const initialTerm = section?.term || selectedTerm || sectionsForCard[0]?.term || '';

    let selected = course;
    const shouldFetchDetail =
      !Array.isArray(course.prerequisites)
      || course.prerequisites.length === 0
      || !course.description
      || !Array.isArray(course.sections)
      || course.sections.length === 0;

    if (shouldFetchDetail) {
      try {
        const detail = await fetchCourseDetail(course.id);
        if (detail) {
          selected = { ...course, ...detail };
        }
      } catch {
        // Ignore detail fetch failures and display the selected course as-is.
      }
    }

    setSelectedCourse({
      ...selected,
      sections: sectionsForCard,
    });
    setSelectedCourseInitialTerm(initialTerm);
  }

  function addToCart(course, section) {
    const sectionKey = `${course.id}:${section.id}`;

    if (cartSectionKeys.has(sectionKey)) {
      setRowFeedback((prev) => ({ ...prev, [sectionKey]: 'duplicate' }));
      window.setTimeout(() => {
        setRowFeedback((prev) => {
          const next = { ...prev };
          delete next[sectionKey];
          return next;
        });
      }, 1500);
      return;
    }

    setCart((prev) => [...prev, { course, section }]);
  }

  async function removeFromCart(courseId, sectionId) {
    setCart((prev) => prev.filter((i) => !(i.course.id === courseId && i.section.id === sectionId)));
  }

  async function submitRegistration() {
    try {
      setApiError('');

      const toSectionKey = (item) => `${item.course.id}:${item.section.id}`;
      const initialSectionKeys = new Set(initialCart.map(toSectionKey));
      const currentSectionKeys = new Set(cart.map(toSectionKey));
      const addedItems = cart.filter((item) => !initialSectionKeys.has(toSectionKey(item)));
      const removedItems = initialCart.filter((item) => !currentSectionKeys.has(toSectionKey(item)));

      if (addedItems.length === 0 && removedItems.length === 0) {
        setSubmissionResults(
          cart.map((item) => ({
            ...item,
            status: 'unchanged',
            reason: 'No changes detected. You are already enrolled in these sections.',
          }))
        );
        setReviewMode(false);
        setApiError('No changes were made. Nothing was re-submitted.');
        return;
      }

      let droppedResults = [];
      if (removedItems.length > 0) {
        await Promise.all(removedItems.map((item) => dropEnrollment(item.enrollmentId)));
        droppedResults = removedItems.map((item) => ({
          ...item,
          status: 'dropped',
          reason: 'Unenrolled from course',
        }));
      }

      if (addedItems.length === 0) {
        setSubmissionResults(droppedResults);
        setInitialCart(cart);
        setReviewMode(false);
        setApiError(removedItems.length > 0 ? 'Enrollment updates submitted.' : 'No new sections to register.');
        return;
      }

      const resultItems = await submitPlanRegistration(addedItems);
      const resultMap = new Map(resultItems.map((item) => [String(item.crn), item.result]));
      const reasonMap = new Map(resultItems.map((item) => [String(item.crn), item.reason]));

      const results = addedItems.map((item) => ({
        ...item,
        status: resultMap.get(String(item.section.id)) ?? 'failed',
        reason: reasonMap.get(String(item.section.id)),
      }));

      setSubmissionResults([...droppedResults, ...results]);
      setReviewMode(false);

      const failedItems = results.filter((item) => item.status !== 'registered' && item.status !== 'waitlisted');
      const failedSectionKeys = new Set(failedItems.map((item) => `${item.course.id}:${item.section.id}`));
      const uniqueReasons = [...new Set(failedItems.map((item) => item.reason).filter(Boolean))];

      const nextInitialCart = cart.filter(
        (item) => !failedSectionKeys.has(`${item.course.id}:${item.section.id}`)
      );
      setInitialCart(nextInitialCart);
      setCart([...nextInitialCart, ...failedItems]);

      if (failedSectionKeys.size > 0) {
        setApiError(
          `Failed to register ${failedSectionKeys.size} course(s)` +
          (uniqueReasons.length > 0 ? `: ${uniqueReasons.join('; ')}` : '. See the detailed results below.')
        );
      }

      // Refresh the catalog so seats/status in the table reflect backend updates.
      try {
        const { courses: nextCourses, terms: nextTerms } = await fetchCourseCatalog();
        if (nextCourses.length > 0) {
          setCourses(nextCourses);
          setApiTerms(nextTerms);
        }
      } catch {
        // Keep successful submission results visible even if refresh fails.
      }
    } catch (error) {
      setApiError(error?.message ?? 'Registration submit failed.');
    }
  }

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    const allRows = courses.flatMap((course) =>
      course.sections.map((section) => ({ course, section })),
    );

    return allRows.filter(({ course, section }) => {
      const sectionDays = Array.isArray(section.daysOfWeek) && section.daysOfWeek.length > 0
        ? section.daysOfWeek
        : (Array.isArray(section.schedule) ? section.schedule.map((slot) => slot.day).filter(Boolean) : []);

      if (query) {
        const haystack = `${course.code} ${course.title} ${(course.keywords || []).join(' ')}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      if (selectedTerm && section.term !== selectedTerm) return false;
      if (activeFilters.faculties.length > 0 && !activeFilters.faculties.includes(course.faculty)) return false;
      if (activeFilters.levels.length > 0 && !activeFilters.levels.includes(course.level)) return false;
      if (activeFilters.subjects.length > 0 && !activeFilters.subjects.includes(course.subject)) return false;
      if (activeFilters.campuses.length > 0 && !activeFilters.campuses.includes(section.campus)) return false;
      if (activeFilters.deliveryModes.length > 0 && !activeFilters.deliveryModes.includes(section.deliveryMode)) return false;
      if (activeFilters.days.length > 0 && !activeFilters.days.some((day) => sectionDays.includes(day))) return false;
      return true;
    });
  }, [activeFilters, courses, search, selectedTerm]);

  const cartByTerm = useMemo(() => {
    return cart.reduce((acc, item) => {
      const term = item.section.term || 'No Term';
      if (!acc[term]) acc[term] = [];
      acc[term].push(item);
      return acc;
    }, {});
  }, [cart]);

  const cartTerms = useMemo(() => Object.keys(cartByTerm), [cartByTerm]);

  const columnsWithRender = ALL_COLUMNS.map((column) => ({
    ...column,
    render: (course, section) => {
      if (column.id === 'code') return course.code;
      if (column.id === 'title') return course.title;
      if (column.id === 'section') return section.sectionNumber;
      if (column.id === 'credits') return course.credits;
      if (column.id === 'instructor') return section.instructor;
      if (column.id === 'meetingTimes') {
        if (section.meetingTimes) return section.meetingTimes;
        if (Array.isArray(section.schedule) && section.schedule.length > 0) {
          return section.schedule.map((slot) => `${slot.day} ${slot.startTime}-${slot.endTime}`).join(', ');
        }
        return '-';
      }
      if (column.id === 'room') return section.room || '-';
      if (column.id === 'campus') return section.campus || '-';
      if (column.id === 'deliveryMode') return section.deliveryMode || '-';
      if (column.id === 'status') return section.status || '-';
      if (column.id === 'seats') {
        let seatClass = 'cr-seat-good';
        if (section.seatsRemaining <= 0) seatClass = 'cr-seat-full';
        else if (section.seatsRemaining < 4) seatClass = 'cr-seat-low';
        return <span className={seatClass}>{section.seatsRemaining} / {section.seatsTotal}</span>;
      }
      if (column.id === 'term') return section.term;
      if (column.id === 'subject') return course.subject;
      return '';
    },
  }));

  return (
    <div className="cr-layout">
      <Sidebar />
      <main className="cr-main">
        <CourseRegistrationPageHeader />

        <section className="cr-card">
          <div className="cr-toolbar-line">
            <div className="cr-search-wrap">
              <input
                className="cr-search-input"
                type="text"
                placeholder="Search by code, title, or keyword"
                value={searchRaw}
                onChange={(event) => setSearchRaw(event.target.value)}
              />
              {searchRaw && (
                <button className="cr-search-clear" onClick={() => setSearchRaw('')}>
                  Clear
                </button>
              )}
            </div>

            <CourseRegistrationFilters
              selectedTerm={selectedTerm}
              setSelectedTerm={setSelectedTerm}
              terms={terms}
              filterPanelOpen={filterPanelOpen}
              setFilterPanelOpen={setFilterPanelOpen}
              activeFilters={activeFilters}
              toggleFilter={toggleFilter}
              faculties={faculties}
              levels={levels}
              subjects={subjects}
              campuses={campuses}
              deliveryModes={deliveryModes}
              dayOptions={DAY_OPTIONS}
            />
          </div>

          {chips.length > 0 && (
            <div className="cr-chips-row cr-chips-row--left">
              {chips.map((chip) => (
                <button key={chip.key} className="cr-chip" onClick={() => removeChip(chip.key)}>
                  {chip.label} ×
                </button>
              ))}
              <button className="cr-chips-clear" onClick={clearAllFilters}>Clear all</button>
            </div>
          )}

          {isLoading && <p className="cr-empty">Loading course catalog...</p>}
          {apiError && <p className="cr-error">{apiError}</p>}

          {!reviewMode && !isLoading && (
            <CourseRegistrationTable
              rows={rows}
              allColumns={columnsWithRender}
              visibleCols={visibleCols}
              toggleCol={toggleCol}
              colPickerOpen={colPickerOpen}
              setColPickerOpen={setColPickerOpen}
              cartSectionKeys={cartSectionKeys}
              addToCart={addToCart}
              removeFromCart={removeFromCart}
              rowFeedback={rowFeedback}
              onRowClick={(course, section) => openCourseCard(course, section)}
            />
          )}

          <div className="cr-cart-card">
            <div className="cr-cart-header">
              <h4>Registration Cart ({cart.length})</h4>
              <span>{cart.reduce((sum, item) => sum + item.course.credits, 0).toFixed(1)} credits</span>
            </div>

            {!reviewMode && cart.length === 0 ? (
              <div>
                <p className="cr-empty">
                  No courses selected yet.
                  {initialCart.length > 0 && (
                    <span> Your currently registered courses are loaded below, and you can unenroll by confirming the cart.</span>
                  )}
                </p>
                {initialCart.length > 0 && (
                  <button
                    className="cr-unenroll-btn"
                    onClick={submitRegistration}
                    type="button"
                  >
                    Unenroll All Current Courses
                  </button>
                )}
              </div>
            ) : (
              cartTerms.map((term) => (
                <div className="cr-cart-term-section" key={term}>
                  <h5 className="cr-cart-term-header">{term}</h5>
                  <table className="cr-simple-table">
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Name</th>
                        <th>Section</th>
                        <th>Credits</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {cartByTerm[term].map(({ course, section, enrollmentId }) => (
                        <tr
                          key={`${course.id}:${section.id}`}
                          onClick={() => openCourseCard(course, section)}
                          style={{ cursor: 'pointer' }}
                        >
                          <td>{course.code}</td>
                          <td>
                            {course.title}
                            {enrollmentId ? (
                              <span className="cr-cart-badge cr-cart-badge--registered">Registered</span>
                            ) : (
                              <span className="cr-cart-badge cr-cart-badge--new">New</span>
                            )}
                          </td>
                          <td>{section.sectionNumber}</td>
                          <td>{course.credits}</td>
                          <td>
                            <button
                              className="cr-remove-btn"
                              aria-label="Remove from cart"
                              onClick={(event) => {
                                event.stopPropagation();
                                removeFromCart(course.id, section.id);
                              }}
                            >
                              -
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))
            )}

            <div className="cr-cart-actions">
              {!reviewMode ? (
                <button
                  className="cr-review-btn"
                  disabled={cart.length === 0 && initialCart.length === 0}
                  onClick={() => setReviewMode(true)}
                >
                  Review & Register
                </button>
              ) : (
                <>
                  <button className="cr-back-btn" onClick={() => setReviewMode(false)}>Back to Search</button>
                  <button
                    className="cr-submit-btn"
                    onClick={submitRegistration}
                    disabled={cart.length === 0 && initialCart.length === 0}
                  >
                    Confirm Registration
                  </button>
                </>
              )}
            </div>
          </div>

          {submissionResults.length > 0 && (
            <div className="cr-cart-card">
              <div className="cr-cart-header">
                <h4>Submission Results</h4>
              </div>
              <table className="cr-simple-table">
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Section</th>
                    <th>Status</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {submissionResults.map((item) => (
                    <tr
                      key={`${item.course.id}-${item.section.id}`}
                      onClick={() => openCourseCard(item.course, item.section)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>{item.course.code}</td>
                      <td>{item.section.sectionNumber}</td>
                      <td>
                        <span className={`cr-result cr-result--${item.status}`}>{item.status}</span>
                      </td>
                      <td>{item.reason || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
          {selectedCourse && (
            <CourseSummaryCard
              course={selectedCourse}
              initialTerm={selectedCourseInitialTerm}
              onAddSection={(section) => addToCart(selectedCourse, section)}
              onClose={() => setSelectedCourse(null)}
            />
        )}
      </main>
    </div>
  );
}
