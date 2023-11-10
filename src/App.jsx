import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import SearchCriteria from './SearchCriteria';

function App() {
  // Start with one search criteria
  const [searchCriteria, setSearchCriteria] = useState([
    { field: '', expression: '', value: '' }
  ]);

  const handleCriteriaChange = (index, field, value) => {
      const newCriteria = [...searchCriteria];
      newCriteria[index][field] = value;
      setSearchCriteria(newCriteria);
    };

    const addSearchCriteria = () => {
      setSearchCriteria([...searchCriteria, { field: '', expression: '', value: '' }]);
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
    if (i !== 0) { // Do not add the expression for the first item
      queryString += encodeURIComponent(sc.expression) + '+';
    }
    queryString += `${encodeURIComponent(sc.field)}=${encodeURIComponent(sc.value)}`;
    if (i < searchCriteria.length - 1) {
      queryString += '+';
    }
  }

  const url = `https://localhost:3000/search?q=${queryString}`;
  window.open(url, '_blank');
  };


  return (
    <>
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
        <div className="search-section">
      {searchCriteria.map((criteria, index) => (
        <div key={index}>
          <SearchCriteria
            criteria={criteria}
            onChange={(e, field) => handleCriteriaChange(index, field, e.target.value)}
            onRemove={() => removeSearchCriteria(index)}
            showRemoveButton={index > 0}
          />
        </div>
      ))}
      <button onClick={addSearchCriteria}>Add Field</button>
    </div>
    <button onClick={handleSearch}>Search</button>
    </>
  )
}

export default App
