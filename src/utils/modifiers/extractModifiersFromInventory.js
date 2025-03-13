// utils/modifiers/extractModifiersFromInventory.js

import { areModsEquivalent, determineModifierType } from "./modifierUtils";

export function extractModifiersFromInventory(inventory, modData) {
  if (!inventory || !modData) return [];

  // Filter out unique idols
  const nonUniqueIdols = inventory.filter(idol => !idol.isUnique);

  // Collection of extracted modifiers
  const extractedModifiers = [];

  // Process each non-unique idol
  nonUniqueIdols.forEach(idol => {
    const idolType = idol.type;

    // Process prefixes
    if (idol.prefixes && idol.prefixes.length > 0) {
      idol.prefixes.forEach(prefix => {
        // Try to match this prefix with a canonical one from modData
        const matchedPrefix = findCanonicalModifier(prefix, "prefix", idolType, modData);
        if (matchedPrefix) {
          extractedModifiers.push({
            ...matchedPrefix,
            type: "prefix",
            count: 1
          });
        }
      });
    }

    // Process suffixes
    if (idol.suffixes && idol.suffixes.length > 0) {
      idol.suffixes.forEach(suffix => {
        // Try to match this suffix with a canonical one from modData
        const matchedSuffix = findCanonicalModifier(suffix, "suffix", idolType, modData);
        if (matchedSuffix) {
          extractedModifiers.push({
            ...matchedSuffix,
            type: "suffix",
            count: 1
          });
        }
      });
    }
  });

  // Aggregate duplicate modifiers by ID and increment count
  const aggregatedModifiers = {};
  extractedModifiers.forEach(mod => {
    if (!aggregatedModifiers[mod.id]) {
      aggregatedModifiers[mod.id] = { ...mod };
    } else {
      aggregatedModifiers[mod.id].count++;
    }
  });

  return Object.values(aggregatedModifiers);
}

function findCanonicalModifier(userMod, modType, idolType, modData) {
  // Get the relevant modifier collection based on type
  const modCollection = modType === "prefix" ? modData.prefixes : modData.suffixes;

  // First try to find an exact match in the idol's type
  if (modCollection[idolType]) {
    const exactMatch = modCollection[idolType].find(mod =>
      mod.id === userMod.id || mod.Mod === userMod.Mod
    );
    if (exactMatch) return exactMatch;
  }

  // Try to find an equivalent mod using areModsEquivalent
  if (modCollection[idolType]) {
    const equivalentMatch = modCollection[idolType].find(mod =>
      areModsEquivalent(mod.Mod, userMod.Mod)
    );
    if (equivalentMatch) return equivalentMatch;
  }

  // If still not found, search across all idol types
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