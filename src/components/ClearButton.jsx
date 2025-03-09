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
        <div className="fixed inset-0 bg-slate-950 bg-opacity-80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-xl p-6 max-w-md w-full shadow-lg border border-slate-800">
            <div className="flex justify-between items-start mb-5">
              <h2 className="text-xl font-bold text-white">Clear All Data</h2>
              <button
                onClick={() => setShowConfirm(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-slate-300 mb-4">
                Are you sure you want to clear all idols and grid layout? This action cannot be undone.
              </p>
              
              <div className="bg-red-900/30 border border-red-800 p-4 rounded-lg">
                <p className="text-red-200 font-medium mb-2">Warning:</p>
                <ul className="text-red-100 text-sm space-y-2 ml-4 list-disc">
                  <li>All idols in your inventory will be removed</li>
                  <li>Your grid layout will be completely reset</li>
                  <li>All saved data will be deleted</li>
                </ul>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                className="px-4 py-2 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-500 text-white font-medium transition-colors"
                onClick={confirmClear}
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClearButton;