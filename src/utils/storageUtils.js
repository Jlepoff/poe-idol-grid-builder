// utils/storageUtils.js
import pako from 'pako';

// Storage keys for localStorage
const STORAGE_KEYS = {
  GRID_STATE: 'poe-idol-grid',
  INVENTORY: 'poe-idol-inventory'
};

/**
 * Encoding & Decoding
 */
function uint8ToBase64(uint8Array) {
  let binary = '';
  for (let i = 0; i < uint8Array.length; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')  // URL safe
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64ToUint8Array(base64) {
  base64 = base64.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4;
  if (pad) {
    base64 += '='.repeat(4 - pad);
  }
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Save grid state to localStorage
 */
export function saveGridState(gridState) {
  try {
    localStorage.setItem(STORAGE_KEYS.GRID_STATE, JSON.stringify(gridState));
  } catch (err) {
    console.error('Failed to save grid:', err);
  }
}

/**
 * Save inventory to localStorage
 */
export function saveInventory(inventory) {
  try {
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));
  } catch (err) {
    console.error('Failed to save inventory:', err);
  }
}

/**
 * Load grid state from localStorage
 */
export function loadGridState() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.GRID_STATE);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error('Failed to load grid:', err);
    return null;
  }
}

/**
 * Load inventory from localStorage
 */
export function loadInventory() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.INVENTORY);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error('Failed to load inventory:', err);
    return null;
  }
}

/**
 * Clear all saved data
 */
export function clearSavedData() {
  try {
    localStorage.removeItem(STORAGE_KEYS.GRID_STATE);
    localStorage.removeItem(STORAGE_KEYS.INVENTORY);
  } catch (err) {
    console.error('Failed to clear data:', err);
  }
}

/**
 * Optimize data for sharing by removing redundant information
 * and compressing the structure
 */
function optimizeDataForSharing(gridState, inventory) {
  // 1. Create optimized grid representation (sparse format)
  const sparseGrid = [];
  
  // Track which idols are placed on the grid by ID
  const placedIdolIds = new Set();
  
  // Only store non-null cells
  for (let r = 0; r < gridState.length; r++) {
    for (let c = 0; c < gridState[r].length; c++) {
      const cell = gridState[r][c];
      if (cell) {
        // Only store the primary cell of each idol (top-left corner)
        const pos = cell.position || { row: r, col: c };
        if (pos.row === r && pos.col === c) {
          // Store minimal information for grid placement
          sparseGrid.push({
            i: cell.id,       // idol ID
            r,                // row
            c,                // col
            t: cell.type      // type
          });
          
          // Mark this idol as placed
          placedIdolIds.add(cell.id);
        }
      }
    }
  }
  
  // 2. Optimize inventory data by only including essential fields
  const optimizedInventory = inventory.map(idol => {
    // Basic idol data
    const optimizedIdol = {
      i: idol.id,
      t: idol.type,
      n: idol.name,
      p: idol.isPlaced || placedIdolIds.has(idol.id)
    };
    
    // Handle prefixes
    if (idol.prefixes && idol.prefixes.length > 0) {
      optimizedIdol.px = idol.prefixes.map(prefix => ({
        c: prefix.Code,
        m: prefix.Mod,
        n: prefix.Name
      }));
    }
    
    // Handle suffixes
    if (idol.suffixes && idol.suffixes.length > 0) {
      optimizedIdol.sx = idol.suffixes.map(suffix => ({
        c: suffix.Code,
        m: suffix.Mod,
        n: suffix.Name
      }));
    }
    
    // Handle unique modifiers for unique idols
    if (idol.isUnique && idol.uniqueModifiers) {
      optimizedIdol.u = true;
      optimizedIdol.um = idol.uniqueModifiers.map(mod => ({
        m: mod.Mod
      }));
    }
    
    return optimizedIdol;
  });
  
  return {
    g: sparseGrid,
    v: optimizedInventory
  };
}

/**
 * Restore full data structure from optimized format
 */
function restoreFromOptimizedData(optimizedData) {
  // 1. Restore inventory with full structure
  const inventory = optimizedData.v.map(opt => {
    const idol = {
      id: opt.i,
      type: opt.t,
      name: opt.n,
      isPlaced: opt.p || false
    };
    
    // Restore prefixes
    if (opt.px) {
      idol.prefixes = opt.px.map(p => ({
        Code: p.c,
        Mod: p.m,
        Name: p.n
      }));
    } else {
      idol.prefixes = [];
    }
    
    // Restore suffixes
    if (opt.sx) {
      idol.suffixes = opt.sx.map(s => ({
        Code: s.c,
        Mod: s.m,
        Name: s.n
      }));
    } else {
      idol.suffixes = [];
    }
    
    // Restore unique idol properties
    if (opt.u) {
      idol.isUnique = true;
      idol.uniqueModifiers = opt.um.map(m => ({
        Mod: m.m,
        Name: 'Unique',
        Code: `Unique-${Date.now()}-${Math.random()}`
      }));
    }
    
    return idol;
  });
  
  // 2. Create empty grid
  const gridState = Array(7).fill().map(() => Array(6).fill(null));
  
  // 3. Place idols on the grid
  for (const placement of optimizedData.g) {
    // Find the corresponding idol in inventory
    const idol = inventory.find(inv => inv.id === placement.i);
    if (!idol) continue;
    
    // Get idol dimensions based on type
    let width = 1, height = 1;
    switch (placement.t) {
      case 'Minor':
        width = 1; height = 1;
        break;
      case 'Kamasan':
        width = 1; height = 2;
        break;
      case 'Totemic':
        width = 1; height = 3;
        break;
      case 'Noble':
        width = 2; height = 1;
        break;
      case 'Conqueror':
        width = 2; height = 2;
        break;
      case 'Burial':
        width = 3; height = 1;
        break;
	  default:
	    // Default to 1x1 for unknown types
	    width = 1; height = 1;
	    break;
    }
    
    // Place the idol on all its cells
    for (let r = placement.r; r < placement.r + height; r++) {
      for (let c = placement.c; c < placement.c + width; c++) {
        if (r < gridState.length && c < gridState[0].length) {
          gridState[r][c] = {
            ...idol,
            position: { row: placement.r, col: placement.c }
          };
        }
      }
    }
  }
  
  return {
    gridState,
    inventory
  };
}

/**
 * Generate a shareable URL with the current grid and inventory
 */
export function generateShareableURL(gridState, inventory) {
  try {
    // Optimize data structure before compression
    const optimizedData = optimizeDataForSharing(gridState, inventory);
    
    // Use highest compression level
    const json = JSON.stringify(optimizedData);
    const compressed = pako.deflate(json, { level: 9 });
    const base64 = uint8ToBase64(compressed);
    
    const url = new URL(window.location.href);
    url.searchParams.set('share', base64);
    return url.toString();
  } catch (err) {
    console.error('Failed to generate share URL:', err);
    return window.location.href;
  }
}

/**
 * Extract shared data from URL
 */
export function getSharedDataFromURL() {
  try {
    const url = new URL(window.location.href);
    const shareParam = url.searchParams.get('share');
    if (!shareParam) return null;
    
    const compressed = base64ToUint8Array(shareParam);
    const json = pako.inflate(compressed, { to: 'string' });
    const optimizedData = JSON.parse(json);
    
    // Convert optimized format back to full structure
    return restoreFromOptimizedData(optimizedData);
  } catch (err) {
    console.error('Failed to extract shared data:', err);
    return null;
  }
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
}