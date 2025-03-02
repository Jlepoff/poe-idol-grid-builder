// components/IdolInventory.jsx
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

  // Color based on idol type
  const typeColors = {
    Minor: "bg-blue-700",
    Kamasan: "bg-green-700",
    Totemic: "bg-yellow-700",
    Noble: "bg-purple-700",
    Conqueror: "bg-red-700",
    Burial: "bg-orange-700",
  };

  const bgColor = typeColors[idol.type] || "bg-gray-700";
  const opacity = isDragging ? "opacity-50" : "";

  // Check for valid trade data
  const canTrade = hasValidTradeData(idol);

  return (
    <div
      ref={drag}
      className={`${bgColor} p-3 rounded-lg shadow mb-2 cursor-move ${opacity} ${
        idol.isPlaced ? "border-2 border-white" : ""
      }`}
      onContextMenu={handleRightClick}
      title="Drag to place on grid or right-click to remove"
    >
      <div className="flex justify-between items-start">
        <h3 className="font-bold">{idol.name}</h3>
        <div className="flex items-center space-x-2">
          {canTrade && (
            <button
              onClick={handleTradeClick}
              className="bg-violet-700 hover:bg-violet-600 border border-white text-white text-xs py-0.5 px-2 rounded"
              title="Search for similar idols on the trade site"
            >
              Trade
            </button>
          )}
          <button
            onClick={() => onRemoveIdol(idol.id)}
            className="text-red-400 hover:text-red-300"
            title="Remove idol"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="mt-2 space-y-1">
        {/* Show prefixes */}
        {idol.prefixes && idol.prefixes.length > 0 && (
          <div>
            <h4 className="text-xs text-gray-300">Prefixes:</h4>
            <ul className="text-xs space-y-1">
              {idol.prefixes.map((prefix, idx) => (
                <li key={`prefix-${idx}`} className="text-gray-200">
                  {prefix.Mod}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Show suffixes */}
        {idol.suffixes && idol.suffixes.length > 0 && (
          <div>
            <h4 className="text-xs text-gray-300">Suffixes:</h4>
            <ul className="text-xs space-y-1">
              {idol.suffixes.map((suffix, idx) => (
                <li key={`suffix-${idx}`} className="text-gray-200">
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
              <h4 className="text-xs text-purple-300">Unique Modifiers:</h4>
              <ul className="text-xs space-y-1">
                {idol.uniqueModifiers.map((mod, idx) => (
                  <li key={`unique-${idx}`} className="text-gray-200">
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
    <div className="max-h-96 overflow-y-auto pr-2">
      {inventory.length > 0 ? (
        <>
          <div className="text-sm text-gray-400 mb-2">
            {inventory.length} idols in inventory •
            <span className="text-xs ml-1">
              Drag to place • Right-click to remove
            </span>
          </div>

          {inventory.map((idol) => (
            <IdolItem key={idol.id} idol={idol} onRemoveIdol={onRemoveIdol} />
          ))}
        </>
      ) : (
        <p className="text-gray-400">
          No idols in inventory. Create an idol or paste one from Path of Exile.
        </p>
      )}
    </div>
  );
}

export default IdolInventory;
