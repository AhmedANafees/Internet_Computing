import { useEffect, useMemo, useState } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import CourseRegistrationPageHeader from '../../components/CourseRegistrationPage/CourseRegistrationPageHeader';
import CourseRegistrationFilters from '../../components/CourseRegistrationPage/CourseRegistrationFilters';
import CourseRegistrationTable from '../../components/CourseRegistrationPage/CourseRegistrationTable';
import { useDebounce } from '../../hooks/useDebounce';
import { fetchCourseCatalog, submitPlanRegistration } from '../../services/courseService';
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
  const [rowFeedback, setRowFeedback] = useState({});
  const [reviewMode, setReviewMode] = useState(false);
  const [submissionResults, setSubmissionResults] = useState([]);
  const [courses, setCourses] = useState([]);
  const [apiTerms, setApiTerms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const search = useDebounce(searchRaw, 300);
  const [selectedCourse, setSelectedCourse] = useState(null);

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

  function removeFromCart(courseId, sectionId) {
    setCart((prev) => prev.filter((item) => !(item.course.id === courseId && item.section.id === sectionId)));
  }

  async function submitRegistration() {
    try {
      setApiError('');
      const resultItems = await submitPlanRegistration(cart);
      const resultMap = new Map(resultItems.map((item) => [String(item.crn), item.result]));

      const results = cart.map((item) => ({
        ...item,
        status: resultMap.get(String(item.section.id)) ?? 'failed',
      }));

      setSubmissionResults(results);
      setReviewMode(false);
      setCart([]);

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
              onRowClick={(course) => setSelectedCourse(course)}
            />
          )}

          <div className="cr-cart-card">
            <div className="cr-cart-header">
              <h4>Registration Cart ({cart.length})</h4>
              <span>{cart.reduce((sum, item) => sum + item.course.credits, 0).toFixed(1)} credits</span>
            </div>

            {!reviewMode && cart.length === 0 ? (
              <p className="cr-empty">No courses selected yet.</p>
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
                      {cartByTerm[term].map(({ course, section }) => (
                        <tr key={`${course.id}:${section.id}`}>
                          <td>{course.code}</td>
                          <td>{course.title}</td>
                          <td>{section.sectionNumber}</td>
                          <td>{course.credits}</td>
                          <td>
                            <button className="cr-remove-btn" aria-label="Remove from cart" onClick={() => removeFromCart(course.id, section.id)}>-</button>
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
                <button className="cr-review-btn" disabled={cart.length === 0} onClick={() => setReviewMode(true)}>
                  Review & Register
                </button>
              ) : (
                <>
                  <button className="cr-back-btn" onClick={() => setReviewMode(false)}>Back to Search</button>
                  <button className="cr-submit-btn" onClick={submitRegistration} disabled={cart.length === 0}>Confirm Registration</button>
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
                  </tr>
                </thead>
                <tbody>
                  {submissionResults.map((item) => (
                    <tr key={`${item.course.id}-${item.section.id}`}>
                      <td>{item.course.code}</td>
                      <td>{item.section.sectionNumber}</td>
                      <td>
                        <span className={`cr-result cr-result--${item.status}`}>{item.status}</span>
                      </td>
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
              onClose={() => setSelectedCourse(null)}
            />
        )}
      </main>
    </div>
  );
}
