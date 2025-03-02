// components/ImprovedModifierSearch.jsx
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
  const [nameFilter, setNameFilter] = useState(initialState?.nameFilter || "");
  const [nameSearchTerm, setNameSearchTerm] = useState("");

  // Update parent when search state changes
  const updateParent = useCallback(() => {
    if (onSearchUpdate) {
      onSearchUpdate({
        searchTerm,
        filterType,
        viewByName,
        nameFilter,
      });
    }
  }, [onSearchUpdate, searchTerm, filterType, viewByName, nameFilter]);

  // Send updates when search parameters change
  useEffect(() => {
    const timeoutId = setTimeout(updateParent, 50);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, filterType, viewByName, nameFilter, updateParent]);

  // Event handlers
  const handleSearchTermChange = (e) => setSearchTerm(e.target.value);
  const handleFilterTypeChange = (e) => setFilterType(e.target.value);

  const handleViewModeChange = (mode) => {
    setViewByName(mode);
    setNameFilter(""); // Reset name filter when changing view mode
  };

  const handleNameFilterChange = (name) => setNameFilter(name);

  // Get all unique modifier names for browsing
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

  // Filter modifiers based on search criteria
  const filteredModifiers = useMemo(() => {
    if (!modData.prefixes || !modData.suffixes)
      return { prefixes: [], suffixes: [] };

    // Auto-generate search context
    if (searchContext === "autogen") {
      // When browsing by name in auto-generate mode
      if (viewByName && nameFilter) {
        const combinedPrefixes = [];
        const modsSeen = new Set();

        // Collect unique prefixes by Mod text across all idol types
        Object.entries(modData.prefixes).forEach(([typeName, prefixList]) => {
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
        });

        // Same for suffixes
        const combinedSuffixes = [];
        modsSeen.clear();

        Object.entries(modData.suffixes).forEach(([typeName, suffixList]) => {
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
        });

        return {
          prefixes: combinedPrefixes,
          suffixes: combinedSuffixes,
        };
      }
      // When searching by text in auto-generate mode
      else if (searchTerm) {
        const lowerTerm = searchTerm.toLowerCase();

        // Get unique prefixes across all idol types
        const combinedPrefixes = [];
        const prefixModsSeen = new Set();

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

        // Do the same for suffixes
        const combinedSuffixes = [];
        const suffixModsSeen = new Set();

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
    // If viewing by name
    if (viewByName && nameFilter) {
      const result = { prefixes: [], suffixes: [] };

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
          result.prefixes = filtered;
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
            (mod) => mod.Name === nameFilter || mod.Name === `of ${nameFilter}`
          );
          result.suffixes = filtered;
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
    nameFilter,
    searchContext,
  ]);

  // Handler for adding a modifier
  const handleAddModifier = useCallback(
    (modifier, type) => {
      onAddModifier(modifier, type);
    },
    [onAddModifier]
  );

  return (
    <div className="bg-gray-800 rounded-lg">
      {/* View mode toggle */}
      <div className="flex space-x-4 mb-4">
        <button
          className={`px-3 py-1.5 rounded font-medium ${
            !viewByName ? "bg-blue-600" : "bg-gray-700"
          }`}
          onClick={() => handleViewModeChange(false)}
        >
          Search by Text
        </button>
        <button
          className={`px-3 py-1.5 rounded font-medium ${
            viewByName ? "bg-blue-600" : "bg-gray-700"
          }`}
          onClick={() => handleViewModeChange(true)}
        >
          Browse by Name
        </button>
      </div>

      {/* Browse by name interface */}
      {viewByName ? (
        <div className="mb-4">
          <div className="mb-2 flex space-x-4">
            <select
              className="bg-gray-700 p-2 rounded border border-gray-600 flex-grow"
              value={filterType}
              onChange={handleFilterTypeChange}
            >
              <option value="all">All Types</option>
              <option value="prefix">Prefixes Only</option>
              <option value="suffix">Suffixes Only</option>
            </select>
          </div>

          {/* Name search filter */}
          <div className="mb-2">
            <input
              type="text"
              className="w-full bg-gray-700 p-2 rounded border border-gray-600"
              value={nameSearchTerm}
              onChange={(e) => setNameSearchTerm(e.target.value)}
              placeholder="Filter modifier names..."
            />
          </div>

          {/* Name tag cloud */}
          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
            {/* Show prefix names */}
            {filterType !== "suffix" &&
              modifierNames.prefixes
                .filter(
                  (name) =>
                    nameSearchTerm === "" ||
                    name.toLowerCase().includes(nameSearchTerm.toLowerCase())
                )
                .map((name) => (
                  <button
                    key={`prefix-name-${name}`}
                    className={`px-2 py-1 text-sm rounded ${
                      nameFilter === name ? "bg-blue-600" : "bg-gray-700"
                    }`}
                    onClick={() => handleNameFilterChange(name)}
                  >
                    {name}
                  </button>
                ))}

            {/* Show suffix names */}
            {filterType !== "prefix" &&
              modifierNames.suffixes
                .filter(
                  (name) =>
                    nameSearchTerm === "" ||
                    name.toLowerCase().includes(nameSearchTerm.toLowerCase())
                )
                .map((name) => (
                  <button
                    key={`suffix-name-${name}`}
                    className={`px-2 py-1 text-sm rounded ${
                      nameFilter === name ? "bg-blue-600" : "bg-gray-700"
                    }`}
                    onClick={() => handleNameFilterChange(name)}
                  >
                    {name}
                  </button>
                ))}
          </div>
        </div>
      ) : (
        /* Search by text interface */
        <div className="mb-4">
          <div className="flex">
            <input
              type="text"
              className="flex-grow bg-gray-700 p-2 rounded-l border border-gray-600"
              value={searchTerm}
              onChange={handleSearchTermChange}
              placeholder="Search for modifiers..."
            />

            <select
              className="bg-gray-700 p-2 rounded-r border border-l-0 border-gray-600"
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

      {/* Results display */}
      <div className="results space-y-4">
        {/* Prefix results */}
        {filteredModifiers.prefixes.length > 0 && (
          <div>
            <h3 className="font-semibold text-yellow-400 mb-2">
              Prefixes ({filteredModifiers.prefixes.length})
            </h3>
            <div className="max-h-40 overflow-y-auto bg-gray-700 rounded">
              {filteredModifiers.prefixes.map((prefix, index) => (
                <div
                  key={`prefix-${prefix.Code}-${index}`}
                  className="p-2 hover:bg-gray-600 border-b border-gray-600 text-sm cursor-pointer"
                  onClick={() => handleAddModifier(prefix, "prefix")}
                >
                  <div className="font-medium">{prefix.Name}</div>
                  <div className="text-gray-300 text-xs">{prefix.Mod}</div>
                  {/* Show supported types in autogen mode */}
                  {searchContext === "autogen" && prefix.supportedTypes && (
                    <div className="text-gray-400 text-xs">
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
            <h3 className="font-semibold text-yellow-400 mb-2">
              Suffixes ({filteredModifiers.suffixes.length})
            </h3>
            <div className="max-h-40 overflow-y-auto bg-gray-700 rounded">
              {filteredModifiers.suffixes.map((suffix, index) => (
                <div
                  key={`suffix-${suffix.Code}-${index}`}
                  className="p-2 hover:bg-gray-600 border-b border-gray-600 text-sm cursor-pointer"
                  onClick={() => handleAddModifier(suffix, "suffix")}
                >
                  <div className="font-medium">{suffix.Name}</div>
                  <div className="text-gray-300 text-xs">{suffix.Mod}</div>
                  {/* Show supported types in autogen mode */}
                  {searchContext === "autogen" && suffix.supportedTypes && (
                    <div className="text-gray-400 text-xs">
                      Available on: {suffix.supportedTypes.join(", ")}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No results message */}
        {(searchTerm || nameFilter) &&
          filteredModifiers.prefixes.length === 0 &&
          filteredModifiers.suffixes.length === 0 && (
            <p className="text-gray-400">
              No modifiers found matching "{searchTerm || nameFilter}"
            </p>
          )}

        {/* Help text when no search */}
        {!searchTerm && !nameFilter && (
          <p className="text-gray-400">
            Enter search terms or select a modifier name to see results
          </p>
        )}
      </div>
    </div>
  );
}

// Use memo to prevent unnecessary re-renders
export default React.memo(ImprovedModifierSearch);
