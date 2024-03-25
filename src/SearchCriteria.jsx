import React, {useEffect,useState} from 'react';

function SearchCriteria({criteria, fieldsData, onChange, onRemove, showRemoveButton}) {
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


    // RESET AFTER CHANGE OF SELECTOR
    // Function to reset and hide range input
    const resetAndHideRangeInput = () => {
        setRangeValue('');
        setShowRangeInput(false);
        setRangeValidationError('');
    };

    // Extended onChange handler for the field selector
    const handleFieldSelectorChange = (e) => {
        // Call the existing onChange provided by the parent
        onChange(e, 'field');

        // Additional logic to reset the main value and range value
        resetAndHideRangeInput();

        // Reset the main value
        onChange({target: {value: ''}}, 'value');
    };


    // RANGE
    // State to manage the second value for range inputs
    const [rangeValue, setRangeValue] = useState(criteria.rangeValue || '');
    const [showRangeInput, setShowRangeInput] = useState(false);

    useEffect(() => {
        if (criteria.rangeValue) {
            setShowRangeInput(true); // Automatically display range input if rangeValue exists
            setRangeValue(criteria.rangeValue); // Set the initial range value
        }
    }, [criteria.rangeValue]);

    // Function to toggle the range input visibility
    const toggleRangeInput = () => {
        setShowRangeInput(!showRangeInput);
        // Call the onChange provided by the parent to update the state there too
        onChange({ target: { value: !showRangeInput } }, 'showRangeInput');
    };


    const updateValues = (newValue, newRangeValue) => {
        // Update local component state
        setValidationError('');
        setRangeValidationError('');
        setRangeValue(newRangeValue.toString());

        // Update parent component state for criteria.value
        onChange({target: {value: newValue.toString()}}, 'value');

        // If needed, update the parent component state for rangeValue as well
        onChange({target: {value: newRangeValue.toString()}}, 'rangeValue');
    };

    const swapValuesIfNeeded = (fieldType, fromValue, toValue) => {
        // Check if 'from' value is greater than 'to' value and swap if necessary
        if (fieldType === 'double') {
            const fromNumber = parseFloat(fromValue);
            const toNumber = parseFloat(toValue);
            if (fromNumber > toNumber) {
                // Swap the values for double
                updateValues(toValue.toString(), fromValue.toString());
            }
        } else if (fieldType === 'date') {
            const fromDate = new Date(fromValue);
            const toDate = new Date(toValue);
            if (fromDate > toDate) {
                // Swap the values for date
                updateValues(toValue, fromValue);
            }
        }
    };

    // Trigger the swap logic only on blur instead of on change
    const handleValueBlur = () => {
        const fieldDetails = fieldsData.find(field => field.field_path === criteria.field) || {};
        swapValuesIfNeeded(fieldDetails.type, criteria.value, rangeValue);
    };

    const handleRangeValueBlur = () => {
        const fieldDetails = fieldsData.find(field => field.field_path === criteria.field) || {};
        swapValuesIfNeeded(fieldDetails.type, criteria.value, rangeValue);
    };


    // TODO: functions handleRangeValueChange and handleValueChange could be converted into one function
    // Function to handle changes to the range value
    const handleRangeValueChange = (e) => {
        let value = e.target.value; // Convert the value to a float for comparison
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
        setRangeValue(value); // Convert back to string for the input field
        onChange({target: {value: value}}, 'rangeValue'); // Update parent component

        // Set the validation error message if there is an error
        setRangeValidationError(error);
    };


    // VALUE VALIDATION AND ERROR
    const handleValueChange = (e) => {
        let value = e.target.value; // Convert the value to a float for comparison
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
        criteria.value = value;
        setValidationError(error); // Update validation error if any
        onChange({target: {value: value}}, 'value'); // Update parent component
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
        onChange({target: {value: newLeftBracketState}}, 'leftBracket');
    };

    // Function to toggle right bracket
    const toggleRightBracket = () => {
        const newRightBracketState = !rightBracketActive;
        setRightBracketActive(newRightBracketState);
        // Call onChange with an object that mimics the event structure
        onChange({target: {value: newRightBracketState}}, 'rightBracket');
    };

    return (
        <div className="search-criteria">
            {/*Expression part on the input*/}
            {showRemoveButton && (
                <select name="operationSelector" value={criteria.expression} onChange={e => onChange(e, 'expression')}>
                    <option name="empty" value="" disabled>Exp</option>
                    <option name="and" value="AND">AND</option>
                    <option name="or" value="OR">OR</option>
                    <option name="not" value="NOT">NOT</option>
                </select>
            )}
            {/*Left bracket button*/}
            <button
              name="leftBracket"
              onClick={toggleLeftBracket}
              className={criteria.leftBracket ? 'active' : 'deactive'}
            >
              (
            </button>

            {/*Field part of the input*/}
            <button name="toggleFilter" onClick={toggleFilterInput} aria-label="Toggle filter input">
                🔎
            </button>

            {/* Conditional rendering of the input field based on showFilterInput */}
            {showFilterInput && (
                <input name="selectorFilter"
                    type="text"
                    value={filterText}
                    onChange={handleFilterChange}
                    placeholder="Type to filter..."
                    autoFocus
                />
            )}

            {/* Dropdown list showing filtered options */}
            <select name="fieldSelector" value={criteria.field} onChange={handleFieldSelectorChange}>
                <option name="fieldOption" value="" disabled>Select Field</option>
                {filteredFields.map((field, index) => (
                    <option name="fieldOption" key={index} value={field.field_path}>{field.pretty_name}</option>
                ))}
            </select>

            {/*Value part of the input*/}
            <input name="inputValue"
                type={getInputType(fieldDetails.type)}
                value={criteria.value} // This should be the state value that is updated on change
                placeholder="Value"
                min={fieldDetails.minimum}
                max={fieldDetails.maximum}
                onChange={handleValueChange}
                onBlur={handleValueBlur}
            />
            {/* Display validation error if any */}
            {validationError && <div className="validation-error">{validationError}</div>}

            {/* Add button to enable range input for number and date fields */}
            {['double', 'date'].includes(fieldDetails.type) && !showRangeInput && (
                <button name="toggleRangeInput" onClick={toggleRangeInput}>+</button>
            )}

            {/* Show the second value input if showRangeInput is true */}
            {showRangeInput && (
                <>
                    <input name="rangeInputValue"
                        type={getInputType(fieldDetails.type)}
                        value={rangeValue}
                        placeholder="To Value"
                        min={fieldDetails.minimum}
                        max={fieldDetails.maximum}
                        onChange={handleRangeValueChange}
                        onBlur={handleRangeValueBlur}
                    />
                    {rangeValidationError && <div className="validation-error">{rangeValidationError}</div>}
                </>
            )}
            {/*Right bracket button*/}
            <button
              name="rightBracket"
              onClick={toggleRightBracket}
              className={criteria.rightBracket ? 'active' : 'deactive'}
            >
              )
            </button>
            {/*Field that shows that validation error message*/}
            {/*{validationError && <div className="validation-error">{validationError}</div>}*/}
            {showRemoveButton && (
                <button name="removeLine" onClick={onRemove}>Remove</button>
            )}
        </div>

    );
}

export default SearchCriteria;
