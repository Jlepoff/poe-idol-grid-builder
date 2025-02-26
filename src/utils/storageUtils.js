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
 * Generate a shareable URL with the current grid and inventory
 */

export function generateShareableURL(gridState, inventory) {
  try {
    const shareData = { grid: gridState, inventory };
    const json = JSON.stringify(shareData);
    const compressed = pako.deflate(json);
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
    const shareData = JSON.parse(json);
    if (!shareData.grid || !shareData.inventory) {
      return null;
    }
    return {
      gridState: shareData.grid,
      inventory: shareData.inventory,
    };
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