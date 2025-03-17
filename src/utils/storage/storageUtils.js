// utils/storage/storageUtils.js
import pako from "pako";

const STORAGE_KEYS = {
  GRID_STATE: "poe-idol-grid",
  INVENTORY: "poe-idol-inventory",
};

// Base64 conversion utilities
const uint8ToBase64 = (uint8Array) => {
  const binary = uint8Array.reduce((acc, byte) => acc + String.fromCharCode(byte), "");
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
};

const base64ToUint8Array = (base64) => {
  // Restore standard base64 format
  const standardBase64 = base64
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  // Add padding if needed
  const pad = standardBase64.length % 4;
  const paddedBase64 = pad
    ? standardBase64 + "=".repeat(4 - pad)
    : standardBase64;

  const binaryString = atob(paddedBase64);
  const bytes = new Uint8Array(binaryString.length);

  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return bytes;
};

// Local storage operations with error handling
export const saveGridState = (gridState) => {
  try {
    localStorage.setItem(STORAGE_KEYS.GRID_STATE, JSON.stringify(gridState));
    return true;
  } catch (err) {
    console.error("Failed to save grid:", err);
    return false;
  }
};

export const saveInventory = (inventory) => {
  try {
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));
    return true;
  } catch (err) {
    console.error("Failed to save inventory:", err);
    return false;
  }
};

export const loadGridState = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.GRID_STATE);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error("Failed to load grid:", err);
    return null;
  }
};

export const loadInventory = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.INVENTORY);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error("Failed to load inventory:", err);
    return null;
  }
};

export const clearSavedData = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.GRID_STATE);
    localStorage.removeItem(STORAGE_KEYS.INVENTORY);
    return true;
  } catch (err) {
    console.error("Failed to clear data:", err);
    return false;
  }
};

// Type code utilities
const typeCodeMap = {
  Minor: "m",
  Kamasan: "k",
  Totemic: "t",
  Noble: "n",
  Conqueror: "c",
  Burial: "b"
};

const typeFromCodeMap = Object.entries(typeCodeMap).reduce(
  (acc, [type, code]) => ({ ...acc, [code]: type }),
  {}
);

const getTypeCode = (idolType) => typeCodeMap[idolType] || "x";

const getIdolTypeFromCode = (code) => typeFromCodeMap[code] || "Unknown";

// Data optimization and restoration
const optimizeDataForSharing = (gridState, inventory) => {
  // Create a map for quick idol lookup by id
  const idolMap = new Map(inventory.map((idol, index) => [idol.id, index]));
  const sparseGrid = [];
  const placedIdols = new Set();

  // Process grid cells
  for (let r = 0; r < gridState.length; r++) {
    for (let c = 0; c < gridState[r].length; c++) {
      const cell = gridState[r][c];
      if (cell) {
        const pos = cell.position || { row: r, col: c };
        if (pos.row === r && pos.col === c) {
          const idolIndex = idolMap.get(cell.id);
          sparseGrid.push([idolIndex, r, c]);
          placedIdols.add(idolIndex);
        }
      }
    }
  }

  // Optimize inventory representation
  const optimizedInventory = inventory.map((idol, index) => {
    const typeCode = getTypeCode(idol.type);
    const result = [index, typeCode, placedIdols.has(index) ? 1 : 0];

    if (idol.isUnique) {
      result.push(1);  // isUnique flag
      result.push(idol.uniqueName || idol.name);
      result.push(idol.uniqueModifiers?.map((m) => m.Mod) || []);
    } else {
      result.push(0);  // not unique
      const prefixIds = idol.prefixes?.filter((p) => p.id).map((p) => p.id) || [];
      const suffixIds = idol.suffixes?.filter((s) => s.id).map((s) => s.id) || [];
      result.push(prefixIds);
      result.push(suffixIds);
    }

    return result;
  });

  return {
    g: sparseGrid,
    v: optimizedInventory,
  };
};

