// components/grid/GridCell.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useDrop, useDrag } from "react-dnd";
import { useGrid } from "../../hooks/useGrid";

// Idol type to CSS color mapping
const IDOL_COLOR_MAP = {
  Minor: {
    primary: "bg-blue-900/40",
    secondary: "bg-blue-900/40",
  },
  Kamasan: {
    primary: "bg-green-900/40",
    secondary: "bg-green-900/40",
  },
  Totemic: {
    primary: "bg-yellow-900/40",
    secondary: "bg-yellow-900/40",
  },
  Noble: {
    primary: "bg-purple-900/40",
    secondary: "bg-purple-900/40",
  },
  Conqueror: {
    primary: "bg-red-900/40",
    secondary: "bg-red-900/40",
  },
  Burial: {
    primary: "bg-orange-700/40",
    secondary: "bg-orange-700/40",
  },
  // Special case for unique idols
  unique: {
    primary: "bg-pink-600/40",
    secondary: "bg-pink-600/40",
  },
  // Default fallback
  default: {
    primary: "bg-slate-700",
    secondary: "bg-slate-700",
  }
};

const GridCell = ({
  row,
  col,
  cell,
  isPrimary,
  isBlocked,
  onPlaceIdol,
  onRemoveFromGrid,
  idolTypes,
  gridState,
  isValidPlacement,
  currentDrag
}) => {
  const [previewStatus, setPreviewStatus] = useState(null);
  const { isBlockedCell } = useGrid();

  // Check if position is occupied by an idol other than the currently dragged one
  const isOccupiedByOtherIdol = useCallback((r, c, dragItem) => {
    if (!gridState[r] || !gridState[r][c]) return false;
    
    if (dragItem?.sourceType === "GRID" && dragItem?.sourcePosition) {
      const { row: sourceRow, col: sourceCol } = dragItem.sourcePosition;
      const draggedIdol = gridState[sourceRow]?.[sourceCol];
      
      if (!draggedIdol) return true;
      
      const idolType = idolTypes.find((type) => type.name === draggedIdol.type);
      if (!idolType) return true;
      
      const { width, height } = idolType;
      
      // Check if this cell is within the currently dragged idol's area
      const isWithinDraggedIdol = 
        r >= sourceRow && r < sourceRow + height &&
        c >= sourceCol && c < sourceCol + width;
        
      if (isWithinDraggedIdol) return false;
    }
    
    return true;
  }, [gridState, idolTypes]);

  // Process hover status during drag
  const processHover = useCallback((item) => {
    if (isBlocked || cell) {
      setPreviewStatus("invalid");
      return;
    }

    if (item.idol && idolTypes) {
      const idolType = idolTypes.find((type) => type.name === item.idol.type);
      if (!idolType) {
        setPreviewStatus("invalid");
        return;
      }

      const { width, height } = idolType;
      
      // Check boundaries
      if (row + height > 7 || col + width > 6) {
        setPreviewStatus("invalid");
        return;
      }
      
      // Check for blocked cells or other idols
      for (let r = row; r < row + height; r++) {
        for (let c = col; c < col + width; c++) {
          if (isBlockedCell(r, c)) {
            setPreviewStatus("invalid");
            return;
          }
          if (gridState[r] && gridState[r][c] && isOccupiedByOtherIdol(r, c, item)) {
            setPreviewStatus("invalid");
            return;
          }
        }
      }
      
      setPreviewStatus("valid");
    }
  }, [cell, isBlocked, row, col, idolTypes, gridState, isBlockedCell, isOccupiedByOtherIdol]);

  // Drop target configuration
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: "IDOL",
    hover: processHover,
    drop: (item) => {
      if (isBlocked || cell) return { success: false };
  
      let success;
      if (item.sourceType === "GRID" && item.sourcePosition) {
        success = onPlaceIdol(item.idol, { row, col }, item.sourcePosition);
      } else {
        success = onPlaceIdol(item.idol, { row, col });
      }
      
      setPreviewStatus(null);
      
      return { success };
    },
    canDrop: () => !isBlocked && !cell,
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  });

  // Clear preview status when not hovering
  useEffect(() => {
    if (!isOver) {
      setPreviewStatus(null);
    }
  }, [isOver]);

  // Drag source configuration
  const [{ isDragging }, drag] = useDrag({
    type: "IDOL",
    item: () => {
      if (cell && isPrimary) {
        return { 
          type: "IDOL", 
          idol: cell,
          sourceType: "GRID",
          sourcePosition: { row, col }
        };
      }
      return null;
    },
    canDrag: () => cell && isPrimary,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
    end: () => {
      setPreviewStatus(null);
    },
  });

  // Handle right-click to remove idol
  const handleRightClick = (e) => {
    e.preventDefault();
    if (cell) {
      onRemoveFromGrid({ row, col });
    }
  };

  // Calculate cell styling based on state
  const cellClassNames = useMemo(() => {
    let classNames = "w-14 h-14 flex items-center justify-center ";

    // Blocked cells
    if (isBlocked) {
      return classNames + "bg-slate-950 border-slate-900 opacity-60";
    }

    // Cells with idols
    if (cell) {
      // Get color based on idol type or unique status
      const colors = cell.isUnique 
        ? IDOL_COLOR_MAP.unique 
        : (IDOL_COLOR_MAP[cell.type] || IDOL_COLOR_MAP.default);

      if (isPrimary) {
        classNames += isDragging 
          ? `opacity-50 ${colors.primary}` 
          : (isOver ? "bg-red-700" : colors.primary);
      } else {
        classNames += colors.secondary;
      }
      
      // Add border styling based on idol position
      if (cell.position) {
        const { width, height } = idolTypes.find(type => type.name === cell.type) || { width: 1, height: 1 };
        const { row: posRow, col: posCol } = cell.position;
        
        // Calculate borders
        const isTopEdge = row === posRow;
        const isLeftEdge = col === posCol;
        const isRightEdge = col === posCol + width - 1;
        const isBottomEdge = row === posRow + height - 1;
        
        // Apply edge borders
        if (isTopEdge) classNames += " border-t border-t-white/40";
        if (isLeftEdge) classNames += " border-l border-l-white/40";
        if (isRightEdge) classNames += " border-r border-r-white/40";
        if (isBottomEdge) classNames += " border-b border-b-white/40";
        
        // Apply inner borders
        if (!isRightEdge && col < posCol + width - 1) {
          classNames += " border-r border-r-black/35";
        }
        
        if (!isBottomEdge && row < posRow + height - 1) {
          classNames += " border-b border-b-black/35";
        }
      }
      
      return classNames;
    }
    
    // Empty cells - style for dropping
    if (previewStatus === "valid") {
      classNames += "bg-green-600/70 border border-green-500";
    } else if (previewStatus === "invalid") {
      classNames += "bg-red-600/70 border border-red-500";
    } else if (isOver) {
      classNames += canDrop
        ? "bg-green-600/70 border border-green-500"
        : "bg-red-600/70 border border-red-500";
    } else if (isValidPlacement) {
      classNames += "bg-green-700/30 border border-green-600/50";
    } else {
      classNames += "bg-slate-800 border border-slate-700 hover:bg-slate-750";
    }
    
    return classNames;
  }, [
    cell, 
    isPrimary, 
    isBlocked, 
    isDragging, 
    isOver, 
    canDrop, 
    previewStatus, 
    isValidPlacement,
    row,
    col, 
    idolTypes
  ]);

  // Combine drag and drop refs
  const combinedRef = (node) => {
    if (cell && isPrimary) {
      drag(node);
    } else if (!isBlocked) {
      drop(node);
    }
  };

  return (
    <div
      ref={combinedRef}
      className={cellClassNames}
      onContextMenu={handleRightClick}
      title={cell && isPrimary ? `${cell.name} (Right-click to remove)` : ""}
      style={{ transition: "none" }}
    >
      {isPrimary && cell && (
        <div className="text-base font-bold text-white">
          {cell.isUnique ? "U" : cell.type.charAt(0)}
        </div>
      )}
    </div>
  );
};

export default React.memo(GridCell);