import React from 'react';

function SearchCriteria({ criteria, fieldsData, onChange, onRemove, showRemoveButton }) {
    // Helper function to determine the input type
    const getInputType = (fieldType) => {
        switch (fieldType) {
            case 'string':
                return 'text';
            case 'double':
                return 'number';
            case 'date':
                return 'date';
            default:
                return 'text';
        }
    };
    const fieldDetails = fieldsData.find(field => field.field_path === criteria.field) || {};

    return (
        <div className="search-criteria">
            {showRemoveButton && (
                <select value={criteria.expression} onChange={e => onChange(e, 'expression')}>
                    <option value="" disabled>Exp</option>
                    <option value="AND">AND</option>
                    <option value="OR">OR</option>
                    <option value="NOT">NOT</option>
                </select>
            )}
            <select value={criteria.field} onChange={e => onChange(e, 'field')}>
                <option value="" disabled>Field</option>
                {fieldsData.map((field, index) => (
                    <option key={index} value={field.field_path}>{field.pretty_name}</option>
                ))}
            </select>
            <input
                type={getInputType(fieldDetails.type)}
                value={criteria.value}
                placeholder="Value"
                min={fieldDetails.minimum}
                max={fieldDetails.maximum} 
                onChange={e => onChange(e, 'value')}
            />
            {showRemoveButton && (
                <button onClick={onRemove}>Remove</button>
            )}
        </div>

    );
}

export default SearchCriteria;
