import React, { useState, useEffect, useMemo, useCallback } from "react";

function ImprovedModifierSearch({
  modData,
  onAddModifier,
  selectedType = "",
  initialState = null,
  onSearchUpdate = null,
  searchContext = "builder", // Can be 'builder' or 'autogen'
}) {
  // Initialize state from props or defaults
  const [searchTerm, setSearchTerm] = useState(initialState?.searchTerm || "");
  const [filterType, setFilterType] = useState(
    initialState?.filterType || "all"
  );
  const [viewByName, setViewByName] = useState(
    initialState?.viewByName || false
  );

  // Change from single nameFilter to array of selected names
  const [selectedNames, setSelectedNames] = useState(
    initialState?.selectedNames || []
  );

  const [nameSearchTerm, setNameSearchTerm] = useState("");

  // Update parent when search state changes
  const updateParent = useCallback(() => {
    if (onSearchUpdate) {
      onSearchUpdate({
        searchTerm,
        filterType,
        viewByName,
        selectedNames,
      });
    }
  }, [onSearchUpdate, searchTerm, filterType, viewByName, selectedNames]);

  // Send updates when search parameters change
  useEffect(() => {
    const timeoutId = setTimeout(updateParent, 50);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, filterType, viewByName, selectedNames, updateParent]);

  // Event handlers
  const handleSearchTermChange = (e) => setSearchTerm(e.target.value);
  const handleFilterTypeChange = (e) => setFilterType(e.target.value);

  const handleViewModeChange = (mode) => {
    setViewByName(mode);
    setSelectedNames([]); // Reset selected names when changing view mode
  };

  // New handler for toggling name selection
  const handleNameSelection = (name) => {
    setSelectedNames((prevNames) => {
      // If name is already selected, remove it
      if (prevNames.includes(name)) {
        return prevNames.filter((n) => n !== name);
      }
      // Otherwise add it to the selection
      return [...prevNames, name];
    });
  };

  // Get all unique modifier names for browsing, with deduplication
  const modifierNames = useMemo(() => {
    if (!modData.prefixes || !modData.suffixes)
      return { prefixes: [], suffixes: [] };

    const prefixNames = new Set();
    const suffixNames = new Set();

    // Only show modifiers for the selected type when in builder context
    if (searchContext === "builder" && selectedType) {
      if (modData.prefixes[selectedType]) {
        modData.prefixes[selectedType].forEach((mod) =>
          prefixNames.add(mod.Name)
        );
      }

      if (modData.suffixes[selectedType]) {
        modData.suffixes[selectedType].forEach((mod) =>
          suffixNames.add(mod.Name)
        );
      }
    } else {
      // Collect all unique names for auto-generate mode
      Object.values(modData.prefixes).forEach((typeModifiers) => {
        typeModifiers.forEach((mod) => prefixNames.add(mod.Name));
      });

      Object.values(modData.suffixes).forEach((typeModifiers) => {
        typeModifiers.forEach((mod) => suffixNames.add(mod.Name));
      });
    }

    return {
      prefixes: Array.from(prefixNames).sort(),
      suffixes: Array.from(suffixNames).sort(),
    };
  }, [modData, selectedType, searchContext]);

  // Get combined unique modifier names (for when showing "all types")
  const combinedUniqueNames = useMemo(() => {
    // If we're not showing "all types", just return empty array
    if (filterType !== "all") return [];

    // Create a Set to deduplicate names that appear in both prefixes and suffixes
    const uniqueNames = new Set([
      ...modifierNames.prefixes,
      ...modifierNames.suffixes,
    ]);

    return Array.from(uniqueNames).sort();
  }, [modifierNames.prefixes, modifierNames.suffixes, filterType]);

  // Filter modifiers based on search criteria
  const filteredModifiers = useMemo(() => {
    if (!modData.prefixes || !modData.suffixes)
      return { prefixes: [], suffixes: [] };

    // Auto-generate search context
    if (searchContext === "autogen") {
      // When browsing by name in auto-generate mode with multiple selections
      if (viewByName && selectedNames.length > 0) {
        const result = { prefixes: [], suffixes: [] };

        // Handle each selected name
        selectedNames.forEach((nameFilter) => {
          const combinedPrefixes = [];
          const modsSeen = new Set();

          // Collect unique prefixes by Mod text across all idol types
          // Only if we're showing all or specifically prefixes
          if (filterType === "all" || filterType === "prefix") {
            Object.entries(modData.prefixes).forEach(
              ([typeName, prefixList]) => {
                prefixList.forEach((prefix) => {
                  if (prefix.Name === nameFilter) {
                    const modText = prefix.Mod;

                    if (!modsSeen.has(modText)) {
                      modsSeen.add(modText);

                      // Track which idol types support this modifier
                      const supportedTypes = Object.entries(modData.prefixes)
                        .filter(([_, typeList]) =>
                          typeList.some((p) => p.Mod === modText)
                        )
                        .map(([type, _]) => type);

                      combinedPrefixes.push({
                        ...prefix,
                        supportedTypes,
                      });
                    }
                  }
                });
              }
            );

            result.prefixes = [...result.prefixes, ...combinedPrefixes];
          }

          // Same for suffixes - only if we're showing all or specifically suffixes
          const combinedSuffixes = [];
          modsSeen.clear();

          if (filterType === "all" || filterType === "suffix") {
            Object.entries(modData.suffixes).forEach(
              ([typeName, suffixList]) => {
                suffixList.forEach((suffix) => {
                  if (
                    suffix.Name === nameFilter ||
                    suffix.Name === `of ${nameFilter}`
                  ) {
                    const modText = suffix.Mod;

                    if (!modsSeen.has(modText)) {
                      modsSeen.add(modText);

                      const supportedTypes = Object.entries(modData.suffixes)
                        .filter(([_, typeList]) =>
                          typeList.some((s) => s.Mod === modText)
                        )
                        .map(([type, _]) => type);

                      combinedSuffixes.push({
                        ...suffix,
                        supportedTypes,
                      });
                    }
                  }
                });
              }
            );

            result.suffixes = [...result.suffixes, ...combinedSuffixes];
          }
        });

        return result;
      }
      // When searching by text in auto-generate mode
      else if (searchTerm) {
        const lowerTerm = searchTerm.toLowerCase();

        // Get unique prefixes across all idol types
        // Only if we're showing all or specifically prefixes
        const combinedPrefixes = [];
        const prefixModsSeen = new Set();

        if (filterType === "all" || filterType === "prefix") {
          Object.entries(modData.prefixes).forEach(([typeName, prefixList]) => {
            prefixList.forEach((prefix) => {
              if (
                prefix.Name.toLowerCase().includes(lowerTerm) ||
                prefix.Mod.toLowerCase().includes(lowerTerm)
              ) {
                const modText = prefix.Mod;

                if (!prefixModsSeen.has(modText)) {
                  prefixModsSeen.add(modText);

                  // Find all idol types that support this modifier
                  const supportedTypes = Object.entries(modData.prefixes)
                    .filter(([_, typeList]) =>
                      typeList.some((p) => p.Mod === modText)
                    )
                    .map(([type, _]) => type);

                  combinedPrefixes.push({
                    ...prefix,
                    supportedTypes,
                  });
                }
              }
            });
          });
        }

        // Do the same for suffixes
        // Only if we're showing all or specifically suffixes
        const combinedSuffixes = [];
        const suffixModsSeen = new Set();

        if (filterType === "all" || filterType === "suffix") {
          Object.entries(modData.suffixes).forEach(([typeName, suffixList]) => {
            suffixList.forEach((suffix) => {
              if (
                suffix.Name.toLowerCase().includes(lowerTerm) ||
                suffix.Mod.toLowerCase().includes(lowerTerm)
              ) {
                const modText = suffix.Mod;

                if (!suffixModsSeen.has(modText)) {
                  suffixModsSeen.add(modText);

                  const supportedTypes = Object.entries(modData.suffixes)
                    .filter(([_, typeList]) =>
                      typeList.some((s) => s.Mod === modText)
                    )
                    .map(([type, _]) => type);

                  combinedSuffixes.push({
                    ...suffix,
                    supportedTypes,
                  });
                }
              }
            });
          });
        }

        // Sort results by relevance
        combinedPrefixes.sort((a, b) => {
          const aNameMatch = a.Name.toLowerCase().indexOf(lowerTerm);
          const bNameMatch = b.Name.toLowerCase().indexOf(lowerTerm);

          if (aNameMatch !== -1 && bNameMatch === -1) return -1;
          if (aNameMatch === -1 && bNameMatch !== -1) return 1;
          if (aNameMatch !== -1 && bNameMatch !== -1)
            return aNameMatch - bNameMatch;

          return a.Name.localeCompare(b.Name);
        });

        combinedSuffixes.sort((a, b) => {
          const aNameMatch = a.Name.toLowerCase().indexOf(lowerTerm);
          const bNameMatch = b.Name.toLowerCase().indexOf(lowerTerm);

          if (aNameMatch !== -1 && bNameMatch === -1) return -1;
          if (aNameMatch === -1 && bNameMatch !== -1) return 1;
          if (aNameMatch !== -1 && bNameMatch !== -1)
            return aNameMatch - bNameMatch;

          return a.Name.localeCompare(b.Name);
        });

        return {
          prefixes: combinedPrefixes.slice(0, 50),
          suffixes: combinedSuffixes.slice(0, 50),
        };
      }

      // If no search term or name filter, return empty list
      return { prefixes: [], suffixes: [] };
    }

    // Builder context filtering logic
    // If viewing by name with multiple selections
    if (viewByName && selectedNames.length > 0) {
      const result = { prefixes: [], suffixes: [] };

      selectedNames.forEach((nameFilter) => {
        // Filter prefixes by name
        if (filterType === "all" || filterType === "prefix") {
          if (
            searchContext === "builder" &&
            selectedType &&
            modData.prefixes[selectedType]
          ) {
            // For type-specific filtering in builder context
            const filtered = modData.prefixes[selectedType].filter(
              (mod) => mod.Name === nameFilter
            );
            result.prefixes = [...result.prefixes, ...filtered];
          } else {
            // For all idol types
            Object.values(modData.prefixes).forEach((typeModifiers) => {
              const filtered = typeModifiers.filter(
                (mod) => mod.Name === nameFilter
              );
              result.prefixes = [...result.prefixes, ...filtered];
            });
          }
        }

        // Filter suffixes by name
        if (filterType === "all" || filterType === "suffix") {
          if (
            searchContext === "builder" &&
            selectedType &&
            modData.suffixes[selectedType]
          ) {
            // For type-specific filtering in builder context
            const filtered = modData.suffixes[selectedType].filter(
              (mod) =>
                mod.Name === nameFilter || mod.Name === `of ${nameFilter}`
            );
            result.suffixes = [...result.suffixes, ...filtered];
          } else {
            // For all idol types
            Object.values(modData.suffixes).forEach((typeModifiers) => {
              const filtered = typeModifiers.filter(
                (mod) =>
                  mod.Name === nameFilter || mod.Name === `of ${nameFilter}`
              );
              result.suffixes = [...result.suffixes, ...filtered];
            });
          }
        }
      });

      return result;
    }

    // If searching by term
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      let filteredPrefixes = [];
      let filteredSuffixes = [];

      // Search prefixes if filter allows
      if (filterType === "all" || filterType === "prefix") {
        // For type-specific filtering, only show modifiers for the selected idol type
        if (
          searchContext === "builder" &&
          selectedType &&
          modData.prefixes[selectedType]
        ) {
          filteredPrefixes = modData.prefixes[selectedType].filter(
            (prefix) =>
              prefix.Name.toLowerCase().includes(lowerTerm) ||
              prefix.Mod.toLowerCase().includes(lowerTerm)
          );
        } else {
          // Flatten all prefixes from different idol types into a single array
          const allPrefixes = Object.values(modData.prefixes).flat();

          filteredPrefixes = allPrefixes.filter(
            (prefix) =>
              prefix.Name.toLowerCase().includes(lowerTerm) ||
              prefix.Mod.toLowerCase().includes(lowerTerm)
          );
        }
      }

      // Search suffixes if filter allows
      if (filterType === "all" || filterType === "suffix") {
        // For type-specific filtering
        if (
          searchContext === "builder" &&
          selectedType &&
          modData.suffixes[selectedType]
        ) {
          filteredSuffixes = modData.suffixes[selectedType].filter(
            (suffix) =>
              suffix.Name.toLowerCase().includes(lowerTerm) ||
              suffix.Mod.toLowerCase().includes(lowerTerm)
          );
        } else {
          // Flatten all suffixes from different idol types
          const allSuffixes = Object.values(modData.suffixes).flat();

          filteredSuffixes = allSuffixes.filter(
            (suffix) =>
              suffix.Name.toLowerCase().includes(lowerTerm) ||
              suffix.Mod.toLowerCase().includes(lowerTerm)
          );
        }
      }

      // Sort results by relevance
      filteredPrefixes.sort((a, b) => {
        const aNameMatch = a.Name.toLowerCase().indexOf(lowerTerm);
        const bNameMatch = b.Name.toLowerCase().indexOf(lowerTerm);

        if (aNameMatch !== -1 && bNameMatch === -1) return -1;
        if (aNameMatch === -1 && bNameMatch !== -1) return 1;
        if (aNameMatch !== -1 && bNameMatch !== -1)
          return aNameMatch - bNameMatch;

        return a.Name.localeCompare(b.Name);
      });

      filteredSuffixes.sort((a, b) => {
        const aNameMatch = a.Name.toLowerCase().indexOf(lowerTerm);
        const bNameMatch = b.Name.toLowerCase().indexOf(lowerTerm);

        if (aNameMatch !== -1 && bNameMatch === -1) return -1;
        if (aNameMatch === -1 && bNameMatch !== -1) return 1;
        if (aNameMatch !== -1 && bNameMatch !== -1)
          return aNameMatch - bNameMatch;

        return a.Name.localeCompare(b.Name);
      });

      return {
        prefixes: filteredPrefixes.slice(0, 50),
        suffixes: filteredSuffixes.slice(0, 50),
      };
    }

    // If no search term, return empty list
    return { prefixes: [], suffixes: [] };
  }, [
    searchTerm,
    filterType,
    modData,
    selectedType,
    viewByName,
    selectedNames,
    searchContext,
  ]);

  // Handler for adding a modifier
  const handleAddModifier = useCallback(
    (modifier, type) => {
      onAddModifier(modifier, type);
    },
    [onAddModifier]
  );

  // Determine which names to display in the cloud based on filter type
  const nameTagsToDisplay = useMemo(() => {
    if (filterType === "all") {
      return combinedUniqueNames;
    } else if (filterType === "prefix") {
      return modifierNames.prefixes;
    } else {
      return modifierNames.suffixes;
    }
  }, [filterType, modifierNames, combinedUniqueNames]);

  return (
    <div className="bg-slate-800 rounded-lg ring-1 ring-slate-700">
      {/* View mode toggle */}
      <div className="flex space-x-2 mb-4 p-3">
        <button
          className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            !viewByName
              ? "bg-indigo-600 text-white"
              : "bg-slate-700 text-slate-300 hover:bg-slate-600"
          }`}
          onClick={() => handleViewModeChange(false)}
        >
          Search by Text
        </button>
        <button
          className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            viewByName
              ? "bg-indigo-600 text-white"
              : "bg-slate-700 text-slate-300 hover:bg-slate-600"
          }`}
          onClick={() => handleViewModeChange(true)}
        >
          Browse by Name
        </button>
      </div>

      {/* Browse by name interface */}
      {viewByName ? (
        <div className="px-3 pb-3">
          <div className="mb-3 flex space-x-2">
            <select
              className="bg-slate-700 p-2.5 rounded-md border-0 text-sm flex-grow ring-1 ring-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none"
              value={filterType}
              onChange={handleFilterTypeChange}
            >
              <option value="all">All Types</option>
              <option value="prefix">Prefixes Only</option>
              <option value="suffix">Suffixes Only</option>
            </select>
          </div>

          {/* Name search filter */}
          <div className="mb-3">
            <input
              type="text"
              className="w-full bg-slate-700 p-2.5 rounded-md border-0 text-sm ring-1 ring-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none"
              value={nameSearchTerm}
              onChange={(e) => setNameSearchTerm(e.target.value)}
              placeholder="Filter modifier names..."
            />
          </div>

          {/* Selection count display */}
          {selectedNames.length > 0 && (
            <div className="mb-3 px-1 py-1 bg-indigo-900/30 border border-indigo-700/50 rounded-md text-sm font-medium text-indigo-300 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1.5 ml-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              {selectedNames.length} name{selectedNames.length > 1 ? "s" : ""}{" "}
              selected
            </div>
          )}

          {/* Deduplicated name tag cloud with multi-select support */}
          <div className="flex flex-wrap gap-2 max-h-52 overflow-y-auto rounded-md px-1 py-2 custom-scrollbar">
            {nameTagsToDisplay
              .filter(
                (name) =>
                  nameSearchTerm === "" ||
                  name.toLowerCase().includes(nameSearchTerm.toLowerCase())
              )
              .map((name) => (
                <button
                  key={`name-tag-${name}`}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    selectedNames.includes(name)
                      ? "bg-indigo-600 text-white font-medium"
                      : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  }`}
                  onClick={() => handleNameSelection(name)}
                >
                  {name}
                </button>
              ))}
          </div>
        </div>
      ) : (
        /* Search by text interface */
        <div className="px-3 pb-3">
          <div className="flex">
            <input
              type="text"
              className="flex-grow bg-slate-700 p-2.5 rounded-l-md border-0 text-sm ring-1 ring-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none"
              value={searchTerm}
              onChange={handleSearchTermChange}
              placeholder="Search for modifiers..."
            />

            <select
              className="bg-slate-700 p-2.5 rounded-r-md border-0 border-l-0 text-sm ring-1 ring-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none"
              value={filterType}
              onChange={handleFilterTypeChange}
            >
              <option value="all">All</option>
              <option value="prefix">Prefixes</option>
              <option value="suffix">Suffixes</option>
            </select>
          </div>
        </div>
      )}

      {/* Group modifiers by selected name when multi-selecting */}
      {viewByName && selectedNames.length > 0 ? (
        <div className="results space-y-5 px-3 pb-3">
          {selectedNames.map((name) => (
            <div
              key={`name-group-${name}`}
              className="border-t border-slate-700 pt-4 mt-4"
            >
              <h3 className="font-medium text-amber-400 mb-3 text-base px-1">
                {name}
              </h3>

              {/* Prefix results for this name */}
              {filteredModifiers.prefixes.filter((p) => p.Name === name)
                .length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-blue-400 mb-2 text-sm px-1">
                    Prefixes (
                    {
                      filteredModifiers.prefixes.filter((p) => p.Name === name)
                        .length
                    }
                    )
                  </h4>
                  <div className="max-h-36 overflow-y-auto bg-slate-700 rounded-md ring-1 ring-slate-600 custom-scrollbar">
                    {filteredModifiers.prefixes
                      .filter((prefix) => prefix.Name === name)
                      .map((prefix, index) => (
                        <div
                          key={`prefix-${prefix.Code}-${index}`}
                          className="p-3 hover:bg-slate-600 border-b border-slate-600 text-sm cursor-pointer transition-colors"
                          onClick={() => handleAddModifier(prefix, "prefix")}
                        >
                          <div className="font-medium text-white">
                            {prefix.Name}
                          </div>
                          <div className="text-slate-300 text-xs mt-1">
                            {prefix.Mod}
                          </div>
                          {/* Show supported types in autogen mode */}
                          {searchContext === "autogen" &&
                            prefix.supportedTypes && (
                              <div className="text-slate-400 text-xs mt-1">
                                Available on: {prefix.supportedTypes.join(", ")}
                              </div>
                            )}
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Suffix results for this name */}
              {filteredModifiers.suffixes.filter(
                (s) => s.Name === name || s.Name === `of ${name}`
              ).length > 0 && (
                <div>
                  <h4 className="font-medium text-green-400 mb-2 text-sm px-1">
                    Suffixes (
                    {
                      filteredModifiers.suffixes.filter(
                        (s) => s.Name === name || s.Name === `of ${name}`
                      ).length
                    }
                    )
                  </h4>
                  <div className="max-h-36 overflow-y-auto bg-slate-700 rounded-md ring-1 ring-slate-600 custom-scrollbar">
                    {filteredModifiers.suffixes
                      .filter(
                        (suffix) =>
                          suffix.Name === name || suffix.Name === `of ${name}`
                      )
                      .map((suffix, index) => (
                        <div
                          key={`suffix-${suffix.Code}-${index}`}
                          className="p-3 hover:bg-slate-600 border-b border-slate-600 text-sm cursor-pointer transition-colors"
                          onClick={() => handleAddModifier(suffix, "suffix")}
                        >
                          <div className="font-medium text-white">
                            {suffix.Name}
                          </div>
                          <div className="text-slate-300 text-xs mt-1">
                            {suffix.Mod}
                          </div>
                          {/* Show supported types in autogen mode */}
                          {searchContext === "autogen" &&
                            suffix.supportedTypes && (
                              <div className="text-slate-400 text-xs mt-1">
                                Available on: {suffix.supportedTypes.join(", ")}
                              </div>
                            )}
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* No results for this name */}
              {filteredModifiers.prefixes.filter((p) => p.Name === name)
                .length === 0 &&
                filteredModifiers.suffixes.filter(
                  (s) => s.Name === name || s.Name === `of ${name}`
                ).length === 0 && (
                  <div className="text-slate-400 py-3 text-sm px-1">
                    No modifiers found for "{name}" with current filters
                  </div>
                )}
            </div>
          ))}
        </div>
      ) : (
        /* Standard results display when not using multi-select or when in text search mode */
        <div className="results space-y-3 px-3 pb-3">
          {/* Prefix results */}
          {filteredModifiers.prefixes.length > 0 && (
            <div>
              <h3 className="font-medium text-blue-400 mb-2 text-sm px-1">
                Prefixes ({filteredModifiers.prefixes.length})
              </h3>
              <div className="max-h-40 overflow-y-auto bg-slate-700 rounded-md ring-1 ring-slate-600 custom-scrollbar">
                {filteredModifiers.prefixes.map((prefix, index) => (
                  <div
                    key={`prefix-${prefix.Code}-${index}`}
                    className="p-2.5 hover:bg-slate-600 border-b border-slate-600 text-sm cursor-pointer transition-colors"
                    onClick={() => handleAddModifier(prefix, "prefix")}
                  >
                    <div className="font-medium text-white">{prefix.Name}</div>
                    <div className="text-slate-300 text-xs mt-1">
                      {prefix.Mod}
                    </div>
                    {/* Show supported types in autogen mode */}
                    {searchContext === "autogen" && prefix.supportedTypes && (
                      <div className="text-slate-400 text-xs mt-1">
                        Available on: {prefix.supportedTypes.join(", ")}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suffix results */}
          {filteredModifiers.suffixes.length > 0 && (
            <div>
              <h3 className="font-medium text-green-400 mb-2 text-sm px-1">
                Suffixes ({filteredModifiers.suffixes.length})
              </h3>
              <div className="max-h-40 overflow-y-auto bg-slate-700 rounded-md ring-1 ring-slate-600 custom-scrollbar">
                {filteredModifiers.suffixes.map((suffix, index) => (
                  <div
                    key={`suffix-${suffix.Code}-${index}`}
                    className="p-2.5 hover:bg-slate-600 border-b border-slate-600 text-sm cursor-pointer transition-colors"
                    onClick={() => handleAddModifier(suffix, "suffix")}
                  >
                    <div className="font-medium text-white">{suffix.Name}</div>
                    <div className="text-slate-300 text-xs mt-1">
                      {suffix.Mod}
                    </div>
                    {/* Show supported types in autogen mode */}
                    {searchContext === "autogen" && suffix.supportedTypes && (
                      <div className="text-slate-400 text-xs mt-1">
                        Available on: {suffix.supportedTypes.join(", ")}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No results message */}
          {(searchTerm || selectedNames.length > 0) &&
            filteredModifiers.prefixes.length === 0 &&
            filteredModifiers.suffixes.length === 0 && (
              <p className="text-slate-400 py-2 text-sm text-center">
                No modifiers found matching "
                {searchTerm || selectedNames.join(", ")}"
              </p>
            )}

          {/* Help text when no search */}
          {!searchTerm && selectedNames.length === 0 && (
            <p className="text-slate-400 py-2 text-sm text-center">
              Enter search terms or select modifier name(s) to see results
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Use memo to prevent unnecessary re-renders
export default React.memo(ImprovedModifierSearch);
