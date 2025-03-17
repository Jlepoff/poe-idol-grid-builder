// utils/modifiers/extractModifiersFromInventory.js

import { areModsEquivalent, determineModifierType } from "./modifierUtils";

/**
 * Extracts and aggregates modifiers from inventory items
 * @param {Array} inventory - Array of idol items
 * @param {Object} modData - Object containing prefix and suffix data
 * @returns {Array} - Array of aggregated modifiers with counts
 */
export function extractModifiersFromInventory(inventory, modData) {
  // Early return if data is missing
  if (!inventory?.length || !modData) return [];

  // Filter out unique idols
  const nonUniqueIdols = inventory.filter(idol => !idol.isUnique);

  // Create a map for faster aggregation
  const modifierMap = new Map();

  // Process each non-unique idol
  nonUniqueIdols.forEach(idol => {
    const idolType = idol.type;

    // Process prefixes
    processModifiers(idol.prefixes, "prefix", idolType, modData, modifierMap);

    // Process suffixes
    processModifiers(idol.suffixes, "suffix", idolType, modData, modifierMap);
  });

  // Convert map to array
  return Array.from(modifierMap.values());
}

/**
 * Process a list of modifiers, find canonical versions, and add to the map
 * @param {Array} modifiers - Array of prefix or suffix modifiers
 * @param {string} modType - Type of modifier ("prefix" or "suffix")
 * @param {string} idolType - Type of idol
 * @param {Object} modData - Modifier data object
 * @param {Map} modifierMap - Map to store and aggregate modifiers
 */
function processModifiers(modifiers, modType, idolType, modData, modifierMap) {
  if (!modifiers?.length) return;

  modifiers.forEach(modifier => {
    // Find canonical modifier
    const canonicalMod = findCanonicalModifier(modifier, modType, idolType, modData);

    if (canonicalMod) {
      const modWithType = {
        ...canonicalMod,
        type: modType
      };

      // Use id as key for aggregation
      const key = modWithType.id;

      if (modifierMap.has(key)) {
        // Increment count if modifier exists
        const existingMod = modifierMap.get(key);
        existingMod.count++;
      } else {
        // Add new modifier with count 1
        modifierMap.set(key, { ...modWithType, count: 1 });
      }
    }
  });
}

/**
 * Find the canonical version of a modifier from modData
 * @param {Object} userMod - User's modifier object
 * @param {string} modType - Type of modifier ("prefix" or "suffix")
 * @param {string} idolType - Type of idol
 * @param {Object} modData - Modifier data object
 * @returns {Object|null} - Canonical modifier or null if not found
 */
function findCanonicalModifier(userMod, modType, idolType, modData) {
  // Early return if userMod is not valid
  if (!userMod || !userMod.Mod) return null;

  // Get the relevant modifier collection based on type
  const modCollection = modType === "prefix" ? modData.prefixes : modData.suffixes;

  // Skip if collection doesn't exist
  if (!modCollection) return null;

  // First try to find by exact id or text match in the idol's type
  if (modCollection[idolType]) {
    const exactMatch = modCollection[idolType].find(mod =>
      mod.id === userMod.id || mod.Mod === userMod.Mod
    );
    if (exactMatch) return exactMatch;

    // Try to find an equivalent mod using areModsEquivalent
    const equivalentMatch = modCollection[idolType].find(mod =>
      areModsEquivalent(mod.Mod, userMod.Mod)
    );
    if (equivalentMatch) return equivalentMatch;
  }

  // Search across all idol types if not found in specific type
  for (const type in modCollection) {
    const typeMatch = modCollection[type].find(mod =>
      areModsEquivalent(mod.Mod, userMod.Mod)
    );
    if (typeMatch) return typeMatch;
  }

  // If no match found, create a standardized version based on the user mod
  const modifierType = determineModifierType(userMod.Mod);
  return {
    ...userMod,
    type: modifierType,
    id: userMod.id || `generated-${Date.now()}-${Math.random()}`
  };
}