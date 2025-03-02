// components/OptimizeButton.jsx
import React, { useState } from "react";

function OptimizeButton({ onOptimize }) {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState({
    placedCount: 0,
    notPlacedCount: 0,
    notPlacedIdols: [],
  });

  const handleOptimize = () => {
    setIsOptimizing(true);

    // Add a slight delay to show loading state
    setTimeout(() => {
      const optimizationResults = onOptimize();
      setResults(optimizationResults);
      setShowResults(true);
      setIsOptimizing(false);
    }, 500);
  };

  // Helper function for more readable error messages
  function getReasonText(reason) {
    switch (reason) {
      case "no_space":
        return "No suitable space";
      case "size_too_large":
        return "Too large for remaining space";
      case "overlapping":
        return "Would overlap other idols";
      case "blocked_cells":
        return "Would cover blocked cells";
      default:
        return "Could not fit in grid";
    }
  }

  return (
    <div className="relative">
      <button
        className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 ${
          isOptimizing
            ? "bg-gray-600 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-500"
        }`}
        onClick={handleOptimize}
        disabled={isOptimizing}
        title="Automatically arrange inventory idols on the grid"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
            clipRule="evenodd"
          />
        </svg>
        {isOptimizing ? "Optimizing..." : "Smart Fill Grid"}
      </button>

      {showResults && (
        <div className="absolute right-0 mt-2 p-3 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10 w-64">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium">Results</h3>
            <button
              onClick={() => setShowResults(false)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="text-sm space-y-2">
            <div className="text-green-400">
              {results.placedCount} idols placed
            </div>

            {results.notPlacedCount > 0 && (
              <div>
                <div className="text-yellow-400">
                  {results.notPlacedCount} couldn't be placed:
                </div>
                <ul className="mt-1 ml-4 list-disc text-xs text-gray-300">
                  {results.notPlacedIdols.map((idol, index) => (
                    <li key={index}>
                      {idol.name} - {getReasonText(idol.reason)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default OptimizeButton;
