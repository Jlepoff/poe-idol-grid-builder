// components/IdolPasteHandler.jsx
import React, { useState, useEffect, useCallback } from "react";

function IdolPasteHandler({ onAddIdol, modData }) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [parseError, setParseError] = useState(null);
  const [parsedIdol, setParsedIdol] = useState(null);

  // Parse idol text copied from the game
  const parseIdolText = useCallback(
    (text) => {
      try {
        // Split by lines and remove empty ones
        const lines = text.split("\n").filter((line) => line.trim() !== "");

        // Verify it's an idol item
        if (!lines.some((line) => line.includes("Item Class: Idols"))) {
          return { success: false, error: "Not an idol item" };
        }

        // Extract basic item info
        let name = "";
        let type = "";
        let itemLevel = 0;
        let rarity = "";

        // Get rarity
        const rarityLine = lines.find((line) => line.startsWith("Rarity:"));
        rarity = rarityLine ? rarityLine.replace("Rarity: ", "").trim() : "";

        // Find name (line after rarity)
        const rarityIndex = lines.findIndex((line) =>
          line.startsWith("Rarity:")
        );
        if (rarityIndex >= 0 && rarityIndex + 1 < lines.length) {
          name = lines[rarityIndex + 1].trim();
        }

        // Extract type based on name/format
        if (rarityIndex >= 0 && rarityIndex + 2 < lines.length) {
          const typeLine = lines[rarityIndex + 2].trim();
          if (typeLine.includes("Idol")) {
            type = typeLine.split(" ")[0]; // Get "Minor", "Kamasan", etc.
          }
        }

        // For magic idols, extract type from the name
        if (rarity.toLowerCase() === "magic" && name) {
          // Find the word before "Idol" in the name
          const match = name.match(/(\w+)\s+Idol/i);
          if (match && match[1]) {
            type = match[1]; // This will be the idol type.
          }
        }

        // Extract item level
        const itemLevelLine = lines.find((line) =>
          line.includes("Item Level:")
        );
        if (itemLevelLine) {
          const match = itemLevelLine.match(/Item Level: (\d+)/);
          if (match && match[1]) {
            itemLevel = parseInt(match[1]);
          }
        }

        // Find sections separated by dashes
        const separatorIndices = [];
        lines.forEach((line, index) => {
          if (line.trim() === "--------") {
            separatorIndices.push(index);
          }
        });

        // For unique idols, we need to extract the mod lines differently
        if (rarity.toLowerCase() === "unique") {
          // Extract the unique mods - they're usually between implicit and flavor text
          let modStart = -1;
          let modEnd = -1;

          // Find where implicits end (if any)
          for (let i = 0; i < separatorIndices.length - 1; i++) {
            // Check if there's an implicit section
            if (
              lines
                .slice(separatorIndices[i] + 1, separatorIndices[i + 1])
                .some((l) => l.includes("(implicit)"))
            ) {
              modStart = separatorIndices[i + 1] + 1;
              break;
            }
          }

          // If we didn't find implicits, look for the first section after item level
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

          // Find where the flavor text starts
          for (let i = 0; i < separatorIndices.length - 1; i++) {
            if (modStart !== -1 && separatorIndices[i] > modStart) {
              modEnd = separatorIndices[i];
              break;
            }
          }

          // If we found the mod section
          const uniqueModifiers = [];
          if (modStart !== -1 && modEnd !== -1) {
            for (let i = modStart; i < modEnd; i++) {
              const line = lines[i].trim();
              if (line && !line.includes("(implicit)")) {
                uniqueModifiers.push({
                  Mod: line,
                  Name: "Unique",
                  Code: `Unique-${Date.now()}-${Math.random()}`,
                });
              }
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

        // For non-unique idols, extract mod lines
        // Extract mod lines
        const modLines = [];
        if (separatorIndices.length >= 4) {
          let modStart = separatorIndices[2] + 1;
          let modEnd = separatorIndices[3];

          // Add non-implicit mod lines
          for (let i = modStart; i < modEnd; i++) {
            const line = lines[i].trim();
            if (line && !line.includes("(implicit)")) {
              modLines.push(line);
            }
          }
        }

        // Match mods to known prefixes/suffixes
        const prefixes = [];
        const suffixes = [];

        // Flatten all available mods for easier searching
        const allPrefixes = Object.values(modData.prefixes).flat();
        const allSuffixes = Object.values(modData.suffixes).flat();

        // Process each mod line
        for (const modLine of modLines) {
          let found = false;

          // Try to match against prefixes
          for (const prefix of allPrefixes) {
            if (areModsEquivalent(prefix.Mod, modLine)) {
              prefixes.push({
                ...prefix,
                Mod: modLine, // Use actual mod text from game
              });
              found = true;
              break;
            }
          }

          // If not found in prefixes, try suffixes
          if (!found) {
            for (const suffix of allSuffixes) {
              if (areModsEquivalent(suffix.Mod, modLine)) {
                suffixes.push({
                  ...suffix,
                  Mod: modLine,
                });
                found = true;
                break;
              }
            }
          }

          // If we couldn't identify the mod, make a guess based on content
          if (!found) {
            if (
              modLine.includes("your Maps") ||
              modLine.includes("increased chance to contain") ||
              modLine.includes("Maps contain")
            ) {
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

        // Create the idol object
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

  // Helper to compare modifier text patterns
  const areModsEquivalent = (mod1, mod2) => {
    // Remove numbers to compare structure
    const pattern1 = mod1.replace(/\d+(\.\d+)?%?/g, "X").trim();
    const pattern2 = mod2.replace(/\d+(\.\d+)?%?/g, "X").trim();

    return pattern1 === pattern2;
  };

  // Set up paste event listener
  useEffect(() => {
    const handlePaste = (e) => {
      // Ignore if focused on an input
      if (
        e.target.tagName === "INPUT" ||
        e.target.tagName === "TEXTAREA" ||
        e.target.tagName === "SELECT"
      ) {
        return;
      }

      const text = e.clipboardData.getData("text");

      // Check if it's an idol
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

  // If not showing prompt, render nothing
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