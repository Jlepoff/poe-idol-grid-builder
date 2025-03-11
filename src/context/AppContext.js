// context/AppContext.js
import React, { createContext, useState, useEffect, useCallback } from 'react';
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
  const [showHelp, setShowHelp] = useState(false);
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

    const updatedInventory = [...inventory, idolWithId];
    setInventory(updatedInventory);
    saveInventory(updatedInventory);
  }, [inventory]);

  // Removes idol from both inventory and grid
  const handleRemoveIdol = useCallback((id) => {
    let idolOnGrid = null;
    let idolPosition = null;
    let idolType = null;

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

    let newGrid = [...gridState];

    if (idolOnGrid && idolPosition && idolType) {
      newGrid = gridState.map((row) => [...row]);
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

    const updatedInventory = inventory.filter((idol) => idol.id !== id);
    setInventory(updatedInventory);
    saveInventory(updatedInventory);
  }, [gridState, inventory, idolTypes]);

  // Check if an idol can be placed at a position on a given grid
  const canPlaceIdol = useCallback((grid, idol, position) => {
    const { row, col } = position;
    const idolType = idolTypes.find((type) => type.name === idol.type);
    if (!idolType) return false;

    const { width, height } = idolType;

    if (row + height > 7 || col + width > 6) return false;

    for (let r = row; r < row + height; r++) {
      for (let c = col; c < col + width; c++) {
        if (
          (r === 0 && c === 0) ||
          (r === 2 && (c === 1 || c === 4)) ||
          (r === 3 && (c === 1 || c === 2 || c === 3 || c === 4)) ||
          (r === 4 && (c === 1 || c === 4)) ||
          (r === 6 && c === 5)
        ) {
          return false;
        }
        if (grid[r][c] !== null) {
          return false;
        }
      }
    }
    return true;
  }, [idolTypes]);

  // Place an idol on a grid, returning a new grid state
  const placeIdolOnGrid = useCallback((grid, idol, position) => {
    const newGrid = grid.map((row) => [...row]);
    const { row, col } = position;
    const idolType = idolTypes.find((type) => type.name === idol.type);
    const { width, height } = idolType;

    for (let r = row; r < row + height; r++) {
      for (let c = col; c < col + width; c++) {
        newGrid[r][c] = {
          ...idol,
          position: { row, col },
        };
      }
    }
    return newGrid;
  }, [idolTypes]);

  // Remove an idol from a grid, returning a new grid state
  const removeIdolFromGrid = useCallback((grid, position) => {
    const { row, col } = position;
    if (!grid[row][col]) return grid;

    const idol = grid[row][col];
    const idolType = idolTypes.find((type) => type.name === idol.type);
    if (!idolType) return grid;

    const { width, height } = idolType;
    const idolPosition = idol.position || { row, col };
    const newGrid = grid.map((row) => [...row]);

    for (let r = idolPosition.row; r < idolPosition.row + height; r++) {
      for (let c = idolPosition.col; c < idolPosition.col + width; c++) {
        newGrid[r][c] = null;
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
        const updatedInventory = inventory.map((invIdol) =>
          invIdol.id === idol.id ? { ...invIdol, isPlaced: true } : invIdol
        );
        setInventory(updatedInventory);
        saveInventory(updatedInventory);
      }

      return true;
    }

    return false;
  }, [gridState, inventory, canPlaceIdol, placeIdolOnGrid, removeIdolFromGrid]);

  // Remove idol from grid
  const handleRemoveFromGrid = useCallback((position) => {
    const { row, col } = position;
    if (!gridState[row][col]) return;

    const idol = gridState[row][col];
    const idolType = idolTypes.find((type) => type.name === idol.type);

    if (!idolType) return;

    const { width, height } = idolType;
    const idolPosition = idol.position || { row, col };

    const newGrid = [...gridState];
    for (let r = idolPosition.row; r < idolPosition.row + height; r++) {
      for (let c = idolPosition.col; c < idolPosition.col + width; c++) {
        newGrid[r][c] = null;
      }
    }

    setGridState(newGrid);
    saveGridState(newGrid);

    const updatedInventory = inventory.map((invIdol) =>
      invIdol.id === idol.id
        ? { ...invIdol, isPlaced: false }
        : invIdol
    );
    setInventory(updatedInventory);
    saveInventory(updatedInventory);
  }, [gridState, inventory, idolTypes]);

  // Clear all data
  const handleClearAll = useCallback(() => {
    const emptyGrid = Array(7).fill().map(() => Array(6).fill(null));
    setGridState(emptyGrid);
    saveGridState(emptyGrid);

    setInventory([]);
    saveInventory([]);

    setGenerationResult(null);
  }, []);

  // Auto-optimize idol placement
  const handleOptimizeGrid = useCallback(() => {
    const optimizationResult = optimizeGrid(inventory, idolTypes, gridState);

    setGridState(optimizationResult.grid);
    saveGridState(optimizationResult.grid);

    const updatedInventory = inventory.map((idol) => {
      let isPlaced = false;

      for (let row = 0; row < optimizationResult.grid.length; row++) {
        for (let col = 0; col < optimizationResult.grid[row].length; col++) {
          const cell = optimizationResult.grid[row][col];
          if (cell && cell.id === idol.id) {
            isPlaced = true;
            break;
          }
        }
        if (isPlaced) break;
      }

      return { ...idol, isPlaced };
    });

    setInventory(updatedInventory);
    saveInventory(updatedInventory);

    return {
      placedCount: optimizationResult.placedCount,
      notPlacedCount: optimizationResult.notPlacedCount,
      notPlacedIdols: optimizationResult.notPlacedIdols,
    };
  }, [inventory, idolTypes, gridState]);

  const handleGenerateIdols = useCallback((desiredModifiers) => {
    if (!desiredModifiers || desiredModifiers.length === 0) {
      return;
    }

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

    const newInventory = [...inventory];
    result.idols.forEach((idol) => {
      newInventory.push({
        ...idol,
        isPlaced: false,
      });
    });

    setInventory(newInventory);
    saveInventory(newInventory);

    const optimizationResult = optimizeGrid(newInventory, idolTypes, gridState);

    setGridState(optimizationResult.grid);
    saveGridState(optimizationResult.grid);

    const updatedInventory = newInventory.map((idol) => {
      let isPlaced = false;
      for (let row = 0; row < optimizationResult.grid.length; row++) {
        for (let col = 0; col < optimizationResult.grid[row].length; col++) {
          const cell = optimizationResult.grid[row][col];
          if (cell && cell.id === idol.id) {
            isPlaced = true;
            break;
          }
        }
        if (isPlaced) break;
      }
      return { ...idol, isPlaced };
    });

    setInventory(updatedInventory);
    saveInventory(updatedInventory);

    setGenerationResult({
      total: result.idols.length,
      placed: optimizationResult.placedCount,
      notPlaced: optimizationResult.notPlacedIdols,
      modifiersRequested: desiredModifiers.length,
      success: result.idols.length > 0,
    });

    setActiveTab("builder");
  }, [gridState, inventory, idolTypes, modData]);

  const handleLoadStrategy = useCallback((shareUrl) => {
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

        setActiveTab("builder");
      }
    }
  }, [modData]);

  const contextValue = {
    // State
    modData,
    idolTypes,
    inventory,
    gridState,
    isLoading,
    activeTab,
    generationResult,
    showHelp,
    firstVisit,
    inventorySearchTerm,

    // State setters
    setActiveTab,
    setGenerationResult,
    setShowHelp,
    setFirstVisit,
    setInventorySearchTerm,

    // Actions
    handleAddIdol,
    handleRemoveIdol,
    canPlaceIdol,
    placeIdolOnGrid,
    removeIdolFromGrid,
    handlePlaceIdol,
    handleRemoveFromGrid,
    handleClearAll,
    handleOptimizeGrid,
    handleGenerateIdols,
    handleLoadStrategy,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};