export default function CourseRegistrationFilters({
  selectedTerm,
  setSelectedTerm,
  terms,
  filterPanelOpen,
  setFilterPanelOpen,
  activeFilters,
  toggleFilter,
  clearAllFilters,
  chips,
  removeChip,
  faculties,
  levels,
  subjects,
}) {
  return (
    <div>
      <div className="cr-filter-top-row">
        <select className="cr-term-select" value={selectedTerm} onChange={(event) => setSelectedTerm(event.target.value)}>
        <option value="">All Terms</option>
        {terms.map((term) => (
          <option key={term} value={term}>
            {term}
          </option>
        ))}
        </select>

        <button className={`cr-filter-btn ${filterPanelOpen ? 'cr-filter-btn--open' : ''}`} onClick={() => setFilterPanelOpen((value) => !value)}>
          Filters
        </button>
      </div>

      {chips.length > 0 && (
        <div className="cr-chips-row">
          {chips.map((chip) => (
            <button key={chip.key} className="cr-chip" onClick={() => removeChip(chip.key)}>
              {chip.label} ×
            </button>
          ))}
          <button className="cr-chips-clear" onClick={clearAllFilters}>Clear all</button>
        </div>
      )}

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
        </div>
      )}
    </div>
  );
}
