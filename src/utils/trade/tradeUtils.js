// utils/trade/tradeUtils.js

function extractNumericValue(modText) {
  const normalizedText = modText.toLowerCase().trim();
  const isDirectContain = normalizedText.match(
    /^(your maps contain|[a-z\s]+ in your maps contain)\s+(\d+)\s+additional\s+[a-z\s]+$/i
  );
  if (isDirectContain) {
    const numericMatch = normalizedText.match(/contain\s+(\d+)\s+additional/i);
    if (numericMatch) {
      return parseInt(numericMatch[1], 10);
    }
  }
  if (normalizedText.match(/^your maps contain\s+an\s+additional\s+[a-z\s]+$/i)) {
    return 1;
  }
  return null;
}

export const generateTradeUrl = (idol) => {
  if (!idol) return "";

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

  const filters = [];

  if (idol.prefixes && idol.prefixes.length > 0) {
    idol.prefixes.forEach(prefix => {
      if (prefix.trade) {
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
      }
    });
  }

  if (idol.suffixes && idol.suffixes.length > 0) {
    idol.suffixes.forEach(suffix => {
      if (suffix.trade) {
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
      }
    });
  }

  if (filters.length === 0) return "";

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

export const generateTradeUrlWithMultipleModifiers = (idolType, prefixes, suffixes) => {
  if (!idolType || (!prefixes?.length && !suffixes?.length)) return "";

  const prefixFilters = [];
  const suffixFilters = [];

  // Process prefixes
  if (prefixes && prefixes.length > 0) {
    prefixes.forEach(prefix => {
      if (prefix.trade) {
        prefixFilters.push({ id: prefix.trade });
      }
    });
  }

  // Process suffixes
  if (suffixes && suffixes.length > 0) {
    suffixes.forEach(suffix => {
      if (suffix.trade) {
        suffixFilters.push({ id: suffix.trade });
      }
    });
  }

  if (prefixFilters.length === 0 && suffixFilters.length === 0) return "";

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

export const hasValidTradeData = (idol) => {
  if (!idol) return false;
  if (idol.isUnique) return true;
  const hasValidPrefix = idol.prefixes && idol.prefixes.length > 0 && idol.prefixes.some((prefix) => !!prefix.trade);
  const hasValidSuffix = idol.suffixes && idol.suffixes.length > 0 && idol.suffixes.some((suffix) => !!suffix.trade);
  return hasValidPrefix || hasValidSuffix;
};