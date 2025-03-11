// components/grid/Grid.jsx
import React, { useState, useEffect } from "react";
import GridCell from "./GridCell";
import { useGrid } from "../../hooks/useGrid";

function Grid({ gridState, onPlaceIdol, onRemoveFromGrid, idolTypes }) {
  const [currentDrag, setCurrentDrag] = useState(null);
  const { isBlockedCell } = useGrid();

  useEffect(() => {
    const handleDragStart = (e) => {
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

    window.addEventListener('dragstart', handleDragStart);
    window.addEventListener('dragend', handleDragEnd);

    return () => {
      window.removeEventListener('dragstart', handleDragStart);
      window.removeEventListener('dragend', handleDragEnd);
    };
  }, []);

  const canPlaceIdol = (idol, position) => {
    if (!idol || !position) return false;

    const { row, col } = position;
    const idolType = idolTypes.find((type) => type.name === idol.type);
    if (!idolType) return false;

    const { width, height } = idolType;

    if (row + height > 7 || col + width > 6) return false;

    for (let r = row; r < row + height; r++) {
      for (let c = col; c < col + width; c++) {
        if (isBlockedCell(r, c)) return false;
        if (gridState[r][c] !== null) return false;
      }
    }
    return true;
  };

  const getValidPlacementCells = () => {
    if (!currentDrag) return [];

    const validCells = [];
    
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
          const isPrimary =
            cell &&
            (!cell.position ||
              (cell.position.row === rowIndex &&
                cell.position.col === colIndex));

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

  const gridPatternStyle = {
    backgroundSize: '56px 56px',
    backgroundImage: `
      linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
    `,
    backgroundPosition: '0 0'
  };

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