// components/modifiers/ModifierCard.jsx
import React, { memo } from "react";

const ModifierCard = ({ 
  modifier, 
  inModifierList = null, 
  searchContext = "builder", 
  onClick,
  onRemove = null
}) => {
  const isPrefixStyle = modifier.type === "prefix";
  
  const handleClick = () => {
    if (onClick) onClick(modifier, modifier.type);
  };
  
  const handleRightClick = (e) => {
    e.preventDefault();
    if (onRemove) onRemove(modifier);
  };

  return (
    <div
      className={`p-3 rounded-md cursor-pointer transition-colors select-none h-full flex flex-col justify-center
      ${isPrefixStyle 
        ? "bg-gradient-to-r from-blue-900/30 to-slate-800/70 border border-blue-800/50 hover:from-blue-800/30 hover:border-blue-700/70" 
        : "bg-gradient-to-r from-green-900/30 to-slate-800/70 border border-green-800/50 hover:from-green-800/30 hover:border-green-700/70"
      } ${inModifierList ? "ring-1 ring-amber-500/70" : ""}`}
      onClick={handleClick}
      onContextMenu={handleRightClick}
      title={onRemove 
        ? (isPrefixStyle ? "Click to add prefix, right-click to remove" : "Click to add suffix, right-click to remove") 
        : (isPrefixStyle ? "Click to add prefix" : "Click to add suffix")}
    >
      <div className="flex justify-between items-start">
        {inModifierList && (
          <span className="text-yellow-400 font-bold text-xs">
            ({inModifierList.count}×)
          </span>
        )}
      </div>
      
      <div className="text-sm text-slate-300 line-clamp-3">
        {modifier.Mod}
      </div>

      {searchContext === "autogen" && modifier.supportedTypes && (
        <div className="text-slate-400 text-xs mt-1 line-clamp-1">
          Available on: {modifier.supportedTypes.join(", ")}
        </div>
      )}
    </div>
  );
};

export default memo(ModifierCard);