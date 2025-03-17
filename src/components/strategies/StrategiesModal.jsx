// components/strategies/StrategiesModal.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";

// Component for loading spinner
const LoadingSpinner = () => (
  <div className="py-12 text-center text-slate-400">
    <svg
      className="animate-spin h-8 w-8 mx-auto mb-4 text-indigo-500"
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
    Loading strategies...
  </div>
);

// Component for error state
const ErrorDisplay = ({ error }) => (
  <div className="py-6 text-center text-red-400 border border-red-900 rounded-lg bg-red-900 bg-opacity-20">
    {error}
    <div className="mt-3 text-xs">
      Make sure the file exists at: /data/strategies.json
    </div>
  </div>
);

// Component for empty state
const EmptyState = ({ hasFilter }) => (
  <div className="text-center py-12 text-slate-400 border border-dashed border-slate-700 rounded-lg">
    {hasFilter
      ? "No strategies match your search"
      : "No strategies available"}
  </div>
);

// Component for strategy card
const StrategyCard = ({ strategy, onLoadStrategy }) => {
  const handleClick = () => onLoadStrategy(strategy);
  
  const handleButtonClick = (e) => {
    e.stopPropagation();
    onLoadStrategy(strategy);
  };
  
  const handleLinkClick = (e) => {
    e.stopPropagation();
  };

  return (
    <li
      className="bg-slate-800 rounded-lg p-4 hover:bg-slate-750 transition-colors border border-slate-700 cursor-pointer"
      onClick={handleClick}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold text-indigo-300">{strategy.name}</h3>
          <p className="text-sm text-slate-400 mt-1">By: {strategy.author}</p>
        </div>
        <button
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm py-1.5 px-3 rounded-md transition-colors shadow-sm"
          onClick={handleButtonClick}
        >
          Load Strategy
        </button>
      </div>
      <p className="text-sm mt-2 text-slate-300">{strategy.description}</p>

      {strategy.mapdevice && (
        <div className="mt-3">
          <span className="text-sm font-medium text-indigo-300">Map Device:</span>
          <span className="ml-2 text-sm text-slate-300">{strategy.mapdevice}</span>
        </div>
      )}

      {strategy.scarabs && strategy.scarabs.length > 0 && (
        <div className="mt-2">
          <span className="text-sm font-medium text-indigo-300">Scarabs:</span>
          <span className="ml-2 text-sm text-slate-300">
            {strategy.scarabs.join(", ")}
          </span>
        </div>
      )}

      {strategy.source && (
        <div className="mt-2">
          <span className="text-sm font-medium text-indigo-300">Source:</span>
          <a
            href={strategy.source}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 text-sm text-indigo-400 hover:text-indigo-300 hover:underline transition-colors"
            onClick={handleLinkClick}
          >
            Watch on YouTube
          </a>
        </div>
      )}

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
  );
};

function StrategiesModal({ onClose, onLoadStrategy }) {
  const [strategies, setStrategies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("");

  // Effect for keyboard event listeners
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Effect for fetching strategies
  useEffect(() => {
    const fetchStrategies = async () => {
      try {
        setLoading(true);
        // Use a relative path and process.env.PUBLIC_URL to ensure correct path resolution
        const baseUrl = process.env.PUBLIC_URL || "";
        const response = await fetch(`${baseUrl}/data/strategies.json`);

        if (!response.ok) {
          throw new Error(`Failed to load strategies (Status: ${response.status})`);
        }

        const data = await response.json();
        setStrategies(data);
        setError(null);
      } catch (err) {
        console.error("Error loading strategies:", err);
        setError(`Failed to load strategies. ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchStrategies();
  }, []);

  // Memoized filtered strategies for better performance
  const filteredStrategies = useMemo(() => {
    if (!filter) return strategies;
    
    const lowerFilter = filter.toLowerCase();
    return strategies.filter(
      (strategy) =>
        strategy.name.toLowerCase().includes(lowerFilter) ||
        strategy.author.toLowerCase().includes(lowerFilter) ||
        strategy.description.toLowerCase().includes(lowerFilter) ||
        (strategy.tags &&
          strategy.tags.some((tag) => tag.toLowerCase().includes(lowerFilter))) ||
        (strategy.mapdevice && strategy.mapdevice.toLowerCase().includes(lowerFilter)) ||
        (strategy.scarabs &&
          strategy.scarabs.some((scarab) => scarab.toLowerCase().includes(lowerFilter)))
    );
  }, [strategies, filter]);

  // Callback for loading a strategy
  const handleLoadStrategy = useCallback(
    (strategy) => {
      onLoadStrategy(strategy.shareUrl);
      onClose();
    },
    [onLoadStrategy, onClose]
  );

  // Handler for filter input changes
  const handleFilterChange = (e) => setFilter(e.target.value);

  return (
    <div className="fixed inset-0 bg-slate-950 bg-opacity-80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-xl p-6 max-w-2xl w-full shadow-lg border border-slate-800 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-start mb-5">
          <h2 className="text-2xl font-bold text-white">
            Community Strategies
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="mb-5">
          <input
            type="text"
            placeholder="Search by name, author, description, tags..."
            className="w-full bg-slate-800 p-3 rounded-lg border border-slate-700 text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
            value={filter}
            onChange={handleFilterChange}
          />
        </div>

        <div className="flex-grow overflow-y-auto pr-1 minimal-scrollbar">
          {loading ? (
            <LoadingSpinner />
          ) : error ? (
            <ErrorDisplay error={error} />
          ) : filteredStrategies.length > 0 ? (
            <ul className="space-y-4">
              {filteredStrategies.map((strategy) => (
                <StrategyCard
                  key={strategy.id}
                  strategy={strategy}
                  onLoadStrategy={handleLoadStrategy}
                />
              ))}
            </ul>
          ) : (
            <EmptyState hasFilter={!!filter} />
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800">
          <p className="text-sm text-slate-400">
            These are community strategies for Path of Exile mapping. Click on a
            strategy to load its idol configuration.
          </p>
        </div>
      </div>
    </div>
  );
}

export default StrategiesModal;