import React, { useMemo, useState, useEffect } from "react";


function ActiveModifiers({ gridState }) {
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedStrategies, setSelectedStrategies] = useState([]);
  const [copySuccess, setCopySuccess] = useState(false);
  
  // We'll derive available strategies directly from grouped modifiers

  const activeModifiers = useMemo(() => {
    const processedCells = new Set();
    const placedIdols = [];

    // Collect all placed idols
    for (let row = 0; row < gridState.length; row++) {
      for (let col = 0; col < gridState[row].length; col++) {
        const cell = gridState[row][col];
        if (!cell) continue;

        const idolPos = cell.position || { row, col };
        const cellKey = `${idolPos.row}-${idolPos.col}`;

        if (!processedCells.has(cellKey)) {
          processedCells.add(cellKey);
          placedIdols.push(cell);
        }
      }
    }

    const modGroups = new Map();

    placedIdols.forEach((idol) => {
      if (idol.isUnique && idol.uniqueModifiers) {
        idol.uniqueModifiers.forEach((mod) => {
          const modKey = mod.Mod;
          if (!modGroups.has(modKey)) {
            modGroups.set(modKey, {
              name: "Unique",
              mod: mod.Mod,
              count: 1,
              type: "unique",
              family: "Unique",
              matchPattern: getMatchPattern(mod.Mod),
              isUnique: true,
              instances: [{ value: null, text: mod.Mod }],
            });
          } else {
            modGroups.get(modKey).count += 1;
          }
        });
        return;
      }

      if (idol.prefixes) {
        idol.prefixes.forEach((prefix) => {
          const baseKey = getBaseEffectKey(prefix.Mod);
          if (!modGroups.has(baseKey)) {
            modGroups.set(baseKey, {
              name: prefix.Name,
              mod: prefix.Mod,
              count: 1,
              type: "prefix",
              family: prefix.Family || "Unknown",
              matchPattern: getMatchPattern(prefix.Mod),
              instances: [{ value: getMatchPattern(prefix.Mod).value, text: prefix.Mod }],
            });
          } else {
            const group = modGroups.get(baseKey);
            group.count += 1;
            group.instances.push({ value: getMatchPattern(prefix.Mod).value, text: prefix.Mod });
          }
        });
      }

      if (idol.suffixes) {
        idol.suffixes.forEach((suffix) => {
          const baseKey = getBaseEffectKey(suffix.Mod);
          if (!modGroups.has(baseKey)) {
            modGroups.set(baseKey, {
              name: suffix.Name,
              mod: suffix.Mod,
              count: 1,
              type: "suffix",
              family: suffix.Family || "Unknown",
              matchPattern: getMatchPattern(suffix.Mod),
              instances: [{ value: getMatchPattern(suffix.Mod).value, text: suffix.Mod }],
            });
          } else {
            const group = modGroups.get(baseKey);
            group.count += 1;
            group.instances.push({ value: getMatchPattern(suffix.Mod).value, text: suffix.Mod });
          }
        });
      }
    });

    const stackedModifiers = Array.from(modGroups.values()).map((group) => {
      if (group.matchPattern.type === "unstackable" || group.isUnique) {
        return group;
      }

      // Stack numeric values and round to 1 decimal place
      const totalValue = Number(
        group.instances
          .reduce((sum, inst) => sum + (inst.value || 0), 0)
          .toFixed(1)
      );
      const stackedMod = { ...group };

      if (group.matchPattern.type === "additional" && !totalValue) {
        stackedMod.mod = group.mod.replace(/an additional/i, `${group.count} additional`);
      } else {
        stackedMod.mod = group.mod.replace(
          /(\d+(?:\.\d+)?)(%|\s|$)/,
          `${totalValue}$2`
        );
      }
      stackedMod.stackedValue = totalValue;
      return stackedMod;
    });

    return stackedModifiers.sort((a, b) => {
      if (a.name !== b.name) return a.name.localeCompare(b.name);
      return a.type.localeCompare(b.type);
    });
  }, [gridState]);

  const groupedModifiers = useMemo(() => {
    const groups = {};
    groups["Unique"] = activeModifiers.filter((mod) => mod.isUnique);

    activeModifiers
      .filter((mod) => !mod.isUnique)
      .forEach((mod) => {
        const nameKey = mod.name;
        if (!groups[nameKey]) groups[nameKey] = [];
        groups[nameKey].push(mod);
      });

    Object.keys(groups).forEach((key) => {
      if (groups[key].length === 0) delete groups[key];
    });

    return groups;
  }, [activeModifiers]);

  function getMatchPattern(modText) {
    const patterns = [
      { type: "plusChance", regex: /\+(\d+(?:\.\d+)?)%\s+chance/i },
      { type: "haveChance", regex: /have\s+(\d+(?:\.\d+)?)%\s+(?:increased\s+)?chance/i },
      { type: "increased", regex: /(\d+(?:\.\d+)?)%\s+increased/i },
      { type: "more", regex: /(\d+(?:\.\d+)?)%\s+more/i },
      { type: "reduced", regex: /(\d+(?:\.\d+)?)%\s+reduced/i },
      { type: "faster", regex: /(\d+(?:\.\d+)?)%\s+faster/i },
      { type: "slower", regex: /(\d+(?:\.\d+)?)%\s+slower/i },
      { type: "additional", regex: /additional/i },
      { type: "numeric", regex: /(\d+(?:\.\d+)?)/ },
    ];

    for (const { type, regex } of patterns) {
      const match = modText.match(regex);
      if (match) {
        return {
          type,
          value: type !== "additional" ? parseFloat(match[1]) : (modText.match(/(\d+)/)?.[1] ? parseFloat(modText.match(/(\d+)/)[1]) : 1),
          fullText: modText,
        };
      }
    }

    return { type: "unstackable", value: null, fullText: modText };
  }

  function getBaseEffectKey(modText) {
    return modText
      .replace(/(\d+(?:\.\d+)?)(%|\s|$)/g, "X$2")
      .replace(/\s+/g, " ")
      .trim();
  }

  // Filter out unique modifiers for export
  const exportableModifiers = useMemo(() => {
    return activeModifiers.filter(mod => !mod.isUnique);
  }, [activeModifiers]);

  // Count idol types for export
  const idolTypeCounts = useMemo(() => {
    const typeCounts = {};
    
    // Collect all placed idols
    const processedCells = new Set();
    
    for (let row = 0; row < gridState.length; row++) {
      for (let col = 0; col < gridState[row].length; col++) {
        const cell = gridState[row][col];
        if (!cell) continue;

        const idolPos = cell.position || { row, col };
        const cellKey = `${idolPos.row}-${idolPos.col}`;

        if (!processedCells.has(cellKey)) {
          processedCells.add(cellKey);
          
          // Count by type
          const type = cell.type;
          typeCounts[type] = (typeCounts[type] || 0) + 1;
        }
      }
    }
    
    return typeCounts;
  }, [gridState]);

  useEffect(() => {
    setSelectedStrategies([]);
  }, [gridState]);

  // Get available strategies directly from groupedModifiers
  const availableStrategies = useMemo(() => {
    return Object.keys(groupedModifiers)
      .filter(key => key !== "Unique")
      .sort();
  }, [groupedModifiers]);

  // Generate export text
  const generateExportText = () => {
    // Format strategy name
    const strategyText = selectedStrategies.length > 0
      ? `Strategy: ${selectedStrategies.join(', ')}` 
      : 'Strategy:';
    
    // Format modifier stats
    const statsText = exportableModifiers.map(mod => {
      if (mod.count > 1) {
        return `- ${mod.mod} (${mod.count}x)`;
      }
      return `- ${mod.mod}`;
    }).join('\n');
    
    // Format idol types
    const typesText = Object.entries(idolTypeCounts)
      .map(([type, count]) => `- ${count}x ${type}`)
      .join('\n');
    
    return `${strategyText}\nIdol Stats:\n${statsText}\n\nIdol Types:\n${typesText}`;
  };

  // Handle copy to clipboard
  const handleCopyText = () => {
    const textToCopy = generateExportText();
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  if (activeModifiers.length === 0) {
    return (
      <div className="bg-slate-900 p-5 rounded-xl shadow-sm">
        <h2 className="text-xl font-bold mb-2 text-white">Active Modifiers</h2>
        <p className="text-slate-400">
          No active modifiers. Place idols on the grid to see their effects.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 p-5 rounded-xl shadow-sm">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-xl font-bold text-white">Active Modifiers</h2>
        <button 
          onClick={() => setShowExportModal(true)} 
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs py-1.5 px-3 rounded-md transition-colors"
        >
          Export to Text
        </button>
      </div>
      
      <div className="space-y-4">
        {Object.entries(groupedModifiers).map(([name, mods]) => (
          <div key={name} className="border-t border-slate-800 pt-3">
            <h3 className="font-semibold text-amber-400">{name}</h3>
            <ul className="mt-2">
              {mods.map((mod, index) => (
                <li key={index} className="flex justify-between text-sm py-1">
                  <span className="text-slate-200">{mod.mod}</span>
                  <span className="text-slate-400 ml-2">
                    {mod.count > 1 ? `(${mod.count}×)` : ""}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      
      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-slate-950 bg-opacity-80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-xl p-6 max-w-lg w-full shadow-lg border border-slate-800">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-white">Export Modifiers</h2>
              <button 
                onClick={() => setShowExportModal(false)} 
                className="text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block mb-2 text-slate-300">Select Strategy Type(s)</label>
              <div className="grid grid-cols-3 gap-2 mb-4">
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
                          // Toggle strategy selection
                          setSelectedStrategies(prev => 
                            prev.includes(strategy)
                              ? prev.filter(s => s !== strategy) // Remove if already selected
                              : [...prev, strategy]              // Add if not selected
                          );
                        }}
                        className={`cursor-pointer p-2 rounded-md text-center text-sm ${
                          selectedStrategies.includes(strategy) 
                            ? 'bg-indigo-600 text-white' 
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {strategy}
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
            
            <div className="bg-slate-800 p-4 rounded-lg max-h-60 overflow-y-auto font-mono text-sm text-slate-300 mb-5">
              <pre>{generateExportText()}</pre>
            </div>
            
            <div className="flex justify-end">
              <button 
                onClick={handleCopyText}
                className={`px-4 py-2 rounded-md ${
                  copySuccess 
                    ? 'bg-green-600 text-white' 
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                }`}
              >
                {copySuccess ? 'Copied!' : 'Copy Text'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ActiveModifiers;