/**
 * Asset Loader Service
 *
 * Centralizes asset loading for the entire application.
 * Preloads all game assets (factory, exploration, icons) with progress tracking.
 * Caches loaded textures for reuse by canvas components.
 */

import { Assets, Texture } from 'pixi.js';
import { getIconUrl } from './iconService';

// Asset paths
const FACTORY_ASSET_BASE = '/assets/factory';
const EXPLORATION_ASSET_BASE = '/assets/exploration';

// Cached assets
let loadedAssets = null;
let isLoading = false;
let loadingPromise = null;

// Factory base asset manifest
const FACTORY_BASE_ASSETS = {
  floor: {
    light: `${FACTORY_ASSET_BASE}/floor_light.png`,
    dark: `${FACTORY_ASSET_BASE}/floor_dark.png`,
  },
  walls: {
    segment: `${FACTORY_ASSET_BASE}/wall.png`,
    door: `${FACTORY_ASSET_BASE}/wall_with_door.png`,
  },
  terrain: {
    grass: [
      `${FACTORY_ASSET_BASE}/terrain_grass_1.png`,
      `${FACTORY_ASSET_BASE}/terrain_grass_2.png`,
      `${FACTORY_ASSET_BASE}/terrain_grass_3.png`,
      `${FACTORY_ASSET_BASE}/terrain_grass_4.png`,
    ],
    road: `${FACTORY_ASSET_BASE}/terrain_road.png`,
    background: `${FACTORY_ASSET_BASE}/terrain_background.png`,
  }
};

// Exploration terrain types
const EXPLORATION_TERRAIN_TYPES = [
  'water', 'plains', 'grassland', 'forest', 'jungle', 'hills', 'mountain', 'desert', 'swamp'
];

/**
 * Load an image and convert white/near-white pixels to transparent
 * @param {string} path - Path to the image file
 * @param {number} threshold - RGB threshold (pixels with all channels >= threshold become transparent)
 * @returns {Promise<Texture|null>} - Processed texture or null if loading fails
 */
async function loadWithTransparentWhite(path, threshold = 200) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      // Create canvas and draw image
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      // Get pixel data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Process pixels: make white/near-white transparent
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // If all RGB channels are >= threshold, make transparent
        if (r >= threshold && g >= threshold && b >= threshold) {
          data[i + 3] = 0; // Set alpha to 0
        }
      }

      // Put processed data back
      ctx.putImageData(imageData, 0, 0);

      // Create texture from canvas
      resolve(Texture.from(canvas));
    };

    img.onerror = () => {
      resolve(null);
    };

    img.src = path;
  });
}

/**
 * Try to load an asset, return null on failure
 * @param {string} path - Asset path
 * @returns {Promise<Texture|null>}
 */
async function tryLoad(path) {
  try {
    return await Assets.load(path);
  } catch {
    return null;
  }
}

/**
 * Preload an image into browser cache (for use in HTML img tags)
 * @param {string} path - Image path
 * @returns {Promise<void>}
 */
async function preloadImageToCache(path) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve(); // Resolve even on error to not block loading
    img.src = path;
  });
}

/**
 * Count total number of assets to load
 * @param {Object} rules - Game rules
 * @returns {number}
 */
function countTotalAssets(rules) {
  let count = 0;

  // Factory base assets: 2 floor + 2 walls + 4 grass + 2 (road, background) = 10
  count += 10;

  // Machine sprites: each machine has idle, working + animation frames
  // Note: blocked sprites are no longer used (we show dimmed idle + overlay instead)
  for (const machineType of rules.machines) {
    count += 2; // idle, working (no longer loading blocked sprites)
    if (machineType.animation?.separateFrames) {
      count += machineType.animation.frames || 4;
    } else {
      count += 1; // single animation sprite sheet
    }
  }

  // Generator sprites: each has static + animation frames
  for (const generatorType of rules.generators) {
    count += 1; // static
    if (generatorType.animation?.separateFrames) {
      count += generatorType.animation.frames || 4;
    } else {
      count += 1; // single animation sprite sheet
    }
  }

  // Exploration terrain types
  count += EXPLORATION_TERRAIN_TYPES.length;

  // Material icons
  count += rules.materials.length;

  // Browser cache preloads for UI preview images
  count += rules.machines.length; // machine _idle.png for UI previews
  count += rules.generators.length; // generator .png for UI previews

  return count;
}

