// utils/idolGenerator.js

/**
 * Generate idol names with a consistent format based on idol type and modifiers
 * @param {string} idolType - The type of idol
 * @param {Array} prefixes - Array of prefix modifiers
 * @param {Array} suffixes - Array of suffix modifiers
 * @returns {string} - The formatted idol name
 */
const generateIdolName = (idolType, prefixes, suffixes) => {
  if (!idolType) return '';

  const parts = [];

  // Add first prefix
  if (prefixes.length > 0) {
    let prefixPart = prefixes[0].Name;
    if (prefixes[0].totalCount > 1) {
      prefixPart += ` (${prefixes[0].displayCount}/${prefixes[0].totalCount})`;
    }
    parts.push(prefixPart);
  }

  // Add idol type
  parts.push(idolType);

  // Add first suffix
  if (suffixes.length > 0) {
    let suffixPart = suffixes[0].Name;
    if (suffixes[0].totalCount > 1 && prefixes.length === 0) {
      suffixPart += ` (${suffixes[0].displayCount}/${suffixes[0].totalCount})`;
    }
    parts.push(suffixPart);
  }

  // Add secondary prefix
  if (prefixes.length > 1) {
    parts.push(`of ${prefixes[1].Name}`);
  }

  // Add secondary suffix
  if (suffixes.length > 1) {
    parts.push(`of ${suffixes[1].Name}`);
  }

  return parts.join(' ');
};

/**
 * Check if two modifiers are mutually exclusive
 * @param {Object} mod1 - First modifier to check
 * @param {Object} mod2 - Second modifier to check
 * @returns {boolean} - True if modifiers are mutually exclusive
 */
const areExclusiveModifiers = (mod1, mod2) => {
  // No conflict if either mod is missing or they have different names
  if (!mod1 || !mod2 || mod1.Name !== mod2.Name) return false;

  // Known exclusive modifier types
  const exclusiveModNames = [
    "Breach", "Domination", "Essence",
    "Harbinger", "Ambush", "Torment"
  ];

  // Skip check if not an exclusive modifier type
  if (!exclusiveModNames.includes(mod1.Name)) return false;

  // Mapping of modifier names to their exclusive text patterns
  const exclusivePatternsMap = {
    "Breach": [
      "Breaches in your Maps contain 3 additional Clasped Hands",
      "Breaches in your Maps contain 2 additional Clasped Hands"
    ],
    "Domination": [
      "Your Maps contain an additional Shrine",
      "Your Maps contain 2 additional Shrines"
    ],
    "Essence": [
      "Your Maps contain an additional Imprisoned Monster",
      "Your Maps contain 2 additional Imprisoned Monsters"
    ],
    "Harbinger": [
      "Your Maps contain an additional Harbinger",
      "Your Maps contain 2 additional Harbingers"
    ],
    "Ambush": [
      "Your Maps contain an additional Strongbox",
      "Your Maps contain 2 additional Strongboxes"
    ],
    "Torment": [
      "Your Maps are haunted by an additional Tormented Spirit",
      "Your Maps are haunted by 2 additional Tormented Spirits"
    ]
  };

  const patterns = exclusivePatternsMap[mod1.Name];
  if (!patterns) return false;

  // Check if both mods match patterns from the same set and are different
  const mod1MatchesPattern = patterns.includes(mod1.Mod);
  const mod2MatchesPattern = patterns.includes(mod2.Mod);

  return (mod1MatchesPattern && mod2MatchesPattern && mod1.Mod !== mod2.Mod);
};

/**
 * Generate a list of idols based on desired modifiers
 * @param {Array} desiredModifiers - List of modifiers to include
 * @param {Object} modData - Available modifiers data by idol type
 * @param {Array} idolTypes - List of available idol types
 * @returns {Array} - Generated list of idols
 */
