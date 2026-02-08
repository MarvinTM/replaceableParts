/**
 * Exploration Map Generator
 *
 * Generates terrain using multi-layer value noise for natural-looking biomes.
 * Uses seeded RNG for deterministic generation.
 */
import { getStandardizedNodeRate } from './extractionNodeRates.js';

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
 * Get the maximum allowed resource age based on distance from map center
 * Inner ring (0-20): Age 1-2 only
 * Middle ring (20-48): Age 1-4
 * Outer ring (48+): All ages
 */
function getMaxAgeForDistance(distance, rules) {
  const boundaries = rules.exploration.ringBoundaries;
  if (!boundaries) return 7; // No boundaries configured, allow all

  if (distance <= boundaries.inner) return 2;
  if (distance <= boundaries.middle) return 4;
  return 7;
}

/**
 * Get the age of a resource type
 */
function getResourceAge(resourceType, rules) {
  const ages = rules.exploration.resourceAges;
  return ages?.[resourceType] || 1;
}

/**
 * Select a resource type based on terrain affinities, distance from center, and demand weights
 * @param {string} terrain - The terrain type
 * @param {function} rng - Random number generator
 * @param {object} rules - Game rules
 * @param {number} x - Tile x coordinate
 * @param {number} y - Tile y coordinate
 * @param {number} centerX - Map center x coordinate
 * @param {number} centerY - Map center y coordinate
 */
function selectResourceType(terrain, rng, rules, x = null, y = null, centerX = null, centerY = null) {
  const affinities = rules.exploration.resourceAffinities[terrain];
  if (!affinities || Object.keys(affinities).length === 0) {
    return null;
  }

  // Calculate distance from center for age filtering
  let maxAge = 7;
  if (x !== null && y !== null && centerX !== null && centerY !== null) {
    const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
    maxAge = getMaxAgeForDistance(distance, rules);
  }

  const spawnWeights = rules.exploration.resourceSpawnWeights || {};

  // Build weighted list of eligible resources
  const eligible = [];
  let totalWeight = 0;

  for (const [resource, affinity] of Object.entries(affinities)) {
    const age = getResourceAge(resource, rules);
    if (age <= maxAge) {
      // Combine terrain affinity with demand-based spawn weight
      const demandWeight = spawnWeights[resource] || 0.1;
      const combinedWeight = affinity * demandWeight;
      eligible.push({ resource, weight: combinedWeight });
      totalWeight += combinedWeight;
    }
  }

  if (eligible.length === 0) return null;

  // Weighted random selection
  const roll = rng() * totalWeight;
  let cumulative = 0;

  for (const { resource, weight } of eligible) {
    cumulative += weight;
    if (roll <= cumulative) {
      return resource;
    }
  }

  // Fallback to first eligible resource
  return eligible[0].resource;
}

/**
 * Find suitable tiles for placing a guaranteed resource node
 * Prioritizes tiles that naturally have affinity for the resource
 */
function findSuitableTilesForResource(tiles, exploredBounds, resourceType, rules) {
  const affinities = rules.exploration.resourceAffinities;
  const candidates = [];

  for (let y = exploredBounds.minY; y <= exploredBounds.maxY; y++) {
    for (let x = exploredBounds.minX; x <= exploredBounds.maxX; x++) {
      const tile = tiles[`${x},${y}`];
      if (!tile || tile.extractionNode || tile.terrain === 'water') continue;

      // Check if this terrain has affinity for the resource
      const terrainAffinities = affinities[tile.terrain] || {};
      const affinity = terrainAffinities[resourceType] || 0;

      candidates.push({ tile, affinity });
    }
  }

  // Sort by affinity (highest first), then shuffle within same affinity
  candidates.sort((a, b) => b.affinity - a.affinity);

  return candidates.map(c => c.tile);
}

/**
 * Ensure guaranteed starting nodes exist in the initial explored area
 */
