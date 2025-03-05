// components/StrategiesPanel.jsx
import React, { useState, useEffect } from "react";

function StrategiesPanel({ onLoadStrategy }) {
  const [strategies, setStrategies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("");

  // Load strategies from JSON file
  useEffect(() => {
    const fetchStrategies = async () => {
      try {
        setLoading(true);
        const baseUrl = process.env.PUBLIC_URL || "";
        const response = await fetch(`${baseUrl}/data/strategies.json`);

        if (!response.ok) {
          throw new Error("Failed to load strategies");
        }

        const data = await response.json();
        setStrategies(data);
        setError(null);
      } catch (err) {
        console.error("Error loading strategies:", err);
        setError("Failed to load strategies. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchStrategies();
  }, []);

  // Filter strategies based on search
  const filteredStrategies = strategies.filter(
    (strategy) =>
      filter === "" ||
      strategy.name.toLowerCase().includes(filter.toLowerCase()) ||
      strategy.author.toLowerCase().includes(filter.toLowerCase()) ||
      strategy.description.toLowerCase().includes(filter.toLowerCase()) ||
      (strategy.tags &&
        strategy.tags.some((tag) =>
          tag.toLowerCase().includes(filter.toLowerCase())
        )) ||
      (strategy.mapdevice &&
        strategy.mapdevice.toLowerCase().includes(filter.toLowerCase())) ||
      (strategy.scarabs &&
        strategy.scarabs.some((scarab) =>
          scarab.toLowerCase().includes(filter.toLowerCase())
        ))
  );

  // Handle loading a strategy
  const handleLoadStrategy = (strategy) => {
    onLoadStrategy(strategy.shareUrl);
  };

  if (loading) {
    return (
      <div className="bg-slate-900 p-5 rounded-xl shadow-sm">
        <h2 className="text-xl font-bold mb-4 text-white">Strategies</h2>
        <div className="py-12 text-center text-slate-400">
          <svg className="animate-spin h-8 w-8 mx-auto mb-4 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading strategies...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-900 p-5 rounded-xl shadow-sm">
        <h2 className="text-xl font-bold mb-4 text-white">Strategies</h2>
        <div className="py-6 text-center text-red-400 border border-red-900 rounded-lg bg-red-900 bg-opacity-20">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 p-5 rounded-xl shadow-sm">
      <h2 className="text-xl font-bold mb-4 text-white">Strategies</h2>

      {/* Search filter */}
      <div className="mb-5">
        <input
          type="text"
          placeholder="Search strategies..."
          className="w-full bg-slate-800 p-3 rounded-lg border border-slate-700 text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      {/* Strategy list */}
      <div className="max-h-96 overflow-y-auto pr-1">
        {filteredStrategies.length > 0 ? (
          <ul className="space-y-4">
            {filteredStrategies.map((strategy) => (
              <li
                key={strategy.id}
                className="bg-slate-800 rounded-lg p-4 hover:bg-slate-750 transition-colors border border-slate-700 cursor-pointer"
                onClick={() => handleLoadStrategy(strategy)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-indigo-300">
                      {strategy.name}
                    </h3>
                    <p className="text-sm text-slate-400 mt-1">
                      By: {strategy.author}
                    </p>
                  </div>
                  <button
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs py-1.5 px-3 rounded-md transition-colors shadow-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLoadStrategy(strategy);
                    }}
                  >
                    Load
                  </button>
                </div>
                <p className="text-sm mt-2 text-slate-300">{strategy.description}</p>

                {/* Map Device */}
                {strategy.mapdevice && (
                  <div className="mt-3">
                    <span className="text-sm font-medium text-indigo-300">
                      Map Device:
                    </span>
                    <span className="ml-2 text-sm text-slate-300">
                      {strategy.mapdevice}
                    </span>
                  </div>
                )}

                {/* Scarabs */}
                {strategy.scarabs && strategy.scarabs.length > 0 && (
                  <div className="mt-2">
                    <span className="text-sm font-medium text-indigo-300">
                      Scarabs:
                    </span>
                    <span className="ml-2 text-sm text-slate-300">
                      {strategy.scarabs.join(", ")}
                    </span>
                  </div>
                )}
                {/* Source / YouTube Link */}
                {strategy.source && (
                  <div className="mt-2">
                    <span className="text-sm font-medium text-indigo-300">Source:</span>
                    <a 
                      href={strategy.source} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="ml-2 text-sm text-indigo-400 hover:text-indigo-300 hover:underline transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Watch on YouTube
                    </a>
                  </div>
                )}

                {/* Tags */}
                {strategy.tags && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {strategy.tags.map((tag) => (
                      <span
                        key={tag}
                        className="bg-slate-900 text-slate-300 text-xs px-2 py-1 rounded-full border border-slate-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-12 text-slate-400 border border-dashed border-slate-700 rounded-lg">
            {filter
              ? "No strategies match your search"
              : "No strategies available"}
          </div>
        )}
      </div>
    </div>
  );
}

export default StrategiesPanel;