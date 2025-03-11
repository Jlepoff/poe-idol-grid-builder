// components/grid/OptimizeButton.jsx
import React, { useState } from "react";
import Button from "../common/Button";

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

    setTimeout(() => {
      const optimizationResults = onOptimize();
      setResults(optimizationResults);
      setShowResults(true);
      setIsOptimizing(false);
    }, 500);
  };

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
      <Button
        variant="primary"
        onClick={handleOptimize}
        disabled={isOptimizing}
        title="Automatically arrange inventory idols on the grid"
        icon={
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
        }
      >
        {isOptimizing ? "Optimizing..." : "Smart Fill Grid"}
      </Button>

      {showResults && (
        <div className="absolute right-0 mt-2 p-4 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-10 w-72">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium text-white">Results</h3>
            <button
              onClick={() => setShowResults(false)}
              className="text-slate-400 hover:text-slate-200 transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="text-sm space-y-3">
            <div className="text-green-400 font-medium">
              {results.placedCount} idols placed
            </div>

            {results.notPlacedCount > 0 && (
              <div className="bg-slate-850 p-3 rounded-lg border border-slate-700">
                <div className="text-yellow-400 font-medium mb-2">
                  {results.notPlacedCount} couldn't be placed:
                </div>
                <ul className="space-y-1 ml-4 list-disc text-xs text-slate-300">
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