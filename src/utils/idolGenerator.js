// utils/idolGenerator.js
// Generates idols based on desired modifiers

/**
 * Generate idol combinations based on desired modifiers with balanced type distribution
 *
 * @param {Array} desiredModifiers - List of desired modifiers selected by the user
 * @param {Object} modData - Available prefixes and suffixes for each idol type
 * @param {Array} idolTypes - Available idol types with dimensions
 * @returns {Array} - List of generated idols
 */
export const generateIdols = (desiredModifiers, modData, idolTypes) => {
  // Group modifiers by their unique Code to handle duplicates properly
  const modifierGroups = {};

  // Count each unique modifier by its Code
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

  // Convert back to array of unique modifiers with counts
  const uniqueModifiers = Object.values(modifierGroups);

  // Track usage of each modifier to ensure we satisfy all requests
  const modifierUsage = {};
  uniqueModifiers.forEach((mod) => {
    modifierUsage[mod.Code] = 0;
  });

  // Result array for generated idols
  const idols = [];

  // Helper function to get available idol types for a modifier
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

  // For high-volume modifiers, we need to distribute them across idol types
  const distributeModifiersAcrossTypes = (modifier, count) => {
    const availableTypes = getAvailableIdolTypes(modifier);
    const distribution = {};

    availableTypes.forEach(type => {
      distribution[type] = 0;
    });

    // Special handling for high volume of same modifier
    if (count > 5) {
      // For Kamasan (1x2) and Noble (2x1)
      const hasKamasan = availableTypes.includes("Kamasan");
      const hasNoble = availableTypes.includes("Noble");

      // For Totemic (1x3) and Burial (3x1)
      const hasTotemic = availableTypes.includes("Totemic");
      const hasBurial = availableTypes.includes("Burial");

      if (hasKamasan && hasNoble) {
        const perType = Math.floor(count / 2);
        distribution["Kamasan"] = perType;
        distribution["Noble"] = count - perType;
      }
      else if (hasTotemic && hasBurial) {
        // Split evenly between Totemic and Burial
        const perType = Math.floor(count / 2);
        distribution["Totemic"] = perType;
        distribution["Burial"] = count - perType;
      }
      else {
        // Evenly distribute across all available types
        const typesCount = availableTypes.length;
        const perType = Math.floor(count / typesCount);

        availableTypes.forEach(type => {
          distribution[type] = perType;
        });

        // Distribute remainder
        let remainder = count - (perType * typesCount);
        let i = 0;
        while (remainder > 0) {
          distribution[availableTypes[i % availableTypes.length]]++;
          remainder--;
          i++;
        }
      }
    } else {
      // For small counts, just distribute sequentially
      for (let i = 0; i < count; i++) {
        distribution[availableTypes[i % availableTypes.length]]++;
      }
    }

    return { distribution, availableTypes };
  };

  // Get available modifiers for an idol type
  const getAvailableModifiers = (modType, idolTypeName, usedModifiers = []) => {
    // Filter to modifiers that haven't reached count and are available
    return uniqueModifiers
      .filter((mod) => {
        // Skip if not the requested type or already used enough times
        if (mod.type !== modType || modifierUsage[mod.Code] >= mod.count) {
          return false;
        }

        // Skip if this modifier is already used in this idol
        if (usedModifiers.includes(mod.Code)) {
          return false;
        }

        // Check if this modifier is available for this idol type
        if (mod.type === "prefix") {
          return modData.prefixes[idolTypeName] &&
            modData.prefixes[idolTypeName].some(
              (prefix) => prefix.Code === mod.Code
            );
        } else {
          return modData.suffixes[idolTypeName] &&
            modData.suffixes[idolTypeName].some(
              (suffix) => suffix.Code === mod.Code
            );
        }
      })
      .map((mod) => ({
        ...mod,
        originalCode: mod.Code, // Keep original code for tracking
        displayCount: modifierUsage[mod.Code] + 1, // For naming (e.g., "Alva's (2 of 4)")
        totalCount: mod.originalCount, // Total instances of this modifier
      }));
  };

  // Process modifiers one by one
  for (const modifier of uniqueModifiers) {
    // Skip if we've already used all instances of this modifier
    if (modifierUsage[modifier.Code] >= modifier.count) {
      continue;
    }

    // Get target distribution for this modifier
    const { distribution, availableTypes } = distributeModifiersAcrossTypes(
      modifier,
      modifier.count
    );

    // Track how many we've created for each type
    const createdPerType = {};
    availableTypes.forEach(type => {
      createdPerType[type] = 0;
    });

    // Create idols according to this distribution
    for (const idolTypeName of availableTypes) {
      // Skip if we don't need any idols of this type
      if (distribution[idolTypeName] <= 0) {
        continue;
      }

      // Find the idol type
      const idolType = idolTypes.find(t => t.name === idolTypeName);
      if (!idolType) continue;

      // Create the specified number of idols of this type
      for (let i = 0; i < distribution[idolTypeName]; i++) {
        // Skip if we've already used all instances of this modifier
        if (modifierUsage[modifier.Code] >= modifier.count) {
          break;
        }

        // Get available modifiers for this idol type
        const usedModifiers = []; // Track which modifiers we use in this idol
        let selectedPrefixes = [];
        let selectedSuffixes = [];

        // If current modifier is a prefix, make sure to include it
        if (modifier.type === "prefix") {
          const currentPrefix = getAvailableModifiers("prefix", idolTypeName).find(
            p => p.Code === modifier.Code
          );

          if (currentPrefix) {
            selectedPrefixes.push(currentPrefix);
            usedModifiers.push(currentPrefix.Code);

            // Try to add a second prefix
            const otherPrefixes = getAvailableModifiers("prefix", idolTypeName, usedModifiers);
            if (otherPrefixes.length > 0) {
              selectedPrefixes.push(otherPrefixes[0]);
              usedModifiers.push(otherPrefixes[0].Code);
            }

            // Add suffixes if available
            const availableSuffixes = getAvailableModifiers("suffix", idolTypeName, usedModifiers);
            selectedSuffixes = availableSuffixes.slice(0, 2); // Add up to 2 suffixes
            selectedSuffixes.forEach(suffix => usedModifiers.push(suffix.Code));
          }
        } else {
          // Current modifier is a suffix
          const currentSuffix = getAvailableModifiers("suffix", idolTypeName).find(
            s => s.Code === modifier.Code
          );

          if (currentSuffix) {
            selectedSuffixes.push(currentSuffix);
            usedModifiers.push(currentSuffix.Code);

            // Try to add a second suffix
            const otherSuffixes = getAvailableModifiers("suffix", idolTypeName, usedModifiers);
            if (otherSuffixes.length > 0) {
              selectedSuffixes.push(otherSuffixes[0]);
              usedModifiers.push(otherSuffixes[0].Code);
            }

            // Add prefixes if available
            const availablePrefixes = getAvailableModifiers("prefix", idolTypeName, usedModifiers);
            selectedPrefixes = availablePrefixes.slice(0, 2); // Add up to 2 prefixes
            selectedPrefixes.forEach(prefix => usedModifiers.push(prefix.Code));
          }
        }

        // Create idol if we were able to include the target modifier
        if ((modifier.type === "prefix" && selectedPrefixes.some(p => p.Code === modifier.Code)) ||
          (modifier.type === "suffix" && selectedSuffixes.some(s => s.Code === modifier.Code))) {

          // Create unique ID for idol
          const idolId = Date.now() + Math.random();

          // Create idol with descriptive name
          const newIdol = {
            id: idolId,
            type: idolType.name,
            name: generateIdolName(idolType.name, selectedPrefixes, selectedSuffixes),
            prefixes: selectedPrefixes,
            suffixes: selectedSuffixes,
          };

          // Update usage counters
          selectedPrefixes.forEach(prefix => {
            modifierUsage[prefix.originalCode]++;
          });

          selectedSuffixes.forEach(suffix => {
            modifierUsage[suffix.originalCode]++;
          });

          // Track how many we've created of this type
          createdPerType[idolTypeName]++;

          // Add to final list
          idols.push(newIdol);
        }
      }
    }
  }

  return idols;
};

