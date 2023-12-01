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
        { field: '', expression: '', value: '', validationError: '', rangeValue: '' }
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
                    <button className="add-field" onClick={addSearchCriteria}>Add Field</button>
                    <button className="search" onClick={handleSearch} disabled={hasValidationErrors}>Search</button>
                </div>
            )}
        </>
    );

}

export default App
