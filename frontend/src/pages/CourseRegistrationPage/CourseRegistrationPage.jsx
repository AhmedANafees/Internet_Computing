import { useMemo, useState } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import CourseRegistrationPageHeader from '../../components/CourseRegistrationPage/CourseRegistrationPageHeader';
import { mockCourses } from '../../data/mockCourses';
import { useDebounce } from '../../hooks/useDebounce';
import './CourseRegistrationPage.css';

export default function CourseRegistrationPage() {
  const [searchRaw, setSearchRaw] = useState('');
  const search = useDebounce(searchRaw, 300);

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    const allRows = mockCourses.flatMap((course) =>
      course.sections.map((section) => ({ course, section })),
    );

    if (!query) return allRows;

    return allRows.filter(({ course }) => {
      const haystack = `${course.code} ${course.title} ${(course.keywords || []).join(' ')}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [search]);

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
