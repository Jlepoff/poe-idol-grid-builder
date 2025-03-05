// components/Grid.jsx
import React from "react";
import GridCell from "./GridCell";

function Grid({ gridState, onPlaceIdol, onRemoveFromGrid, idolTypes }) {
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
              gridState={gridState} // Pass entire grid state for validation
            />
          );
        })}
      </div>
    ));
  };

  // Slightly smaller grid container with centered content
  return (
    <div className="grid-container border-2 border-indigo-600 rounded-xl p-1 bg-slate-950 inline-block shadow-sm mx-auto scale-95">
      {renderGrid()}
    </div>
  );
}

export default Grid;