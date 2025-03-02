// utils/storageUtils.js
import pako from "pako";

// Storage keys for localStorage
const STORAGE_KEYS = {
  GRID_STATE: "poe-idol-grid",
  INVENTORY: "poe-idol-inventory",
};

/**
 * Encoding & Decoding
 */
function uint8ToBase64(uint8Array) {
  let binary = "";
  for (let i = 0; i < uint8Array.length; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-") // URL safe
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64ToUint8Array(base64) {
  base64 = base64.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4;
  if (pad) {
    base64 += "=".repeat(4 - pad);
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
    console.error("Failed to save grid:", err);
  }
}

/**
 * Save inventory to localStorage
 */
export function saveInventory(inventory) {
  try {
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));
  } catch (err) {
    console.error("Failed to save inventory:", err);
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
    console.error("Failed to load grid:", err);
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
    console.error("Failed to load inventory:", err);
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
    console.error("Failed to clear data:", err);
  }
}

/**
 * Get type code for an idol (single character)
 */
function getTypeCode(idolType) {
  switch (idolType) {
    case "Minor":
      return "m";
    case "Kamasan":
      return "k";
    case "Totemic":
      return "t";
    case "Noble":
      return "n";
    case "Conqueror":
      return "c";
    case "Burial":
      return "b";
    default:
      return "x"; // Unknown
  }
}

/**
 * Get full idol type from type code
 */
function getIdolTypeFromCode(code) {
  switch (code) {
    case "m":
      return "Minor";
    case "k":
      return "Kamasan";
    case "t":
      return "Totemic";
    case "n":
      return "Noble";
    case "c":
      return "Conqueror";
    case "b":
      return "Burial";
    default:
      return "Unknown";
  }
}

/**
 * Optimize data for sharing with extreme compression
 */
function optimizeDataForSharing(gridState, inventory) {
  // Assign simple sequential IDs for referencing
  const idolMap = new Map();
  inventory.forEach((idol, index) => {
    idolMap.set(idol.id, index);
  });

  // 1. Create optimized grid representation
  const sparseGrid = [];

  // Track which idols are placed
  const placedIdols = new Set();

  // Only store non-null cells - primary positions only
  for (let r = 0; r < gridState.length; r++) {
    for (let c = 0; c < gridState[r].length; c++) {
      const cell = gridState[r][c];
      if (cell) {
        // Only store the primary cell of each idol (top-left corner)
        const pos = cell.position || { row: r, col: c };
        if (pos.row === r && pos.col === c) {
          // Simple array: [idolIndex, row, col]
          const idolIndex = idolMap.get(cell.id);
          sparseGrid.push([idolIndex, r, c]);

          // Mark as placed
          placedIdols.add(idolIndex);
        }
      }
    }
  }

  // 2. Optimize inventory data to bare minimum
  const optimizedInventory = inventory.map((idol, index) => {
    // Get type code (first letter lowercase)
    const typeCode = getTypeCode(idol.type);

    // Base data structure
    const result = [index, typeCode, placedIdols.has(index) ? 1 : 0];

    // Handle unique vs normal idols differently
    if (idol.isUnique) {
      // For unique idols, store the name and mods
      result.push(1); // isUnique = true
      result.push(idol.uniqueName || idol.name); // Store unique name

      if (idol.uniqueModifiers && idol.uniqueModifiers.length > 0) {
        result.push(idol.uniqueModifiers.map((m) => m.Mod));
      } else {
        result.push([]);
      }
    } else {
      // For normal idols, store prefix and suffix IDs
      result.push(0); // isUnique = false

      // Get prefix and suffix IDs - only include those with IDs
      const prefixIds =
        idol.prefixes?.filter((p) => p.id).map((p) => p.id) || [];
      const suffixIds =
        idol.suffixes?.filter((s) => s.id).map((s) => s.id) || [];

      result.push(prefixIds);
      result.push(suffixIds);
    }

    return result;
  });

  return {
    g: sparseGrid,
    v: optimizedInventory,
  };
}

/**
 * Find a modifier by ID in the mod data
 */
function findModifierById(id, modData) {
  if (!modData || !id) return null;

  // Search prefixes across all idol types
  for (const type in modData.prefixes) {
    const foundPrefix = modData.prefixes[type].find(
      (prefix) => prefix.id === id
    );
    if (foundPrefix) return { ...foundPrefix };
  }

  // Search suffixes across all idol types
  for (const type in modData.suffixes) {
    const foundSuffix = modData.suffixes[type].find(
      (suffix) => suffix.id === id
    );
    if (foundSuffix) return { ...foundSuffix };
  }

  // Not found
  return null;
}

