// utils/modifiers/modifierUtils.js

// Pattern definitions for reuse
const PATTERNS = [
  { type: "plusChance", regex: /\+(\d+(?:\.\d+)?)%\s+chance/i },
  { type: "haveChance", regex: /have\s+(\d+(?:\.\d+)?)%\s+(?:increased\s+)?chance/i },
  { type: "increased", regex: /(\d+(?:\.\d+)?)%\s+increased/i },
  { type: "more", regex: /(\d+(?:\.\d+)?)%\s+more/i },
  { type: "reduced", regex: /(\d+(?:\.\d+)?)%\s+reduced/i },
  { type: "faster", regex: /(\d+(?:\.\d+)?)%\s+faster/i },
  { type: "slower", regex: /(\d+(?:\.\d+)?)%\s+slower/i },
  { type: "additional", regex: /additional/i },
  { type: "numeric", regex: /(\d+(?:\.\d+)?)/ },
];

// POE pattern normalization for modifier comparison
const POE_PATTERNS = [
  { regex: /(\d+(?:\.\d+)?)%/g, replace: "PERCENTAGE" },
  { regex: /\+(\d+(?:\.\d+)?)%/g, replace: "+PERCENTAGE" },
  { regex: /\+(\d+(?:\.\d+)?)\b(?!%)/g, replace: "+NUMBER" },
  { regex: /(\d+(?:\.\d+)?)\s+additional/g, replace: "NUMBER additional" },
  { regex: /lasts\s+(\d+(?:\.\d+)?)\s+additional\s+seconds/g, replace: "lasts NUMBER additional seconds" },
  { regex: /have\s+(?:a\s+)?(\d+(?:\.\d+)?)%\s+(?:increased\s+)?chance/g, replace: "have PERCENTAGE chance" },
  { regex: /(\d+(?:\.\d+)?)%\s+chance/g, replace: "PERCENTAGE chance" },
  { regex: /(\d+(?:\.\d+)?)\s+(increased|more|reduced|faster|slower)/g, replace: "NUMBER $2" },
  { regex: /contain\s+(\d+(?:\.\d+)?)\s+additional/g, replace: "contain NUMBER additional" },
  { regex: /spawn\s+with\s+(?:an\s+)?(?:additional\s+)?(\d+(?:\.\d+)?)%\s+of\s+Life\s+missing/g, replace: "spawn with PERCENTAGE of Life missing" }
];

// Prefix detection patterns
const PREFIX_PATTERNS = [
  /^Your Maps have \+\d/,
  /^Your Maps have \d+%/,
  /^Your Maps contain/,
  /^Your Maps are/,
  /^Your Maps which contain/,
  /Final Map Boss/,
  /Map Bosses? (has|have)/,
  /increased Maps found/,
  /increased Pack size/,
  /increased effect of Explicit Modifiers/,
  /\d+% chance for your Maps/,
  /\+\d+% chance to grant/
];

// Suffix detection patterns
const SUFFIX_PATTERNS = [
  /Abyssal Troves/,
  /Expeditions in your Maps/,
  /(Blight|Delirium|Legion|Ultimatum) (Monsters|Encounters|Rewards|Bosses) in your Maps/,
  /Strongboxes (in|contained in) your Maps/,
  /Blight Towers in your Maps/,
  /Breaches in your Maps/,
  /Shrines in your Maps/,
  /Ritual Altars in your Maps/,
  /Immortal Syndicate Members in your Maps/,
  /Plants Harvested in your Maps/,
  /Oils found in your Maps/
];

/**
 * Extracts the pattern type and value from a modifier text
 * @param {string} modText - The modifier text to analyze
 * @return {Object} Object containing type, value and fullText
 */
export const getMatchPattern = (modText) => {
  if (!modText) return { type: "unstackable", value: null, fullText: "" };

  for (const { type, regex } of PATTERNS) {
    const match = modText.match(regex);
    if (match) {
      return {
        type,
        value: type !== "additional"
          ? parseFloat(match[1])
          : (modText.match(/(\d+)/)?.[1] ? parseFloat(modText.match(/(\d+)/)[1]) : 1),
        fullText: modText,
      };
    }
  }

  return { type: "unstackable", value: null, fullText: modText };
};

