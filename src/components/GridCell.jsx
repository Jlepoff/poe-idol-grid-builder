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

  const determineBorderStyle = () => {
    if (!cell || !cell.position) return "";
    
    const idolType = idolTypes.find((type) => type.name === cell.type);
    if (!idolType) return "";
    
    const { width, height } = idolType;
    const { row: posRow, col: posCol } = cell.position;
    
    let borderClasses = "";
    
    if (row === posRow) {
      borderClasses += " border-t border-t-white/80";
    } else {
      borderClasses += " border-t-0";
    }
    
    if (col === posCol) {
      borderClasses += " border-l border-l-white/80";
    } else {
      borderClasses += " border-l-0";
    }
    
    if (col === posCol + width - 1) {
      borderClasses += " border-r border-r-white/80";
    } else {
      borderClasses += " border-r-0";
    }
    
    if (row === posRow + height - 1) {
      borderClasses += " border-b border-b-white/80";
    } else {
      borderClasses += " border-b-0";
    }
    
    return borderClasses;
  };

  let cellClass = `w-14 h-14 flex items-center justify-center transition-all duration-200 `;

  if (isBlocked) {
    cellClass += "bg-slate-950 border-slate-900";
  } else if (cell) {
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
    const borderStyle = determineBorderStyle();

    if (isPrimary) {
      if (isDragging) {
        cellClass += `opacity-50 ${borderStyle} ${idolColors.primary}`;
      } else {
        cellClass += isOver ? `bg-red-700 border-red-600` : `${borderStyle} ${idolColors.primary}`;
      }
    } else {
      cellClass += `${borderStyle} ${idolColors.secondary}`;
    }
  } else {
    if (previewStatus === "valid") {
      cellClass += "bg-green-600 border border-green-500";
    } else if (previewStatus === "invalid") {
      cellClass += "bg-red-600 border border-red-500";
    } else if (isOver) {
      cellClass += canDrop
        ? "bg-green-700 border border-green-600"
        : "bg-red-700 border border-red-600";
    } else if (isValidPlacement) {
      cellClass += "bg-green-900/40 border border-green-700/70";
    } else {
      cellClass += "bg-slate-800 border border-slate-700 hover:bg-slate-700";
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
      title={
        cell && isPrimary ? `${cell.name} (Right-click to remove)` : ""
      }
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