/**
 * Generate idol name from its mods
 */
function generateIdolName(type, prefixes, suffixes, isUnique) {
  if (isUnique) return `Unique ${type} Idol`;

  let name = type;

  if (prefixes && prefixes.length > 0) {
    name = `${prefixes[0].Name} ${name}`;
  }

  if (suffixes && suffixes.length > 0) {
    name = `${name} ${suffixes[0].Name}`;
  }

  return name;
}

/**
 * Restore from optimized data format
 */
function restoreFromOptimizedData(optimizedData, modData) {
  if (!optimizedData || !optimizedData.v || !optimizedData.g) {
    return null;
  }

  // 1. Restore idols from minimal data
  const inventory = optimizedData.v.map((idolData) => {
    // Extract base data
    const [index, typeCode, isPlaced, isUnique] = idolData;

    // Get full idol type from code
    const type = getIdolTypeFromCode(typeCode);

    // Different handling for unique vs normal idols
    if (isUnique === 1) {
      // Unique idol
      const uniqueName = idolData[4];
      const uniqueMods = idolData[5] || [];

      return {
        id: `idol-${Date.now()}-${index}`, // Generate new unique ID
        type,
        name: uniqueName,
        uniqueName,
        isPlaced: isPlaced === 1,
        isUnique: true,
        uniqueModifiers: uniqueMods.map((mod) => ({
          Mod: mod,
          Name: "Unique",
          Code: `Unique-${Date.now()}-${Math.random()}`,
        })),
        prefixes: [],
        suffixes: [],
      };
    } else {
      // Normal idol
      const prefixIds = idolData[4] || [];
      const suffixIds = idolData[5] || [];

      // Restore prefixes and suffixes from IDs
      const prefixes = prefixIds
        .map((id) => findModifierById(id, modData))
        .filter((m) => m !== null);

      const suffixes = suffixIds
        .map((id) => findModifierById(id, modData))
        .filter((m) => m !== null);

      // Generate name from modifiers
      const name = generateIdolName(type, prefixes, suffixes, false);

      return {
        id: `idol-${Date.now()}-${index}`, // Generate new unique ID
        type,
        name,
        isPlaced: isPlaced === 1,
        isUnique: false,
        prefixes,
        suffixes,
      };
    }
  });

  // 2. Create empty grid
  const gridState = Array(7)
    .fill()
    .map(() => Array(6).fill(null));

  // 3. Place idols on the grid using the optimized placement data
  for (const placement of optimizedData.g) {
    // Extract placement data
    const [idolIndex, row, col] = placement;

    // Find the corresponding idol
    const idol = inventory[idolIndex];
    if (!idol) continue;

    // Get idol dimensions based on type
    let width = 1,
      height = 1;
    switch (idol.type) {
      case "Minor":
        width = 1;
        height = 1;
        break;
      case "Kamasan":
        width = 1;
        height = 2;
        break;
      case "Totemic":
        width = 1;
        height = 3;
        break;
      case "Noble":
        width = 2;
        height = 1;
        break;
      case "Conqueror":
        width = 2;
        height = 2;
        break;
      case "Burial":
        width = 3;
        height = 1;
        break;
      default:
        width = 1;
        height = 1;
        break;
    }

    // Mark as placed
    idol.isPlaced = true;

    // Place the idol on all its grid cells
    for (let r = row; r < row + height; r++) {
      for (let c = col; c < col + width; c++) {
        if (r < gridState.length && c < gridState[0].length) {
          gridState[r][c] = {
            ...idol,
            position: { row, col },
          };
        }
      }
    }
  }

  return {
    gridState,
    inventory,
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
    url.searchParams.set("share", base64);
    return url.toString();
  } catch (err) {
    console.error("Failed to generate share URL:", err);
    return window.location.href;
  }
}

/**
 * Extract shared data from URL
 */
export function getSharedDataFromURL(modData) {
  try {
    const url = new URL(window.location.href);
    const shareParam = url.searchParams.get("share");
    if (!shareParam) return null;

    const compressed = base64ToUint8Array(shareParam);
    const json = pako.inflate(compressed, { to: "string" });
    const optimizedData = JSON.parse(json);

    // Convert optimized format back to full structure
    return restoreFromOptimizedData(optimizedData, modData);
  } catch (err) {
    console.error("Failed to extract shared data:", err);
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
    console.error("Failed to copy to clipboard:", err);
    return false;
  }
}
