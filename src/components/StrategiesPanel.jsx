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
      <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold mb-4">Strategies</h2>
        <div className="py-8 text-center text-gray-400">
          Loading strategies...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold mb-4">Strategies</h2>
        <div className="py-4 text-center text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4">Strategies</h2>

      {/* Search filter */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search strategies..."
          className="w-full bg-gray-700 p-2 rounded border border-gray-600"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      {/* Strategy list */}
      <div className="max-h-96 overflow-y-auto">
        {filteredStrategies.length > 0 ? (
          <ul className="space-y-3">
            {filteredStrategies.map((strategy) => (
              <li
                key={strategy.id}
                className="bg-gray-700 rounded p-3 hover:bg-gray-600 cursor-pointer"
                onClick={() => handleLoadStrategy(strategy)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-yellow-400">
                      {strategy.name}
                    </h3>
                    <p className="text-sm text-gray-300">
                      By: {strategy.author}
                    </p>
                  </div>
                  <button
                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs py-1 px-2 rounded"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLoadStrategy(strategy);
                    }}
                  >
                    Load
                  </button>
                </div>
                <p className="text-sm mt-1">{strategy.description}</p>

                {/* Map Device */}
                {strategy.mapdevice && (
                  <div className="mt-2">
                    <span className="text-sm font-medium text-purple-300">
                      Map Device:
                    </span>
                    <span className="ml-2 text-sm text-gray-300">
                      {strategy.mapdevice}
                    </span>
                  </div>
                )}

                {/* Scarabs */}
                {strategy.scarabs && strategy.scarabs.length > 0 && (
                  <div className="mt-2">
                    <span className="text-sm font-medium text-purple-300">
                      Scarabs:
                    </span>
                    <span className="ml-2 text-sm text-gray-300">
                      {strategy.scarabs.join(", ")}
                    </span>
                  </div>
                )}
                {/* Source / YouTube Link */}
{strategy.source && (
  <div className="mt-2">
    <span className="text-sm font-medium text-purple-300">Source:</span>
    <a 
      href={strategy.source} 
      target="_blank" 
      rel="noopener noreferrer" 
      className="ml-2 text-sm text-blue-400 hover:underline"
    >
      Watch on YouTube
    </a>
  </div>
)}

                {/* Tags */}
                {strategy.tags && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {strategy.tags.map((tag) => (
                      <span
                        key={tag}
                        className="bg-gray-800 text-xs px-2 py-0.5 rounded-full"
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
          <div className="text-center py-8 text-gray-400">
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
