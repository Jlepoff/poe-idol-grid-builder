// components/builder/IdolBuilder.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import ModifierSearch from "../modifiers/ModifierSearch";
  
  // GroupedTypeButtons component to handle specific idol type creation
  const GroupedTypeButtons = ({ types, onCreateIdol }) => (
    <div className="grid grid-cols-2 gap-4 mt-4">
      {types.map(type => (
        <button
          key={type}
          className="py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md font-medium transition-colors"
          onClick={() => onCreateIdol(type)}
        >
          Create {type} Idol
        </button>
      ))}
    </div>
  );
  
  // ModifierList component to handle selected modifiers display
  const ModifierList = ({ items, onRemove, type }) => {
    if (items.length === 0) {
      return (
        <div className="p-4 bg-slate-800 rounded-md text-sm text-slate-400 text-center mb-4 ring-1 ring-slate-700">
          No {type}es selected
        </div>
      );
    }
  
    return (
      <ul className="mb-4 space-y-2">
        {items.map((item, index) => (
          <li
            key={index}
            className="bg-slate-800 p-3 rounded-md flex justify-between ring-1 ring-slate-700"
            onContextMenu={(e) => {
              e.preventDefault();
              onRemove(index);
            }}
          >
            <div>
              <div className={`text-sm font-medium ${type === 'prefix' ? 'text-blue-400' : 'text-green-400'}`}>
                {item.Name}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {item.Mod}
              </div>
            </div>
            <button
              onClick={() => onRemove(index)}
              className="text-slate-400 hover:text-slate-300 ml-2 self-start"
              title={`Remove ${type}`}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    );
  };
  
  // ErrorMessage component
  const ErrorMessage = ({ message }) => {
    if (!message) return null;
    
    return (
      <div className="bg-red-900/50 p-3 rounded-lg border border-red-800 text-red-200 text-sm">
        {message}
      </div>
    );
  };
  
  function IdolBuilder({ modData, idolTypes, onAddIdol }) {
    // Group idol types for the dropdown with size info
    const groupedIdolTypes = useMemo(() => [
      { label: "Minor (1×1)", value: "Minor" },
      { label: "Kamasan (1×2) • Noble (2×1)", value: "KamasanNoble" },
      { label: "Totemic (1×3) • Burial (3×1)", value: "TotemicBurial" },
      { label: "Conqueror (2×2)", value: "Conqueror" },
    ], []);
  
    // State for idol builder
    const [selectedType, setSelectedType] = useState("");
    const [selectedPrefixes, setSelectedPrefixes] = useState([]);
    const [selectedSuffixes, setSelectedSuffixes] = useState([]);
    const [idolName, setIdolName] = useState("");
    const [error, setError] = useState(null);
    const [errorTimeout, setErrorTimeout] = useState(null);
  
    // Search state
    const [searchState, setSearchState] = useState({
      searchTerm: "",
      filterType: "all",
      viewByName: false,
      selectedNames: [],
    });
  
    // Determine if we're using a grouped type
    const isGroupedType = useMemo(() => 
      selectedType === "KamasanNoble" || selectedType === "TotemicBurial", 
      [selectedType]
    );
    
    // Determine which specific types to show buttons for
    const specificTypes = useMemo(() => {
      if (selectedType === "KamasanNoble") return ["Kamasan", "Noble"];
      if (selectedType === "TotemicBurial") return ["Totemic", "Burial"];
      return [];
    }, [selectedType]);
  
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
  
    // Fixed function to check for exclusive modifier pairs
    const areExclusiveModifiers = useCallback((mod1, mod2) => {
      // First check if names match and are among the known exclusive modifier types
      if (!mod1 || !mod2 || mod1.Name !== mod2.Name) return { exclusive: false };
      
      const exclusiveModNames = ["Breach", "Domination", "Essence", "Harbinger", "Ambush", "Torment"];
      if (!exclusiveModNames.includes(mod1.Name)) return { exclusive: false };
      
      // Now check specific mod text patterns that should be exclusive
      const exactExclusivePairs = [
        {
          name: "Breach",
          patterns: [
            "Breaches in your Maps contain 3 additional Clasped Hands",
            "Breaches in your Maps contain 2 additional Clasped Hands"
          ]
        },
        {
          name: "Domination",
          patterns: [
            "Your Maps contain an additional Shrine",
            "Your Maps contain 2 additional Shrines"
          ]
        },
        {
          name: "Essence",
          patterns: [
            "Your Maps contain an additional Imprisoned Monster",
            "Your Maps contain 2 additional Imprisoned Monsters"
          ]
        },
        {
          name: "Harbinger",
          patterns: [
            "Your Maps contain an additional Harbinger",
            "Your Maps contain 2 additional Harbingers"
          ]
        },
        {
          name: "Ambush",
          patterns: [
            "Your Maps contain an additional Strongbox",
            "Your Maps contain 2 additional Strongboxes"
          ]
        },
        {
          name: "Torment",
          patterns: [
            "Your Maps are haunted by an additional Tormented Spirit",
            "Your Maps are haunted by 2 additional Tormented Spirits"
          ]
        }
      ];
      
      // Find the relevant pattern set for this modifier name
      const patternSet = exactExclusivePairs.find(set => set.name === mod1.Name);
      if (!patternSet) return { exclusive: false };
      
      // Check if both modifiers match patterns from the same set and are different from each other
      const mod1MatchesPattern = patternSet.patterns.includes(mod1.Mod);
      const mod2MatchesPattern = patternSet.patterns.includes(mod2.Mod);
      
      if (mod1MatchesPattern && mod2MatchesPattern && mod1.Mod !== mod2.Mod) {
        return { exclusive: true, name: patternSet.name };
      }
      
      return { exclusive: false };
    }, []);
  
    // Handle adding a modifier
    const handleAddModifier = useCallback((modifier, type) => {
      // Clear any existing error
      setError(null);
      if (errorTimeout) {
        clearTimeout(errorTimeout);
        setErrorTimeout(null);
      }
      
      if (type === "prefix") {
        // Can only have 2 prefixes max
        if (selectedPrefixes.length < 2) {
          // Check for exclusive modifiers
          for (const existingPrefix of selectedPrefixes) {
            const result = areExclusiveModifiers(existingPrefix, modifier);
            if (result.exclusive) {
              const errorMsg = `Cannot add multiple ${result.name} modifiers that add different amounts to the same idol.`;
              setError(errorMsg);
              const timeout = setTimeout(() => setError(null), 5000);
              setErrorTimeout(timeout);
              return;
            }
          }
          
          // Don't add duplicates
          if (!selectedPrefixes.some((p) => p.id === modifier.id)) {
            setSelectedPrefixes(prev => [...prev, modifier]);
          }
        }
      } else if (type === "suffix") {
        // Can only have 2 suffixes max
        if (selectedSuffixes.length < 2) {
          // Check for exclusive modifiers
          for (const existingSuffix of selectedSuffixes) {
            const result = areExclusiveModifiers(existingSuffix, modifier);
            if (result.exclusive) {
              const errorMsg = `Cannot add multiple ${result.name} modifiers that add different amounts to the same idol.`;
              setError(errorMsg);
              const timeout = setTimeout(() => setError(null), 5000);
              setErrorTimeout(timeout);
              return;
            }
          }
          
          // Don't add duplicates
          if (!selectedSuffixes.some((s) => s.id === modifier.id)) {
            setSelectedSuffixes(prev => [...prev, modifier]);
          }
        }
      }
    }, [selectedPrefixes, selectedSuffixes, areExclusiveModifiers, errorTimeout]);
  
    // Remove prefix
    const handleRemovePrefix = useCallback((index) => {
      setSelectedPrefixes(prev => prev.filter((_, i) => i !== index));
      setError(null);
    }, []);
  
    // Remove suffix
    const handleRemoveSuffix = useCallback((index) => {
      setSelectedSuffixes(prev => prev.filter((_, i) => i !== index));
      setError(null);
    }, []);
  
    // Remove a specific modifier
    const handleRemoveModifier = useCallback((modifier) => {
      if (modifier.type === "prefix") {
        setSelectedPrefixes(prev => prev.filter(p => p.id !== modifier.id));
      } else {
        setSelectedSuffixes(prev => prev.filter(s => s.id !== modifier.id));
      }
      setError(null);
    }, []);
  
    // Generate a default name based on prefixes and suffixes
    const generateIdolName = useCallback((type, prefixes, suffixes) => {
      let name = type;
  
      if (prefixes.length > 0) {
        name = `${prefixes[0].Name} ${name}`;
      }
  
      if (suffixes.length > 0) {
        name = `${name} ${suffixes[0].Name}`;
      }
  
      return name;
    }, []);
  
    // Create new idol with specific type
    const handleCreateIdol = useCallback((specificType = null) => {
      // Use either the specific type passed in or the selected type
      const idolType = specificType || selectedType;
      
      if (!idolType) return;
  
      // Generate a name if not provided
      const name = idolName || generateIdolName(idolType, selectedPrefixes, selectedSuffixes);
  
      const newIdol = {
        type: idolType,
        name,
        prefixes: selectedPrefixes,
        suffixes: selectedSuffixes,
      };
  
      onAddIdol(newIdol);
  
      // Reset form
      setIdolName("");
      setSelectedPrefixes([]);
      setSelectedSuffixes([]);
    }, [selectedType, idolName, selectedPrefixes, selectedSuffixes, generateIdolName, onAddIdol]);
  
    // Get type-specific modifiers
    const getTypeSpecificMods = useCallback(() => {
      if (!selectedType || !modData.prefixes || !modData.suffixes) {
        return { prefixes: {}, suffixes: {} };
      }
  
      // For grouped types, use just one of the types since they share the same modifiers
      if (selectedType === "KamasanNoble") {
        return {
          prefixes: { KamasanNoble: modData.prefixes["Kamasan"] || [] },
          suffixes: { KamasanNoble: modData.suffixes["Kamasan"] || [] }
        };
      } else if (selectedType === "TotemicBurial") {
        return {
          prefixes: { TotemicBurial: modData.prefixes["Burial"] || [] },
          suffixes: { TotemicBurial: modData.suffixes["Burial"] || [] }
        };
      }
  
      return {
        prefixes: { [selectedType]: modData.prefixes[selectedType] || [] },
        suffixes: { [selectedType]: modData.suffixes[selectedType] || [] },
      };
    }, [selectedType, modData.prefixes, modData.suffixes]);
  
    // Track search state changes
    const handleSearchUpdate = useCallback((newState) => {
      setSearchState(newState);
    }, []);
  
    return (
      <div className="bg-slate-900 p-5 rounded-xl shadow-sm">
        <h2 className="text-xl font-bold mb-1 text-white">Idol Builder</h2>
        <p className="text-sm text-slate-400 mb-4">Create custom idols with specific modifiers to add to your inventory.</p>
  
        <div className="space-y-5">
          {/* Error message */}
          <ErrorMessage message={error} />
        
          {/* Idol Type Selection */}
          <div>
            <label className="block mb-2 text-sm text-slate-300">Idol Type</label>
            <select
              className="w-full bg-slate-800 p-3 rounded-md border-0 text-sm ring-1 ring-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="">Select Idol Type</option>
              {groupedIdolTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
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
                <ModifierList 
                  items={selectedPrefixes}
                  onRemove={handleRemovePrefix}
                  type="prefix"
                />
              </div>
  
              {/* Selected Suffixes */}
              <div className="border-t border-slate-800 pt-4">
                <h3 className="font-medium mb-2 text-sm text-slate-300">
                  Selected Suffixes ({selectedSuffixes.length}/2)
                </h3>
                <ModifierList 
                  items={selectedSuffixes}
                  onRemove={handleRemoveSuffix}
                  type="suffix"
                />
              </div>
  
              {/* Modifier Search */}
              <div className="border-t border-slate-800 pt-4">
                <h3 className="font-medium mb-2 text-sm text-slate-300">Search & Add Modifiers</h3>
                <ModifierSearch
                  modData={selectedType ? getTypeSpecificMods() : modData}
                  onAddModifier={handleAddModifier}
                  onRemoveModifier={handleRemoveModifier}
                  selectedType={selectedType}
                  initialState={searchState}
                  onSearchUpdate={handleSearchUpdate}
                  searchContext="builder"
                  selectedPrefixes={selectedPrefixes}
                  selectedSuffixes={selectedSuffixes}
                />
              </div>
  
              {/* Create Buttons */}
              {isGroupedType ? (
                <GroupedTypeButtons 
                  types={specificTypes} 
                  onCreateIdol={handleCreateIdol} 
                />
              ) : (
                <button
                  className="w-full mt-4 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md font-medium transition-colors"
                  onClick={() => handleCreateIdol()}
                  disabled={!selectedType}
                >
                  Create Idol
                </button>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

export default IdolBuilder;