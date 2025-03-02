// components/IdolDisplay.jsx
import React from "react";

/**
 * Component for displaying idol details in grid cells
 */
function IdolDisplay({ idol }) {
  if (!idol) return null;

  // Determine background color based on idol type
  const typeColors = {
    Minor: "bg-blue-700",
    Kamasan: "bg-green-700",
    Totemic: "bg-yellow-700",
    Noble: "bg-purple-700",
    Conqueror: "bg-red-700",
    Burial: "bg-orange-700",
  };

  const colorClass = typeColors[idol.type] || "bg-gray-700";

  return (
    <div className={`${colorClass} p-2 rounded shadow-lg w-full h-full`}>
      <div className="text-xs font-bold truncate">{idol.name}</div>

      {/* Only show mods on larger screens due to space constraints */}
      <div className="hidden md:block">
        {/* Show prefixes */}
        {idol.prefixes?.length > 0 && (
          <div className="mt-1">
            <div className="text-xs text-gray-300">Prefixes:</div>
            <ul className="text-xs">
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
            <div className="text-xs text-gray-300">Suffixes:</div>
            <ul className="text-xs">
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
            <div className="text-xs text-purple-300">Unique:</div>
            <ul className="text-xs">
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
