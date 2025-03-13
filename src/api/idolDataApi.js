// api/idolDataApi.js
const IDOL_TYPES = [
  { name: "Minor", width: 1, height: 1 },
  { name: "Kamasan", width: 1, height: 2 },
  { name: "Totemic", width: 1, height: 3 },
  { name: "Noble", width: 2, height: 1 },
  { name: "Conqueror", width: 2, height: 2 },
  { name: "Burial", width: 3, height: 1 },
];

export const loadIdolData = async () => {
  try {
    const baseUrl = process.env.PUBLIC_URL || "";

    const responses = await Promise.all([
      fetch(`${baseUrl}/data/minor_idol_mods.json`),
      fetch(`${baseUrl}/data/kamasan_noble_idol_mods.json`),
      fetch(`${baseUrl}/data/burial_totemic_idol_mods.json`),
      fetch(`${baseUrl}/data/conqueror_idol_mods.json`),
    ]);

    const failedResponses = responses.filter((r) => !r.ok);
    if (failedResponses.length > 0) {
      throw new Error(
        `Failed to load: ${failedResponses.map((r) => r.url).join(", ")}`
      );
    }

    const [
      minorData,
      kamasanNobleData,
      burialTotemicData,
      conquerorData,
    ] = await Promise.all(responses.map((r) => r.json()));

    const modData = {
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