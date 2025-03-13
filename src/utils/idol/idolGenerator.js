// utils/idol/idolGenerator.js

const areExclusiveModifiers = (mod1, mod2) => {
  // First check if names match and are among the known exclusive modifier types
  if (!mod1 || !mod2 || mod1.Name !== mod2.Name) return false;

  const exclusiveModNames = ["Breach", "Domination", "Essence", "Harbinger", "Ambush", "Torment"];
  if (!exclusiveModNames.includes(mod1.Name)) return false;

  // Now check specific mod text patterns that should be exclusive
  const exactExclusivePairs = [
    {
      name: "Breach",
      patterns: [
        "Breaches in your Maps contain 3 additional Clasped Hands",
        "Breaches in your Maps contain 2 additional Clasped Hands"
      ]
    },
    {
      name: "Domination",
      patterns: [
        "Your Maps contain an additional Shrine",
        "Your Maps contain 2 additional Shrines"
      ]
    },
    {
      name: "Essence",
      patterns: [
        "Your Maps contain an additional Imprisoned Monster",
        "Your Maps contain 2 additional Imprisoned Monsters"
      ]
    },
    {
      name: "Harbinger",
      patterns: [
        "Your Maps contain an additional Harbinger",
        "Your Maps contain 2 additional Harbingers"
      ]
    },
    {
      name: "Ambush",
      patterns: [
        "Your Maps contain an additional Strongbox",
        "Your Maps contain 2 additional Strongboxes"
      ]
    },
    {
      name: "Torment",
      patterns: [
        "Your Maps are haunted by an additional Tormented Spirit",
        "Your Maps are haunted by 2 additional Tormented Spirits"
      ]
    }
  ];

  // Find the relevant pattern set for this modifier name
  const patternSet = exactExclusivePairs.find(set => set.name === mod1.Name);
  if (!patternSet) return false;

  // Check if both modifiers match patterns from the same set and are different from each other
  const mod1MatchesPattern = patternSet.patterns.includes(mod1.Mod);
  const mod2MatchesPattern = patternSet.patterns.includes(mod2.Mod);

  return (mod1MatchesPattern && mod2MatchesPattern && mod1.Mod !== mod2.Mod);
};

