// utils/idol/idolUtils.js

/**
 * Validates an idol object against the provided idol types
 * @param {Object} idol - The idol to validate
 * @param {Array} idolTypes - Available idol types
 * @returns {Object} Validation result with valid flag and error message or dimensions
 */
export const validateIdol = (idol, idolTypes) => {
  // Basic validation
  if (!idol?.type) {
    return { valid: false, error: "Invalid idol data" };
  }

  // Check if idol type exists
  const idolType = idolTypes.find(type => type.name === idol.type);
  if (!idolType) {
    return { valid: false, error: `Unknown idol type: ${idol.type}` };
  }

  // Validate unique idols
  if (idol.isUnique) {
    if (!idol.uniqueModifiers?.length) {
      return { valid: false, error: "Unique idol missing modifiers" };
    }
    return { valid: true, dimensions: idolType };
  }

  // Validate normal idols
  const prefixCount = idol.prefixes?.length || 0;
  const suffixCount = idol.suffixes?.length || 0;

  if (prefixCount > 2) {
    return { valid: false, error: "Idol cannot have more than 2 prefixes" };
  }

  if (suffixCount > 2) {
    return { valid: false, error: "Idol cannot have more than 2 suffixes" };
  }

  if (prefixCount === 0 && suffixCount === 0) {
    return { valid: false, error: "Idol must have at least one modifier" };
  }

  return { valid: true, dimensions: idolType };
};

/**
 * Gets the dimensions of an idol based on its type
 * @param {Object} idol - The idol object
 * @param {Array} idolTypes - Available idol types
 * @returns {Object} Width and height of the idol
 */
export const getIdolDimensions = (idol, idolTypes) => {
  if (!idol?.type) return { width: 1, height: 1 };

  const idolType = idolTypes.find(type => type.name === idol.type);
  return idolType ? { width: idolType.width, height: idolType.height } : { width: 1, height: 1 };
};

/**
 * Generates a display name for an idol
 * @param {string} idolType - The type of idol
 * @param {Array} prefixes - Prefix modifiers
 * @param {Array} suffixes - Suffix modifiers
 * @param {boolean} isUnique - Whether the idol is unique
 * @returns {string} Generated name for the idol
 */
export const generateIdolName = (idolType, prefixes, suffixes, isUnique) => {
  if (isUnique) return `Unique ${idolType} Idol`;

  const prefix = prefixes?.[0]?.Name;
  const suffix = suffixes?.[0]?.Name;

  return [
    prefix,
    idolType,
    suffix
  ].filter(Boolean).join(' ');
};

/**
 * Counts the total modifiers on an idol
 * @param {Object} idol - The idol object
 * @returns {number} Count of modifiers
 */
export const countModifiers = idol => {
  if (!idol) return 0;

  return idol.isUnique
    ? idol.uniqueModifiers?.length || 0
    : (idol.prefixes?.length || 0) + (idol.suffixes?.length || 0);
};

/**
 * Calculates the modifier value per cell for an idol
 * @param {Object} idol - The idol object
 * @param {Array} idolTypes - Available idol types
 * @returns {number} Value per cell
 */
export const getModifierValuePerCell = (idol, idolTypes) => {
  if (!idol?.type) return 0;

  const { width, height } = getIdolDimensions(idol, idolTypes);
  const size = width * height;
  const modCount = countModifiers(idol);

  return size > 0 ? modCount / size : 0;
};

/**
 * Sorts idols by their value per cell in descending order
 * @param {Array} idols - Array of idol objects
 * @param {Array} idolTypes - Available idol types
 * @returns {Array} Sorted array of idols
 */
export const sortIdolsByValuePerCell = (idols, idolTypes) => {
  return [...idols].sort((a, b) => {
    const aValue = getModifierValuePerCell(a, idolTypes);
    const bValue = getModifierValuePerCell(b, idolTypes);
    return bValue - aValue;
  });
};