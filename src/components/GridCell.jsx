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
  isValidPlacement,
  currentDrag
}) {
  // State to track preview status
  const [previewStatus, setPreviewStatus] = useState(null);
  // State to track placement animation
  const [isPlacing, setIsPlacing] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

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

      if (success) {
        // Trigger placement animation
        setIsPlacing(true);
        setTimeout(() => setIsPlacing(false), 300);
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
      (r === 6 && c === 5) // Bottom right
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
      setIsRemoving(true);
      // Small delay before actual removal to allow animation to play
      setTimeout(() => {
        onRemoveFromGrid({ row, col });
        setIsRemoving(false);
      }, 200);
    }
  };

  // Determine border styling for the cell based on its position in the idol
  const determineBorderStyle = () => {
    if (!cell || !cell.position) return "";
    
    const idolType = idolTypes.find((type) => type.name === cell.type);
    if (!idolType) return "";
    
    const { width, height } = idolType;
    const { row: posRow, col: posCol } = cell.position;
    
    // Create border classes based on position with thinner borders
    let borderClasses = "";
    
    // Top border - changed from border-t-2 to border-t
    if (row === posRow) {
      borderClasses += " border-t border-t-white/80";
    } else {
      borderClasses += " border-t-0";
    }
    
    // Left border - changed from border-l-2 to border-l
    if (col === posCol) {
      borderClasses += " border-l border-l-white/80";
    } else {
      borderClasses += " border-l-0";
    }
    
    // Right border - changed from border-r-2 to border-r
    if (col === posCol + width - 1) {
      borderClasses += " border-r border-r-white/80";
    } else {
      borderClasses += " border-r-0";
    }
    
    // Bottom border - changed from border-b-2 to border-b
    if (row === posRow + height - 1) {
      borderClasses += " border-b border-b-white/80";
    } else {
      borderClasses += " border-b-0";
    }
    
    return borderClasses;
  };

  // Determine cell style classes
  let cellClass = `w-14 h-14 flex items-center justify-center transition-all duration-200 `;

  if (isBlocked) {
    cellClass += "bg-slate-950 border-slate-900"; // Blocked cell
  } else if (cell) {
    // Updated color based on idol type - matching inventory colors with modified Unique and Burial
    const colors = {
      Minor: {
        primary: "bg-gradient-to-br from-blue-800 to-blue-900 bg-opacity-70",
        secondary: "bg-gradient-to-br from-blue-800 to-blue-900 bg-opacity-50",
      },
      Kamasan: {
        primary: "bg-gradient-to-br from-green-800 to-green-900 bg-opacity-70",
        secondary: "bg-gradient-to-br from-green-800 to-green-900 bg-opacity-50",
      },
      Totemic: {
        primary: "bg-gradient-to-br from-yellow-800 to-yellow-900 bg-opacity-70",
        secondary: "bg-gradient-to-br from-yellow-800 to-yellow-900 bg-opacity-50",
      },
      Noble: {
        primary: "bg-gradient-to-br from-purple-800 to-purple-900 bg-opacity-70",
        secondary: "bg-gradient-to-br from-purple-800 to-purple-900 bg-opacity-50",
      },
      Conqueror: {
        primary: "bg-gradient-to-br from-red-800 to-red-900 bg-opacity-70",
        secondary: "bg-gradient-to-br from-red-800 to-red-900 bg-opacity-50",
      },
      Burial: {
        primary: "bg-gradient-to-br from-orange-600 to-orange-700 bg-opacity-70",
        secondary: "bg-gradient-to-br from-orange-600 to-orange-700 bg-opacity-50",
      },
    };
    
    // Special color for unique idols - updated to a consistent pink
    if (cell.isUnique) {
      colors[cell.type] = {
        primary: "bg-gradient-to-br from-pink-600 to-pink-700 bg-opacity-70",
        secondary: "bg-gradient-to-br from-pink-600 to-pink-700 bg-opacity-50",
      };
    }

    const defaultColor = {
      primary: "bg-slate-700",
      secondary: "bg-slate-600",
    };
    
    const idolColors = colors[cell.type] || defaultColor;
    
    // Get special border styling based on idol position
    const borderStyle = determineBorderStyle();

    // If this is the primary cell (top-left) of the idol
    if (isPrimary) {
      // When dragging, make cell appear slightly faded
      if (isDragging) {
        cellClass += `opacity-50 ${borderStyle} ${idolColors.primary}`;
      } else if (isRemoving) {
        cellClass += `opacity-0 scale-75 ${borderStyle} ${idolColors.primary}`; // Removal animation
      } else if (isPlacing) {
        cellClass += `scale-110 ${borderStyle} ${idolColors.primary}`; // Placement animation
      } else {
        cellClass += isOver ? `bg-red-700 border-red-600` : `${borderStyle} ${idolColors.primary}`;
      }
    } else {
      // Make secondary cells faded when primary is being dragged
      if (isDragging && cell.position && 
          cell.position.row === row - (row % cell.position.row) && 
          cell.position.col === col - (col % cell.position.col)) {
        cellClass += `opacity-50 ${borderStyle} ${idolColors.secondary}`;
      } else if (isRemoving && cell.position) {
        // Find if this is part of an idol that's being removed
        const primaryRow = cell.position.row;
        const primaryCol = cell.position.col;
        if (gridState[primaryRow][primaryCol] && gridState[primaryRow][primaryCol].isRemoving) {
          cellClass += `opacity-0 scale-75 ${borderStyle} ${idolColors.secondary}`; // Removal animation
        } else {
          cellClass += `${borderStyle} ${idolColors.secondary}`;
        }
      } else if (isPlacing && cell.position) {
        // Find if this is part of an idol that's being placed
        const primaryRow = cell.position.row;
        const primaryCol = cell.position.col;
        if (gridState[primaryRow][primaryCol] && gridState[primaryRow][primaryCol].isPlacing) {
          cellClass += `scale-110 ${borderStyle} ${idolColors.secondary}`; // Placement animation
        } else {
          cellClass += `${borderStyle} ${idolColors.secondary}`;
        }
      } else {
        cellClass += `${borderStyle} ${idolColors.secondary}`;
      }
    }
  } else {
    // Empty cell styling with preview highlighting or valid placement highlighting
    if (previewStatus === "valid") {
      cellClass += "bg-green-600 border border-green-500 scale-105 "; // Valid placement with scale effect
    } else if (previewStatus === "invalid") {
      cellClass += "bg-red-600 border border-red-500 "; // Invalid placement
    } else if (isOver) {
      cellClass += canDrop
        ? "bg-green-700 border border-green-600 scale-105 "
        : "bg-red-700 border border-red-600 ";
    } else if (isValidPlacement) {
      // Highlight valid placement cells when dragging
      cellClass += "bg-green-900/40 border border-green-700/70 pulse-subtle "; 
    } else {
      cellClass += "bg-slate-800 border border-slate-700 hover:bg-slate-700 "; // Regular empty cell
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
        <div className={`text-base font-bold text-white ${isPlacing ? 'animate-pulse' : ''}`}>
          {cell.isUnique ? "U" : cell.type.charAt(0)}
        </div>
      )}
    </div>
  );
}

export default GridCell;