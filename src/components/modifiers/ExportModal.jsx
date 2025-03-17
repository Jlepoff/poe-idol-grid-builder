// components/modifiers/ExportModal.jsx
import React, { useState, memo } from "react";
import Button from "../common/Button";

function ExportModal({
  onClose,
  availableStrategies,
  selectedStrategies,
  setSelectedStrategies,
  includeUniques,
  setIncludeUniques,
  exportText
}) {
  const [copySuccess, setCopySuccess] = useState(false);

  // Toggle strategy selection
  const toggleStrategy = (strategy) => {
    setSelectedStrategies(prev => 
      prev.includes(strategy)
        ? prev.filter(s => s !== strategy)
        : [...prev, strategy]
    );
  };

  // Copy export text to clipboard
  const handleCopyText = () => {
    navigator.clipboard.writeText(exportText).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-950 bg-opacity-80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-xl p-6 max-w-lg w-full shadow-lg border border-slate-800">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-xl font-bold text-white">Export Modifiers</h2>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        
        <div className="mb-6">
          <label className="block mb-3 text-base font-medium text-slate-300">
            Select Strategy Type(s)
          </label>
          
          <div className="grid grid-cols-3 gap-2 mb-6">
            {availableStrategies.length === 0 ? (
              <div className="col-span-3 text-center text-slate-400 py-2">
                No strategy-specific modifiers detected
              </div>
            ) : (
              availableStrategies.map(strategy => (
                <div 
                  key={strategy}
                  onClick={() => toggleStrategy(strategy)}
                  className={`cursor-pointer p-2 rounded-md text-center text-sm ${
                    selectedStrategies.includes(strategy) 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  } transition-colors`}
                  role="checkbox"
                  aria-checked={selectedStrategies.includes(strategy)}
                  tabIndex={0}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      toggleStrategy(strategy);
                    }
                  }}
                >
                  {strategy}
                </div>
              ))
            )}
          </div>

          <div className="flex items-center mb-6">
            <input
              type="checkbox"
              id="includeUniques"
              checked={includeUniques}
              onChange={(e) => setIncludeUniques(e.target.checked)}
              className="mr-2 h-4 w-4 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500 focus:ring-opacity-50 focus:ring-offset-0 transition-colors cursor-pointer"
            />
            <label 
              htmlFor="includeUniques" 
              className="text-sm text-slate-300 hover:text-slate-200 transition-colors cursor-pointer select-none"
            >
              Include Unique(s)
            </label>
          </div>
        </div>
        
        <div className="bg-slate-800 p-4 rounded-lg max-h-60 overflow-y-auto font-mono text-sm text-slate-300 mb-6">
          <pre>{exportText}</pre>
        </div>
        
        <div className="flex justify-end">
          <Button 
            onClick={handleCopyText}
            variant={copySuccess ? "primary" : "amber"}
          >
            {copySuccess ? 'Copied!' : 'Copy Text'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default memo(ExportModal);