/**
 * Extracts a normalized base key for grouping similar modifiers
 * @param {string} modText - The modifier text to normalize
 * @return {string} Normalized base key
 */
export const getBaseEffectKey = (modText) => {
  if (!modText) return "";

  // Special case for the Tier Maps pattern
  if (modText.match(/Tier \d+-\d+ Maps found/)) {
    return "Tier X-Y Maps found have X% chance to become 1 tier higher";
  }

  return modText
    .replace(/(\d+(?:\.\d+)?)(%|\s|$)/g, "X$2")
    .replace(/\s+/g, " ")
    .trim();
};

/**
 * Determines if two modifier texts are equivalent 
 * @param {string} mod1 - First modifier text
 * @param {string} mod2 - Second modifier text
 * @return {boolean} True if modifiers are equivalent
 */
export const areModsEquivalent = (mod1, mod2) => {
  // Check for null or undefined mods
  if (!mod1 || !mod2) return false;

  const normalize = (str) => str.replace(/\s+/g, " ").trim();

  // Normalize and standardize dashes
  const norm1 = normalize(mod1).replace(/[\u2013\u2014\u2212]/g, '-');
  const norm2 = normalize(mod2).replace(/[\u2013\u2014\u2212]/g, '-');

  // Check for direct equality after normalization
  if (norm1 === norm2) return true;

  // Check for 'additional' pattern equivalence
  const additionalPattern1 = norm1.replace(/\b(?:an|a|1|one)\s+additional\b/g, "NUMBER additional");
  const additionalPattern2 = norm2.replace(/\b(?:an|a|1|one)\s+additional\b/g, "NUMBER additional");
  if (additionalPattern1 === additionalPattern2) return true;

  // Apply each POE pattern for standardization
  for (const { regex, replace } of POE_PATTERNS) {
    const normalized1 = norm1.replace(regex, replace);
    const normalized2 = norm2.replace(regex, replace);
    if (normalized1 === normalized2) return true;
  }

  // Replace all numbers for general comparison
  const allNumbersReplaced1 = norm1.replace(/\d+(?:\.\d+)?/g, "NUMBER");
  const allNumbersReplaced2 = norm2.replace(/\d+(?:\.\d+)?/g, "NUMBER");

  // Helper function to determine if text is similar enough
  const areSimilarEnough = (s1, s2) => {
    const textOnly1 = s1.replace(/\d+(?:\.\d+)?/g, "");
    const textOnly2 = s2.replace(/\d+(?:\.\d+)?/g, "");

    if (textOnly1 === textOnly2) return true;

    if (textOnly1.length > 15 && textOnly2.length > 15) {
      const minLength = Math.min(textOnly1.length, textOnly2.length);
      const comparisonLength = Math.floor(minLength * 0.8);
      const sample1 = textOnly1.substring(0, comparisonLength);
      const sample2 = textOnly2.substring(0, comparisonLength);
      return textOnly1.includes(sample2) || textOnly2.includes(sample1);
    }

    return false;
  };

  if (allNumbersReplaced1 === allNumbersReplaced2 && areSimilarEnough(norm1, norm2)) {
    return true;
  }

  return false;
};

/**
 * Determines whether a modifier is a prefix or suffix
 * @param {string} modText - The modifier text to analyze
 * @return {string} 'prefix' or 'suffix'
 */
export function determineModifierType(modText) {
  if (!modText) return "suffix"; // Default to suffix if no text

  // Check prefix patterns
  for (const pattern of PREFIX_PATTERNS) {
    if (pattern.test(modText)) return "prefix";
  }

  // Check suffix patterns
  for (const pattern of SUFFIX_PATTERNS) {
    if (pattern.test(modText)) return "suffix";
  }

  // Check broader patterns
  if (modText.includes("Your Maps have") && !modText.includes("in your Maps have")) {
    return "prefix";
  }

  if (modText.includes(" in your Maps")) {
    return "suffix";
  }

  return "suffix"; // Default
}

/**
 * Processes grid state to calculate stacked modifiers
 * @param {Array} gridState - 2D array representing the grid
 * @return {Array} Array of stacked modifiers
 */
