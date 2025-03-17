// App.js
import React, { useContext, useMemo } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

// Components
import Grid from "./components/grid/Grid";
import OptimizeButton from "./components/grid/OptimizeButton";
import IdolInventory from "./components/inventory/IdolInventory";
import ActiveModifiers from "./components/modifiers/ActiveModifiers";
import IdolBuilder from "./components/builder/IdolBuilder";
import DesiredModifiers from "./components/modifiers/DesiredModifiers";
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

// UI Components
const LoadingSpinner = () => (
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

const Header = ({ onLoadStrategy, gridState, inventory, onOptimize, onClear }) => (
    <header className="mb-6">
        <h1 className="text-3xl font-bold text-center text-amber-400">
            Path of Exile Idol Grid Builder
        </h1>
        <div className="w-full h-px bg-slate-700 my-4"></div>

        {/* buttons container */}
        <div className="flex flex-wrap justify-center mt-3 space-x-0 sm:space-x-4 gap-2 sm:gap-0 px-2 sm:px-0">
            <StrategiesButton onLoadStrategy={onLoadStrategy} />
            <ShareButton gridState={gridState} inventory={inventory} />
            <OptimizeButton onOptimize={onOptimize} />
            <ClearButton onClear={onClear} />
        </div>
    </header>
);

const MobileTabNav = ({ activeTab, setActiveTab }) => (
    <div className="flex flex-wrap md:hidden border-b border-slate-700 mb-4">
        <TabButton active={activeTab === "builder"} onClick={() => setActiveTab("builder")}>
            Builder
        </TabButton>
        <TabButton active={activeTab === "inventory"} onClick={() => setActiveTab("inventory")}>
            Inventory
        </TabButton>
        <TabButton active={activeTab === "modifiers"} onClick={() => setActiveTab("modifiers")}>
            Mods
        </TabButton>
        <TabButton active={activeTab === "autogen"} onClick={() => setActiveTab("autogen")}>
            Auto
        </TabButton>
        <TabButton active={activeTab === "unique"} onClick={() => setActiveTab("unique")}>
            Unique
        </TabButton>
        <TabButton active={activeTab === "trade"} onClick={() => setActiveTab("trade")}>
            Trade
        </TabButton>
    </div>
);

const TabButton = ({ active, onClick, children }) => (
    <button
        className={`flex-1 py-2 px-2 ${active
            ? "border-b-2 border-amber-400 text-amber-400"
            : "text-slate-400"}`}
        onClick={onClick}
    >
        {children}
    </button>
);

const DesktopTabs = ({ activeTab, setActiveTab }) => (
    <div className="hidden md:block mb-6">
        <div className="bg-slate-800 rounded-lg overflow-hidden flex flex-wrap w-full">
            <DesktopTabButton
                active={activeTab === "builder"}
                onClick={() => setActiveTab("builder")}
                minWidth="min-w-[120px]"
            >
                Manual Builder
            </DesktopTabButton>
            <DesktopTabButton
                active={activeTab === "autogen"}
                onClick={() => setActiveTab("autogen")}
                minWidth="min-w-[120px]"
            >
                Auto-Generate
            </DesktopTabButton>
            <DesktopTabButton
                active={activeTab === "unique"}
                onClick={() => setActiveTab("unique")}
                minWidth="min-w-[100px]"
            >
                Unique Idols
            </DesktopTabButton>
            <DesktopTabButton
                active={activeTab === "trade"}
                onClick={() => setActiveTab("trade")}
                minWidth="min-w-[100px]"
            >
                Generate Trade
            </DesktopTabButton>
        </div>
    </div>
);

const DesktopTabButton = ({ active, onClick, children, minWidth }) => (
    <button
        className={`py-2.5 px-4 ${minWidth} flex-grow ${active
            ? "bg-indigo-600 text-white font-medium"
            : "hover:bg-slate-700 text-slate-300"
            } transition-colors focus:ring-2 focus:ring-indigo-500 focus:outline-none`}
        onClick={onClick}
    >
        {children}
    </button>
);

const GenerationResultNotification = ({ result, onClose }) => {
    if (!result) return null;

    const isError = result.error;
    const hasNotPlaced = result.notPlaced && result.notPlaced.length > 0;

    const bgColorClass = isError
        ? "bg-red-900/50 border border-red-800"
        : hasNotPlaced
            ? "bg-amber-900/30 border border-amber-800"
            : "bg-green-900/30 border border-green-800";

    return (
        <div className={`mb-4 p-3 rounded-lg ${bgColorClass}`}>
            <div className="flex justify-between">
                <h3 className="font-medium text-white">Generation Results</h3>
                <button
                    onClick={onClose}
                    className="text-slate-300 hover:text-white transition-colors"
                >
                    ✕
                </button>
            </div>

            {isError ? (
                <p className="text-sm text-red-200 mt-1">{result.error}</p>
            ) : result.message ? (
                <p className="text-sm text-green-200 mt-1">{result.message}</p>
            ) : (
                <>
                    <p className="text-sm text-slate-300 mt-1">
                        Created {result.total} idols with {result.modifiersRequested} desired modifiers.{" "}
                        {result.placed} idols were automatically placed on the grid.
                    </p>

                    {hasNotPlaced && (
                        <div className="mt-2 bg-slate-800/50 p-2 rounded-md">
                            <p className="text-sm text-amber-300">
                                {result.notPlaced.length}{" "}
                                {result.notPlaced.length === 1 ? "idol" : "idols"}{" "}
                                couldn't be placed:
                            </p>
                            <ul className="mt-1 ml-4 list-disc text-xs text-slate-300">
                                {result.notPlaced.map((idol, index) => (
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

const FirstVisitTip = ({ onDismiss }) => (
    <div className="bg-slate-800/80 text-sm py-2 px-4 rounded-lg mb-4 flex justify-between items-center border-l-4 border-indigo-500">
        <span className="text-slate-300">
            <span className="font-bold text-indigo-400">Pro Tip:</span> Press{" "}
            <kbd className="bg-slate-700 px-1.5 py-0.5 rounded text-xs">
                Ctrl+V
            </kbd>{" "}
            to paste idols directly from Path of Exile
        </span>
        <button
            onClick={onDismiss}
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

const NoMatchingIdols = () => (
    <div className="bg-slate-800/50 rounded-xl p-6 text-center border border-slate-700/50">
        <div className="flex justify-center mb-4">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 text-slate-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
            </svg>
        </div>
        <p className="text-slate-300 text-base mb-5">No matching idols found.</p>
    </div>
);

const SearchBar = ({ value, onChange }) => (
    <div className="mt-4 relative">
        <input
            type="text"
            placeholder="Search idols..."
            className="w-full bg-slate-800 py-2.5 px-3 pr-8 rounded-md text-sm border border-slate-700 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            value={value}
            onChange={(e) => onChange(e.target.value)}
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
);

const PasteTip = () => (
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
);

const Footer = () => (
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
);

function AppContent() {
    const {
        modData,
        idolTypes,
        inventory,
        gridState,
        isLoading,
        activeTab,
        generationResult,
        firstVisit,
        inventorySearchTerm,
        setActiveTab,
        setGenerationResult,
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
    } = useContext(AppContext);

    // Calculate filtered inventory
    const filteredInventory = useMemo(() => {
        if (!inventorySearchTerm) return inventory;

        const searchTerm = inventorySearchTerm.toLowerCase();

        return inventory.filter((idol) => {
            // Check idol name and type
            if (idol.name.toLowerCase().includes(searchTerm) ||
                idol.type.toLowerCase().includes(searchTerm) ||
                (idol.isUnique && "unique".includes(searchTerm))) {
                return true;
            }

            // Check prefixes
            if (idol.prefixes?.length > 0) {
                for (const prefix of idol.prefixes) {
                    if (prefix.Name.toLowerCase().includes(searchTerm) ||
                        prefix.Mod.toLowerCase().includes(searchTerm)) {
                        return true;
                    }
                }
            }

            // Check suffixes
            if (idol.suffixes?.length > 0) {
                for (const suffix of idol.suffixes) {
                    if (suffix.Name.toLowerCase().includes(searchTerm) ||
                        suffix.Mod.toLowerCase().includes(searchTerm)) {
                        return true;
                    }
                }
            }

            // Check unique modifiers
            if (idol.isUnique && idol.uniqueModifiers?.length > 0) {
                for (const mod of idol.uniqueModifiers) {
                    if (mod.Mod.toLowerCase().includes(searchTerm)) {
                        return true;
                    }
                }
            }

            return false;
        });
    }, [inventory, inventorySearchTerm]);

    if (isLoading) {
        return <LoadingSpinner />;
    }

    // Determine left column visibility
    const isLeftColumnVisible =
        activeTab === "builder" ||
        activeTab === "autogen" ||
        activeTab === "unique" ||
        activeTab === "trade";

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="min-h-screen bg-slate-950 text-white p-4 flex flex-col">
                <Header
                    onLoadStrategy={handleLoadStrategy}
                    gridState={gridState}
                    inventory={inventory}
                    onOptimize={handleOptimizeGrid}
                    onClear={handleClearAll}
                />

                <MobileTabNav activeTab={activeTab} setActiveTab={setActiveTab} />

                {generationResult && (
                    <GenerationResultNotification
                        result={generationResult}
                        onClose={() => setGenerationResult(null)}
                    />
                )}

                {firstVisit && <FirstVisitTip onDismiss={() => setFirstVisit(false)} />}

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-10 flex-grow">
                    {/* Left Column - Builder or Auto-Generate */}
                    <div className="md:col-span-3 lg:col-span-4">
                        <DesktopTabs activeTab={activeTab} setActiveTab={setActiveTab} />

                        {/* Left Column Content */}
                        <div className={`space-y-6 ${!isLeftColumnVisible ? "hidden md:block" : ""}`}>
                            {activeTab === "autogen" ? (
                                <DesiredModifiers
                                    modData={modData}
                                    onGenerateIdols={handleGenerateIdols}
                                />
                            ) : activeTab === "unique" ? (
                                <UniqueIdols
                                    onAddIdol={handleAddIdol}
                                    inventory={inventory}
                                />
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
                    <div className={`md:col-span-3 lg:col-span-4 space-y-6 ${activeTab !== "inventory" && "hidden md:block"}`}>
                        <div className="bg-slate-900 p-6 rounded-xl shadow-sm">
                            <div className="mb-6">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-xl font-bold text-white">Inventory</h2>
                                    <div className="text-sm text-slate-400">
                                        {filteredInventory.length}{" "}
                                        {filteredInventory.length === 1 ? "idol" : "idols"}
                                    </div>
                                </div>

                                <SearchBar
                                    value={inventorySearchTerm}
                                    onChange={setInventorySearchTerm}
                                />
                                <PasteTip />
                            </div>

                            {filteredInventory.length === 0 && inventory.length > 0 ? (
                                <NoMatchingIdols />
                            ) : (
                                <IdolInventory
                                    inventory={filteredInventory}
                                    onRemoveIdol={handleRemoveIdol}
                                />
                            )}
                        </div>
                    </div>

                    {/* Modifiers Tab Content (Mobile) */}
                    <div className={`col-span-12 ${activeTab === "modifiers" ? "md:hidden" : "hidden"}`}>
                        <ActiveModifiers gridState={gridState} />
                    </div>
                </div>

                <Footer />

                {/* Global Components */}
                <IdolPasteHandler onAddIdol={handleAddIdol} modData={modData} />
            </div>
        </DndProvider>
    );
}

export default App;