// components/ActiveModifiers.jsx
import React, { useMemo } from "react";

function ActiveModifiers({ gridState }) {
  // Calculate active modifiers from placed idols
  const activeModifiers = useMemo(() => {
    // Track processed idol cells to avoid duplicates
    const processedCells = new Set();
    const placedIdols = [];

    // Collect all placed idols (only count each idol once)
    for (let row = 0; row < gridState.length; row++) {
      for (let col = 0; col < gridState[row].length; col++) {
        const cell = gridState[row][col];
        if (!cell) continue;

        // Get the idol's primary position (top-left corner)
        const idolPos = cell.position || { row, col };
        const cellKey = `${idolPos.row}-${idolPos.col}`;

        // Only process each idol once
        if (!processedCells.has(cellKey)) {
          processedCells.add(cellKey);
          placedIdols.push(cell);
        }
      }
    }

    // Map to track modifier counts
    const modMap = new Map();

    // Process all modifiers from placed idols
    placedIdols.forEach((idol) => {
      // Handle unique idols
      if (idol.isUnique && idol.uniqueModifiers) {
        idol.uniqueModifiers.forEach((mod) => {
          const modKey = mod.Mod;
          if (!modMap.has(modKey)) {
            modMap.set(modKey, {
              name: "Unique",
              mod: mod.Mod,
              count: 1,
              type: "unique",
              family: "Unique",
              matchPattern: getMatchPattern(mod.Mod),
              isUnique: true,
            });
          } else {
            modMap.get(modKey).count += 1;
          }
        });
        return;
      }

      // Process prefixes
      if (idol.prefixes) {
        idol.prefixes.forEach((prefix) => {
          const modKey = prefix.Mod;
          if (!modMap.has(modKey)) {
            modMap.set(modKey, {
              name: prefix.Name,
              mod: prefix.Mod,
              count: 1,
              type: "prefix",
              family: prefix.Family || "Unknown",
              matchPattern: getMatchPattern(prefix.Mod),
            });
          } else {
            modMap.get(modKey).count += 1;
          }
        });
      }

      // Process suffixes
      if (idol.suffixes) {
        idol.suffixes.forEach((suffix) => {
          const modKey = suffix.Mod;
          if (!modMap.has(modKey)) {
            modMap.set(modKey, {
              name: suffix.Name,
              mod: suffix.Mod,
              count: 1,
              type: "suffix",
              family: suffix.Family || "Unknown",
              matchPattern: getMatchPattern(suffix.Mod),
            });
          } else {
            modMap.get(modKey).count += 1;
          }
        });
      }
    });

    // Convert to array and apply stacking
    const modifiersArray = Array.from(modMap.values());
    const stackedModifiers = stackSimilarModifiers(modifiersArray);

    // Sort by name then type
    return stackedModifiers.sort((a, b) => {
      if (a.name !== b.name) {
        return a.name.localeCompare(b.name);
      }
      return a.type.localeCompare(b.type);
    });
  }, [gridState]);

  // Group modifiers by their name for display
  const groupedModifiers = useMemo(() => {
    const groups = {};

    // Create a special group for unique modifiers
    groups["Unique"] = activeModifiers.filter((mod) => mod.isUnique);

    // Group the rest by name
    activeModifiers
      .filter((mod) => !mod.isUnique)
      .forEach((mod) => {
        const nameKey = mod.name;
        if (!groups[nameKey]) {
          groups[nameKey] = [];
        }
        groups[nameKey].push(mod);
      });

    // Remove empty groups
    Object.keys(groups).forEach((key) => {
      if (groups[key].length === 0) {
        delete groups[key];
      }
    });

    return groups;
  }, [activeModifiers]);

  // Extract numeric values and patterns from modifier text
  function getMatchPattern(modText) {
    // Match +X% chance pattern
    const plusChanceMatch = modText.match(/\+(\d+(?:\.\d+)?)%\s+chance/i);
    if (plusChanceMatch) {
      return {
        type: "plusChance",
        value: parseFloat(plusChanceMatch[1]),
        fullText: modText,
      };
    }

    // Match "have X% chance" pattern
    const haveChanceMatch = modText.match(
      /have\s+(\d+(?:\.\d+)?)%\s+(?:increased\s+)?chance/i
    );
    if (haveChanceMatch) {
      return {
        type: "haveChance",
        value: parseFloat(haveChanceMatch[1]),
        fullText: modText,
      };
    }

    // Match "X% increased" pattern
    const increasedMatch = modText.match(/(\d+(?:\.\d+)?)%\s+increased/i);
    if (increasedMatch) {
      return {
        type: "increased",
        value: parseFloat(increasedMatch[1]),
        fullText: modText,
      };
    }

    // Match "X% more" pattern
    const moreMatch = modText.match(/(\d+(?:\.\d+)?)%\s+more/i);
    if (moreMatch) {
      return {
        type: "more",
        value: parseFloat(moreMatch[1]),
        fullText: modText,
      };
    }

    // Match "X% reduced" pattern
    const reducedMatch = modText.match(/(\d+(?:\.\d+)?)%\s+reduced/i);
    if (reducedMatch) {
      return {
        type: "reduced",
        value: parseFloat(reducedMatch[1]),
        fullText: modText,
      };
    }

    // Match "X% faster/slower" patterns
    const fasterMatch = modText.match(/(\d+(?:\.\d+)?)%\s+faster/i);
    if (fasterMatch) {
      return {
        type: "faster",
        value: parseFloat(fasterMatch[1]),
        fullText: modText,
      };
    }

    const slowerMatch = modText.match(/(\d+(?:\.\d+)?)%\s+slower/i);
    if (slowerMatch) {
      return {
        type: "slower",
        value: parseFloat(slowerMatch[1]),
        fullText: modText,
      };
    }

    // Match "additional" pattern
    const additionalMatch = modText.match(/additional/i);
    if (additionalMatch) {
      const numericMatch = modText.match(/(\d+(?:\.\d+)?)/);
      return {
        type: "additional",
        value: numericMatch ? parseFloat(numericMatch[1]) : 1,
        fullText: modText,
      };
    }

    // General numeric pattern - find any number
    const numericMatch = modText.match(/(\d+(?:\.\d+)?)/);
    if (numericMatch) {
      return {
        type: "numeric",
        value: parseFloat(numericMatch[1]),
        fullText: modText,
      };
    }

    // No stackable pattern found
    return {
      type: "unstackable",
      value: null,
      fullText: modText,
    };
  }

  // Stack similar modifiers together
  function stackSimilarModifiers(modifiers) {
    // Group by exact text
    const exactMatches = new Map();

    modifiers.forEach((mod) => {
      const exactKey = mod.mod;
      if (!exactMatches.has(exactKey)) {
        exactMatches.set(exactKey, [mod]);
      } else {
        exactMatches.get(exactKey).push(mod);
      }
    });

    const stacked = [];

    // Process each group of matches
    for (const [_, mods] of exactMatches.entries()) {
      if (mods.length === 1) {
        stacked.push(mods[0]);
        continue;
      }

      // For multiple copies of the same mod, combine them
      const baseMod = { ...mods[0] };
      const totalCount = mods.reduce((sum, mod) => sum + mod.count, 0);
      baseMod.count = totalCount;

      // Stack values for stackable mods
      if (baseMod.matchPattern.type !== "unstackable") {
        const pattern = baseMod.matchPattern;
        const totalValue = pattern.value * totalCount;

        // Format text based on mod type
        if (pattern.type === "plusChance") {
          baseMod.mod = baseMod.mod.replace(
            /\+(\d+(?:\.\d+)?)%/,
            `+${totalValue}%`
          );
        } else if (pattern.type === "haveChance") {
          baseMod.mod = baseMod.mod.replace(
            /have\s+(\d+(?:\.\d+)?)%/,
            `have ${totalValue}%`
          );
        } else if (
          ["increased", "more", "reduced", "faster", "slower"].includes(
            pattern.type
          )
        ) {
          baseMod.mod = baseMod.mod.replace(
            /(\d+(?:\.\d+)?)%/,
            `${totalValue}%`
          );
        } else if (pattern.type === "additional") {
          const numMatch = baseMod.mod.match(/(\d+(?:\.\d+)?)/);
          if (numMatch) {
            baseMod.mod = baseMod.mod.replace(
              /(\d+(?:\.\d+)?)/,
              `${totalValue}`
            );
          } else if (totalCount > 1) {
            baseMod.mod = baseMod.mod.replace(
              /an additional/i,
              `${totalCount} additional`
            );
          }
        } else if (pattern.type === "numeric") {
          baseMod.mod = baseMod.mod.replace(/(\d+(?:\.\d+)?)/, `${totalValue}`);
        }

        baseMod.stackedValue = totalValue;
      }

      stacked.push(baseMod);
    }

    return stacked;
  }

  // Show empty state if no modifiers
  if (activeModifiers.length === 0) {
    return (
      <div className="bg-gray-800 p-4 rounded-lg shadow-lg mb-4">
        <h2 className="text-xl font-bold mb-2">Active Modifiers</h2>
        <p className="text-gray-400">
          No active modifiers. Place idols on the grid to see their effects.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg mb-4">
      <h2 className="text-xl font-bold mb-2">Active Modifiers</h2>

      <div className="space-y-3">
        {Object.entries(groupedModifiers).map(([name, mods]) => (
          <div key={name} className="border-t border-gray-700 pt-2">
            <h3 className="font-semibold text-yellow-400">{name}</h3>
            <ul className="mt-1">
              {mods.map((mod, index) => (
                <li key={index} className="flex justify-between text-sm py-1">
                  <span className="text-gray-200">{mod.mod}</span>
                  <span className="text-gray-400 ml-2">
                    {mod.count > 1 ? `${mod.count}x` : ""}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ActiveModifiers;
