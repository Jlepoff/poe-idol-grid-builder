// utils/idol/idolUtils.js

export const validateIdol = (idol, idolTypes) => {
  if (!idol || !idol.type) {
    return { valid: false, error: "Invalid idol data" };
  }

  const idolType = idolTypes.find(type => type.name === idol.type);
  if (!idolType) {
    return { valid: false, error: `Unknown idol type: ${idol.type}` };
  }

  if (idol.isUnique) {
    if (!idol.uniqueModifiers || idol.uniqueModifiers.length === 0) {
      return { valid: false, error: "Unique idol missing modifiers" };
    }
    return { valid: true, dimensions: idolType };
  }

  const prefixCount = idol.prefixes ? idol.prefixes.length : 0;
  const suffixCount = idol.suffixes ? idol.suffixes.length : 0;

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

export const getIdolDimensions = (idol, idolTypes) => {
  if (!idol || !idol.type) return { width: 1, height: 1 };

  const idolType = idolTypes.find(type => type.name === idol.type);
  if (!idolType) return { width: 1, height: 1 };

  return { width: idolType.width, height: idolType.height };
};

export const generateIdolName = (idolType, prefixes, suffixes, isUnique) => {
  if (isUnique) return `Unique ${idolType} Idol`;

  let name = idolType;

  if (prefixes && prefixes.length > 0) {
    name = `${prefixes[0].Name} ${name}`;
  }

  if (suffixes && suffixes.length > 0) {
    name = `${name} ${suffixes[0].Name}`;
  }

  return name;
};

export const countModifiers = idol => {
  if (!idol) return 0;

  if (idol.isUnique) {
    return idol.uniqueModifiers?.length || 0;
  }

  return (idol.prefixes?.length || 0) + (idol.suffixes?.length || 0);
};

export const getModifierValuePerCell = (idol, idolTypes) => {
  if (!idol || !idol.type) return 0;

  const { width, height } = getIdolDimensions(idol, idolTypes);
  const size = width * height;
  const modCount = countModifiers(idol);

  return size > 0 ? modCount / size : 0;
};

export const sortIdolsByValuePerCell = (idols, idolTypes) => {
  return [...idols].sort((a, b) => {
    const aValue = getModifierValuePerCell(a, idolTypes);
    const bValue = getModifierValuePerCell(b, idolTypes);
    return bValue - aValue;
  });
};