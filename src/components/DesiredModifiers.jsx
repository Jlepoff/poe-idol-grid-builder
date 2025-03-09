// components/DesiredModifiers.jsx
import React, { useState, useRef } from "react";
import ImprovedModifierSearch from "./ImprovedModifierSearch";

function DesiredModifiers({ modData, onGenerateIdols, inventory }) {
  const [desiredModifiers, setDesiredModifiers] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showLoadConfirm, setShowLoadConfirm] = useState(false);

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

  // Handle right-click to remove a modifier
  const handleRightClick = (e, index) => {
    e.preventDefault();
    handleRemoveModifier(index);
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

  // Clear all desired modifiers
  const handleClearModifiers = () => {
    setShowClearConfirm(true);
  };

  const confirmClearModifiers = () => {
    setDesiredModifiers([]);
    setShowClearConfirm(false);
  };

  // Load modifiers from inventory
  const isValidInventory = () => {
    if (!inventory || inventory.length === 0) return false;

    // Check if inventory has any non-unique idols with prefixes or suffixes
    return inventory.some(
      (idol) =>
        !idol.isUnique &&
        ((idol.prefixes && idol.prefixes.length > 0) ||
          (idol.suffixes && idol.suffixes.length > 0))
    );
  };

  const handleLoadFromInventory = () => {
    setShowLoadConfirm(true);
  };

  const confirmLoadFromInventory = () => {
    // Keep track of existing modifiers
    const existingModsMap = {};
    desiredModifiers.forEach((mod) => {
      existingModsMap[mod.Code] = mod.count || 1;
    });

    // Extract all prefixes and suffixes from inventory
    const modsFromInventory = [];
    let nonUniqueCount = 0;

    inventory.forEach((idol) => {
      if (idol.isUnique) return; // Skip unique idols
      nonUniqueCount++;

      // Process prefixes
      if (idol.prefixes && idol.prefixes.length > 0) {
        idol.prefixes.forEach((prefix) => {
          // Skip if missing required data
          if (!prefix.Code || !prefix.Name || !prefix.Mod) return;

          const existingIndex = modsFromInventory.findIndex(
            (mod) => mod.Code === prefix.Code
          );

          if (existingIndex >= 0) {
            modsFromInventory[existingIndex].count++;
          } else {
            modsFromInventory.push({
              ...prefix,
              type: "prefix",
              count: 1,
            });
          }
        });
      }

      // Process suffixes
      if (idol.suffixes && idol.suffixes.length > 0) {
        idol.suffixes.forEach((suffix) => {
          // Skip if missing required data
          if (!suffix.Code || !suffix.Name || !suffix.Mod) return;

          const existingIndex = modsFromInventory.findIndex(
            (mod) => mod.Code === suffix.Code
          );

          if (existingIndex >= 0) {
            modsFromInventory[existingIndex].count++;
          } else {
            modsFromInventory.push({
              ...suffix,
              type: "suffix",
              count: 1,
            });
          }
        });
      }
    });

    // Merge with existing modifiers
    const mergedModifiers = [...desiredModifiers];

    modsFromInventory.forEach((mod) => {
      const existingIndex = mergedModifiers.findIndex(
        (existing) => existing.Code === mod.Code
      );

      if (existingIndex >= 0) {
        // Update count if already exists
        mergedModifiers[existingIndex].count += mod.count;
      } else {
        // Add as new
        mergedModifiers.push(mod);
      }
    });

    setDesiredModifiers(mergedModifiers);
    setShowLoadConfirm(false);

    // Create an event with the IDs to remove
    // This will be handled by the parent component
    const event = {
      type: "LOAD_FROM_INVENTORY",
      idolIds: nonUniqueCount,
    };

    onGenerateIdols(null, true, event);
  };

  return (
    <div className="bg-slate-900 p-6 rounded-xl shadow-sm">
      <h2 className="text-xl font-bold mb-4 text-white">Auto-Generate Idols</h2>

      <div className="space-y-5">
        <div className="flex space-x-3">
          {isValidInventory() && (
            <button
              className="flex-1 py-2.5 px-4 rounded-md text-sm font-medium bg-amber-600 hover:bg-amber-500 text-white transition-colors ring-1 ring-amber-800"
              onClick={handleLoadFromInventory}
            >
              Load From Inventory
            </button>
          )}
          <button
            className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-colors ${
              desiredModifiers.length === 0
                ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-500 text-white ring-1 ring-red-800"
            }`}
            onClick={handleClearModifiers}
            disabled={desiredModifiers.length === 0}
          >
            Clear Modifiers
          </button>
        </div>

        <p className="text-slate-300 text-sm">
          Add modifiers you want on your idols, then generate and place them
          automatically. Click a modifier multiple times to increase its
          quantity. Right-click to remove a modifier.
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
                  onContextMenu={(e) => handleRightClick(e, index)}
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

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-slate-950 bg-opacity-80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-xl p-6 max-w-md w-full shadow-lg border border-slate-800">
            <div className="flex justify-between items-start mb-5">
              <h2 className="text-xl font-bold text-white">Clear Modifiers</h2>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="mb-6">
              <p className="text-slate-300 mb-4">
                Are you sure you want to clear all desired modifiers?
              </p>

              <div className="bg-red-900/30 border border-red-800 p-4 rounded-lg">
                <p className="text-red-200 font-medium mb-2">Warning:</p>
                <ul className="text-red-100 text-sm space-y-2 ml-4 list-disc">
                  <li>All modifiers in the list will be permanently removed</li>
                  <li>
                    If these modifiers were loaded from your inventory, they
                    cannot be recovered
                  </li>
                  <li>To use these modifiers to create new idols, click <strong>"Generate & Place Idols"</strong>.</li>
                  <li>This action cannot be undone</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                className="px-4 py-2 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
                onClick={() => setShowClearConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-500 text-white font-medium transition-colors"
                onClick={confirmClearModifiers}
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load from Inventory Confirmation Modal */}
      {showLoadConfirm && (
        <div className="fixed inset-0 bg-slate-950 bg-opacity-80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-xl p-6 max-w-md w-full shadow-lg border border-slate-800">
            <div className="flex justify-between items-start mb-5">
              <h2 className="text-xl font-bold text-white">
                Load From Inventory
              </h2>
              <button
                onClick={() => setShowLoadConfirm(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="text-slate-300 mb-6 space-y-4">
              <p>
                This will extract modifiers from your inventory and add them to your desired modifier list. 
                You can then use these later to generate new idols.
              </p>
              <div className="bg-amber-900/30 border border-amber-800 p-4 rounded-lg">
                <p className="text-amber-200 font-medium mb-2">Important:</p>
                <ul className="text-amber-100 text-sm space-y-2 ml-4 list-disc">
                  <li>
                    <strong>All non-unique idols in your inventory will be removed</strong>
                  </li>
                  <li>
                    <strong>The current grid layout will be cleared</strong>
                  </li>
                  <li>
                    Unique idols will remain in your inventory
                  </li>
                  <li>
                    You'll need to click "Generate & Place Idols" to create new idols with these modifiers
                  </li>
                </ul>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                className="px-4 py-2 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
                onClick={() => setShowLoadConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-md bg-amber-600 hover:bg-amber-500 text-white font-medium transition-colors"
                onClick={confirmLoadFromInventory}
              >
                Extract Modifiers
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DesiredModifiers;