/**
 * Generate a descriptive name for the idol based on its modifiers
 */
function generateIdolName(idolType, prefixes, suffixes) {
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

  // If second prefix exists, add it to name
  if (prefixes.length > 1) {
    name += ` of ${prefixes[1].Name}`;
  }

  // If second suffix exists, add it to name
  if (suffixes.length > 1) {
    name += ` of ${suffixes[1].Name}`;
  }

  return name.trim();
}

/**
 * Simplified function that only generates idols without placing them
 * This separates the generation from placement, leveraging the existing Smart Fill logic
 * 
 * @param {Array} desiredModifiers - List of desired modifiers selected by the user
 * @param {Object} modData - Available prefixes and suffixes
 * @param {Array} idolTypes - Available idol types with dimensions
 * @param {Array} currentGrid - Current grid state (not used for placement anymore)
 * @returns {Object} - Generated idols only, without placement
 */
export const generateAndPlaceIdols = (
  desiredModifiers,
  modData,
  idolTypes,
  currentGrid
) => {
  // Expand modifiers based on their count property
  const expandedModifiers = [];
  desiredModifiers.forEach(mod => {
    const count = mod.count || 1; // Default to 1 if count is missing
    for (let i = 0; i < count; i++) {
      // Create a copy of the modifier without the count property
      const { count: _, ...modWithoutCount } = mod;
      expandedModifiers.push(modWithoutCount);
    }
  });

  // Generate idols based on expanded modifiers
  const generatedIdols = generateIdols(expandedModifiers, modData, idolTypes);

  // Return the generated idols without trying to place them
  // The caller will use the existing Smart Fill (optimize) function to place them
  return {
    idols: generatedIdols,
    placedIdols: [], // Empty - will be filled by Smart Fill
    grid: currentGrid, // Unchanged - will be filled by Smart Fill
  };
};