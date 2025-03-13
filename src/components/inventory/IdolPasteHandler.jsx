// components/inventory/IdolPasteHandler.jsx
import React, { useState, useEffect, useCallback } from "react";
import Modal from "../common/Modal";
import Button from "../common/Button";
import { areModsEquivalent, determineModifierType } from "../../utils/modifiers/modifierUtils";

function IdolPasteHandler({ onAddIdol, modData }) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [parseError, setParseError] = useState(null);
  const [parsedIdol, setParsedIdol] = useState(null);

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
                      id: `unique-${Date.now()}-${Math.random()}`,
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
                id: `unique-${Date.now()}-${Math.random()}`,
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

        // Handle normal or magic idols
        let modStart = -1;
        let modEnd = -1;
        
        if (separatorIndices.length >= 4) {
          modStart = separatorIndices[2] + 1;
          modEnd = separatorIndices[3];
        }

        const modLines = [];
        if (modStart !== -1 && modEnd !== -1) {
          for (let i = modStart; i < modEnd; i++) {
            const line = lines[i].trim();
            if (line && !line.includes("(implicit)")) {
              modLines.push(line);
            }
          }
        }

        // Process mod lines
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
            const combinedIsKnown = allMods.some((m) => areModsEquivalent(m.Mod, combinedMod));
            const current = currentMod;
            const currentIsKnown = allMods.some((m) => areModsEquivalent(m.Mod, current));
            
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
              for (let lookahead = 1; lookahead <= 3 && i + lookahead - 1 < modLines.length; lookahead++) {
                const testMod = currentMod + " " + modLines.slice(i, i + lookahead).join(" ");
                if (allMods.some((m) => areModsEquivalent(m.Mod, testMod))) {
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
        
        // Detect prefixes and suffixes
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
                Mod: modLine
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
                  Mod: modLine
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
                id: `unknown-${Date.now()}-${Math.random()}`
              });
            } else {
              suffixes.push({
                Name: "Unknown Suffix",
                Mod: modLine,
                id: `unknown-${Date.now()}-${Math.random()}`
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
        return { success: false, error: error.message };
      }
    },
    [modData]
  );

  useEffect(() => {
    const handlePaste = (e) => {
      const target = e.target;
      const isFormElement = target.tagName === "INPUT" || 
                            target.tagName === "TEXTAREA" || 
                            target.tagName === "SELECT" ||
                            target.isContentEditable;
      const hasEditableParent = target.closest('[contenteditable="true"]');
      
      const rawText = e.clipboardData.getData("text");
      const normalizedText = rawText.trim().toLowerCase();

      if (normalizedText.includes("item class: idols")) {
        e.preventDefault();
        e.stopPropagation();

        const result = parseIdolText(rawText);
        if (result.success) {
          setParsedIdol(result.idol);
          setParseError(null);
        } else {
          setParsedIdol(null);
          setParseError(result.error);
        }

        setShowPrompt(true);
      } else if (isFormElement || hasEditableParent) {
        return;
      }
    };

    document.addEventListener("paste", handlePaste, true);
    return () => document.removeEventListener("paste", handlePaste, true);
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
    <Modal
      isOpen={showPrompt}
      onClose={() => setShowPrompt(false)}
      title="Idol Detected"
    >
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
        <Button 
          variant="secondary" 
          onClick={() => setShowPrompt(false)}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleAddParsedIdol}
          disabled={!parsedIdol}
        >
          Add to Inventory
        </Button>
      </div>
    </Modal>
  );
}

export default IdolPasteHandler;