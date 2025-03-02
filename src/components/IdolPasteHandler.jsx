import React, { useState, useEffect, useCallback } from "react";

function IdolPasteHandler({ onAddIdol, modData }) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [parseError, setParseError] = useState(null);
  const [parsedIdol, setParsedIdol] = useState(null);

  const parseIdolText = useCallback(
    (text) => {
      try {
        const lines = text.split("\n").filter((line) => line.trim() !== "");
        console.log("DEBUG: Raw lines:", lines);

        if (!lines.some((line) => line.includes("Item Class: Idols"))) {
          return { success: false, error: "Not an idol item" };
        }

        let name = "";
        let type = "";
        let itemLevel = 0;
        let rarity = "";

        const rarityLine = lines.find((line) => line.startsWith("Rarity:"));
        rarity = rarityLine ? rarityLine.replace("Rarity: ", "").trim() : "";

        const rarityIndex = lines.findIndex((line) =>
          line.startsWith("Rarity:")
        );
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

        const itemLevelLine = lines.find((line) =>
          line.includes("Item Level:")
        );
        if (itemLevelLine) {
          const match = itemLevelLine.match(/Item Level: (\d+)/);
          if (match && match[1]) itemLevel = parseInt(match[1]);
        }

        const separatorIndices = [];
        lines.forEach((line, index) => {
          if (line.trim() === "--------") separatorIndices.push(index);
        });
        console.log("DEBUG: Separator indices:", separatorIndices);

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
          console.log("DEBUG: Unique modifiers:", uniqueModifiers);

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
        console.log("DEBUG: Mod section start/end:", modStart, modEnd);

        const processedModLines = [];
        if (modStart !== -1 && modEnd !== -1) {
          let currentMod = "";
          const allMods = [
            ...Object.values(modData.prefixes).flat(),
            ...Object.values(modData.suffixes).flat(),
          ];

          for (let i = modStart; i < modEnd; i++) {
            const line = lines[i].trim();
            if (!line || line.includes("(implicit)")) continue;

            const prevMod = currentMod;
            currentMod = currentMod ? `${currentMod} ${line}` : line;
            console.log("DEBUG: Building mod:", currentMod);

            const isCompleteMod = allMods.some((mod) => {
              const matches = areModsEquivalent(mod.Mod, currentMod);
              if (matches) console.log("DEBUG: Matches mod in data:", mod);
              return matches;
            });
            console.log("DEBUG: Is complete mod?", isCompleteMod);

            if (isCompleteMod) {
              processedModLines.push(currentMod);
              console.log("DEBUG: Complete mod found:", currentMod);
              currentMod = "";
            } else {
              const nextIndex = i + 1;
              const hasNextLine = nextIndex < modEnd && lines[nextIndex].trim();
              if (!hasNextLine) {
                if (currentMod) {
                  processedModLines.push(currentMod);
                  console.log("DEBUG: End of section, saving:", currentMod);
                }
                currentMod = "";
              } else {
                const nextLine = lines[nextIndex].trim();
                if (/^[A-Z]/.test(nextLine)) {
                  const couldBePartial = allMods.some((mod) =>
                    normalize(mod.Mod).startsWith(normalize(prevMod))
                  );
                  console.log("DEBUG: Could be partial with prevMod?", couldBePartial);

                  if (!couldBePartial && prevMod) {
                    processedModLines.push(prevMod);
                    console.log("DEBUG: New mod detected, saving:", prevMod);
                    currentMod = line;
                  }
                }
              }
            }
          }
          if (currentMod) {
            processedModLines.push(currentMod);
            console.log("DEBUG: Final mod saved:", currentMod);
          }
        }
        console.log("DEBUG: Processed mod lines:", processedModLines);

        const prefixes = [];
        const suffixes = [];
        const allPrefixes = Object.values(modData.prefixes).flat();
        const allSuffixes = Object.values(modData.suffixes).flat();

        for (const modLine of processedModLines) {
          if (!modLine) continue; // Skip empty entries

          let found = false;

          for (const prefix of allPrefixes) {
            if (areModsEquivalent(prefix.Mod, modLine)) {
              prefixes.push({ ...prefix, Mod: modLine });
              console.log("DEBUG: Matched prefix:", modLine, prefix);
              found = true;
              break;
            }
          }

          if (!found) {
            for (const suffix of allSuffixes) {
              if (areModsEquivalent(suffix.Mod, modLine)) {
                suffixes.push({ ...suffix, Mod: modLine });
                console.log("DEBUG: Matched suffix:", modLine, suffix);
                found = true;
                break;
              }
            }
          }

          if (!found) {
            console.log("DEBUG: No exact match for:", modLine);
            if (
              modLine.includes("your Maps") ||
              modLine.includes("increased chance to contain") ||
              modLine.includes("Maps contain") ||
              modLine.includes("Map contains") ||
              modLine.includes("chance to contain an") ||
              modLine.includes("chance to contain a")
            ) {
              prefixes.push({
                Name: "Unknown Prefix",
                Mod: modLine,
                Code: `Unknown-${Date.now()}-${Math.random()}`,
                Family: "Unknown",
              });
              console.log("DEBUG: Assigned as unknown prefix:", modLine);
            } else {
              suffixes.push({
                Name: "Unknown Suffix",
                Mod: modLine,
                Code: `Unknown-${Date.now()}-${Math.random()}`,
                Family: "Unknown",
              });
              console.log("DEBUG: Assigned as unknown suffix:", modLine);
            }
          }
        }

        console.log("DEBUG: Final prefixes:", prefixes);
        console.log("DEBUG: Final suffixes:", suffixes);

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
    [modData]
  );

  const normalize = (str) => str.replace(/\s+/g, " ").trim();

  const areModsEquivalent = (mod1, mod2) => {
    const norm1 = normalize(mod1);
    const norm2 = normalize(mod2);
    if (norm1 === norm2) return true;

    const pattern1 = norm1.replace(/\d+(\.\d+)?%?/g, "X");
    const pattern2 = norm2.replace(/\d+(\.\d+)?%?/g, "X");
    return pattern1 === pattern2;
  };

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
                    <div className="text-purple-400 font-semibold">
                      Unique Modifiers:
                    </div>
                    {parsedIdol.uniqueModifiers?.length > 0 ? (
                      <ul className="list-disc list-inside text-sm">
                        {parsedIdol.uniqueModifiers.map((mod, idx) => (
                          <li key={`unique-mod-${idx}`}>{mod.Mod}</li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-gray-400 text-sm">
                        No modifiers found
                      </div>
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

                    <div className="text-green-400 font-semibold mt-1">
                      Suffixes:
                    </div>
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
            className={`${
              parsedIdol
                ? "bg-green-600 hover:bg-green-500"
                : "bg-gray-600 cursor-not-allowed"
            } py-2 px-4 rounded`}
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