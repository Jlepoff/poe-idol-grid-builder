// utils/tradeUtils.js

/**
 * Generates a Path of Exile trade URL for an idol based on its modifiers
 * @param {Object} idol - The idol object with modifiers
 * @returns {string} - The formatted trade URL
 */
export const generateTradeUrl = (idol) => {
  // Skip if no idol provided
  if (!idol) return '';
  
  // Extract modifier IDs
  const modifierIds = [];
  
  // Add prefix IDs
  if (idol.prefixes && idol.prefixes.length > 0) {
    idol.prefixes.forEach(prefix => {
      if (prefix.id) {
        modifierIds.push(prefix.id);
      }
    });
  }
  
  // Add suffix IDs
  if (idol.suffixes && idol.suffixes.length > 0) {
    idol.suffixes.forEach(suffix => {
      if (suffix.id) {
        modifierIds.push(suffix.id);
      }
    });
  }
  
  // If no valid IDs found, return empty string
  if (modifierIds.length === 0) return '';
  
  // Build the trade query
  const query = {
    query: {
      stats: [
        {
          type: "and",
          filters: modifierIds.map(id => ({ id }))
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