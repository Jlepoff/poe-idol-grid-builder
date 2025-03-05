import React, { useState, useEffect } from "react";
import { useDrop, useDrag } from "react-dnd";

function GridCell({
  row,
  col,
  cell,
  isPrimary,
  isBlocked,
  onPlaceIdol,
  onRemoveFromGrid,
  idolTypes,
  gridState,
}) {
  // State to track preview status
  const [previewStatus, setPreviewStatus] = useState(null);

  // Configure drop target with preview functionality
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: "IDOL",
    hover: (item, monitor) => {
      if (isBlocked || cell) {
        setPreviewStatus("invalid");
        return;
      }

      // Validate if the idol can be placed at this position
      if (item.idol && idolTypes) {
        const idolType = idolTypes.find((type) => type.name === item.idol.type);
        if (!idolType) {
          setPreviewStatus("invalid");
          return;
        }

        const { width, height } = idolType;
        
        // Check if placement would be valid
        let valid = true;
        
        // Check grid bounds
        if (row + height > 7 || col + width > 6) {
          valid = false;
        } else {
          // Check for blocked cells or overlaps with other idols
          for (let r = row; r < row + height; r++) {
            for (let c = col; c < col + width; c++) {
              if (isBlockedCell(r, c)) {
                valid = false;
                break;
              }
              
              // Check if cell is occupied by another idol
              // Skip cells occupied by the currently dragged idol if it's from the grid
              if (gridState[r] && gridState[r][c] && isOccupiedByOtherIdol(r, c, item)) {
                valid = false;
                break;
              }
            }
            if (!valid) break;
          }
        }

        setPreviewStatus(valid ? "valid" : "invalid");
      }
    },
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
      
      // Reset preview status
      setPreviewStatus(null);
      
      return { success };
    },
    canDrop: () => !isBlocked && !cell,
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  });

  // Reset preview status when drag ends
  useEffect(() => {
    if (!isOver) {
      setPreviewStatus(null);
    }
  }, [isOver]);

  // Helper function to check if a cell is blocked in the grid
  const isBlockedCell = (r, c) => {
    return (
      (r === 0 && c === 0) || // Top-left corner
      (r === 2 && (c === 1 || c === 4)) || // Row 3: specific cells
      (r === 3 && (c === 1 || c === 2 || c === 3 || c === 4)) || // Row 4
      (r === 4 && (c === 1 || c === 4)) || // Row 5
      (r === 6 && c === 5) // Bottom-right
    );
  };
  
  // Helper function to check if a cell is occupied by an idol other than the currently dragged one
  const isOccupiedByOtherIdol = (r, c, dragItem) => {
    // If no cell at this position, it's not occupied
    if (!gridState[r] || !gridState[r][c]) return false;
    
    // If this is a grid-to-grid move, we need to check if the cell is occupied by the dragged idol
    if (dragItem.sourceType === "GRID" && dragItem.sourcePosition) {
      const { row: sourceRow, col: sourceCol } = dragItem.sourcePosition;
      const draggedIdol = gridState[sourceRow][sourceCol];
      
      if (!draggedIdol) return true; // Safety check
      
      // Get the size of the dragged idol
      const idolType = idolTypes.find((type) => type.name === draggedIdol.type);
      if (!idolType) return true; // Safety check
      
      const { width, height } = idolType;
      
      // Check if the current cell is within the bounds of the dragged idol's current position
      const isWithinDraggedIdol = 
        r >= sourceRow && r < sourceRow + height &&
        c >= sourceCol && c < sourceCol + width;
        
      // If it's within the dragged idol's bounds, then this cell is not considered occupied
      if (isWithinDraggedIdol) return false;
    }
    
    // Cell is occupied by another idol
    return true;
  };

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
    end: () => {
      // Reset any preview statuses when drag ends
      setPreviewStatus(null);
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
    // Empty cell styling with preview highlighting - using direct Tailwind classes
    if (previewStatus === "valid") {
      cellClass += "bg-green-600 border-green-500 "; // Valid placement
    } else if (previewStatus === "invalid") {
      cellClass += "bg-red-600 border-red-500 "; // Invalid placement
    } else if (isOver) {
      cellClass += canDrop
        ? "bg-green-800 border-green-700 "
        : "bg-red-800 border-red-700 ";
    } else {
      cellClass += "bg-slate-800 border-slate-700 hover:bg-slate-700 ";
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