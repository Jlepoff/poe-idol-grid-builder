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
  const [previewStatus, setPreviewStatus] = useState(null);

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: "IDOL",
    hover: (item, monitor) => {
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
        
        let valid = true;
        
        if (row + height > 7 || col + width > 6) {
          valid = false;
        } else {
          for (let r = row; r < row + height; r++) {
            for (let c = col; c < col + width; c++) {
              if (isBlockedCell(r, c)) {
                valid = false;
                break;
              }
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

  useEffect(() => {
    if (!isOver) {
      setPreviewStatus(null);
    }
  }, [isOver]);

  const isBlockedCell = (r, c) => {
    return (
      (r === 0 && c === 0) ||
      (r === 2 && (c === 1 || c === 4)) ||
      (r === 3 && (c === 1 || c === 2 || c === 3 || c === 4)) ||
      (r === 4 && (c === 1 || c === 4)) ||
      (r === 6 && c === 5)
    );
  };
  
  const isOccupiedByOtherIdol = (r, c, dragItem) => {
    if (!gridState[r] || !gridState[r][c]) return false;
    
    if (dragItem.sourceType === "GRID" && dragItem.sourcePosition) {
      const { row: sourceRow, col: sourceCol } = dragItem.sourcePosition;
      const draggedIdol = gridState[sourceRow][sourceCol];
      
      if (!draggedIdol) return true;
      
      const idolType = idolTypes.find((type) => type.name === draggedIdol.type);
      if (!idolType) return true;
      
      const { width, height } = idolType;
      
      const isWithinDraggedIdol = 
        r >= sourceRow && r < sourceRow + height &&
        c >= sourceCol && c < sourceCol + width;
        
      if (isWithinDraggedIdol) return false;
    }
    
    return true;
  };

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

  const handleRightClick = (e) => {
    e.preventDefault();
    if (cell) {
      onRemoveFromGrid({ row, col });
    }
  };

  let cellClass = `w-14 h-14 flex items-center justify-center `;

  if (isBlocked) {
    cellClass += "bg-slate-950 border-slate-900";
  } else if (cell) {
    // Flat colors matching the screenshots
    const colors = {
      Minor: {
        primary: "bg-blue-700",
        secondary: "bg-blue-700",
      },
      Kamasan: {
        primary: "bg-green-700",
        secondary: "bg-green-700",
      },
      Totemic: {
        primary: "bg-amber-700",
        secondary: "bg-amber-700",
      },
      Noble: {
        primary: "bg-purple-700",
        secondary: "bg-purple-700",
      },
      Conqueror: {
        primary: "bg-red-700",
        secondary: "bg-red-700",
      },
      Burial: {
        primary: "bg-orange-600",
        secondary: "bg-orange-600",
      },
    };
    
    if (cell.isUnique) {
      colors[cell.type] = {
        primary: "bg-pink-500",
        secondary: "bg-pink-500",
      };
    }

    const defaultColor = {
      primary: "bg-slate-700",
      secondary: "bg-slate-700",
    };
    
    const idolColors = colors[cell.type] || defaultColor;

    // Apply colors based on whether it's primary or secondary cell
    if (isPrimary) {
      if (isDragging) {
        cellClass += `opacity-50 ${idolColors.primary}`;
      } else {
        cellClass += isOver ? `bg-red-700` : `${idolColors.primary}`;
      }
    } else {
      cellClass += `${idolColors.secondary}`;
    }
    
    // Get idol position information
    const { width, height } = idolTypes.find(type => type.name === cell.type) || { width: 1, height: 1 };
    const { row: posRow, col: posCol } = cell.position || { row, col };
    
    // Add white border to the outer edges of the idol
    const isTopEdge = row === posRow;
    const isLeftEdge = col === posCol;
    const isRightEdge = col === posCol + width - 1;
    const isBottomEdge = row === posRow + height - 1;
    
    // Add white borders to the outer edges
    if (isTopEdge) {
      cellClass += " border-t border-t-white/40";
    }
    
    if (isLeftEdge) {
      cellClass += " border-l border-l-white/40";
    }
    
    if (isRightEdge) {
      cellClass += " border-r border-r-white/40";
    }
    
    if (isBottomEdge) {
      cellClass += " border-b border-b-white/40";
    }
    
    // Add subtle interior grid lines
    if (!isRightEdge && col < posCol + width - 1) {
      // Right border for cells that aren't on the right edge
      cellClass += " border-r border-r-black/35";
    }
    
    if (!isBottomEdge && row < posRow + height - 1) {
      // Bottom border for cells that aren't on the bottom edge
      cellClass += " border-b border-b-black/35";
    }
  } else {
    if (previewStatus === "valid") {
      cellClass += "bg-green-600/70 border border-green-500";
    } else if (previewStatus === "invalid") {
      cellClass += "bg-red-600/70 border border-red-500";
    } else if (isOver) {
      cellClass += canDrop
        ? "bg-green-600/70 border border-green-500"
        : "bg-red-600/70 border border-red-500";
    } else if (isValidPlacement) {
      cellClass += "bg-green-700/30 border border-green-600/50";
    } else {
      cellClass += "bg-slate-800 border border-slate-700 hover:bg-slate-750";
    }
  }

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
      className={cellClass}
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
}

export default GridCell;