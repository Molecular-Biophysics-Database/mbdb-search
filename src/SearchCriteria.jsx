import React from 'react';

function SearchCriteria({ criteria, onChange, onRemove }) {
  return (
    <div className="search-criteria">
      <select value={criteria.field} onChange={e => onChange(e, 'field')}>
        {/* Options for fields */}
      </select>
      <select value={criteria.expression} onChange={e => onChange(e, 'expression')}>
        <option value="AND">AND</option>
        <option value="OR">OR</option>
        <option value="NOT">NOT</option>
      </select>
      <input
        type="text"
        value={criteria.value}
        onChange={e => onChange(e, 'value')}
      />
      <button onClick={onRemove}>Remove</button>
    </div>
  );
}

export default SearchCriteria;
