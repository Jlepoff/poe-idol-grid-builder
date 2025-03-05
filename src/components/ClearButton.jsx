// components/ClearButton.jsx
import React, { useState } from "react";
import { clearSavedData } from "../utils/storageUtils";

function ClearButton({ onClear }) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleClearClick = () => {
    setShowConfirm(true);
  };

  const confirmClear = () => {
    // Clear localStorage data
    clearSavedData();

    // Notify parent to reset state
    onClear();
    setShowConfirm(false);
  };

  return (
    <div className="relative">
      <button
        className="bg-red-600 hover:bg-red-500 text-white py-2 px-4 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors"
        onClick={handleClearClick}
        title="Clear all idols and grid layout"
      >
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
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
        Clear All
      </button>

      {showConfirm && (
        <div className="absolute right-0 mt-2 p-4 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-10 w-72">
          <p className="text-sm mb-4 text-slate-300">
            Are you sure you want to clear all idols and grid layout?
          </p>
          <div className="flex justify-end space-x-3">
            <button
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-md text-sm transition-colors"
              onClick={() => setShowConfirm(false)}
            >
              Cancel
            </button>
            <button
              className="px-3 py-1.5 bg-red-600 hover:bg-red-500 rounded-md text-sm font-medium transition-colors"
              onClick={confirmClear}
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClearButton;