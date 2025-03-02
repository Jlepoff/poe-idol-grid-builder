// utils/tradeUtils.js

/**
 * Extracts numeric values only for "contain X additional" pattern
 * @param {string} modText - The modifier text to analyze
 * @returns {number|null} - The extracted numeric value or null if not found
 */
function extractNumericValue(modText) {
  // "contain X additional" pattern - explicitly looks for a number followed by "additional"
  const additionalMatch = modText.match(/contain\s+(\d+)\s+additional/i);
  if (additionalMatch) {
    return parseInt(additionalMatch[1], 10);
  }

  return null;
}

/**
 * Clean modifier ID by removing leading period if present
 * This handles our workaround for duplicate IDs
 * @param {string} id - The modifier ID which may have a leading period
 * @returns {string} - The cleaned ID for use in trade site queries
 */
function cleanModifierId(id) {
  if (id && id.startsWith('.')) {
    return id.substring(1); // Remove the leading period
  }
  return id;
}

/**
 * Generates a Path of Exile trade URL for an idol based on its modifiers
 * @param {Object} idol - The idol object with modifiers
 * @returns {string} - The formatted trade URL
 */
export const generateTradeUrl = (idol) => {
  // Skip if no idol provided
  if (!idol) return "";

  // Handle unique idols differently
  if (idol.isUnique) {
    // Build query for unique idol by name
    const query = {
      query: {
        name: idol.uniqueName || idol.name,
        type: `${idol.type} Idol`,
        stats: [{ type: "and", filters: [] }],
        status: {
          option: "online",
        },
      },
    };

    // Convert to JSON and encode for URL
    const encodedQuery = encodeURIComponent(JSON.stringify(query));

    // Return the full URL
    return `https://www.pathofexile.com/trade/search/Phrecia?q=${encodedQuery}`;
  }

  // For normal idols, create filters with values where applicable
  const filters = [];

  // Process prefixes
  if (idol.prefixes && idol.prefixes.length > 0) {
    idol.prefixes.forEach(prefix => {
      if (prefix.id) {
        // Clean the ID by removing any leading period
        const cleanId = cleanModifierId(prefix.id);
        const numericValue = extractNumericValue(prefix.Mod);

        if (numericValue !== null) {
          // Add filter with value - only for "contain X additional" pattern
          filters.push({
            id: cleanId,
            value: {
              min: numericValue,
              max: numericValue
            },
            disabled: false
          });
        } else {
          // Add filter without value
          filters.push({ id: cleanId });
        }
      }
    });
  }

  // Process suffixes
  if (idol.suffixes && idol.suffixes.length > 0) {
    idol.suffixes.forEach(suffix => {
      if (suffix.id) {
        // Clean the ID by removing any leading period
        const cleanId = cleanModifierId(suffix.id);
        const numericValue = extractNumericValue(suffix.Mod);

        if (numericValue !== null) {
          // Add filter with value - only for "contain X additional" pattern
          filters.push({
            id: cleanId,
            value: {
              min: numericValue,
              max: numericValue
            },
            disabled: false
          });
        } else {
          // Add filter without value
          filters.push({ id: cleanId });
        }
      }
    });
  }

  // If no valid filters, return empty string
  if (filters.length === 0) return "";

  // Build the trade query
  const query = {
    query: {
      stats: [
        {
          type: "and",
          filters: filters
        }
      ],
      status: {
        option: "online"
      }
    }
  };

  // Convert to JSON and encode for URL
  const encodedQuery = encodeURIComponent(JSON.stringify(query));

  // Return the full URL
  return `https://www.pathofexile.com/trade/search/Phrecia?q=${encodedQuery}`;
};

/**
 * Checks if an idol has valid trade data
 * @param {Object} idol - The idol object with modifiers
 * @returns {boolean} - Whether the idol has valid trade data
 */
export const hasValidTradeData = (idol) => {
  if (!idol) return false;

  // Unique idols can always be traded by name
  if (idol.isUnique) return true;

  // Check prefixes for valid IDs
  const hasValidPrefix =
    idol.prefixes &&
    idol.prefixes.length > 0 &&
    idol.prefixes.some((prefix) => !!prefix.id);

  // Check suffixes for valid IDs
  const hasValidSuffix =
    idol.suffixes &&
    idol.suffixes.length > 0 &&
    idol.suffixes.some((suffix) => !!suffix.id);

  return hasValidPrefix || hasValidSuffix;
};