const findModifierById = (id, modData, idolType) => {
  if (!modData || !id) return null;

  // Try to find in the specified idol type first
  if (idolType) {
    const normalizedType = idolType.charAt(0).toUpperCase() + idolType.slice(1).toLowerCase();

    if (modData.prefixes[normalizedType]) {
      const foundPrefix = modData.prefixes[normalizedType].find(
        (prefix) => prefix.id === id
      );
      if (foundPrefix) return { ...foundPrefix };
    }

    if (modData.suffixes[normalizedType]) {
      const foundSuffix = modData.suffixes[normalizedType].find(
        (suffix) => suffix.id === id
      );
      if (foundSuffix) return { ...foundSuffix };
    }
  }

  // If not found, search all types
  for (const type in modData.prefixes) {
    const foundPrefix = modData.prefixes[type].find(
      (prefix) => prefix.id === id
    );
    if (foundPrefix) return { ...foundPrefix };
  }

  for (const type in modData.suffixes) {
    const foundSuffix = modData.suffixes[type].find(
      (suffix) => suffix.id === id
    );
    if (foundSuffix) return { ...foundSuffix };
  }

  return null;
};

const generateIdolName = (type, prefixes, suffixes, isUnique) => {
  if (isUnique) return `Unique ${type} Idol`;

  let name = type;

  if (prefixes?.length > 0) {
    name = `${prefixes[0].Name} ${name}`;
  }

  if (suffixes?.length > 0) {
    name = `${name} ${suffixes[0].Name}`;
  }

  return name;
};

// Idol size lookup
const idolSizes = {
  Minor: { width: 1, height: 1 },
  Kamasan: { width: 1, height: 2 },
  Totemic: { width: 1, height: 3 },
  Noble: { width: 2, height: 1 },
  Conqueror: { width: 2, height: 2 },
  Burial: { width: 3, height: 1 }
};

const restoreFromOptimizedData = (optimizedData, modData) => {
  if (!optimizedData?.v || !optimizedData?.g) {
    return null;
  }

  // Restore inventory
  const inventory = optimizedData.v.map((idolData) => {
    const [index, typeCode, isPlaced, isUnique] = idolData;
    const type = getIdolTypeFromCode(typeCode);
    const idolId = `idol-${Date.now()}-${index}`;

    if (isUnique === 1) {
      const uniqueName = idolData[4];
      const uniqueMods = idolData[5] || [];

      return {
        id: idolId,
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
      const prefixIds = idolData[4] || [];
      const suffixIds = idolData[5] || [];

      const prefixes = prefixIds
        .map((id) => findModifierById(id, modData, type))
        .filter(Boolean);

      const suffixes = suffixIds
        .map((id) => findModifierById(id, modData, type))
        .filter(Boolean);

      const name = generateIdolName(type, prefixes, suffixes, false);

      return {
        id: idolId,
        type,
        name,
        isPlaced: isPlaced === 1,
        isUnique: false,
        prefixes,
        suffixes,
      };
    }
  });

  // Restore grid state
  const gridState = Array(7).fill().map(() => Array(6).fill(null));

  for (const [idolIndex, row, col] of optimizedData.g) {
    const idol = inventory[idolIndex];
    if (!idol) continue;

    const { width, height } = idolSizes[idol.type] || { width: 1, height: 1 };

    idol.isPlaced = true;

    // Fill all cells the idol occupies
    for (let r = row; r < row + height; r++) {
      for (let c = col; c < col + width; c++) {
        if (r < gridState.length && c < gridState[0].length) {
          gridState[r][c] = { ...idol, position: { row, col } };
        }
      }
    }
  }

  return { gridState, inventory };
};

// Sharing functionality
export const generateShareableURL = (gridState, inventory) => {
  try {
    const optimizedData = optimizeDataForSharing(gridState, inventory);
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
};

export const getSharedDataFromURL = (modData, shareParam = null) => {
  try {
    if (!shareParam) {
      const url = new URL(window.location.href);
      shareParam = url.searchParams.get('share');
      if (!shareParam) return null;
    }

    const compressed = base64ToUint8Array(shareParam);
    const json = pako.inflate(compressed, { to: 'string' });
    const optimizedData = JSON.parse(json);

    return restoreFromOptimizedData(optimizedData, modData);
  } catch (err) {
    console.error('Failed to extract shared data:', err);
    return null;
  }
};

export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error("Failed to copy to clipboard:", err);
    return false;
  }
};