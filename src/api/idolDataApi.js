// api/idolDataApi.js
const IDOL_TYPES = [
  { name: "Minor", width: 1, height: 1 },
  { name: "Kamasan", width: 1, height: 2 },
  { name: "Totemic", width: 1, height: 3 },
  { name: "Noble", width: 2, height: 1 },
  { name: "Conqueror", width: 2, height: 2 },
  { name: "Burial", width: 3, height: 1 },
];

const IDOL_DATA_FILES = [
  "minor_idol_mods.json",
  "kamasan_noble_idol_mods.json",
  "burial_totemic_idol_mods.json",
  "conqueror_idol_mods.json",
];

/**
 * Maps idol data from JSON responses to the required structure
 * @param {Object[]} dataResponses - Array of JSON data from API calls
 * @returns {Object} Formatted idol mod data
 */
const formatIdolData = (dataResponses) => {
  const [minorData, kamasanNobleData, burialTotemicData, conquerorData] = dataResponses;

  return {
    prefixes: {
      Minor: minorData.prefixes,
      Kamasan: kamasanNobleData.prefixes,
      Totemic: burialTotemicData.prefixes,
      Noble: kamasanNobleData.prefixes,
      Conqueror: conquerorData.prefixes,
      Burial: burialTotemicData.prefixes,
    },
    suffixes: {
      Minor: minorData.suffixes,
      Kamasan: kamasanNobleData.suffixes,
      Totemic: burialTotemicData.suffixes,
      Noble: kamasanNobleData.suffixes,
      Conqueror: conquerorData.suffixes,
      Burial: burialTotemicData.suffixes,
    },
  };
};

/**
 * Loads all idol data from JSON files
 * @returns {Promise<Object>} Promise resolving to idol data and types
 */
export const loadIdolData = async () => {
  try {
    const baseUrl = process.env.PUBLIC_URL || "";

    // Create all fetch promises
    const fetchPromises = IDOL_DATA_FILES.map(filename =>
      fetch(`${baseUrl}/data/${filename}`)
    );

    // Execute all fetches in parallel
    const responses = await Promise.all(fetchPromises);

    // Check for any failed responses
    const failedResponses = responses.filter(r => !r.ok);
    if (failedResponses.length > 0) {
      const failedUrls = failedResponses.map(r => r.url).join(", ");
      throw new Error(`Failed to load: ${failedUrls}`);
    }

    // Parse all JSON responses in parallel
    const dataResponses = await Promise.all(responses.map(r => r.json()));

    // Format the data
    const modData = formatIdolData(dataResponses);

    return {
      mods: modData,
      types: IDOL_TYPES,
    };
  } catch (error) {
    console.error("Error loading idol data:", error);
    alert(
      "Failed to load idol data. If you're seeing this error, please ensure data files are in the correct location and refresh the page."
    );
    throw error;
  }
};