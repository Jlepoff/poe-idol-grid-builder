import React, { useState, useEffect, useCallback } from "react";

function IdolPasteHandler({ onAddIdol, modData }) {
  const normalize = useCallback(
    (str) => str.replace(/\s+/g, " ").trim(),
    []
  );

  const areModsEquivalent = useCallback((mod1, mod2) => {
    // Clean and normalize the text for both mods
    const norm1 = normalize(mod1).replace(/[\u2013\u2014\u2212]/g, '-');
    const norm2 = normalize(mod2).replace(/[\u2013\u2014\u2212]/g, '-');

    // If they're exactly the same, no need for further checks
    if (norm1 === norm2) return true;

    // Handle variations of "an additional" vs "1 additional" etc.
    const additionalPattern1 = norm1.replace(/\b(?:an|a|1|one)\s+additional\b/g, "NUMBER additional");
    const additionalPattern2 = norm2.replace(/\b(?:an|a|1|one)\s+additional\b/g, "NUMBER additional");
    
    if (additionalPattern1 === additionalPattern2) return true;

    // List of common modifier patterns to normalize
    const poePatterns = [
        // Percentage values (like "25%" -> "PERCENTAGE")
        { regex: /(\d+(?:\.\d+)?)%/g, replace: "PERCENTAGE" },
        
        // "+X%" values (like "+25%" -> "+PERCENTAGE")
        { regex: /\+(\d+(?:\.\d+)?)%/g, replace: "+PERCENTAGE" },
        
        // Plain "+X" values (like "+3" -> "+NUMBER")
        { regex: /\+(\d+(?:\.\d+)?)\b(?!%)/g, replace: "+NUMBER" },
        
        // "X additional" pattern
        { regex: /(\d+(?:\.\d+)?)\s+additional/g, replace: "NUMBER additional" },
        
        // "lasts X additional seconds" pattern
        { regex: /lasts\s+(\d+(?:\.\d+)?)\s+additional\s+seconds/g, replace: "lasts NUMBER additional seconds" },
        
        // "have X% chance" variations
        { regex: /have\s+(?:a\s+)?(\d+(?:\.\d+)?)%\s+(?:increased\s+)?chance/g, replace: "have PERCENTAGE chance" },
        
        // Plain "X% chance" pattern
        { regex: /(\d+(?:\.\d+)?)%\s+chance/g, replace: "PERCENTAGE chance" },
        
        // Common modifier words with numbers
        { regex: /(\d+(?:\.\d+)?)\s+(increased|more|reduced|faster|slower)/g, replace: "NUMBER $2" },
        
        // "contain X additional" pattern
        { regex: /contain\s+(\d+(?:\.\d+)?)\s+additional/g, replace: "contain NUMBER additional" },
        
        // Life missing pattern for Expedition mods
        { regex: /spawn\s+with\s+(?:an\s+)?(?:additional\s+)?(\d+(?:\.\d+)?)%\s+of\s+Life\s+missing/g, 
          replace: "spawn with PERCENTAGE of Life missing" }
    ];

    // Try each pattern one by one
    for (const { regex, replace } of poePatterns) {
        const normalized1 = norm1.replace(regex, replace);
        const normalized2 = norm2.replace(regex, replace);
        
        if (normalized1 === normalized2) {
            return true;
        }
    }
    
    // Last resort: try normalizing ALL numbers if the strings are similar enough
    const allNumbersReplaced1 = norm1.replace(/\d+(?:\.\d+)?/g, "NUMBER");
    const allNumbersReplaced2 = norm2.replace(/\d+(?:\.\d+)?/g, "NUMBER");
    
    // Helper function to check if two strings are similar enough
    // to avoid false positive matches
    const areSimilarEnough = (s1, s2) => {
        // Remove all numbers for comparison
        const textOnly1 = s1.replace(/\d+(?:\.\d+)?/g, "");
        const textOnly2 = s2.replace(/\d+(?:\.\d+)?/g, "");
        
        // If they're identical after removing numbers, that's a good match
        if (textOnly1 === textOnly2) return true;
        
        // For longer strings, check for substantial similarity
        if (textOnly1.length > 15 && textOnly2.length > 15) {
            // Use 80% of the shorter string as our comparison length
            const minLength = Math.min(textOnly1.length, textOnly2.length);
            const comparisonLength = Math.floor(minLength * 0.8);
            
            // Check if either string contains a large portion of the other
            const sample1 = textOnly1.substring(0, comparisonLength);
            const sample2 = textOnly2.substring(0, comparisonLength);
            
            return textOnly1.includes(sample2) || textOnly2.includes(sample1);
        }
        
        return false;
    };
    
    // If the strings match after replacing all numbers AND they're similar enough,
    // consider them equivalent
    if (allNumbersReplaced1 === allNumbersReplaced2 && areSimilarEnough(norm1, norm2)) {
        return true;
    }

    // No match found
    return false;
  }, [normalize]);

  const parseIdolText = useCallback(
    (text) => {
      try {
        const lines = text.split("\n").filter((line) => line.trim() !== "");

        if (!lines.some((line) => line.includes("Item Class: Idols"))) {
          return { success: false, error: "Not an idol item" };
        }

        let name = "";
        let type = "";
        let itemLevel = 0;
        let rarity = "";

        const rarityLine = lines.find((line) => line.startsWith("Rarity:"));
        rarity = rarityLine ? rarityLine.replace("Rarity: ", "").trim() : "";

        const rarityIndex = lines.findIndex((line) => line.startsWith("Rarity:"));
        if (rarityIndex >= 0 && rarityIndex + 1 < lines.length) {
          name = lines[rarityIndex + 1].trim();
        }

        if (rarityIndex >= 0 && rarityIndex + 2 < lines.length) {
          const typeLine = lines[rarityIndex + 2].trim();
          if (typeLine.includes("Idol")) {
            type = typeLine.split(" ")[0];
          }
        }

        if (rarity.toLowerCase() === "magic" && name) {
          const match = name.match(/(\w+)\s+Idol/i);
          if (match && match[1]) type = match[1];
        }

        const itemLevelLine = lines.find((line) => line.includes("Item Level:"));
        if (itemLevelLine) {
          const match = itemLevelLine.match(/Item Level: (\d+)/);
          if (match && match[1]) itemLevel = parseInt(match[1]);
        }

        const separatorIndices = [];
        lines.forEach((line, index) => {
          if (line.trim() === "--------") separatorIndices.push(index);
        });

        // Handle unique idols
        if (rarity.toLowerCase() === "unique") {
          let modStart = -1;
          let modEnd = -1;

          for (let i = 0; i < separatorIndices.length - 1; i++) {
            if (
              lines
                .slice(separatorIndices[i] + 1, separatorIndices[i + 1])
                .some((l) => l.includes("(implicit)"))
            ) {
              modStart = separatorIndices[i + 1] + 1;
              break;
            }
          }

          if (modStart === -1) {
            for (let i = 0; i < separatorIndices.length - 1; i++) {
              if (
                lines
                  .slice(separatorIndices[i] + 1, separatorIndices[i + 1])
                  .some((l) => l.includes("Item Level:"))
              ) {
                modStart = separatorIndices[i + 1] + 1;
                break;
              }
            }
          }

          for (let i = 0; i < separatorIndices.length - 1; i++) {
            if (modStart !== -1 && separatorIndices[i] > modStart) {
              modEnd = separatorIndices[i];
              break;
            }
          }

          const uniqueModifiers = [];
          if (modStart !== -1 && modEnd !== -1) {
            let currentMod = "";
            for (let i = modStart; i < modEnd; i++) {
              const line = lines[i].trim();
              if (line && !line.includes("(implicit)")) {
                if (currentMod === "" || /^[A-Z]/.test(line)) {
                  if (currentMod) {
                    uniqueModifiers.push({
                      Mod: currentMod,
                      Name: "Unique",
                      Code: `Unique-${Date.now()}-${Math.random()}`,
                    });
                  }
                  currentMod = line;
                } else {
                  currentMod += " " + line;
                }
              }
            }
            if (currentMod) {
              uniqueModifiers.push({
                Mod: currentMod,
                Name: "Unique",
                Code: `Unique-${Date.now()}-${Math.random()}`,
              });
            }
          }

          return {
            success: true,
            idol: {
              type,
              name,
              isUnique: true,
              uniqueModifiers,
              uniqueName: name,
              prefixes: [],
              suffixes: [],
              id: Date.now() + Math.random(),
              itemLevel,
            },
          };
        }

        // For non-unique idols, find the modifier section
        let modStart = -1;
        let modEnd = -1;
        if (separatorIndices.length >= 4) {
          modStart = separatorIndices[2] + 1;
          modEnd = separatorIndices[3];
        }

        // Extract lines that contain mod text
        const modLines = [];
        if (modStart !== -1 && modEnd !== -1) {
          for (let i = modStart; i < modEnd; i++) {
            const line = lines[i].trim();
            if (line && !line.includes("(implicit)")) {
              modLines.push(line);
            }
          }
        }

        // Improved modifier construction algorithm
        const constructModifiers = (modLines) => {
          const allMods = [
            ...Object.values(modData.prefixes).flat(),
            ...Object.values(modData.suffixes).flat(),
          ];
          
          const result = [];
          let currentMod = "";
          let i = 0;
          
          while (i < modLines.length) {
            const line = modLines[i].trim();
            
            if (currentMod === "") {
              currentMod = line;
              i++;
              continue;
            }
            
            const combinedMod = currentMod + " " + line;
            const combinedIsKnown = allMods.some((m) =>
              areModsEquivalent(m.Mod, combinedMod)
            );
            const current = currentMod;
            const currentIsKnown = allMods.some((m) =>
              areModsEquivalent(m.Mod, current)
            );
            
            const nextLineStartsNewMod =
              /^[A-Z]/.test(line) ||
              line.includes("your Maps") ||
              line.includes("Maps") ||
              line.match(/^\d+%/) ||
              line.includes("chance to");
            
            if (combinedIsKnown) {
              currentMod = combinedMod;
              i++;
            } else if (currentIsKnown && nextLineStartsNewMod) {
              result.push(currentMod);
              currentMod = line;
              i++;
            } else {
              let foundMatch = false;
              for (
                let lookahead = 1;
                lookahead <= 3 && i + lookahead - 1 < modLines.length;
                lookahead++
              ) {
                const testMod =
                  currentMod +
                  " " +
                  modLines.slice(i, i + lookahead).join(" ");
                if (
                  allMods.some((m) => areModsEquivalent(m.Mod, testMod))
                ) {
                  currentMod = testMod;
                  i += lookahead;
                  foundMatch = true;
                  break;
                }
              }
              
              if (!foundMatch) {
                if (nextLineStartsNewMod) {
                  result.push(currentMod);
                  currentMod = line;
                } else {
                  currentMod += " " + line;
                }
                i++;
              }
            }
          }
          
          if (currentMod) {
            result.push(currentMod);
          }
          
          return result;
        };

        const processedModLines = constructModifiers(modLines);
        
        const prefixes = [];
        const suffixes = [];
        const allPrefixes = Object.values(modData.prefixes).flat();
        const allSuffixes = Object.values(modData.suffixes).flat();

        for (const modLine of processedModLines) {
          if (!modLine) continue;

          let found = false;

          // First try to match with known prefixes
          for (const prefix of allPrefixes) {
            if (areModsEquivalent(prefix.Mod, modLine)) {
              prefixes.push({ 
                ...prefix, 
                Mod: modLine,
                id: prefix.id 
              });
              found = true;
              break;
            }
          }

          // If not a prefix, try suffixes
          if (!found) {
            for (const suffix of allSuffixes) {
              if (areModsEquivalent(suffix.Mod, modLine)) {
                suffixes.push({ 
                  ...suffix, 
                  Mod: modLine,
                  id: suffix.id 
                });
                found = true;
                break;
              }
            }
          }

          // If still not found, use heuristics to determine type
          if (!found) {
            if (determineModifierType(modLine) === "prefix") {
              prefixes.push({
                Name: "Unknown Prefix",
                Mod: modLine,
                Code: `Unknown-${Date.now()}-${Math.random()}`,
                Family: "Unknown",
              });
            } else {
              suffixes.push({
                Name: "Unknown Suffix",
                Mod: modLine,
                Code: `Unknown-${Date.now()}-${Math.random()}`,
                Family: "Unknown",
              });
            }
          }
        }

        return {
          success: true,
          idol: {
            type,
            name,
            prefixes,
            suffixes,
            id: Date.now() + Math.random(),
            isUnique: false,
            itemLevel,
            isMagic: rarity.toLowerCase() === "magic",
          },
        };
      } catch (error) {
        console.error("Error parsing idol:", error);
        return { success: false, error: error.message };
      }
    },
    [modData, areModsEquivalent] // removed normalize dependency here
  );

  function determineModifierType(modText) {
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

  useEffect(() => {
    const handlePaste = (e) => {
      if (
        e.target.tagName === "INPUT" ||
        e.target.tagName === "TEXTAREA" ||
        e.target.tagName === "SELECT"
      ) {
        return;
      }

      const text = e.clipboardData.getData("text");
      if (text.includes("Item Class: Idols")) {
        e.preventDefault();

        const result = parseIdolText(text);
        if (result.success) {
          setParsedIdol(result.idol);
          setParseError(null);
        } else {
          setParsedIdol(null);
          setParseError(result.error);
        }

        setShowPrompt(true);
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [parseIdolText]);

  const [showPrompt, setShowPrompt] = useState(false);
  const [parseError, setParseError] = useState(null);
  const [parsedIdol, setParsedIdol] = useState(null);

  const handleAddParsedIdol = () => {
    if (parsedIdol) {
      onAddIdol(parsedIdol);
      setShowPrompt(false);
      setParsedIdol(null);
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed inset-0 bg-slate-950 bg-opacity-80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-xl p-6 max-w-lg w-full shadow-lg border border-slate-800">
        <div className="flex justify-between items-start mb-5">
          <h2 className="text-xl font-bold text-white">Idol Detected</h2>
          <button
            onClick={() => setShowPrompt(false)}
            className="text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {parseError ? (
          <div className="bg-red-900 bg-opacity-50 p-4 rounded-lg mb-5 border border-red-800">
            <p className="text-red-200">Error parsing idol: {parseError}</p>
          </div>
        ) : parsedIdol ? (
          <div className="mb-5">
            <p className="mb-3 text-slate-300">Successfully parsed idol:</p>
            <div className="bg-slate-800 p-4 rounded-lg">
              <div className="font-bold text-indigo-300">{parsedIdol.name}</div>
              <div className="text-slate-300">{parsedIdol.type} Idol</div>

              <div className="mt-3 space-y-3">
                {parsedIdol.isUnique ? (
                  <>
                    <div className="text-purple-400 font-semibold">
                      Unique Modifiers:
                    </div>
                    {parsedIdol.uniqueModifiers?.length > 0 ? (
                      <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">
                        {parsedIdol.uniqueModifiers.map((mod, idx) => (
                          <li key={`unique-mod-${idx}`}>{mod.Mod}</li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-slate-400 text-sm">
                        No modifiers found
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="text-blue-400 font-semibold">
                      Prefixes:
                    </div>
                    {parsedIdol.prefixes?.length > 0 ? (
                      <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">
                        {parsedIdol.prefixes.map((prefix, idx) => (
                          <li key={`prefix-${idx}`}>{prefix.Mod}</li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-slate-400 text-sm">
                        No prefixes
                      </div>
                    )}

                    <div className="text-green-400 font-semibold">
                      Suffixes:
                    </div>
                    {parsedIdol.suffixes?.length > 0 ? (
                      <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">
                        {parsedIdol.suffixes.map((suffix, idx) => (
                          <li key={`suffix-${idx}`}>{suffix.Mod}</li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-slate-400 text-sm">
                        No suffixes
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-5">
            <p className="text-slate-300">Parsing idol text...</p>
          </div>
        )}

        <div className="flex space-x-4 justify-end">
          <button
            onClick={() => setShowPrompt(false)}
            className="bg-slate-800 hover:bg-slate-700 py-2.5 px-4 rounded-lg text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAddParsedIdol}
            className={`${
              parsedIdol
                ? "bg-indigo-600 hover:bg-indigo-500"
                : "bg-slate-700 cursor-not-allowed"
            } py-2.5 px-4 rounded-lg text-sm font-medium shadow-sm transition-colors`}
            disabled={!parsedIdol}
          >
            Add to Inventory
          </button>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800">
          <p className="text-sm text-slate-400">
            <span className="font-semibold">Tip:</span> Copy any idol text from
            Path of Exile (Ctrl+V) to add it to your inventory.
          </p>
        </div>
      </div>
    </div>
  );
}

export default IdolPasteHandler;