// utils/storage/storageUtils.js
import pako from "pako";

const STORAGE_KEYS = {
  GRID_STATE: "poe-idol-grid",
  INVENTORY: "poe-idol-inventory",
};

function uint8ToBase64(uint8Array) {
  let binary = "";
  for (let i = 0; i < uint8Array.length; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
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

export function saveGridState(gridState) {
  try {
    localStorage.setItem(STORAGE_KEYS.GRID_STATE, JSON.stringify(gridState));
  } catch (err) {
    console.error("Failed to save grid:", err);
  }
}

export function saveInventory(inventory) {
  try {
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));
  } catch (err) {
    console.error("Failed to save inventory:", err);
  }
}

export function loadGridState() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.GRID_STATE);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error("Failed to load grid:", err);
    return null;
  }
}

export function loadInventory() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.INVENTORY);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error("Failed to load inventory:", err);
    return null;
  }
}

export function clearSavedData() {
  try {
    localStorage.removeItem(STORAGE_KEYS.GRID_STATE);
    localStorage.removeItem(STORAGE_KEYS.INVENTORY);
  } catch (err) {
    console.error("Failed to clear data:", err);
  }
}

function getTypeCode(idolType) {
  switch (idolType) {
    case "Minor": return "m";
    case "Kamasan": return "k";
    case "Totemic": return "t";
    case "Noble": return "n";
    case "Conqueror": return "c";
    case "Burial": return "b";
    default: return "x";
  }
}

function getIdolTypeFromCode(code) {
  switch (code) {
    case "m": return "Minor";
    case "k": return "Kamasan";
    case "t": return "Totemic";
    case "n": return "Noble";
    case "c": return "Conqueror";
    case "b": return "Burial";
    default: return "Unknown";
  }
}

function optimizeDataForSharing(gridState, inventory) {
  const idolMap = new Map();
  inventory.forEach((idol, index) => {
    idolMap.set(idol.id, index);
  });

  const sparseGrid = [];
  const placedIdols = new Set();

  for (let r = 0; r < gridState.length; r++) {
    for (let c = 0; c < gridState[r].length; c++) {
      // utils/storage/storageUtils.js (continued)
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

  const optimizedInventory = inventory.map((idol, index) => {
    const typeCode = getTypeCode(idol.type);
    const result = [index, typeCode, placedIdols.has(index) ? 1 : 0];

    if (idol.isUnique) {
      result.push(1);
      result.push(idol.uniqueName || idol.name);
      result.push(idol.uniqueModifiers?.map((m) => m.Mod) || []);
    } else {
      result.push(0);
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
}

function findModifierById(id, modData, idolType) {
  if (!modData || !id) return null;

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
}

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

function restoreFromOptimizedData(optimizedData, modData) {
  if (!optimizedData || !optimizedData.v || !optimizedData.g) {
    return null;
  }

  const inventory = optimizedData.v.map((idolData) => {
    const [index, typeCode, isPlaced, isUnique] = idolData;
    const type = getIdolTypeFromCode(typeCode);

    if (isUnique === 1) {
      const uniqueName = idolData[4];
      const uniqueMods = idolData[5] || [];

      return {
        id: `idol-${Date.now()}-${index}`,
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
        .filter((m) => m !== null);

      const suffixes = suffixIds
        .map((id) => findModifierById(id, modData, type))
        .filter((m) => m !== null);

      const name = generateIdolName(type, prefixes, suffixes, false);

      return {
        id: `idol-${Date.now()}-${index}`,
        type,
        name,
        isPlaced: isPlaced === 1,
        isUnique: false,
        prefixes,
        suffixes,
      };
    }
  });

  const gridState = Array(7).fill().map(() => Array(6).fill(null));

  for (const placement of optimizedData.g) {
    const [idolIndex, row, col] = placement;
    const idol = inventory[idolIndex];
    if (!idol) continue;

    let width = 1, height = 1;
    switch (idol.type) {
      case "Minor": width = 1; height = 1; break;
      case "Kamasan": width = 1; height = 2; break;
      case "Totemic": width = 1; height = 3; break;
      case "Noble": width = 2; height = 1; break;
      case "Conqueror": width = 2; height = 2; break;
      case "Burial": width = 3; height = 1; break;
      default: width = 1; height = 1; break;
    }

    idol.isPlaced = true;

    for (let r = row; r < row + height; r++) {
      for (let c = col; c < col + width; c++) {
        if (r < gridState.length && c < gridState[0].length) {
          gridState[r][c] = { ...idol, position: { row, col } };
        }
      }
    }
  }

  return { gridState, inventory };
}

export function generateShareableURL(gridState, inventory) {
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
}

export function getSharedDataFromURL(modData, shareParam = null) {
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
}

export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error("Failed to copy to clipboard:", err);
    return false;
  }
}