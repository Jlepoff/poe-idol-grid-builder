import React from "react";
import { useDrop, useDrag } from "react-dnd";

function GridCell({
  row,
  col,
  cell,
  isPrimary,
  isBlocked,
  onPlaceIdol,
  onRemoveFromGrid,
}) {
  // Configure drop target
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: "IDOL",
    drop: (item) => {
      if (isBlocked || cell) return { success: false };
  
      let success;
      if (item.sourceType === "GRID" && item.sourcePosition) {
        // For grid-to-grid move, pass current position
        success = onPlaceIdol(item.idol, { row, col }, item.sourcePosition);
      } else {
        // For new placement from inventory
        success = onPlaceIdol(item.idol, { row, col });
      }
      return { success };
    },
    canDrop: () => !isBlocked && !cell,
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  });

  // Configure drag source for cells containing idols
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
    end: (item, monitor) => {
      // If dropped successfully somewhere else, we'll let the drop target handle it
      // If drop failed, the idol stays in place
    },
  });

  // Handle right-click for removing idols
  const handleRightClick = (e) => {
    e.preventDefault();
    if (cell) {
      onRemoveFromGrid({ row, col });
    }
  };

  // Determine cell style classes
  let cellClass = "w-14 h-14 border flex items-center justify-center transition-colors ";

  if (isBlocked) {
    cellClass += "bg-slate-950 border-slate-900"; // Blocked cell
  } else if (cell) {
    // Updated color based on idol type - matching inventory colors with modified Unique and Burial
    const colors = {
      Minor: {
        primary: "bg-blue-800 bg-opacity-70 border-blue-700",
        secondary: "bg-blue-800 bg-opacity-50 border-blue-700",
      },
      Kamasan: {
        primary: "bg-green-800 bg-opacity-70 border-green-700",
        secondary: "bg-green-800 bg-opacity-50 border-green-700",
      },
      Totemic: {
        primary: "bg-yellow-800 bg-opacity-70 border-yellow-700",
        secondary: "bg-yellow-800 bg-opacity-50 border-yellow-700",
      },
      Noble: {
        primary: "bg-purple-800 bg-opacity-70 border-purple-700",
        secondary: "bg-purple-800 bg-opacity-50 border-purple-700",
      },
      Conqueror: {
        primary: "bg-red-800 bg-opacity-70 border-red-700",
        secondary: "bg-red-800 bg-opacity-50 border-red-700",
      },
      Burial: {
        primary: "bg-orange-600 bg-opacity-70 border-orange-500",
        secondary: "bg-orange-600 bg-opacity-50 border-orange-500",
      },
    };
    
    // Special color for unique idols - updated to be more pinkish
    if (cell.isUnique) {
      colors[cell.type] = {
        primary: "bg-pink-700 bg-opacity-70 border-pink-600",
        secondary: "bg-pink-700 bg-opacity-50 border-pink-600",
      };
    }

    const defaultColor = {
      primary: "bg-slate-700 border-slate-600",
      secondary: "bg-slate-600 border-slate-500",
    };
    
    const idolColors = colors[cell.type] || defaultColor;

    // If this is the primary cell (top-left) of the idol
    if (isPrimary) {
      // When dragging, make cell appear slightly faded
      if (isDragging) {
        cellClass += "opacity-50 " + idolColors.primary;
      } else {
        cellClass += isOver ? "bg-red-700 border-red-600" : idolColors.primary;
      }
    } else {
      // Make secondary cells faded when primary is being dragged
      if (isDragging && cell.position && 
          cell.position.row === row - (row % cell.position.row) && 
          cell.position.col === col - (col % cell.position.col)) {
        cellClass += "opacity-50 " + idolColors.secondary;
      } else {
        cellClass += idolColors.secondary;
      }
    }
  } else {
    // Empty cell styling
    if (isOver) {
      cellClass += canDrop
        ? "bg-green-800 border-green-700"
        : "bg-red-800 border-red-700";
    } else {
      cellClass += "bg-slate-800 border-slate-700 hover:bg-slate-700";
    }
  }

  // Combine drag and drop refs
  const combinedRef = (node) => {
    if (cell && isPrimary) {
      // If it has an idol, make it draggable
      drag(node);
    } else if (!isBlocked) {
      // If it's empty, make it a drop target
      drop(node);
    }
  };

  return (
    <div
      ref={combinedRef}
      className={cellClass}
      onContextMenu={handleRightClick}
      title={
        cell && isPrimary ? `${cell.name} (Right-click to remove)` : ""
      }
    >
      {isPrimary && cell && (
        <div className="text-sm font-bold text-white">
          {cell.isUnique ? "U" : cell.type.charAt(0)}
        </div>
      )}
    </div>
  );
}

export default GridCell;