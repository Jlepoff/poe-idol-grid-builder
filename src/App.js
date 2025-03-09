import React, { useState, useEffect } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

// Components
import Grid from "./components/Grid";
import OptimizeButton from "./components/OptimizeButton";
import IdolInventory from "./components/IdolInventory";
import ActiveModifiers from "./components/ActiveModifiers";
import ImprovedIdolBuilder from "./components/ImprovedIdolBuilder";
import DesiredModifiers from "./components/DesiredModifiers";
import KeyboardShortcuts from "./components/KeyboardShortcuts";
import IdolPasteHandler from "./components/IdolPasteHandler";
import ShareButton from "./components/ShareButton";
import ClearButton from "./components/ClearButton";
import StrategiesButton from "./components/StrategiesButton";
import UniqueIdols from "./components/UniqueIdols";

// Utils
import { loadIdolData, optimizeGrid } from "./utils";
import { generateAndPlaceIdols } from "./utils/idolGenerator";
import {
    saveGridState,
    saveInventory,
    loadGridState,
    loadInventory,
    getSharedDataFromURL,
} from "./utils/storageUtils";

function App() {
    // Main state
    const [modData, setModData] = useState({
        prefixes: {},
        suffixes: {},
    });
    const [idolTypes, setIdolTypes] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [gridState, setGridState] = useState(
        Array(7)
            .fill()
            .map(() => Array(6).fill(null))
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
                // Load idol data
                const data = await loadIdolData();
                setModData(data.mods);
                setIdolTypes(data.types);

                // Check for shared data first, then fall back to localStorage
                const sharedData = getSharedDataFromURL(data.mods);

                if (sharedData) {
                    // Load grid and inventory from shared URL
                    setGridState(sharedData.gridState);
                    setInventory(sharedData.inventory);
                } else {
                    // Try to load saved data from localStorage
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
            setFirstVisit(false); // Don't show tip for returning users
        }
    }, []);

    // Add keyboard shortcut for help
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Only handle if not in an input field
            if (["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) {
                return;
            }

            // Check for ? key press
            if (e.key === "?" || e.key === "/") {
                setShowHelp((prev) => !prev); // Toggle help dialog
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    // Add a new idol to inventory
    const handleAddIdol = (newIdol) => {
        const idolWithId = {
            ...newIdol,
            id: Date.now() + Math.random(),
        };

        const updatedInventory = [...inventory, idolWithId];
        setInventory(updatedInventory);
        saveInventory(updatedInventory);
    };

    // Removes idol from both inventory and grid
    const handleRemoveIdol = (id) => {
        // First, check if this idol is on the grid and find its position
        let idolOnGrid = null;
        let idolPosition = null;
        let idolType = null;

        // Find the idol on the grid
        for (let row = 0; row < gridState.length; row++) {
            for (let col = 0; col < gridState[row].length; col++) {
                const cell = gridState[row][col];
                if (cell && cell.id === id) {
                    idolOnGrid = cell;

                    // Get the idol's primary position
                    idolPosition = cell.position || {
                        row,
                        col,
                    };

                    // Get the idol's type for dimensions
                    idolType = idolTypes.find((type) => type.name === cell.type);

                    // Once we found it, we can break from the inner loop
                    break;
                }
            }
            if (idolOnGrid) break; // Break from outer loop if found
        }

        // Now create a new grid state if we need to remove from grid
        let newGrid = [...gridState];

        // If the idol is on the grid, remove it from all its cells
        if (idolOnGrid && idolPosition && idolType) {
            // Create a proper deep copy
            newGrid = gridState.map((row) => [...row]);

            // Clear all cells occupied by this idol
            const { width, height } = idolType;
            for (let r = idolPosition.row; r < idolPosition.row + height; r++) {
                for (let c = idolPosition.col; c < idolPosition.col + width; c++) {
                    // Check bounds
                    if (r >= 0 && r < newGrid.length && c >= 0 && c < newGrid[r].length) {
                        newGrid[r][c] = null;
                    }
                }
            }

            // Update the grid state
            setGridState(newGrid);
            saveGridState(newGrid);
        }

        // Remove from inventory
        const updatedInventory = inventory.filter((idol) => idol.id !== id);
        setInventory(updatedInventory);
        saveInventory(updatedInventory);
    };

    // Check if an idol can be placed at a position on a given grid
    const canPlaceIdol = (grid, idol, position) => {
        const { row, col } = position;
        const idolType = idolTypes.find((type) => type.name === idol.type);
        if (!idolType) return false;

        const { width, height } = idolType;

        // Check if placement is within grid bounds
        if (row + height > 7 || col + width > 6) return false;

        // Check for blocked cells and overlaps
        for (let r = row; r < row + height; r++) {
            for (let c = col; c < col + width; c++) {
                if (
                    (r === 0 && c === 0) || // Top-left corner
                    (r === 2 && (c === 1 || c === 4)) || // Row 3
                    (r === 3 && (c === 1 || c === 2 || c === 3 || c === 4)) || // Row 4
                    (r === 4 && (c === 1 || c === 4)) || // Row 5
                    (r === 6 && c === 5) // Bottom-right
                ) {
                    return false;
                }
                if (grid[r][c] !== null) {
                    return false;
                }
            }
        }
        return true;
    };

    // Place an idol on a grid, returning a new grid state
    const placeIdolOnGrid = (grid, idol, position) => {
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
    };

    // Remove an idol from a grid, returning a new grid state
    const removeIdolFromGrid = (grid, position) => {
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
    };

    // Place idol on grid
    const handlePlaceIdol = (idol, position, currentPosition = null) => {
        let gridForCheck = gridState;

        if (currentPosition) {
            // For moves, remove the idol from its current position first for validation
            gridForCheck = removeIdolFromGrid(gridState, currentPosition);
        }

        if (canPlaceIdol(gridForCheck, idol, position)) {
            const newGrid = placeIdolOnGrid(gridForCheck, idol, position);
            setGridState(newGrid);
            saveGridState(newGrid);

            if (!currentPosition) {
                // For new placements from inventory, update inventory
                const updatedInventory = inventory.map((invIdol) =>
                    invIdol.id === idol.id ? { ...invIdol, isPlaced: true } : invIdol
                );
                setInventory(updatedInventory);
                saveInventory(updatedInventory);
            }

            return true;
        }

        return false;
    };

    // Remove idol from grid
    const handleRemoveFromGrid = (position) => {
        const { row, col } = position;
        if (!gridState[row][col]) return;

        const idol = gridState[row][col];
        const idolType = idolTypes.find((type) => type.name === idol.type);

        if (!idolType) return;

        const { width, height } = idolType;
        const idolPosition = idol.position || {
            row,
            col,
        };

        // Remove the idol from all cells it occupies
        const newGrid = [...gridState];
        for (let r = idolPosition.row; r < idolPosition.row + height; r++) {
            for (let c = idolPosition.col; c < idolPosition.col + width; c++) {
                newGrid[r][c] = null;
            }
        }

        setGridState(newGrid);
        saveGridState(newGrid);

        // Update inventory to mark idol as not placed
        const updatedInventory = inventory.map((invIdol) =>
            invIdol.id === idol.id
                ? {
                    ...invIdol,
                    isPlaced: false,
                }
                : invIdol
        );
        setInventory(updatedInventory);
        saveInventory(updatedInventory);
    };

    // Clear all data
    const handleClearAll = () => {
        // Reset grid and inventory
        const emptyGrid = Array(7)
            .fill()
            .map(() => Array(6).fill(null));
        setGridState(emptyGrid);
        saveGridState(emptyGrid);

        setInventory([]);
        saveInventory([]);

        // Clear result notifications
        setGenerationResult(null);
    };

    // Auto-optimize idol placement
    const handleOptimizeGrid = () => {
        const optimizationResult = optimizeGrid(inventory, idolTypes, gridState);

        // Update grid with optimized layout
        setGridState(optimizationResult.grid);
        saveGridState(optimizationResult.grid);

        // Update inventory to mark placed idols
        const updatedInventory = inventory.map((idol) => {
            // Check if this idol is in the grid
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

            return {
                ...idol,
                isPlaced,
            };
        });

        setInventory(updatedInventory);
        saveInventory(updatedInventory);

        // Return the optimization results
        return {
            placedCount: optimizationResult.placedCount,
            notPlacedCount: optimizationResult.notPlacedCount,
            notPlacedIdols: optimizationResult.notPlacedIdols,
        };
    };



    const handleGenerateIdols = (desiredModifiers, isFromInventory = false, event = null) => {
        // Special case for Load From Inventory: just clear non-unique idols and reset grid
        if (isFromInventory && event?.type === "LOAD_FROM_INVENTORY") {
            // Filter to keep only unique idols
            const uniqueIdolsOnly = inventory.filter(idol => idol.isUnique);

            // Reset grid
            const emptyGrid = Array(7)
                .fill()
                .map(() => Array(6).fill(null));

            // Update state and save changes
            setInventory(uniqueIdolsOnly);
            saveInventory(uniqueIdolsOnly);
            setGridState(emptyGrid);
            saveGridState(emptyGrid);

            // Successfully loaded from inventory
            setGenerationResult({
                success: true,
                message: "Inventory modifiers loaded and non-unique idols removed.",
                fromInventory: true
            });

            return; // Don't proceed to idol generation
        }

        // Skip if no modifiers
        if (!desiredModifiers || desiredModifiers.length === 0) {
            return;
        }

        // Create deep copies of current state to work with
        const currentGrid = JSON.parse(JSON.stringify(gridState));
        const currentInventory = JSON.parse(JSON.stringify(inventory));

        // Call the generator function
        const result = generateAndPlaceIdols(
            desiredModifiers,
            modData,
            idolTypes,
            currentGrid
        );

        if (!result || !result.idols || result.idols.length === 0) {
            // Show error message
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

        // Add generated idols to inventory (creating a new array)
        const newIdols = result.idols.map(idol => ({
            ...idol,
            id: `idol-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            isPlaced: false
        }));

        const updatedInventory = [...currentInventory, ...newIdols];

        // Important: We update inventory state BEFORE running optimize
        setInventory(updatedInventory);
        saveInventory(updatedInventory);

        // Now use the existing optimization function to place the idols
        const optimizationResult = optimizeGrid(updatedInventory, idolTypes, currentGrid);

        // Update grid with optimized layout
        setGridState(optimizationResult.grid);
        saveGridState(optimizationResult.grid);

        // Update inventory to mark placed idols correctly
        const finalInventory = updatedInventory.map((idol) => {
            // Check if this idol is in the optimized grid
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
            return {
                ...idol,
                isPlaced,
            };
        });

        setInventory(finalInventory);
        saveInventory(finalInventory);

        // Show generation results
        setGenerationResult({
            total: result.idols.length,
            placed: optimizationResult.placedCount,
            notPlaced: optimizationResult.notPlacedIdols,
            modifiersRequested: desiredModifiers.length,
            success: result.idols.length > 0
        });

        // Switch to grid view
        setActiveTab("builder");
    }




    // Handle loading strategy from the StrategiesButton component
    const handleLoadStrategy = (shareUrl) => {
        // Extract the share parameter from the URL
        const url = new URL(shareUrl);
        const shareParam = url.searchParams.get("share");

        if (shareParam) {
            // Load the shared data
            const sharedData = getSharedDataFromURL(modData, shareParam);

            if (sharedData) {
                // Update the grid and inventory
                setGridState(sharedData.gridState);
                saveGridState(sharedData.gridState);

                setInventory(sharedData.inventory);
                saveInventory(sharedData.inventory);

                // Show success message
                setGenerationResult({
                    total: sharedData.inventory.length,
                    placed: sharedData.inventory.filter((idol) => idol.isPlaced).length,
                    success: true,
                    message: "Strategy loaded successfully!",
                });

                // Switch to grid view
                // setActiveTab("builder");
                // Just keep active tab that was used last
            }
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-950 text-white">
                <div className="text-center">
                    <svg
                        className="animate-spin h-12 w-12 mx-auto mb-4 text-indigo-500"
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
                    <p className="text-xl">Loading idol data...</p>
                </div>
            </div>
        );
    }

    const filteredInventory = inventory.filter((idol) => {
        if (!inventorySearchTerm) return true;

        const searchTerm = inventorySearchTerm.toLowerCase();

        // Search by name, type, or unique status
        if (
            idol.name.toLowerCase().includes(searchTerm) ||
            idol.type.toLowerCase().includes(searchTerm) ||
            (idol.isUnique && "unique".includes(searchTerm))
        ) {
            return true;
        }

        // Search through prefixes
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

        // Search through suffixes
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

        // Search through unique modifiers
        if (idol.isUnique && idol.uniqueModifiers && idol.uniqueModifiers.length > 0) {
            for (const mod of idol.uniqueModifiers) {
                if (mod.Mod.toLowerCase().includes(searchTerm)) {
                    return true;
                }
            }
        }

        return false;
    });

    // Mobile tab navigation
    const renderMobileTabNav = () => (
        <div className="flex flex-wrap md:hidden border-b border-slate-700 mb-4">
            <button
                className={`flex-1 py-2 px-3 ${activeTab === "builder"
                    ? "border-b-2 border-amber-400 text-amber-400"
                    : "text-slate-400"
                    }`}
                onClick={() => setActiveTab("builder")}
            >
                Builder
            </button>
            <button
                className={`flex-1 py-2 px-3 ${activeTab === "inventory"
                    ? "border-b-2 border-amber-400 text-amber-400"
                    : "text-slate-400"
                    }`}
                onClick={() => setActiveTab("inventory")}
            >
                Inventory
            </button>
            <button
                className={`flex-1 py-2 px-3 ${activeTab === "modifiers"
                    ? "border-b-2 border-amber-400 text-amber-400"
                    : "text-slate-400"
                    }`}
                onClick={() => setActiveTab("modifiers")}
            >
                Mods
            </button>
            <button
                className={`flex-1 py-2 px-3 ${activeTab === "autogen"
                    ? "border-b-2 border-amber-400 text-amber-400"
                    : "text-slate-400"
                    }`}
                onClick={() => setActiveTab("autogen")}
            >
                Auto
            </button>
            <button
                className={`flex-1 py-2 px-3 ${activeTab === "unique"
                    ? "border-b-2 border-amber-400 text-amber-400"
                    : "text-slate-400"
                    }`}
                onClick={() => setActiveTab("unique")}
            >
                Unique
            </button>
        </div>
    );

    // Notification components
    const renderGenerationResult = () => {
        if (!generationResult) return null;

        return (
            <div
                className={`mb-4 p-3 rounded-lg ${generationResult.error
                    ? "bg-red-900/50 border border-red-800"
                    : generationResult.notPlaced &&
                        generationResult.notPlaced.length > 0
                        ? "bg-amber-900/30 border border-amber-800"
                        : "bg-green-900/30 border border-green-800"
                    }`}
            >
                <div className="flex justify-between">
                    <h3 className="font-medium text-white">Generation Results</h3>
                    <button
                        onClick={() => setGenerationResult(null)}
                        className="text-slate-300 hover:text-white transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {generationResult.error ? (
                    <p className="text-sm text-red-200 mt-1">{generationResult.error}</p>
                ) : generationResult.message ? (
                    <p className="text-sm text-green-200 mt-1">
                        {generationResult.message}
                    </p>
                ) : (
                    <>
                        <p className="text-sm text-slate-300 mt-1">
                            Created {generationResult.total} idols with{" "}
                            {generationResult.modifiersRequested} desired modifiers.{" "}
                            {generationResult.placed} idols were automatically placed on the
                            grid.
                        </p>

                        {/* Show idols that couldn't be placed */}
                        {generationResult.notPlaced &&
                            generationResult.notPlaced.length > 0 && (
                                <div className="mt-2 bg-slate-800/50 p-2 rounded-md">
                                    <p className="text-sm text-amber-300">
                                        {generationResult.notPlaced.length}{" "}
                                        {generationResult.notPlaced.length === 1 ? "idol" : "idols"}{" "}
                                        couldn't be placed:
                                    </p>
                                    <ul className="mt-1 ml-4 list-disc text-xs text-slate-300">
                                        {generationResult.notPlaced.map((idol, index) => (
                                            <li key={index}>
                                                {idol.name} - No suitable space on grid
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                    </>
                )}
            </div>
        );
    };

    // Non-intrusive tip banner
    const renderFirstVisitTip = () => {
        if (!firstVisit) return null;

        return (
            <div className="bg-slate-800/80 text-sm py-2 px-4 rounded-lg mb-4 flex justify-between items-center border-l-4 border-indigo-500">
                <span className="text-slate-300">
                    <span className="font-bold text-indigo-400">Pro Tip:</span> Press{" "}
                    <kbd className="bg-slate-700 px-1.5 py-0.5 rounded text-xs">
                        Ctrl+V
                    </kbd>{" "}
                    to paste idols directly from Path of Exile
                </span>
                <button
                    onClick={() => setFirstVisit(false)}
                    className="text-slate-400 hover:text-slate-300 ml-3"
                    aria-label="Dismiss tip"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                        />
                    </svg>
                </button>
            </div>
        );
    };

    // Help button in corner
    const renderHelpButton = () => (
        <button
            className="fixed bottom-16 right-6 w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center text-xl text-white shadow-lg z-50 transition-colors"
            onClick={() => setShowHelp(true)}
            title="Show keyboard shortcuts (Press ?)"
        >
            ?
        </button>
    );

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="min-h-screen bg-slate-950 text-white p-4 flex flex-col">
                {/* Header */}
                <header className="mb-6">
                    <h1 className="text-3xl font-bold text-center text-amber-400">
                        Path of Exile Idol Grid Builder
                    </h1>
                    <div className="w-full h-px bg-slate-700 my-4"></div>

                    {/* buttons container */}
                    <div className="flex flex-wrap justify-center mt-3 space-x-0 sm:space-x-4 gap-2 sm:gap-0 px-2 sm:px-0">
                        <StrategiesButton onLoadStrategy={handleLoadStrategy} />
                        <ShareButton gridState={gridState} inventory={inventory} />
                        <OptimizeButton onOptimize={handleOptimizeGrid} />
                        <ClearButton onClear={handleClearAll} />
                    </div>
                </header>

                {/* Mobile Tab Navigation */}
                {renderMobileTabNav()}

                {/* Notification Areas */}
                {generationResult && renderGenerationResult()}
                {renderFirstVisitTip()}

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-10 flex-grow">
                    {/* Left Column - Builder or Auto-Generate */}
                    <div className="md:col-span-3 lg:col-span-4">
                        {/* Desktop Tabs */}
                        <div className="hidden md:block mb-6">
                            <div className="bg-slate-800 rounded-lg overflow-hidden flex w-full">
                                <button
                                    className={`py-2.5 px-6 flex-1 ${activeTab === "builder"
                                        ? "bg-indigo-600 text-white font-medium"
                                        : "hover:bg-slate-700 text-slate-300"
                                        } transition-colors focus:ring-2 focus:ring-indigo-500 focus:outline-none`}
                                    onClick={() => setActiveTab("builder")}
                                >
                                    Manual Builder
                                </button>
                                <button
                                    className={`py-2.5 px-6 flex-1 ${activeTab === "autogen"
                                        ? "bg-indigo-600 text-white font-medium"
                                        : "hover:bg-slate-700 text-slate-300"
                                        } transition-colors focus:ring-2 focus:ring-indigo-500 focus:outline-none`}
                                    onClick={() => setActiveTab("autogen")}
                                >
                                    Auto-Generate
                                </button>
                                <button
                                    className={`py-2.5 px-6 flex-1 ${activeTab === "unique"
                                        ? "bg-indigo-600 text-white font-medium"
                                        : "hover:bg-slate-700 text-slate-300"
                                        } transition-colors focus:ring-2 focus:ring-indigo-500 focus:outline-none`}
                                    onClick={() => setActiveTab("unique")}
                                >
                                    Unique Idols
                                </button>
                            </div>
                        </div>

                        {/* Left Column Content */}
                        <div
                            className={`space-y-6 ${activeTab !== "builder" &&
                                activeTab !== "autogen" &&
                                activeTab !== "unique"
                                ? "hidden md:block"
                                : ""
                                }`}
                        >
                            {activeTab === "autogen" ? (
                                <DesiredModifiers
                                    modData={modData}
                                    onGenerateIdols={handleGenerateIdols}
                                    inventory={inventory}
                                />
                            ) : activeTab === "unique" ? (
                                <UniqueIdols onAddIdol={handleAddIdol} inventory={inventory} />
                            ) : (
                                <ImprovedIdolBuilder
                                    modData={modData}
                                    idolTypes={idolTypes}
                                    onAddIdol={handleAddIdol}
                                />
                            )}
                        </div>
                    </div>

                    {/* Middle Column - Grid */}
                    <div className="md:col-span-6 lg:col-span-4 flex flex-col items-center">
                        <div className="bg-slate-900 p-6 rounded-xl shadow-sm w-full">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-white">Idol Grid</h2>
                            </div>
                            <div className="flex justify-center items-center max-w-full overflow-x-auto grid-container-parent minimal-scrollbar">
                                <Grid
                                    gridState={gridState}
                                    onPlaceIdol={handlePlaceIdol}
                                    onRemoveFromGrid={handleRemoveFromGrid}
                                    idolTypes={idolTypes}
                                />
                            </div>
                        </div>
                        {/* Active Modifiers (Desktop) */}
                        <div className="hidden md:block mt-6 w-full">
                            <ActiveModifiers gridState={gridState} />
                        </div>
                    </div>

                    {/* Right Column - Inventory */}
                    <div
                        className={`md:col-span-3 lg:col-span-4 space-y-6 ${activeTab !== "inventory" && "hidden md:block"}`}
                    >
                        <div className="bg-slate-900 p-6 rounded-xl shadow-sm">
                            <div className="mb-6">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-xl font-bold text-white">Inventory</h2>
                                    <div className="text-sm text-slate-400">
                                        {filteredInventory.length}{" "}
                                        {filteredInventory.length === 1 ? "idol" : "idols"}
                                    </div>
                                </div>

                                {/* Search Bar */}
                                <div className="mt-4 relative">
                                    <input
                                        type="text"
                                        placeholder="Search idols..."
                                        className="w-full bg-slate-800 py-2.5 px-3 pr-8 rounded-md text-sm border border-slate-700 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                        value={inventorySearchTerm}
                                        onChange={(e) => setInventorySearchTerm(e.target.value)}
                                    />
                                    <div className="absolute right-3 top-2.5 text-slate-500">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-4 w-4"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                            />
                                        </svg>
                                    </div>
                                </div>

                                {/* Paste Tip */}
                                <div className="mt-2 text-xs text-slate-400 flex items-center">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-3.5 w-3.5 mr-1 text-indigo-400"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                    Copy an idol from Path of Exile and press Ctrl+V to add it
                                </div>
                            </div>
                            {filteredInventory.length === 0 && inventory.length > 0 ? (
                                <div className="bg-slate-800/50 rounded-xl p-6 text-center border border-slate-700/50">
                                    <div className="flex justify-center mb-4">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                    <p className="text-slate-300 text-base mb-5">No matching idols found.</p>
                                </div>
                            ) : (
                                <IdolInventory
                                    inventory={filteredInventory}
                                    onRemoveIdol={handleRemoveIdol}
                                />
                            )}
                        </div>
                    </div>
                    {/* Modifiers Tab Content (Mobile) */}
                    <div
                        className={`col-span-12 ${activeTab === "modifiers" ? "md:hidden" : "hidden"
                            }`}
                    >
                        <ActiveModifiers gridState={gridState} />
                    </div>
                </div>

                {/* Footer */}
                <footer className="mt-auto pt-3 pb-2 border-t border-slate-800 text-center text-sm text-slate-500">
                    <div className="max-w-4xl mx-auto flex flex-col items-center">
                        <a
                            href="https://github.com/Jlepoff/poe-idol-grid-builder/issues"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center hover:text-indigo-400 transition-colors focus:ring-2 focus:ring-indigo-500 focus:outline-none mb-1"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 mr-1"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                            </svg>
                            Report Issues Here
                        </a>
                    </div>
                </footer>

                {/* Global Components */}
                {renderHelpButton()}
                {showHelp && <KeyboardShortcuts onClose={() => setShowHelp(false)} />}
                <IdolPasteHandler onAddIdol={handleAddIdol} modData={modData} />
            </div>
        </DndProvider>
    );
}

export default App;
