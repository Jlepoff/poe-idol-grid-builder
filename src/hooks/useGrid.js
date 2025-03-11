// hooks/useGrid.js
import { useContext, useCallback } from 'react';
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
  } = useContext(AppContext);

  const isBlockedCell = useCallback((row, col) => {
    return (
      (row === 0 && col === 0) ||
      (row === 2 && (col === 1 || col === 4)) ||
      (row === 3 && (col === 1 || col === 2 || col === 3 || col === 4)) ||
      (row === 4 && (col === 1 || col === 4)) ||
      (row === 6 && col === 5)
    );
  }, []);

  const getIdolDimensions = useCallback((idol) => {
    const idolType = idolTypes.find((type) => type.name === idol.type);
    return idolType ? { width: idolType.width, height: idolType.height } : { width: 1, height: 1 };
  }, [idolTypes]);

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

        if (grid[r][c] !== null) {
          return { valid: false, reason: "overlapping" };
        }
      }
    }

    return { valid: true };
  }, [idolTypes, isBlockedCell]);

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
  };
};