// components/modifiers/ModifierGroup.jsx
import React from "react";

function ModifierGroup({ name, modifiers }) {
  if (!Array.isArray(modifiers) || modifiers.length === 0) {
    return null;
  }
  
  return (
    <div className="border-t border-slate-800 pt-4">
      <h3 className="font-semibold text-base text-amber-400 border-l-4 border-amber-400 pl-2 mb-3">
        {name}
      </h3>
      <ul className="space-y-2 minimal-scrollbar">
        {modifiers.map((mod, index) => {
          if (!mod) return null;
          
          // Display Mod or mod property
          const displayMod = mod.mod || mod.Mod;
          if (!displayMod) return null;
          
          // Set color based on modifier type
          const textColorClass = 
            mod.type === 'prefix' ? 'text-blue-200' : 
            mod.type === 'suffix' ? 'text-green-200' : 
            'text-pink-200';
          
          return (
            <li 
              key={index} 
              className="flex justify-between text-sm py-1 hover:bg-slate-800/30 px-2 rounded transition-colors"
            >
              <span className={`text-slate-200 ${textColorClass}`}>
                {displayMod}
              </span>
              {mod.count > 1 && (
                <span className="text-slate-400 ml-2 font-medium">
                  ({mod.count}×)
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default React.memo(ModifierGroup);