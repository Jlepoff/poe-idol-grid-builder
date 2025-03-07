// components/ImprovedIdolBuilder.jsx
import React, { useState, useEffect } from "react";
import ImprovedModifierSearch from "./ImprovedModifierSearch";

function ImprovedIdolBuilder({ modData, idolTypes, onAddIdol }) {
  // State for idol builder
  const [selectedType, setSelectedType] = useState("");
  const [selectedPrefixes, setSelectedPrefixes] = useState([]);
  const [selectedSuffixes, setSelectedSuffixes] = useState([]);
  const [idolName, setIdolName] = useState("");

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
  }, [selectedType]);

  // Handle adding a modifier
  const handleAddModifier = (modifier, type) => {
    if (type === "prefix") {
      // Can only have 2 prefixes max
      if (selectedPrefixes.length < 2) {
        // Don't add duplicates
        if (!selectedPrefixes.some((p) => p.Code === modifier.Code)) {
          setSelectedPrefixes([...selectedPrefixes, modifier]);
        }
      }
    } else if (type === "suffix") {
      // Can only have 2 suffixes max
      if (selectedSuffixes.length < 2) {
        // Don't add duplicates
        if (!selectedSuffixes.some((s) => s.Code === modifier.Code)) {
          setSelectedSuffixes([...selectedSuffixes, modifier]);
        }
      }
    }
  };

  // Remove prefix
  const handleRemovePrefix = (index) => {
    setSelectedPrefixes(selectedPrefixes.filter((_, i) => i !== index));
  };

  // Remove suffix
  const handleRemoveSuffix = (index) => {
    setSelectedSuffixes(selectedSuffixes.filter((_, i) => i !== index));
  };

  // Create new idol
  const handleCreateIdol = () => {
    if (!selectedType) return;

    // Generate a name if not provided
    const name =
      idolName ||
      generateIdolName(selectedType, selectedPrefixes, selectedSuffixes);

    const newIdol = {
      type: selectedType,
      name,
      prefixes: selectedPrefixes,
      suffixes: selectedSuffixes,
    };

    onAddIdol(newIdol);

    // Reset form
    setIdolName("");
    setSelectedPrefixes([]);
    setSelectedSuffixes([]);
  };

  // Generate a default name based on prefixes and suffixes
  const generateIdolName = (type, prefixes, suffixes) => {
    let name = type;

    if (prefixes.length > 0) {
      name = `${prefixes[0].Name} ${name}`;
    }

    if (suffixes.length > 0) {
      name = `${name} ${suffixes[0].Name}`;
    }

    return name;
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
      <h2 className="text-xl font-bold mb-4 text-white">Idol Builder</h2>

      <div className="space-y-5">
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

        {/* Idol Name */}
        <div>
          <label className="block mb-2 text-sm text-slate-300">Idol Name (Optional)</label>
          <input
            type="text"
            className="w-full bg-slate-800 p-3 rounded-md border-0 text-sm ring-1 ring-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
            value={idolName}
            onChange={(e) => setIdolName(e.target.value)}
            placeholder="Custom Idol Name"
          />
        </div>

        {selectedType && (
          <>
            {/* Selected Prefixes */}
            <div className="border-t border-slate-800 pt-4">
              <h3 className="font-medium mb-2 text-sm text-slate-300">
                Selected Prefixes ({selectedPrefixes.length}/2)
              </h3>
              {selectedPrefixes.length > 0 ? (
                <ul className="mb-4 space-y-2">
                  {selectedPrefixes.map((prefix, index) => (
                    <li
                      key={index}
                      className="bg-slate-800 p-3 rounded-md flex justify-between ring-1 ring-slate-700"
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
                Selected Suffixes ({selectedSuffixes.length}/2)
              </h3>
              {selectedSuffixes.length > 0 ? (
                <ul className="mb-4 space-y-2">
                  {selectedSuffixes.map((suffix, index) => (
                    <li
                      key={index}
                      className="bg-slate-800 p-3 rounded-md flex justify-between ring-1 ring-slate-700"
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
              <ImprovedModifierSearch
                modData={selectedType ? getTypeSpecificMods() : modData}
                onAddModifier={handleAddModifier}
                selectedType={selectedType}
                initialState={searchState}
                onSearchUpdate={handleSearchUpdate}
                searchContext="builder"
              />
            </div>

            {/* Create Button */}
            <button
              className="w-full mt-4 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md font-medium transition-colors"
              onClick={handleCreateIdol}
              disabled={!selectedType}
            >
              Create Idol
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default ImprovedIdolBuilder;