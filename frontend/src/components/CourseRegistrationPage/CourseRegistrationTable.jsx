export default function CourseRegistrationTable({
  rows,
  allColumns,
  visibleCols,
  toggleCol,
  colPickerOpen,
  setColPickerOpen,
  cartSectionKeys,
  addToCart,
  removeFromCart,
  rowFeedback,
  onRowClick,
}) {
  const visibleColumns = allColumns.filter((column) => visibleCols.has(column.id));

  return (
    <div className="cr-table-card">
      <div className="cr-table-header">
        <span className="cr-table-header__title">Course List ({rows.length} results)</span>

        <div className="cr-col-picker-wrap">
          <button className={`cr-col-picker-btn ${colPickerOpen ? 'cr-col-picker-btn--open' : ''}`} onClick={() => setColPickerOpen((value) => !value)}>
            Columns
          </button>

          {colPickerOpen && (
            <div className="cr-col-picker-panel">
              {allColumns.map((column) => (
                <label key={column.id} className="cr-col-option">
                  <input
                    type="checkbox"
                    checked={visibleCols.has(column.id)}
                    disabled={visibleCols.size === 1 && visibleCols.has(column.id)}
                    onChange={() => toggleCol(column.id)}
                  />
                  {column.label}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="cr-table-scroll">
        <table className="cr-table">
          <thead>
            <tr>
              {visibleColumns.map((column) => (
                <th key={column.id}>{column.label}</th>
              ))}
              <th>Add</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length + 1} className="cr-table__empty">
                  No courses match your search or filters.
                </td>
              </tr>
            ) : (
              rows.map(({ course, section }) => {
                const sectionKey = `${course.id}:${section.id}`;
                const inCart = cartSectionKeys.has(sectionKey);
                const feedback = rowFeedback[sectionKey];

                return (
                  <tr 
                    key={sectionKey}
                    onClick={() => onRowClick && onRowClick(course)}
                    style={{ cursor: 'pointer' }}>
                    {visibleColumns.map((column) => (
                      <td key={column.id}>{column.render(course, section)}</td>
                    ))}
                    <td>
                      <button
                        className={`cr-add-btn ${inCart ? 'cr-add-btn--added' : ''} ${feedback === 'duplicate' ? 'cr-add-btn--warn' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (inCart) {
                            removeFromCart(course.id, section.id);
                            return;
                          }
                          addToCart(course, section);
                        }}
                      >
                        {feedback === 'duplicate' ? '!' : inCart ? '✓' : '+'}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
