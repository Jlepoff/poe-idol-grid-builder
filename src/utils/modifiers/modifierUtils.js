// utils/modifiers/modifierUtils.js

export const getMatchPattern = (modText) => {
  if (!modText) return { type: "unstackable", value: null, fullText: "" };

  const patterns = [
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

  for (const { type, regex } of patterns) {
    const match = modText.match(regex);
    if (match) {
      return {
        type,
        value: type !== "additional" ? parseFloat(match[1]) : (modText.match(/(\d+)/)?.[1] ? parseFloat(modText.match(/(\d+)/)[1]) : 1),
        fullText: modText,
      };
    }
  }

  return { type: "unstackable", value: null, fullText: modText };
};

export const getBaseEffectKey = (modText) => {
  if (!modText) return "";

  return modText
    .replace(/(\d+(?:\.\d+)?)(%|\s|$)/g, "X$2")
    .replace(/\s+/g, " ")
    .trim();
};

export const areModsEquivalent = (mod1, mod2) => {
  // Check for null or undefined mods
  if (!mod1 || !mod2) return false;

  const normalize = (str) => str.replace(/\s+/g, " ").trim();

  const norm1 = normalize(mod1).replace(/[\u2013\u2014\u2212]/g, '-');
  const norm2 = normalize(mod2).replace(/[\u2013\u2014\u2212]/g, '-');

  if (norm1 === norm2) return true;

  const additionalPattern1 = norm1.replace(/\b(?:an|a|1|one)\s+additional\b/g, "NUMBER additional");
  const additionalPattern2 = norm2.replace(/\b(?:an|a|1|one)\s+additional\b/g, "NUMBER additional");

  if (additionalPattern1 === additionalPattern2) return true;

  const poePatterns = [
    { regex: /(\d+(?:\.\d+)?)%/g, replace: "PERCENTAGE" },
    { regex: /\+(\d+(?:\.\d+)?)%/g, replace: "+PERCENTAGE" },
    { regex: /\+(\d+(?:\.\d+)?)\b(?!%)/g, replace: "+NUMBER" },
    { regex: /(\d+(?:\.\d+)?)\s+additional/g, replace: "NUMBER additional" },
    { regex: /lasts\s+(\d+(?:\.\d+)?)\s+additional\s+seconds/g, replace: "lasts NUMBER additional seconds" },
    { regex: /have\s+(?:a\s+)?(\d+(?:\.\d+)?)%\s+(?:increased\s+)?chance/g, replace: "have PERCENTAGE chance" },
    { regex: /(\d+(?:\.\d+)?)%\s+chance/g, replace: "PERCENTAGE chance" },
    { regex: /(\d+(?:\.\d+)?)\s+(increased|more|reduced|faster|slower)/g, replace: "NUMBER $2" },
    { regex: /contain\s+(\d+(?:\.\d+)?)\s+additional/g, replace: "contain NUMBER additional" },
    {
      regex: /spawn\s+with\s+(?:an\s+)?(?:additional\s+)?(\d+(?:\.\d+)?)%\s+of\s+Life\s+missing/g,
      replace: "spawn with PERCENTAGE of Life missing"
    }
  ];

  for (const { regex, replace } of poePatterns) {
    const normalized1 = norm1.replace(regex, replace);
    const normalized2 = norm2.replace(regex, replace);
    if (normalized1 === normalized2) return true;
  }

  const allNumbersReplaced1 = norm1.replace(/\d+(?:\.\d+)?/g, "NUMBER");
  const allNumbersReplaced2 = norm2.replace(/\d+(?:\.\d+)?/g, "NUMBER");

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

export function determineModifierType(modText) {
  if (!modText) return "suffix"; // Default to suffix if no text

  if (
    /^Your Maps have \+\d/.test(modText) ||
    /^Your Maps have \d+%/.test(modText) ||
    /^Your Maps contain/.test(modText) ||
    /^Your Maps are/.test(modText) ||
    /^Your Maps which contain/.test(modText) ||
    /Final Map Boss/.test(modText) ||
    /Map Bosses? (has|have)/.test(modText) ||
    /increased Maps found/.test(modText) ||
    /increased Pack size/.test(modText) ||
    /increased effect of Explicit Modifiers/.test(modText) ||
    /\d+% chance for your Maps/.test(modText) ||
    /\+\d+% chance to grant/.test(modText)
  ) {
    return "prefix";
  }

  if (
    /Abyssal Troves/.test(modText) ||
    /Expeditions in your Maps/.test(modText) ||
    /(Blight|Delirium|Legion|Ultimatum) (Monsters|Encounters|Rewards|Bosses) in your Maps/.test(modText) ||
    /Strongboxes (in|contained in) your Maps/.test(modText) ||
    /Blight Towers in your Maps/.test(modText) ||
    /Breaches in your Maps/.test(modText) ||
    /Shrines in your Maps/.test(modText) ||
    /Ritual Altars in your Maps/.test(modText) ||
    /Immortal Syndicate Members in your Maps/.test(modText) ||
    /Plants Harvested in your Maps/.test(modText) ||
    /Oils found in your Maps/.test(modText)
  ) {
    return "suffix";
  }

  if (modText.includes("Your Maps have") && !modText.includes("in your Maps have")) {
    return "prefix";
  }

  if (modText.includes(" in your Maps")) {
    return "suffix";
  }

  return "suffix";
}

// Modified calculateStackedModifiers function with debugging
export const calculateStackedModifiers = (gridState) => {
  if (!gridState || !Array.isArray(gridState)) {
    return [];
  }

  // Extract all unique modifiers from placed idols
  const allModifiers = [];
  const processedCells = new Set();
  const uniqueIdolsFound = [];

  for (let row = 0; row < gridState.length; row++) {
    for (let col = 0; col < gridState[row].length; col++) {
      const cell = gridState[row][col];
      if (!cell) continue;

      const position = cell.position || { row, col };
      const cellKey = `${position.row}-${position.col}`;

      // Only process each idol once (based on its primary cell)
      if (processedCells.has(cellKey)) continue;
      processedCells.add(cellKey);

      // Debug unique idols
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

    if (group.matchPattern.type === "additional" && !totalValue) {
      stackedMod.mod = group.Mod.replace(/an additional/i, `${group.count} additional`);
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