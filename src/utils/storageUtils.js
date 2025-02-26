// utils/storageUtils.js

// Storage keys for localStorage
const STORAGE_KEYS = {
  GRID_STATE: 'poe-idol-grid',
  INVENTORY: 'poe-idol-inventory'
};

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
    // Create data object
    const shareData = { grid: gridState, inventory };
    
    // Serialize and compress
    const encoded = btoa(encodeURIComponent(JSON.stringify(shareData)));
    
    // Create URL with encoded data
    const url = new URL(window.location.href);
    url.searchParams.set('share', encoded);
    
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
    
    // Decode and deserialize
    const shareData = JSON.parse(decodeURIComponent(atob(shareParam)));
    
    // Basic validation
    if (!shareData.grid || !shareData.inventory) {
      return null;
    }
    
    return {
      gridState: shareData.grid,
      inventory: shareData.inventory
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