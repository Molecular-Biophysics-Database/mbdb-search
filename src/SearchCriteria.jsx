import React from 'react';

function SearchCriteria({ criteria, onChange, onRemove, showRemoveButton }) {
  return (
    <div className="search-criteria">
        {showRemoveButton && (
        <select value={criteria.expression} onChange={e => onChange(e, 'expression')}>
            <option value=""></option>
            <option value="AND">AND</option>
            <option value="OR">OR</option>
            <option value="NOT">NOT</option>
          </select>
            )}
      <select value={criteria.field} onChange={e => onChange(e, 'field')}>
          <option value=""></option>
          <option value="Protein">Protein</option>
          <option value="Molecule">Molecule</option>
          <option value="Protein">Weight</option>
          <option value="Molecule">Height</option>
          {/* Options for fields */}
        </select>
      <input
        type="text"
        value={criteria.value}
        onChange={e => onChange(e, 'value')}
      />
      {showRemoveButton && (
        <button onClick={onRemove}>Remove</button>
      )}
    </div>
  );
}

export default SearchCriteria;
