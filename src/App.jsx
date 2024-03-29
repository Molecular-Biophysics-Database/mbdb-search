import './App.css'
import SearchCriteria from './SearchCriteria';
import {useState, useEffect} from 'react';
import jsonData from '/src/output.json';

function App() {
    const DEBUG = true;
    // Start with one search criteria
    const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
    // Update initial state to include validationError
    const [searchCriteria, setSearchCriteria] = useState([
        {
            field: '',
            expression: '',
            value: '',
            validationError: '',
            rangeValue: '',
            showRangeInput: false
        }
    ]);

    // Update handleCriteriaChange to handle validation errors
    const handleCriteriaChange = (index, field, value, validationError = '') => {
        const newCriteria = [...searchCriteria];
        // If the field or expression is changing, reset range input
        if (field === 'field' || field === 'expression') {
            newCriteria[index].showRangeInput = false;
            newCriteria[index].rangeValue = '';
        }
        if (field === 'showRangeInput') {
            newCriteria[index].showRangeInput = value; // Assuming value is a boolean here
        }
        if (field === 'rangeValue') {
            // Update the range value directly
            newCriteria[index][field] = value;
        } else if (typeof value === 'object' && value.target) {
            // Handle changes from event targets
            newCriteria[index][field] = value.target.value;
            newCriteria[index].validationError = validationError;
        } else {
            // Handle direct value changes (for non-event values like rangeValue)
            newCriteria[index][field] = value;
        }
        setSearchCriteria(newCriteria);
    };

    // Function to check if there are validation errors or required fields are empty
    const hasValidationErrors = () => {
        return searchCriteria.some((criteria, index) => {
            // Skip the operator check on the first criteria
            const isOperatorEmpty = index !== 0 && criteria.expression === '';
            const isFieldSelectorEmpty = criteria.field === '';
            const isValueEmpty = criteria.value === '';
            const isRangeInputEnabledAndEmpty = criteria.showRangeInput && criteria.rangeValue === '';

            return isOperatorEmpty || isFieldSelectorEmpty || isValueEmpty || isRangeInputEnabledAndEmpty;
        });
    };

    // Function to generate an error message (if any)
    const getValidationErrorMessage = () => {
        if (hasValidationErrors()) {
            return 'Please fill in all required fields before searching.';
        }
        return '';
    };
    // Function to validate brackets
    const validateBrackets = () => {
        let leftBracketCount = 0;
        let rightBracketCount = 0;

        searchCriteria.forEach(criteria => {
            if (criteria.leftBracket) {
                leftBracketCount++;
            }
            if (criteria.rightBracket) {
                rightBracketCount++;
            }
        });

        if (leftBracketCount !== rightBracketCount) {
            return `Number of left and right brackets must be equal. Currently, there are ${leftBracketCount} left brackets and ${rightBracketCount} right brackets.`;
        }

        return '';
    };

    const handleSearchClick = () => {
        if (DEBUG) console.log('Has Validation Errors:', hasValidationErrors());
        const bracketError = validateBrackets();
        if (bracketError) {
            alert(bracketError);
            return; // Stop the search if there's a bracket error
        }
        if (hasValidationErrors()) {
            const error = getValidationErrorMessage();
            if (error) {
                alert(error);
            }
        } else {
            handleSearch();
        }
    };
    const handleCopyClick = () => {
        if (DEBUG) console.log('Has Validation Errors:', hasValidationErrors());
        const bracketError = validateBrackets();
        if (bracketError) {
            alert(bracketError);
            return; // Stop the search if there's a bracket error
        }
        if (hasValidationErrors()) {
            const error = getValidationErrorMessage();
            if (error) {
                alert(error);
            }
        } else {
            handleCopyJson();
        }
    };


    // Initialize your search criteria with brackets
    const addSearchCriteria = () => {
        setSearchCriteria([...searchCriteria, {
            field: '',
            expression: '',
            value: '',
            validationError: '',
            leftBracket: false,
            rightBracket: false
        }]);
    };

    const removeSearchCriteria = index => {
        const newCriteria = [...searchCriteria];
        newCriteria.splice(index, 1);
        setSearchCriteria(newCriteria);
    };
    const handleSearch = () => {
        // Assemble the search query
        let queryString = '';
        for (let i = 0; i < searchCriteria.length; i++) {
            const sc = searchCriteria[i];
            const fieldDetails = fieldsData.find(field => field.field_path === sc.field) || {};

            // Include EXP if not first line
            if (i !== 0) {
                queryString += encodeURIComponent(sc.expression) + '%20';
            }
            // Left bracket
            if (sc.leftBracket) {
                queryString += "(";
            }

            // Format the value based on the field type
            let formattedValue = sc.value;
            if (sc.rangeValue) {
                // Format as a range if rangeValue is present
                formattedValue = `[${encodeURIComponent(sc.value)} TO ${encodeURIComponent(sc.rangeValue)}]`;
            } else if (fieldDetails.type === 'string') {
                // Put quotes around string values
                formattedValue = `"${encodeURIComponent(sc.value)}"`;
            }

            queryString += `${encodeURIComponent(sc.field)}%3A${formattedValue}`;
            // Right bracket
            if (sc.rightBracket) {
                queryString += ")";
            }
            if (i < searchCriteria.length - 1) {
                queryString += '%20';
            }
        }

        // const url = `https://localhost:3000/search?q=${queryString}`; // testing to see the query string in url
        const url = `https://mbdb.test.du.cesnet.cz/mst/?q=${queryString}`; // mbdb API endpoint
        window.open(url, '_blank');
    };
    const [fieldsData, setFieldsData] = useState([]);

    useEffect(() => {
        // Parse the JSON data and set it in state
        setFieldsData(jsonData);
    }, []);

    const handleCopyJson = () => {
        // Parse the JSON data and set it in state Change button color to green
        document.getElementById("myButton").style.backgroundColor = "green";

        let jsonOutput = [];

        searchCriteria.forEach((criteria, index) => {
            // Check for the presence of an operator and add it if it's explicitly provided and it's not the first criterion
            if (criteria.expression && index !== 0) {
                jsonOutput.push({"operator": criteria.expression.toLowerCase()});
            }

            // Add the start bracket object if it's active
            if (criteria.leftBracket) {
                jsonOutput.push({"bracket": "start"});
            }

            /*
            // Find the name associated with the field
            let fieldData = fieldsData.find(field => field.field_path === criteria.field) || {};
            let fieldName = fieldData.pretty_name || "Unknown Field";
            */

            // Construct the criterion object
            let criterion = {
                field: criteria.field,
                value: criteria.rangeValue ? {from: criteria.value, to: criteria.rangeValue} : criteria.value,
                // type: fieldData.type || 'string', // DATA_TYPE
                // name: fieldName
            };

            // Add the criterion object to the output
            jsonOutput.push(criterion);

            // Add the end bracket object if it's active
            if (criteria.rightBracket) {
                jsonOutput.push({"bracket": "end"});
            }
        });

        // Output the final JSON structure
        console.log(JSON.stringify(jsonOutput, null, 2));

        // Copy the JSON to the clipboard
        const jsonString = JSON.stringify(jsonOutput, null, 2);
        navigator.clipboard.writeText(jsonString).then(() => {
            if (DEBUG) console.log('JSON copied to clipboard');

            // Ask the user for the file name
            const fileName = prompt("Enter a file name for the JSON:", "downloaded.json");
            if (fileName) { // Proceed if the user entered a name
                // Now save the JSON to a file
                const blob = new Blob([jsonString], {type: 'application/json'});
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName; // Use the user-provided file name
                document.body.appendChild(a); // Append the anchor to the body to make it clickable
                a.click(); // Simulate a click on the anchor to trigger the download
                document.body.removeChild(a); // Remove the anchor from the body
                URL.revokeObjectURL(url); // Clean up by revoking the blob URL
            }

            // Change button color back to original color after 1,5 seconds
            setTimeout(() => {
                document.getElementById("myButton").style.backgroundColor = "#646cff";
            }, 1500);
        }).catch(err => {
            if (DEBUG) console.error('Failed to copy JSON to clipboard', err);
            alert('Failed to copy JSON to clipboard. Error: ' + err);
            document.getElementById("myButton").style.backgroundColor = "#646cff";
        });
    };

    const handleJsonData = (jsonDataString) => {
        try {
            const jsonData = JSON.parse(jsonDataString);
            let newSearchCriteria = [];
            let currentOperator = '';
            let brackets = {start: [], end: []}; // Tracks indices for start and end brackets
            let alerts = [];

            // Iterate over the items in the parsed JSON
            jsonData.forEach((item, index) => {
                if (DEBUG) console.log(`Processing item at index ${index}:`, item); // Debugging log

                if (item.operator) {
                    // Set the current operator, which will be applied to the next criterion
                    currentOperator = item.operator.toUpperCase(); // Match UI options (AND, OR, NOT)
                } else if (item.bracket) {
                    if (item.bracket === 'start') {
                        // Push the index for a start bracket
                        brackets.start.push(newSearchCriteria.length);
                    } else {
                        // Push the index for an end bracket, which applies to the preceding criterion
                        brackets.end.push(newSearchCriteria.length - 1);
                    }
                } else {
                    let fieldDetails = fieldsData.find(field => field.field_path === item.field);

                    if (!fieldDetails) {
                        if (DEBUG) console.error(`Field not found in fieldsData: ${item.field}`);
                        alerts.push(`Field not found: ${item.field}`);
                    }

                    // Construct the criterion object
                    let criterion = {
                        field: item.field || '',
                        expression: currentOperator, // The latest operator is used here
                        value: '',
                        showRangeInput: false,
                        rangeValue: '',
                        leftBracket: false, // Initially false, to be determined by start brackets
                        rightBracket: false, // Initially false, determined after all criteria are added
                    };

                    // Validate and correct the value and rangeValue if they exist
                    if (typeof item.value === 'object' && item.value !== null) {
                        criterion.showRangeInput = true;
                        criterion.value = item.value.from || '';
                        criterion.rangeValue = item.value.to || '';

                        // Swap values if necessary
                        if (parseFloat(criterion.value) > parseFloat(criterion.rangeValue)) {
                            if (DEBUG) console.log(`Swapping range values for field: ${item.field}`);
                            [criterion.value, criterion.rangeValue] = [criterion.rangeValue, criterion.value];
                            alerts.push(`Swapped range values for field "${item.field}" because "${criterion.rangeValue}" was greater than "${criterion.value}".`);
                        }
                    } else if (item.value !== undefined) {
                        criterion.value = item.value.toString();
                    } else {
                        if (DEBUG) console.error(`Value is missing for field: ${item.field}`);
                        alerts.push(`Value is missing for field: ${item.field}`);
                    }

                    // Correct the values if they're out of bounds
                    if (fieldDetails) {
                        const min = parseFloat(fieldDetails.minimum);
                        const max = parseFloat(fieldDetails.maximum);

                        // Correct the single value
                        let value = parseFloat(criterion.value);
                        if (!isNaN(value)) {
                            if (value < min || value > max) {
                                console.log(`Adjusting value for field: ${item.field}`);
                                criterion.value = value < min ? min.toString() : max.toString();
                                alerts.push(`Adjusted value for field "${item.field}" to be within the allowed range.`);
                            }
                        }

                        // Correct the range values
                        let fromValue = parseFloat(criterion.value);
                        let toValue = parseFloat(criterion.rangeValue);
                        if (!isNaN(fromValue) && fromValue < min) {
                            criterion.value = min.toString();
                            alerts.push(`Adjusted "from" value for field "${item.field}" to the minimum allowed value.`);
                        }
                        if (!isNaN(toValue) && toValue > max) {
                            criterion.rangeValue = max.toString();
                            alerts.push(`Adjusted "to" value for field "${item.field}" to the maximum allowed value.`);
                        }
                    }

                    currentOperator = ''; // Reset the operator for the next iteration
                    newSearchCriteria.push(criterion); // Add the criterion to the array
                }
            });

            // Apply the start and end brackets to the corresponding criteria
            brackets.start.forEach(startIndex => {
                if (newSearchCriteria[startIndex] !== undefined) {
                    newSearchCriteria[startIndex].leftBracket = true;
                }
            });

            // Apply the end brackets to the corresponding criteria
            brackets.end.forEach(endIndex => {
                if (newSearchCriteria[endIndex] !== undefined) {
                    newSearchCriteria[endIndex].rightBracket = true;
                }
            });

            // If there are any alerts, log them or display them to the user
            if (alerts.length > 0) {
                if (DEBUG) console.warn('Alerts during JSON data processing:', alerts);
                alert(alerts.join('\n')); // Display all alerts to the user
            }

            // Update the application state with the new array of search criteria
            setSearchCriteria(newSearchCriteria);
        } catch (error) {
            if (error instanceof SyntaxError) {
                if (DEBUG) console.error("Malformed JSON data:", error);
                alert("The provided JSON is malformed. Please check its syntax.");
            } else {
                if (DEBUG) console.error("Error processing JSON data:", error);
            }
        }
    };


    const handleLoadJson = () => {
        // Create a file input dynamically
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json,.txt'; // Accept only JSON and text files
        fileInput.style.display = 'none'; // Hide the file input

        // Listen for file selection
        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                // Read the file
                const reader = new FileReader();
                reader.onload = (event) => {
                    console.log(event.target.result); // Log the file content to the console
                    handleJsonData(event.target.result); // Call function to process JSON data
                };
                reader.readAsText(file); // Read the file as text
            }
        };

        // Trigger the file input click event to open the file picker dialog
        fileInput.click();
    }

    return (
        <>
            {!showAdvancedSearch && (
                <button onClick={() => setShowAdvancedSearch(true)}>Advanced Search</button>
            )}
            {showAdvancedSearch && (
                <div className="search-section">
                    {searchCriteria.map((criteria, index) => (
                        <div key={index}>
                            <SearchCriteria
                                criteria={criteria}
                                fieldsData={fieldsData} // Pass the JSON data as a prop
                                onChange={(e, field, validationError) => handleCriteriaChange(index, field, e.target.value, validationError)}
                                onRemove={() => removeSearchCriteria(index)}
                                showRemoveButton={index > 0}
                            />
                        </div>
                    ))}
                    <div className="search-buttons">
                        <button className="add-field" onClick={addSearchCriteria}>Add Field</button>
                        <button className="search" onClick={handleSearchClick}>Search
                        </button>

                        <button id="myButton" className="copy-load" onClick={handleCopyClick}
                        ><img src="src/assets/clipboard.png" alt="C"
                              style={{
                                  width: '40%',
                                  height: 'auto',
                                  filter: 'invert(80%)'
                              }}/></button>
                        <button className="copy-load" onClick={handleLoadJson}>L</button>
                    </div>
                </div>
            )}
        </>
    );

}

export default App
