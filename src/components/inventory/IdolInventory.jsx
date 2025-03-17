// components/inventory/IdolInventory.jsx
import React, { useState, memo, useCallback } from "react";
import { useDrag } from "react-dnd";
import { generateTradeUrl, hasValidTradeData } from "../../utils/trade/tradeUtils";

// Individual idol item component - memoized for performance
const IdolItem = memo(({ idol, onRemoveIdol, compactView }) => {
  const [{ isDragging }, drag] = useDrag({
    type: "IDOL",
    item: { type: "IDOL", idol },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
    end: (_, monitor) => {
      const dropResult = monitor.getDropResult();
      if (dropResult && !dropResult.success) {
        // Idol remains in inventory if drop failed
      }
    },
  });

  // Convert event handlers to useCallback for stability
  const handleRightClick = useCallback((e) => {
    e.preventDefault();
    onRemoveIdol(idol.id);
  }, [idol.id, onRemoveIdol]);

  const handleTradeClick = useCallback((e) => {
    e.stopPropagation();
    const tradeUrl = generateTradeUrl(idol);
    if (tradeUrl) {
      window.open(tradeUrl, "_blank");
    }
  }, [idol]);

  // Move style constants outside of render for optimization
  const typeColors = {
    Minor: "from-blue-800/30 to-blue-900/40",
    Kamasan: "from-green-800/30 to-green-900/40",
    Totemic: "from-yellow-800/30 to-yellow-900/40",
    Noble: "from-purple-800/30 to-purple-900/40",
    Conqueror: "from-red-800/30 to-red-900/40",
    Burial: "from-orange-600/30 to-orange-700/40",
  };

  const bgGradient = idol.isUnique
    ? "bg-gradient-to-r from-pink-700/30 to-pink-800/40"
    : `bg-gradient-to-r ${
        typeColors[idol.type] || "from-slate-800/30 to-slate-900/40"
      }`;

  const opacity = isDragging ? "opacity-50" : "";
  const canTrade = hasValidTradeData(idol);
  const placedStyles = idol.isPlaced
    ? "border-2 border-white"
    : "border border-slate-700 border-opacity-75";

  // Conditional rendering for performance optimization
  if (compactView) {
    return (
      <div
        ref={drag}
        className={`${bgGradient} p-3 rounded-lg shadow-sm mb-2 cursor-move ${opacity} ${placedStyles} transition-all hover:shadow-md flex justify-between items-center`}
        onContextMenu={handleRightClick}
        title="Drag to place on grid or right-click to remove"
      >
        <div className="flex-grow mr-2">
          <h3 className="font-extrabold text-base text-white truncate">
            {idol.name}
          </h3>
          <p className="text-xs text-slate-400">{idol.type} Idol</p>
        </div>
        <div className="flex items-center space-x-1">
          {canTrade && (
            <button
              onClick={handleTradeClick}
              className="bg-indigo-600 hover:bg-indigo-500 border border-indigo-500 text-white text-xs py-1 px-1.5 rounded transition-colors"
              title="Search for similar idols on the trade site"
            >
              Trade
            </button>
          )}
          <button
            onClick={() => onRemoveIdol(idol.id)}
            className="text-slate-400 hover:text-slate-300 transition-colors p-1"
            title="Remove idol"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={drag}
      className={`${bgGradient} p-6 rounded-lg shadow-sm mb-3 cursor-move ${opacity} ${placedStyles} transition-all hover:shadow-md`}
      onContextMenu={handleRightClick}
      title="Drag to place on grid or right-click to remove"
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-extrabold text-base text-white">{idol.name}</h3>
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
  
      <div className="mt-4 space-y-3">
        {idol.prefixes && idol.prefixes.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-blue-400">Prefixes:</h4>
            <ul className="text-[11px] space-y-1 mt-1">
              {idol.prefixes.map((prefix, idx) => (
                <li key={`prefix-${idx}`} className="text-slate-300">
                  {prefix.Mod}
                </li>
              ))}
            </ul>
          </div>
        )}
  
        {idol.suffixes && idol.suffixes.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-green-400">Suffixes:</h4>
            <ul className="text-[11px] space-y-1 mt-1">
              {idol.suffixes.map((suffix, idx) => (
                <li key={`suffix-${idx}`} className="text-slate-300">
                  {suffix.Mod}
                </li>
              ))}
            </ul>
          </div>
        )}
  
        {idol.isUnique && idol.uniqueModifiers && idol.uniqueModifiers.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-pink-400 border-l-4 border-pink-400 pl-2 mb-2">
              Unique Modifiers:
            </h4>
            <ul className="text-[11px] space-y-1 mt-1">
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
});

// Define display names for better debugging
IdolItem.displayName = 'IdolItem';

// SVG components extracted for reusability and cleaner code
const CompactViewIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
  </svg>
);

const DetailedViewIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const EmptyInventoryIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-16 w-16 text-slate-500"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
    />
  </svg>
);

// Main inventory component
const IdolInventory = ({ inventory, onRemoveIdol }) => {
  const [compactView, setCompactView] = useState(false);

  const toggleView = useCallback(() => {
    setCompactView(prev => !prev);
  }, []);

  // Early render optimization for empty inventory
  const isInventoryEmpty = inventory.length === 0;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <button
          onClick={toggleView}
          className="bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 p-1.5 rounded-md transition-colors"
          title={compactView ? "Switch to detailed view" : "Switch to compact view"}
        >
          {compactView ? <CompactViewIcon /> : <DetailedViewIcon />}
        </button>
      </div>

      <div className="max-h-96 overflow-y-auto pr-1 minimal-scrollbar">
        {!isInventoryEmpty ? (
          <div>
            {inventory.map((idol) => (
              <IdolItem
                key={idol.id}
                idol={idol}
                onRemoveIdol={onRemoveIdol}
                compactView={compactView}
              />
            ))}
          </div>
        ) : (
          <div className="bg-slate-800/50 rounded-xl p-6 text-center border border-slate-700/50">
            <div className="flex justify-center mb-4">
              <EmptyInventoryIcon />
            </div>
            <p className="text-slate-300 text-base mb-5">No idols in inventory.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(IdolInventory);