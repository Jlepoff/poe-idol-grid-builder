// components/trade/TradeGenerator.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import ModifierSearch from "../modifiers/ModifierSearch";
import { generateTradeUrlWithMultipleModifiers } from "../../utils/trade/tradeUtils";

// Constants
const ERROR_DISPLAY_DURATION = 5000;

// Idol type groupings
const GROUPED_IDOL_TYPES = [
  { label: "Minor (1×1)", value: "Minor" },
  { label: "Kamasan (1×2) • Noble (2×1)", value: "KamasanNoble" },
  { label: "Totemic (1×3) • Burial (3×1)", value: "TotemicBurial" },
  { label: "Conqueror (2×2)", value: "Conqueror" },
];

// Type to specific types mapping
const TYPE_MAPPINGS = {
  KamasanNoble: ["Kamasan", "Noble"],
  TotemicBurial: ["Totemic", "Burial"]
};

const TradeGenerator = ({ modData, idolTypes }) => {
  // State management
  const [selectedType, setSelectedType] = useState("");
  const [selectedPrefixes, setSelectedPrefixes] = useState([]);
  const [selectedSuffixes, setSelectedSuffixes] = useState([]);
  const [error, setError] = useState(null);
  const [errorTimeout, setErrorTimeout] = useState(null);
  const [searchState, setSearchState] = useState({
    searchTerm: "",
    filterType: "all",
    viewByName: false,
    selectedNames: [],
  });

  // Derived state
  const isGroupedType = useMemo(() => 
    selectedType === "KamasanNoble" || selectedType === "TotemicBurial", 
    [selectedType]
  );
  
  const specificTypes = useMemo(() => 
    TYPE_MAPPINGS[selectedType] || [], 
    [selectedType]
  );

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

  // Error handling
  const displayError = useCallback((message) => {
    setError(message);
    const timeout = setTimeout(() => setError(null), ERROR_DISPLAY_DURATION);
    setErrorTimeout(timeout);
    return timeout;
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    if (errorTimeout) {
      clearTimeout(errorTimeout);
      setErrorTimeout(null);
    }
  }, [errorTimeout]);

  // Get type-specific modifiers
  const typeSpecificMods = useMemo(() => {
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

  // Modifier management handlers
  const handleAddModifier = useCallback((modifier, type) => {
    clearError();
    
    if (type === "prefix") {
      setSelectedPrefixes(prevPrefixes => 
        prevPrefixes.some(p => p.id === modifier.id)
          ? prevPrefixes
          : [...prevPrefixes, modifier]
      );
    } else if (type === "suffix") {
      setSelectedSuffixes(prevSuffixes => 
        prevSuffixes.some(s => s.id === modifier.id)
          ? prevSuffixes
          : [...prevSuffixes, modifier]
      );
    }
  }, [clearError]);

  const handleRemoveModifier = useCallback((modifier) => {
    if (modifier.type === "prefix") {
      setSelectedPrefixes(prevPrefixes => 
        prevPrefixes.filter(p => p.id !== modifier.id)
      );
    } else {
      setSelectedSuffixes(prevSuffixes => 
        prevSuffixes.filter(s => s.id !== modifier.id)
      );
    }
    clearError();
  }, [clearError]);

  const handleRemovePrefix = useCallback((index) => {
    setSelectedPrefixes(prevPrefixes => 
      prevPrefixes.filter((_, i) => i !== index)
    );
    clearError();
  }, [clearError]);

  const handleRemoveSuffix = useCallback((index) => {
    setSelectedSuffixes(prevSuffixes => 
      prevSuffixes.filter((_, i) => i !== index)
    );
    clearError();
  }, [clearError]);

  // Trade URL generation
  const handleTradeForModifiers = useCallback((specificType = null) => {
    const tradeType = specificType || selectedType;
    
    if (!tradeType) return;

    const tradeUrl = generateTradeUrlWithMultipleModifiers(
      tradeType,
      selectedPrefixes,
      selectedSuffixes
    );

    if (tradeUrl) {
      window.open(tradeUrl, "_blank");
    } else {
      displayError("Failed to generate trade URL. Please select at least one modifier.");
    }
  }, [selectedType, selectedPrefixes, selectedSuffixes, displayError]);

  // UI sub-components
  const renderErrorMessage = () => {
    if (!error) return null;

    return (
      <div className="bg-red-900/50 p-3 rounded-lg border border-red-800 text-red-200 text-sm">
        {error}
      </div>
    );
  };

  const renderModifierList = (modifiers, type, handleRemove) => {
    if (modifiers.length === 0) {
      return (
        <div className="p-4 bg-slate-800 rounded-md text-sm text-slate-400 text-center mb-4 ring-1 ring-slate-700">
          No {type}s selected
        </div>
      );
    }

    const textColorClass = type === "prefix" ? "text-blue-400" : "text-green-400";

    return (
      <ul className="mb-4 space-y-2 max-h-48 overflow-y-auto minimal-scrollbar pr-1">
        {modifiers.map((modifier, index) => (
          <li
            key={index}
            className="bg-slate-800 p-3 rounded-md flex justify-between ring-1 ring-slate-700"
            onContextMenu={(e) => {
              e.preventDefault();
              handleRemove(index);
            }}
          >
            <div>
              <div className={`text-sm font-medium ${textColorClass}`}>{modifier.Name}</div>
              <div className="text-xs text-slate-400 mt-1">{modifier.Mod}</div>
            </div>
            <button
              onClick={() => handleRemove(index)}
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

  const renderTradeButtons = () => {
    if (isGroupedType) {
      return (
        <div className="grid grid-cols-2 gap-4 mt-4">
          {specificTypes.map(type => (
            <button
              key={type}
              className="py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md font-medium transition-colors"
              onClick={() => handleTradeForModifiers(type)}
              disabled={selectedPrefixes.length === 0 && selectedSuffixes.length === 0}
            >
              Trade for {type}
            </button>
          ))}
        </div>
      );
    }

    return (
      <button
        className="w-full mt-4 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md font-medium transition-colors"
        onClick={() => handleTradeForModifiers()}
        disabled={!selectedType || (selectedPrefixes.length === 0 && selectedSuffixes.length === 0)}
      >
        Trade for Modifiers
      </button>
    );
  };

  // Main component render
  return (
    <div className="bg-slate-900 p-5 rounded-xl shadow-sm">
      <h2 className="text-xl font-bold mb-1 text-white">Generate Trade</h2>
      <p className="text-sm text-slate-400 mb-4">
        Input any combination of prefixes and suffixes to generate a trade URL that includes the selected prefix and suffix modifiers, 
        with their counts configurable under the "Show Filters" section on the Path of Exile trade site.
      </p>

      <div className="space-y-5">
        {renderErrorMessage()}
      
        {/* Idol Type Selection */}
        <div>
          <label className="block mb-2 text-sm text-slate-300">Idol Type</label>
          <select
            className="w-full bg-slate-800 p-3 rounded-md border-0 text-sm ring-1 ring-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="">Select Idol Type</option>
            {GROUPED_IDOL_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
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
              {renderModifierList(selectedPrefixes, "prefix", handleRemovePrefix)}
            </div>

            {/* Selected Suffixes */}
            <div className="border-t border-slate-800 pt-4">
              <h3 className="font-medium mb-2 text-sm text-slate-300">
                Selected Suffixes ({selectedSuffixes.length})
              </h3>
              {renderModifierList(selectedSuffixes, "suffix", handleRemoveSuffix)}
            </div>

            {/* Modifier Search */}
            <div className="border-t border-slate-800 pt-4">
              <h3 className="font-medium mb-2 text-sm text-slate-300">Search & Add Modifiers</h3>
              <ModifierSearch
                modData={typeSpecificMods}
                onAddModifier={handleAddModifier}
                onRemoveModifier={handleRemoveModifier}
                selectedType={selectedType}
                initialState={searchState}
                onSearchUpdate={setSearchState}
                searchContext="trade"
                selectedPrefixes={selectedPrefixes}
                selectedSuffixes={selectedSuffixes}
              />
            </div>

            {/* Trade Buttons */}
            {renderTradeButtons()}
          </>
        )}
      </div>
    </div>
  );
};

export default React.memo(TradeGenerator);