export const generateIdols = (desiredModifiers, modData, idolTypes) => {
  // Group by ID and track counts
  const modifierGroups = {};
  desiredModifiers.forEach((mod) => {
    if (!modifierGroups[mod.id]) {
      modifierGroups[mod.id] = { ...mod, count: 1, originalCount: 1 };
    } else {
      modifierGroups[mod.id].count++;
      modifierGroups[mod.id].originalCount++;
    }
  });

  const uniqueModifiers = Object.values(modifierGroups);
  const modifierUsage = {};
  uniqueModifiers.forEach((mod) => {
    modifierUsage[mod.id] = 0;
  });

  const idols = [];
  const typeCounts = {};
  idolTypes.forEach(type => {
    typeCounts[type.name] = 0;
  });

  // Check if two modifiers are exclusive and can't be on the same idol
  const areModsCompatible = (mod1, mod2) => {
    return !areExclusiveModifiers(mod1, mod2);
  };

  // Determine idol type based on available modifiers and distribution balance
  const determineIdolType = (availablePrefixes, availableSuffixes) => {
    // Define pairs of idol types that share modifiers
    const typePairs = [
      ["Burial", "Totemic"],
      ["Noble", "Kamasan"]
    ];

    // Check which types can support the selected modifiers
    const eligibleTypes = idolTypes.filter(type => {
      const hasValidPrefix = availablePrefixes.length === 0 ||
        availablePrefixes.some(p => modData.prefixes[type.name] &&
          modData.prefixes[type.name].some(tp => tp.id === p.id));
      const hasValidSuffix = availableSuffixes.length === 0 ||
        availableSuffixes.some(s => modData.suffixes[type.name] &&
          modData.suffixes[type.name].some(ts => ts.id === s.id));
      return hasValidPrefix && hasValidSuffix;
    }).map(type => type.name);

    if (eligibleTypes.length === 0) return null;

    // Check if we have a pair of compatible types
    for (const [type1, type2] of typePairs) {
      if (eligibleTypes.includes(type1) && eligibleTypes.includes(type2)) {
        // Calculate grid efficiency based on dimensions
        const type1Item = idolTypes.find(t => t.name === type1);
        const type2Item = idolTypes.find(t => t.name === type2);

        const type1Cells = type1Item.width * type1Item.height;
        const type2Cells = type2Item.width * type2Item.height;

        const type1Count = typeCounts[type1] || 0;
        const type2Count = typeCounts[type2] || 0;

        // Balance based on both count and cell usage
        const type1CellsUsed = type1Count * type1Cells;
        const type2CellsUsed = type2Count * type2Cells;

        // Choose the type with fewer cells used or the one with better cell-to-mod ratio
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

  // Try to create idols with maximum mods
  const tryCreateFullIdol = () => {
    // Get available prefix and suffix mods
    const availablePrefixes = uniqueModifiers.filter(mod =>
      mod.type === "prefix" && modifierUsage[mod.id] < mod.count
    );

    const availableSuffixes = uniqueModifiers.filter(mod =>
      mod.type === "suffix" && modifierUsage[mod.id] < mod.count
    );

    // Skip if we don't have enough mods
    if (availablePrefixes.length === 0 && availableSuffixes.length === 0) return false;

    // Determine optimal idol type
    const idolType = determineIdolType(availablePrefixes, availableSuffixes);
    if (!idolType) return false;

    // Get available prefix and suffix mods for this type
    const typeAvailablePrefixes = availablePrefixes.filter(mod =>
      modData.prefixes[idolType] &&
      modData.prefixes[idolType].some(p => p.id === mod.id)
    );

    const typeAvailableSuffixes = availableSuffixes.filter(mod =>
      modData.suffixes[idolType] &&
      modData.suffixes[idolType].some(s => s.id === mod.id)
    );

    // Select up to 2 prefixes that are compatible with each other
    const selectedPrefixes = [];
    for (const prefix of typeAvailablePrefixes) {
      if (selectedPrefixes.length >= 2) break;

      // Check if this prefix is compatible with already selected prefixes
      const isCompatible = selectedPrefixes.every(p => areModsCompatible(p, prefix));
      if (isCompatible) {
        selectedPrefixes.push(prefix);
      }
    }

    // Select up to 2 suffixes that are compatible with each other and with selected prefixes
    const selectedSuffixes = [];
    for (const suffix of typeAvailableSuffixes) {
      if (selectedSuffixes.length >= 2) break;

      // Check if this suffix is compatible with already selected suffixes and prefixes
      const isCompatibleWithSuffixes = selectedSuffixes.every(s => areModsCompatible(s, suffix));
      const isCompatibleWithPrefixes = selectedPrefixes.every(p => areModsCompatible(p, suffix));

      if (isCompatibleWithSuffixes && isCompatibleWithPrefixes) {
        selectedSuffixes.push(suffix);
      }
    }

    // Only create idol if we have at least one modifier
    if (selectedPrefixes.length + selectedSuffixes.length > 0) {
      const idolId = Date.now() + Math.random();
      const newIdol = {
        id: idolId,
        type: idolType,
        name: generateIdolName(idolType, selectedPrefixes, selectedSuffixes),
        prefixes: selectedPrefixes,
        suffixes: selectedSuffixes,
      };

      // Mark all included mods as used
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

function generateIdolName(idolType, prefixes, suffixes) {
  let name = "";

  if (prefixes.length > 0) {
    name = prefixes[0].Name;

    if (prefixes[0].totalCount > 1) {
      name += ` (${prefixes[0].displayCount}/${prefixes[0].totalCount})`;
    }
  }

  name += ` ${idolType}`;

  if (suffixes.length > 0) {
    name += ` ${suffixes[0].Name}`;

    if (suffixes[0].totalCount > 1 && prefixes.length === 0) {
      name += ` (${suffixes[0].displayCount}/${suffixes[0].totalCount})`;
    }
  }

  if (prefixes.length > 1) {
    name += ` of ${prefixes[1].Name}`;
  }

  if (suffixes.length > 1) {
    name += ` of ${suffixes[1].Name}`;
  }

  return name.trim();
}

export const generateAndPlaceIdols = (
  desiredModifiers,
  modData,
  idolTypes,
  currentGrid
) => {
  const expandedModifiers = [];
  desiredModifiers.forEach(mod => {
    const count = mod.count || 1;
    for (let i = 0; i < count; i++) {
      const { count: _, ...modWithoutCount } = mod;
      expandedModifiers.push(modWithoutCount);
    }
  });

  const generatedIdols = generateIdols(expandedModifiers, modData, idolTypes);

  return {
    idols: generatedIdols,
    placedIdols: [],
    grid: currentGrid,
  };
};