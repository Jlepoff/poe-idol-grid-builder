import React, { useMemo } from "react";

function ActiveModifiers({ gridState }) {
  const activeModifiers = useMemo(() => {
    const processedCells = new Set();
    const placedIdols = [];

    // Collect all placed idols
    for (let row = 0; row < gridState.length; row++) {
      for (let col = 0; col < gridState[row].length; col++) {
        const cell = gridState[row][col];
        if (!cell) continue;

        const idolPos = cell.position || { row, col };
        const cellKey = `${idolPos.row}-${idolPos.col}`;

        if (!processedCells.has(cellKey)) {
          processedCells.add(cellKey);
          placedIdols.push(cell);
        }
      }
    }

    const modGroups = new Map();

    placedIdols.forEach((idol) => {
      if (idol.isUnique && idol.uniqueModifiers) {
        idol.uniqueModifiers.forEach((mod) => {
          const modKey = mod.Mod;
          if (!modGroups.has(modKey)) {
            modGroups.set(modKey, {
              name: "Unique",
              mod: mod.Mod,
              count: 1,
              type: "unique",
              family: "Unique",
              matchPattern: getMatchPattern(mod.Mod),
              isUnique: true,
              instances: [{ value: null, text: mod.Mod }],
            });
          } else {
            modGroups.get(modKey).count += 1;
          }
        });
        return;
      }

      if (idol.prefixes) {
        idol.prefixes.forEach((prefix) => {
          const baseKey = getBaseEffectKey(prefix.Mod);
          if (!modGroups.has(baseKey)) {
            modGroups.set(baseKey, {
              name: prefix.Name,
              mod: prefix.Mod,
              count: 1,
              type: "prefix",
              family: prefix.Family || "Unknown",
              matchPattern: getMatchPattern(prefix.Mod),
              instances: [{ value: getMatchPattern(prefix.Mod).value, text: prefix.Mod }],
            });
          } else {
            const group = modGroups.get(baseKey);
            group.count += 1;
            group.instances.push({ value: getMatchPattern(prefix.Mod).value, text: prefix.Mod });
          }
        });
      }

      if (idol.suffixes) {
        idol.suffixes.forEach((suffix) => {
          const baseKey = getBaseEffectKey(suffix.Mod);
          if (!modGroups.has(baseKey)) {
            modGroups.set(baseKey, {
              name: suffix.Name,
              mod: suffix.Mod,
              count: 1,
              type: "suffix",
              family: suffix.Family || "Unknown",
              matchPattern: getMatchPattern(suffix.Mod),
              instances: [{ value: getMatchPattern(suffix.Mod).value, text: suffix.Mod }],
            });
          } else {
            const group = modGroups.get(baseKey);
            group.count += 1;
            group.instances.push({ value: getMatchPattern(suffix.Mod).value, text: suffix.Mod });
          }
        });
      }
    });

    const stackedModifiers = Array.from(modGroups.values()).map((group) => {
      if (group.matchPattern.type === "unstackable" || group.isUnique) {
        return group;
      }

      // Stack numeric values and round to 1 decimal place
      const totalValue = Number(
        group.instances
          .reduce((sum, inst) => sum + (inst.value || 0), 0)
          .toFixed(1)
      );
      const stackedMod = { ...group };

      if (group.matchPattern.type === "additional" && !totalValue) {
        stackedMod.mod = group.mod.replace(/an additional/i, `${group.count} additional`);
      } else {
        stackedMod.mod = group.mod.replace(
          /(\d+(?:\.\d+)?)(%|\s|$)/,
          `${totalValue}$2`
        );
      }
      stackedMod.stackedValue = totalValue;
      return stackedMod;
    });

    return stackedModifiers.sort((a, b) => {
      if (a.name !== b.name) return a.name.localeCompare(b.name);
      return a.type.localeCompare(b.type);
    });
  }, [gridState]);

  const groupedModifiers = useMemo(() => {
    const groups = {};
    groups["Unique"] = activeModifiers.filter((mod) => mod.isUnique);

    activeModifiers
      .filter((mod) => !mod.isUnique)
      .forEach((mod) => {
        const nameKey = mod.name;
        if (!groups[nameKey]) groups[nameKey] = [];
        groups[nameKey].push(mod);
      });

    Object.keys(groups).forEach((key) => {
      if (groups[key].length === 0) delete groups[key];
    });

    return groups;
  }, [activeModifiers]);

  function getMatchPattern(modText) {
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
  }

  function getBaseEffectKey(modText) {
    return modText
      .replace(/(\d+(?:\.\d+)?)(%|\s|$)/g, "X$2")
      .replace(/\s+/g, " ")
      .trim();
  }

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
                    {mod.count > 1 ? `(${mod.count}x)` : ""}
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