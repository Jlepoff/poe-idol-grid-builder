// utils.js - Core utility functions

import _ from 'lodash';

// Idol type definitions with dimensions
const IDOL_TYPES = [
  { name: 'Minor', width: 1, height: 1 },
  { name: 'Kamasan', width: 1, height: 2 },
  { name: 'Totemic', width: 1, height: 3 },
  { name: 'Noble', width: 2, height: 1 },
  { name: 'Conqueror', width: 2, height: 2 },
  { name: 'Burial', width: 3, height: 1 }
];

/**
 * Load idol data from JSON files with GitHub Pages compatibility
 */
export const loadIdolData = async () => {
  try {
    // Get the base URL for the current environment
    // This accounts for GitHub Pages serving from a subdirectory
    const baseUrl = process.env.PUBLIC_URL || '';
    
    // Fetch all idol data files with proper path prefixing
    const responses = await Promise.all([
      fetch(`${baseUrl}/data/minor_idol_mods.json`),
      fetch(`${baseUrl}/data/kamasan_idol_mods.json`),
      fetch(`${baseUrl}/data/totemic_idol_mods.json`),
      fetch(`${baseUrl}/data/noble_idol_mods.json`),
      fetch(`${baseUrl}/data/conqueror_idol_mods.json`),
      fetch(`${baseUrl}/data/burial_idol_mods.json`)
    ]);
    
    // Log response status to help debug
    // console.log('Data fetch responses:', 
      // responses.map(r => `${r.url}: ${r.status}`));
    
    // Check if any responses failed
    const failedResponses = responses.filter(r => !r.ok);
    if (failedResponses.length > 0) {
      throw new Error(`Failed to load: ${failedResponses.map(r => r.url).join(', ')}`);
    }
    
    // Parse JSON data
    const [minorData, kamasanData, totemicData, nobleData, conquerorData, burialData] = 
      await Promise.all(responses.map(r => r.json()));

    // Organize data by mod type and idol type
    const modData = {
      prefixes: {
        Minor: minorData.prefixes,
        Kamasan: kamasanData.prefixes,
        Totemic: totemicData.prefixes,
        Noble: nobleData.prefixes,
        Conqueror: conquerorData.prefixes,
        Burial: burialData.prefixes
      },
      suffixes: {
        Minor: minorData.suffixes,
        Kamasan: kamasanData.suffixes,
        Totemic: totemicData.suffixes,
        Noble: nobleData.suffixes,
        Conqueror: conquerorData.suffixes,
        Burial: burialData.suffixes
      }
    };

    return {
      mods: modData,
      types: IDOL_TYPES
    };
  } catch (error) {
    console.error('Error loading idol data:', error);
    // Provide more helpful error for users
    alert('Failed to load idol data. If you\'re seeing this error, please ensure data files are in the correct location and refresh the page.');
    throw error;
  }
};
/**
 * Check if a cell is blocked in the grid
 */
export const isBlockedCell = (row, col) => {
  return (
    (row === 0 && col === 0) || // Top-left corner
    (row === 2 && (col === 1 || col === 4)) || // Row 3 blocked cells
    (row === 3 && (col === 1 || col === 2 || col === 3 || col === 4)) || // Row 4
    (row === 4 && (col === 1 || col === 4)) || // Row 5
    (row === 6 && col === 5) // Bottom-right
  );
};

/**
 * Check if an idol placement is valid
 */
export const isValidPlacement = (grid, idol, row, col, idolTypes) => {
  const idolType = idolTypes.find(type => type.name === idol.type);
  if (!idolType) return false;
  
  const { width, height } = idolType;
  
  // Check if placement is within grid bounds
  if (row + height > 7 || col + width > 6) return false;
  
  // Check for blocked cells and overlapping idols
  for (let r = row; r < row + height; r++) {
    for (let c = col; c < col + width; c++) {
      if (isBlockedCell(r, c) || grid[r][c] !== null) {
        return false;
      }
    }
  }
  
  return true;
};

