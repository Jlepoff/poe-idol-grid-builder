// App.js
import React, { useEffect } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

// Components
import Grid from "./components/grid/Grid";
import OptimizeButton from "./components/grid/OptimizeButton";
import IdolInventory from "./components/inventory/IdolInventory";
import ActiveModifiers from "./components/modifiers/ActiveModifiers";
import IdolBuilder from "./components/builder/IdolBuilder";
import DesiredModifiers from "./components/modifiers/DesiredModifiers";
import KeyboardShortcuts from "./components/common/KeyboardShortcuts";
import IdolPasteHandler from "./components/inventory/IdolPasteHandler";
import ShareButton from "./components/common/ShareButton";
import ClearButton from "./components/common/ClearButton";
import StrategiesButton from "./components/strategies/StrategiesButton";
import UniqueIdols from "./components/builder/UniqueIdols";
import TradeGenerator from "./components/trade/TradeGenerator";

// Context
import { AppProvider, AppContext } from "./context/AppContext";

function App() {
    return (
        <AppProvider>
            <AppContent />
        </AppProvider>
    );
}

function AppContent() {
    const {
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
        setActiveTab,
        setGenerationResult,
        setShowHelp,
        setFirstVisit,
        setInventorySearchTerm,
        handleAddIdol,
        handleRemoveIdol,
        handlePlaceIdol,
        handleRemoveFromGrid,
        handleClearAll,
        handleOptimizeGrid,
        handleGenerateIdols,
        handleLoadStrategy,
    } = React.useContext(AppContext);

    // Add keyboard shortcut for help
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) {
                return;
            }

            if (e.key === "?" || e.key === "/") {
                setShowHelp((prev) => !prev);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [setShowHelp]);

    // Calculate filtered inventory
    const filteredInventory = React.useMemo(() => {
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
                className={`flex-1 py-2 px-2 ${activeTab === "modifiers"
                    ? "border-b-2 border-amber-400 text-amber-400"
                    : "text-slate-400"
                    }`}
                onClick={() => setActiveTab("modifiers")}
            >
                Mods
            </button>
            <button
                className={`flex-1 py-2 px-2 ${activeTab === "autogen"
                    ? "border-b-2 border-amber-400 text-amber-400"
                    : "text-slate-400"
                    }`}
                onClick={() => setActiveTab("autogen")}
            >
                Auto
            </button>
            <button
                className={`flex-1 py-2 px-2 ${activeTab === "unique"
                    ? "border-b-2 border-amber-400 text-amber-400"
                    : "text-slate-400"
                    }`}
                onClick={() => setActiveTab("unique")}
            >
                Unique
            </button>
            <button
                className={`flex-1 py-2 px-2 ${activeTab === "trade"
                    ? "border-b-2 border-amber-400 text-amber-400"
                    : "text-slate-400"
                    }`}
                onClick={() => setActiveTab("trade")}
            >
                Trade
            </button>
        </div>
    );
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

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="min-h-screen bg-slate-950 text-white p-4 flex flex-col">
                {/* Header */}
                <header className="mb-6">
                    <h1 className="text-3xl font-bold text-center text-amber-400">
                        Path of Exile Idol Grid Builder
                    </h1>
                    <div className="w-full h-px bg-slate-700 my-4"></div>

                    {/* Warning Alert Banner - Smaller Version */}
                    <div className="bg-red-900/30 border border-red-800/50 rounded-md p-2 mx-2 mb-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                            <svg
                                className="w-4 h-4 text-red-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                            <p className="text-red-300 text-xs">
                                <span className="font-bold">Note:</span> Old share URLs are invalid and must be regenerated.
                            </p>
                        </div>
                    </div>

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
                            <div className="bg-slate-800 rounded-lg overflow-hidden flex flex-wrap w-full">
                                <button
                                    className={`py-2.5 px-4 min-w-[120px] flex-grow ${activeTab === "builder"
                                            ? "bg-indigo-600 text-white font-medium"
                                            : "hover:bg-slate-700 text-slate-300"
                                        } transition-colors focus:ring-2 focus:ring-indigo-500 focus:outline-none`}
                                    onClick={() => setActiveTab("builder")}
                                >
                                    Manual Builder
                                </button>
                                <button
                                    className={`py-2.5 px-4 min-w-[120px] flex-grow ${activeTab === "autogen"
                                            ? "bg-indigo-600 text-white font-medium"
                                            : "hover:bg-slate-700 text-slate-300"
                                        } transition-colors focus:ring-2 focus:ring-indigo-500 focus:outline-none`}
                                    onClick={() => setActiveTab("autogen")}
                                >
                                    Auto-Generate
                                </button>
                                <button
                                    className={`py-2.5 px-4 min-w-[100px] flex-grow ${activeTab === "unique"
                                            ? "bg-indigo-600 text-white font-medium"
                                            : "hover:bg-slate-700 text-slate-300"
                                        } transition-colors focus:ring-2 focus:ring-indigo-500 focus:outline-none`}
                                    onClick={() => setActiveTab("unique")}
                                >
                                    Unique Idols
                                </button>
                                <button
                                    className={`py-2.5 px-4 min-w-[100px] flex-grow ${activeTab === "trade"
                                            ? "bg-indigo-600 text-white font-medium"
                                            : "hover:bg-slate-700 text-slate-300"
                                        } transition-colors focus:ring-2 focus:ring-indigo-500 focus:outline-none`}
                                    onClick={() => setActiveTab("trade")}
                                >
                                    Generate Trade
                                </button>
                            </div>
                        </div>

                        {/* Left Column Content */}
                        <div
                            className={`space-y-6 ${activeTab !== "builder" &&
                                activeTab !== "autogen" &&
                                activeTab !== "unique" &&
                                activeTab !== "trade"
                                ? "hidden md:block"
                                : ""
                                }`}
                        >
                            {activeTab === "autogen" ? (
                                <DesiredModifiers
                                    modData={modData}
                                    onGenerateIdols={handleGenerateIdols}
                                />
                            ) : activeTab === "unique" ? (
                                <UniqueIdols onAddIdol={handleAddIdol} inventory={inventory} />
                            ) : activeTab === "trade" ? (
                                <TradeGenerator
                                    modData={modData}
                                    idolTypes={idolTypes}
                                />
                            ) : (
                                <IdolBuilder
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

export default App