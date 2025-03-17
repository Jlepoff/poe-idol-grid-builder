// hooks/useGrid.js
import { useContext, useCallback, useMemo } from 'react';
import { AppContext } from '../context/AppContext';

export const useGrid = () => {
  const {
    gridState,
    idolTypes,
    canPlaceIdol,
    placeIdolOnGrid,
    removeIdolFromGrid,
    handlePlaceIdol,
    handleRemoveFromGrid,
    handleOptimizeGrid,
    isBlockedCell: contextIsBlockedCell,
  } = useContext(AppContext);

  // Use the memoized isBlockedCell from context if available, otherwise create it
  const isBlockedCell = useCallback((row, col) => {
    if (contextIsBlockedCell) {
      return contextIsBlockedCell(row, col);
    }

    return (
      (row === 0 && col === 0) ||
      (row === 2 && (col === 1 || col === 4)) ||
      (row === 3 && (col === 1 || col === 2 || col === 3 || col === 4)) ||
      (row === 4 && (col === 1 || col === 4)) ||
      (row === 6 && col === 5)
    );
  }, [contextIsBlockedCell]);

  // Get dimensions of an idol based on its type
  const getIdolDimensions = useCallback((idol) => {
    if (!idol || !idol.type) return { width: 1, height: 1 };

    const idolType = idolTypes.find((type) => type.name === idol.type);
    return idolType ? { width: idolType.width, height: idolType.height } : { width: 1, height: 1 };
  }, [idolTypes]);

  // Validates if an idol can be placed at a given position
  const validatePlacement = useCallback((grid, idol, row, col) => {
    const idolType = idolTypes.find((type) => type.name === idol.type);

    if (!idolType) {
      return { valid: false, reason: "unknown_type" };
    }

    const { width, height } = idolType;

    if (row + height > 7 || col + width > 6) {
      return { valid: false, reason: "size_too_large" };
    }

    for (let r = row; r < row + height; r++) {
      for (let c = col; c < col + width; c++) {
        if (isBlockedCell(r, c)) {
          return { valid: false, reason: "blocked_cells" };
        }

        if (grid[r]?.[c] !== null) {
          return { valid: false, reason: "overlapping" };
        }
      }
    }

    return { valid: true };
  }, [idolTypes, isBlockedCell]);

  // Calculate grid statistics (using useMemo for performance)
  const gridStats = useMemo(() => {
    let filledCellCount = 0;
    let totalIdols = 0;
    const idolTypeCount = {};

    // Track processed cells to avoid counting the same idol multiple times
    const processedCells = new Set();

    for (let row = 0; row < gridState.length; row++) {
      for (let col = 0; col < gridState[row].length; col++) {
        const cell = gridState[row][col];

        if (cell !== null && !isBlockedCell(row, col)) {
          filledCellCount++;

          // Track idol types and count them only once per idol
          const position = cell.position || { row, col };
          const cellKey = `${position.row}-${position.col}`;

          if (!processedCells.has(cellKey)) {
            processedCells.add(cellKey);
            totalIdols++;

            const type = cell.type;
            idolTypeCount[type] = (idolTypeCount[type] || 0) + 1;
          }
        }
      }
    }

    return {
      filledCellCount,
      totalIdols,
      idolTypeCount
    };
  }, [gridState, isBlockedCell]);

  return {
    gridState,
    isBlockedCell,
    getIdolDimensions,
    validatePlacement,
    canPlaceIdol,
    placeIdolOnGrid,
    removeIdolFromGrid,
    handlePlaceIdol,
    handleRemoveFromGrid,
    handleOptimizeGrid,
    gridStats
  };
};