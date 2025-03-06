// components/UniqueIdols.jsx
import React, { useState, useEffect } from "react";
import { generateTradeUrl } from "../utils/tradeUtils";

function UniqueIdols({ onAddIdol, inventory }) {
  const [uniqueIdols, setUniqueIdols] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Load unique idols from JSON file
  useEffect(() => {
    const fetchUniqueIdols = async () => {
      try {
        setLoading(true);
        const baseUrl = process.env.PUBLIC_URL || "";
        const response = await fetch(`${baseUrl}/data/unique_idol_mods.json`);

        if (!response.ok) {
          throw new Error("Failed to load unique idols");
        }

        const data = await response.json();

        // Convert data into a more usable format
        const formattedIdols = data.map((idol) => ({
          id: idol.id || `unique-${Date.now()}-${Math.random()}`,
          name: idol.Item,
          type: idol.Type.split(" ")[0], // Extract the idol type (Minor, Kamasan, etc.)
          fullType: idol.Type,
          isUnique: true,
          uniqueModifiers: idol.Mods.map((mod) => ({
            Mod: mod,
            Name: "Unique",
            Code: `Unique-${Date.now()}-${Math.random()}`,
          })),
        }));

        setUniqueIdols(formattedIdols);
        setError(null);
      } catch (err) {
        console.error("Error loading unique idols:", err);
        setError("Failed to load unique idols. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchUniqueIdols();
  }, []);

  // Filter unique idols based on search
  const filteredIdols = uniqueIdols.filter(
    (idol) =>
      searchTerm === "" ||
      idol.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      idol.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      idol.uniqueModifiers.some((mod) =>
        mod.Mod.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  // Check if a unique idol is already in inventory
  const isIdolInInventory = (uniqueIdolName) => {
    if (!inventory) return false;
    return inventory.some(
      (inventoryIdol) =>
        inventoryIdol.isUnique && inventoryIdol.name === uniqueIdolName
    );
  };

  // Handle adding a unique idol to inventory
  const handleAddIdol = (idol) => {
    // Add to main inventory with unique instance ID
    onAddIdol({
      ...idol,
      id: `${idol.id}-${Date.now()}`, // Ensure unique ID for inventory
    });
  };

  // Handle opening trade URL
  const handleTradeClick = (idol) => {
    const tradeUrl = generateTradeUrl({
      isUnique: true,
      name: idol.name,
      uniqueName: idol.name,
      type: idol.type,
    });

    if (tradeUrl) {
      window.open(tradeUrl, "_blank");
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-900 p-6 rounded-xl shadow-sm">
        <h2 className="text-xl font-bold mb-6 text-white">Unique Idols</h2>
        <div className="py-12 text-center text-slate-400">
          <svg
            className="animate-spin h-8 w-8 mx-auto mb-4 text-pink-500"
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
          Loading unique idols...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-900 p-6 rounded-xl shadow-sm">
        <h2 className="text-xl font-bold mb-6 text-white">Unique Idols</h2>
        <div className="py-6 text-center text-red-400 border border-red-900 rounded-lg bg-red-900 bg-opacity-20">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 p-6 rounded-xl shadow-sm">
      <h2 className="text-xl font-bold mb-6 text-white">Unique Idols</h2>

      {/* Search filter */}
      <div className="mb-6 relative">
        <input
          type="text"
          placeholder="Search unique idols..."
          className="w-full bg-slate-800 py-2.5 px-3 pr-8 rounded-md text-sm border border-slate-700 focus:ring-1 focus:ring-pink-500 focus:border-pink-500 outline-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
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

      {/* Idol list */}
      <div className="max-h-96 overflow-y-auto pr-1">
        {filteredIdols.length > 0 ? (
          <div className="space-y-4">
            {filteredIdols.map((idol) => (
              <div
                key={idol.id}
                className="bg-gradient-to-r from-pink-700/30 to-pink-800/40 border border-pink-600 p-6 rounded-lg shadow-md transition-all hover:shadow-lg"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-extrabold text-base text-white">{idol.name}</h3>
                    <p className="text-xs text-pink-300 mt-1">
                      {idol.fullType}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleTradeClick(idol)}
                      className="bg-indigo-600 hover:bg-indigo-500 border border-indigo-500 text-white text-xs py-1.5 px-2.5 rounded transition-colors"
                      title="Search for this unique idol on the trade site"
                    >
                      Trade
                    </button>
                    <button
                      onClick={() => handleAddIdol(idol)}
                      className={`text-xs py-1.5 px-2.5 rounded transition-colors border ${
                        isIdolInInventory(idol.name)
                          ? "bg-slate-700 text-slate-400 border-slate-600 cursor-not-allowed"
                          : "bg-green-600 hover:bg-green-500 text-white border-green-500"
                      }`}
                      disabled={isIdolInInventory(idol.name)}
                      title={
                        isIdolInInventory(idol.name)
                          ? "Already added to inventory"
                          : "Add to inventory"
                      }
                    >
                      {isIdolInInventory(idol.name) ? "Added" : "Add"}
                    </button>
                  </div>
                </div>

                <div className="mt-4">
                  <h4 className="text-xs font-medium text-pink-400 border-l-4 border-pink-400 pl-2 mb-2">
                    Unique Modifiers:
                  </h4>
                  <ul className="space-y-1.5 mt-2">
                    {idol.uniqueModifiers.map((mod, idx) => (
                      <li key={idx} className="text-[11px] text-slate-300 pl-3">
                        {mod.Mod}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400 border border-dashed border-slate-700 rounded-lg">
            {searchTerm
              ? "No unique idols match your search"
              : "No unique idols available"}
          </div>
        )}
      </div>
    </div>
  );
}

export default UniqueIdols;