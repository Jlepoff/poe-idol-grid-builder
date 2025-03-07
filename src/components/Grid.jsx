import React, { useState, useEffect } from "react";
import GridCell from "./GridCell";

function Grid({ gridState, onPlaceIdol, onRemoveFromGrid, idolTypes }) {
  // State to track the current drag
  const [currentDrag, setCurrentDrag] = useState(null);

  // Effect to listen for drag events from react-dnd
  useEffect(() => {
    // This will be called when a drag operation starts/ends
    const handleDragStart = (e) => {
      // Check if this is a drag from inventory
      if (e.dataTransfer && e.dataTransfer.types.includes('application/json')) {
        try {
          const data = JSON.parse(e.dataTransfer.getData('application/json'));
          if (data.type === 'IDOL') {
            setCurrentDrag(data.idol);
          }
        } catch (err) {
          // If parsing fails, ignore
        }
      }
    };

    const handleDragEnd = () => {
      setCurrentDrag(null);
    };

    // Add global event listeners
    window.addEventListener('dragstart', handleDragStart);
    window.addEventListener('dragend', handleDragEnd);

    return () => {
      window.removeEventListener('dragstart', handleDragStart);
      window.removeEventListener('dragend', handleDragEnd);
    };
  }, []);

  // Check if a cell is blocked in the grid
  const isBlockedCell = (row, col) => {
    return (
      (row === 0 && col === 0) || // Top-left corner
      (row === 2 && (col === 1 || col === 4)) || // Row 3: specific cells
      (row === 3 && (col === 1 || col === 2 || col === 3 || col === 4)) || // Row 4
      (row === 4 && (col === 1 || col === 4)) || // Row 5
      (row === 6 && col === 5) // Bottom-right
    );
  };

  // Check if an idol can be placed at a position
  const canPlaceIdol = (idol, position) => {
    if (!idol || !position) return false;

    const { row, col } = position;
    const idolType = idolTypes.find((type) => type.name === idol.type);
    if (!idolType) return false;

    const { width, height } = idolType;

    // Check if placement is within grid bounds
    if (row + height > 7 || col + width > 6) return false;

    // Check for blocked cells and overlaps
    for (let r = row; r < row + height; r++) {
      for (let c = col; c < col + width; c++) {
        if (isBlockedCell(r, c)) return false;
        if (gridState[r][c] !== null) return false;
      }
    }
    return true;
  };

  // Determine which cells would be valid placements for the current dragged idol
  const getValidPlacementCells = () => {
    if (!currentDrag) return [];

    const validCells = [];
    
    // Check each cell in the grid
    for (let row = 0; row < gridState.length; row++) {
      for (let col = 0; col < gridState[row].length; col++) {
        if (canPlaceIdol(currentDrag, { row, col })) {
          validCells.push({ row, col });
        }
      }
    }

    return validCells;
  };

  const validCells = getValidPlacementCells();

  const renderGrid = () => {
    return gridState.map((row, rowIndex) => (
      <div key={`row-${rowIndex}`} className="flex">
        {row.map((cell, colIndex) => {
          // Determine if this is the primary cell of an idol
          const isPrimary =
            cell &&
            (!cell.position ||
              (cell.position.row === rowIndex &&
                cell.position.col === colIndex));

          // Check if this cell is a valid placement for currentDrag
          const isValidPlacement = validCells.some(
            (validCell) => validCell.row === rowIndex && validCell.col === colIndex
          );

          return (
            <GridCell
              key={`cell-${rowIndex}-${colIndex}`}
              row={rowIndex}
              col={colIndex}
              cell={cell}
              isPrimary={isPrimary}
              isBlocked={isBlockedCell(rowIndex, colIndex)}
              onPlaceIdol={onPlaceIdol}
              onRemoveFromGrid={onRemoveFromGrid}
              idolTypes={idolTypes}
              gridState={gridState}
              isValidPlacement={isValidPlacement && currentDrag !== null}
              currentDrag={currentDrag}
            />
          );
        })}
      </div>
    ));
  };

  // Add subtle grid pattern using CSS
  const gridPatternStyle = {
    backgroundSize: '56px 56px', // 3.5rem = 56px (size of each grid cell)
    backgroundImage: `
      linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
    `,
    backgroundPosition: '0 0'
  };

  // Slightly smaller grid container with centered content and grid pattern
  return (
    <div 
    className="grid-container border-2 border-indigo-600 rounded-xl p-1 bg-slate-950 inline-block shadow-sm mx-auto scale-95 minimal-scrollbar"
    style={gridPatternStyle}
    >
      {renderGrid()}
    </div>
  );
}

export default Grid;