// utils/idolGenerator.js
// Generates idols based on desired modifiers

/**
 * Generate idol combinations based on desired modifiers
 *
 * @param {Array} desiredModifiers - List of desired modifiers selected by the user
 * @param {Object} modData - Available prefixes and suffixes for each idol type
 * @param {Array} idolTypes - Available idol types with dimensions
 * @returns {Array} - List of generated idols
 */
export const generateIdols = (desiredModifiers, modData, idolTypes) => {
  // Group modifiers by their unique Code
  const modifierGroups = {};

  desiredModifiers.forEach((mod) => {
    if (!modifierGroups[mod.Code]) {
      modifierGroups[mod.Code] = {
        ...mod,
        count: 1,
        originalCount: 1, // Track starting count
      };
    } else {
      modifierGroups[mod.Code].count++;
      modifierGroups[mod.Code].originalCount++;
    }
  });

  // Convert back to array but with counts
  const uniqueModifiers = Object.values(modifierGroups);

  // Track how many of each modifier we've used
  const modifierUsage = {};
  uniqueModifiers.forEach((mod) => {
    modifierUsage[mod.Code] = 0;
  });

  // Result array for generated idols
  const idols = [];

  // Create mapping of equivalent idol shapes for optimization
  const equivalentShapes = {
    Kamasan: "Noble", // 1x2 and 2x1
    Noble: "Kamasan",
    Totemic: "Burial", // 1x3 and 3x1
    Burial: "Totemic",
  };

  // Sort idol types by size (smallest first)
  const sortedIdolTypes = [...idolTypes].sort((a, b) => {
    return a.width * a.height - b.width * b.height;
  });

  // Check if we've used all requested modifiers
  const allModifiersUsed = () => {
    return uniqueModifiers.every((mod) => modifierUsage[mod.Code] >= mod.count);
  };

  // Get all idol types available for a modifier, considering equivalence
  const getAvailableIdolTypesGrouped = (modifier) => {
    const directTypes = getAvailableIdolTypes(modifier);
    const result = [...directTypes];

    // Group equivalent types together
    const groupedTypes = {};

    directTypes.forEach((typeName) => {
      const equivType = equivalentShapes[typeName];

      // Check if the equivalent type also supports this modifier
      if (equivType && directTypes.includes(equivType)) {
        const idolType1 = idolTypes.find((t) => t.name === typeName);
        const idolType2 = idolTypes.find((t) => t.name === equivType);

        // Create a key based on dimensions (e.g., "1x2" for both Kamasan and Noble)
        const sizeKey = `${Math.min(
          idolType1.width,
          idolType1.height
        )}x${Math.max(idolType1.width, idolType1.height)}`;

        if (!groupedTypes[sizeKey]) {
          groupedTypes[sizeKey] = {
            types: [typeName, equivType],
            width: idolType1.width,
            height: idolType1.height,
            size: idolType1.width * idolType1.height,
          };
        }
      } else {
        // If no equivalent or equivalent doesn't support it
        const idolType = idolTypes.find((t) => t.name === typeName);
        const sizeKey = `${idolType.width}x${idolType.height}`;

        if (!groupedTypes[sizeKey]) {
          groupedTypes[sizeKey] = {
            types: [typeName],
            width: idolType.width,
            height: idolType.height,
            size: idolType.width * idolType.height,
          };
        }
      }
    });

    return {
      allTypes: result,
      groupedBySize: Object.values(groupedTypes).sort(
        (a, b) => a.size - b.size
      ),
    };
  };

  // Get available modifiers for an idol type
  const getAvailableModifiers = (modType, idolTypeName) => {
    // Check equivalent type as well
    const equivType = equivalentShapes[idolTypeName];

    // Filter to modifiers that haven't reached count and are available
    return uniqueModifiers
      .filter((mod) => {
        // Check mod type
        if (mod.type !== modType || modifierUsage[mod.Code] >= mod.count) {
          return false;
        }

        // Check if this modifier is available for this idol type
        if (mod.type === "prefix") {
          // Check primary type
          const primaryCheck =
            modData.prefixes[idolTypeName] &&
            modData.prefixes[idolTypeName].some(
              (prefix) => prefix.Code === mod.Code
            );

          // Check equivalent type
          const equivCheck =
            equivType &&
            modData.prefixes[equivType] &&
            modData.prefixes[equivType].some(
              (prefix) => prefix.Code === mod.Code
            );

          return primaryCheck || equivCheck;
        } else {
          // Same for suffixes
          const primaryCheck =
            modData.suffixes[idolTypeName] &&
            modData.suffixes[idolTypeName].some(
              (suffix) => suffix.Code === mod.Code
            );

          const equivCheck =
            equivType &&
            modData.suffixes[equivType] &&
            modData.suffixes[equivType].some(
              (suffix) => suffix.Code === mod.Code
            );

          return primaryCheck || equivCheck;
        }
      })
      .map((mod) => ({
        ...mod,
        originalCode: mod.Code, // Keep original code for tracking
        displayCount: modifierUsage[mod.Code] + 1, // For naming (e.g., "Alva's (2 of 4)")
        totalCount: mod.originalCount, // Total instances of this modifier
      }));
  };

  // Get all idol types that can have a specific modifier
  const getAvailableIdolTypes = (modifier) => {
    const availableTypes = [];

    if (modifier.type === "prefix") {
      // Check which idol types can have this prefix
      for (const [typeName, prefixes] of Object.entries(modData.prefixes)) {
        if (prefixes.some((prefix) => prefix.Code === modifier.Code)) {
          availableTypes.push(typeName);
        }
      }
    } else {
      // Check which idol types can have this suffix
      for (const [typeName, suffixes] of Object.entries(modData.suffixes)) {
        if (suffixes.some((suffix) => suffix.Code === modifier.Code)) {
          availableTypes.push(typeName);
        }
      }
    }

    return availableTypes;
  };

  // Create idols to satisfy all desired modifiers
  const unusedModifiers = [...uniqueModifiers];

  while (unusedModifiers.length > 0 && !allModifiersUsed()) {
    // Process one modifier at a time
    const currentModifier = unusedModifiers[0];

    // Skip if we've used all instances
    if (modifierUsage[currentModifier.Code] >= currentModifier.count) {
      unusedModifiers.shift();
      continue;
    }

    // Find available idol types for this modifier
    const { allTypes, groupedBySize } =
      getAvailableIdolTypesGrouped(currentModifier);

    // Skip if no suitable types found
    if (allTypes.length === 0) {
      unusedModifiers.shift();
      continue;
    }

    // Try to create an idol with this modifier
    let idolCreated = false;

    // Try each size group (smallest first)
    for (const sizeGroup of groupedBySize) {
      // Try each type in the group
      for (const idolTypeName of sizeGroup.types) {
        const idolType = idolTypes.find((t) => t.name === idolTypeName);
        if (!idolType) continue;

        // Get available modifiers for this type
        const availablePrefixes = getAvailableModifiers("prefix", idolTypeName);
        const availableSuffixes = getAvailableModifiers("suffix", idolTypeName);

        // Build the idol with selected mods
        let selectedPrefixes = [];
        let selectedSuffixes = [];

        if (currentModifier.type === "prefix") {
          // Ensure current prefix is included
          const prefix = availablePrefixes.find(
            (p) => p.Code === currentModifier.Code
          );
          if (prefix) {
            selectedPrefixes.push(prefix);

            // Try to add a second prefix
            const otherPrefixes = availablePrefixes.filter(
              (p) => p.Code !== currentModifier.Code
            );
            if (otherPrefixes.length > 0) {
              selectedPrefixes.push(otherPrefixes[0]);
            }
          }

          // Add suffixes if available
          if (availableSuffixes.length > 0) {
            selectedSuffixes = availableSuffixes.slice(0, 2);
          }
        } else {
          // Ensure current suffix is included
          const suffix = availableSuffixes.find(
            (s) => s.Code === currentModifier.Code
          );
          if (suffix) {
            selectedSuffixes.push(suffix);

            // Try to add a second suffix
            const otherSuffixes = availableSuffixes.filter(
              (s) => s.Code !== currentModifier.Code
            );
            if (otherSuffixes.length > 0) {
              selectedSuffixes.push(otherSuffixes[0]);
            }
          }

          // Add prefixes if available
          if (availablePrefixes.length > 0) {
            selectedPrefixes = availablePrefixes.slice(0, 2);
          }
        }

        // If we included our target modifier, create the idol
        if (
          (currentModifier.type === "prefix" &&
            selectedPrefixes.some((p) => p.Code === currentModifier.Code)) ||
          (currentModifier.type === "suffix" &&
            selectedSuffixes.some((s) => s.Code === currentModifier.Code))
        ) {
          // Create idol with descriptive name
          const newIdol = {
            type: idolType.name,
            name: generateIdolNameWithDuplicates(
              idolType.name,
              selectedPrefixes,
              selectedSuffixes
            ),
            prefixes: selectedPrefixes,
            suffixes: selectedSuffixes,
            id: Date.now() + Math.random(),
          };

          // Update usage counters
          selectedPrefixes.forEach((prefix) => {
            modifierUsage[prefix.originalCode]++;
          });

          selectedSuffixes.forEach((suffix) => {
            modifierUsage[suffix.originalCode]++;
          });

          idols.push(newIdol);
          idolCreated = true;
          break; // Found a type that works
        }
      }

      if (idolCreated) break; // Found a size group that works
    }

    // If we couldn't create an idol for this modifier, skip it
    if (!idolCreated) {
      unusedModifiers.shift();
    }

    // If we've used all instances of this modifier, move to next
    if (modifierUsage[currentModifier.Code] >= currentModifier.count) {
      unusedModifiers.shift();
    }
  }

  return idols;
};

