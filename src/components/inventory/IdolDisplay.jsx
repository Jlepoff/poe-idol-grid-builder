// components/inventory/IdolDisplay.jsx
import React, { useMemo } from "react";

const TYPE_COLORS = {
  Minor: "bg-blue-900",
  Kamasan: "bg-green-900",
  Totemic: "bg-yellow-900",
  Noble: "bg-purple-900",
  Conqueror: "bg-red-900",
  Burial: "bg-orange-700"
};

const ModifierList = React.memo(({ title, items, textColor }) => {
  if (!items?.length) return null;
  
  return (
    <div className="mt-1">
      <div className={`text-xs ${textColor} font-medium`}>{title}:</div>
      <ul className="text-xs text-slate-300">
        {items.map((item, index) => (
          <li key={`${title.toLowerCase()}-${index}`} className="truncate">
            {item.Mod}
          </li>
        ))}
      </ul>
    </div>
  );
});

ModifierList.displayName = 'ModifierList';

function IdolDisplay({ idol }) {
  const colorClass = useMemo(() => {
    if (!idol) return "";
    
    return idol.isUnique 
      ? "bg-pink-800"
      : (TYPE_COLORS[idol.type] || "bg-slate-800");
  }, [idol]);
  
  if (!idol) return null;

  return (
    <div className={`${colorClass} p-2 rounded-lg shadow-md w-full h-full`}>
      <div className="text-xs font-bold truncate text-white">
        {idol.name}
      </div>

      <div className="hidden md:block">
        <ModifierList 
          title="Prefixes" 
          items={idol.prefixes} 
          textColor="text-blue-300" 
        />
        
        <ModifierList 
          title="Suffixes" 
          items={idol.suffixes} 
          textColor="text-green-300" 
        />
        
        {idol.isUnique && (
          <ModifierList 
            title="Unique" 
            items={idol.uniqueModifiers} 
            textColor="text-pink-300" 
          />
        )}
      </div>
    </div>
  );
}

export default React.memo(IdolDisplay);