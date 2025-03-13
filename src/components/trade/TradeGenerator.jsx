// components/trade/TradeGenerator.jsx
import React, { useState, useEffect } from "react";
import ModifierSearch from "../modifiers/ModifierSearch";
import { generateTradeUrlWithMultipleModifiers } from "../../utils/trade/tradeUtils";

function TradeGenerator({ modData, idolTypes }) {
  // State for trade generator
  const [selectedType, setSelectedType] = useState("");
  const [selectedPrefixes, setSelectedPrefixes] = useState([]);
  const [selectedSuffixes, setSelectedSuffixes] = useState([]);
  
  // Error state for exclusive modifiers
  const [error, setError] = useState(null);
  const [errorTimeout, setErrorTimeout] = useState(null);

  // Search state
  const [searchState, setSearchState] = useState({
    searchTerm: "",
    filterType: "all",
    viewByName: false,
    selectedNames: [],
  });

  // Reset modifiers when type changes
  useEffect(() => {
    setSelectedPrefixes([]);
    setSelectedSuffixes([]);
    setError(null);
  }, [selectedType]);
  
  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (errorTimeout) clearTimeout(errorTimeout);
    };
  }, [errorTimeout]);

  // Handle adding a modifier
  const handleAddModifier = (modifier, type) => {
    // Clear any existing error
    setError(null);
    if (errorTimeout) clearTimeout(errorTimeout);
    
    if (type === "prefix") {
      // Don't add duplicates
      if (!selectedPrefixes.some((p) => p.id === modifier.id)) {
        setSelectedPrefixes([...selectedPrefixes, modifier]);
      }
    } else if (type === "suffix") {
      // Don't add duplicates
      if (!selectedSuffixes.some((s) => s.id === modifier.id)) {
        setSelectedSuffixes([...selectedSuffixes, modifier]);
      }
    }
  };

  // Remove prefix
  const handleRemovePrefix = (index) => {
    setSelectedPrefixes(selectedPrefixes.filter((_, i) => i !== index));
    setError(null);
  };

  // Remove suffix
  const handleRemoveSuffix = (index) => {
    setSelectedSuffixes(selectedSuffixes.filter((_, i) => i !== index));
    setError(null);
  };

  // Handle trade for modifiers
  const handleTradeForModifiers = () => {
    if (!selectedType) return;

    const tradeUrl = generateTradeUrlWithMultipleModifiers(
      selectedType,
      selectedPrefixes,
      selectedSuffixes
    );

    if (tradeUrl) {
      window.open(tradeUrl, "_blank");
    } else {
      setError("Failed to generate trade URL. Please select at least one modifier.");
      const timeout = setTimeout(() => setError(null), 5000);
      setErrorTimeout(timeout);
    }
  };

  // Get type-specific modifiers
  const getTypeSpecificMods = () => {
    if (!selectedType || !modData.prefixes || !modData.suffixes) {
      return { prefixes: {}, suffixes: {} };
    }

    return {
      prefixes: { [selectedType]: modData.prefixes[selectedType] || [] },
      suffixes: { [selectedType]: modData.suffixes[selectedType] || [] },
    };
  };

  // Track search state changes
  const handleSearchUpdate = (newState) => {
    setSearchState(newState);
  };

  return (
    <div className="bg-slate-900 p-5 rounded-xl shadow-sm">
      <h2 className="text-xl font-bold mb-1 text-white">Generate Trade</h2>
      <p className="text-sm text-slate-400 mb-4">Search the trade site for idols matching any combination of modifiers using count.</p>

      <div className="space-y-5">
        {/* Error message */}
        {error && (
          <div className="bg-red-900/50 p-3 rounded-lg border border-red-800 text-red-200 text-sm">
            {error}
          </div>
        )}
      
        {/* Idol Type Selection */}
        <div>
          <label className="block mb-2 text-sm text-slate-300">Idol Type</label>
          <select
            className="w-full bg-slate-800 p-3 rounded-md border-0 text-sm ring-1 ring-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="">Select Idol Type</option>
            {idolTypes.map((type) => (
              <option key={type.name} value={type.name}>
                {type.name} ({type.width}×{type.height})
              </option>
            ))}
          </select>
        </div>

        {selectedType && (
          <>
            {/* Selected Prefixes */}
            <div className="border-t border-slate-800 pt-4">
              <h3 className="font-medium mb-2 text-sm text-slate-300">
                Selected Prefixes ({selectedPrefixes.length})
              </h3>
              {selectedPrefixes.length > 0 ? (
                <ul className="mb-4 space-y-2 max-h-48 overflow-y-auto minimal-scrollbar pr-1">
                  {selectedPrefixes.map((prefix, index) => (
                    <li
                      key={index}
                      className="bg-slate-800 p-3 rounded-md flex justify-between ring-1 ring-slate-700"
                      onContextMenu={(e) => {
                        e.preventDefault();
                        handleRemovePrefix(index);
                      }}
                    >
                      <div>
                        <div className="text-sm font-medium text-blue-400">{prefix.Name}</div>
                        <div className="text-xs text-slate-400 mt-1">
                          {prefix.Mod}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemovePrefix(index)}
                        className="text-slate-400 hover:text-slate-300 ml-2 self-start"
                        title="Remove prefix"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-4 bg-slate-800 rounded-md text-sm text-slate-400 text-center mb-4 ring-1 ring-slate-700">
                  No prefixes selected
                </div>
              )}
            </div>

            {/* Selected Suffixes */}
            <div className="border-t border-slate-800 pt-4">
              <h3 className="font-medium mb-2 text-sm text-slate-300">
                Selected Suffixes ({selectedSuffixes.length})
              </h3>
              {selectedSuffixes.length > 0 ? (
                <ul className="mb-4 space-y-2 max-h-48 overflow-y-auto minimal-scrollbar pr-1">
                  {selectedSuffixes.map((suffix, index) => (
                    <li
                      key={index}
                      className="bg-slate-800 p-3 rounded-md flex justify-between ring-1 ring-slate-700"
                      onContextMenu={(e) => {
                        e.preventDefault();
                        handleRemoveSuffix(index);
                      }}
                    >
                      <div>
                        <div className="text-sm font-medium text-green-400">{suffix.Name}</div>
                        <div className="text-xs text-slate-400 mt-1">
                          {suffix.Mod}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveSuffix(index)}
                        className="text-slate-400 hover:text-slate-300 ml-2 self-start"
                        title="Remove suffix"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-4 bg-slate-800 rounded-md text-sm text-slate-400 text-center mb-4 ring-1 ring-slate-700">
                  No suffixes selected
                </div>
              )}
            </div>

            {/* Modifier Search */}
            <div className="border-t border-slate-800 pt-4">
              <h3 className="font-medium mb-2 text-sm text-slate-300">Search & Add Modifiers</h3>
              <ModifierSearch
                modData={selectedType ? getTypeSpecificMods() : modData}
                onAddModifier={handleAddModifier}
                selectedType={selectedType}
                initialState={searchState}
                onSearchUpdate={handleSearchUpdate}
                searchContext="builder"
              />
            </div>

            {/* Trade Button */}
            <button
              className="w-full mt-4 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md font-medium transition-colors"
              onClick={handleTradeForModifiers}
              disabled={!selectedType || (selectedPrefixes.length === 0 && selectedSuffixes.length === 0)}
            >
              Trade for Modifiers
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default TradeGenerator;