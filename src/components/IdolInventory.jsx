import React from "react";
import { useDrag } from "react-dnd";
import { generateTradeUrl, hasValidTradeData } from "../utils/tradeUtils";

// Individual idol item component
function IdolItem({ idol, onRemoveIdol }) {
  const [{ isDragging }, drag] = useDrag({
    type: "IDOL",
    item: { type: "IDOL", idol },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
    end: (_, monitor) => {
      // Check if the drop was successful
      const dropResult = monitor.getDropResult();
      if (dropResult && !dropResult.success) {
        // Idol remains in inventory if drop failed
        // console.log('Drop failed');
      }
    },
  });

  // Handle right-click to remove idol
  const handleRightClick = (e) => {
    e.preventDefault();
    onRemoveIdol(idol.id);
  };

  // Handle trade link click
  const handleTradeClick = (e) => {
    e.stopPropagation(); // Prevent triggering drag
    const tradeUrl = generateTradeUrl(idol);
    if (tradeUrl) {
      window.open(tradeUrl, "_blank");
    }
  };

  // Color based on idol type - Updated for Burial and Unique
  const typeColors = {
    Minor: "bg-blue-800 bg-opacity-30 border-blue-700",
    Kamasan: "bg-green-800 bg-opacity-30 border-green-700",
    Totemic: "bg-yellow-800 bg-opacity-30 border-yellow-700",
    Noble: "bg-purple-800 bg-opacity-30 border-purple-700",
    Conqueror: "bg-red-800 bg-opacity-30 border-red-700",
    Burial: "bg-orange-600 bg-opacity-30 border-orange-500", // More orangeish
  };

  // Special color for unique idols - changed to pinkish
  const bgColor = idol.isUnique
    ? "bg-pink-700 bg-opacity-30 border-pink-600"
    : typeColors[idol.type] || "bg-slate-800 bg-opacity-30 border-slate-700";

  const opacity = isDragging ? "opacity-50" : "";

  // Check for valid trade data
  const canTrade = hasValidTradeData(idol);

  return (
    <div
      ref={drag}
      className={`${bgColor} p-4 rounded-lg shadow-sm mb-3 cursor-move ${opacity} ${
        idol.isPlaced ? "border border-white" : "border"
      } transition-all hover:shadow-md`}
      onContextMenu={handleRightClick}
      title="Drag to place on grid or right-click to remove"
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold text-white">{idol.name}</h3>
          <p className="text-xs text-slate-400 mt-1">{idol.type} Idol</p>
        </div>
        <div className="flex items-center space-x-2">
          {canTrade && (
            <button
              onClick={handleTradeClick}
              className="bg-indigo-600 hover:bg-indigo-500 border border-indigo-500 text-white text-xs py-1 px-2 rounded transition-colors"
              title="Search for similar idols on the trade site"
            >
              Trade
            </button>
          )}
          <button
            onClick={() => onRemoveIdol(idol.id)}
            className="text-slate-400 hover:text-slate-300 transition-colors"
            title="Remove idol"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {/* Show prefixes */}
        {idol.prefixes && idol.prefixes.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-blue-400">Prefixes:</h4>
            <ul className="text-xs space-y-1 mt-1">
              {idol.prefixes.map((prefix, idx) => (
                <li key={`prefix-${idx}`} className="text-slate-300">
                  {prefix.Mod}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Show suffixes */}
        {idol.suffixes && idol.suffixes.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-green-400">Suffixes:</h4>
            <ul className="text-xs space-y-1 mt-1">
              {idol.suffixes.map((suffix, idx) => (
                <li key={`suffix-${idx}`} className="text-slate-300">
                  {suffix.Mod}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Show unique modifiers */}
        {idol.isUnique &&
          idol.uniqueModifiers &&
          idol.uniqueModifiers.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-pink-400">
                Unique Modifiers:
              </h4>
              <ul className="text-xs space-y-1 mt-1">
                {idol.uniqueModifiers.map((mod, idx) => (
                  <li key={`unique-${idx}`} className="text-slate-300">
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

// Main inventory component
function IdolInventory({ inventory, onRemoveIdol }) {
  return (
    <div className="max-h-96 overflow-y-auto pr-1">
      {inventory.length > 0 ? (
        <>
          <div className="text-sm text-slate-400 mb-4">
            {inventory.length} {inventory.length === 1 ? "idol" : "idols"} in
            inventory •
            <span className="text-xs ml-1">
              Drag to place • Right-click to remove
            </span>
          </div>

          {inventory.map((idol) => (
            <IdolItem key={idol.id} idol={idol} onRemoveIdol={onRemoveIdol} />
          ))}
        </>
      ) : (
        <p className="text-slate-400">
          No idols in inventory. Create an idol or paste one from Path of Exile.
        </p>
      )}
    </div>
  );
}

export default IdolInventory;
