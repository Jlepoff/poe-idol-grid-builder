// utils/idol/idolGenerator.js

export const generateIdols = (desiredModifiers, modData, idolTypes) => {
  const modifierGroups = {};

  desiredModifiers.forEach((mod) => {
    if (!modifierGroups[mod.id]) {
      modifierGroups[mod.id] = {
        ...mod,
        count: 1,
        originalCount: 1,
      };
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

  const getAvailableIdolTypes = (modifier) => {
    const availableTypes = [];

    if (modifier.type === "prefix") {
      for (const [typeName, prefixes] of Object.entries(modData.prefixes)) {
        if (prefixes.some((prefix) => prefix.id === modifier.id)) {
          availableTypes.push(typeName);
        }
      }
    } else {
      for (const [typeName, suffixes] of Object.entries(modData.suffixes)) {
        if (suffixes.some((suffix) => suffix.id === modifier.id)) {
          availableTypes.push(typeName);
        }
      }
    }

    return availableTypes;
  };

  const distributeModifiersAcrossTypes = (modifier, count) => {
    const availableTypes = getAvailableIdolTypes(modifier);
    const distribution = {};

    availableTypes.forEach(type => {
      distribution[type] = 0;
    });

    if (count > 5) {
      const hasKamasan = availableTypes.includes("Kamasan");
      const hasNoble = availableTypes.includes("Noble");
      const hasTotemic = availableTypes.includes("Totemic");
      const hasBurial = availableTypes.includes("Burial");

      if (hasKamasan && hasNoble) {
        const perType = Math.floor(count / 2);
        distribution["Kamasan"] = perType;
        distribution["Noble"] = count - perType;
      }
      else if (hasTotemic && hasBurial) {
        const perType = Math.floor(count / 2);
        distribution["Totemic"] = perType;
        distribution["Burial"] = count - perType;
      }
      else {
        const typesCount = availableTypes.length;
        const perType = Math.floor(count / typesCount);

        availableTypes.forEach(type => {
          distribution[type] = perType;
        });

        let remainder = count - (perType * typesCount);
        let i = 0;
        while (remainder > 0) {
          distribution[availableTypes[i % availableTypes.length]]++;
          remainder--;
          i++;
        }
      }
    } else {
      for (let i = 0; i < count; i++) {
        distribution[availableTypes[i % availableTypes.length]]++;
      }
    }

    return { distribution, availableTypes };
  };

  const getAvailableModifiers = (modType, idolTypeName, usedModifiers = []) => {
    return uniqueModifiers
      .filter((mod) => {
        if (mod.type !== modType || modifierUsage[mod.id] >= mod.count) {
          return false;
        }

        if (usedModifiers.includes(mod.id)) {
          return false;
        }

        if (mod.type === "prefix") {
          return modData.prefixes[idolTypeName] &&
            modData.prefixes[idolTypeName].some(
              (prefix) => prefix.id === mod.id
            );
        } else {
          return modData.suffixes[idolTypeName] &&
            modData.suffixes[idolTypeName].some(
              (suffix) => suffix.id === mod.id
            );
        }
      })
      .map((mod) => ({
        ...mod,
        originalId: mod.id,
        displayCount: modifierUsage[mod.id] + 1,
        totalCount: mod.originalCount,
      }));
  };

  for (const modifier of uniqueModifiers) {
    if (modifierUsage[modifier.id] >= modifier.count) {
      continue;
    }

    const { distribution, availableTypes } = distributeModifiersAcrossTypes(
      modifier,
      modifier.count
    );

    const createdPerType = {};
    availableTypes.forEach(type => {
      createdPerType[type] = 0;
    });

    for (const idolTypeName of availableTypes) {
      if (distribution[idolTypeName] <= 0) {
        continue;
      }

      const idolType = idolTypes.find(t => t.name === idolTypeName);
      if (!idolType) continue;

      for (let i = 0; i < distribution[idolTypeName]; i++) {
        if (modifierUsage[modifier.id] >= modifier.count) {
          break;
        }

        const usedModifiers = [];
        let selectedPrefixes = [];
        let selectedSuffixes = [];

        if (modifier.type === "prefix") {
          const currentPrefix = getAvailableModifiers("prefix", idolTypeName).find(
            p => p.id === modifier.id
          );

          if (currentPrefix) {
            selectedPrefixes.push(currentPrefix);
            usedModifiers.push(currentPrefix.id);

            const otherPrefixes = getAvailableModifiers("prefix", idolTypeName, usedModifiers);
            if (otherPrefixes.length > 0) {
              selectedPrefixes.push(otherPrefixes[0]);
              usedModifiers.push(otherPrefixes[0].id);
            }

            const availableSuffixes = getAvailableModifiers("suffix", idolTypeName, usedModifiers);
            selectedSuffixes = availableSuffixes.slice(0, 2);
            selectedSuffixes.forEach(suffix => usedModifiers.push(suffix.id));
          }
        } else {
          const currentSuffix = getAvailableModifiers("suffix", idolTypeName).find(
            s => s.id === modifier.id
          );

          if (currentSuffix) {
            selectedSuffixes.push(currentSuffix);
            usedModifiers.push(currentSuffix.id);

            const otherSuffixes = getAvailableModifiers("suffix", idolTypeName, usedModifiers);
            if (otherSuffixes.length > 0) {
              selectedSuffixes.push(otherSuffixes[0]);
              usedModifiers.push(otherSuffixes[0].id);
            }

            const availablePrefixes = getAvailableModifiers("prefix", idolTypeName, usedModifiers);
            selectedPrefixes = availablePrefixes.slice(0, 2);
            selectedPrefixes.forEach(prefix => usedModifiers.push(prefix.id));
          }
        }

        if ((modifier.type === "prefix" && selectedPrefixes.some(p => p.id === modifier.id)) ||
          (modifier.type === "suffix" && selectedSuffixes.some(s => s.id === modifier.id))) {

          const idolId = Date.now() + Math.random();

          const newIdol = {
            id: idolId,
            type: idolType.name,
            name: generateIdolName(idolType.name, selectedPrefixes, selectedSuffixes),
            prefixes: selectedPrefixes,
            suffixes: selectedSuffixes,
          };

          selectedPrefixes.forEach(prefix => {
            modifierUsage[prefix.originalId]++;
          });

          selectedSuffixes.forEach(suffix => {
            modifierUsage[suffix.originalId]++;
          });

          createdPerType[idolTypeName]++;
          idols.push(newIdol);
        }
      }
    }
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