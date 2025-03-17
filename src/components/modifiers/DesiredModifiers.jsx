// components/modifiers/DesiredModifiers.jsx
import React, { useState, useRef, useContext, useCallback, useMemo } from "react";
import ModifierSearch from "./ModifierSearch";
import Card from "../common/Card";
import Button from "../common/Button";
import Modal from "../common/Modal";
import { AppContext } from "../../context/AppContext";
import { extractModifiersFromInventory } from "../../utils/modifiers/extractModifiersFromInventory";

// Key for local storage
const STORAGE_KEY = "poe-idol-desired-modifiers";

// Loading indicator component
const LoadingSpinner = () => (
  <span className="flex items-center justify-center gap-2">
    <svg
      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
    Processing...
  </span>
);

// Load icon component
const LoadIcon = () => (
  <span className="flex items-center justify-center gap-2">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 14l3-3m0 0l3 3m-3-3v9"
      />
    </svg>
    Load Modifiers from Inventory
  </span>
);

// Modifier item component
const ModifierItem = ({ mod, index, onRemove }) => (
  <li
    className={`p-3 rounded-md flex justify-between items-start 
      ${
        mod.type === "prefix"
          ? "bg-gradient-to-r from-blue-900/30 to-slate-800 border border-blue-800/50"
          : "bg-gradient-to-r from-green-900/30 to-slate-800 border border-green-800/50"
      }`}
    onContextMenu={(e) => {
      e.preventDefault();
      onRemove(index);
    }}
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
      onClick={() => onRemove(index)}
      className="text-slate-400 hover:text-red-400 ml-2 transition-colors"
    >
      ✕
    </button>
  </li>
);

