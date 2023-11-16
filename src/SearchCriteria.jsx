import React, { useState } from 'react';

function SearchCriteria({ criteria, fieldsData, onChange, onRemove, showRemoveButton }) {
    // State for validation error
    const [validationError, setValidationError] = useState('');
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
    const handleValueChange = (e) => {
        const value = e.target.value;
        const fieldDetails = fieldsData.find(field => field.field_path === criteria.field) || {};

        // Reset validation error
        setValidationError('');

        // Validate for double type
        if (fieldDetails.type === 'double') {
            if ((fieldDetails.minimum && value < fieldDetails.minimum) ||
                (fieldDetails.maximum && value > fieldDetails.maximum)) {
                setValidationError(`Value must be between ${fieldDetails.minimum} and ${fieldDetails.maximum}`);
                return;
            }
        }
        if (validationError) {
            // Call onChange with validation error
            onChange(e, 'value', validationError);
        } else {
            // Call onChange without validation error
            onChange(e, 'value', '');
        }

        // Call the original onChange handler
        onChange(e, 'value');
    };
    const fieldDetails = fieldsData.find(field => field.field_path === criteria.field) || {};

    const [filterText, setFilterText] = useState('');
    const [showFilterInput, setShowFilterInput] = useState(false);

    // Function to handle filter text changes
    const handleFilterChange = (e) => {
        setFilterText(e.target.value);
    };

    // Function to toggle the filter input visibility
    const toggleFilterInput = () => {
        setShowFilterInput(!showFilterInput);
    };

    // Filter fieldsData based on the filter text
    const filteredFields = fieldsData.filter(field =>
        field.pretty_name.toLowerCase().includes(filterText.toLowerCase())
    );


    return (
        <div className="search-criteria">
            {/*Expresion part on the input*/}
            {showRemoveButton && (
                <select value={criteria.expression} onChange={e => onChange(e, 'expression')}>
                    <option value="" disabled>Exp</option>
                    <option value="AND">AND</option>
                    <option value="OR">OR</option>
                    <option value="NOT">NOT</option>
                </select>
            )}

            {/*Field part of the input*/}
            <button onClick={toggleFilterInput} aria-label="Toggle filter input">
                🔎
            </button>

            {/* Conditional rendering of the input field based on showFilterInput */}
            {showFilterInput && (
                <input
                    type="text"
                    value={filterText}
                    onChange={handleFilterChange}
                    placeholder="Type to filter..."
                    autoFocus
                />
            )}

            {/* Dropdown list showing filtered options */}
            <select value={criteria.field} onChange={e => onChange(e, 'field')}>
                <option value="" disabled>Select Field</option>
                {filteredFields.map((field, index) => (
                    <option key={index} value={field.field_path}>{field.pretty_name}</option>
                ))}
            </select>

            {/*Value part of the input*/}
            <input
                type={getInputType(fieldDetails.type)}
                value={criteria.value}
                placeholder="Value"
                min={fieldDetails.minimum}
                max={fieldDetails.maximum}
                onChange={handleValueChange}
            />
            {validationError && <div className="validation-error">{validationError}</div>}
            {showRemoveButton && (
                <button onClick={onRemove}>Remove</button>
            )}
        </div>

    );
}

export default SearchCriteria;
