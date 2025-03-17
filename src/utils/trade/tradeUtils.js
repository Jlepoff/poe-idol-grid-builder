// utils/trade/tradeUtils.js

/**
 * Extract numeric values from modifier text for trade filtering
 * @param {string} modText - The modifier text to parse
 * @returns {number|null} - Extracted numeric value or null if not found
 */
const extractNumericValue = (modText) => {
  if (!modText) return null;

  const normalizedText = modText.toLowerCase().trim();

  // Check for "contain X additional" pattern
  const containPattern = /^(your maps contain|[a-z\s]+ in your maps contain)\s+(\d+)\s+additional\s+[a-z\s]+$/i;
  if (containPattern.test(normalizedText)) {
    const numericMatch = normalizedText.match(/contain\s+(\d+)\s+additional/i);
    if (numericMatch && numericMatch[1]) {
      return parseInt(numericMatch[1], 10);
    }
  }

  // Check for "an additional" pattern (value = 1)
  if (/^your maps contain\s+an\s+additional\s+[a-z\s]+$/i.test(normalizedText)) {
    return 1;
  }

  return null;
};

/**
 * Generate a trade URL for a single idol
 * @param {Object} idol - The idol object to generate a trade URL for
 * @returns {string} - The generated trade URL
 */
export const generateTradeUrl = (idol) => {
  if (!idol) return "";

  // Handle unique idols
  if (idol.isUnique) {
    const query = {
      query: {
        name: idol.uniqueName || idol.name,
        type: `${idol.type} Idol`,
        stats: [{ type: "and", filters: [] }],
        status: { option: "online" },
      },
    };
    const encodedQuery = encodeURIComponent(JSON.stringify(query));
    return `https://www.pathofexile.com/trade/search/Phrecia?q=${encodedQuery}`;
  }

  // Build filters for prefixes and suffixes
  const filters = [];

  // Process prefixes
  if (idol.prefixes?.length > 0) {
    idol.prefixes.forEach(prefix => {
      if (!prefix.trade) return;

      const numericValue = extractNumericValue(prefix.Mod);
      if (numericValue !== null) {
        filters.push({
          id: prefix.trade,
          value: { min: numericValue, max: numericValue },
          disabled: false
        });
      } else {
        filters.push({ id: prefix.trade });
      }
    });
  }

  // Process suffixes
  if (idol.suffixes?.length > 0) {
    idol.suffixes.forEach(suffix => {
      if (!suffix.trade) return;

      const numericValue = extractNumericValue(suffix.Mod);
      if (numericValue !== null) {
        filters.push({
          id: suffix.trade,
          value: { min: numericValue, max: numericValue },
          disabled: false
        });
      } else {
        filters.push({ id: suffix.trade });
      }
    });
  }

  if (filters.length === 0) return "";

  // Build and encode the query
  const query = {
    query: {
      type: `${idol.type} Idol`,
      stats: [{ type: "and", filters: filters }],
      status: { option: "online" }
    }
  };

  const encodedQuery = encodeURIComponent(JSON.stringify(query));
  return `https://www.pathofexile.com/trade/search/Phrecia?q=${encodedQuery}`;
};

/**
 * Generate a trade URL for multiple modifiers
 * @param {string} idolType - The idol type
 * @param {Array} prefixes - List of prefix modifiers
 * @param {Array} suffixes - List of suffix modifiers
 * @returns {string} - The generated trade URL
 */
export const generateTradeUrlWithMultipleModifiers = (idolType, prefixes, suffixes) => {
  if (!idolType || (!prefixes?.length && !suffixes?.length)) return "";

  const prefixFilters = [];
  const suffixFilters = [];

  // Process prefixes with trade data
  if (prefixes?.length > 0) {
    prefixes.forEach(prefix => {
      if (prefix.trade) {
        prefixFilters.push({ id: prefix.trade });
      }
    });
  }

  // Process suffixes with trade data
  if (suffixes?.length > 0) {
    suffixes.forEach(suffix => {
      if (suffix.trade) {
        suffixFilters.push({ id: suffix.trade });
      }
    });
  }

  if (prefixFilters.length === 0 && suffixFilters.length === 0) return "";

  // Initialize stats array with empty base filter
  const stats = [
    {
      type: "and",
      filters: [],
      disabled: false
    }
  ];

  // Add prefix count group if we have prefixes
  if (prefixFilters.length > 0) {
    stats.push({
      type: "count",
      value: {
        min: 1
      },
      filters: prefixFilters
    });
  }

  // Add suffix count group if we have suffixes
  if (suffixFilters.length > 0) {
    stats.push({
      type: "count",
      value: {
        min: 1
      },
      filters: suffixFilters
    });
  }

  // Build and encode the query
  const query = {
    query: {
      type: `${idolType} Idol`,
      stats: stats,
      status: {
        option: "online"
      },
      filters: {
        type_filters: {
          filters: {
            category: {
              option: "idol"
            }
          }
        }
      }
    }
  };

  const encodedQuery = encodeURIComponent(JSON.stringify(query));
  return `https://www.pathofexile.com/trade/search/Phrecia?q=${encodedQuery}`;
};

/**
 * Check if an idol has valid trade data
 * @param {Object} idol - The idol to check
 * @returns {boolean} - True if the idol has valid trade data
 */
export const hasValidTradeData = (idol) => {
  if (!idol) return false;

  // Unique idols always have valid trade data
  if (idol.isUnique) return true;

  // Check for valid prefix trade data
  const hasValidPrefix = idol.prefixes?.length > 0 &&
    idol.prefixes.some((prefix) => !!prefix.trade);

  // Check for valid suffix trade data
  const hasValidSuffix = idol.suffixes?.length > 0 &&
    idol.suffixes.some((suffix) => !!suffix.trade);

  return hasValidPrefix || hasValidSuffix;
};