export const calculateStackedModifiers = (gridState) => {
  if (!gridState || !Array.isArray(gridState)) {
    return [];
  }

  // Extract all unique modifiers from placed idols
  const allModifiers = [];
  const processedCells = new Set();
  const uniqueIdolsFound = [];

  // Process the grid
  for (let row = 0; row < gridState.length; row++) {
    for (let col = 0; col < gridState[row].length; col++) {
      const cell = gridState[row][col];
      if (!cell) continue;

      const position = cell.position || { row, col };
      const cellKey = `${position.row}-${position.col}`;

      // Only process each idol once (based on its primary cell)
      if (processedCells.has(cellKey)) continue;
      processedCells.add(cellKey);

      // Process unique idols
      if (cell.isUnique && cell.uniqueModifiers) {
        uniqueIdolsFound.push({
          name: cell.name,
          position,
          modCount: cell.uniqueModifiers?.length,
          mods: cell.uniqueModifiers
        });

        // Add unique idol modifiers
        cell.uniqueModifiers.forEach(mod => {
          if (mod && mod.Mod) {
            allModifiers.push({
              ...mod,
              isUnique: true,
              name: "Unique",
              type: "unique"
            });
          } else {
            console.warn("Invalid mod found in unique idol:", mod);
          }
        });
        continue;
      }

      // Add prefixes
      if (cell.prefixes) {
        cell.prefixes.forEach(prefix => {
          if (prefix && prefix.Mod) {
            allModifiers.push({
              ...prefix,
              name: prefix.Name || "Unknown",
              type: "prefix"
            });
          }
        });
      }

      // Add suffixes
      if (cell.suffixes) {
        cell.suffixes.forEach(suffix => {
          if (suffix && suffix.Mod) {
            allModifiers.push({
              ...suffix,
              name: suffix.Name || "Unknown",
              type: "suffix"
            });
          }
        });
      }
    }
  }

  // Group similar modifiers
  const grouped = {};

  allModifiers.forEach(mod => {
    if (!mod || !mod.Mod) {
      console.warn("Invalid modifier found:", mod);
      return; // Skip invalid modifiers
    }

    const baseKey = getBaseEffectKey(mod.Mod);
    if (!baseKey) {
      console.warn("Could not generate base key for mod:", mod.Mod);
      return; // Skip if we couldn't generate a base key
    }

    if (!grouped[baseKey]) {
      grouped[baseKey] = {
        ...mod,
        count: 1,
        matchPattern: getMatchPattern(mod.Mod),
        instances: [{
          value: getMatchPattern(mod.Mod).value,
          text: mod.Mod
        }]
      };
    } else {
      grouped[baseKey].count++;
      grouped[baseKey].instances.push({
        value: getMatchPattern(mod.Mod).value,
        text: mod.Mod
      });
    }
  });

  // Process each group to create stacked modifiers
  return Object.values(grouped).map(group => {
    if (!group || !group.matchPattern || group.matchPattern.type === "unstackable") {
      return group;
    }

    const totalValue = Number(
      group.instances
        .reduce((sum, inst) => sum + (inst.value || 0), 0)
        .toFixed(1)
    );

    const stackedMod = { ...group };

    // Format the stacked mod text based on type
    if (group.matchPattern.type === "additional" && !totalValue) {
      stackedMod.mod = group.Mod.replace(/an additional/i, `${group.count} additional`);
    } else if (group.Mod && group.Mod.match(/Tier \d+-\d+ Maps found have/)) {
      // Special handling for Tier X-Y Maps pattern
      const tierMatch = group.Mod.match(/Tier (\d+-\d+) Maps found have/);
      if (tierMatch && tierMatch[1]) {
        stackedMod.mod = group.Mod.replace(
          /have\s+\d+(?:\.\d+)?%/,
          `have ${totalValue}%`
        );
      } else {
        stackedMod.mod = group.Mod.replace(
          /(\d+(?:\.\d+)?)(%|\s|$)/,
          `${totalValue}$2`
        );
      }
    } else if (group.Mod) {
      stackedMod.mod = group.Mod.replace(
        /(\d+(?:\.\d+)?)(%|\s|$)/,
        `${totalValue}$2`
      );
    } else {
      stackedMod.mod = "Unknown modifier";
    }

    stackedMod.stackedValue = totalValue;
    return stackedMod;
  });
};