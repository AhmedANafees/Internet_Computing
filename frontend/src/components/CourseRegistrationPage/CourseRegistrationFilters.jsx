export default function CourseRegistrationFilters({
  selectedTerm,
  setSelectedTerm,
  terms,
  filterPanelOpen,
  setFilterPanelOpen,
  activeFilters,
  toggleFilter,
  faculties,
  levels,
  subjects,
  campuses,
  deliveryModes,
  dayOptions,
}) {
  return (
    <div className="cr-filters">
      <div className="cr-filter-top-row">
        <select className="cr-term-select" value={selectedTerm} onChange={(event) => setSelectedTerm(event.target.value)}>
          <option value="">All Terms</option>
          {terms.map((term) => (
            <option key={term} value={term}>
              {term}
            </option>
          ))}
        </select>

        <div className="cr-filter-wrap">
          <button className={`cr-filter-btn ${filterPanelOpen ? 'cr-filter-btn--open' : ''}`} onClick={() => setFilterPanelOpen((value) => !value)}>
            Filters
          </button>

          {filterPanelOpen && (
            <div className="cr-filter-panel">
              <div className="cr-filter-group">
                <h4>Faculty</h4>
                {faculties.map((faculty) => (
                  <label key={faculty} className="cr-filter-option">
                    <input
                      type="checkbox"
                      checked={activeFilters.faculties.includes(faculty)}
                      onChange={() => toggleFilter('faculties', faculty)}
                    />
                    {faculty}
                  </label>
                ))}
              </div>

              <div className="cr-filter-group">
                <h4>Level</h4>
                {levels.map((level) => (
                  <label key={level} className="cr-filter-option">
                    <input
                      type="checkbox"
                      checked={activeFilters.levels.includes(level)}
                      onChange={() => toggleFilter('levels', level)}
                    />
                    {level}-level
                  </label>
                ))}
              </div>

              <div className="cr-filter-group">
                <h4>Subject</h4>
                {subjects.map((subject) => (
                  <label key={subject} className="cr-filter-option">
                    <input
                      type="checkbox"
                      checked={activeFilters.subjects.includes(subject)}
                      onChange={() => toggleFilter('subjects', subject)}
                    />
                    {subject}
                  </label>
                ))}
              </div>

              <div className="cr-filter-group">
                <h4>Campus</h4>
                {campuses.map((campus) => (
                  <label key={campus} className="cr-filter-option">
                    <input
                      type="checkbox"
                      checked={activeFilters.campuses.includes(campus)}
                      onChange={() => toggleFilter('campuses', campus)}
                    />
                    {campus}
                  </label>
                ))}
              </div>

              <div className="cr-filter-group">
                <h4>Days</h4>
                <div className="cr-filter-days">
                  {dayOptions.map((day) => (
                    <button
                      key={day.value}
                      type="button"
                      className={`cr-filter-day-btn ${activeFilters.days.includes(day.value) ? 'cr-filter-day-btn--active' : ''}`}
                      onClick={() => toggleFilter('days', day.value)}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="cr-filter-group">
                <h4>Delivery</h4>
                {deliveryModes.map((mode) => (
                  <label key={mode} className="cr-filter-option">
                    <input
                      type="checkbox"
                      checked={activeFilters.deliveryModes.includes(mode)}
                      onChange={() => toggleFilter('deliveryModes', mode)}
                    />
                    {mode}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
