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

function cleanModifierId(id) {
  return id.startsWith('.') ? id.substring(1) : id;
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
        const cleanId = cleanModifierId(prefix.trade);
        if (numericValue !== null) {
          filters.push({
            id: cleanId,
            value: { min: numericValue, max: numericValue },
            disabled: false
          });
        } else {
          filters.push({ id: cleanId });
        }
      }
    });
  }

  if (idol.suffixes && idol.suffixes.length > 0) {
    idol.suffixes.forEach(suffix => {
      if (suffix.trade) {
        const numericValue = extractNumericValue(suffix.Mod);
        const cleanId = cleanModifierId(suffix.trade);
        if (numericValue !== null) {
          filters.push({
            id: cleanId,
            value: { min: numericValue, max: numericValue },
            disabled: false
          });
        } else {
          filters.push({ id: cleanId });
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

export const hasValidTradeData = (idol) => {
  if (!idol) return false;
  if (idol.isUnique) return true;
  const hasValidPrefix = idol.prefixes && idol.prefixes.length > 0 && idol.prefixes.some((prefix) => !!prefix.trade);
  const hasValidSuffix = idol.suffixes && idol.suffixes.length > 0 && idol.suffixes.some((suffix) => !!suffix.trade);
  return hasValidPrefix || hasValidSuffix;
};