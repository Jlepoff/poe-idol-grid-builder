// components/grid/OptimizeButton.jsx
import React, { useState, useCallback, useMemo } from "react";
import Button from "../common/Button";

const REASON_MAP = {
  "no_space": "No suitable space",
  "size_too_large": "Too large for remaining space",
  "overlapping": "Would overlap other idols",
  "blocked_cells": "Would cover blocked cells"
};

function OptimizeButton({ onOptimize }) {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState({
    placedCount: 0,
    notPlacedCount: 0,
    notPlacedIdols: [],
  });

  const handleOptimize = useCallback(() => {
    setIsOptimizing(true);

    setTimeout(() => {
      const optimizationResults = onOptimize();
      setResults(optimizationResults);
      setShowResults(true);
      setIsOptimizing(false);
    }, 500);
  }, [onOptimize]);

  const handleCloseResults = useCallback(() => {
    setShowResults(false);
  }, []);

  const getReasonText = useCallback((reason) => {
    return REASON_MAP[reason] || "Could not fit in grid";
  }, []);

  const resultsSummary = useMemo(() => {
    if (!showResults) return null;

    return (
      <div className="absolute right-0 mt-2 p-4 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-10 w-72">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-medium text-white">Results</h3>
          <button
            onClick={handleCloseResults}
            className="text-slate-400 hover:text-slate-200 transition-colors"
            aria-label="Close results"
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
                  <li key={idol.id || `unplaced-${index}`}>
                    {idol.name} - {getReasonText(idol.reason)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }, [showResults, results, handleCloseResults, getReasonText]);

  return (
    <div className="relative">
      <Button
        variant="primary"
        onClick={handleOptimize}
        disabled={isOptimizing}
        title="Automatically arrange inventory idols on the grid"
        className="flex items-center gap-2"
      >
        <OptimizeIcon />
        {isOptimizing ? "Optimizing..." : "Smart Fill Grid"}
      </Button>

      {resultsSummary}
    </div>
  );
}

// Extracted SVG icon component
const OptimizeIcon = React.memo(() => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    className="h-4 w-4" 
    fill="none" 
    viewBox="0 0 24 24" 
    stroke="currentColor"
    aria-hidden="true"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" 
    />
  </svg>
));

OptimizeIcon.displayName = 'OptimizeIcon';

export default React.memo(OptimizeButton);