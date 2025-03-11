// utils/grid/gridUtils.js
import _ from "lodash";

export const isBlockedCell = (row, col) => {
  return (
    (row === 0 && col === 0) ||
    (row === 2 && (col === 1 || col === 4)) ||
    (row === 3 && (col === 1 || col === 2 || col === 3 || col === 4)) ||
    (row === 4 && (col === 1 || col === 4)) ||
    (row === 6 && col === 5)
  );
};

export const isValidPlacement = (grid, idol, row, col, idolTypes) => {
  const idolType = idolTypes.find((type) => type.name === idol.type);
  if (!idolType) return false;

  const { width, height } = idolType;

  if (row + height > 7 || col + width > 6) return false;

  for (let r = row; r < row + height; r++) {
    for (let c = col; c < col + width; c++) {
      if (isBlockedCell(r, c) || grid[r][c] !== null) {
        return false;
      }
    }
  }

  return true;
};

export const placeIdol = (grid, idol, row, col, idolTypes) => {
  const newGrid = _.cloneDeep(grid);
  const idolType = idolTypes.find((type) => type.name === idol.type);

  if (!idolType) return newGrid;

  for (let r = row; r < row + idolType.height; r++) {
    for (let c = col; c < col + idolType.width; c++) {
      newGrid[r][c] = { ...idol, position: { row, col } };
    }
  }

  return newGrid;
};

export const calculateGridScore = (grid) => {
  let filledCellCount = 0;

  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      if (grid[row][col] !== null && !isBlockedCell(row, col)) {
        filledCellCount++;
      }
    }
  }

  return filledCellCount;
};

function validatePlacement(grid, idol, row, col, idolTypes) {
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
}

export const optimizeGrid = (
  inventory,
  idolTypes,
  currentGrid,
  clearExisting = true
) => {
  if (inventory.length === 0) {
    return {
      grid: currentGrid,
      placedCount: 0,
      notPlacedCount: 0,
      notPlacedIdols: [],
    };
  }

  let bestGrid = clearExisting
    ? Array(7).fill().map(() => Array(6).fill(null))
    : _.cloneDeep(currentGrid);

  let bestScore = calculateGridScore(bestGrid);
  let placedIdols = new Set();
  let placementReasons = {};

  const MAX_ITERATIONS = 1000;

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const testGrid = Array(7).fill().map(() => Array(6).fill(null));
    const iterationPlacedIdols = new Set();
    const iterationReasons = {};

    const shuffledInventory = _.shuffle([...inventory]);

    for (const idol of shuffledInventory) {
      let placed = false;
      let reason = "no_space";

      for (let row = 0; row < 7 && !placed; row++) {
        for (let col = 0; col < 6 && !placed; col++) {
          const validation = validatePlacement(
            testGrid,
            idol,
            row,
            col,
            idolTypes
          );

          if (validation.valid) {
            const newGrid = placeIdol(testGrid, idol, row, col, idolTypes);

            for (let r = 0; r < 7; r++) {
              for (let c = 0; c < 6; c++) {
                testGrid[r][c] = newGrid[r][c];
              }
            }

            placed = true;
            iterationPlacedIdols.add(idol.id);
            break;
          } else {
            reason = validation.reason;
          }
        }
        if (placed) break;
      }

      if (!placed) {
        iterationReasons[idol.id] = reason;
      }
    }

    const score = calculateGridScore(testGrid);

    if (score > bestScore) {
      bestGrid = testGrid;
      bestScore = score;
      placedIdols = iterationPlacedIdols;
      placementReasons = iterationReasons;
    }
  }

  const notPlacedIdols = inventory
    .filter((idol) => !placedIdols.has(idol.id))
    .map((idol) => ({
      id: idol.id,
      name: idol.name,
      type: idol.type,
      reason: placementReasons[idol.id] || "no_space",
    }));

  return {
    grid: bestGrid,
    placedCount: placedIdols.size,
    notPlacedCount: notPlacedIdols.length,
    notPlacedIdols,
  };
};

export function optimizeIdolPlacement(
  idols,
  gridDimensions = { width: 6, height: 7 },
  invalidPositions = null,
  idolSizes = null
) {
  if (!invalidPositions) {
    invalidPositions = new Set([
      "0,0",
      "1,2",
      "4,2",
      "1,3",
      "2,3",
      "3,3",
      "4,3",
      "1,4",
      "4,4",
      "5,6",
    ]);
  }

  if (!idolSizes) {
    idolSizes = {
      minor: { width: 1, height: 1 },
      kamasan: { width: 1, height: 2 },
      totemic: { width: 1, height: 3 },
      noble: { width: 2, height: 1 },
      conqueror: { width: 2, height: 2 },
      burial: { width: 3, height: 1 },
    };
  }

  const scoredIdols = idols.map((idol) => {
    const modCount = (idol.prefixes?.length || 0) + (idol.suffixes?.length || 0);
    const size = idolSizes[idol.type.toLowerCase()]?.width * idolSizes[idol.type.toLowerCase()]?.height || 1;

    return {
      ...idol,
      valuePerCell: modCount / size,
      totalValue: modCount,
    };
  });

  scoredIdols.sort((a, b) => b.valuePerCell - a.valuePerCell);

  const grid = Array(gridDimensions.height).fill().map(() => Array(gridDimensions.width).fill(null));
  const placedIdols = [];

  for (const idol of scoredIdols) {
    const bestPosition = findBestPosition(idol, grid, invalidPositions, idolSizes);

    if (bestPosition) {
      placeIdolOnGrid(idol, bestPosition, grid, idolSizes);
      placedIdols.push({
        ...idol,
        position: bestPosition,
      });
    }
  }

  return placedIdols;
}

