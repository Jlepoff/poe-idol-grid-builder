// components/grid/Grid.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import GridCell from "./GridCell";
import { useGrid } from "../../hooks/useGrid";

const GRID_PATTERN_STYLE = {
  backgroundSize: '56px 56px',
  backgroundImage: `
    linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
  `,
  backgroundPosition: '0 0'
};

function Grid({ gridState, onPlaceIdol, onRemoveFromGrid, idolTypes }) {
  const [currentDrag, setCurrentDrag] = useState(null);
  const { isBlockedCell } = useGrid();

  // Memoize drag event handlers
  const handleDragStart = useCallback((e) => {
    if (e.dataTransfer?.types.includes('application/json')) {
      try {
        const data = JSON.parse(e.dataTransfer.getData('application/json'));
        if (data.type === 'IDOL') {
          setCurrentDrag(data.idol);
        }
      } catch (err) {
        // Silently ignore parse errors
      }
    }
  }, []);

  const handleDragEnd = useCallback(() => {
    setCurrentDrag(null);
  }, []);

  // Effect for drag event listeners
  useEffect(() => {
    window.addEventListener('dragstart', handleDragStart);
    window.addEventListener('dragend', handleDragEnd);

    return () => {
      window.removeEventListener('dragstart', handleDragStart);
      window.removeEventListener('dragend', handleDragEnd);
    };
  }, [handleDragStart, handleDragEnd]);

  // Memoize canPlaceIdol function
  const canPlaceIdol = useCallback((idol, position) => {
    if (!idol || !position) return false;

    const { row, col } = position;
    const idolType = idolTypes.find((type) => type.name === idol.type);
    if (!idolType) return false;

    const { width, height } = idolType;

    // Check grid boundaries
    if (row + height > 7 || col + width > 6) return false;

    // Check for blocked cells or existing idols
    for (let r = row; r < row + height; r++) {
      for (let c = col; c < col + width; c++) {
        if (isBlockedCell(r, c) || gridState[r][c] !== null) return false;
      }
    }
    return true;
  }, [gridState, idolTypes, isBlockedCell]);

  // Memoize valid cells calculation
  const validCells = useMemo(() => {
    if (!currentDrag) return [];

    const validPositions = [];
    
    for (let row = 0; row < gridState.length; row++) {
      for (let col = 0; col < gridState[row].length; col++) {
        if (canPlaceIdol(currentDrag, { row, col })) {
          validPositions.push({ row, col });
        }
      }
    }

    return validPositions;
  }, [currentDrag, gridState, canPlaceIdol]);

  // Memoize grid rendering
  const renderGrid = useCallback(() => {
    return gridState.map((row, rowIndex) => (
      <div key={`row-${rowIndex}`} className="flex">
        {row.map((cell, colIndex) => {
          const isPrimary =
            cell &&
            (!cell.position ||
              (cell.position.row === rowIndex &&
                cell.position.col === colIndex));

          const isValidPlacement = validCells.some(
            validCell => validCell.row === rowIndex && validCell.col === colIndex
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
  }, [
    gridState, 
    validCells, 
    currentDrag, 
    onPlaceIdol, 
    onRemoveFromGrid, 
    idolTypes, 
    isBlockedCell
  ]);

  return (
    <div 
      className="grid-container border-2 border-indigo-600 rounded-xl p-1 bg-slate-950 inline-block shadow-sm mx-auto scale-95 minimal-scrollbar"
      style={GRID_PATTERN_STYLE}
    >
      {renderGrid()}
    </div>
  );
}

export default React.memo(Grid);