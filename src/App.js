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
import StrategiesPanel from "./components/StrategiesPanel";

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

    // Place idol on grid
    const handlePlaceIdol = (idol, position) => {
        const { row, col } = position;
        const idolType = idolTypes.find((type) => type.name === idol.type);

        if (!idolType) return false;

        const { width, height } = idolType;

        // Validate placement
        if (row + height > 7 || col + width > 6) return false;

        // Check for blocked cells and overlaps
        for (let r = row; r < row + height; r++) {
            for (let c = col; c < col + width; c++) {
                // Check blocked cells
                if (
                    (r === 0 && c === 0) || // Top-left corner
                    (r === 2 && (c === 1 || c === 4)) || // Row 3: cells (1,2) and (4,2)
                    (r === 3 && (c === 1 || c === 2 || c === 3 || c === 4)) || // Row 4
                    (r === 4 && (c === 1 || c === 4)) || // Row 5
                    (r === 6 && c === 5) // Bottom-right
                ) {
                    return false;
                }

                // Check for overlapping idols
                if (gridState[r][c] !== null) {
                    return false;
                }
            }
        }

        // Place the idol in grid
        const newGrid = [...gridState];
        for (let r = row; r < row + height; r++) {
            for (let c = col; c < col + width; c++) {
                newGrid[r][c] = {
                    ...idol,
                    position: {
                        row,
                        col,
                    },
                };
            }
        }

        setGridState(newGrid);
        saveGridState(newGrid);

        // Update inventory to mark idol as placed
        const updatedInventory = inventory.map((invIdol) =>
            invIdol.id === idol.id
                ? {
                    ...invIdol,
                    isPlaced: true,
                }
                : invIdol
        );
        setInventory(updatedInventory);
        saveInventory(updatedInventory);

        return true;
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

    // Generate idols from desired modifiers
    const handleGenerateIdols = (desiredModifiers) => {
        // console.log('Received desired modifiers:', desiredModifiers);

        if (!desiredModifiers || desiredModifiers.length === 0) {
            console.log("No modifiers provided");
            return;
        }

        // Expand modifiers based on count
        const expandedModifiers = [];
        desiredModifiers.forEach((mod) => {
            const count = mod.count || 1; // Default to 1 if count is missing
            // console.log(`Processing modifier: ${mod.Name}, count: ${count}`);

            for (let i = 0; i < count; i++) {
                // Include essential properties, excluding count
                expandedModifiers.push({
                    Name: mod.Name,
                    Mod: mod.Mod,
                    Code: mod.Code,
                    id: mod.id,
                    type: mod.type, // prefix or suffix
                });
            }
        });

        // console.log('Expanded modifiers:', expandedModifiers);

        // Call the generator function
        const result = generateAndPlaceIdols(
            expandedModifiers,
            modData,
            idolTypes,
            gridState
        );
        // console.log('Generation result:', result);

        if (!result || !result.idols || result.idols.length === 0) {
            console.error("No idols were generated");
            // Show error message
            setGenerationResult({
                total: 0,
                placed: 0,
                notPlaced: [],
                modifiersRequested: expandedModifiers.length,
                success: false,
                error: "Failed to generate idols. Try different modifiers.",
            });
            return;
        }

        // Update grid with placed idols
        setGridState(result.grid);
        saveGridState(result.grid);

        // Add generated idols to inventory
        const newInventory = [...inventory];

        // Add all generated idols to inventory
        result.idols.forEach((idol) => {
            const isPlaced =
                result.placedIdols &&
                result.placedIdols.some((placed) => placed.id === idol.id);

            newInventory.push({
                ...idol,
                isPlaced: !!isPlaced,
            });
        });

        setInventory(newInventory);
        saveInventory(newInventory);

        // Calculate idols that couldn't be placed
        const notPlacedIdols = result.idols.filter(
            (idol) =>
                !result.placedIdols ||
                !result.placedIdols.some((placed) => placed.id === idol.id)
        );

        // Show generation results
        setGenerationResult({
            total: result.idols.length,
            placed: result.placedIdols ? result.placedIdols.length : 0,
            notPlaced: notPlacedIdols,
            modifiersRequested: expandedModifiers.length,
            success: result.idols.length > 0,
        });

        // Switch to grid view
        setActiveTab("builder");
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                Loading idol data...
            </div>
        );
    }

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
                setActiveTab("builder");
            }
        }
    };

    // Mobile tab navigation
    const renderMobileTabNav = () => (
        <div className="flex flex-wrap md:hidden border-b border-gray-700 mb-4">
            <button
                className={`flex-1 py-2 px-3 ${activeTab === 'builder' ? 'border-b-2 border-yellow-400 text-yellow-400' : 'text-gray-400'}`}
                onClick={() => setActiveTab('builder')}
            >
                Builder
            </button>
            <button
                className={`flex-1 py-2 px-3 ${activeTab === 'inventory' ? 'border-b-2 border-yellow-400 text-yellow-400' : 'text-gray-400'}`}
                onClick={() => setActiveTab('inventory')}
            >
                Inventory
            </button>
            <button
                className={`flex-1 py-2 px-3 ${activeTab === 'modifiers' ? 'border-b-2 border-yellow-400 text-yellow-400' : 'text-gray-400'}`}
                onClick={() => setActiveTab('modifiers')}
            >
                Mods
            </button>
            <button
                className={`flex-1 py-2 px-3 ${activeTab === 'autogen' ? 'border-b-2 border-yellow-400 text-yellow-400' : 'text-gray-400'}`}
                onClick={() => setActiveTab('autogen')}
            >
                Auto
            </button>
            <button
                className={`flex-1 py-2 px-3 ${activeTab === 'strategies' ? 'border-b-2 border-yellow-400 text-yellow-400' : 'text-gray-400'}`}
                onClick={() => setActiveTab('strategies')}
            >
                Strategies
            </button>
        </div>
    );

    const renderDesktopTabs = () => (
        <div className="hidden md:flex bg-gray-800 rounded-lg overflow-hidden mb-4">
            <button
                className={`flex-1 py-2 px-4 ${activeTab === 'builder' ? 'bg-gray-700 font-medium' : 'hover:bg-gray-700'}`}
                onClick={() => setActiveTab('builder')}
            >
                Manual Builder
            </button>
            <button
                className={`flex-1 py-2 px-4 ${activeTab === 'autogen' ? 'bg-gray-700 font-medium' : 'hover:bg-gray-700'}`}
                onClick={() => setActiveTab('autogen')}
            >
                Auto-Generate
            </button>
            <button
                className={`flex-1 py-2 px-4 ${activeTab === 'strategies' ? 'bg-gray-700 font-medium' : 'hover:bg-gray-700'}`}
                onClick={() => setActiveTab('strategies')}
            >
                Strategies
            </button>
        </div>
    );

    // Notification components
    const renderGenerationResult = () => {
        if (!generationResult) return null;

        return (
            <div
                className={`mb-4 p-3 rounded-lg ${generationResult.error
                    ? "bg-red-800"
                    : generationResult.notPlaced &&
                        generationResult.notPlaced.length > 0
                        ? "bg-yellow-800"
                        : "bg-green-800"
                    }`}
            >
                <div className="flex justify-between">
                    <h3 className="font-medium">Generation Results</h3>
                    <button
                        onClick={() => setGenerationResult(null)}
                        className="text-gray-300 hover:text-white"
                    >
                        ✕
                    </button>
                </div>

                {generationResult.error ? (
                    <p className="text-sm text-red-200">{generationResult.error}</p>
                ) : (
                    <>
                        <p className="text-sm">
                            Created {generationResult.total} idols with{" "}
                            {generationResult.modifiersRequested} desired modifiers.{" "}
                            {generationResult.placed} idols were automatically placed on the
                            grid.
                        </p>

                        {/* Show idols that couldn't be placed */}
                        {generationResult.notPlaced &&
                            generationResult.notPlaced.length > 0 && (
                                <div className="mt-2">
                                    <p className="text-sm text-yellow-300">
                                        {generationResult.notPlaced.length}{" "}
                                        {generationResult.notPlaced.length === 1 ? "idol" : "idols"}{" "}
                                        couldn't be placed:
                                    </p>
                                    <ul className="mt-1 ml-4 list-disc text-xs">
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

    const renderFirstVisitTip = () => {
        if (!firstVisit) return null;

        return (
            <div className="mb-4 p-3 rounded-lg bg-blue-800">
                <div className="flex justify-between">
                    <h3 className="font-medium"> Tip: Paste Idols from Path of Exile </h3>
                    <button
                        onClick={() => setFirstVisit(false)}
                        className="text-gray-300 hover:text-white"
                    >
                        ✕
                    </button>
                </div>
                <p className="text-sm">
                    Copy an idol from Path of Exile and paste it directly (Ctrl + V) to
                    add it to your inventory.
                </p>
            </div>
        );
    };

    // Help button in corner
    const renderHelpButton = () => (
        <button
            className="fixed bottom-4 right-4 w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-xl shadow-lg z-30"
            onClick={() => setShowHelp(true)}
            title="Show keyboard shortcuts (Press ?)"
        >
            ?
        </button>
    );

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="min-h-screen bg-gray-900 text-white p-4">
                <header className="mb-6">
                    <h1 className="text-3xl font-bold text-center text-yellow-400">
                        Path of Exile Idol Grid Builder
                    </h1>
                    <div className="flex justify-center mt-3 space-x-4">
                        <ShareButton gridState={gridState} inventory={inventory} />
                        <OptimizeButton onOptimize={handleOptimizeGrid} />
                        <ClearButton onClear={handleClearAll} />
                    </div>
                </header>
                {renderMobileTabNav()} {generationResult && renderGenerationResult()}
                {renderFirstVisitTip()}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    {/* Left column - Builder or Auto-Generate */}
                    <div className={`md:col-span-4 lg:col-span-3 space-y-4 ${activeTab !== 'builder' && activeTab !== 'autogen' && activeTab !== 'strategies' ? 'hidden md:block' : ''
                        }`}>
                        {activeTab === 'autogen' ? (
                            <DesiredModifiers
                                modData={modData}
                                onGenerateIdols={handleGenerateIdols}
                            />
                        ) : activeTab === 'strategies' ? (
                            <StrategiesPanel onLoadStrategy={handleLoadStrategy} />
                        ) : (
                            <ImprovedIdolBuilder
                                modData={modData}
                                idolTypes={idolTypes}
                                onAddIdol={handleAddIdol}
                            />
                        )}

                        {renderDesktopTabs()}

                    </div>
                    {/* Middle column - Grid */}
                    <div className="md:col-span-5 lg:col-span-6 flex flex-col items-center">
                        <div className="bg-gray-800 p-4 rounded-lg shadow-lg w-full max-w-2xl">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold"> Idol Grid </h2>
                            </div>
                            <div className="flex justify-center">
                                <Grid
                                    gridState={gridState}
                                    onPlaceIdol={handlePlaceIdol}
                                    onRemoveFromGrid={handleRemoveFromGrid}
                                    idolTypes={idolTypes}
                                />
                            </div>
                        </div>
                        {/* Active Modifiers (desktop) */}
                        <div className="hidden md:block mt-4 w-full max-w-2xl">
                            <ActiveModifiers gridState={gridState} />
                        </div>
                    </div>
                    {/* Right column - Inventory */}
                    <div
                        className={`md:col-span-3 space-y-4 ${activeTab !== "inventory" && "hidden md:block"
                            }`}
                    >
                        <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
                            <h2 className="text-xl font-bold mb-4"> Inventory </h2>
                            <IdolInventory
                                inventory={inventory}
                                onRemoveIdol={handleRemoveIdol}
                            />
                        </div>
                    </div>
                    {/* Modifiers tab content (mobile) */}
                    <div
                        className={`col-span-12 ${activeTab !== "modifiers" && "hidden md:hidden"
                            }`}
                    >
                        <ActiveModifiers gridState={gridState} />
                    </div>
                </div>
                {/* Global components */} {renderHelpButton()}
                {showHelp && <KeyboardShortcuts onClose={() => setShowHelp(false)} />}
                <IdolPasteHandler onAddIdol={handleAddIdol} modData={modData} />
            </div>
        </DndProvider>
    );
}

export default App;
