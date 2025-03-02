// components/GridCell.jsx
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
  let cellClass = "w-14 h-14 border flex items-center justify-center ";

  if (isBlocked) {
    cellClass += "bg-gray-950 border-gray-900"; // Blocked cell
  } else if (cell) {
    // Color based on idol type
    const colors = {
      Minor: {
        primary: "bg-blue-700 border-blue-500",
        secondary: "bg-blue-600 border-blue-400",
      },
      Kamasan: {
        primary: "bg-green-700 border-green-500",
        secondary: "bg-green-600 border-green-400",
      },
      Totemic: {
        primary: "bg-yellow-700 border-yellow-500",
        secondary: "bg-yellow-600 border-yellow-400",
      },
      Noble: {
        primary: "bg-purple-700 border-purple-500",
        secondary: "bg-purple-600 border-purple-400",
      },
      Conqueror: {
        primary: "bg-red-700 border-red-500",
        secondary: "bg-red-600 border-red-400",
      },
      Burial: {
        primary: "bg-orange-700 border-orange-500",
        secondary: "bg-orange-600 border-orange-400",
      },
    };

    const defaultColor = {
      primary: "bg-gray-600 border-gray-500",
      secondary: "bg-gray-500 border-gray-400",
    };
    const idolColors = colors[cell.type] || defaultColor;

    // If this is the primary cell (top-left) of the idol
    if (isPrimary) {
      // When dragging, make cell appear slightly faded
      if (isDragging) {
        cellClass += "opacity-50 " + idolColors.primary;
      } else {
        cellClass += isOver ? "bg-red-700 border-red-500" : idolColors.primary;
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
        ? "bg-green-800 border-green-600"
        : "bg-red-800 border-red-600";
    } else {
      cellClass += "bg-gray-800 border-gray-600";
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
        <div className="text-sm font-bold overflow-hidden">
          {cell.isUnique ? "U" : cell.type.charAt(0)}
        </div>
      )}
    </div>
  );
}

export default GridCell;