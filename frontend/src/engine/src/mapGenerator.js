/**
 * Exploration Map Generator
 *
 * Generates terrain using multi-layer value noise for natural-looking biomes.
 * Uses seeded RNG for deterministic generation.
 */

/**
 * Mulberry32 PRNG - same as used in engine.js for consistency
 */
function mulberry32(seed) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/**
 * Generate a seeded random value for a specific coordinate
 * This ensures the same coordinate always produces the same value for a given seed
 */
function seededValueAt(x, y, seed, layer = 0) {
  // Combine coordinates and layer into a unique seed
  const combinedSeed = seed + x * 374761393 + y * 668265263 + layer * 1013904223;
  const rng = mulberry32(combinedSeed);
  return rng();
}

/**
 * Smooth interpolation function (smoothstep)
 */
function smoothstep(t) {
  return t * t * (3 - 2 * t);
}

/**
 * 2D Value Noise with bilinear interpolation
 * Returns value between 0 and 1
 */
function valueNoise2D(x, y, seed, scale, layer = 0) {
  // Scale coordinates
  const sx = x / scale;
  const sy = y / scale;

  // Get grid cell coordinates
  const x0 = Math.floor(sx);
  const y0 = Math.floor(sy);
  const x1 = x0 + 1;
  const y1 = y0 + 1;

  // Get fractional part
  const fx = sx - x0;
  const fy = sy - y0;

  // Smooth the fractional values
  const u = smoothstep(fx);
  const v = smoothstep(fy);

  // Get random values at corners
  const v00 = seededValueAt(x0, y0, seed, layer);
  const v10 = seededValueAt(x1, y0, seed, layer);
  const v01 = seededValueAt(x0, y1, seed, layer);
  const v11 = seededValueAt(x1, y1, seed, layer);

  // Bilinear interpolation
  const top = v00 * (1 - u) + v10 * u;
  const bottom = v01 * (1 - u) + v11 * u;
  return top * (1 - v) + bottom * v;
}

/**
 * Multi-octave noise for more natural variation
 */
function fractalNoise2D(x, y, seed, scale, octaves = 3, layer = 0) {
  let value = 0;
  let amplitude = 1;
  let frequency = 1;
  let maxValue = 0;

  for (let i = 0; i < octaves; i++) {
    value += valueNoise2D(x * frequency, y * frequency, seed, scale, layer + i * 100) * amplitude;
    maxValue += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }

  return value / maxValue;
}

/**
 * Determine terrain type from elevation and moisture values
 */
function getTerrainType(elevation, moisture) {
  // Water: very low elevation
  if (elevation < 0.25) {
    return 'water';
  }

  // Mountains: very high elevation
  if (elevation > 0.75) {
    return 'mountain';
  }

  // Hills: high elevation
  if (elevation > 0.6) {
    return 'hills';
  }

  // Mid elevations: depends on moisture
  if (elevation > 0.35) {
    if (moisture > 0.7) {
      return 'jungle';
    }
    if (moisture > 0.5) {
      return 'forest';
    }
    if (moisture > 0.3) {
      return 'grassland';
    }
    return 'plains';
  }

  // Low elevation (above water)
  if (moisture > 0.5) {
    return 'grassland';
  }
  return 'plains';
}

/**
 * Select a resource type based on terrain affinities
 */
function selectResourceType(terrain, rng, rules) {
  const affinities = rules.exploration.resourceAffinities[terrain];
  if (!affinities || Object.keys(affinities).length === 0) {
    return null;
  }

  const roll = rng();
  let cumulative = 0;

  for (const [resource, weight] of Object.entries(affinities)) {
    cumulative += weight;
    if (roll <= cumulative) {
      return resource;
    }
  }

  // Fallback to first resource
  return Object.keys(affinities)[0];
}

/**
 * Generate the exploration map
 *
 * @param {number} seed - Random seed for generation
 * @param {number} width - Map width in tiles
 * @param {number} height - Map height in tiles
 * @param {object} rules - Game rules containing exploration config
 * @returns {object} Exploration map state
 */
export function generateExplorationMap(seed, width, height, rules) {
  const rng = mulberry32(seed);
  const explorationRules = rules.exploration;

  const elevationScale = explorationRules.terrainScale || 8;
  const moistureScale = explorationRules.moistureScale || 6;
  const nodeSpawnChance = explorationRules.nodeSpawnChance || 0.12;

  const tiles = {};
  let nodeIdCounter = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Generate elevation and moisture using different layers
      const elevation = fractalNoise2D(x, y, seed, elevationScale, 3, 0);
      const moisture = fractalNoise2D(x, y, seed, moistureScale, 2, 1000);

      const terrain = getTerrainType(elevation, moisture);

      // Determine if this tile has an extraction node
      let extractionNode = null;
      const nodeRoll = rng();

      if (nodeRoll < nodeSpawnChance && terrain !== 'water') {
        const resourceType = selectResourceType(terrain, rng, rules);
        if (resourceType) {
          nodeIdCounter++;
          extractionNode = {
            id: `exp_node_${resourceType}_${x}_${y}`,
            resourceType,
            rate: Math.floor(rng() * 2) + 1, // 1-2 per tick
            unlocked: false
          };
        }
      }

      const key = `${x},${y}`;
      tiles[key] = {
        x,
        y,
        terrain,
        extractionNode,
        explored: false
      };
    }
  }

  // Calculate initial explored bounds (center of map)
  const initialSize = explorationRules.initialExploredSize || 4;
  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);
  const halfSize = Math.floor(initialSize / 2);

  const exploredBounds = {
    minX: centerX - halfSize,
    maxX: centerX + halfSize - 1,
    minY: centerY - halfSize,
    maxY: centerY + halfSize - 1
  };

  // Mark initial tiles as explored
  for (let y = exploredBounds.minY; y <= exploredBounds.maxY; y++) {
    for (let x = exploredBounds.minX; x <= exploredBounds.maxX; x++) {
      const key = `${x},${y}`;
      if (tiles[key]) {
        tiles[key].explored = true;
      }
    }
  }

  return {
    generatedWidth: width,
    generatedHeight: height,
    exploredBounds,
    tiles,
    seed // Store seed for potential map expansion later
  };
}

