import { useMemo, useState } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import CourseRegistrationPageHeader from '../../components/CourseRegistrationPage/CourseRegistrationPageHeader';
import CourseRegistrationFilters from '../../components/CourseRegistrationPage/CourseRegistrationFilters';
import { mockCourses } from '../../data/mockCourses';
import { useDebounce } from '../../hooks/useDebounce';
import './CourseRegistrationPage.css';

export default function CourseRegistrationPage() {
  const [searchRaw, setSearchRaw] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState({ faculties: [], levels: [], subjects: [] });
  const search = useDebounce(searchRaw, 300);

  const terms = useMemo(() => [...new Set(mockCourses.flatMap((course) => course.sections.map((section) => section.term)))], []);
  const faculties = useMemo(() => [...new Set(mockCourses.map((course) => course.faculty))], []);
  const levels = useMemo(() => [...new Set(mockCourses.map((course) => course.level))], []);
  const subjects = useMemo(() => [...new Set(mockCourses.map((course) => course.subject))], []);

  const chips = useMemo(() => {
    const next = [];
    if (selectedTerm) next.push({ key: `term:${selectedTerm}`, label: selectedTerm });
    activeFilters.faculties.forEach((value) => next.push({ key: `faculties:${value}`, label: value }));
    activeFilters.levels.forEach((value) => next.push({ key: `levels:${value}`, label: `${value}-level` }));
    activeFilters.subjects.forEach((value) => next.push({ key: `subjects:${value}`, label: value }));
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
    setActiveFilters({ faculties: [], levels: [], subjects: [] });
  }

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    const allRows = mockCourses.flatMap((course) =>
      course.sections.map((section) => ({ course, section })),
    );

    if (!query) return allRows;

    return allRows.filter(({ course, section }) => {
      const haystack = `${course.code} ${course.title} ${(course.keywords || []).join(' ')}`.toLowerCase();
      if (!haystack.includes(query)) return false;
      if (selectedTerm && section.term !== selectedTerm) return false;
      if (activeFilters.faculties.length > 0 && !activeFilters.faculties.includes(course.faculty)) return false;
      if (activeFilters.levels.length > 0 && !activeFilters.levels.includes(course.level)) return false;
      if (activeFilters.subjects.length > 0 && !activeFilters.subjects.includes(course.subject)) return false;
      return true;
    });
  }, [activeFilters, search, selectedTerm]);

  return (
    <div className="cr-layout">
      <Sidebar />
      <main className="cr-main">
        <CourseRegistrationPageHeader />

        <section className="cr-card">
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
            clearAllFilters={clearAllFilters}
            chips={chips}
            removeChip={removeChip}
            faculties={faculties}
            levels={levels}
            subjects={subjects}
          />

          {rows.length === 0 ? (
            <p className="cr-empty">No courses match your search.</p>
          ) : (
            <table className="cr-simple-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Section</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ course, section }) => (
                  <tr key={section.id}>
                    <td>{course.code}</td>
                    <td>{course.title}</td>
                    <td>{section.sectionNumber}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </div>
  );
}