export const generateIdols = (desiredModifiers, modData, idolTypes) => {
  if (!desiredModifiers?.length || !modData || !idolTypes?.length) {
    return [];
  }

  // Group modifiers by ID and track counts
  const modifierGroups = desiredModifiers.reduce((groups, mod) => {
    if (!groups[mod.id]) {
      groups[mod.id] = { ...mod, count: 1, originalCount: 1 };
    } else {
      groups[mod.id].count++;
      groups[mod.id].originalCount++;
    }
    return groups;
  }, {});

  const uniqueModifiers = Object.values(modifierGroups);
  const modifierUsage = uniqueModifiers.reduce((usage, mod) => {
    usage[mod.id] = 0;
    return usage;
  }, {});

  const idols = [];
  const typeCounts = idolTypes.reduce((counts, type) => {
    counts[type.name] = 0;
    return counts;
  }, {});

  // Check if two modifiers are compatible on the same idol
  const areModsCompatible = (mod1, mod2) => {
    return !areExclusiveModifiers(mod1, mod2);
  };

  /**
   * Determine the most appropriate idol type based on available modifiers
   * @param {Array} availablePrefixes - List of available prefix modifiers
   * @param {Array} availableSuffixes - List of available suffix modifiers
   * @returns {string|null} - The determined idol type or null if none found
   */
  const determineIdolType = (availablePrefixes, availableSuffixes) => {
    // Map modifiers to eligible types
    const prefixTypeSupport = new Map();
    const suffixTypeSupport = new Map();

    // Build maps of which types support each modifier
    for (const prefix of availablePrefixes) {
      const supportingTypes = [];
      for (const type of idolTypes) {
        if (modData.prefixes[type.name]?.some(p => p.id === prefix.id)) {
          supportingTypes.push(type.name);
        }
      }
      if (supportingTypes.length > 0) {
        prefixTypeSupport.set(prefix.id, supportingTypes);
      }
    }

    for (const suffix of availableSuffixes) {
      const supportingTypes = [];
      for (const type of idolTypes) {
        if (modData.suffixes[type.name]?.some(s => s.id === suffix.id)) {
          supportingTypes.push(type.name);
        }
      }
      if (supportingTypes.length > 0) {
        suffixTypeSupport.set(suffix.id, supportingTypes);
      }
    }

    // Define type pairs that commonly share modifiers and should be balanced
    const typePairs = [
      ["Burial", "Totemic"],
      ["Noble", "Kamasan"]
    ];

    // Map of pair types for quick lookups
    const typePairMap = new Map();
    for (const [type1, type2] of typePairs) {
      typePairMap.set(type1, type2);
      typePairMap.set(type2, type1);
    }

    // Find all eligible types that can support the required modifiers
    const eligibleTypes = idolTypes
      .filter(type => {
        const hasValidPrefix = availablePrefixes.length === 0 ||
          availablePrefixes.some(p =>
            prefixTypeSupport.get(p.id)?.includes(type.name)
          );

        const hasValidSuffix = availableSuffixes.length === 0 ||
          availableSuffixes.some(s =>
            suffixTypeSupport.get(s.id)?.includes(type.name)
          );

        return hasValidPrefix && hasValidSuffix;
      })
      .map(type => type.name);

    if (eligibleTypes.length === 0) {
      return null;
    }

    // Check if we have any paired types that share all the modifiers
    let pairedTypes = [];
    for (const [type1, type2] of typePairs) {
      if (eligibleTypes.includes(type1) && eligibleTypes.includes(type2)) {
        // Check if both types support all the modifiers
        const bothSupportAll = [...availablePrefixes, ...availableSuffixes].every(mod => {
          const supportingTypes = mod.type === 'prefix'
            ? prefixTypeSupport.get(mod.id)
            : suffixTypeSupport.get(mod.id);

          return supportingTypes?.includes(type1) && supportingTypes?.includes(type2);
        });

        if (bothSupportAll) {
          pairedTypes.push([type1, type2]);
        }
      }
    }

    // If we have paired types that share all mods, use balanced selection logic
    if (pairedTypes.length > 0) {
      // Use the first pair that shares all mods
      const [type1, type2] = pairedTypes[0];

      const type1Item = idolTypes.find(t => t.name === type1);
      const type2Item = idolTypes.find(t => t.name === type2);

      const type1Cells = type1Item.width * type1Item.height;
      const type2Cells = type2Item.width * type2Item.height;

      const type1Count = typeCounts[type1] || 0;
      const type2Count = typeCounts[type2] || 0;

      // Balance based on cell usage
      const type1CellsUsed = type1Count * type1Cells;
      const type2CellsUsed = type2Count * type2Cells;

      // Choose based on cell usage
      let chosenType;
      if (type1CellsUsed < type2CellsUsed) {
        chosenType = type1;
      } else if (type2CellsUsed < type1CellsUsed) {
        chosenType = type2;
      } else {
        // With equal cell usage, alternate between types on an empty grid
        if (type1Count === 0 && type2Count === 0) {
          // On an empty grid, choose the first type in the pair for the first idol,
          // then alternate for subsequent idols
          const totalIdols = Object.values(typeCounts).reduce((sum, count) => sum + count, 0);
          chosenType = totalIdols % 2 === 0 ? type1 : type2;
        } else {
          // Otherwise, choose the one with fewer idols
          if (type1Count <= type2Count) {
            chosenType = type1;
          } else {
            chosenType = type2;
          }
        }
      }

      return chosenType;
    }

    // If we get here, either there are no pairs or the pairs don't share all mods
    // Choose the type that can support all modifiers with the smallest grid footprint
    const sortedEligible = [...eligibleTypes].sort((a, b) => {
      const typeA = idolTypes.find(t => t.name === a);
      const typeB = idolTypes.find(t => t.name === b);
      return (typeA.width * typeA.height) - (typeB.width * typeB.height);
    });

    const chosenType = sortedEligible[0];
    return chosenType;
  };

  /**
   * Attempt to create an idol with maximum modifiers
   * @returns {boolean} - True if successful, false otherwise
   */
  const tryCreateFullIdol = () => {
    // Get available prefix and suffix mods
    const availablePrefixes = uniqueModifiers.filter(mod =>
      mod.type === "prefix" && modifierUsage[mod.id] < mod.count
    );

    const availableSuffixes = uniqueModifiers.filter(mod =>
      mod.type === "suffix" && modifierUsage[mod.id] < mod.count
    );

    // Skip if no mods available
    if (availablePrefixes.length === 0 && availableSuffixes.length === 0) {
      return false;
    }

    // Try to determine an idol type that can support the available prefixes and suffixes
    const idolType = determineIdolType(availablePrefixes, availableSuffixes);

    if (!idolType) {
      let createdIdol = false;

      // Try creating separate idols for each remaining prefix
      for (const prefix of availablePrefixes) {
        for (const type of idolTypes) {
          if (modData.prefixes[type.name]?.some(p => p.id === prefix.id)) {
            const idolId = `${Date.now()}-${Math.random()}`;
            const newIdol = {
              id: idolId,
              type: type.name,
              name: generateIdolName(type.name, [prefix], []),
              prefixes: [prefix],
              suffixes: [],
            };

            modifierUsage[prefix.id]++;
            typeCounts[type.name] = (typeCounts[type.name] || 0) + 1; // Update typeCounts
            idols.push(newIdol);
            createdIdol = true;
            break; // Move to the next prefix
          }
        }
      }

      // Try creating separate idols for each remaining suffix
      for (const suffix of availableSuffixes) {
        for (const type of idolTypes) {
          if (modData.suffixes[type.name]?.some(s => s.id === suffix.id)) {
            const idolId = `${Date.now()}-${Math.random()}`;
            const newIdol = {
              id: idolId,
              type: type.name,
              name: generateIdolName(type.name, [], [suffix]),
              prefixes: [],
              suffixes: [suffix],
            };

            modifierUsage[suffix.id]++;
            typeCounts[type.name] = (typeCounts[type.name] || 0) + 1; // Update typeCounts
            idols.push(newIdol);
            createdIdol = true;
            break; // Move to the next suffix
          }
        }
      }

      if (createdIdol) {
        return true;
      }

      return false;
    }

    // Get type-specific available modifiers
    const typeAvailablePrefixes = availablePrefixes.filter(mod =>
      modData.prefixes[idolType]?.some(p => p.id === mod.id)
    );

    const typeAvailableSuffixes = availableSuffixes.filter(mod =>
      modData.suffixes[idolType]?.some(s => s.id === mod.id)
    );

    // Select up to 2 compatible prefixes
    const selectedPrefixes = [];
    for (const prefix of typeAvailablePrefixes) {
      if (selectedPrefixes.length >= 2) break;

      // Check compatibility with already selected prefixes
      const isCompatible = selectedPrefixes.every(p => areModsCompatible(p, prefix));
      if (isCompatible) {
        selectedPrefixes.push(prefix);
      }
    }

    // Select up to 2 compatible suffixes
    const selectedSuffixes = [];
    for (const suffix of typeAvailableSuffixes) {
      if (selectedSuffixes.length >= 2) break;

      // Check compatibility with already selected suffixes and prefixes
      const isCompatibleWithSuffixes = selectedSuffixes.every(s => areModsCompatible(s, suffix));
      const isCompatibleWithPrefixes = selectedPrefixes.every(p => areModsCompatible(p, suffix));

      if (isCompatibleWithSuffixes && isCompatibleWithPrefixes) {
        selectedSuffixes.push(suffix);
      }
    }

    // Only create idol if we have at least one modifier
    if (selectedPrefixes.length + selectedSuffixes.length > 0) {
      const idolId = `${Date.now()}-${Math.random()}`;
      const newIdol = {
        id: idolId,
        type: idolType,
        name: generateIdolName(idolType, selectedPrefixes, selectedSuffixes),
        prefixes: selectedPrefixes,
        suffixes: selectedSuffixes,
      };

      // Mark included mods as used
      selectedPrefixes.forEach(prefix => {
        modifierUsage[prefix.id]++;
      });

      selectedSuffixes.forEach(suffix => {
        modifierUsage[suffix.id]++;
      });

      typeCounts[idolType] = (typeCounts[idolType] || 0) + 1; // Update typeCounts
      idols.push(newIdol);
      return true;
    }

    return false;
  };

  // Create as many idols as needed
  while (uniqueModifiers.some(mod => modifierUsage[mod.id] < mod.count)) {
    if (!tryCreateFullIdol()) {
      break;
    }
  }

  return idols;
};

/**
 * Generate idols and place them on the grid
 * @param {Array} desiredModifiers - List of modifiers to include
 * @param {Object} modData - Available modifiers data by idol type
 * @param {Array} idolTypes - List of available idol types
 * @param {Array} currentGrid - Current grid layout
 * @returns {Object} - Generated idols and grid state
 */
export const generateAndPlaceIdols = (
  desiredModifiers,
  modData,
  idolTypes,
  currentGrid
) => {
  if (!desiredModifiers?.length || !modData || !idolTypes?.length) {
    return { idols: [], placedIdols: [], grid: currentGrid || [] };
  }

  // Expand modifiers to account for counts
  const expandedModifiers = desiredModifiers.flatMap(mod => {
    const count = mod.count || 1;
    const { count: _, ...modWithoutCount } = mod;
    return Array(count).fill(modWithoutCount);
  });

  const generatedIdols = generateIdols(expandedModifiers, modData, idolTypes);

  return {
    idols: generatedIdols,
    placedIdols: [],
    grid: currentGrid,
  };
};