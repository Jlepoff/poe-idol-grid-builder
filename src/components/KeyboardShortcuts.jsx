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
    <div className="fixed inset-0 bg-slate-950 bg-opacity-80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-xl p-6 max-w-md w-full shadow-lg border border-slate-800">
        <div className="flex justify-between items-start mb-5">
          <h2 className="text-xl font-bold text-white">Keyboard Shortcuts</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center p-3 rounded-lg bg-slate-800 hover:bg-slate-750">
            <span className="font-medium text-indigo-300">Right-click</span>
            <span className="text-slate-300">Remove idol from grid or inventory</span>
          </div>
          <div className="flex justify-between items-center p-3 rounded-lg bg-slate-800 hover:bg-slate-750">
            <span className="font-medium text-indigo-300">Ctrl + V</span>
            <span className="text-slate-300">Paste idol from Path of Exile</span>
          </div>
          <div className="flex justify-between items-center p-3 rounded-lg bg-slate-800 hover:bg-slate-750">
            <span className="font-medium text-indigo-300">Press ?</span>
            <span className="text-slate-300">Show/hide this help dialog</span>
          </div>
          <div className="flex justify-between items-center p-3 rounded-lg bg-slate-800 hover:bg-slate-750">
            <span className="font-medium text-indigo-300">Press Esc</span>
            <span className="text-slate-300">Close dialog windows</span>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={onClose}
            className="bg-indigo-600 hover:bg-indigo-500 py-2.5 px-5 rounded-lg shadow-sm transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default KeyboardShortcuts;