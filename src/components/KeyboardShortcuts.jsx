// components/KeyboardShortcuts.jsx
import React, { useEffect } from "react";

function KeyboardShortcuts({ onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only handle if not in an input field
      if (["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) {
        return;
      }

      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold">Keyboard Shortcuts</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="font-medium">Right-click</span>
            <span>Remove idol from grid or inventory</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Ctrl + V</span>
            <span>Paste idol from Path of Exile</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Press ?</span>
            <span>Show/hide this help dialog</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Press Esc</span>
            <span>Close dialog windows</span>
          </div>
        </div>

        <div className="mt-5 text-center">
          <button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-500 py-2 px-4 rounded"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default KeyboardShortcuts;