/**
 * Generate a descriptive name for the idol based on its modifiers
 * Handles duplicate modifiers by adding count
 */
function generateIdolNameWithDuplicates(idolType, prefixes, suffixes) {
  let name = "";

  // Add prefix name
  if (prefixes.length > 0) {
    name = prefixes[0].Name;

    // If this is part of a duplicate set, note it
    if (prefixes[0].totalCount > 1) {
      name += ` (${prefixes[0].displayCount}/${prefixes[0].totalCount})`;
    }
  }

  // Add idol type
  name += ` ${idolType}`;

  // Add suffix name
  if (suffixes.length > 0) {
    name += ` ${suffixes[0].Name}`;

    // Only add suffix count if no prefix (avoid too-long names)
    if (suffixes[0].totalCount > 1 && prefixes.length === 0) {
      name += ` (${suffixes[0].displayCount}/${suffixes[0].totalCount})`;
    }
  }

  return name.trim();
}

/**
 * Generate a basic idol name without duplicate counts
 */
function generateIdolName(idolType, prefixes, suffixes) {
  let name = "";

  if (prefixes.length > 0) {
    name = prefixes[0].Name;
  }

  name += ` ${idolType}`;

  if (suffixes.length > 0) {
    name += ` ${suffixes[0].Name}`;
  }

  return name.trim();
}

