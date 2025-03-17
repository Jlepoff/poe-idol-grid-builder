// components/modifiers/ActiveModifiers.jsx
import React, { useMemo, useState, useEffect, useContext, memo } from "react";
import { AppContext } from "../../context/AppContext";
import Card from "../common/Card";
import Button from "../common/Button";
import { calculateStackedModifiers } from "../../utils/modifiers/modifierUtils";
import ExportModal from "./ExportModal";
import ModifierGroup from "./ModifierGroup";


// Memoized sub-components
const ModifierItem = memo(({ mod, count }) => {
  const textColorClass = 
    mod.type === 'prefix' ? 'text-blue-200' : 
    mod.type === 'suffix' ? 'text-green-200' : 
    'text-pink-200';
  
  const displayMod = mod.mod || mod.Mod;
  
  return (
    <li className="flex justify-between text-sm py-1 hover:bg-slate-800/30 px-2 rounded transition-colors">
      <span className={`text-slate-200 ${textColorClass}`}>
        {displayMod}
      </span>
      {count > 1 && (
        <span className="text-slate-400 ml-2 font-medium">
          ({count}×)
        </span>
      )}
    </li>
  );
});

ModifierItem.displayName = 'ModifierItem';

// Memoized ModifierGroup component
const MemoizedModifierGroup = memo(({ name, modifiers }) => {
  if (!Array.isArray(modifiers) || modifiers.length === 0) {
    return null;
  }

  return (
    <div className="border-t border-slate-800 pt-4">
      <h3 className="font-semibold text-base text-amber-400 border-l-4 border-amber-400 pl-2 mb-3">
        {name}
      </h3>
      <ul className="space-y-2 minimal-scrollbar">
        {modifiers.map((mod, index) => (
          mod && (mod.mod || mod.Mod) ? (
            <ModifierItem 
              key={`${name}-${index}`}
              mod={mod}
              count={mod.count || 1}
            />
          ) : null
        ))}
      </ul>
    </div>
  );
});

MemoizedModifierGroup.displayName = 'MemoizedModifierGroup';

function ActiveModifiers() {
  const { gridState } = useContext(AppContext);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedStrategies, setSelectedStrategies] = useState([]);
  const [includeUniques, setIncludeUniques] = useState(false);

  // Memoize active modifiers calculation
  const activeModifiers = useMemo(() => {
    if (!Array.isArray(gridState)) return [];
    return calculateStackedModifiers(gridState);
  }, [gridState]);

  // Memoize grouped modifiers
  const groupedModifiers = useMemo(() => {
    if (!Array.isArray(activeModifiers) || activeModifiers.length === 0) {
      return {};
    }
    
    const groups = {
      Unique: activeModifiers.filter(mod => mod?.isUnique)
    };

    // Process non-unique modifiers
    activeModifiers
      .filter(mod => mod && !mod.isUnique)
      .forEach(mod => {
        if (!mod?.name) return;
        
        const nameKey = mod.name;
        if (!groups[nameKey]) groups[nameKey] = [];
        groups[nameKey].push(mod);
      });

    // Remove empty groups
    return Object.fromEntries(
      Object.entries(groups).filter(([_, mods]) => mods?.length > 0)
    );
  }, [activeModifiers]);

  // Memoize exportable modifiers
  const exportableModifiers = useMemo(() => {
    if (!Array.isArray(activeModifiers)) return [];
    return activeModifiers.filter(mod => mod && (includeUniques || !mod.isUnique));
  }, [activeModifiers, includeUniques]);

  // Memoize idol type counts
  const idolTypeCounts = useMemo(() => {
    if (!Array.isArray(gridState)) return {};
    
    const typeCounts = {};
    const processedCells = new Set();
    
    gridState.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        if (!cell) return;

        const idolPos = cell.position || { row: rowIndex, col: colIndex };
        const cellKey = `${idolPos.row}-${idolPos.col}`;

        if (!processedCells.has(cellKey)) {
          processedCells.add(cellKey);
          
          if (!cell.isUnique || includeUniques) {
            const type = cell.type || "Minor Idol";
            typeCounts[type] = (typeCounts[type] || 0) + 1;
          }
        }
      });
    });
    
    return typeCounts;
  }, [gridState, includeUniques]);

  // Generate export text
  const generateExportText = () => {
    // Strategy section
    const strategyText = selectedStrategies.length > 0
      ? `Strategy: ${selectedStrategies.join(', ')}`
      : 'Strategy:';
    
    // Stats section - split into normal and unique modifiers
    const normalMods = exportableModifiers.filter(mod => !mod?.isUnique);
    const uniqueMods = exportableModifiers.filter(mod => mod?.isUnique);

    const normalModsText = normalMods.map(mod => {
      if (!mod || (!mod.mod && !mod.Mod)) return '';
      let modText = mod.mod || mod.Mod;
      if (mod.count > 1) {
        modText = `${modText} (${mod.count}x)`;
      }
      return `- ${modText}`;
    }).filter(Boolean).join('\n');

    const uniqueModsText = uniqueMods.length > 0 
      ? '\nUnique Modifiers:\n' + uniqueMods.map(mod => {
          if (!mod || (!mod.mod && !mod.Mod)) return '';
          let modText = mod.mod || mod.Mod;
          if (mod.count > 1) {
            modText = `${modText} (${mod.count}x)`;
          }
          return `- ${modText}`;
        }).filter(Boolean).join('\n')
      : '';

    const statsText = normalModsText + uniqueModsText;

    // Unique idols section
    let uniqueIdolsText = '';
    if (includeUniques) {
      const processedCells = new Set();
      const uniqueIdols = [];

      gridState?.forEach((row, rowIndex) => {
        row?.forEach((cell, colIndex) => {
          if (!cell?.isUnique) return;

          const idolPos = cell.position || { row: rowIndex, col: colIndex };
          const cellKey = `${idolPos.row}-${idolPos.col}`;

          if (!processedCells.has(cellKey)) {
            processedCells.add(cellKey);
            uniqueIdols.push(cell.name || 'Unnamed Unique Idol');
          }
        });
      });

      uniqueIdolsText = uniqueIdols.length > 0
        ? `\n\nUnique Idols:\n${uniqueIdols.map(name => `- ${name}`).join('\n')}`
        : '';
    }
    
    // Idol types section
    const typesText = Object.entries(idolTypeCounts)
      .map(([type, count]) => `- ${count}x ${type}`)
      .join('\n');
    
    return `${strategyText}\nIdol Stats:\n${statsText}${uniqueIdolsText}\n\nIdol Types:\n${typesText}`;
  };

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

  // Empty state
  if (!activeModifiers?.length) {
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
        {Object.entries(groupedModifiers).map(([name, mods]) => (
          <ModifierGroup key={name} name={name} modifiers={mods} />
        ))}
      </div>
      
      {showExportModal && (
        <ExportModal
          onClose={() => setShowExportModal(false)}
          availableStrategies={availableStrategies}
          selectedStrategies={selectedStrategies}
          setSelectedStrategies={setSelectedStrategies}
          includeUniques={includeUniques}
          setIncludeUniques={setIncludeUniques}
          exportText={generateExportText()}
        />
      )}
    </Card>
  );
}

export default memo(ActiveModifiers);