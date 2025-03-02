// optimizationAlgorithm.js - Idol grid placement optimizer

/**
 * Find the optimal placement of idols on a grid
 *
 * @param {Array} idols - Array of idol objects to place
 * @param {Object} gridDimensions - Grid dimensions (defaults to 6x7)
 * @param {Set} invalidPositions - Set of invalid positions ("x,y" format)
 * @param {Object} idolSizes - Mapping of idol types to dimensions
 * @returns {Array} - Array of positioned idols
 */
function optimizeIdolPlacement(
  idols,
  gridDimensions = { width: 6, height: 7 },
  invalidPositions = null,
  idolSizes = null
) {
  // Set up default invalid positions based on the grid layout
  if (!invalidPositions) {
    invalidPositions = new Set([
      "0,0", // Top left corner
      "1,2",
      "4,2", // Row 3 blocked cells
      "1,3",
      "2,3",
      "3,3",
      "4,3", // Row 4 blocked cells
      "1,4",
      "4,4", // Row 5 blocked cells
      "5,6", // Bottom right corner
    ]);
  }

  // Set up default idol size mappings if not provided
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

  // Score idols by value per grid cell
  const scoredIdols = idols.map((idol) => {
    const modCount =
      (idol.prefixes?.length || 0) + (idol.suffixes?.length || 0);
    const size =
      idolSizes[idol.type.toLowerCase()]?.width *
      idolSizes[idol.type.toLowerCase()]?.height || 1;

    return {
      ...idol,
      valuePerCell: modCount / size,
      totalValue: modCount,
    };
  });

  // Sort by value per cell (highest value idols first)
  scoredIdols.sort((a, b) => b.valuePerCell - a.valuePerCell);

  // Initialize grid
  const grid = Array(gridDimensions.height)
    .fill()
    .map(() => Array(gridDimensions.width).fill(null));

  // Place idols one by one
  const placedIdols = [];

  for (const idol of scoredIdols) {
    const bestPosition = findBestPosition(
      idol,
      grid,
      invalidPositions,
      idolSizes
    );

    if (bestPosition) {
      // Place the idol on the grid
      placeIdolOnGrid(idol, bestPosition, grid, idolSizes);

      // Add to placed idols list
      placedIdols.push({
        ...idol,
        position: bestPosition,
      });
    }
  }

  return placedIdols;
}

/**
 * Find the best position for an idol on the grid
 */
function findBestPosition(idol, grid, invalidPositions, idolSizes) {
  const idolType = idol.type.toLowerCase();
  const { width, height } = idolSizes[idolType] || { width: 1, height: 1 };
  const gridHeight = grid.length;
  const gridWidth = grid[0].length;

  // Get all possible positions
  const validPositions = [];

  for (let y = 0; y < gridHeight - height + 1; y++) {
    for (let x = 0; x < gridWidth - width + 1; x++) {
      if (isValidPosition(x, y, width, height, grid, invalidPositions)) {
        validPositions.push({ x, y });
      }
    }
  }

  if (validPositions.length === 0) {
    return null; // No valid position found
  }

  // For now, we just return the first valid position
  // Future versions could score positions based on optimal grid utilization
  return validPositions[0];
}

/**
 * Check if a position is valid for an idol
 */
function isValidPosition(x, y, width, height, grid, invalidPositions) {
  // Check if any part of the idol would overlap an invalid position
  for (let j = 0; j < height; j++) {
    for (let i = 0; i < width; i++) {
      const posX = x + i;
      const posY = y + j;

      // Check bounds
      if (posY >= grid.length || posX >= grid[0].length) {
        return false;
      }

      // Check invalid positions
      if (invalidPositions.has(`${posX},${posY}`)) {
        return false;
      }

      // Check if already occupied
      if (grid[posY][posX] !== null) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Place an idol on the grid
 */
function placeIdolOnGrid(idol, position, grid, idolSizes) {
  const idolType = idol.type.toLowerCase();
  const { width, height } = idolSizes[idolType] || { width: 1, height: 1 };
  const { x, y } = position;

  // Mark all covered cells with this idol's ID
  for (let j = 0; j < height; j++) {
    for (let i = 0; i < width; i++) {
      grid[y + j][x + i] = idol.id;
    }
  }
}

/**
 * Advanced optimization using backtracking
 * This tries different permutations of idols to find the optimal arrangement
 */
function backtrackingOptimization(
  idols,
  gridDimensions = { width: 6, height: 7 },
  invalidPositions = null,
  idolSizes = null
) {
  // Set up default invalid positions
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

  // Set up default idol sizes
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

  // Sort idols by total value first
  const sortedIdols = [...idols].sort((a, b) => {
    const aValue = (a.prefixes?.length || 0) + (a.suffixes?.length || 0);
    const bValue = (b.prefixes?.length || 0) + (b.suffixes?.length || 0);
    return bValue - aValue;
  });

  // Initialize grid
  const grid = Array(gridDimensions.height)
    .fill()
    .map(() => Array(gridDimensions.width).fill(null));

  // Track best solution
  let bestSolution = {
    idols: [],
    totalValue: 0,
  };

  // Recursive backtracking function
  function backtrack(index, currentGrid, placedIdols, currentValue) {
    // Base case: we've tried all idols
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

    // Try each possible position
    let placed = false;

    for (let y = 0; y < gridDimensions.height - height + 1; y++) {
      for (let x = 0; x < gridDimensions.width - width + 1; x++) {
        if (
          isValidPosition(x, y, width, height, currentGrid, invalidPositions)
        ) {
          // Copy grid to avoid modifying the original
          const newGrid = currentGrid.map((row) => [...row]);

          // Place idol temporarily
          placeIdolOnGrid(idol, { x, y }, newGrid, idolSizes);

          // Calculate idol value
          const idolValue =
            (idol.prefixes?.length || 0) + (idol.suffixes?.length || 0);

          // Add to placed idols
          placedIdols.push({ ...idol, position: { x, y } });

          // Continue backtracking
          backtrack(index + 1, newGrid, placedIdols, currentValue + idolValue);

          // Remove idol (backtrack)
          placedIdols.pop();

          placed = true;
        }
      }
    }

    // If we couldn't place this idol, try the next one
    if (!placed) {
      backtrack(index + 1, currentGrid, placedIdols, currentValue);
    }
  }

  // Start backtracking
  backtrack(0, grid, [], 0);

  return bestSolution.idols;
}

// Export the optimization functions
export { optimizeIdolPlacement, backtrackingOptimization };