function DesiredModifiers({ modData, onGenerateIdols }) {
  // Custom hook for localStorage
  const useLocalStorage = (key, initialValue) => {
    const [storedValue, setStoredValue] = useState(() => {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : initialValue;
      } catch (error) {
        console.error("Failed to load from localStorage:", error);
        return initialValue;
      }
    });

    const setValue = (value) => {
      try {
        setStoredValue(value);
        localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.error("Failed to save to localStorage:", error);
      }
    };

    return [storedValue, setValue];
  };

  // State using custom hook
  const [desiredModifiers, setDesiredModifiers] = useLocalStorage(STORAGE_KEY, []);
  const [showSearch, setShowSearch] = useState(false);
  const [loadingFromInventory, setLoadingFromInventory] = useState(false);
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  const { inventory, handleClearInventoryExceptUniques } = useContext(AppContext);

  // Use ref for search history to avoid rerenders
  const searchHistoryRef = useRef({
    searchTerm: "",
    filterType: "all",
    viewByName: false,
    selectedNames: [],
  });

  // Calculate total modifier count - memoized to prevent recalculation on every render
  const totalModifierCount = useMemo(() => 
    desiredModifiers.reduce((total, mod) => total + mod.count, 0), 
    [desiredModifiers]
  );

  // Check if we have non-unique idols in inventory - memoized
  const hasNonUniqueIdols = useMemo(() => 
    inventory.some((idol) => !idol.isUnique), 
    [inventory]
  );

  // Handle adding a modifier - defined with useCallback to avoid recreation on each render
  const handleAddModifier = useCallback((modifier, type) => {
    setDesiredModifiers(currentModifiers => {
      const existingIndex = currentModifiers.findIndex(
        (mod) => mod.id === modifier.id
      );

      if (existingIndex >= 0) {
        // Increment count if already exists
        const updatedModifiers = [...currentModifiers];
        updatedModifiers[existingIndex] = {
          ...updatedModifiers[existingIndex],
          count: (updatedModifiers[existingIndex].count || 1) + 1,
        };
        return updatedModifiers;
      } else {
        // Add as new with count = 1
        return [...currentModifiers, { ...modifier, type, count: 1 }];
      }
    });
  }, [setDesiredModifiers]);

  // Handle removing a modifier - with useCallback
  const handleRemoveModifier = useCallback((index) => {
    setDesiredModifiers(currentModifiers => {
      const mod = currentModifiers[index];

      // If count > 1, decrement count
      if (mod.count > 1) {
        const updatedModifiers = [...currentModifiers];
        updatedModifiers[index] = {
          ...updatedModifiers[index],
          count: updatedModifiers[index].count - 1,
        };
        return updatedModifiers;
      } else {
        // Otherwise remove the modifier
        const newList = [...currentModifiers];
        newList.splice(index, 1);
        return newList;
      }
    });
  }, [setDesiredModifiers]);

  // Handle removing a modifier by direct reference - with useCallback
  const handleRemoveModifierByRef = useCallback((modifierToRemove) => {
    setDesiredModifiers(currentModifiers => {
      const index = currentModifiers.findIndex(mod => mod.id === modifierToRemove.id);
      if (index !== -1) {
        if (currentModifiers[index].count > 1) {
          const updatedModifiers = [...currentModifiers];
          updatedModifiers[index] = {
            ...updatedModifiers[index],
            count: updatedModifiers[index].count - 1,
          };
          return updatedModifiers;
        } else {
          return currentModifiers.filter(mod => mod.id !== modifierToRemove.id);
        }
      }
      return currentModifiers;
    });
  }, [setDesiredModifiers]);

  // Load modifiers from inventory - with useCallback
  const handleLoadFromInventory = useCallback(() => {
    setLoadingFromInventory(true);

    try {
      // Extract modifiers from inventory
      const extractedModifiers = extractModifiersFromInventory(
        inventory,
        modData
      );

      setDesiredModifiers(currentModifiers => {
        // Merge with existing modifiers
        const mergedModifiers = [...currentModifiers];

        extractedModifiers.forEach((extractedMod) => {
          const existingIndex = mergedModifiers.findIndex(
            (mod) => mod.id === extractedMod.id
          );

          if (existingIndex >= 0) {
            // Update count if modifier already exists
            mergedModifiers[existingIndex] = {
              ...mergedModifiers[existingIndex],
              count:
                (mergedModifiers[existingIndex].count || 0) + extractedMod.count,
            };
          } else {
            // Add new modifier
            mergedModifiers.push(extractedMod);
          }
        });

        return mergedModifiers;
      });

      // Clear the grid and inventory (excluding unique idols)
      handleClearInventoryExceptUniques();
    } catch (error) {
      console.error("Error loading modifiers from inventory:", error);
    } finally {
      setLoadingFromInventory(false);
    }
  }, [inventory, modData, handleClearInventoryExceptUniques, setDesiredModifiers]);

  // Generate idols from desired modifiers - with useCallback
  const handleGenerateIdols = useCallback(() => {
    if (desiredModifiers.length === 0) return;

    // Create a clean copy of each modifier with its count
    const modifiersToGenerate = desiredModifiers.map((mod) => ({
      ...mod,
      count: mod.count || 1, // Default to 1 if count is missing
      // Ensure these fields are present as they might be used in generation
      Name: mod.Name,
      Mod: mod.Mod,
      id: mod.id,
      type: mod.type, // prefix or suffix
    }));

    // Generate idols
    onGenerateIdols(modifiersToGenerate);

    // Clear the desired modifiers list
    setDesiredModifiers([]);
  }, [desiredModifiers, onGenerateIdols, setDesiredModifiers]);

  // Track search state changes - with useCallback
  const handleSearchUpdate = useCallback((searchState) => {
    searchHistoryRef.current = searchState;
  }, []);

  // Handler for clearing all modifiers - with useCallback
  const handleClearAll = useCallback(() => {
    setDesiredModifiers([]);
    setIsClearModalOpen(false);
  }, [setDesiredModifiers]);

  return (
    <Card title="Auto-Generate Idols">
      <div className="space-y-6">
        <p className="text-slate-300 text-sm">
          Add modifiers you want on your idols, then generate and place them
          automatically. Click a modifier multiple times to increase its
          quantity.
        </p>

        {/* Load from Inventory Button */}
        <Button
          variant={hasNonUniqueIdols ? "amber" : "disabled"}
          onClick={() => setIsLoadModalOpen(true)}
          disabled={!hasNonUniqueIdols || loadingFromInventory}
          className="w-full py-3"
        >
          {loadingFromInventory ? <LoadingSpinner /> : <LoadIcon />}
        </Button>

        {/* Clear All Button */}
        {desiredModifiers.length > 0 && (
          <Button
            variant="danger"
            onClick={() => setIsClearModalOpen(true)}
            className="w-full py-1"
          >
            Clear All Desired Modifiers
          </Button>
        )}

        {/* Display selected modifiers */}
        {desiredModifiers.length > 0 ? (
          <div className="border border-slate-700 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-base text-amber-400 border-l-4 border-amber-400 pl-2 mb-4">
              Desired Modifiers ({totalModifierCount})
            </h3>
            <ul className="max-h-60 overflow-y-auto space-y-2 pr-1 minimal-scrollbar">
              {desiredModifiers.map((mod, index) => (
                <ModifierItem 
                  key={`${mod.id}-${index}`}
                  mod={mod}
                  index={index}
                  onRemove={handleRemoveModifier}
                />
              ))}
            </ul>
          </div>
        ) : (
          <div className="text-slate-400 text-center p-6 border border-dashed border-slate-700 rounded-lg">
            No modifiers selected. Add modifiers to generate idols.
          </div>
        )}

        {/* Generate button */}
        <Button
          variant={desiredModifiers.length === 0 ? "disabled" : "amber"}
          onClick={handleGenerateIdols}
          disabled={desiredModifiers.length === 0}
          className="w-full py-3"
        >
          Generate & Place Idols
        </Button>

        {desiredModifiers.length > 0 && (
          <div className="mt-2 text-xs text-slate-400 text-center">
            This will create idols with these modifiers and place them on the
            grid
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
            <ModifierSearch
              modData={modData}
              onAddModifier={handleAddModifier}
              onRemoveModifier={handleRemoveModifierByRef}
              modifierList={desiredModifiers}
              initialState={searchHistoryRef.current}
              onSearchUpdate={handleSearchUpdate}
              searchContext="autogen"
            />
          ) : (
            <Button
              variant="secondary"
              onClick={() => setShowSearch(true)}
              className="w-full"
            >
              + Add Modifier
            </Button>
          )}
        </div>
      </div>

      {/* Load Confirmation Modal */}
      {isLoadModalOpen && (
        <Modal
          isOpen={isLoadModalOpen}
          onClose={() => setIsLoadModalOpen(false)}
          title="Load Modifiers Confirmation"
          actions={
            <>
              <Button
                variant="secondary"
                onClick={() => setIsLoadModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="amber"
                onClick={() => {
                  setIsLoadModalOpen(false);
                  handleLoadFromInventory();
                }}
              >
                Confirm
              </Button>
            </>
          }
        >
          <p>
            This will extract modifiers from your inventory and add them to the
            desired modifiers list. When generated, these modifiers will be
            optimized across idols which could result in different combinations
            than your original inventory. Some combinations may be more costly
            to trade for. Do you want to continue?
          </p>
        </Modal>
      )}

      {/* Clear All Confirmation Modal */}
      {isClearModalOpen && (
        <Modal
          isOpen={isClearModalOpen}
          onClose={() => setIsClearModalOpen(false)}
          title="Clear All Modifiers"
          actions={
            <>
              <Button
                variant="secondary"
                onClick={() => setIsClearModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="red"
                onClick={handleClearAll}
              >
                Confirm
              </Button>
            </>
          }
        >
          <p>Are you sure you want to clear all desired modifiers?</p>
        </Modal>
      )}
    </Card>
  );
}

export default DesiredModifiers;