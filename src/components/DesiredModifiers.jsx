// components/DesiredModifiers.jsx
import React, { useState, useRef } from "react";
import ImprovedModifierSearch from "./ImprovedModifierSearch";

function DesiredModifiers({ modData, onGenerateIdols }) {
  const [desiredModifiers, setDesiredModifiers] = useState([]);
  const [showSearch, setShowSearch] = useState(false);

  // Use ref for search history to avoid rerenders
  const searchHistoryRef = useRef({
    searchTerm: "",
    filterType: "all",
    viewByName: false,
    selectedNames: [],
  });

  // Handle adding a modifier
  const handleAddModifier = (modifier, type) => {
    // Check if this modifier already exists in the list
    const existingIndex = desiredModifiers.findIndex(
      (mod) => mod.Code === modifier.Code
    );

    if (existingIndex >= 0) {
      // Increment count if already exists
      const updatedModifiers = [...desiredModifiers];
      updatedModifiers[existingIndex] = {
        ...updatedModifiers[existingIndex],
        count: (updatedModifiers[existingIndex].count || 1) + 1,
      };
      setDesiredModifiers(updatedModifiers);
    } else {
      // Add as new with count = 1
      setDesiredModifiers([
        ...desiredModifiers,
        { ...modifier, type, count: 1 },
      ]);
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
        count: updatedModifiers[index].count - 1,
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

    // Create a clean copy of each modifier with its count
    const modifiersToGenerate = desiredModifiers.map((mod) => {
      // Ensure the modifier has all required fields
      return {
        ...mod,
        count: mod.count || 1, // Default to 1 if count is missing
        // Ensure these fields are present as they might be used in generation
        Name: mod.Name,
        Mod: mod.Mod,
        Code: mod.Code,
        id: mod.id,
        type: mod.type, // prefix or suffix
      };
    });

    onGenerateIdols(modifiersToGenerate);
  };

  // Track search state changes
  const handleSearchUpdate = (searchState) => {
    searchHistoryRef.current = searchState;
  };

  // Calculate total modifier count
  const totalModifierCount = desiredModifiers.reduce(
    (total, mod) => total + mod.count,
    0
  );

  return (
    <div className="bg-slate-900 p-6 rounded-xl shadow-sm">
      <h2 className="text-xl font-bold mb-6 text-white">Auto-Generate Idols</h2>

      <div className="space-y-6">
        <p className="text-slate-300 text-sm">
          Add modifiers you want on your idols, then generate and place them
          automatically. Click a modifier multiple times to increase its
          quantity.
        </p>

        {/* Display selected modifiers */}
        {desiredModifiers.length > 0 ? (
          <div className="border border-slate-700 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-base text-amber-400 border-l-4 border-amber-400 pl-2 mb-4">
              Desired Modifiers ({totalModifierCount})
            </h3>
            <ul className="max-h-60 overflow-y-auto space-y-2 pr-1 minimal-scrollbar">
              {desiredModifiers.map((mod, index) => (
                <li
                  key={`${mod.Code}-${index}`}
                  className={`p-3 rounded-md flex justify-between items-start 
                    ${
                      mod.type === "prefix"
                        ? "bg-gradient-to-r from-blue-900/30 to-slate-800 border border-blue-800/50"
                        : "bg-gradient-to-r from-green-900/30 to-slate-800 border border-green-800/50"
                    }`}
                >
                  <div>
                    <div className="text-sm">
                      <span
                        className={
                          mod.type === "prefix"
                            ? "text-blue-400 font-medium"
                            : "text-green-400 font-medium"
                        }
                      >
                        {mod.type === "prefix" ? "[Prefix]" : "[Suffix]"}
                      </span>{" "}
                      <span className="text-white font-medium">{mod.Name}</span>
                      {mod.count > 1 && (
                        <span className="ml-2 text-yellow-400 font-bold">
                          ({mod.count}×)
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      {mod.Mod}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveModifier(index)}
                    className="text-slate-400 hover:text-red-400 ml-2 transition-colors"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="text-slate-400 text-center p-6 border border-dashed border-slate-700 rounded-lg">
            No modifiers selected. Add modifiers to generate idols.
          </div>
        )}

        {/* Search controls */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium text-base text-slate-300 border-l-4 border-slate-600 pl-2">
              Search Modifiers
            </h3>
            {showSearch && (
              <button
                onClick={() => setShowSearch(false)}
                className="text-slate-400 hover:text-slate-300 transition-colors"
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
              className="w-full bg-slate-800 hover:bg-slate-700 py-2.5 px-4 rounded-md font-medium text-slate-200 transition-colors ring-1 ring-slate-700"
              onClick={() => setShowSearch(true)}
            >
              + Add Modifier
            </button>
          )}
        </div>

        {/* Generate button */}
        <button
          className={`w-full py-3 px-4 rounded-md font-bold shadow-sm transition-colors ${
            desiredModifiers.length === 0
              ? "bg-slate-700 text-slate-400 cursor-not-allowed"
              : "bg-amber-600 hover:bg-amber-500 text-white"
          }`}
          onClick={handleGenerateIdols}
          disabled={desiredModifiers.length === 0}
        >
          Generate & Place Idols
        </button>

        {desiredModifiers.length > 0 && (
          <div className="mt-2 text-xs text-slate-400 text-center">
            This will create idols with these modifiers and place them on the
            grid
          </div>
        )}
      </div>
    </div>
  );
}

export default DesiredModifiers;
