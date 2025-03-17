// context/AppContext.js
import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { loadIdolData } from '../api/idolDataApi';
import { saveGridState, saveInventory, loadGridState, loadInventory, getSharedDataFromURL } from '../utils/storage/storageUtils';
import { optimizeGrid } from '../utils/grid/gridUtils';
import { generateAndPlaceIdols } from '../utils/idol/idolGenerator';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Main state
  const [modData, setModData] = useState({ prefixes: {}, suffixes: {} });
  const [idolTypes, setIdolTypes] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [gridState, setGridState] = useState(
    Array(7).fill().map(() => Array(6).fill(null))
  );

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("builder");
  const [generationResult, setGenerationResult] = useState(null);
  const [firstVisit, setFirstVisit] = useState(true);

  // Inventory search state
  const [inventorySearchTerm, setInventorySearchTerm] = useState("");

  // Load data and check for shared URL
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const data = await loadIdolData();
        setModData(data.mods);
        setIdolTypes(data.types);

        const sharedData = getSharedDataFromURL(data.mods);

        if (sharedData) {
          setGridState(sharedData.gridState);
          setInventory(sharedData.inventory);
        } else {
          const savedGrid = loadGridState();
          const savedInventory = loadInventory();

          if (savedGrid) setGridState(savedGrid);
          if (savedInventory) setInventory(savedInventory);
        }
      } catch (error) {
        console.error("Failed to load idol data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    const hasVisited = localStorage.getItem("hasVisitedBefore");
    if (!hasVisited) {
      localStorage.setItem("hasVisitedBefore", "true");
      setFirstVisit(true);
    } else {
      setFirstVisit(false);
    }
  }, []);

  // Add a new idol to inventory
  const handleAddIdol = useCallback((newIdol) => {
    const idolWithId = {
      ...newIdol,
      id: Date.now() + Math.random(),
    };

    setInventory(prevInventory => {
      const updatedInventory = [...prevInventory, idolWithId];
      saveInventory(updatedInventory);
      return updatedInventory;
    });
  }, []);

  // Cached function to check if a cell is blocked
  const isBlockedCell = useCallback((row, col) => {
    return (
      (row === 0 && col === 0) ||
      (row === 2 && (col === 1 || col === 4)) ||
      (row === 3 && (col === 1 || col === 2 || col === 3 || col === 4)) ||
      (row === 4 && (col === 1 || col === 4)) ||
      (row === 6 && col === 5)
    );
  }, []);

  // Removes idol from both inventory and grid
  const handleRemoveIdol = useCallback((id) => {
    let idolOnGrid = null;
    let idolPosition = null;
    let idolType = null;

    // Find idol on grid
    for (let row = 0; row < gridState.length; row++) {
      for (let col = 0; col < gridState[row].length; col++) {
        const cell = gridState[row][col];
        if (cell && cell.id === id) {
          idolOnGrid = cell;
          idolPosition = cell.position || { row, col };
          idolType = idolTypes.find((type) => type.name === cell.type);
          break;
        }
      }
      if (idolOnGrid) break;
    }

    // Remove from grid if present
    if (idolOnGrid && idolPosition && idolType) {
      const newGrid = gridState.map((row) => [...row]);
      const { width, height } = idolType;
      for (let r = idolPosition.row; r < idolPosition.row + height; r++) {
        for (let c = idolPosition.col; c < idolPosition.col + width; c++) {
          if (r >= 0 && r < newGrid.length && c >= 0 && c < newGrid[r].length) {
            newGrid[r][c] = null;
          }
        }
      }

      setGridState(newGrid);
      saveGridState(newGrid);
    }

    // Remove from inventory
    setInventory(prevInventory => {
      const updatedInventory = prevInventory.filter((idol) => idol.id !== id);
      saveInventory(updatedInventory);
      return updatedInventory;
    });
  }, [gridState, idolTypes]);

  // Check if an idol can be placed at a position on a given grid
  const canPlaceIdol = useCallback((grid, idol, position) => {
    const { row, col } = position;
    const idolType = idolTypes.find((type) => type.name === idol.type);
    if (!idolType) return false;

    const { width, height } = idolType;

    if (row + height > 7 || col + width > 6) return false;

    for (let r = row; r < row + height; r++) {
      for (let c = col; c < col + width; c++) {
        if (isBlockedCell(r, c)) {
          return false;
        }
        if (grid[r][c] !== null) {
          return false;
        }
      }
    }
    return true;
  }, [idolTypes, isBlockedCell]);

  // Place an idol on a grid, returning a new grid state
  const placeIdolOnGrid = useCallback((grid, idol, position) => {
    const newGrid = grid.map((row) => [...row]);
    const { row, col } = position;
    const idolType = idolTypes.find((type) => type.name === idol.type);

    if (!idolType) return newGrid;

    const { width, height } = idolType;

    for (let r = row; r < row + height; r++) {
      for (let c = col; c < col + width; c++) {
        if (r < newGrid.length && c < newGrid[r].length) {
          newGrid[r][c] = {
            ...idol,
            position: { row, col },
          };
        }
      }
    }
    return newGrid;
  }, [idolTypes]);

  // Remove an idol from a grid, returning a new grid state
  const removeIdolFromGrid = useCallback((grid, position) => {
    const { row, col } = position;
    if (!grid[row] || !grid[row][col]) return grid;

    const idol = grid[row][col];
    const idolType = idolTypes.find((type) => type.name === idol.type);
    if (!idolType) return grid;

    const { width, height } = idolType;
    const idolPosition = idol.position || { row, col };
    const newGrid = grid.map((row) => [...row]);

    for (let r = idolPosition.row; r < idolPosition.row + height && r < grid.length; r++) {
      for (let c = idolPosition.col; c < idolPosition.col + width && c < grid[0].length; c++) {
        if (r >= 0 && c >= 0) {
          newGrid[r][c] = null;
        }
      }
    }
    return newGrid;
  }, [idolTypes]);

  // Place idol on grid
  const handlePlaceIdol = useCallback((idol, position, currentPosition = null) => {
    let gridForCheck = gridState;

    if (currentPosition) {
      gridForCheck = removeIdolFromGrid(gridState, currentPosition);
    }

    if (canPlaceIdol(gridForCheck, idol, position)) {
      const newGrid = placeIdolOnGrid(gridForCheck, idol, position);
      setGridState(newGrid);
      saveGridState(newGrid);

      if (!currentPosition) {
        setInventory(prevInventory => {
          const updatedInventory = prevInventory.map((invIdol) =>
            invIdol.id === idol.id ? { ...invIdol, isPlaced: true } : invIdol
          );
          saveInventory(updatedInventory);
          return updatedInventory;
        });
      }

      return true;
    }

    return false;
  }, [gridState, canPlaceIdol, placeIdolOnGrid, removeIdolFromGrid]);

  // Remove idol from grid
  const handleRemoveFromGrid = useCallback((position) => {
    const { row, col } = position;
    if (!gridState[row] || !gridState[row][col]) return;

    const idol = gridState[row][col];
    const idolType = idolTypes.find((type) => type.name === idol.type);

    if (!idolType) return;

    const { width, height } = idolType;
    const idolPosition = idol.position || { row, col };

    // Create new grid with idol removed
    const newGrid = gridState.map(row => [...row]);
    for (let r = idolPosition.row; r < idolPosition.row + height && r < newGrid.length; r++) {
      for (let c = idolPosition.col; c < idolPosition.col + width && c < newGrid[r].length; c++) {
        if (r >= 0 && c >= 0) {
          newGrid[r][c] = null;
        }
      }
    }

    setGridState(newGrid);
    saveGridState(newGrid);

    // Update inventory to mark idol as not placed
    setInventory(prevInventory => {
      const updatedInventory = prevInventory.map((invIdol) =>
        invIdol.id === idol.id
          ? { ...invIdol, isPlaced: false }
          : invIdol
      );
      saveInventory(updatedInventory);
      return updatedInventory;
    });
  }, [gridState, idolTypes]);

  // Clear all data
  const handleClearAll = useCallback(() => {
    const emptyGrid = Array(7).fill().map(() => Array(6).fill(null));
    setGridState(emptyGrid);
    saveGridState(emptyGrid);

    setInventory([]);
    saveInventory([]);

    setGenerationResult(null);
  }, []);

  // Clear inventory except unique idols and reset grid
  const handleClearInventoryExceptUniques = useCallback(() => {
    const emptyGrid = Array(7).fill().map(() => Array(6).fill(null));
    setGridState(emptyGrid);
    saveGridState(emptyGrid);

    setInventory(prevInventory => {
      const uniqueIdols = prevInventory.filter(idol => idol.isUnique);
      saveInventory(uniqueIdols);
      return uniqueIdols;
    });

    setGenerationResult(null);
  }, []);

  // Auto-optimize idol placement
  const handleOptimizeGrid = useCallback(() => {
    const optimizationResult = optimizeGrid(inventory, idolTypes, gridState);

    setGridState(optimizationResult.grid);
    saveGridState(optimizationResult.grid);

    setInventory(prevInventory => {
      const updatedInventory = prevInventory.map((idol) => {
        let isPlaced = false;

        // Check if this idol is placed on the grid
        outer: for (let row = 0; row < optimizationResult.grid.length; row++) {
          for (let col = 0; col < optimizationResult.grid[row].length; col++) {
            const cell = optimizationResult.grid[row][col];
            if (cell && cell.id === idol.id) {
              isPlaced = true;
              break outer;
            }
          }
        }

        return { ...idol, isPlaced };
      });

      saveInventory(updatedInventory);
      return updatedInventory;
    });

    return {
      placedCount: optimizationResult.placedCount,
      notPlacedCount: optimizationResult.notPlacedCount,
      notPlacedIdols: optimizationResult.notPlacedIdols,
    };
  }, [inventory, idolTypes, gridState]);

  // Generate idols from desired modifiers
  const handleGenerateIdols = useCallback((desiredModifiers) => {
    if (!desiredModifiers || desiredModifiers.length === 0) {
      return;
    }

    try {
      const result = generateAndPlaceIdols(
        desiredModifiers,
        modData,
        idolTypes,
        gridState
      );

      if (!result || !result.idols || result.idols.length === 0) {
        setGenerationResult({
          total: 0,
          placed: 0,
          notPlaced: [],
          modifiersRequested: desiredModifiers.length,
          success: false,
          error: "Failed to generate idols. Try different modifiers.",
        });
        return;
      }

      // Add new idols to inventory
      setInventory(prevInventory => {
        const newInventory = [
          ...prevInventory,
          ...result.idols.map(idol => ({ ...idol, isPlaced: false }))
        ];

        // Optimize grid with the new inventory
        const optimizationResult = optimizeGrid(newInventory, idolTypes, gridState);

        // Update grid state
        setGridState(optimizationResult.grid);
        saveGridState(optimizationResult.grid);

        // Mark placed idols in inventory
        const finalInventory = newInventory.map(idol => {
          let isPlaced = false;

          // Check if this idol is placed on the grid
          outer: for (let row = 0; row < optimizationResult.grid.length; row++) {
            for (let col = 0; col < optimizationResult.grid[row].length; col++) {
              const cell = optimizationResult.grid[row][col];
              if (cell && cell.id === idol.id) {
                isPlaced = true;
                break outer;
              }
            }
          }

          return { ...idol, isPlaced };
        });

        // Set generation result
        setGenerationResult({
          total: result.idols.length,
          placed: optimizationResult.placedCount,
          notPlaced: optimizationResult.notPlacedIdols,
          modifiersRequested: desiredModifiers.length,
          success: result.idols.length > 0,
        });

        saveInventory(finalInventory);
        return finalInventory;
      });
    } catch (error) {
      console.error("Error generating idols:", error);
      setGenerationResult({
        error: "An error occurred while generating idols.",
        success: false
      });
    }
  }, [gridState, idolTypes, modData]);

  // Handle loading a strategy from URL
  const handleLoadStrategy = useCallback((shareUrl) => {
    if (!shareUrl) return;

    try {
      const url = new URL(shareUrl);
      const shareParam = url.searchParams.get("share");

      if (shareParam) {
        const sharedData = getSharedDataFromURL(modData, shareParam);

        if (sharedData) {
          setGridState(sharedData.gridState);
          saveGridState(sharedData.gridState);

          setInventory(sharedData.inventory);
          saveInventory(sharedData.inventory);

          setGenerationResult({
            total: sharedData.inventory.length,
            placed: sharedData.inventory.filter((idol) => idol.isPlaced).length,
            success: true,
            message: "Strategy loaded successfully!",
          });
        }
      }
    } catch (error) {
      console.error("Error loading strategy:", error);
      setGenerationResult({
        error: "Failed to load strategy.",
        success: false
      });
    }
  }, [modData]);

  // Memoize filtered inventory for better performance
  const filteredInventory = useMemo(() => {
    return inventory.filter((idol) => {
      if (!inventorySearchTerm) return true;

      const searchTerm = inventorySearchTerm.toLowerCase();

      if (
        idol.name.toLowerCase().includes(searchTerm) ||
        idol.type.toLowerCase().includes(searchTerm) ||
        (idol.isUnique && "unique".includes(searchTerm))
      ) {
        return true;
      }

      if (idol.prefixes && idol.prefixes.length > 0) {
        for (const prefix of idol.prefixes) {
          if (
            prefix.Name.toLowerCase().includes(searchTerm) ||
            prefix.Mod.toLowerCase().includes(searchTerm)
          ) {
            return true;
          }
        }
      }

      if (idol.suffixes && idol.suffixes.length > 0) {
        for (const suffix of idol.suffixes) {
          if (
            suffix.Name.toLowerCase().includes(searchTerm) ||
            suffix.Mod.toLowerCase().includes(searchTerm)
          ) {
            return true;
          }
        }
      }

      if (idol.isUnique && idol.uniqueModifiers && idol.uniqueModifiers.length > 0) {
        for (const mod of idol.uniqueModifiers) {
          if (mod.Mod.toLowerCase().includes(searchTerm)) {
            return true;
          }
        }
      }

      return false;
    });
  }, [inventory, inventorySearchTerm]);

  const contextValue = {
    // State
    modData,
    idolTypes,
    inventory,
    gridState,
    isLoading,
    activeTab,
    generationResult,
    firstVisit,
    inventorySearchTerm,
    filteredInventory, // Memoized filtered inventory

    // State setters
    setActiveTab,
    setGenerationResult,
    setFirstVisit,
    setInventorySearchTerm,

    // Action functions
    handleAddIdol,
    handleRemoveIdol,
    canPlaceIdol,
    placeIdolOnGrid,
    removeIdolFromGrid,
    handlePlaceIdol,
    handleRemoveFromGrid,
    handleClearAll,
    handleClearInventoryExceptUniques,
    handleOptimizeGrid,
    handleGenerateIdols,
    handleLoadStrategy,
    isBlockedCell,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};