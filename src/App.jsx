import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import SearchCriteria from './SearchCriteria';
import {useState, useEffect} from 'react';
import jsonData from '/src/output.json';

function App() {
    // Start with one search criteria
    const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
    // Update initial state to include validationError
    const [searchCriteria, setSearchCriteria] = useState([
        {field: '', expression: '', value: '', validationError: '', rangeValue: ''}
    ]);

    // Update handleCriteriaChange to handle validation errors
    const handleCriteriaChange = (index, field, value, validationError = '') => {
        const newCriteria = [...searchCriteria];
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

    // Function to check if there are validation errors
    const hasValidationErrors = searchCriteria.some(criteria => criteria.validationError);

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
            console.log('JSON copied to clipboard');

            // Change button color back to original color after 1,5 seconds
            setTimeout(() => {
                document.getElementById("myButton").style.backgroundColor = "#646cff";
            }, 1500);
        }).catch(err => {
            console.error('Failed to copy JSON to clipboard', err);
            // Change button color back to original color
            document.getElementById("myButton").style.backgroundColor = "#646cff";
        });
    };

    const handleJsonData = (jsonDataString) => {
        try {
            const jsonData = JSON.parse(jsonDataString);
            let newSearchCriteria = [];
            let currentOperator = '';
            let brackets = {start: [], end: []}; // Tracks indices for start and end brackets

            // Iterate over the items in the parsed JSON
            jsonData.forEach((item) => {
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
                    // Construct the criterion object
                    let criterion = {
                        field: item.field,
                        expression: currentOperator, // The latest operator is used here
                        value: typeof item.value === 'object' ? item.value.from || '' : item.value,
                        showRangeInput: typeof item.value === 'object' && item.value.from && item.value.to, // Automatically display range input if range values exist
                        rangeValue: typeof item.value === 'object' ? item.value.to || '' : '',
                        leftBracket: false, // Initially false, to be determined by start brackets
                        rightBracket: false, // Initially false, determined after all criteria are added
                    };
                    currentOperator = ''; // Reset the operator for the next iteration
                    newSearchCriteria.push(criterion); // Add the criterion to the array
                }
            });

            // Apply the start brackets to the corresponding criteria
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

            // Update the application state with the new array of search criteria
            setSearchCriteria(newSearchCriteria);
        } catch (error) {
            console.error("Error processing JSON data:", error);
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
            <div>
                <a href="https://vitejs.dev" target="_blank">
                    <img src={viteLogo} className="logo" alt="Vite logo"/>
                </a>
                <a href="https://react.dev" target="_blank">
                    <img src={reactLogo} className="logo react" alt="React logo"/>
                </a>
            </div>
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
                        <button className="search" onClick={handleSearch} disabled={hasValidationErrors}>Search</button>

                        <button id="myButton" className="copy-load" onClick={handleCopyJson}
                                disabled={hasValidationErrors}><img src="src/assets/clipboard.png" alt="C" style={{
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
