// utils/tradeUtils.js

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

  // For normal idols, extract modifier IDs
  const modifierIds = [];

  // Add prefix IDs
  if (idol.prefixes && idol.prefixes.length > 0) {
    idol.prefixes.forEach((prefix) => {
      if (prefix.id) {
        modifierIds.push(prefix.id);
      }
    });
  }

  // Add suffix IDs
  if (idol.suffixes && idol.suffixes.length > 0) {
    idol.suffixes.forEach((suffix) => {
      if (suffix.id) {
        modifierIds.push(suffix.id);
      }
    });
  }

  // If no valid IDs found for normal idol, return empty string
  if (modifierIds.length === 0 && !idol.isUnique) return "";

  // Build the trade query
  const query = {
    query: {
      stats: [
        {
          type: "and",
          filters: modifierIds.map((id) => ({ id })),
        },
      ],
      status: {
        option: "online",
      },
    },
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