function ensureGuaranteedNodes(tiles, exploredBounds, rules, rng) {
  const guaranteed = rules.exploration.guaranteedStartingNodes;
  if (!guaranteed) return;

  // Count existing nodes in explored area
  const nodeCounts = {};
  for (let y = exploredBounds.minY; y <= exploredBounds.maxY; y++) {
    for (let x = exploredBounds.minX; x <= exploredBounds.maxX; x++) {
      const tile = tiles[`${x},${y}`];
      if (tile?.extractionNode) {
        const rt = tile.extractionNode.resourceType;
        nodeCounts[rt] = (nodeCounts[rt] || 0) + 1;
      }
    }
  }

  // Add missing guaranteed nodes
  for (const [resource, minCount] of Object.entries(guaranteed)) {
    const current = nodeCounts[resource] || 0;
    if (current < minCount) {
      const candidates = findSuitableTilesForResource(tiles, exploredBounds, resource, rules);
      const needed = minCount - current;

      for (let i = 0; i < needed && i < candidates.length; i++) {
        const tile = candidates[i];
        tile.extractionNode = {
          id: `exp_node_${resource}_${tile.x}_${tile.y}`,
          resourceType: resource,
          rate: getStandardizedNodeRate(resource, rules),
          unlocked: false
        };
      }
    }
  }
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

  // Calculate center for ring-based resource filtering
  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);

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
        // Pass coordinates for ring-based age filtering
        const resourceType = selectResourceType(terrain, rng, rules, x, y, centerX, centerY);
        if (resourceType) {
          nodeIdCounter++;
          extractionNode = {
            id: `exp_node_${resourceType}_${x}_${y}`,
            resourceType,
            rate: getStandardizedNodeRate(resourceType, rules),
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
  const halfSize = Math.floor(initialSize / 2);

  const exploredBounds = {
    minX: centerX - halfSize,
    maxX: centerX + halfSize - 1,
    minY: centerY - halfSize,
    maxY: centerY + halfSize - 1
  };

  // Ensure guaranteed starting nodes exist
  ensureGuaranteedNodes(tiles, exploredBounds, rules, rng);

  // Mark initial tiles as explored
  for (let y = exploredBounds.minY; y <= exploredBounds.maxY; y++) {
    for (let x = exploredBounds.minX; x <= exploredBounds.maxX; x++) {
      const key = `${x},${y}`;
      if (tiles[key]) {
        tiles[key].explored = true;
      }
    }
  }

  const exploredChunks = [{
    x: exploredBounds.minX,
    y: exploredBounds.minY,
    width: exploredBounds.maxX - exploredBounds.minX + 1,
    height: exploredBounds.maxY - exploredBounds.minY + 1
  }];

  return {
    generatedWidth: width,
    generatedHeight: height,
    centerX,
    centerY,
    exploredBounds,
    exploredChunks,
    tiles,
    seed // Store seed for potential map expansion later
  };
}

function isChunkExplored(chunks, x, y) {
  return chunks.some(c => c.x === x && c.y === y);
}

function getNextExplorationSpiral(explorationMap, rules) {
  const { exploredBounds, generatedWidth, generatedHeight, exploredChunks: rawChunks } = explorationMap;
  const { baseCostPerCell, initialExploredSize, maxGeneratedSize } = rules.exploration;
  const maxMapSize = maxGeneratedSize || 256;

  // Polyfill chunks if missing (legacy save support)
  const chunks = rawChunks || [{
    x: exploredBounds.minX,
    y: exploredBounds.minY,
    width: exploredBounds.maxX - exploredBounds.minX + 1,
    height: exploredBounds.maxY - exploredBounds.minY + 1
  }];

  // Base origin for spiral expansion (Top-Left of initial exploration)
  const originX = chunks[0].x;
  const originY = chunks[0].y;

  const expansionsDone = Math.max(0, chunks.length - 1);
  const completedCycles = Math.floor(expansionsDone / 12);
  
  const cycleBase = (initialExploredSize || 4) * Math.pow(2, completedCycles);
  const N = cycleBase;
  const target = N * 2;
  const chunkSize = N / 2;

  // 1. Right Wing
  for (let dy = 0; dy < N; dy += chunkSize) {
    for (let dx = N; dx < target; dx += chunkSize) {
      const x = originX + dx;
      const y = originY + dy;
      
      // Check boundaries
      // If chunk extends beyond generated map, force expansion if possible
      if (x + chunkSize > generatedWidth) {
        if (generatedWidth < maxMapSize) {
          return { cellsToExplore: 0, atMapEdge: true };
        }
        // If maxed out, allow partial chunk (clamped by expandExploration logic implicitly)
      }
      
      // If start is completely out, we must expand
      if (x >= generatedWidth) {
         return { cellsToExplore: 0, atMapEdge: true };
      }

      if (!isChunkExplored(chunks, x, y)) {
        return {
          chunkRect: { x, y, width: chunkSize, height: chunkSize },
          newBounds: {
            minX: Math.min(exploredBounds.minX, x),
            maxX: Math.max(exploredBounds.maxX, x + chunkSize - 1),
            minY: Math.min(exploredBounds.minY, y),
            maxY: Math.max(exploredBounds.maxY, y + chunkSize - 1)
          },
          cellsToExplore: chunkSize * chunkSize,
          cost: chunkSize * chunkSize * baseCostPerCell,
          atMapEdge: x + chunkSize >= generatedWidth && y + chunkSize >= generatedHeight
        };
      }
    }
  }

  // 2. Top Wing (Down in map coords)
  for (let dy = N; dy < target; dy += chunkSize) {
    for (let dx = 0; dx < target; dx += chunkSize) {
      const x = originX + dx;
      const y = originY + dy;

      // Check boundaries
      if (y + chunkSize > generatedHeight) {
        if (generatedHeight < maxMapSize) {
          return { cellsToExplore: 0, atMapEdge: true };
        }
      }
      
      if (y >= generatedHeight) {
         return { cellsToExplore: 0, atMapEdge: true };
      }

      if (!isChunkExplored(chunks, x, y)) {
        return {
          chunkRect: { x, y, width: chunkSize, height: chunkSize },
          newBounds: {
            minX: Math.min(exploredBounds.minX, x),
            maxX: Math.max(exploredBounds.maxX, x + chunkSize - 1),
            minY: Math.min(exploredBounds.minY, y),
            maxY: Math.max(exploredBounds.maxY, y + chunkSize - 1)
          },
          cellsToExplore: chunkSize * chunkSize,
          cost: chunkSize * chunkSize * baseCostPerCell,
          atMapEdge: x + chunkSize >= generatedWidth && y + chunkSize >= generatedHeight
        };
      }
    }
  }
  
  // If no chunks found, return edge status
  return {
    cellsToExplore: 0,
    atMapEdge: true 
  };
}

function getNextExplorationFractal(explorationMap, rules) {
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

  // Check how much room we have in each direction
  const roomRight = generatedWidth - 1 - exploredBounds.maxX;
  const roomDown = generatedHeight - 1 - exploredBounds.maxY;

  // Determine expansion direction (prefer width first, but switch if blocked)
  let direction;
  if (currentWidth < targetSize && roomRight > 0) {
    direction = 'right';
  } else if (roomDown > 0) {
    direction = 'down';
  } else if (roomRight > 0) {
    direction = 'right';
  } else {
    // Both directions blocked - we're at the corner
    direction = 'right'; 
  }

  // Calculate new bounds
  let newBounds = { ...exploredBounds };
  let chunkRect = null;
  let cellsToExplore = 0;

  if (direction === 'right') {
    const newMaxX = Math.min(exploredBounds.maxX + chunkSize, generatedWidth - 1);
    const actualChunk = newMaxX - exploredBounds.maxX;
    cellsToExplore = actualChunk * currentHeight;
    newBounds.maxX = newMaxX;
    chunkRect = {
      x: exploredBounds.maxX + 1,
      y: exploredBounds.minY,
      width: actualChunk,
      height: currentHeight
    };
  } else {
    const newMaxY = Math.min(exploredBounds.maxY + chunkSize, generatedHeight - 1);
    const actualChunk = newMaxY - exploredBounds.maxY;
    const newWidth = exploredBounds.maxX - exploredBounds.minX + 1;
    cellsToExplore = actualChunk * newWidth;
    newBounds.maxY = newMaxY;
    chunkRect = {
      x: exploredBounds.minX,
      y: exploredBounds.maxY + 1,
      width: newWidth,
      height: actualChunk
    };
  }

  const atMapEdge = (
    newBounds.maxX >= generatedWidth - 1 &&
    newBounds.maxY >= generatedHeight - 1
  );

  return {
    chunkRect,
    newBounds,
    cellsToExplore,
    cost: cellsToExplore * baseCostPerCell,
    atMapEdge
  };
}

/**
 * Get the next exploration expansion info
 */
export function getNextExplorationExpansion(explorationMap, rules) {
  // Use same setting as floor space for consistency
  const type = rules.floorSpace.expansionType || 'spiral';

  if (type === 'fractal') {
    return getNextExplorationFractal(explorationMap, rules);
  }

  return getNextExplorationSpiral(explorationMap, rules);
}

/**
 * Expand the generated map when player explores beyond current bounds
 * Creates 3 new quadrants to double the map size
 * Returns null if already at max size
 */
export function expandGeneratedMap(explorationMap, rules) {
  const { generatedWidth, generatedHeight, tiles, seed, centerX, centerY } = explorationMap;
  const maxSize = rules.exploration.maxGeneratedSize || 256;

  // Check if we're already at max size
  if (generatedWidth >= maxSize || generatedHeight >= maxSize) {
    return null;
  }

  // Cap the expansion to not exceed max size
  const newWidth = Math.min(generatedWidth * 2, maxSize);
  const newHeight = Math.min(generatedHeight * 2, maxSize);

  // Generate new tiles for the three new quadrants
  // (top-right, bottom-left, bottom-right)
  const newTiles = { ...tiles };
  const rng = mulberry32(seed + generatedWidth * generatedHeight); // New seed based on expansion

  const explorationRules = rules.exploration;
  const elevationScale = explorationRules.terrainScale || 8;
  const moistureScale = explorationRules.moistureScale || 6;
  const nodeSpawnChance = explorationRules.nodeSpawnChance || 0.12;

  // Use original center for ring calculations (stays constant across expansions)
  const mapCenterX = centerX ?? Math.floor(generatedWidth / 2);
  const mapCenterY = centerY ?? Math.floor(generatedHeight / 2);

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
          // Pass coordinates for ring-based age filtering
          const resourceType = selectResourceType(terrain, rng, rules, x, y, mapCenterX, mapCenterY);
          if (resourceType) {
            extractionNode = {
              id: `exp_node_${resourceType}_${x}_${y}`,
              resourceType,
              rate: getStandardizedNodeRate(resourceType, rules),
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
