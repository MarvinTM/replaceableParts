import i18n from '../i18n';

/**
 * Get the translated name for a material
 * @param {string} materialId - The material ID (e.g., 'wood', 'iron_ore')
 * @param {string} fallbackName - The fallback name from rules if no translation exists
 * @returns {string} The translated name or fallback
 */
export function getMaterialName(materialId, fallbackName = null) {
  const key = `materials.${materialId}`;
  const translated = i18n.t(key, { defaultValue: '' });

  // If translation exists and is not empty, use it
  if (translated && translated !== key) {
    return translated;
  }

  // Fall back to provided name or format the ID
  return fallbackName || formatId(materialId);
}

/**
 * Get the translated name for a recipe
 * @param {string} recipeId - The recipe ID
 * @param {string} fallbackName - The fallback name if no translation exists
 * @returns {string} The translated name or fallback
 */
export function getRecipeName(recipeId, fallbackName = null) {
  // Recipes often share the same name as their primary output material
  const key = `materials.${recipeId}`;
  const translated = i18n.t(key, { defaultValue: '' });

  if (translated && translated !== key) {
    return translated;
  }

  return fallbackName || formatId(recipeId);
}

/**
 * Get the translated description for a material
 * @param {string} materialId - The material ID
 * @param {string} fallbackDescription - The fallback description if no translation exists
 * @returns {string} The translated description or fallback (empty string if none)
 */
export function getMaterialDescription(materialId, fallbackDescription = '') {
  if (!materialId) return fallbackDescription || '';
  const key = `materialDescriptions.${materialId}`;
  const translated = i18n.t(key, { defaultValue: '' });

  if (translated && translated !== key) {
    return translated;
  }

  return fallbackDescription || '';
}

/**
 * Get the translated label for a build slot
 * @param {string} slotLabel - The slot label (e.g., 'Furnace Base', 'Work Surface')
 * @returns {string} The translated label or original
 */
export function getSlotLabel(slotLabel) {
  const key = `slots.${slotLabel.toLowerCase().replace(/\s+/g, '_')}`;
  const translated = i18n.t(key, { defaultValue: '' });

  if (translated && translated !== key) {
    return translated;
  }

  return slotLabel;
}

/**
 * Format an ID into a readable name
 * @param {string} id - The ID to format (e.g., 'iron_ore' -> 'Iron Ore')
 * @returns {string} The formatted name
 */
function formatId(id) {
  if (!id) return '';
  return id
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * React hook for getting translated material names with rules context
 * @param {object} rules - The game rules containing materials array
 * @returns {function} A function that takes materialId and returns translated name
 */
export function useTranslatedMaterials(rules) {
  return (materialId) => {
    const material = rules?.materials?.find(m => m.id === materialId);
    return getMaterialName(materialId, material?.name);
  };
}
