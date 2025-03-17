// components/common/ClearButton.jsx
import React, { useState, useCallback } from "react";
import Button from "./Button";
import { clearSavedData } from "../../utils/storage/storageUtils";

const ClearButton = ({ onClear }) => {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleShowConfirm = useCallback(() => {
    setShowConfirm(true);
  }, []);

  const handleCancelConfirm = useCallback(() => {
    setShowConfirm(false);
  }, []);

  const confirmClear = useCallback(() => {
    clearSavedData();
    onClear();
    setShowConfirm(false);
  }, [onClear]);

  return (
    <div className="relative">
      <Button
        variant="danger"
        onClick={handleShowConfirm}
        title="Clear all idols and grid layout"
        className="flex items-center gap-2"
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
      </Button>

      {showConfirm && (
        <div className="absolute right-0 mt-2 p-4 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-10 w-72">
          <p className="text-sm mb-4 text-slate-300">
            Are you sure you want to clear all idols and grid layout?
          </p>
          <div className="flex justify-end space-x-3">
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={handleCancelConfirm}
            >
              Cancel
            </Button>
            <Button 
              variant="danger" 
              size="sm" 
              onClick={confirmClear}
            >
              Clear
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(ClearButton);