/**
 * Generate and place idols on the grid
 *
 * @param {Array} desiredModifiers - List of desired modifiers selected by the user
 * @param {Object} modData - Available prefixes and suffixes
 * @param {Array} idolTypes - Available idol types with dimensions
 * @param {Array} currentGrid - Current grid state
 * @returns {Object} - Generated idols and updated grid
 */
export const generateAndPlaceIdols = (
  desiredModifiers,
  modData,
  idolTypes,
  currentGrid
) => {
  // Generate idols based on desired modifiers
  const generatedIdols = generateIdols(desiredModifiers, modData, idolTypes);

  // Clone the current grid
  const newGrid = currentGrid.map((row) => [...row]);

  // Track idols we successfully place
  const placedIdols = [];

  // Try to place each idol
  for (const idol of generatedIdols) {
    const idolType = idolTypes.find((type) => type.name === idol.type);
    if (!idolType) continue;

    const { width, height } = idolType;

    // Find a valid position
    let placed = false;

    // Try each possible position
    for (let row = 0; row < newGrid.length && !placed; row++) {
      for (let col = 0; col < newGrid[0].length && !placed; col++) {
        // Check if the idol can be placed here
        if (canPlaceIdol(newGrid, row, col, width, height)) {
          // Place the idol
          for (let r = row; r < row + height; r++) {
            for (let c = col; c < col + width; c++) {
              newGrid[r][c] = { ...idol, position: { row, col } };
            }
          }

          // Mark as placed
          placedIdols.push({ ...idol, position: { row, col } });
          placed = true;
        }
      }
    }
  }

  return {
    idols: generatedIdols,
    placedIdols,
    grid: newGrid,
  };
};

/**
 * Check if an idol can be placed at the given position
 */
function canPlaceIdol(grid, row, col, width, height) {
  // Check grid bounds
  if (row + height > grid.length || col + width > grid[0].length) {
    return false;
  }

  // Check for blocked cells and overlaps
  for (let r = row; r < row + height; r++) {
    for (let c = col; c < col + width; c++) {
      // Check for blocked cells
      if (
        (r === 0 && c === 0) || // Top-left corner
        (r === 2 && (c === 1 || c === 4)) || // Row 3 blocked cells
        (r === 3 && (c === 1 || c === 2 || c === 3 || c === 4)) || // Row 4 blocked cells
        (r === 4 && (c === 1 || c === 4)) || // Row 5 blocked cells
        (r === 6 && c === 5) // Bottom-right corner
      ) {
        return false;
      }

      // Check for overlaps
      if (grid[r][c] !== null) {
        return false;
      }
    }
  }

  return true;
}
