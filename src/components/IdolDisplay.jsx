// components/IdolDisplay.jsx
import React from "react";

/**
 * Component for displaying idol details in grid cells
 */
function IdolDisplay({ idol }) {
  if (!idol) return null;

  // Determine background color based on idol type
  const typeColors = {
    Minor: "bg-blue-900",
    Kamasan: "bg-green-900",
    Totemic: "bg-yellow-900",
    Noble: "bg-purple-900",
    Conqueror: "bg-red-900",
    Burial: "bg-orange-900",
  };

  const colorClass = typeColors[idol.type] || "bg-slate-800";

  return (
    <div className={`${colorClass} p-2 rounded-lg shadow-md w-full h-full`}>
      <div className="text-xs font-bold truncate text-white">{idol.name}</div>

      {/* Only show mods on larger screens due to space constraints */}
      <div className="hidden md:block">
        {/* Show prefixes */}
        {idol.prefixes?.length > 0 && (
          <div className="mt-1">
            <div className="text-xs text-blue-300 font-medium">Prefixes:</div>
            <ul className="text-xs text-slate-300">
              {idol.prefixes.map((prefix, index) => (
                <li key={index} className="truncate">
                  {prefix.Mod}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Show suffixes */}
        {idol.suffixes?.length > 0 && (
          <div className="mt-1">
            <div className="text-xs text-green-300 font-medium">Suffixes:</div>
            <ul className="text-xs text-slate-300">
              {idol.suffixes.map((suffix, index) => (
                <li key={index} className="truncate">
                  {suffix.Mod}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Show unique modifiers */}
        {idol.isUnique && idol.uniqueModifiers?.length > 0 && (
          <div className="mt-1">
            <div className="text-xs text-purple-300 font-medium">Unique:</div>
            <ul className="text-xs text-slate-300">
              {idol.uniqueModifiers.map((mod, index) => (
                <li key={index} className="truncate">
                  {mod.Mod}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default IdolDisplay;