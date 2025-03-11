// hooks/useModifiers.js
import { useState, useEffect, useMemo, useCallback, useContext } from 'react';
import { AppContext } from '../context/AppContext';

export const useModifiers = (initialState = null, onSearchUpdate = null, searchContext = 'builder') => {
  const { modData, idolTypes } = useContext(AppContext);

  const [searchTerm, setSearchTerm] = useState(initialState?.searchTerm || "");
  const [filterType, setFilterType] = useState(initialState?.filterType || "all");
  const [viewByName, setViewByName] = useState(initialState?.viewByName || false);
  const [selectedNames, setSelectedNames] = useState(initialState?.selectedNames || []);
  const [nameSearchTerm, setNameSearchTerm] = useState("");
  const [selectedGroupNames, setSelectedGroupNames] = useState([]);

  const modifierGroups = useMemo(() => ({
    "Bossing": ["Conqueror", "Shaper", "Maven", "Synthesis", "Elder"],
    "Eldritch": ["Eater", "Exarch"],
    "Mapping": ["Cartographer", "Kirac", "Scouting"],
  }), []);

  const nameToGroupMap = useMemo(() => {
    const mapping = {};
    Object.entries(modifierGroups).forEach(([groupName, modNames]) => {
      modNames.forEach(name => {
        mapping[name] = groupName;
      });
    });
    return mapping;
  }, [modifierGroups]);

  useEffect(() => {
    if (onSearchUpdate) {
      const timeoutId = setTimeout(() => {
        onSearchUpdate({
          searchTerm,
          filterType,
          viewByName,
          selectedNames,
        });
      }, 50);
      return () => clearTimeout(timeoutId);
    }
  }, [searchTerm, filterType, viewByName, selectedNames, onSearchUpdate]);

  const getNamesInGroup = useCallback((groupName) => {
    return modifierGroups[groupName] || [];
  }, [modifierGroups]);

  const handleSearchTermChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleFilterTypeChange = useCallback((e) => {
    setFilterType(e.target.value);
  }, []);

  const handleViewModeChange = useCallback((mode) => {
    setViewByName(mode);
    setSelectedNames([]);
  }, []);

  const handleNameSelection = useCallback((item) => {
    if (item.isGroup) {
      const groupNames = getNamesInGroup(item.name);
      const allSelected = groupNames.every((name) =>
        selectedNames.includes(name)
      );

      if (allSelected) {
        setSelectedNames((prevNames) =>
          prevNames.filter((name) => !groupNames.includes(name))
        );
        setSelectedGroupNames((prev) =>
          prev.filter((name) => name !== item.name)
        );
      } else {
        setSelectedNames((prevNames) => {
          const newNames = [...prevNames];
          groupNames.forEach((name) => {
            if (!newNames.includes(name)) {
              newNames.push(name);
            }
          });
          return newNames;
        });
        setSelectedGroupNames((prev) => {
          if (!prev.includes(item.name)) {
            return [...prev, item.name];
          }
          return prev;
        });
      }
    } else {
      setSelectedNames((prevNames) => {
        if (prevNames.includes(item.name)) {
          return prevNames.filter((n) => n !== item.name);
        }
        return [...prevNames, item.name];
      });
    }
  }, [selectedNames, getNamesInGroup]);

  const modifierNames = useMemo(() => {
    if (!modData.prefixes || !modData.suffixes)
      return { prefixes: [], suffixes: [] };

    const prefixNames = new Set();
    const suffixNames = new Set();

    if (searchContext === "builder" && initialState?.selectedType) {
      if (modData.prefixes[initialState.selectedType]) {
        modData.prefixes[initialState.selectedType].forEach((mod) =>
          prefixNames.add(mod.Name)
        );
      }

      if (modData.suffixes[initialState.selectedType]) {
        modData.suffixes[initialState.selectedType].forEach((mod) =>
          suffixNames.add(mod.Name)
        );
      }
    } else {
      Object.values(modData.prefixes).forEach((typeModifiers) => {
        typeModifiers.forEach((mod) => prefixNames.add(mod.Name));
      });

      Object.values(modData.suffixes).forEach((typeModifiers) => {
        typeModifiers.forEach((mod) => suffixNames.add(mod.Name));
      });
    }

    return {
      prefixes: Array.from(prefixNames).sort(),
      suffixes: Array.from(suffixNames).sort(),
    };
  }, [modData, initialState?.selectedType, searchContext]);

  const combinedUniqueNames = useMemo(() => {
    if (filterType !== "all") return [];

    const uniqueNames = new Set([
      ...modifierNames.prefixes,
      ...modifierNames.suffixes,
    ]);

    return Array.from(uniqueNames).sort();
  }, [modifierNames.prefixes, modifierNames.suffixes, filterType]);

  const getMatchPattern = useCallback((modText) => {
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
  }, []);

  const getBaseEffectKey = useCallback((modText) => {
    return modText
      .replace(/(\d+(?:\.\d+)?)(%|\s|$)/g, "X$2")
      .replace(/\s+/g, " ")
      .trim();
  }, []);

  const nameTagsToDisplay = useMemo(() => {
    const getGroupForName = (name) => {
      return nameToGroupMap[name] || null;
    };

    let names = [];
    if (filterType === "all") {
      names = combinedUniqueNames;
    } else if (filterType === "prefix") {
      names = modifierNames.prefixes;
    } else {
      names = modifierNames.suffixes;
    }

    const result = [];
    const processedGroups = new Set();

    names.forEach((name) => {
      const group = getGroupForName(name);

      if (group && !processedGroups.has(group)) {
        result.push({ isGroup: true, name: group });
        processedGroups.add(group);
      } else if (!group) {
        result.push({ isGroup: false, name });
      }
    });

    return result.sort((a, b) => a.name.localeCompare(b.name));
  }, [filterType, modifierNames, combinedUniqueNames, nameToGroupMap]);

  return {
    searchTerm,
    setSearchTerm,
    filterType,
    setFilterType,
    viewByName,
    setViewByName,
    selectedNames,
    setSelectedNames,
    nameSearchTerm,
    setNameSearchTerm,
    selectedGroupNames,
    handleSearchTermChange,
    handleFilterTypeChange,
    handleViewModeChange,
    handleNameSelection,
    modifierGroups,
    nameToGroupMap,
    getNamesInGroup,
    modifierNames,
    combinedUniqueNames,
    nameTagsToDisplay,
    getMatchPattern,
    getBaseEffectKey,
  };
};