/**
 * Get the next exploration expansion info
 * Similar to floor space expansion - fractal pattern
 */
export function getNextExplorationExpansion(explorationMap, rules) {
  const { exploredBounds, generatedWidth, generatedHeight } = explorationMap;
  const { baseCostPerCell } = rules.exploration;

  // Calculate current explored dimensions
  const currentWidth = exploredBounds.maxX - exploredBounds.minX + 1;
  const currentHeight = exploredBounds.maxY - exploredBounds.minY + 1;

  // Determine chunk size based on current size (doubles at each power of 2)
  let chunkSize = 2;
  let targetSize = 8; // First target after initial 4x4

  while (currentWidth >= targetSize && currentHeight >= targetSize) {
    chunkSize *= 2;
    targetSize *= 2;
  }

  // Determine expansion direction
  let direction;
  if (currentWidth < targetSize) {
    direction = 'right'; // Expand width first
  } else {
    direction = 'down'; // Then expand height
  }

  // Calculate new bounds
  let newBounds = { ...exploredBounds };
  let cellsToExplore = 0;

  if (direction === 'right') {
    const newMaxX = Math.min(exploredBounds.maxX + chunkSize, generatedWidth - 1);
    const actualChunk = newMaxX - exploredBounds.maxX;
    cellsToExplore = actualChunk * currentHeight;
    newBounds.maxX = newMaxX;
  } else {
    const newMaxY = Math.min(exploredBounds.maxY + chunkSize, generatedHeight - 1);
    const actualChunk = newMaxY - exploredBounds.maxY;
    const newWidth = exploredBounds.maxX - exploredBounds.minX + 1;
    cellsToExplore = actualChunk * newWidth;
    newBounds.maxY = newMaxY;
  }

  // Check if we've hit map boundaries
  const atMapEdge = (
    newBounds.maxX >= generatedWidth - 1 &&
    newBounds.maxY >= generatedHeight - 1
  );

  return {
    direction,
    chunkSize,
    newBounds,
    cellsToExplore,
    cost: cellsToExplore * baseCostPerCell,
    atMapEdge
  };
}

/**
 * Expand the generated map when player explores beyond current bounds
 * Creates 3 new quadrants to double the map size
 */
export function expandGeneratedMap(explorationMap, rules) {
  const { generatedWidth, generatedHeight, tiles, seed } = explorationMap;

  const newWidth = generatedWidth * 2;
  const newHeight = generatedHeight * 2;

  // Generate new tiles for the three new quadrants
  // (top-right, bottom-left, bottom-right)
  const newTiles = { ...tiles };
  const rng = mulberry32(seed + generatedWidth * generatedHeight); // New seed based on expansion

  const explorationRules = rules.exploration;
  const elevationScale = explorationRules.terrainScale || 8;
  const moistureScale = explorationRules.moistureScale || 6;
  const nodeSpawnChance = explorationRules.nodeSpawnChance || 0.12;

  // Generate three new quadrants
  const quadrants = [
    { startX: generatedWidth, startY: 0, endX: newWidth, endY: generatedHeight }, // top-right
    { startX: 0, startY: generatedHeight, endX: generatedWidth, endY: newHeight }, // bottom-left
    { startX: generatedWidth, startY: generatedHeight, endX: newWidth, endY: newHeight } // bottom-right
  ];

  for (const quadrant of quadrants) {
    for (let y = quadrant.startY; y < quadrant.endY; y++) {
      for (let x = quadrant.startX; x < quadrant.endX; x++) {
        const elevation = fractalNoise2D(x, y, seed, elevationScale, 3, 0);
        const moisture = fractalNoise2D(x, y, seed, moistureScale, 2, 1000);
        const terrain = getTerrainType(elevation, moisture);

        let extractionNode = null;
        if (rng() < nodeSpawnChance && terrain !== 'water') {
          const resourceType = selectResourceType(terrain, rng, rules);
          if (resourceType) {
            extractionNode = {
              id: `exp_node_${resourceType}_${x}_${y}`,
              resourceType,
              rate: Math.floor(rng() * 2) + 1,
              unlocked: false
            };
          }
        }

        const key = `${x},${y}`;
        newTiles[key] = {
          x,
          y,
          terrain,
          extractionNode,
          explored: false
        };
      }
    }
  }

  return {
    ...explorationMap,
    generatedWidth: newWidth,
    generatedHeight: newHeight,
    tiles: newTiles
  };
}
