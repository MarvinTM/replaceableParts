/**
 * Material Icon Service
 *
 * Handles loading and caching of material icons for use across the application.
 * Supports both React/MUI components and Pixi.js canvas rendering.
 *
 * Icon Specifications:
 * - Format: PNG with transparency (or SVG for development placeholders)
 * - Source Size: 64x64 pixels (stored at 2x for retina/quality)
 * - Display Size: Varies by context (20-64px), downscaled on the fly
 * - Style: Isometric mini-sprites
 * - Location: /assets/icons/{materialId}.{format}
 *
 * Display size guidelines:
 * - 20-24px: Inventory chips, inline mentions
 * - 32px: Standard UI elements, recipe lists
 * - 48-64px: Detail views, canvas overlays, popups
 */

// Cache for loaded icon URLs (validated as existing)
const iconCache = new Map();

// Cache for failed icons (to avoid repeated 404 requests)
const failedIcons = new Set();

// Icon configuration
const ICON_BASE_PATH = '/assets/icons';

// Icon format: 'svg' for development placeholders, 'png' for production sprites
// Change this to 'png' when you add real isometric PNG icons
const ICON_FORMAT = 'png';

const DEFAULT_ICON = `${ICON_BASE_PATH}/_default.${ICON_FORMAT}`;

export { ICON_FORMAT, ICON_BASE_PATH, DEFAULT_ICON };

/**
 * Get the URL for a material icon
 * @param {string} materialId - The material ID (e.g., 'iron_ore', 'copper_plate')
 * @param {string} format - Optional format override ('png' or 'svg')
 * @returns {string} The icon URL
 */
export function getIconUrl(materialId, format = ICON_FORMAT) {
  return `${ICON_BASE_PATH}/${materialId}.${format}`;
}

/**
 * Check if an icon exists (with caching)
 * @param {string} materialId - The material ID
 * @returns {Promise<boolean>}
 */
export async function iconExists(materialId) {
  if (iconCache.has(materialId)) {
    return true;
  }
  if (failedIcons.has(materialId)) {
    return false;
  }

  try {
    const response = await fetch(getIconUrl(materialId), { method: 'HEAD' });
    if (response.ok) {
      iconCache.set(materialId, getIconUrl(materialId));
      return true;
    }
    failedIcons.add(materialId);
    return false;
  } catch {
    failedIcons.add(materialId);
    return false;
  }
}

/**
 * Preload icons for a list of materials
 * @param {string[]} materialIds - Array of material IDs to preload
 * @returns {Promise<Map<string, string>>} Map of materialId -> iconUrl for successful loads
 */
export async function preloadIcons(materialIds) {
  const results = new Map();

  await Promise.all(
    materialIds.map(async (id) => {
      const exists = await iconExists(id);
      if (exists) {
        results.set(id, getIconUrl(id));
      }
    })
  );

  return results;
}

/**
 * Get icon URL with fallback support
 * @param {string} materialId - The material ID
 * @param {string|null} fallback - Fallback URL if icon doesn't exist (null for no fallback)
 * @returns {string|null}
 */
export function getIconUrlSync(materialId, fallback = DEFAULT_ICON) {
  if (iconCache.has(materialId)) {
    return iconCache.get(materialId);
  }
  if (failedIcons.has(materialId)) {
    return fallback;
  }
  // Not yet checked - return the URL and let the img onerror handle it
  return getIconUrl(materialId);
}

/**
 * Clear the icon cache (useful for development/hot reload)
 */
export function clearIconCache() {
  iconCache.clear();
  failedIcons.clear();
}

/**
 * Get cache statistics
 * @returns {{ loaded: number, failed: number }}
 */
export function getCacheStats() {
  return {
    loaded: iconCache.size,
    failed: failedIcons.size,
  };
}

/**
 * Check if an icon actually loads as a valid image
 * This is more reliable than HEAD requests since dev servers often return 200 for everything
 * @param {string} materialId - The material ID
 * @returns {Promise<boolean>}
 */
function checkIconLoads(materialId) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      iconCache.set(materialId, getIconUrl(materialId));
      resolve(true);
    };
    img.onerror = () => {
      failedIcons.add(materialId);
      resolve(false);
    };
    img.src = getIconUrl(materialId);
  });
}

/**
 * Find materials that are missing icons
 * @param {Array<{id: string, name: string}>} materials - Array of material objects
 * @returns {Promise<Array<{id: string, name: string}>>} Array of materials missing icons
 */
export async function findMaterialsMissingIcons(materials) {
  const missing = [];

  await Promise.all(
    materials.map(async (material) => {
      // Check cache first
      if (iconCache.has(material.id)) {
        return; // Icon exists
      }
      if (failedIcons.has(material.id)) {
        missing.push({ id: material.id, name: material.name });
        return;
      }

      // Actually try loading the image
      const loads = await checkIconLoads(material.id);
      if (!loads) {
        missing.push({ id: material.id, name: material.name });
      }
    })
  );

  // Sort by name for consistent display
  missing.sort((a, b) => a.name.localeCompare(b.name));
  return missing;
}

// For Pixi.js integration - load icon as texture
let pixiAssets = null;

/**
 * Set the Pixi.js Assets module for texture loading
 * Call this once from FactoryCanvas after importing Assets
 * @param {object} assets - Pixi.js Assets module
 */
export function setPixiAssets(assets) {
  pixiAssets = assets;
}

/**
 * Load material icon as Pixi.js texture
 * @param {string} materialId - The material ID
 * @returns {Promise<Texture|null>} The loaded texture or null if failed
 */
export async function loadIconTexture(materialId) {
  if (!pixiAssets) {
    console.warn('Pixi Assets not initialized. Call setPixiAssets first.');
    return null;
  }

  try {
    const texture = await pixiAssets.load(getIconUrl(materialId));
    iconCache.set(materialId, getIconUrl(materialId));
    return texture;
  } catch {
    failedIcons.add(materialId);
    return null;
  }
}

export default {
  getIconUrl,
  getIconUrlSync,
  iconExists,
  preloadIcons,
  clearIconCache,
  getCacheStats,
  findMaterialsMissingIcons,
  setPixiAssets,
  loadIconTexture,
  ICON_BASE_PATH,
  ICON_FORMAT,
  DEFAULT_ICON,
};
