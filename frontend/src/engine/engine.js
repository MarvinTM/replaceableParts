/**
 * replaceableParts Engine
 * A pure functional game engine for manufacturing simulation
 */

import { getNextExplorationExpansion, expandGeneratedMap } from './mapGenerator.js';
import { expandStateFromSave } from '../utils/saveCompression.js';

// ============================================================================
// PRNG - Mulberry32 (deterministic random number generator)
// ============================================================================

function createRNG(seed) {
  let currentSeed = seed;

  return {
    next() {
      currentSeed |= 0;
      currentSeed = currentSeed + 0x6D2B79F5 | 0;
      let t = Math.imul(currentSeed ^ currentSeed >>> 15, 1 | currentSeed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    },
    getCurrentSeed() {
      return currentSeed;
    }
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

// Mutable mode flag for simulation - skips cloning for massive performance gains
let mutableMode = false;

export function setMutableMode(enabled) {
  mutableMode = enabled;
}

function deepClone(obj) {
  // In mutable mode (simulations), skip cloning entirely
  if (mutableMode) {
    return obj;
  }
  // structuredClone is faster than JSON.parse/stringify
  // Available in Node 17+ and modern browsers
  return structuredClone(obj);
}

function getItemWeight(itemId, rules) {
  const material = rules.materials.find(m => m.id === itemId);
  return material ? material.weight : 1;
}

function getMaxStack(itemId, inventoryCapacity, rules) {
  const weight = getItemWeight(itemId, rules);
  return Math.floor(inventoryCapacity / weight);
}

/**
 * Check if a recipe corresponds to a disabled machine or generator
 * Returns true if the recipe should be excluded from discovery
 */
function isRecipeForDisabledStructure(recipeId, rules) {
  // Check if this recipe builds a disabled machine
  if (rules.machineRecipes?.[recipeId]) {
    const machine = rules.machines.find(m => m.id === recipeId);
    if (machine?.disabled) return true;
  }
  // Check if this recipe builds a disabled generator
  if (rules.generatorRecipes?.[recipeId]) {
    const generator = rules.generators.find(g => g.id === recipeId);
    if (generator?.disabled) return true;
  }
  return false;
}

// ============================================================================
// Research Helper Functions
// ============================================================================

/**
 * Calculate the highest age for which the player has unlocked any recipe
 */
function calculateHighestUnlockedAge(state, rules) {
  let highestAge = 1;
  for (const recipeId of state.unlockedRecipes) {
    const recipe = rules.recipes.find(r => r.id === recipeId);
    if (recipe) {
      // Check output materials for their age
      for (const outputId of Object.keys(recipe.outputs)) {
        const material = rules.materials.find(m => m.id === outputId);
        if (material && material.age > highestAge) {
          highestAge = material.age;
        }
      }
    }
  }
  return highestAge;
}

/**
 * Select a recipe using cascading age-weighted randomization
 * The lowest age with missing recipes gets priority.
 * Probability = (floor + (1 - floor) * missingRatio) * remainingProbabilityPool
 */
function selectRecipeByAgeWeighting(undiscovered, state, rules, rng) {
  const { floor } = rules.research.ageWeighting;

  // Group undiscovered recipes by age
  const recipesByAge = {};
  for (const recipe of undiscovered) {
    // Determine recipe age from its outputs
    let recipeAge = 1;
    for (const outputId of Object.keys(recipe.outputs)) {
      const material = rules.materials.find(m => m.id === outputId);
      if (material && material.age > recipeAge) {
        recipeAge = material.age;
      }
    }
    if (!recipesByAge[recipeAge]) {
      recipesByAge[recipeAge] = [];
    }
    recipesByAge[recipeAge].push(recipe);
  }

  // Calculate total recipes per age (for missing ratio calculation)
  const totalRecipesByAge = {};
  for (const recipe of rules.recipes) {
    let recipeAge = 1;
    for (const outputId of Object.keys(recipe.outputs)) {
      const material = rules.materials.find(m => m.id === outputId);
      if (material && material.age > recipeAge) {
        recipeAge = material.age;
      }
    }
    totalRecipesByAge[recipeAge] = (totalRecipesByAge[recipeAge] || 0) + 1;
  }

  // Calculate cascading probabilities
  const ages = Object.keys(recipesByAge).map(Number).sort((a, b) => a - b);
  const probabilities = {};
  let remainingPool = 1.0;
  let totalProb = 0;

  for (const age of ages) {
    const missingCount = recipesByAge[age].length;
    const totalCount = totalRecipesByAge[age] || 1;
    const ratio = missingCount / totalCount;
    
    // Weight calculation:
    // If ratio is 1.0 (100% missing), weight becomes 1.0, consuming all remaining pool.
    // If ratio is small (e.g. 1/30), weight is close to floor (e.g. 0.3).
    const weight = floor + (1.0 - floor) * ratio;
    
    const ageProb = remainingPool * weight;
    probabilities[age] = ageProb;
    totalProb += ageProb;
    
    remainingPool -= ageProb;
    
    // Stop if pool is effectively empty
    if (remainingPool <= 0.0001) break;
  }

  // Normalize probabilities and select
  // (totalProb effectively sums the slices we took from the pool)
  let roll = rng.next() * totalProb;
  for (const age of ages) {
    if (!probabilities[age]) continue;

    roll -= probabilities[age];
    if (roll <= 0) {
      // Select random recipe from this age
      const recipesInAge = recipesByAge[age];
      const index = Math.floor(rng.next() * recipesInAge.length);
      return recipesInAge[index];
    }
  }

  // Fallback: return first undiscovered
  return undiscovered[0];
}

/**
 * Create a prototype entry for a discovered recipe
 */
function createPrototypeEntry(recipe, rules) {
  const multiplier = getPrototypeMultiplierForRecipe(recipe, rules);
  const scalePrototypeQuantity = (qty) => Math.max(1, Math.ceil(qty * multiplier));

  // Determine if any input is a raw material (flow mode) or all are intermediate/final (slots mode)
  let hasNonRawInput = false;
  for (const inputId of Object.keys(recipe.inputs)) {
    const material = rules.materials.find(m => m.id === inputId);
    if (material && material.category !== 'raw') {
      hasNonRawInput = true;
      break;
    }
  }

  if (!hasNonRawInput) {
    // Flow mode: all inputs are raw materials
    const prototypeProgress = {};
    for (const inputId of Object.keys(recipe.inputs)) {
      prototypeProgress[inputId] = 0;
    }
    return {
      recipeId: recipe.id,
      mode: 'flow',
      prototypeProgress,
      requiredAmounts: Object.fromEntries(
        Object.entries(recipe.inputs).map(([id, qty]) => [id, scalePrototypeQuantity(qty)])
      )
    };
  } else {
    // Slots mode: at least one input is non-raw
    // Mark each slot as raw or not, so raw slots can auto-fill from rawMaterialSupply
    const slots = Object.entries(recipe.inputs).map(([materialId, quantity]) => {
      const material = rules.materials.find(m => m.id === materialId);
      const isRaw = material && material.category === 'raw';
      return {
        material: materialId,
        quantity: scalePrototypeQuantity(quantity),
        filled: 0,
        isRaw
      };
    });
    return {
      recipeId: recipe.id,
      mode: 'slots',
      slots
    };
  }
}

function normalizeFilledAmount(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return 0;
  return Math.floor(numeric);
}

/**
 * Migrate loaded game state to current prototype recipe definitions.
 * This keeps old saves compatible when blueprint/prototype requirements change.
 */
function migrateGameState(state, rules) {
  if (!state || !rules) return state;

  const migratedState = expandStateFromSave(deepClone(state));
  if (!migratedState.research) {
    migratedState.research = { active: false, researchPoints: 0, awaitingPrototype: [] };
  }
  if (!Array.isArray(migratedState.research.awaitingPrototype)) {
    migratedState.research.awaitingPrototype = [];
  }
  if (!migratedState.inventory || typeof migratedState.inventory !== 'object') {
    migratedState.inventory = {};
  }

  const migratedPrototypes = migratedState.research.awaitingPrototype.map((prototype) => {
    if (!prototype?.recipeId) return prototype;

    const recipe = rules.recipes.find(r => r.id === prototype.recipeId);
    if (!recipe) return prototype;

    const expectedPrototype = createPrototypeEntry(recipe, rules);
    const oldFilledByMaterial = new Map();

    if (prototype.mode === 'slots' && Array.isArray(prototype.slots)) {
      prototype.slots.forEach(slot => {
        if (!slot?.material) return;
        const filled = normalizeFilledAmount(slot.filled);
        if (filled <= 0) return;
        oldFilledByMaterial.set(slot.material, (oldFilledByMaterial.get(slot.material) || 0) + filled);
      });
    } else if (prototype.mode === 'flow' && prototype.prototypeProgress) {
      Object.entries(prototype.prototypeProgress).forEach(([materialId, amount]) => {
        const filled = normalizeFilledAmount(amount);
        if (filled <= 0) return;
        oldFilledByMaterial.set(materialId, (oldFilledByMaterial.get(materialId) || 0) + filled);
      });
    }

    if (expectedPrototype.mode === 'slots') {
      const remainingByMaterial = new Map(oldFilledByMaterial);

      expectedPrototype.slots = expectedPrototype.slots.map(slot => {
        const available = remainingByMaterial.get(slot.material) || 0;
        const carried = Math.min(slot.quantity, available);
        if (carried > 0) {
          const leftover = available - carried;
          if (leftover > 0) {
            remainingByMaterial.set(slot.material, leftover);
          } else {
            remainingByMaterial.delete(slot.material);
          }
        }
        return {
          ...slot,
          filled: carried,
        };
      });

      // Slots mode consumes inventory directly when filling.
      // If requirements changed and old filled materials no longer exist, refund leftovers.
      if (prototype.mode === 'slots') {
        remainingByMaterial.forEach((amount, materialId) => {
          if (amount <= 0) return;
          migratedState.inventory[materialId] = (migratedState.inventory[materialId] || 0) + amount;
        });
      }
    } else if (expectedPrototype.mode === 'flow') {
      const nextProgress = {};
      Object.entries(expectedPrototype.requiredAmounts || {}).forEach(([materialId, requiredAmount]) => {
        const available = oldFilledByMaterial.get(materialId) || 0;
        nextProgress[materialId] = Math.min(requiredAmount, available);
      });
      expectedPrototype.prototypeProgress = nextProgress;
    }

    return expectedPrototype;
  });

  migratedState.research.awaitingPrototype = migratedPrototypes;
  return migratedState;
}

function getPrototypeMultiplierForRecipe(recipe, rules) {
  const configured = rules?.research?.prototypeMultiplier;
  if (typeof configured === 'number') {
    return configured;
  }

  if (configured && typeof configured === 'object') {
    const outputAges = Object.keys(recipe.outputs || {})
      .map(outputId => {
        const material = rules.materials.find(m => m.id === outputId);
        return material?.age || recipe.age || 1;
      });
    const recipeAge = outputAges.length > 0 ? Math.max(...outputAges) : (recipe.age || 1);
    const ageValue = configured[recipeAge];
    if (typeof ageValue === 'number' && Number.isFinite(ageValue) && ageValue > 0) {
      return ageValue;
    }

    const fallbackValue = configured.default;
    if (typeof fallbackValue === 'number' && Number.isFinite(fallbackValue) && fallbackValue > 0) {
      return fallbackValue;
    }
  }

  return 3;
}

/**
 * Apply rewards when a prototype is completed:
 * - RP bonus: 50 × ageMultiplier
 * - Discovery boost: +100% for 30 ticks (stacks additively, resets duration)
 */
function applyPrototypeCompletionRewards(state, rules, recipeId) {
  const recipe = rules.recipes.find(r => r.id === recipeId);
  if (!recipe) return;

  // Find the material to get its age
  const outputId = Object.keys(recipe.outputs)[0];
  const material = rules.materials.find(m => m.id === outputId);
  const age = material?.age || recipe.age || 1;

  // Calculate RP bonus: 50 × ageMultiplier
  const baseRP = 50;
  const ageMultiplier = rules.research.ageMultipliers[age] || 1.0;
  const rpBonus = Math.floor(baseRP * ageMultiplier);

  // Add RP
  if (!state.research) {
    state.research = { active: false, researchPoints: 0, awaitingPrototype: [] };
  }
  state.research.researchPoints = (state.research.researchPoints || 0) + rpBonus;

  // Initialize prototype boost if needed
  if (!state.research.prototypeBoost) {
    state.research.prototypeBoost = { bonus: 0, ticksRemaining: 0 };
  }

  // Add to boost (+100% per prototype) and reset duration to 30 ticks
  state.research.prototypeBoost.bonus += 100;
  state.research.prototypeBoost.ticksRemaining = 30;
}

// ============================================================================
// Structure Dimension Utilities
// ============================================================================

/**
 * Get the dimensions of a structure based on its structureType.
 * - Machine types (e.g., 'basic_assembler') use rules.machines array
 * - Generator types (e.g., 'manual_crank') use rules.generators array
 * @param {string} structureType - The structure type identifier (machine or generator type ID)
 * @param {Object} rules - The game rules
 * @returns {{ sizeX: number, sizeY: number }} The structure dimensions
 */
function getStructureDimensions(structureType, rules) {
  // Check if it's a machine type
  const machineConfig = rules.machines.find(m => m.id === structureType);
  if (machineConfig) {
    return {
      sizeX: machineConfig.sizeX,
      sizeY: machineConfig.sizeY
    };
  }

  // Check if it's a generator type
  const genConfig = rules.generators.find(g => g.id === structureType);
  if (genConfig) {
    return {
      sizeX: genConfig.sizeX,
      sizeY: genConfig.sizeY
    };
  }

  // Default fallback for unknown types
  // console.warn(`Unknown structureType: ${structureType}, defaulting to 1x1`);
  return { sizeX: 1, sizeY: 1 };
}

/**
 * Get the energy output of a generator based on its type.
 * @param {string} type - The generator type (e.g. 'manual_crank')
 * @param {Object} rules - The game rules
 * @returns {number} Energy output per tick
 */
function getGeneratorOutput(type, rules) {
  const genConfig = rules.generators.find(g => g.id === type);
  return genConfig ? genConfig.energyOutput : 0;
}

// ============================================================================
// Grid Placement Utilities
// ============================================================================

function isWithinBounds(x, y, sizeX, sizeY, state) {
  // Check if the rectangle defined by (x, y, sizeX, sizeY) is fully contained
  // within the union of all purchased chunks.

  // Quick check: must be within global bounds
  if (x < 0 || y < 0) return false;
  if (x + sizeX > state.floorSpace.width || y + sizeY > state.floorSpace.height) return false;

  // Detailed check: Sum of intersection areas must equal structure area
  // This handles structures spanning multiple chunks
  const rect = { x, y, width: sizeX, height: sizeY };
  let coveredArea = 0;

  for (const chunk of state.floorSpace.chunks) {
    const intersect = getIntersection(rect, chunk);
    if (intersect) {
      coveredArea += intersect.width * intersect.height;
    }
  }

  // Floating point safety not needed for integers, but good practice
  return coveredArea === sizeX * sizeY;
}

function getIntersection(r1, r2) {
  const x1 = Math.max(r1.x, r2.x);
  const y1 = Math.max(r1.y, r2.y);
  const x2 = Math.min(r1.x + r1.width, r2.x + r2.width);
  const y2 = Math.min(r1.y + r1.height, r2.y + r2.height);
  if (x2 > x1 && y2 > y1) {
    return { width: x2 - x1, height: y2 - y1 };
  }
  return null;
}

function isColliding(x, y, sizeX, sizeY, placements, rules) {
  // Check if the rectangle from (x,y) to (x+sizeX-1, y+sizeY-1) overlaps any existing placement
  for (const placement of placements) {
    // If no structureType is present (legacy), we might need a fallback or fail safely. 
    // Ideally all placements have structureType now.
    // However, if sizeX/sizeY are still there (legacy), we could use them, but we want to force rule usage.
    
    // Default to 1x1 if we can't determine type (shouldn't happen with correct data)
    let pSizeX = 1;
    let pSizeY = 1;

    if (placement.structureType) {
       const dims = getStructureDimensions(placement.structureType, rules);
       pSizeX = dims.sizeX;
       pSizeY = dims.sizeY;
    } else if (placement.sizeX && placement.sizeY) {
       // Legacy fallback if data hasn't been migrated fully in runtime state
       pSizeX = placement.sizeX;
       pSizeY = placement.sizeY;
    }

    // Check for rectangle overlap
    const noOverlap =
      x + sizeX <= placement.x ||       // New is fully left of existing
      placement.x + pSizeX <= x ||      // Existing is fully left of new
      y + sizeY <= placement.y ||       // New is fully above existing
      placement.y + pSizeY <= y;        // Existing is fully above new

    if (!noOverlap) {
      return true; // Collision detected
    }
  }
  return false;
}

function canPlaceAt(state, x, y, sizeX, sizeY, rules) {
  // Pass state to isWithinBounds to access chunks
  if (!isWithinBounds(x, y, sizeX, sizeY, state)) {
    return { valid: false, error: 'Position out of bounds (area not purchased)' };
  }

  if (isColliding(x, y, sizeX, sizeY, state.floorSpace.placements, rules)) {
    return { valid: false, error: 'Position collides with existing structure' };
  }

  return { valid: true, error: null };
}

function isChunkPurchased(chunks, x, y) {
  return chunks.some(c => c.x === x && c.y === y);
}

function getNextExpansionSpiral(state, rules) {
  const { width, height } = state.floorSpace;
  const chunks = state.floorSpace.chunks || [];
  const { costPerCell, initialWidth, expansionScaleFactor } = rules.floorSpace;

  // Calculate cycle based on number of chunks
  // Each expansion cycle (doubling dimensions) strictly requires 12 chunks
  // Base state is 1 chunk.
  const expansionsDone = Math.max(0, chunks.length - 1);
  const completedCycles = Math.floor(expansionsDone / 12);

  // Calculate cost with exponential scaling based on expansions done
  // cost = baseCost * scaleFactor^expansionsDone
  const scaleFactor = expansionScaleFactor || 1.0;
  const costMultiplier = Math.pow(scaleFactor, expansionsDone);

  // Base size for current cycle
  // Cycle 0: initialWidth (e.g. 8)
  // Cycle 1: initialWidth * 2 (e.g. 16)
  const cycleBase = (initialWidth || 8) * Math.pow(2, completedCycles);

  const N = cycleBase;
  const target = N * 2;
  const chunkSize = N / 2;

  // Generate expansion sequence for this cycle
  // 1. Fill Right Wing (Quadrant B)
  for (let y = 0; y < N; y += chunkSize) {
    for (let x = N; x < target; x += chunkSize) {
      if (!isChunkPurchased(chunks, x, y)) {
        const baseCost = chunkSize * chunkSize * costPerCell;
        return {
          x,
          y,
          width: chunkSize,
          height: chunkSize,
          newWidth: Math.max(width, x + chunkSize),
          newHeight: Math.max(height, y + chunkSize),
          cellsAdded: chunkSize * chunkSize,
          cost: Math.floor(baseCost * costMultiplier)
        };
      }
    }
  }

  // 2. Fill Top Wing (Quadrants C+D)
  for (let y = N; y < target; y += chunkSize) {
    for (let x = 0; x < target; x += chunkSize) {
      if (!isChunkPurchased(chunks, x, y)) {
        const baseCost = chunkSize * chunkSize * costPerCell;
        return {
          x,
          y,
          width: chunkSize,
          height: chunkSize,
          newWidth: Math.max(width, x + chunkSize),
          newHeight: Math.max(height, y + chunkSize),
          cellsAdded: chunkSize * chunkSize,
          cost: Math.floor(baseCost * costMultiplier)
        };
      }
    }
  }

  return null;
}

function getNextExpansionFractal(state, rules) {
  const { width, height } = state.floorSpace;
  const chunks = state.floorSpace.chunks || [];
  const { initialWidth, initialChunkSize, costPerCell, expansionScaleFactor } = rules.floorSpace;

  // Calculate expansions done for scaling
  const expansionsDone = Math.max(0, chunks.length - 1);
  const scaleFactor = expansionScaleFactor || 1.0;
  const costMultiplier = Math.pow(scaleFactor, expansionsDone);

  let chunkSize = initialChunkSize;
  let targetSquare = initialWidth * 2;

  // Find the current target square based on completed squares
  while (width >= targetSquare && height >= targetSquare) {
    chunkSize *= 2;
    targetSquare *= 2;
  }

  // Determine expansion direction
  const expandWidth = width < targetSquare;

  // Calculate new dimensions
  const newWidth = expandWidth ? width + chunkSize : width;
  const newHeight = !expandWidth ? height + chunkSize : height;

  // Calculate the added strip dimensions
  const stripX = expandWidth ? width : 0;
  const stripY = expandWidth ? 0 : height;
  const stripWidth = expandWidth ? chunkSize : width;
  const stripHeight = !expandWidth ? chunkSize : height;

  const cellsAdded = stripWidth * stripHeight;
  const baseCost = cellsAdded * costPerCell;

  return {
    x: stripX,
    y: stripY,
    width: stripWidth,
    height: stripHeight,
    newWidth,
    newHeight,
    cellsAdded,
    cost: Math.floor(baseCost * costMultiplier)
  };
}

function getNextExpansionChunk(state, rules) {
  const type = rules.floorSpace.expansionType || 'spiral';
  
  if (type === 'fractal') {
    return getNextExpansionFractal(state, rules);
  }
  
  return getNextExpansionSpiral(state, rules);
}

// ... existing code ...

function buyFloorSpace(state, rules, payload) {
  const newState = deepClone(state);

  // Get the next expansion chunk based on current grid size
  const expansion = getNextExpansionChunk(newState, rules);

  if (!expansion) {
    return { state: newState, error: 'Maximum expansion reached or error in calculation' };
  }

  if (newState.credits < expansion.cost) {
    return { state: newState, error: `Not enough credits (need ${expansion.cost})` };
  }

  newState.credits -= expansion.cost;
  
  // Add new chunk
  if (!newState.floorSpace.chunks) {
    newState.floorSpace.chunks = [];
  }
  
  newState.floorSpace.chunks.push({
    x: expansion.x,
    y: expansion.y,
    width: expansion.width,   // Use explicit dimensions
    height: expansion.height  // Use explicit dimensions
  });

  // Update max bounds
  newState.floorSpace.width = expansion.newWidth;
  newState.floorSpace.height = expansion.newHeight;

  return { state: newState, error: null };
}

function calculateEnergy(state, rules) {
  // Only count energy from powered generators (backward compatible - default to powered)
  let produced = 0;
  for (const generator of state.generators) {
    if (generator.powered !== false) {
      produced += getGeneratorOutput(generator.type, rules);
    }
  }

  let consumed = 0;

  // Machine consumption only (research is checked separately)
  for (const machine of state.machines) {
    if (machine.enabled && machine.status !== 'blocked') {
      const machineConfig = rules.machines.find(m => m.id === machine.type);
      // Research facilities consume energy even without a recipe assigned
      // Regular machines only consume energy when they have a recipe
      const isResearchFacility = machineConfig && machineConfig.isResearchFacility;
      if (machine.recipeId || isResearchFacility) {
        const energyConsumption = machineConfig ? machineConfig.energyConsumption : 0;
        consumed += energyConsumption;
      }
    }
  }

  return { produced, consumed };
}

// ============================================================================
// Simulation Logic
// ============================================================================

function simulateTick(state, rules) {
  const newState = deepClone(state);
  const rng = createRNG(state.rngSeed);

  // Initialize research state for backward compatibility with old saves
  if (!newState.research) {
    newState.research = { active: false, researchPoints: 0, awaitingPrototype: [] };
  }
  if (!newState.research.awaitingPrototype) {
    newState.research.awaitingPrototype = [];
  }
  if (typeof newState.research.researchPoints !== 'number') {
    newState.research.researchPoints = 0;
  }

  // Track production events for UI animations
  const productionEvents = [];

  // Track items sold this tick for market recovery
  const soldThisTick = new Set();

  // 1. Extraction Supply Calculation (Raw materials flow directly to machines and generators)
  const rawMaterialSupply = {};
  for (const node of newState.extractionNodes) {
    if (node.active) {
      const resourceId = node.resourceType;
      rawMaterialSupply[resourceId] = (rawMaterialSupply[resourceId] || 0) + node.rate;
    }
  }

  // 2. Generator Fuel Processing (must happen before energy calculation)
  for (const generator of newState.generators) {
    const genConfig = rules.generators.find(g => g.id === generator.type);

    if (!genConfig?.fuelRequirement) {
      // No fuel requirement - always powered
      generator.powered = true;
      continue;
    }

    const { materialId, consumptionRate } = genConfig.fuelRequirement;
    const material = rules.materials.find(m => m.id === materialId);
    const isRaw = material && material.category === 'raw';

    // Check fuel availability from appropriate source
    let available = isRaw
      ? (rawMaterialSupply[materialId] || 0)
      : (newState.inventory[materialId] || 0);

    if (available >= consumptionRate) {
      // Consume fuel
      if (isRaw) {
        rawMaterialSupply[materialId] -= consumptionRate;
      } else {
        newState.inventory[materialId] -= consumptionRate;
        if (newState.inventory[materialId] === 0) {
          delete newState.inventory[materialId];
        }
      }
      generator.powered = true;
    } else {
      // No fuel available - generator produces no power
      generator.powered = false;
    }
  }

  // 3. Energy Calculation (respects generator powered state)
  let energy = calculateEnergy(newState, rules);

  // Try to unblock machines if there's available energy (starting from first added)
  let availableEnergy = energy.produced - energy.consumed;
  for (let i = 0; i < newState.machines.length && availableEnergy > 0; i++) {
    const machine = newState.machines[i];
    if (machine.enabled && machine.recipeId && machine.status === 'blocked') {
      const machineConfig = rules.machines.find(m => m.id === machine.type);
      const energyConsumption = machineConfig ? machineConfig.energyConsumption : 0;
      if (energyConsumption <= availableEnergy) {
        machine.status = 'working';
        availableEnergy -= energyConsumption;
      }
    }
  }

  // Recalculate energy after unblocking
  energy = calculateEnergy(newState, rules);
  newState.energy = energy;

  // If not enough energy, block machines (starting from last added)
  if (energy.consumed > energy.produced) {
    let deficit = energy.consumed - energy.produced;
    for (let i = newState.machines.length - 1; i >= 0 && deficit > 0; i--) {
      const machine = newState.machines[i];
      // Only block enabled machines that are not already blocked
      if (machine.enabled && machine.recipeId && machine.status !== 'blocked') {
        machine.status = 'blocked';
        const machineConfig = rules.machines.find(m => m.id === machine.type);
        const energyConsumption = machineConfig ? machineConfig.energyConsumption : 0;
        deficit -= energyConsumption;
      }
    }
    // Recalculate energy after blocking
    newState.energy = calculateEnergy(newState, rules);
  }

  // 4. Machine Processing
  for (const machine of newState.machines) {
    if (!machine.enabled || !machine.recipeId || machine.status === 'blocked') {
      continue;
    }

    const recipe = rules.recipes.find(r => r.id === machine.recipeId);
    if (!recipe) {
      machine.status = 'idle';
      continue;
    }

    // Check if recipe is unlocked
    if (!newState.unlockedRecipes.includes(recipe.id)) {
      machine.status = 'idle';
      continue;
    }

    machine.status = 'working';

    // Pull Phase: Try to pull needed ingredients
    let canProgress = true;
    for (const [itemId, needed] of Object.entries(recipe.inputs)) {
      const inBuffer = machine.internalBuffer[itemId] || 0;
      const stillNeeded = needed - inBuffer;

      if (stillNeeded > 0) {
        // Determine source based on material category
        const material = rules.materials.find(m => m.id === itemId);
        const isRaw = material && material.category === 'raw';

        let available = 0;
        if (isRaw) {
           available = rawMaterialSupply[itemId] || 0;
        } else {
           available = newState.inventory[itemId] || 0;
        }

        const toPull = Math.min(stillNeeded, available);

        if (toPull > 0) {
          machine.internalBuffer[itemId] = inBuffer + toPull;
          
          if (isRaw) {
            rawMaterialSupply[itemId] -= toPull;
          } else {
            newState.inventory[itemId] -= toPull;
          }
        }

        if (machine.internalBuffer[itemId] < needed) {
          canProgress = false;
        }
      }
    }

    // Completion Check: If buffer matches recipe inputs, produce output
    let bufferComplete = true;
    for (const [itemId, needed] of Object.entries(recipe.inputs)) {
      if ((machine.internalBuffer[itemId] || 0) < needed) {
        bufferComplete = false;
        break;
      }
    }

    if (bufferComplete) {
      // First check if there's space for ALL outputs before consuming inputs
      let canProduce = true;
      for (const [itemId, quantity] of Object.entries(recipe.outputs)) {
        const currentAmount = newState.inventory[itemId] || 0;
        const maxStack = getMaxStack(itemId, newState.inventorySpace, rules);
        const spaceLeft = maxStack - currentAmount;
        if (spaceLeft < quantity) {
          canProduce = false;
          break;
        }
      }

      if (canProduce) {
        // Consume buffer
        for (const [itemId, needed] of Object.entries(recipe.inputs)) {
          machine.internalBuffer[itemId] -= needed;
          if (machine.internalBuffer[itemId] === 0) {
            delete machine.internalBuffer[itemId];
          }
        }

        // Add outputs to inventory
        for (const [itemId, quantity] of Object.entries(recipe.outputs)) {
          const currentAmount = newState.inventory[itemId] || 0;
          newState.inventory[itemId] = currentAmount + quantity;

          // Track production event for UI animations
          productionEvents.push({
            machineId: machine.id,
            machineType: machine.type,
            x: machine.x,
            y: machine.y,
            itemId,
            quantity,
            tick: newState.tick
          });
        }
      }
      // If can't produce, buffer stays intact - machine waits for space
    }
  }

  // 4. Research Phase
  // Research runs if active AND there's enough spare energy after machines
  const spareEnergy = newState.energy.produced - newState.energy.consumed;
  if (newState.research.active && spareEnergy >= rules.research.energyCost) {
    const roll = rng.next();

    // Calculate discovery chance with proximity bonus
    let discoveryChance = rules.research.discoveryChance;

    // Find undiscovered recipes (exclude already unlocked recipes and disabled machine/generator recipes)
    const undiscovered = rules.recipes.filter(r =>
      !newState.discoveredRecipes.includes(r.id) &&
      !newState.unlockedRecipes.includes(r.id) &&
      !isRecipeForDisabledStructure(r.id, rules)
    );

    if (undiscovered.length > 0 && roll < discoveryChance) {
      // Weight recipes by proximity (do we have their input materials?)
      const weighted = undiscovered.map(recipe => {
        let weight = 1;
        for (const itemId of Object.keys(recipe.inputs)) {
          const material = rules.materials.find(m => m.id === itemId);
          const isRaw = material && material.category === 'raw';
          
          let hasItem = false;
          if (isRaw) {
             // For raw materials, check if we are currently producing them (any active node)
             hasItem = newState.extractionNodes.some(n => n.active && n.resourceType === itemId);
          } else {
             hasItem = (newState.inventory[itemId] || 0) > 0;
          }

          if (hasItem) {
            weight += rules.research.proximityWeight;
          }
        }
        return { recipe, weight };
      });

      // Weighted random selection
      const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0);
      let selection = rng.next() * totalWeight;

      for (const { recipe, weight } of weighted) {
        selection -= weight;
        if (selection <= 0) {
          newState.discoveredRecipes.push(recipe.id);
          break;
        }
      }
    }
  }

  // 4b. Passive Discovery (1/500 chance per tick, independent of active research)
  // Calculate bonus from research laboratories
  let researchLabBonus = 0;
  for (const machine of newState.machines) {
    if (machine.enabled && machine.status !== 'blocked') {
      const machineConfig = rules.machines.find(m => m.id === machine.type);
      if (machineConfig && machineConfig.isResearchFacility && machineConfig.passiveDiscoveryBonus) {
        researchLabBonus += machineConfig.passiveDiscoveryBonus;
      }
    }
  }

  // Calculate prototype boost (from completing prototypes)
  let prototypeBoostMultiplier = 1.0;
  if (newState.research?.prototypeBoost?.ticksRemaining > 0) {
    // Convert bonus percentage to multiplier (100% bonus = 2x multiplier)
    prototypeBoostMultiplier = 1 + (newState.research.prototypeBoost.bonus / 100);
  }

  const basePassiveChance = (rules.research.passiveDiscoveryChance || 0) + researchLabBonus;
  const effectivePassiveChance = basePassiveChance * prototypeBoostMultiplier;
  if (effectivePassiveChance > 0) {
    const passiveRoll = rng.next();
    if (passiveRoll < effectivePassiveChance) {
      const undiscoveredForPassive = rules.recipes.filter(r =>
        !newState.discoveredRecipes.includes(r.id) &&
        !newState.unlockedRecipes.includes(r.id) &&
        !isRecipeForDisabledStructure(r.id, rules)
      );
      if (undiscoveredForPassive.length > 0) {
        // Use age-weighted selection for passive discovery too
        const passiveRecipe = selectRecipeByAgeWeighting(undiscoveredForPassive, newState, rules, rng);
        newState.discoveredRecipes.push(passiveRecipe.id);
        // Create prototype entry for passive discovery
        const passivePrototype = createPrototypeEntry(passiveRecipe, rules);
        newState.research.awaitingPrototype.push(passivePrototype);
      }
    }
  }

  // 4c. Flow Prototype Processing (raw materials from extraction feed into prototypes)
  // Note: This happens after machines have consumed, using leftover raw material supply
  for (const prototype of newState.research.awaitingPrototype) {
    if (prototype.mode === 'flow') {
      let prototypeComplete = true;
      for (const inputId of Object.keys(prototype.requiredAmounts)) {
        const needed = prototype.requiredAmounts[inputId];
        const current = prototype.prototypeProgress[inputId] || 0;
        const stillNeeded = needed - current;

        if (stillNeeded > 0) {
          // Pull from raw material supply
          const available = rawMaterialSupply[inputId] || 0;
          const toPull = Math.min(stillNeeded, available);

          if (toPull > 0) {
            prototype.prototypeProgress[inputId] = current + toPull;
            rawMaterialSupply[inputId] -= toPull;
          }

          if (prototype.prototypeProgress[inputId] < needed) {
            prototypeComplete = false;
          }
        }
      }

      // If prototype is complete, move to unlocked recipes and apply rewards
      if (prototypeComplete) {
        if (!newState.unlockedRecipes.includes(prototype.recipeId)) {
          newState.unlockedRecipes.push(prototype.recipeId);
          // Apply completion rewards (RP bonus + discovery boost)
          applyPrototypeCompletionRewards(newState, rules, prototype.recipeId);
        }
      }
    }
  }

  // 4d. Slots Prototype Raw Material Auto-Fill
  // For slots-mode prototypes, auto-fill any raw material slots from rawMaterialSupply
  for (const prototype of newState.research.awaitingPrototype) {
    if (prototype.mode === 'slots') {
      // Migration: Add isRaw flag to existing slots that don't have it
      for (const slot of prototype.slots) {
        if (slot.isRaw === undefined) {
          const material = rules.materials.find(m => m.id === slot.material);
          slot.isRaw = material && material.category === 'raw';
        }
      }

      for (const slot of prototype.slots) {
        if (slot.isRaw && slot.filled < slot.quantity) {
          // Auto-fill raw material slot from rawMaterialSupply
          const stillNeeded = slot.quantity - slot.filled;
          const available = rawMaterialSupply[slot.material] || 0;
          const toPull = Math.min(stillNeeded, available);

          if (toPull > 0) {
            slot.filled += toPull;
            rawMaterialSupply[slot.material] -= toPull;
          }
        }
      }

      // Check if slots-mode prototype is now complete (all slots filled)
      const isComplete = prototype.slots.every(s => s.filled >= s.quantity);
      if (isComplete) {
        if (!newState.unlockedRecipes.includes(prototype.recipeId)) {
          newState.unlockedRecipes.push(prototype.recipeId);
          // Apply completion rewards (RP bonus + discovery boost)
          applyPrototypeCompletionRewards(newState, rules, prototype.recipeId);
        }
      }
    }
  }

  // Remove completed prototypes (both flow and slots mode)
  newState.research.awaitingPrototype = newState.research.awaitingPrototype.filter(proto => {
    if (proto.mode === 'flow') {
      // Check if all requirements are met
      for (const inputId of Object.keys(proto.requiredAmounts)) {
        if ((proto.prototypeProgress[inputId] || 0) < proto.requiredAmounts[inputId]) {
          return true; // Keep incomplete prototypes
        }
      }
      return false; // Remove complete prototypes
    } else if (proto.mode === 'slots') {
      // Check if all slots are filled
      const isComplete = proto.slots.every(s => s.filled >= s.quantity);
      return !isComplete; // Keep incomplete, remove complete
    }
    return true; // Keep unknown modes (safety)
  });

  // 4e. Prototype boost countdown
  // Decrement boost ticks and clear when expired
  if (newState.research?.prototypeBoost?.ticksRemaining > 0) {
    newState.research.prototypeBoost.ticksRemaining -= 1;
    if (newState.research.prototypeBoost.ticksRemaining <= 0) {
      // Boost expired - clear it
      newState.research.prototypeBoost.bonus = 0;
      newState.research.prototypeBoost.ticksRemaining = 0;
    }
  }

  // 5. Market Recovery (for items not sold this tick)
  // Initialize marketDamage if it doesn't exist (for old saves)
  if (!newState.marketDamage) {
    newState.marketDamage = {};
  }

  for (const itemId of Object.keys(newState.marketPopularity)) {
    if (!soldThisTick.has(itemId)) {
      // Calculate recovery rate scaled by market damage
      const damage = newState.marketDamage[itemId] || 0;
      const damagePenalty = 1 + (damage / rules.market.damagePenaltyFactor);
      const effectiveRecoveryRate = rules.market.recoveryRate / damagePenalty;

      // Apply recovery
      newState.marketPopularity[itemId] = Math.min(
        rules.market.maxPopularity,
        newState.marketPopularity[itemId] + effectiveRecoveryRate
      );

      // Heal damage over time (only when not selling)
      if (damage > 0) {
        newState.marketDamage[itemId] = Math.max(
          0,
          damage - rules.market.damageHealingRate
        );
      }
    }
  }

  // 6. External Market Events (random price fluctuations)
  // Initialize marketEvents if it doesn't exist (for old saves)
  if (!newState.marketEvents) {
    newState.marketEvents = {};
  }

  // Get all final goods from discovered recipes (needed for both events and price sampling)
  const discoveredFinalGoodIds = new Set();
  for (const recipeId of newState.discoveredRecipes) {
    const recipe = rules.recipes.find(r => r.id === recipeId);
    if (recipe && recipe.outputs) {
      for (const outputId of Object.keys(recipe.outputs)) {
        const material = rules.materials.find(m => m.id === outputId);
        if (material && material.category === 'final') {
          discoveredFinalGoodIds.add(outputId);
        }
      }
    }
  }

  // Also include unlocked recipes
  for (const recipeId of newState.unlockedRecipes) {
    const recipe = rules.recipes.find(r => r.id === recipeId);
    if (recipe && recipe.outputs) {
      for (const outputId of Object.keys(recipe.outputs)) {
        const material = rules.materials.find(m => m.id === outputId);
        if (material && material.category === 'final') {
          discoveredFinalGoodIds.add(outputId);
        }
      }
    }
  }

  // Remove expired events
  const currentTick = newState.tick;
  for (const itemId of Object.keys(newState.marketEvents)) {
    if (newState.marketEvents[itemId].expiresAt <= currentTick) {
      delete newState.marketEvents[itemId];
    }
  }

  // Roll for new events on discovered final goods (only if they don't already have an active event)
  const eventChance = rules.market.eventChance || 0.003;
  const eventMinMod = rules.market.eventMinModifier || 0.10;
  const eventMaxMod = rules.market.eventMaxModifier || 0.20;
  const eventMinDur = rules.market.eventMinDuration || 30;
  const eventMaxDur = rules.market.eventMaxDuration || 80;

  for (const itemId of discoveredFinalGoodIds) {
    // Skip if item already has an active event
    if (newState.marketEvents[itemId]) {
      continue;
    }

    const roll = rng.next();
    if (roll < eventChance) {
      // Event triggered! Determine type and strength
      const isPositive = rng.next() < 0.5;
      const modifierStrength = eventMinMod + rng.next() * (eventMaxMod - eventMinMod);
      const duration = Math.floor(eventMinDur + rng.next() * (eventMaxDur - eventMinDur));

      newState.marketEvents[itemId] = {
        type: isPositive ? 'positive' : 'negative',
        modifier: isPositive ? (1 + modifierStrength) : (1 - modifierStrength),
        expiresAt: currentTick + duration
      };
    }
  }

  // 7. Sample Price History (periodically)
  // Price history is now tracked for ALL discovered final goods, not just those that have been sold
  const nextTick = newState.tick + 1;
  if (nextTick % rules.market.priceHistorySampleInterval === 0) {
    // Initialize price history if needed
    if (!newState.marketPriceHistory) {
      newState.marketPriceHistory = [];
    }

    // Sample current prices for all discovered final goods (using set computed above)
    const sample = { tick: nextTick };
    for (const itemId of discoveredFinalGoodIds) {
      const material = rules.materials.find(m => m.id === itemId);
      if (material) {
        // Use existing popularity or default to maxPopularity (new items start with high demand)
        const popularity = newState.marketPopularity[itemId] || rules.market.maxPopularity;

        // Apply event modifier if there's an active event
        const eventModifier = newState.marketEvents[itemId]?.modifier || 1.0;

        sample[itemId] = Math.floor(material.basePrice * popularity * eventModifier);

        // Initialize market popularity if not yet tracked (so recovery can happen)
        if (!newState.marketPopularity[itemId]) {
          newState.marketPopularity[itemId] = rules.market.maxPopularity;
        }
      }
    }

    // Add sample and trim to max samples
    newState.marketPriceHistory.push(sample);
    if (newState.marketPriceHistory.length > rules.market.priceHistoryMaxSamples) {
      newState.marketPriceHistory.shift();
    }
  }

  // 7. Advance State
  newState.tick += 1;
  newState.rngSeed = rng.getCurrentSeed();

  return { newState, productionEvents };
}

// ============================================================================
// Action Handlers
// ============================================================================

function addMachine(state, rules, payload) {
  const newState = deepClone(state);
  const { machineType, x, y } = payload;

  // Validate position is provided
  if (typeof x !== 'number' || typeof y !== 'number') {
    return { state: newState, error: 'Position (x, y) is required' };
  }

  // Look up machine configuration
  const machineConfig = rules.machines.find(m => m.id === machineType);
  if (!machineConfig) {
    return { state: newState, error: 'Machine type not found' };
  }

  const sizeX = machineConfig.sizeX;
  const sizeY = machineConfig.sizeY;

  // Check if position is valid and not colliding
  const placement = canPlaceAt(newState, x, y, sizeX, sizeY, rules);
  if (!placement.valid) {
    return { state: newState, error: placement.error };
  }

  // Check if we have the machine in the built machines pool
  if (!newState.builtMachines) {
    newState.builtMachines = {};
  }
  const available = newState.builtMachines[machineType] || 0;

  if (available < 1) {
    return { state: newState, error: `No built ${machineConfig.name} available to deploy. Build one first.` };
  }

  // Consume from the built machines pool
  newState.builtMachines[machineType] -= 1;
  if (newState.builtMachines[machineType] === 0) {
    delete newState.builtMachines[machineType];
  }

  const machineId = generateId();

  // Add to machines array
  newState.machines.push({
    id: machineId,
    type: machineType,
    recipeId: null,
    internalBuffer: {},
    status: 'idle',
    enabled: true,
    x,
    y
  });

  // Add to floor placements
  newState.floorSpace.placements.push({
    id: machineId,
    x,
    y,
    structureType: machineType
  });

  return { state: newState, error: null };
}

function removeMachine(state, rules, payload) {
  const newState = deepClone(state);
  const { machineId } = payload;

  const machineIndex = newState.machines.findIndex(m => m.id === machineId);
  if (machineIndex === -1) {
    return { state: newState, error: 'Machine not found' };
  }

  const machine = newState.machines[machineIndex];

  // Return items in buffer to inventory
  for (const [itemId, quantity] of Object.entries(machine.internalBuffer)) {
    newState.inventory[itemId] = (newState.inventory[itemId] || 0) + quantity;
  }

  // Return machine to the built machines pool
  if (!newState.builtMachines) {
    newState.builtMachines = {};
  }
  newState.builtMachines[machine.type] = (newState.builtMachines[machine.type] || 0) + 1;

  // Remove from machines array
  newState.machines.splice(machineIndex, 1);

  // Remove from floor placements
  const placementIndex = newState.floorSpace.placements.findIndex(p => p.id === machineId);
  if (placementIndex !== -1) {
    newState.floorSpace.placements.splice(placementIndex, 1);
  }

  return { state: newState, error: null };
}

function moveMachine(state, rules, payload) {
  const newState = deepClone(state);
  const { machineId, x, y } = payload;

  const machine = newState.machines.find(m => m.id === machineId);
  if (!machine) {
    return { state: newState, error: 'Machine not found' };
  }

  // Get size from rules based on machine type
  const machineConfig = rules.machines.find(m => m.id === machine.type);
  if (!machineConfig) {
    // Should not happen if data is consistent
    return { state: newState, error: 'Machine type configuration not found' };
  }
  const sizeX = machineConfig.sizeX;
  const sizeY = machineConfig.sizeY;

  // Check if new position is valid (excluding the machine being moved)
  const placementsWithoutThis = newState.floorSpace.placements.filter(p => p.id !== machineId);
  const tempState = { ...newState, floorSpace: { ...newState.floorSpace, placements: placementsWithoutThis } };

  const placement = canPlaceAt(tempState, x, y, sizeX, sizeY, rules);
  if (!placement.valid) {
    return { state: newState, error: placement.error };
  }

  // Update machine position
  machine.x = x;
  machine.y = y;

  // Update floor placement
  const placementEntry = newState.floorSpace.placements.find(p => p.id === machineId);
  if (placementEntry) {
    placementEntry.x = x;
    placementEntry.y = y;
  }

  return { state: newState, error: null };
}

function assignRecipe(state, rules, payload) {
  const newState = deepClone(state);
  const { machineId, recipeId, cheat } = payload;

  const machine = newState.machines.find(m => m.id === machineId);
  if (!machine) {
    return { state: newState, error: 'Machine not found' };
  }

  if (recipeId !== null) {
    const recipe = rules.recipes.find(r => r.id === recipeId);
    if (!recipe) {
      return { state: newState, error: 'Recipe not found' };
    }

    if (!cheat && !newState.unlockedRecipes.includes(recipeId)) {
      return { state: newState, error: 'Recipe not unlocked' };
    }

    // Check if machine type supports this recipe
    const machineConfig = rules.machines.find(m => m.id === machine.type);
    if (machineConfig && !machineConfig.allowedRecipes.includes(recipeId)) {
      return { state: newState, error: 'This machine type cannot process this recipe' };
    }
  }

  // Return items in buffer to inventory when changing recipe
  for (const [itemId, quantity] of Object.entries(machine.internalBuffer)) {
    newState.inventory[itemId] = (newState.inventory[itemId] || 0) + quantity;
  }

  machine.recipeId = recipeId;
  machine.internalBuffer = {};
  machine.status = recipeId ? 'working' : 'idle';

  return { state: newState, error: null };
}

function addGenerator(state, rules, payload) {
  const newState = deepClone(state);
  const { generatorType, x, y } = payload;

  // Validate position is provided
  if (typeof x !== 'number' || typeof y !== 'number') {
    return { state: newState, error: 'Position (x, y) is required' };
  }

  const genConfig = rules.generators.find(g => g.id === generatorType);
  if (!genConfig) {
    return { state: newState, error: 'Generator type not found' };
  }

  const sizeX = genConfig.sizeX;
  const sizeY = genConfig.sizeY;

  // Check if position is valid and not colliding
  const placement = canPlaceAt(newState, x, y, sizeX, sizeY, rules);
  if (!placement.valid) {
    return { state: newState, error: placement.error };
  }

  // Check if we have the generator in the built generators pool
  if (!newState.builtGenerators) {
    newState.builtGenerators = {};
  }
  const available = newState.builtGenerators[generatorType] || 0;

  if (available < 1) {
    return { state: newState, error: `No built ${genConfig.name} available to deploy. Build one first.` };
  }

  // Consume from the built generators pool
  newState.builtGenerators[generatorType] -= 1;
  if (newState.builtGenerators[generatorType] === 0) {
    delete newState.builtGenerators[generatorType];
  }

  const generatorId = generateId();

  // Add to generators array
  newState.generators.push({
    id: generatorId,
    type: generatorType,
    x,
    y
  });

  // Add to floor placements
  newState.floorSpace.placements.push({
    id: generatorId,
    x,
    y,
    structureType: generatorType
  });

  // Recalculate energy
  newState.energy = calculateEnergy(newState, rules);

  return { state: newState, error: null };
}

function removeGenerator(state, rules, payload) {
  const newState = deepClone(state);
  const { generatorId } = payload;

  const genIndex = newState.generators.findIndex(g => g.id === generatorId);
  if (genIndex === -1) {
    return { state: newState, error: 'Generator not found' };
  }

  const generator = newState.generators[genIndex];

  // Return generator to the built generators pool
  if (!newState.builtGenerators) {
    newState.builtGenerators = {};
  }
  newState.builtGenerators[generator.type] = (newState.builtGenerators[generator.type] || 0) + 1;

  // Remove from generators array
  newState.generators.splice(genIndex, 1);

  // Remove from floor placements
  const placementIndex = newState.floorSpace.placements.findIndex(p => p.id === generatorId);
  if (placementIndex !== -1) {
    newState.floorSpace.placements.splice(placementIndex, 1);
  }

  // Recalculate energy
  newState.energy = calculateEnergy(newState, rules);

  return { state: newState, error: null };
}

function moveGenerator(state, rules, payload) {
  const newState = deepClone(state);
  const { generatorId, x, y } = payload;

  const generator = newState.generators.find(g => g.id === generatorId);
  if (!generator) {
    return { state: newState, error: 'Generator not found' };
  }

  // Get size from rules
  const genConfig = rules.generators.find(g => g.id === generator.type);
  if (!genConfig) {
      // Should not happen if data is consistent
      return { state: newState, error: 'Generator type configuration not found' };
  }
  const sizeX = genConfig.sizeX;
  const sizeY = genConfig.sizeY;

  // Check if new position is valid (excluding the generator being moved)
  const placementsWithoutThis = newState.floorSpace.placements.filter(p => p.id !== generatorId);
  
  // Create temp state with placements removed for collision check
  const tempState = { ...newState, floorSpace: { ...newState.floorSpace, placements: placementsWithoutThis } };

  const placement = canPlaceAt(tempState, x, y, sizeX, sizeY, rules);
  if (!placement.valid) {
    return { state: newState, error: placement.error };
  }

  // Update generator position
  generator.x = x;
  generator.y = y;

  // Update floor placement
  const placementEntry = newState.floorSpace.placements.find(p => p.id === generatorId);
  if (placementEntry) {
    placementEntry.x = x;
    placementEntry.y = y;
  }

  return { state: newState, error: null };
}

/**
 * Calculate obsolescence multiplier for an item based on technological advancement
 * Returns a multiplier (0.5 to 1.0) where lower = more obsolete
 */
function calculateObsolescence(itemAge, discoveredRecipes, rules) {
  if (!rules.market.obsolescenceEnabled) {
    return 1.0; // No obsolescence if disabled
  }

  const nextAge = itemAge + 1;
  if (nextAge > 7) {
    return 1.0; // Age 7 has no next age, so no obsolescence
  }

  // Count total final goods recipes for next age
  const nextAgeFinalGoods = rules.recipes.filter(recipe => {
    const outputs = Object.keys(recipe.outputs || {});
    return outputs.some(outputId => {
      const material = rules.materials.find(m => m.id === outputId);
      return material && material.category === 'final' && material.age === nextAge;
    });
  });

  const totalNextAgeRecipes = nextAgeFinalGoods.length;
  if (totalNextAgeRecipes === 0) {
    return 1.0; // No final goods in next age
  }

  // Count discovered final goods recipes from next age
  const discoveredNextAgeRecipes = nextAgeFinalGoods.filter(recipe =>
    discoveredRecipes.includes(recipe.id)
  ).length;

  // Calculate progress through next age (0.0 to 1.0)
  const progressThroughNextAge = discoveredNextAgeRecipes / totalNextAgeRecipes;

  // Calculate obsolescence debuff
  const debuff = progressThroughNextAge * rules.market.obsolescenceMaxDebuff;

  // Return multiplier (1.0 = no debuff, 0.5 = max debuff)
  return 1.0 - debuff;
}

function sellGoods(state, rules, payload) {
  const newState = deepClone(state);
  const { itemId, quantity } = payload;

  const available = newState.inventory[itemId] || 0;
  if (available < quantity) {
    return { state: newState, error: 'Not enough items in inventory' };
  }

  const material = rules.materials.find(m => m.id === itemId);
  if (!material) {
    return { state: newState, error: 'Item not found in materials list' };
  }

  // Initialize market tracking if needed
  if (!newState.marketRecentSales) {
    newState.marketRecentSales = [];
  }

  // Calculate diversification bonus based on recent sales
  const recentWindow = newState.tick - rules.market.diversificationWindow;
  const recentSales = newState.marketRecentSales.filter(sale => sale.tick > recentWindow);
  const uniqueItemsSold = new Set(recentSales.map(sale => sale.itemId)).size;

  let diversificationBonus = 1.0;
  const bonusThresholds = Object.keys(rules.market.diversificationBonuses)
    .map(Number)
    .sort((a, b) => b - a); // Sort descending

  for (const threshold of bonusThresholds) {
    if (uniqueItemsSold >= threshold) {
      diversificationBonus = rules.market.diversificationBonuses[threshold];
      break;
    }
  }

  // Calculate obsolescence multiplier (technological advancement penalty)
  const obsolescenceMultiplier = calculateObsolescence(
    material.age,
    newState.discoveredRecipes || [],
    rules
  );

  // Get popularity multiplier (default to 1.0 if not tracked)
  const popularity = newState.marketPopularity[itemId] || 1.0;

  // Get event modifier if there's an active market event
  const eventModifier = newState.marketEvents?.[itemId]?.modifier || 1.0;

  // Final price = base × popularity × diversification × obsolescence × event
  const pricePerUnit = material.basePrice * popularity * diversificationBonus * obsolescenceMultiplier * eventModifier;
  const totalCredits = Math.floor(pricePerUnit * quantity);

  newState.inventory[itemId] -= quantity;
  if (newState.inventory[itemId] === 0) {
    delete newState.inventory[itemId];
  }

  newState.credits += totalCredits;

  // Initialize market tracking if needed
  if (!newState.marketPopularity[itemId]) {
    newState.marketPopularity[itemId] = rules.market.maxPopularity; // New items start at max
  }
  if (!newState.marketDamage) {
    newState.marketDamage = {};
  }
  if (!newState.marketDamage[itemId]) {
    newState.marketDamage[itemId] = 0;
  }

  // Calculate accelerating decay based on quantity sold
  let totalDecay = 0;
  let remainingQty = quantity;

  // First 10 units: base rate
  if (remainingQty > 0) {
    const qtyAtBaseRate = Math.min(remainingQty, 10);
    totalDecay += qtyAtBaseRate * rules.market.decayRateBase;
    remainingQty -= qtyAtBaseRate;
  }

  // Next 15 units (11-25): medium rate
  if (remainingQty > 0) {
    const qtyAtMediumRate = Math.min(remainingQty, 15);
    totalDecay += qtyAtMediumRate * rules.market.decayRateMedium;
    remainingQty -= qtyAtMediumRate;
  }

  // Remaining units (26+): high rate
  if (remainingQty > 0) {
    totalDecay += remainingQty * rules.market.decayRateHigh;
  }

  // Apply decay
  newState.marketPopularity[itemId] = Math.max(
    rules.market.minPopularity,
    newState.marketPopularity[itemId] - totalDecay
  );

  // Track market damage if selling while saturated (popularity < 1.0)
  // All ages accumulate damage equally (saturation affects all ages the same)
  if (newState.marketPopularity[itemId] < 1.0) {
    newState.marketDamage[itemId] += quantity;
  }

  // Track this sale for diversification bonus calculation
  newState.marketRecentSales.push({
    tick: newState.tick,
    itemId: itemId
  });

  // Trim old sales outside the diversification window
  const windowStart = newState.tick - rules.market.diversificationWindow;
  newState.marketRecentSales = newState.marketRecentSales.filter(
    sale => sale.tick > windowStart
  );

  return { state: newState, error: null };
}

function toggleResearch(state, rules, payload) {
  const newState = deepClone(state);
  const { active } = payload;

  newState.research.active = active;

  // Recalculate energy
  newState.energy = calculateEnergy(newState, rules);

  return { state: newState, error: null };
}

function unlockRecipe(state, rules, payload) {
  const newState = deepClone(state);
  const { recipeId } = payload;

  if (!newState.discoveredRecipes.includes(recipeId)) {
    return { state: newState, error: 'Recipe not discovered yet' };
  }

  if (newState.unlockedRecipes.includes(recipeId)) {
    return { state: newState, error: 'Recipe already unlocked' };
  }

  newState.unlockedRecipes.push(recipeId);

  return { state: newState, error: null };
}

function unlockAllRecipes(state, rules, payload) {
  const newState = deepClone(state);
  const allRecipeIds = rules.recipes.map(r => r.id);

  newState.discoveredRecipes = [...allRecipeIds];
  newState.unlockedRecipes = [...allRecipeIds];

  return { state: newState, error: null };
}

function unblockMachine(state, rules, payload) {
  const newState = deepClone(state);
  const { machineId } = payload;

  const machine = newState.machines.find(m => m.id === machineId);
  if (!machine) {
    return { state: newState, error: 'Machine not found' };
  }

  if (machine.status !== 'blocked') {
    return { state: newState, error: 'Machine is not blocked' };
  }

  // Set to working if it has a recipe, otherwise idle
  machine.status = machine.recipeId ? 'working' : 'idle';

  // Recalculate energy (this may cause it to be blocked again on next tick if still not enough energy)
  newState.energy = calculateEnergy(newState, rules);

  return { state: newState, error: null };
}

function toggleMachine(state, rules, payload) {
  const newState = deepClone(state);
  const { machineId } = payload;

  const machine = newState.machines.find(m => m.id === machineId);
  if (!machine) {
    return { state: newState, error: 'Machine not found' };
  }

  machine.enabled = !machine.enabled;

  // Recalculate energy
  newState.energy = calculateEnergy(newState, rules);

  return { state: newState, error: null };
}

function buyInventorySpace(state, rules, payload) {
  const newState = deepClone(state);
  const { amount } = payload;

  // Exponential cost: base * (growth ^ currentLevel)
  const currentLevel = Math.floor(newState.inventorySpace / rules.inventorySpace.upgradeAmount);
  const cost = Math.floor(
    rules.inventorySpace.baseCost * Math.pow(rules.inventorySpace.costGrowth, currentLevel)
  );

  if (newState.credits < cost) {
    return { state: newState, error: `Not enough credits (need ${cost})` };
  }

  newState.credits -= cost;
  newState.inventorySpace += rules.inventorySpace.upgradeAmount;

  return { state: newState, error: null };
}

// ============================================================================
// Research Actions
// ============================================================================

/**
 * Initialize research state for backward compatibility with old saves
 */
function initializeResearchState(state, rules) {
  if (!state.research) {
    state.research = { active: false, researchPoints: 0, awaitingPrototype: [] };
  }
  if (!state.research.awaitingPrototype) {
    state.research.awaitingPrototype = [];
  }
  if (typeof state.research.researchPoints !== 'number') {
    state.research.researchPoints = 0;
  }

  // Migration: Add isRaw flag to existing slots-mode prototypes that don't have it
  if (rules && state.research.awaitingPrototype) {
    for (const prototype of state.research.awaitingPrototype) {
      if (prototype.mode === 'slots' && prototype.slots) {
        for (const slot of prototype.slots) {
          if (slot.isRaw === undefined) {
            const material = rules.materials.find(m => m.id === slot.material);
            slot.isRaw = material && material.category === 'raw';
          }
        }
      }
    }
  }
}

/**
 * Convert credits to Research Points (RP)
 * Uses creditsToRPRatio from rules (default 10:1)
 */
function donateCredits(state, rules, payload) {
  const newState = deepClone(state);
  initializeResearchState(newState, rules);
  const { amount } = payload;

  if (typeof amount !== 'number' || amount <= 0) {
    return { state: newState, error: 'Invalid donation amount' };
  }

  if (newState.credits < amount) {
    return { state: newState, error: 'Not enough credits' };
  }

  const rpGained = Math.floor(amount / rules.research.creditsToRPRatio);
  if (rpGained <= 0) {
    return { state: newState, error: `Need at least ${rules.research.creditsToRPRatio} credits to gain 1 RP` };
  }

  newState.credits -= amount;
  newState.research.researchPoints += rpGained;

  return { state: newState, error: null };
}

/**
 * Convert inventory parts to Research Points (RP)
 * RP gained = basePrice × ageMultiplier × quantity
 */
function donateParts(state, rules, payload) {
  const newState = deepClone(state);
  initializeResearchState(newState, rules);
  const { itemId, quantity } = payload;

  if (typeof quantity !== 'number' || quantity <= 0) {
    return { state: newState, error: 'Invalid quantity' };
  }

  const available = newState.inventory[itemId] || 0;
  if (available < quantity) {
    return { state: newState, error: 'Not enough items in inventory' };
  }

  const material = rules.materials.find(m => m.id === itemId);
  if (!material) {
    return { state: newState, error: 'Material not found' };
  }

  // Raw materials cannot be donated
  if (material.category === 'raw') {
    return { state: newState, error: 'Raw materials cannot be donated' };
  }

  const ageMultiplier = rules.research.ageMultipliers[material.age] || 1.0;
  const rpGained = Math.floor(material.basePrice * ageMultiplier * quantity);

  newState.inventory[itemId] -= quantity;
  if (newState.inventory[itemId] === 0) {
    delete newState.inventory[itemId];
  }

  newState.research.researchPoints += rpGained;

  return { state: newState, error: null };
}

/**
 * Run an experiment to discover a new recipe
 * Cost is based on the highest unlocked age
 */
function runExperiment(state, rules, payload) {
  const newState = deepClone(state);
  initializeResearchState(newState, rules);
  const rng = createRNG(state.rngSeed);

  // Find undiscovered recipes (exclude already unlocked recipes and disabled machine/generator recipes)
  const undiscovered = rules.recipes.filter(r =>
    !newState.discoveredRecipes.includes(r.id) &&
    !newState.unlockedRecipes.includes(r.id) &&
    !isRecipeForDisabledStructure(r.id, rules)
  );
  if (undiscovered.length === 0) {
    return { state: newState, error: 'All recipes have been discovered' };
  }

  // Calculate experiment cost based on highest unlocked age
  const highestAge = calculateHighestUnlockedAge(newState, rules);
  const experimentCost = rules.research.experimentCosts[highestAge] || rules.research.experimentCosts[1];

  if (newState.research.researchPoints < experimentCost) {
    return { state: newState, error: `Not enough Research Points (need ${experimentCost} RP)` };
  }

  // Deduct cost
  newState.research.researchPoints -= experimentCost;

  // Select recipe using age-weighted randomization
  const selectedRecipe = selectRecipeByAgeWeighting(undiscovered, newState, rules, rng);

  // Add to discovered recipes
  newState.discoveredRecipes.push(selectedRecipe.id);

  // Create prototype entry
  const prototype = createPrototypeEntry(selectedRecipe, rules);
  newState.research.awaitingPrototype.push(prototype);

  // Update RNG seed
  newState.rngSeed = rng.getCurrentSeed();

  return { state: newState, error: null };
}

/**
 * Run a targeted experiment to discover a specific recipe
 * Cost is based on the highest unlocked age multiplied by the targeted experiment multiplier
 */
function runTargetedExperiment(state, rules, payload) {
  const newState = deepClone(state);
  initializeResearchState(newState, rules);
  const { recipeId } = payload;

  if (!recipeId) {
    return { state: newState, error: 'No recipe specified' };
  }

  // Find the recipe
  const recipe = rules.recipes.find(r => r.id === recipeId);
  if (!recipe) {
    return { state: newState, error: 'Recipe not found' };
  }

  // Check if recipe is for a disabled machine/generator
  if (isRecipeForDisabledStructure(recipeId, rules)) {
    return { state: newState, error: 'Cannot target disabled machine/generator recipes' };
  }

  // Check if already discovered or unlocked
  if (newState.discoveredRecipes.includes(recipeId) || newState.unlockedRecipes.includes(recipeId)) {
    return { state: newState, error: 'Recipe already discovered or unlocked' };
  }

  // Calculate targeted experiment cost
  const highestAge = calculateHighestUnlockedAge(newState, rules);
  const baseCost = rules.research.experimentCosts[highestAge] || rules.research.experimentCosts[1];
  const multiplier = rules.research.targetedExperimentMultiplier || 10;
  const targetedCost = baseCost * multiplier;

  if (newState.research.researchPoints < targetedCost) {
    return { state: newState, error: `Not enough Research Points (need ${targetedCost} RP)` };
  }

  // Deduct cost
  newState.research.researchPoints -= targetedCost;

  // Add to discovered recipes
  newState.discoveredRecipes.push(recipe.id);

  // Create prototype entry
  const prototype = createPrototypeEntry(recipe, rules);
  newState.research.awaitingPrototype.push(prototype);

  return { state: newState, error: null };
}

/**
 * Fill a slot in a slot-based prototype with inventory items
 */
function fillPrototypeSlot(state, rules, payload) {
  const newState = deepClone(state);
  initializeResearchState(newState, rules);
  const { recipeId, materialId, quantity } = payload;

  if (typeof quantity !== 'number' || quantity <= 0) {
    return { state: newState, error: 'Invalid quantity' };
  }

  // Find the prototype
  const prototype = newState.research.awaitingPrototype.find(p => p.recipeId === recipeId);
  if (!prototype) {
    return { state: newState, error: 'Prototype not found' };
  }

  if (prototype.mode !== 'slots') {
    return { state: newState, error: 'This prototype uses flow mode, not slots' };
  }

  // Find the slot for this material
  const slot = prototype.slots.find(s => s.material === materialId);
  if (!slot) {
    return { state: newState, error: 'Material not required for this prototype' };
  }

  // Check inventory
  const available = newState.inventory[materialId] || 0;
  if (available < quantity) {
    return { state: newState, error: 'Not enough items in inventory' };
  }

  // Calculate how much can actually be filled
  const neededForSlot = slot.quantity - slot.filled;
  const actualFill = Math.min(quantity, neededForSlot);

  if (actualFill <= 0) {
    return { state: newState, error: 'Slot is already full' };
  }

  // Consume from inventory
  newState.inventory[materialId] -= actualFill;
  if (newState.inventory[materialId] === 0) {
    delete newState.inventory[materialId];
  }

  // Fill the slot
  slot.filled += actualFill;

  // Check if prototype is complete
  const isComplete = prototype.slots.every(s => s.filled >= s.quantity);
  if (isComplete) {
    // Move to unlocked recipes
    if (!newState.unlockedRecipes.includes(prototype.recipeId)) {
      newState.unlockedRecipes.push(prototype.recipeId);
      // Apply completion rewards (RP bonus + discovery boost)
      applyPrototypeCompletionRewards(newState, rules, prototype.recipeId);
    }
    // Remove from awaiting prototype
    const protoIndex = newState.research.awaitingPrototype.findIndex(p => p.recipeId === recipeId);
    if (protoIndex !== -1) {
      newState.research.awaitingPrototype.splice(protoIndex, 1);
    }
  }

  return { state: newState, error: null };
}

// ============================================================================
// Machine/Generator Building Actions
// ============================================================================

/**
 * Build a machine by consuming materials from inventory.
 * The built machine goes into the builtMachines pool (not regular inventory).
 */
function buildMachine(state, rules, payload) {
  const newState = deepClone(state);
  const { machineType, cheat = false, quantity = 1 } = payload;
  const buildQuantity = Math.floor(Number(quantity));

  if (!Number.isFinite(buildQuantity) || buildQuantity < 1) {
    return { state: newState, error: 'Build quantity must be at least 1' };
  }

  // Validate machine type exists
  const machineConfig = rules.machines.find(m => m.id === machineType);
  if (!machineConfig) {
    return { state: newState, error: 'Machine type not found' };
  }

  // Get the build recipe for this machine
  const buildRecipe = rules.machineRecipes?.[machineType];
  if (!buildRecipe || !buildRecipe.slots) {
    return { state: newState, error: 'No build recipe found for this machine type' };
  }

  // Skip material checks and consumption if cheat mode is enabled
  if (!cheat) {
    // Calculate required materials from slots
    const requiredMaterials = {};
    for (const slot of buildRecipe.slots) {
      const materialId = slot.material;
      const qty = (slot.quantity || 1) * buildQuantity;
      requiredMaterials[materialId] = (requiredMaterials[materialId] || 0) + qty;
    }

    // Check if all materials are available in inventory
    for (const [materialId, needed] of Object.entries(requiredMaterials)) {
      const available = newState.inventory[materialId] || 0;
      if (available < needed) {
        const material = rules.materials.find(m => m.id === materialId);
        const name = material ? material.name : materialId;
        return { state: newState, error: `Not enough ${name} (need ${needed}, have ${available})` };
      }
    }

    // Consume materials from inventory
    for (const [materialId, needed] of Object.entries(requiredMaterials)) {
      newState.inventory[materialId] -= needed;
      if (newState.inventory[materialId] === 0) {
        delete newState.inventory[materialId];
      }
    }
  }

  // Initialize builtMachines if it doesn't exist
  if (!newState.builtMachines) {
    newState.builtMachines = {};
  }

  // Add machine to built pool
  newState.builtMachines[machineType] = (newState.builtMachines[machineType] || 0) + buildQuantity;

  return { state: newState, error: null };
}

/**
 * Build a generator by consuming materials from inventory.
 * The built generator goes into the builtGenerators pool (not regular inventory).
 */
function buildGenerator(state, rules, payload) {
  const newState = deepClone(state);
  const { generatorType, cheat = false, quantity = 1 } = payload;
  const buildQuantity = Math.floor(Number(quantity));

  if (!Number.isFinite(buildQuantity) || buildQuantity < 1) {
    return { state: newState, error: 'Build quantity must be at least 1' };
  }

  // Validate generator type exists
  const genConfig = rules.generators.find(g => g.id === generatorType);
  if (!genConfig) {
    return { state: newState, error: 'Generator type not found' };
  }

  // Get the build recipe for this generator
  const buildRecipe = rules.generatorRecipes?.[generatorType];
  if (!buildRecipe || !buildRecipe.slots) {
    return { state: newState, error: 'No build recipe found for this generator type' };
  }

  // Skip material checks and consumption if cheat mode is enabled
  if (!cheat) {
    // Calculate required materials from slots
    const requiredMaterials = {};
    for (const slot of buildRecipe.slots) {
      const materialId = slot.material;
      const qty = (slot.quantity || 1) * buildQuantity;
      requiredMaterials[materialId] = (requiredMaterials[materialId] || 0) + qty;
    }

    // Check if all materials are available in inventory
    for (const [materialId, needed] of Object.entries(requiredMaterials)) {
      const available = newState.inventory[materialId] || 0;
      if (available < needed) {
        const material = rules.materials.find(m => m.id === materialId);
        const name = material ? material.name : materialId;
        return { state: newState, error: `Not enough ${name} (need ${needed}, have ${available})` };
      }
    }

    // Consume materials from inventory
    for (const [materialId, needed] of Object.entries(requiredMaterials)) {
      newState.inventory[materialId] -= needed;
      if (newState.inventory[materialId] === 0) {
        delete newState.inventory[materialId];
      }
    }
  }

  // Initialize builtGenerators if it doesn't exist
  if (!newState.builtGenerators) {
    newState.builtGenerators = {};
  }

  // Add generator to built pool
  newState.builtGenerators[generatorType] = (newState.builtGenerators[generatorType] || 0) + buildQuantity;

  return { state: newState, error: null };
}

// ============================================================================
// Exploration Actions
// ============================================================================

function expandExploration(state, rules, payload) {
  const newState = deepClone(state);

  if (!newState.explorationMap) {
    return { state: newState, error: 'No exploration map available' };
  }

  // Get expansion info
  let expansion = getNextExplorationExpansion(newState.explorationMap, rules);

  // If we're at the map edge with no cells to explore, expand the generated map first
  if (expansion.cellsToExplore === 0 && expansion.atMapEdge) {
    // Expand the generated map (create new quadrants)
    const expandedMap = expandGeneratedMap(newState.explorationMap, rules);

    // Check if expansion is possible (null means at max size)
    if (expandedMap === null) {
      return { state: newState, error: 'Map has reached maximum size' };
    }

    newState.explorationMap = expandedMap;
    // Recalculate expansion with the new larger map
    expansion = getNextExplorationExpansion(newState.explorationMap, rules);
  }

  if (expansion.cellsToExplore === 0) {
    return { state: newState, error: 'No new tiles to explore' };
  }

  if (newState.credits < expansion.cost) {
    return { state: newState, error: `Not enough credits (need ${expansion.cost})` };
  }

  // Deduct credits
  newState.credits -= expansion.cost;

  // Mark new tiles as explored using the defined chunk
  if (expansion.chunkRect) {
    const { x: startX, y: startY, width: w, height: h } = expansion.chunkRect;
    
    for (let y = startY; y < startY + h; y++) {
      for (let x = startX; x < startX + w; x++) {
        const key = `${x},${y}`;
        if (newState.explorationMap.tiles[key]) {
          newState.explorationMap.tiles[key].explored = true;
        }
      }
    }

    // Track the chunk
    if (!newState.explorationMap.exploredChunks) {
      newState.explorationMap.exploredChunks = [];
      // Initialize with base if missing (legacy support)
      const oldBounds = newState.explorationMap.exploredBounds;
      newState.explorationMap.exploredChunks.push({
        x: oldBounds.minX,
        y: oldBounds.minY,
        width: oldBounds.maxX - oldBounds.minX + 1,
        height: oldBounds.maxY - oldBounds.minY + 1
      });
    }
    newState.explorationMap.exploredChunks.push(expansion.chunkRect);
  } else {
    // Fallback for legacy behavior if chunkRect is missing (should not happen with new logic)
    const oldBounds = newState.explorationMap.exploredBounds;
    const newBounds = expansion.newBounds;

    for (let y = newBounds.minY; y <= newBounds.maxY; y++) {
      for (let x = newBounds.minX; x <= newBounds.maxX; x++) {
        if (x < oldBounds.minX || x > oldBounds.maxX ||
            y < oldBounds.minY || y > oldBounds.maxY) {
          const key = `${x},${y}`;
          if (newState.explorationMap.tiles[key]) {
            newState.explorationMap.tiles[key].explored = true;
          }
        }
      }
    }
  }

  // Update explored bounds
  newState.explorationMap.exploredBounds = expansion.newBounds;

  return { state: newState, error: null };
}

/**
 * Calculate the unlock cost for a resource node with both per-resource and global scaling
 * Cost = baseCost * resourceScaleFactor^(sameResourceCount) * globalScaleFactor^(totalNodes)
 * @param {string} resourceType - The type of resource
 * @param {Array} extractionNodes - Current extraction nodes array
 * @param {object} rules - Game rules
 * @returns {number} The unlock cost
 */
export function getNodeUnlockCost(resourceType, extractionNodes, rules) {
  // Count nodes of this resource type (for per-resource scaling)
  const sameResourceCount = extractionNodes.filter(n => n.resourceType === resourceType).length;

  // Count total nodes (for global scaling)
  const totalNodes = extractionNodes.length;

  const baseCost = rules.exploration.nodeUnlockCost || 100;
  const scaleFactors = rules.exploration.unlockScaleFactors || {};
  const resourceScaleFactor = scaleFactors[resourceType] || 1.2;
  const globalScaleFactor = rules.exploration.globalNodeScaleFactor || 1.0;

  // Apply both scaling factors
  const resourceScaling = Math.pow(resourceScaleFactor, sameResourceCount);
  const globalScaling = Math.pow(globalScaleFactor, totalNodes);

  return Math.floor(baseCost * resourceScaling * globalScaling);
}

function unlockExplorationNode(state, rules, payload) {
  const newState = deepClone(state);
  const { x, y } = payload;

  if (!newState.explorationMap) {
    return { state: newState, error: 'No exploration map available' };
  }

  const key = `${x},${y}`;
  const tile = newState.explorationMap.tiles[key];

  if (!tile) {
    return { state: newState, error: 'Tile not found' };
  }

  if (!tile.explored) {
    return { state: newState, error: 'Tile not explored yet' };
  }

  if (!tile.extractionNode) {
    return { state: newState, error: 'No extraction node on this tile' };
  }

  if (tile.extractionNode.unlocked) {
    return { state: newState, error: 'Extraction node already unlocked' };
  }

  // Calculate per-resource scaling cost
  const resourceType = tile.extractionNode.resourceType;
  const cost = getNodeUnlockCost(resourceType, newState.extractionNodes, rules);

  if (newState.credits < cost) {
    return { state: newState, error: `Not enough credits (need ${cost})` };
  }

  // Deduct credits
  newState.credits -= cost;

  // Mark node as unlocked
  tile.extractionNode.unlocked = true;

  // Add to main extraction nodes array (unified system)
  newState.extractionNodes.push({
    id: tile.extractionNode.id,
    resourceType: tile.extractionNode.resourceType,
    rate: tile.extractionNode.rate,
    active: true
  });

  return { state: newState, error: null };
}

// ============================================================================
// Main Engine Function
// ============================================================================

export function engine(state, rules, action) {
  switch (action.type) {
    case 'SIMULATE': {
      const result = simulateTick(state, rules);
      return { state: result.newState, error: null, productionEvents: result.productionEvents };
    }

    case 'ADD_MACHINE':
      return addMachine(state, rules, action.payload || {});

    case 'REMOVE_MACHINE':
      return removeMachine(state, rules, action.payload);

    case 'MOVE_MACHINE':
      return moveMachine(state, rules, action.payload);

    case 'ASSIGN_RECIPE':
      return assignRecipe(state, rules, action.payload);

    case 'ADD_GENERATOR':
      return addGenerator(state, rules, action.payload);

    case 'REMOVE_GENERATOR':
      return removeGenerator(state, rules, action.payload);

    case 'MOVE_GENERATOR':
      return moveGenerator(state, rules, action.payload);

    case 'MOVE_GENERATOR':
      return moveGenerator(state, rules, action.payload);

    case 'BUY_FLOOR_SPACE':
      return buyFloorSpace(state, rules, action.payload);

    case 'SELL_GOODS':
      return sellGoods(state, rules, action.payload);

    case 'TOGGLE_RESEARCH':
      return toggleResearch(state, rules, action.payload);

    case 'DONATE_CREDITS':
      return donateCredits(state, rules, action.payload);

    case 'DONATE_PARTS':
      return donateParts(state, rules, action.payload);

    case 'RUN_EXPERIMENT':
      return runExperiment(state, rules, action.payload);

    case 'RUN_TARGETED_EXPERIMENT':
      return runTargetedExperiment(state, rules, action.payload);

    case 'FILL_PROTOTYPE_SLOT':
      return fillPrototypeSlot(state, rules, action.payload);

    case 'UNLOCK_RECIPE':
      return unlockRecipe(state, rules, action.payload);

    case 'UNLOCK_ALL_RECIPES':
      return unlockAllRecipes(state, rules, action.payload);

    case 'UNBLOCK_MACHINE':
      return unblockMachine(state, rules, action.payload);

    case 'TOGGLE_MACHINE':
      return toggleMachine(state, rules, action.payload);

    case 'BUY_INVENTORY_SPACE':
      return buyInventorySpace(state, rules, action.payload);

    case 'BUILD_MACHINE':
      return buildMachine(state, rules, action.payload);

    case 'BUILD_GENERATOR':
      return buildGenerator(state, rules, action.payload);

    case 'EXPAND_EXPLORATION':
      return expandExploration(state, rules, action.payload);

    case 'UNLOCK_EXPLORATION_NODE':
      return unlockExplorationNode(state, rules, action.payload);

    default:
      return { state, error: `Unknown action type: ${action.type}` };
  }
}

// Export utilities for testing and frontend use
export {
  createRNG,
  calculateEnergy,
  deepClone,
  migrateGameState,
  getItemWeight,
  getMaxStack,
  canPlaceAt,
  getNextExpansionChunk,
  getNextExplorationExpansion,
  expandGeneratedMap,
  calculateHighestUnlockedAge
};
