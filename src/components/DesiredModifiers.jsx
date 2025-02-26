// components/DesiredModifiers.jsx
import React, { useState, useRef } from 'react';
import ImprovedModifierSearch from './ImprovedModifierSearch';

function DesiredModifiers({ modData, onGenerateIdols }) {
  const [desiredModifiers, setDesiredModifiers] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  
  // Use ref for search history to avoid rerenders
  const searchHistoryRef = useRef({
    searchTerm: '',
    filterType: 'all',
    viewByName: false,
    nameFilter: ''
  });

  // Handle adding a modifier
  const handleAddModifier = (modifier, type) => {
    // Check if this modifier already exists in the list
    const existingIndex = desiredModifiers.findIndex(mod => mod.Code === modifier.Code);
    
    if (existingIndex >= 0) {
      // Increment count if already exists
      const updatedModifiers = [...desiredModifiers];
      updatedModifiers[existingIndex] = {
        ...updatedModifiers[existingIndex],
        count: (updatedModifiers[existingIndex].count || 1) + 1
      };
      setDesiredModifiers(updatedModifiers);
    } else {
      // Add as new with count = 1
      setDesiredModifiers([...desiredModifiers, {...modifier, type, count: 1}]);
    }
  };

  // Handle removing a modifier
  const handleRemoveModifier = (index) => {
    const mod = desiredModifiers[index];
    
    // If count > 1, decrement count
    if (mod.count > 1) {
      const updatedModifiers = [...desiredModifiers];
      updatedModifiers[index] = {
        ...updatedModifiers[index],
        count: updatedModifiers[index].count - 1
      };
      setDesiredModifiers(updatedModifiers);
    } else {
      // Otherwise remove the modifier
      const newList = [...desiredModifiers];
      newList.splice(index, 1);
      setDesiredModifiers(newList);
    }
  };

  // Generate idols from desired modifiers
  const handleGenerateIdols = () => {
    if (desiredModifiers.length === 0) return;
    
    // Expand modifiers based on count
    const expandedModifiers = [];
    desiredModifiers.forEach(mod => {
      for (let i = 0; i < mod.count; i++) {
        // Copy without count to avoid confusion
        const { count, ...modWithoutCount } = mod;
        expandedModifiers.push(modWithoutCount);
      }
    });
    
    onGenerateIdols(expandedModifiers);
    
    // Reset the list after generation
    setDesiredModifiers([]);
  };
  
  // Track search state changes
  const handleSearchUpdate = (searchState) => {
    searchHistoryRef.current = searchState;
  };

  // Calculate total modifier count
  const totalModifierCount = desiredModifiers.reduce((total, mod) => total + mod.count, 0);

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4">Auto-Generate Idols</h2>
      
      <div className="space-y-4">
        <p className="text-gray-300 text-sm">
          Add modifiers you want on your idols, then generate and place them automatically. 
          Click a modifier multiple times to increase its quantity.
        </p>
        
        {/* Display selected modifiers */}
        {desiredModifiers.length > 0 ? (
          <div className="border border-gray-700 rounded-lg p-3 mb-3">
            <h3 className="font-semibold mb-2">Desired Modifiers ({totalModifierCount})</h3>
            <ul className="max-h-60 overflow-y-auto space-y-2">
              {desiredModifiers.map((mod, index) => (
                <li key={`${mod.Code}-${index}`} className="bg-gray-700 p-2 rounded flex justify-between items-start">
                  <div>
                    <div className="text-sm">
                      <span className={mod.type === 'prefix' ? 'text-blue-400' : 'text-green-400'}>
                        {mod.type === 'prefix' ? '[Prefix]' : '[Suffix]'}
                      </span>{' '}
                      {mod.Name}
                      {mod.count > 1 && 
                        <span className="ml-2 text-yellow-400">
                          ({mod.count}x)
                        </span>
                      }
                    </div>
                    <div className="text-xs text-gray-300">{mod.Mod}</div>
                  </div>
                  <button 
                    onClick={() => handleRemoveModifier(index)}
                    className="text-red-400 hover:text-red-300 ml-2"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="text-gray-400 text-center p-4 border border-dashed border-gray-700 rounded-lg">
            No modifiers selected. Add modifiers to generate idols.
          </div>
        )}
        
        {/* Search controls */}
        <div className="mb-3">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">Search Modifiers</h3>
            {showSearch && (
              <button
                onClick={() => setShowSearch(false)}
                className="text-gray-400 hover:text-gray-300"
              >
                {desiredModifiers.length > 0 ? "Hide Search" : "✕ Close"}
              </button>
            )}
          </div>
          
          {showSearch ? (
            <ImprovedModifierSearch 
              modData={modData} 
              onAddModifier={handleAddModifier}
              initialState={searchHistoryRef.current}
              onSearchUpdate={handleSearchUpdate}
              searchContext="autogen"
            />
          ) : (
            <button
              className="w-full bg-indigo-600 hover:bg-indigo-500 py-2 px-4 rounded font-medium"
              onClick={() => setShowSearch(true)}
            >
              + Add Modifier
            </button>
          )}
        </div>
        
        {/* Generate button */}
        <button 
          className={`w-full py-2 px-4 rounded font-bold ${
            desiredModifiers.length === 0 
              ? 'bg-gray-600 cursor-not-allowed' 
              : 'bg-green-600 hover:bg-green-500'
          }`}
          onClick={handleGenerateIdols}
          disabled={desiredModifiers.length === 0}
        >
          Generate & Place Idols
        </button>
        
        {desiredModifiers.length > 0 && (
          <div className="mt-2 text-xs text-gray-400 text-center">
            This will create idols with these modifiers and place them on the grid
          </div>
        )}
      </div>
    </div>
  );
}

export default DesiredModifiers;