/**
 * Load all game assets with progress tracking
 * @param {Object} rules - Game rules containing machine types, generator types, and materials
 * @param {Function} onProgress - Callback with { loaded, total } progress info
 * @returns {Promise<Object>} - Loaded assets
 */
export async function loadAllAssets(rules, onProgress = () => {}) {
  // Return cached assets if already loaded
  if (loadedAssets) {
    const total = countTotalAssets(rules);
    onProgress({ loaded: total, total });
    return loadedAssets;
  }

  // Return existing promise if already loading
  if (isLoading && loadingPromise) {
    return loadingPromise;
  }

  isLoading = true;

  loadingPromise = (async () => {
    const total = countTotalAssets(rules);
    let loaded = 0;

    const updateProgress = () => {
      loaded++;
      onProgress({ loaded, total });
    };

    const assets = {
      factory: {
        floor: { light: null, dark: null },
        walls: { segment: null, door: null },
        terrain: { grass: [], road: null, background: null },
        machines: {},
        generators: {}
      },
      exploration: {
        terrain: {}
      },
      icons: new Map()
    };

    // Load factory floor tiles
    assets.factory.floor.light = await tryLoad(FACTORY_BASE_ASSETS.floor.light);
    updateProgress();
    assets.factory.floor.dark = await tryLoad(FACTORY_BASE_ASSETS.floor.dark);
    updateProgress();

    // Load wall sprites
    assets.factory.walls.segment = await tryLoad(FACTORY_BASE_ASSETS.walls.segment);
    updateProgress();
    assets.factory.walls.door = await tryLoad(FACTORY_BASE_ASSETS.walls.door);
    updateProgress();

    // Load terrain tiles
    for (const grassPath of FACTORY_BASE_ASSETS.terrain.grass) {
      const texture = await tryLoad(grassPath);
      if (texture) {
        assets.factory.terrain.grass.push(texture);
      }
      updateProgress();
    }
    assets.factory.terrain.road = await tryLoad(FACTORY_BASE_ASSETS.terrain.road);
    updateProgress();
    assets.factory.terrain.background = await tryLoad(FACTORY_BASE_ASSETS.terrain.background);
    updateProgress();

    // Load machine sprites
    for (const machineType of rules.machines) {
      let workingAnim = null;
      const useTransparentWhite = machineType.animation?.transparentWhite;

      // Check if animation uses separate frame files
      if (machineType.animation?.separateFrames) {
        const frameCount = machineType.animation.frames || 4;
        const frames = [];
        for (let i = 1; i <= frameCount; i++) {
          const path = `${FACTORY_ASSET_BASE}/${machineType.id}_working_anim_${i}.png`;
          const frame = useTransparentWhite
            ? await loadWithTransparentWhite(path)
            : await tryLoad(path);
          if (frame) frames.push(frame);
          updateProgress();
        }
        if (frames.length > 0) {
          workingAnim = frames;
        }
      } else {
        // Load as sprite sheet
        const path = `${FACTORY_ASSET_BASE}/${machineType.id}_working_anim.png`;
        workingAnim = useTransparentWhite
          ? await loadWithTransparentWhite(path)
          : await tryLoad(path);
        updateProgress();
      }

      const idle = await tryLoad(`${FACTORY_ASSET_BASE}/${machineType.id}_idle.png`);
      updateProgress();
      const working = await tryLoad(`${FACTORY_ASSET_BASE}/${machineType.id}_working.png`);
      updateProgress();
      // Note: blocked sprites are no longer loaded (we show dimmed idle + overlay instead)

      assets.factory.machines[machineType.id] = {
        idle,
        working,
        workingAnim
      };
    }

    // Load generator sprites
    for (const generatorType of rules.generators) {
      let anim = null;
      const useTransparentWhite = generatorType.animation?.transparentWhite;

      // Check if animation uses separate frame files
      if (generatorType.animation?.separateFrames) {
        const frameCount = generatorType.animation.frames || 4;
        const frames = [];
        for (let i = 1; i <= frameCount; i++) {
          const path = `${FACTORY_ASSET_BASE}/${generatorType.id}_anim_${i}.png`;
          const frame = useTransparentWhite
            ? await loadWithTransparentWhite(path)
            : await tryLoad(path);
          if (frame) frames.push(frame);
          updateProgress();
        }
        if (frames.length > 0) {
          anim = frames;
        }
      } else {
        // Load as sprite sheet
        const path = `${FACTORY_ASSET_BASE}/${generatorType.id}_anim.png`;
        anim = useTransparentWhite
          ? await loadWithTransparentWhite(path)
          : await tryLoad(path);
        updateProgress();
      }

      const staticTexture = await tryLoad(`${FACTORY_ASSET_BASE}/${generatorType.id}.png`);
      updateProgress();

      assets.factory.generators[generatorType.id] = {
        static: staticTexture,
        anim
      };
    }

    // Load exploration terrain textures
    for (const terrain of EXPLORATION_TERRAIN_TYPES) {
      const texture = await tryLoad(`${EXPLORATION_ASSET_BASE}/${terrain}.png`);
      assets.exploration.terrain[terrain] = texture || Texture.WHITE;
      updateProgress();
    }

    // Load material icons
    for (const material of rules.materials) {
      const iconUrl = getIconUrl(material.id);
      try {
        const texture = await Assets.load(iconUrl);
        assets.icons.set(material.id, texture);
      } catch {
        // Icon not found, will use fallback
      }
      // Also preload into browser cache for React components using <img> tags
      await preloadImageToCache(iconUrl);
      updateProgress();
    }

    // Preload UI preview images into browser cache (for React components using <img> tags)
    // This ensures images are cached when PlaceableMachinesPanel and PlaceableGeneratorsPanel render
    for (const machineType of rules.machines) {
      await preloadImageToCache(`${FACTORY_ASSET_BASE}/${machineType.id}_idle.png`);
      updateProgress();
    }

    for (const generatorType of rules.generators) {
      await preloadImageToCache(`${FACTORY_ASSET_BASE}/${generatorType.id}.png`);
      updateProgress();
    }

    loadedAssets = assets;
    isLoading = false;

    return assets;
  })();

  return loadingPromise;
}

