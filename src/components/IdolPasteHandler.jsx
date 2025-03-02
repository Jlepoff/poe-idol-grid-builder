import React, { useState, useEffect, useCallback } from "react";
// This whole component became a rushed mess (don't judge me!)
function IdolPasteHandler({ onAddIdol, modData }) {
  const normalize = useCallback(
    (str) => str.replace(/\s+/g, " ").trim(),
    []
  );

  const areModsEquivalent = useCallback((mod1, mod2) => {
    const norm1 = normalize(mod1).replace(/[\u2013\u2014\u2212]/g, '-');
    const norm2 = normalize(mod2).replace(/[\u2013\u2014\u2212]/g, '-');
    if (norm1 === norm2) return true;

    let convertedNorm1 = norm1;
    let convertedNorm2 = norm2;
    
    const decimalMatch1 = norm1.match(/\+?(\d+\.\d+)%/);
    if (decimalMatch1) {
      convertedNorm1 = norm1.replace(/\+?(\d+\.\d+)%/, "DECIMAL_VALUE%");
    }
    
    const decimalMatch2 = norm2.match(/\+?(\d+\.\d+)%/);
    if (decimalMatch2) {
      convertedNorm2 = norm2.replace(/\+?(\d+\.\d+)%/, "DECIMAL_VALUE%");
    }
    
    convertedNorm1 = convertedNorm1.replace(/\(\d+(\.\d+)?[-\u2013\u2014\u2212]\d+(\.\d+)?\)%/g, "DECIMAL_VALUE%");
    convertedNorm2 = convertedNorm2.replace(/\(\d+(\.\d+)?[-\u2013\u2014\u2212]\d+(\.\d+)?\)%/g, "DECIMAL_VALUE%");
    
    if (convertedNorm1 === convertedNorm2) return true;

    const pattern1 = norm1.replace(/\d+(\.\d+)?%?/g, "X");
    const pattern2 = norm2.replace(/\d+(\.\d+)?%?/g, "X");
    return pattern1 === pattern2;
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

        if (rarity.toLowerCase() === "unique") {
          let modStart = -1;
          let modEnd = -1;

          for (let i = 0; i < separatorIndices.length - 1; i++) {
            if (lines.slice(separatorIndices[i] + 1, separatorIndices[i + 1]).some((l) => l.includes("(implicit)"))) {
              modStart = separatorIndices[i + 1] + 1;
              break;
            }
          }

          if (modStart === -1) {
            for (let i = 0; i < separatorIndices.length - 1; i++) {
              if (lines.slice(separatorIndices[i] + 1, separatorIndices[i + 1]).some((l) => l.includes("Item Level:"))) {
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

        let modStart = -1;
        let modEnd = -1;
        if (separatorIndices.length >= 4) {
          modStart = separatorIndices[2] + 1;
          modEnd = separatorIndices[3];
        }

        // Gather modifier lines
        const modLines = [];
        if (modStart !== -1 && modEnd !== -1) {
          for (let i = modStart; i < modEnd; i++) {
            const line = lines[i].trim();
            if (line && !line.includes("(implicit)")) {
              modLines.push(line);
            }
          }
        }

        // Process mod lines into separate modifiers
        const allMods = [
          ...Object.values(modData.prefixes).flat(),
          ...Object.values(modData.suffixes).flat(),
        ];
        
        const processedModLines = [];
        let currentMod = "";

        for (let i = 0; i < modLines.length; i++) {
          const line = modLines[i].trim();

          // If this line could be a new modifier
          if (currentMod === "" || isPotentialNewModifier(line, currentMod, allMods)) {
            if (currentMod) {
              processedModLines.push(currentMod);
            }
            currentMod = line;
          } else {
            currentMod += " " + line;
          }
        }
        if (currentMod) {
          processedModLines.push(currentMod);
        }

        const prefixes = [];
        const suffixes = [];
        const allPrefixes = Object.values(modData.prefixes).flat();
        const allSuffixes = Object.values(modData.suffixes).flat();

        for (const modLine of processedModLines) {
          if (!modLine) continue;

          let found = false;

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
    [modData, areModsEquivalent, normalize]
  );

  // Helper to determine if a line starts a new modifier
  const isPotentialNewModifier = (line, currentMod, allMods) => {
    // Check if currentMod is already a complete modifier
    const isCurrentComplete = allMods.some(mod => areModsEquivalent(mod.Mod, currentMod));
    
    // If currentMod is complete and this line looks like a new modifier
    if (isCurrentComplete) {
      // Look for typical modifier start patterns
      return (
        /^[A-Z]/.test(line) || // Starts with capital letter
        line.includes("your Maps") || // Common modifier phrase
        line.match(/\d+%/) || // Contains a percentage
        line.includes("chance to") // Common modifier phrase
      );
    }
    
    // If currentMod isn't complete, assume this is a continuation
    return false;
  };

  // Helper function to determine if a modifier is a prefix or suffix
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
      /Expeditions in your Maps have \+\d+/.test(modText) ||
      /(Blight|Delirium|Legion|Ultimatum) (Monsters|Encounters|Rewards|Bosses) in your Maps/.test(modText) ||
      /Strongboxes (in|contained in) your Maps/.test(modText) ||
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
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg p-6 max-w-lg w-full">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold">Idol Detected</h2>
          <button
            onClick={() => setShowPrompt(false)}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {parseError ? (
          <div className="bg-red-900 p-3 rounded mb-4">
            <p>Error parsing idol: {parseError}</p>
          </div>
        ) : parsedIdol ? (
          <div className="mb-4">
            <p className="mb-2">Successfully parsed idol:</p>
            <div className="bg-gray-700 p-3 rounded">
              <div className="font-bold text-yellow-400">{parsedIdol.name}</div>
              <div className="text-yellow-300">{parsedIdol.type} Idol</div>

              <div className="mt-2">
                {parsedIdol.isUnique ? (
                  <>
                    <div className="text-purple-400 font-semibold">Unique Modifiers:</div>
                    {parsedIdol.uniqueModifiers?.length > 0 ? (
                      <ul className="list-disc list-inside text-sm">
                        {parsedIdol.uniqueModifiers.map((mod, idx) => (
                          <li key={`unique-mod-${idx}`}>{mod.Mod}</li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-gray-400 text-sm">No modifiers found</div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="text-blue-400 font-semibold">Prefixes:</div>
                    {parsedIdol.prefixes?.length > 0 ? (
                      <ul className="list-disc list-inside text-sm">
                        {parsedIdol.prefixes.map((prefix, idx) => (
                          <li key={`prefix-${idx}`}>{prefix.Mod}</li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-gray-400 text-sm">No prefixes</div>
                    )}

                    <div className="text-green-400 font-semibold mt-1">Suffixes:</div>
                    {parsedIdol.suffixes?.length > 0 ? (
                      <ul className="list-disc list-inside text-sm">
                        {parsedIdol.suffixes.map((suffix, idx) => (
                          <li key={`suffix-${idx}`}>{suffix.Mod}</li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-gray-400 text-sm">No suffixes</div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-4">
            <p>Parsing idol text...</p>
          </div>
        )}

        <div className="flex space-x-4 justify-end">
          <button
            onClick={() => setShowPrompt(false)}
            className="bg-gray-600 hover:bg-gray-500 py-2 px-4 rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleAddParsedIdol}
            className={`${parsedIdol ? "bg-green-600 hover:bg-green-500" : "bg-gray-600 cursor-not-allowed"} py-2 px-4 rounded`}
            disabled={!parsedIdol}
          >
            Add to Inventory
          </button>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-700">
          <p className="text-sm text-gray-400">
            <span className="font-semibold">Tip:</span> Copy any idol text from
            Path of Exile (Ctrl+V) to add it to your inventory.
          </p>
        </div>
      </div>
    </div>
  );
}

export default IdolPasteHandler;