/**
 * Place an idol on the grid
 * Returns a new grid with the idol placed
 */
export const placeIdol = (grid, idol, row, col, idolTypes) => {
  const newGrid = _.cloneDeep(grid);
  const idolType = idolTypes.find(type => type.name === idol.type);
  
  if (!idolType) return newGrid;
  
  for (let r = row; r < row + idolType.height; r++) {
    for (let c = col; c < col + idolType.width; c++) {
      newGrid[r][c] = { ...idol, position: { row, col } };
    }
  }
  
  return newGrid;
};

/**
 * Calculate score for a grid arrangement
 * Higher score = more filled cells
 */
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

/**
 * Optimize idol placement on the grid
 */
export const optimizeGrid = (inventory, idolTypes, currentGrid, clearExisting = true) => {
  if (inventory.length === 0) {
    return {
      grid: currentGrid,
      placedCount: 0,
      notPlacedCount: 0,
      notPlacedIdols: []
    };
  }
  
  // Start with an empty grid or use current state
  let bestGrid = clearExisting 
    ? Array(7).fill().map(() => Array(6).fill(null)) 
    : _.cloneDeep(currentGrid);
    
  let bestScore = calculateGridScore(bestGrid);
  let placedIdols = new Set();
  let placementReasons = {};
  
  // Try different arrangements to find the best one
  const MAX_ITERATIONS = 1000;
  
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    // Start with a clean grid for each iteration
    const testGrid = Array(7).fill().map(() => Array(6).fill(null));
    const iterationPlacedIdols = new Set();
    const iterationReasons = {};
    
    // Try with a random idol order each time
    const shuffledInventory = _.shuffle([...inventory]);
    
    // Place each idol if possible
    for (const idol of shuffledInventory) {
      let placed = false;
      let reason = 'no_space';
      
      // Try all possible positions
      for (let row = 0; row < 7 && !placed; row++) {
        for (let col = 0; col < 6 && !placed; col++) {
          const validation = validatePlacement(testGrid, idol, row, col, idolTypes);
          
          if (validation.valid) {
            // Place the idol
            const newGrid = placeIdol(testGrid, idol, row, col, idolTypes);
            
            // Update test grid
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
      
      // Record reason if not placed
      if (!placed) {
        iterationReasons[idol.id] = reason;
      }
    }
    
    // Evaluate this arrangement
    const score = calculateGridScore(testGrid);
    
    // Update if this is the best arrangement so far
    if (score > bestScore) {
      bestGrid = testGrid;
      bestScore = score;
      placedIdols = iterationPlacedIdols;
      placementReasons = iterationReasons;
    }
  }
  
  // Get list of idols that couldn't be placed
  const notPlacedIdols = inventory
    .filter(idol => !placedIdols.has(idol.id))
    .map(idol => ({
      id: idol.id,
      name: idol.name,
      type: idol.type,
      reason: placementReasons[idol.id] || 'no_space'
    }));
  
  return {
    grid: bestGrid,
    placedCount: placedIdols.size,
    notPlacedCount: notPlacedIdols.length,
    notPlacedIdols
  };
};

/**
 * Validate a placement and return reasons
 */
function validatePlacement(grid, idol, row, col, idolTypes) {
  const idolType = idolTypes.find(type => type.name === idol.type);
  
  if (!idolType) {
    return { valid: false, reason: 'unknown_type' };
  }
  
  const { width, height } = idolType;
  
  // Check grid bounds
  if (row + height > 7 || col + width > 6) {
    return { valid: false, reason: 'size_too_large' };
  }
  
  // Check cells
  for (let r = row; r < row + height; r++) {
    for (let c = col; c < col + width; c++) {
      // Check for blocked cells
      if (isBlockedCell(r, c)) {
        return { valid: false, reason: 'blocked_cells' };
      }
      
      // Check for overlaps
      if (grid[r][c] !== null) {
        return { valid: false, reason: 'overlapping' };
      }
    }
  }
  
  return { valid: true };
}