/**
 * Get preloaded assets (returns null if not yet loaded)
 * @returns {Object|null}
 */
export function getLoadedAssets() {
  return loadedAssets;
}

/**
 * Check if assets have been loaded
 * @returns {boolean}
 */
export function areAssetsLoaded() {
  return loadedAssets !== null;
}

/**
 * Get factory assets in the format expected by FactoryCanvas
 * @returns {Object|null}
 */
export function getFactoryAssets() {
  if (!loadedAssets) return null;

  return {
    floor: loadedAssets.factory.floor,
    walls: loadedAssets.factory.walls,
    terrain: loadedAssets.factory.terrain,
    machines: loadedAssets.factory.machines,
    generators: loadedAssets.factory.generators
  };
}

/**
 * Get exploration terrain textures
 * @returns {Object|null}
 */
export function getExplorationTextures() {
  if (!loadedAssets) return null;
  return loadedAssets.exploration.terrain;
}

/**
 * Get a preloaded material icon texture
 * @param {string} materialId
 * @returns {Texture|null}
 */
export function getIconTexture(materialId) {
  if (!loadedAssets) return null;
  return loadedAssets.icons.get(materialId) || null;
}

/**
 * Clear cached assets (for testing or hot reload)
 */
export function clearAssetCache() {
  loadedAssets = null;
  isLoading = false;
  loadingPromise = null;
}

export default {
  loadAllAssets,
  getLoadedAssets,
  areAssetsLoaded,
  getFactoryAssets,
  getExplorationTextures,
  getIconTexture,
  clearAssetCache
};
