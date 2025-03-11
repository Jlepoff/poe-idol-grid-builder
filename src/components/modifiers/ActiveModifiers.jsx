// components/modifiers/ActiveModifiers.jsx
import React, { useMemo, useState, useEffect } from "react";
import { useContext } from "react";
import { AppContext } from "../../context/AppContext";
import Card from "../common/Card";
import Button from "../common/Button";
import { calculateStackedModifiers } from "../../utils/modifiers/modifierUtils";

function ActiveModifiers() {
  const { gridState } = useContext(AppContext);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedStrategies, setSelectedStrategies] = useState([]);
  const [copySuccess, setCopySuccess] = useState(false);
  const [includeUniques, setIncludeUniques] = useState(false);

  // Extract active modifiers from placed idols
  const activeModifiers = useMemo(() => {
    if (!gridState || !Array.isArray(gridState)) {
      return [];
    }
    return calculateStackedModifiers(gridState);
  }, [gridState]);

  // Group modifiers by name
  const groupedModifiers = useMemo(() => {
    if (!activeModifiers || !Array.isArray(activeModifiers) || activeModifiers.length === 0) {
      return {};
    }
    
    const groups = {};
    groups["Unique"] = activeModifiers.filter((mod) => mod && mod.isUnique);

    activeModifiers
      .filter((mod) => mod && !mod.isUnique)
      .forEach((mod) => {
        if (!mod || !mod.name) return;
        
        const nameKey = mod.name;
        if (!groups[nameKey]) groups[nameKey] = [];
        groups[nameKey].push(mod);
      });

    Object.keys(groups).forEach((key) => {
      if (!groups[key] || groups[key].length === 0) delete groups[key];
    });

    return groups;
  }, [activeModifiers]);

  // Filter modifiers for export based on user selections
  const exportableModifiers = useMemo(() => {
    if (!activeModifiers || !Array.isArray(activeModifiers)) {
      return [];
    }
    return activeModifiers.filter(mod => mod && (includeUniques || !mod.isUnique));
  }, [activeModifiers, includeUniques]);

  // Get idol type counts for export
  const idolTypeCounts = useMemo(() => {
    if (!gridState || !Array.isArray(gridState)) {
      return {};
    }
    
    const typeCounts = {};
    const processedCells = new Set();
    
    for (let row = 0; row < gridState.length; row++) {
      for (let col = 0; col < gridState[row].length; col++) {
        const cell = gridState[row][col];
        if (!cell) continue;

        const idolPos = cell.position || { row, col };
        const cellKey = `${idolPos.row}-${idolPos.col}`;

        if (!processedCells.has(cellKey)) {
          processedCells.add(cellKey);
          
          if (!cell.isUnique || includeUniques) {
            const type = cell.type || "Minor Idol";
            typeCounts[type] = (typeCounts[type] || 0) + 1;
          }
        }
      }
    }
    
    return typeCounts;
  }, [gridState, includeUniques]);

  // Reset selected strategies when grid changes
  useEffect(() => {
    setSelectedStrategies([]);
  }, [gridState]);

  // Get available strategies for the selection dropdown
  const availableStrategies = useMemo(() => {
    if (!groupedModifiers || typeof groupedModifiers !== 'object') {
      return [];
    }
    
    return Object.keys(groupedModifiers)
      .filter(key => key !== "Unique")
      .sort();
  }, [groupedModifiers]);

  // Generate export text
  const generateExportText = () => {
    const strategyText = selectedStrategies.length > 0
      ? `Strategy: ${selectedStrategies.join(', ')}`
      : 'Strategy:';
    
    const statsText = exportableModifiers.map(mod => {
      if (!mod || !mod.mod) return '';
      
      let modText = mod.mod;
      if (mod.count > 1) {
        modText = `${modText} (${mod.count}x)`;
      }
      return `- ${modText}`;
    }).filter(text => text).join('\n');

    // Include unique idols if selected
    let uniqueIdolsText = '';
    if (includeUniques) {
      const processedCells = new Set();
      const uniqueIdols = [];

      for (let row = 0; row < (gridState?.length || 0); row++) {
        for (let col = 0; col < (gridState[row]?.length || 0); col++) {
          const cell = gridState[row][col];
          if (!cell || !cell.isUnique) continue;

          const idolPos = cell.position || { row, col };
          const cellKey = `${idolPos.row}-${idolPos.col}`;

          if (!processedCells.has(cellKey)) {
            processedCells.add(cellKey);
            uniqueIdols.push(cell.name || 'Unnamed Unique Idol');
          }
        }
      }

      uniqueIdolsText = uniqueIdols.length > 0
        ? `\n\nUnique Idols:\n${uniqueIdols.map(name => `- ${name}`).join('\n')}`
        : '';
    }
    
    const typesText = Object.entries(idolTypeCounts)
      .map(([type, count]) => `- ${count}x ${type}`)
      .join('\n');
    
    return `${strategyText}\nIdol Stats:\n${statsText}${uniqueIdolsText}\n\nIdol Types:\n${typesText}`;
  };

  // Copy export text to clipboard
  const handleCopyText = () => {
    const textToCopy = generateExportText();
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  if (!activeModifiers || activeModifiers.length === 0) {
    return (
      <Card title="Active Modifiers">
        <p className="text-slate-400">
          No active modifiers. Place idols on the grid to see their effects.
        </p>
      </Card>
    );
  }

  return (
    <Card 
      title="Active Modifiers"
      headerRight={
        <Button 
          variant="amber" 
          size="sm" 
          onClick={() => setShowExportModal(true)}
        >
          Export to Text
        </Button>
      }
    >
      <div className="space-y-6">
        {Object.entries(groupedModifiers).map(([name, mods]) => {
          if (!mods || !Array.isArray(mods) || mods.length === 0) return null;
          
          return (
            <div key={name} className="border-t border-slate-800 pt-4">
              <h3 className="font-semibold text-base text-amber-400 border-l-4 border-amber-400 pl-2 mb-3">
                {name}
              </h3>
              <ul className="space-y-2 minimal-scrollbar">
                {mods.map((mod, index) => {
                  if (!mod || !mod.mod) return null;
                  
                  return (
                    <li key={index} className="flex justify-between text-sm py-1 hover:bg-slate-800/30 px-2 rounded transition-colors">
                      <span className={`text-slate-200 ${mod.type === 'prefix' ? 'text-blue-200' : mod.type === 'suffix' ? 'text-green-200' : 'text-pink-200'}`}>
                        {mod.mod}
                      </span>
                      <span className="text-slate-400 ml-2 font-medium">
                        {mod.count > 1 ? `(${mod.count}×)` : ""}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
      

      {showExportModal && (
        <div className="fixed inset-0 bg-slate-950 bg-opacity-80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-xl p-6 max-w-lg w-full shadow-lg border border-slate-800">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-xl font-bold text-white">Export Modifiers</h2>
              <button 
                onClick={() => setShowExportModal(false)} 
                className="text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-6">
              <label className="block mb-3 text-base font-medium text-slate-300">Select Strategy Type(s)</label>
              <div className="grid grid-cols-3 gap-2 mb-6">
                {availableStrategies.length === 0 ? (
                  <div className="col-span-3 text-center text-slate-400 py-2">
                    No strategy-specific modifiers detected
                  </div>
                ) : (
                  <>
                    {availableStrategies.map(strategy => (
                      <div 
                        key={strategy}
                        onClick={() => {
                          setSelectedStrategies(prev => 
                            prev.includes(strategy)
                              ? prev.filter(s => s !== strategy)
                              : [...prev, strategy]
                          );
                        }}
                        className={`cursor-pointer p-2 rounded-md text-center text-sm ${
                          selectedStrategies.includes(strategy) 
                            ? 'bg-indigo-600 text-white' 
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        } transition-colors`}
                      >
                        {strategy}
                      </div>
                    ))}
                  </>
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
              <pre>{generateExportText()}</pre>
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
      )}
    </Card>
  );
}

export default ActiveModifiers;