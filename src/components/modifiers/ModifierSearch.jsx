// components/modifiers/ModifierSearch.jsx
import React, { useState, useEffect, useMemo, useCallback, memo } from "react";
import { useModifiers } from "../../hooks/useModifiers";
import ModifierCard from "./ModifierCard";

// Extracted for reusability and cleaner render method
const ModeToggleButtons = memo(({ viewByName, handleViewModeChange }) => (
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
));

ModeToggleButtons.displayName = 'ModeToggleButtons';

const NameTag = memo(({ item, isSelected, isFullySelected, onClick }) => (
  <button
    className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
      isSelected
        ? `bg-indigo-600 text-white font-medium ${
            !isFullySelected ? "ring-2 ring-indigo-300" : ""
          }`
        : "bg-slate-700 text-slate-300 hover:bg-slate-600"
    }`}
    onClick={() => onClick(item)}
  >
    {item.name}
  </button>
));

NameTag.displayName = 'NameTag';

const FilterTypeSelect = memo(({ filterType, onChange }) => (
  <select
    className="bg-slate-700 p-2.5 rounded-md border-0 text-sm flex-grow ring-1 ring-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none"
    value={filterType}
    onChange={onChange}
  >
    <option value="all">All Types</option>
    <option value="prefix">Prefixes Only</option>
    <option value="suffix">Suffixes Only</option>
  </select>
));

FilterTypeSelect.displayName = 'FilterTypeSelect';

const SelectionIndicator = memo(({ count, onClear }) => (
  <div className="mb-3 px-1 py-1 bg-indigo-900/30 border border-indigo-700/50 rounded-md text-sm font-medium text-indigo-300 flex items-center justify-between">
    <div className="flex items-center">
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
      {count} name{count > 1 ? "s" : ""} selected
    </div>
    <button
      onClick={onClear}
      className="bg-indigo-700 hover:bg-indigo-600 px-2 py-0.5 rounded text-xs text-white transition-colors mr-1"
    >
      Reset
    </button>
  </div>
));

SelectionIndicator.displayName = 'SelectionIndicator';

// Main ModifierSearch component
const ModifierSearch = ({
  modData,
  onAddModifier,
  onRemoveModifier = null,
  modifierList = [],
  selectedType = "",
  initialState = null,
  onSearchUpdate = null,
  searchContext = "builder",
  selectedPrefixes = [],
  selectedSuffixes = [],
}) => {
  // State initialization from props
  const [searchTerm, setSearchTerm] = useState(initialState?.searchTerm || "");
  const [filterType, setFilterType] = useState(initialState?.filterType || "all");
  const [viewByName, setViewByName] = useState(initialState?.viewByName || false);
  const [selectedNames, setSelectedNames] = useState(initialState?.selectedNames || []);
  const [nameSearchTerm, setNameSearchTerm] = useState("");
  const [selectedGroupNames, setSelectedGroupNames] = useState([]);

  const { modifierGroups, nameToGroupMap } = useModifiers();

  // Memoized handlers
  const handleSearchTermChange = useCallback(e => setSearchTerm(e.target.value), []);
  const handleFilterTypeChange = useCallback(e => setFilterType(e.target.value), []);
  const handleNameSearchChange = useCallback(e => setNameSearchTerm(e.target.value), []);
  
  const handleClearSelections = useCallback(() => {
    setSelectedNames([]);
    setSelectedGroupNames([]);
  }, []);

  const handleViewModeChange = useCallback(mode => {
    setViewByName(mode);
    setSelectedNames([]);
  }, []);

  // Handle name selection for tag cloud with optimized logic
  const handleNameSelection = useCallback(item => {
    if (item.isGroup) {
      const groupNames = modifierGroups[item.name] || [];
      const allSelected = groupNames.every(name => selectedNames.includes(name));

      if (allSelected) {
        setSelectedNames(prev => prev.filter(name => !groupNames.includes(name)));
        setSelectedGroupNames(prev => prev.filter(name => name !== item.name));
      } else {
        setSelectedNames(prev => {
          const newNames = [...prev];
          groupNames.forEach(name => {
            if (!newNames.includes(name)) newNames.push(name);
          });
          return newNames;
        });
        setSelectedGroupNames(prev => 
          prev.includes(item.name) ? prev : [...prev, item.name]
        );
      }
    } else {
      setSelectedNames(prev => 
        prev.includes(item.name) 
          ? prev.filter(n => n !== item.name) 
          : [...prev, item.name]
      );
    }
  }, [modifierGroups, selectedNames]);

  // Update parent with search state changes
  useEffect(() => {
    if (!onSearchUpdate) return;
    
    const timeoutId = setTimeout(() => {
      onSearchUpdate({
        searchTerm,
        filterType,
        viewByName,
        selectedNames,
      });
    }, 50);
    
    return () => clearTimeout(timeoutId);
  }, [searchTerm, filterType, viewByName, selectedNames, onSearchUpdate]);

  // Get modifier count for display - memoized for performance
  const getModifierCount = useCallback(modifier => {
    if (searchContext === "builder" || searchContext === "trade") {
      // Determine if this is a prefix by checking modData
      const isPrefixMod = filterType === "prefix" || 
        (filterType === "all" && modData.prefixes && 
          Object.values(modData.prefixes).some(list => 
            list.some(p => p.id === modifier.id)));
      
      if (isPrefixMod) {
        return selectedPrefixes.some(p => p.id === modifier.id) ? { count: 1 } : null;
      } else {
        return selectedSuffixes.some(s => s.id === modifier.id) ? { count: 1 } : null;
      }
    } else {
      return modifierList.find(m => m.id === modifier.id) || null;
    }
  }, [filterType, modData, selectedPrefixes, selectedSuffixes, modifierList, searchContext]);

  // Memoized data preparation
  const modifierNames = useMemo(() => {
    if (!modData.prefixes || !modData.suffixes)
      return { prefixes: [], suffixes: [] };

    const prefixNames = new Set();
    const suffixNames = new Set();

    if (searchContext === "builder" && selectedType) {
      if (modData.prefixes[selectedType]) {
        modData.prefixes[selectedType].forEach(mod => prefixNames.add(mod.Name));
      }
      if (modData.suffixes[selectedType]) {
        modData.suffixes[selectedType].forEach(mod => suffixNames.add(mod.Name));
      }
    } else {
      Object.values(modData.prefixes).forEach(typeModifiers => {
        typeModifiers.forEach(mod => prefixNames.add(mod.Name));
      });
      Object.values(modData.suffixes).forEach(typeModifiers => {
        typeModifiers.forEach(mod => suffixNames.add(mod.Name));
      });
    }

    return {
      prefixes: Array.from(prefixNames).sort(),
      suffixes: Array.from(suffixNames).sort(),
    };
  }, [modData, selectedType, searchContext]);

  // Combined unique names for "all types" view
  const combinedUniqueNames = useMemo(() => {
    if (filterType !== "all") return [];
    const uniqueNames = new Set([
      ...modifierNames.prefixes,
      ...modifierNames.suffixes,
    ]);
    return Array.from(uniqueNames).sort();
  }, [modifierNames.prefixes, modifierNames.suffixes, filterType]);

  // Helper function for sorting by relevance - extracted for clarity
  const sortByRelevance = useCallback((items, searchTerm) => {
    const lowerTerm = searchTerm.toLowerCase();
    return items.sort((a, b) => {
      const aNameMatch = a.Name.toLowerCase().indexOf(lowerTerm);
      const bNameMatch = b.Name.toLowerCase().indexOf(lowerTerm);
      if (aNameMatch !== -1 && bNameMatch === -1) return -1;
      if (aNameMatch === -1 && bNameMatch !== -1) return 1;
      if (aNameMatch !== -1 && bNameMatch !== -1) return aNameMatch - bNameMatch;
      return a.Name.localeCompare(b.Name);
    }).slice(0, 50);
  }, []);

  // Optimized filtering logic
  const filteredModifiers = useMemo(() => {
    if (!modData.prefixes || !modData.suffixes)
      return { prefixes: [], suffixes: [] };

    // Autogen context filtering
    if (searchContext === "autogen") {
      // By name with selections
      if (viewByName && selectedNames.length > 0) {
        const result = { prefixes: [], suffixes: [] };
        
        selectedNames.forEach(nameFilter => {
          // Filter prefixes
          if (filterType === "all" || filterType === "prefix") {
            const combinedPrefixes = [];
            const modsSeen = new Set();
            
            Object.entries(modData.prefixes).forEach(([_, prefixList]) => {
              prefixList.forEach(prefix => {
                if (prefix.Name === nameFilter && !modsSeen.has(prefix.Mod)) {
                  modsSeen.add(prefix.Mod);
                  const supportedTypes = Object.entries(modData.prefixes)
                    .filter(([_, typeList]) => 
                      typeList.some(p => p.Mod === prefix.Mod)
                    )
                    .map(([type]) => type);
                  combinedPrefixes.push({ ...prefix, supportedTypes });
                }
              });
            });
            result.prefixes = [...result.prefixes, ...combinedPrefixes];
          }

          // Filter suffixes
          if (filterType === "all" || filterType === "suffix") {
            const combinedSuffixes = [];
            const modsSeen = new Set();
            
            Object.entries(modData.suffixes).forEach(([_, suffixList]) => {
              suffixList.forEach(suffix => {
                if (
                  (suffix.Name === nameFilter || suffix.Name === `of ${nameFilter}`) && 
                  !modsSeen.has(suffix.Mod)
                ) {
                  modsSeen.add(suffix.Mod);
                  const supportedTypes = Object.entries(modData.suffixes)
                    .filter(([_, typeList]) => 
                      typeList.some(s => s.Mod === suffix.Mod)
                    )
                    .map(([type]) => type);
                  combinedSuffixes.push({ ...suffix, supportedTypes });
                }
              });
            });
            result.suffixes = [...result.suffixes, ...combinedSuffixes];
          }
        });
        return result;
      } 
      // By text search
      else if (searchTerm) {
        const lowerTerm = searchTerm.toLowerCase();
        const result = { prefixes: [], suffixes: [] };
        
        // Find matching prefixes
        if (filterType === "all" || filterType === "prefix") {
          const combinedPrefixes = [];
          const prefixModsSeen = new Set();
          
          Object.entries(modData.prefixes).forEach(([_, prefixList]) => {
            prefixList.forEach(prefix => {
              if (
                (prefix.Name.toLowerCase().includes(lowerTerm) || 
                 prefix.Mod.toLowerCase().includes(lowerTerm)) &&
                !prefixModsSeen.has(prefix.Mod)
              ) {
                prefixModsSeen.add(prefix.Mod);
                const supportedTypes = Object.entries(modData.prefixes)
                  .filter(([_, typeList]) => 
                    typeList.some(p => p.Mod === prefix.Mod)
                  )
                  .map(([type]) => type);
                combinedPrefixes.push({ ...prefix, supportedTypes });
              }
            });
          });
          
          result.prefixes = sortByRelevance(combinedPrefixes, searchTerm);
        }
        
        // Find matching suffixes
        if (filterType === "all" || filterType === "suffix") {
          const combinedSuffixes = [];
          const suffixModsSeen = new Set();
          
          Object.entries(modData.suffixes).forEach(([_, suffixList]) => {
            suffixList.forEach(suffix => {
              if (
                (suffix.Name.toLowerCase().includes(lowerTerm) || 
                 suffix.Mod.toLowerCase().includes(lowerTerm)) &&
                !suffixModsSeen.has(suffix.Mod)
              ) {
                suffixModsSeen.add(suffix.Mod);
                const supportedTypes = Object.entries(modData.suffixes)
                  .filter(([_, typeList]) => 
                    typeList.some(s => s.Mod === suffix.Mod)
                  )
                  .map(([type]) => type);
                combinedSuffixes.push({ ...suffix, supportedTypes });
              }
            });
          });
          
          result.suffixes = sortByRelevance(combinedSuffixes, searchTerm);
        }
        
        return result;
      }
      
      return { prefixes: [], suffixes: [] };
    }

    // Builder/Trade context filtering
    
    // By name with selections
    if (viewByName && selectedNames.length > 0) {
      const result = { prefixes: [], suffixes: [] };
      
      selectedNames.forEach(nameFilter => {
        if (filterType === "all" || filterType === "prefix") {
          if (
            searchContext === "builder" &&
            selectedType &&
            modData.prefixes[selectedType]
          ) {
            const filtered = modData.prefixes[selectedType].filter(
              mod => mod.Name === nameFilter
            );
            result.prefixes = [...result.prefixes, ...filtered];
          } else {
            Object.values(modData.prefixes).forEach(typeModifiers => {
              const filtered = typeModifiers.filter(
                mod => mod.Name === nameFilter
              );
              result.prefixes = [...result.prefixes, ...filtered];
            });
          }
        }

        if (filterType === "all" || filterType === "suffix") {
          if (
            searchContext === "builder" &&
            selectedType &&
            modData.suffixes[selectedType]
          ) {
            const filtered = modData.suffixes[selectedType].filter(
              mod => mod.Name === nameFilter || mod.Name === `of ${nameFilter}`
            );
            result.suffixes = [...result.suffixes, ...filtered];
          } else {
            Object.values(modData.suffixes).forEach(typeModifiers => {
              const filtered = typeModifiers.filter(
                mod => mod.Name === nameFilter || mod.Name === `of ${nameFilter}`
              );
              result.suffixes = [...result.suffixes, ...filtered];
            });
          }
        }
      });
      
      return result;
    }

    // By text search
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      const result = { prefixes: [], suffixes: [] };
      
      if (filterType === "all" || filterType === "prefix") {
        let filteredPrefixes = [];
        
        if (
          searchContext === "builder" &&
          selectedType &&
          modData.prefixes[selectedType]
        ) {
          filteredPrefixes = modData.prefixes[selectedType].filter(
            prefix =>
              prefix.Name.toLowerCase().includes(lowerTerm) ||
              prefix.Mod.toLowerCase().includes(lowerTerm)
          );
        } else {
          const allPrefixes = Object.values(modData.prefixes).flat();
          filteredPrefixes = allPrefixes.filter(
            prefix =>
              prefix.Name.toLowerCase().includes(lowerTerm) ||
              prefix.Mod.toLowerCase().includes(lowerTerm)
          );
        }
        
        result.prefixes = sortByRelevance(filteredPrefixes, searchTerm);
      }

      if (filterType === "all" || filterType === "suffix") {
        let filteredSuffixes = [];
        
        if (
          searchContext === "builder" &&
          selectedType &&
          modData.suffixes[selectedType]
        ) {
          filteredSuffixes = modData.suffixes[selectedType].filter(
            suffix =>
              suffix.Name.toLowerCase().includes(lowerTerm) ||
              suffix.Mod.toLowerCase().includes(lowerTerm)
          );
        } else {
          const allSuffixes = Object.values(modData.suffixes).flat();
          filteredSuffixes = allSuffixes.filter(
            suffix =>
              suffix.Name.toLowerCase().includes(lowerTerm) ||
              suffix.Mod.toLowerCase().includes(lowerTerm)
          );
        }
        
        result.suffixes = sortByRelevance(filteredSuffixes, searchTerm);
      }

      return result;
    }

    return { prefixes: [], suffixes: [] };
  }, [
    searchTerm,
    filterType,
    modData,
    selectedType,
    viewByName,
    selectedNames,
    searchContext,
    sortByRelevance
  ]);

  // Name tags for display in the cloud
  const nameTagsToDisplay = useMemo(() => {
    const getGroupForName = name => nameToGroupMap[name] || null;
    let names = [];
    
    if (filterType === "all") names = combinedUniqueNames;
    else if (filterType === "prefix") names = modifierNames.prefixes;
    else names = modifierNames.suffixes;

    const result = [];
    const processedGroups = new Set();

    names.forEach(name => {
      const group = getGroupForName(name);
      if (group && !processedGroups.has(group)) {
        result.push({ isGroup: true, name: group });
        processedGroups.add(group);
      } else if (!group) {
        result.push({ isGroup: false, name });
      }
    });

    return result.sort((a, b) => a.name.localeCompare(b.name));
  }, [filterType, modifierNames, combinedUniqueNames, nameToGroupMap]);

  // Filter name tags based on search
  const filteredNameTags = useMemo(() => {
    if (nameSearchTerm === "") return nameTagsToDisplay;
    
    const lowerSearchTerm = nameSearchTerm.toLowerCase();
    return nameTagsToDisplay.filter(item => {
      if (item.isGroup) {
        return (
          item.name.toLowerCase().includes(lowerSearchTerm) ||
          (modifierGroups[item.name] || []).some(name =>
            name.toLowerCase().includes(lowerSearchTerm)
          )
        );
      }
      return item.name.toLowerCase().includes(lowerSearchTerm);
    });
  }, [nameTagsToDisplay, nameSearchTerm, modifierGroups]);

  // Calculate selection count for display
  const selectionCount = useMemo(() => {
    return (
      selectedGroupNames.length +
      selectedNames.filter(
        name =>
          !selectedGroupNames.some(group =>
            (modifierGroups[group] || []).includes(name)
          )
      ).length
    );
  }, [selectedNames, selectedGroupNames, modifierGroups]);

  // Render name selection view
  const renderNameSelectionView = () => (
    <>
      <div className="mb-3 flex space-x-2">
        <FilterTypeSelect filterType={filterType} onChange={handleFilterTypeChange} />
      </div>

      {/* Name search filter */}
      <div className="mb-3">
        <input
          type="text"
          className="w-full bg-slate-700 p-2.5 rounded-md border-0 text-sm ring-1 ring-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none"
          value={nameSearchTerm}
          onChange={handleNameSearchChange}
          placeholder="Filter modifier names..."
        />
      </div>

      {/* Selection count display */}
      {selectionCount > 0 && (
        <SelectionIndicator count={selectionCount} onClear={handleClearSelections} />
      )}

      {/* Name tag cloud */}
      <div className="flex flex-wrap gap-2 max-h-52 overflow-y-auto rounded-md px-1 py-2 custom-scrollbar">
        {filteredNameTags.map(item => {
          const isSelected = item.isGroup
            ? (modifierGroups[item.name] || []).some(name =>
                selectedNames.includes(name)
              )
            : selectedNames.includes(item.name);

          const isFullySelected = item.isGroup
            ? (modifierGroups[item.name] || []).every(name =>
                selectedNames.includes(name)
              )
            : isSelected;

          return (
            <NameTag
              key={`name-tag-${item.isGroup ? "group-" : ""}${item.name}`}
              item={item}
              isSelected={isSelected}
              isFullySelected={isFullySelected}
              onClick={handleNameSelection}
            />
          );
        })}
      </div>
    </>
  );

  // Render text search view
  const renderTextSearchView = () => (
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
  );

  // Render results by name
  const renderResultsByName = () => (
    <div className="space-y-5 px-3 pb-3">
      {Array.from(new Set(selectedNames))
        .sort()
        .map(name => {
          const prefixesForName = filteredModifiers.prefixes.filter(p => p.Name === name);
          const suffixesForName = filteredModifiers.suffixes.filter(
            s => s.Name === name || s.Name === `of ${name}`
          );
          
          const hasModifiers = prefixesForName.length > 0 || suffixesForName.length > 0;
          
          return (
            <div
              key={`name-group-${name}`}
              className="border-t border-slate-700 pt-4 mt-4"
            >
              <h3 className="font-medium text-amber-400 mb-3 text-base px-1">
                {name}
              </h3>
              {hasModifiers ? (
                <div className="max-h-[400px] overflow-y-auto p-2 custom-scrollbar">
                  <div className="grid grid-cols-2 gap-2">
                    {prefixesForName.map((prefix, index) => (
                      <ModifierCard
                        key={`prefix-${prefix.id}-${index}`}
                        modifier={{ ...prefix, type: "prefix" }}
                        inModifierList={getModifierCount(prefix)}
                        searchContext={searchContext}
                        onClick={onAddModifier}
                        onRemove={onRemoveModifier}
                      />
                    ))}
                    {suffixesForName.map((suffix, index) => (
                      <ModifierCard
                        key={`suffix-${suffix.id}-${index}`}
                        modifier={{ ...suffix, type: "suffix" }}
                        inModifierList={getModifierCount(suffix)}
                        searchContext={searchContext}
                        onClick={onAddModifier}
                        onRemove={onRemoveModifier}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-slate-400 py-3 text-sm px-1">
                  No modifiers found for "{name}" with current idol type
                </div>
              )}
            </div>
          );
        })}
    </div>
  );

  // Render search results
  const renderSearchResults = () => {
    const hasPrefixes = filteredModifiers.prefixes.length > 0;
    const hasSuffixes = filteredModifiers.suffixes.length > 0;
    const hasSearch = searchTerm || selectedNames.length > 0;
    const noResults = hasSearch && !hasPrefixes && !hasSuffixes;
    
    return (
      <div className="space-y-4 px-3 pb-3">
        {/* Prefix Section */}
        {hasPrefixes && (
          <div>
            <h3 className="font-medium text-blue-400 text-sm px-1 mb-2">
              Prefixes ({filteredModifiers.prefixes.length})
            </h3>
            <div className="max-h-[400px] overflow-y-auto p-2 custom-scrollbar">
              <div className="grid grid-cols-2 gap-2">
                {filteredModifiers.prefixes.map((prefix, index) => (
                  <ModifierCard
                    key={`prefix-${prefix.id}-${index}`}
                    modifier={{ ...prefix, type: "prefix" }}
                    inModifierList={getModifierCount(prefix)}
                    searchContext={searchContext}
                    onClick={onAddModifier}
                    onRemove={onRemoveModifier}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Suffix Section */}
        {hasSuffixes && (
          <div>
            <h3 className="font-medium text-green-400 text-sm px-1 mb-2">
              Suffixes ({filteredModifiers.suffixes.length})
            </h3>
            <div className="max-h-[400px] overflow-y-auto p-2 custom-scrollbar">
              <div className="grid grid-cols-2 gap-2">
                {filteredModifiers.suffixes.map((suffix, index) => (
                  <ModifierCard
                    key={`suffix-${suffix.id}-${index}`}
                    modifier={{ ...suffix, type: "suffix" }}
                    inModifierList={getModifierCount(suffix)}
                    searchContext={searchContext}
                    onClick={onAddModifier}
                    onRemove={onRemoveModifier}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* No results message */}
        {noResults && (
          <p className="text-slate-400 py-2 text-sm text-center">
            No modifiers found matching "{searchTerm || selectedNames.join(", ")}"
          </p>
        )}

        {/* Help text when no search */}
        {!hasSearch && (
          <p className="text-slate-400 py-2 text-sm text-center">
            Enter search terms or select modifier name(s) to see results
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="bg-slate-800 rounded-lg ring-1 ring-slate-700">
      {/* View mode toggle */}
      <ModeToggleButtons viewByName={viewByName} handleViewModeChange={handleViewModeChange} />

      {/* Browse by name interface */}
      {viewByName ? (
        <div className="px-3 pb-3">
          {renderNameSelectionView()}
        </div>
      ) : (
        /* Search by text interface */
        <div className="px-3 pb-3">
          {renderTextSearchView()}
        </div>
      )}

      {/* Results display */}
      {viewByName && selectedNames.length > 0 
        ? renderResultsByName() 
        : renderSearchResults()}
    </div>
  );
};

export default memo(ModifierSearch);