function findBestPosition(idol, grid, invalidPositions, idolSizes) {
  const idolType = idol.type.toLowerCase();
  const { width, height } = idolSizes[idolType] || { width: 1, height: 1 };
  const gridHeight = grid.length;
  const gridWidth = grid[0].length;

  const validPositions = [];

  for (let y = 0; y < gridHeight - height + 1; y++) {
    for (let x = 0; x < gridWidth - width + 1; x++) {
      if (isValidPosition(x, y, width, height, grid, invalidPositions)) {
        validPositions.push({ x, y });
      }
    }
  }

  if (validPositions.length === 0) {
    return null;
  }

  return validPositions[0];
}

function isValidPosition(x, y, width, height, grid, invalidPositions) {
  for (let j = 0; j < height; j++) {
    for (let i = 0; i < width; i++) {
      const posX = x + i;
      const posY = y + j;

      if (posY >= grid.length || posX >= grid[0].length) {
        return false;
      }

      if (invalidPositions.has(`${posX},${posY}`)) {
        return false;
      }

      if (grid[posY][posX] !== null) {
        return false;
      }
    }
  }

  return true;
}

function placeIdolOnGrid(idol, position, grid, idolSizes) {
  const idolType = idol.type.toLowerCase();
  const { width, height } = idolSizes[idolType] || { width: 1, height: 1 };
  const { x, y } = position;

  for (let j = 0; j < height; j++) {
    for (let i = 0; i < width; i++) {
      grid[y + j][x + i] = idol.id;
    }
  }
}

export function backtrackingOptimization(
  idols,
  gridDimensions = { width: 6, height: 7 },
  invalidPositions = null,
  idolSizes = null
) {
  if (!invalidPositions) {
    invalidPositions = new Set([
      "0,0",
      "1,2",
      "4,2",
      "1,3",
      "2,3",
      "3,3",
      "4,3",
      "1,4",
      "4,4",
      "5,6",
    ]);
  }

  if (!idolSizes) {
    idolSizes = {
      minor: { width: 1, height: 1 },
      kamasan: { width: 1, height: 2 },
      totemic: { width: 1, height: 3 },
      noble: { width: 2, height: 1 },
      conqueror: { width: 2, height: 2 },
      burial: { width: 3, height: 1 },
    };
  }

  const sortedIdols = [...idols].sort((a, b) => {
    const aValue = (a.prefixes?.length || 0) + (a.suffixes?.length || 0);
    const bValue = (b.prefixes?.length || 0) + (b.suffixes?.length || 0);
    return bValue - aValue;
  });

  const grid = Array(gridDimensions.height).fill().map(() => Array(gridDimensions.width).fill(null));

  let bestSolution = {
    idols: [],
    totalValue: 0,
  };

  function backtrack(index, currentGrid, placedIdols, currentValue) {
    if (index >= sortedIdols.length) {
      if (currentValue > bestSolution.totalValue) {
        bestSolution = {
          idols: [...placedIdols],
          totalValue: currentValue,
        };
      }
      return;
    }

    const idol = sortedIdols[index];
    const idolType = idol.type.toLowerCase();
    const { width, height } = idolSizes[idolType] || { width: 1, height: 1 };

    let placed = false;

    for (let y = 0; y < gridDimensions.height - height + 1; y++) {
      for (let x = 0; x < gridDimensions.width - width + 1; x++) {
        if (isValidPosition(x, y, width, height, currentGrid, invalidPositions)) {
          const newGrid = currentGrid.map((row) => [...row]);
          placeIdolOnGrid(idol, { x, y }, newGrid, idolSizes);
          const idolValue = (idol.prefixes?.length || 0) + (idol.suffixes?.length || 0);
          placedIdols.push({ ...idol, position: { x, y } });

          backtrack(index + 1, newGrid, placedIdols, currentValue + idolValue);

          placedIdols.pop();
          placed = true;
        }
      }
    }

    if (!placed) {
      backtrack(index + 1, currentGrid, placedIdols, currentValue);
    }
  }

  backtrack(0, grid, [], 0);
  return bestSolution.idols;
}