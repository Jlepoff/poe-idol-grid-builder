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
    // Pairs of idol types that commonly share modifiers
    const typePairs = [
      ["Burial", "Totemic"],
      ["Noble", "Kamasan"]
    ];

    // Find eligible types that support the selected modifiers
    const eligibleTypes = idolTypes
      .filter(type => {
        const hasValidPrefix = availablePrefixes.length === 0 ||
          availablePrefixes.some(p => {
            return modData.prefixes[type.name]?.some(tp => tp.id === p.id);
          });

        const hasValidSuffix = availableSuffixes.length === 0 ||
          availableSuffixes.some(s => {
            return modData.suffixes[type.name]?.some(ts => ts.id === s.id);
          });

        return hasValidPrefix && hasValidSuffix;
      })
      .map(type => type.name);

    if (eligibleTypes.length === 0) return null;

    // Check for compatible type pairs
    for (const [type1, type2] of typePairs) {
      if (eligibleTypes.includes(type1) && eligibleTypes.includes(type2)) {
        const type1Item = idolTypes.find(t => t.name === type1);
        const type2Item = idolTypes.find(t => t.name === type2);

        const type1Cells = type1Item.width * type1Item.height;
        const type2Cells = type2Item.width * type2Item.height;

        const type1Count = typeCounts[type1] || 0;
        const type2Count = typeCounts[type2] || 0;

        // Balance based on cell usage
        const type1CellsUsed = type1Count * type1Cells;
        const type2CellsUsed = type2Count * type2Cells;

        // Choose type with fewer cells used
        if (type1CellsUsed <= type2CellsUsed) {
          typeCounts[type1] = (typeCounts[type1] || 0) + 1;
          return type1;
        } else {
          typeCounts[type2] = (typeCounts[type2] || 0) + 1;
          return type2;
        }
      }
    }

    // If no pairs, choose smallest available type for efficiency
    const sortedEligible = [...eligibleTypes].sort((a, b) => {
      const typeA = idolTypes.find(t => t.name === a);
      const typeB = idolTypes.find(t => t.name === b);
      return (typeA.width * typeA.height) - (typeB.width * typeB.height);
    });

    typeCounts[sortedEligible[0]] = (typeCounts[sortedEligible[0]] || 0) + 1;
    return sortedEligible[0];
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
    if (availablePrefixes.length === 0 && availableSuffixes.length === 0) return false;

    // Handle the case of a single prefix modifier
    if (availablePrefixes.length === 1 && availableSuffixes.length === 0) {
      const prefix = availablePrefixes[0];

      // Find idol types that support this prefix
      const supportingTypes = idolTypes
        .filter(type =>
          modData.prefixes[type.name]?.some(p => p.id === prefix.id)
        )
        .map(type => type.name);

      if (supportingTypes.length > 0) {
        // Choose smallest supporting idol type
        const chosenType = supportingTypes.sort((a, b) => {
          const typeA = idolTypes.find(t => t.name === a);
          const typeB = idolTypes.find(t => t.name === b);
          return (typeA.width * typeA.height) - (typeB.width * typeB.height);
        })[0];

        // Create the idol with just this prefix
        const idolId = `${Date.now()}-${Math.random()}`;
        const newIdol = {
          id: idolId,
          type: chosenType,
          name: generateIdolName(chosenType, [prefix], []),
          prefixes: [prefix],
          suffixes: [],
        };

        modifierUsage[prefix.id]++;
        idols.push(newIdol);
        return true;
      }
    }

    // Handle the case of a single suffix modifier
    if (availablePrefixes.length === 0 && availableSuffixes.length === 1) {
      const suffix = availableSuffixes[0];

      // Find idol types that support this suffix
      const supportingTypes = idolTypes
        .filter(type =>
          modData.suffixes[type.name]?.some(s => s.id === suffix.id)
        )
        .map(type => type.name);

      if (supportingTypes.length > 0) {
        // Choose smallest supporting idol type
        const chosenType = supportingTypes.sort((a, b) => {
          const typeA = idolTypes.find(t => t.name === a);
          const typeB = idolTypes.find(t => t.name === b);
          return (typeA.width * typeA.height) - (typeB.width * typeB.height);
        })[0];

        // Create the idol with just this suffix
        const idolId = `${Date.now()}-${Math.random()}`;
        const newIdol = {
          id: idolId,
          type: chosenType,
          name: generateIdolName(chosenType, [], [suffix]),
          prefixes: [],
          suffixes: [suffix],
        };

        modifierUsage[suffix.id]++;
        idols.push(newIdol);
        return true;
      }
    }

    // Try to determine an idol type that can support both prefixes and suffixes
    const idolType = determineIdolType(availablePrefixes, availableSuffixes);
    if (!idolType) {
      // If no compatible type found, try creating separate idols for each modifier
      if (availablePrefixes.length > 0) {
        const prefix = availablePrefixes[0];
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
            idols.push(newIdol);
            return true;
          }
        }
      }

      if (availableSuffixes.length > 0) {
        const suffix = availableSuffixes[0];
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
            idols.push(newIdol);
            return true;
          }
        }
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

      idols.push(newIdol);
      return true;
    }

    return false;
  };

  // Create as many idols as needed
  while (uniqueModifiers.some(mod => modifierUsage[mod.id] < mod.count)) {
    if (!tryCreateFullIdol()) break;
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