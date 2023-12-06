import React, { useState } from 'react';

function SearchCriteria({ criteria, fieldsData, onChange, onRemove, showRemoveButton }) {
    // State for validation error
    const [validationError, setValidationError] = useState('');
    const [rangeValidationError, setRangeValidationError] = useState('');
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
    // RANGE
    // State to manage the second value for range inputs
    const [rangeValue, setRangeValue] = useState('');
    const [showRangeInput, setShowRangeInput] = useState(false);

    // Function to toggle the range input visibility
    const toggleRangeInput = () => {
        setShowRangeInput(!showRangeInput);
    };

    // Function to handle changes to the range value
    const handleRangeValueChange = (e) => {
        let value = parseFloat(e.target.value); // Convert the value to a float for comparison
        const fieldDetails = fieldsData.find(field => field.field_path === criteria.field) || {};

        // Assume no error initially
        let error = '';

        // Validate for double type
        if (fieldDetails.type === 'double') {
            if (value < fieldDetails.minimum) {
                value = fieldDetails.minimum; // Set to minimum if below range
                error = `Value must be at least ${fieldDetails.minimum}`;
            } else if (value > fieldDetails.maximum) {
                value = fieldDetails.maximum; // Set to maximum if above range
                error = `Value must be no more than ${fieldDetails.maximum}`;
            }
        }

        // Update local state and parent state immediately with the corrected value
        setRangeValue(value.toString()); // Convert back to string for the input field
        onChange({ target: { value: value.toString() } }, 'rangeValue'); // Update parent component

        // Set the validation error message if there is an error
        setRangeValidationError(error);
    };


    // VALUE VALIDATION AND ERROR
    const handleValueChange = (e) => {
        let value = parseFloat(e.target.value); // Convert the value to a float for comparison
        const fieldDetails = fieldsData.find(field => field.field_path === criteria.field) || {};

        // Assume no error initially
        let error = '';

        // Validate for double type
        if (fieldDetails.type === 'double') {
            if (value < fieldDetails.minimum) {
                value = fieldDetails.minimum;
                error = `Value must be at least ${fieldDetails.minimum}`;
            } else if (value > fieldDetails.maximum) {
                value = fieldDetails.maximum;
                error = `Value must be no more than ${fieldDetails.maximum}`;
            }
        }

        // Update local state and parent state immediately with the corrected value
        setValidationError(error); // Update validation error if any
        onChange({ target: { value: value.toString() } }, 'value'); // Update parent component
    };
    const fieldDetails = fieldsData.find(field => field.field_path === criteria.field) || {};

    // FILTER SELECTOR FIELD
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

    // BRACKETS
    // States for bracket toggling
    const [leftBracketActive, setLeftBracketActive] = useState(false);
    const [rightBracketActive, setRightBracketActive] = useState(false);

    // Function to toggle left bracket
    const toggleLeftBracket = () => {
        const newLeftBracketState = !leftBracketActive;
        setLeftBracketActive(newLeftBracketState);
        // Call onChange with an object that mimics the event structure
        onChange({ target: { value: newLeftBracketState } }, 'leftBracket');
    };

    // Function to toggle right bracket
    const toggleRightBracket = () => {
        const newRightBracketState = !rightBracketActive;
        setRightBracketActive(newRightBracketState);
        // Call onChange with an object that mimics the event structure
        onChange({ target: { value: newRightBracketState } }, 'rightBracket');
    };

    return (
        <div className="search-criteria">
            {/*Expression part on the input*/}
            {showRemoveButton && (
                <select value={criteria.expression} onChange={e => onChange(e, 'expression')}>
                    <option value="" disabled>Exp</option>
                    <option value="AND">AND</option>
                    <option value="OR">OR</option>
                    <option value="NOT">NOT</option>
                </select>
            )}
            {/*Left bracket button*/}
            <button onClick={toggleLeftBracket} className={leftBracketActive ? 'active' : 'deactive'}>
                (
            </button>

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
                value={criteria.value} // This should be the state value that is updated on change
                placeholder="Value"
                min={fieldDetails.minimum}
                max={fieldDetails.maximum}
                onChange={handleValueChange}
            />
            {/* Display validation error if any */}
            {validationError && <div className="validation-error">{validationError}</div>}

            {/* Add button to enable range input for number and date fields */}
            {['double', 'date'].includes(fieldDetails.type) && !showRangeInput && (
                <button onClick={toggleRangeInput}>+</button>
            )}

            {/* Show the second value input if showRangeInput is true */}
            {showRangeInput && (
                <>
                    <input
                        type={getInputType(fieldDetails.type)}
                        value={rangeValue}
                        placeholder="To Value"
                        min={fieldDetails.minimum}
                        max={fieldDetails.maximum}
                        onChange={handleRangeValueChange}
                    />
                    {rangeValidationError && <div className="validation-error">{rangeValidationError}</div>}
                </>
            )}
            {/*Right bracket button*/}
            <button onClick={toggleRightBracket} className={rightBracketActive ? 'active' : 'deactive'}>
                )
            </button>
            {/*Field that shows that validation error message*/}
            {/*{validationError && <div className="validation-error">{validationError}</div>}*/}
            {showRemoveButton && (
                <button onClick={onRemove}>Remove</button>
            )}
        </div>

    );
}

export default SearchCriteria;
