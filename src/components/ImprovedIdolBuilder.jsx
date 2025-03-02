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
    nameFilter: "",
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
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4">Idol Builder</h2>

      <div className="space-y-4">
        {/* Idol Type Selection */}
        <div>
          <label className="block mb-1">Idol Type</label>
          <select
            className="w-full bg-gray-700 p-2 rounded border border-gray-600"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="">Select Idol Type</option>
            {idolTypes.map((type) => (
              <option key={type.name} value={type.name}>
                {type.name} ({type.width}x{type.height})
              </option>
            ))}
          </select>
        </div>

        {/* Idol Name */}
        <div>
          <label className="block mb-1">Idol Name (Optional)</label>
          <input
            type="text"
            className="w-full bg-gray-700 p-2 rounded border border-gray-600"
            value={idolName}
            onChange={(e) => setIdolName(e.target.value)}
            placeholder="Custom Idol Name"
          />
        </div>

        {selectedType && (
          <>
            {/* Selected Prefixes */}
            <div className="border-t border-gray-700 pt-3">
              <h3 className="font-semibold mb-2">
                Selected Prefixes ({selectedPrefixes.length}/2)
              </h3>
              {selectedPrefixes.length > 0 ? (
                <ul className="mb-3 space-y-1">
                  {selectedPrefixes.map((prefix, index) => (
                    <li
                      key={index}
                      className="bg-gray-700 p-2 rounded flex justify-between"
                    >
                      <div>
                        <div className="text-sm font-medium">{prefix.Name}</div>
                        <div className="text-xs text-gray-300">
                          {prefix.Mod}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemovePrefix(index)}
                        className="text-red-400 hover:text-red-300 ml-2"
                        title="Remove prefix"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400 mb-3">No prefixes selected</p>
              )}
            </div>

            {/* Selected Suffixes */}
            <div className="border-t border-gray-700 pt-3">
              <h3 className="font-semibold mb-2">
                Selected Suffixes ({selectedSuffixes.length}/2)
              </h3>
              {selectedSuffixes.length > 0 ? (
                <ul className="mb-3 space-y-1">
                  {selectedSuffixes.map((suffix, index) => (
                    <li
                      key={index}
                      className="bg-gray-700 p-2 rounded flex justify-between"
                    >
                      <div>
                        <div className="text-sm font-medium">{suffix.Name}</div>
                        <div className="text-xs text-gray-300">
                          {suffix.Mod}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveSuffix(index)}
                        className="text-red-400 hover:text-red-300 ml-2"
                        title="Remove suffix"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400 mb-3">No suffixes selected</p>
              )}
            </div>

            {/* Modifier Search */}
            <div className="border-t border-gray-700 pt-3">
              <h3 className="font-semibold mb-2">Search & Add Modifiers</h3>
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
              className="w-full mt-4 bg-yellow-600 hover:bg-yellow-500 py-2 px-4 rounded font-bold"
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
