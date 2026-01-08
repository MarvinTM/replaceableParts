/**
 * Initial Game State
 * Starting configuration with pre-defined extraction nodes and one generator
 */

import { generateExplorationMap } from './mapGenerator.js';
import { defaultRules } from './defaultRules.js';

export const initialState = {
  tick: 0,
  rngSeed: 12345,
  credits: 5000000,

  // Floor Space (2D Grid)
  floorSpace: {
    width: 8,
    height: 8,
    placements: [
      // Starting generator at position (0, 0)
      { id: 'starter_crank', x: 0, y: 0, size: 1, type: 'generator' },
      // Starting machine at position (2, 2)
      { id: 'starter_machine', x: 2, y: 2, size: 1, type: 'machine' }
    ]
  },

  energy: {
    produced: 3,  // From starting manual crank
    consumed: 0
  },

  // Inventory space is total capacity for per-item limits
  inventorySpace: 100,

  // Inventory starts with 1 production machine so player can build more
  inventory: {
    production_machine: 1
  },

  // Starting machine for demonstration
  machines: [
    {
      id: 'starter_machine',
      recipeId: 'planks',
      internalBuffer: {},
      status: 'idle',
      enabled: true,
      spaceUsed: 1,
      energyConsumption: 1,
      x: 2,
      y: 2
    }
  ],

  // Start with one manual crank generator for basic operation
  generators: [
    {
      id: 'starter_crank',
      type: 'manual_crank',
      energyOutput: 3,
      spaceUsed: 1,
      x: 0,
      y: 0
    }
  ],

  // Pre-defined extraction nodes (active from start)
  extractionNodes: [
    {
      id: 'node_wood_1',
      resourceType: 'wood',
      rate: 2,
      active: true
    },
    {
      id: 'node_stone_1',
      resourceType: 'stone',
      rate: 2,
      active: true
    },
    {
      id: 'node_iron_ore_1',
      resourceType: 'iron_ore',
      rate: 1,
      active: true
    },
    {
      id: 'node_copper_ore_1',
      resourceType: 'copper_ore',
      rate: 1,
      active: true
    },
    {
      id: 'node_coal_1',
      resourceType: 'coal',
      rate: 2,
      active: true
    },
    {
      id: 'node_clay_1',
      resourceType: 'clay',
      rate: 1,
      active: true
    },
    {
      id: 'node_sand_1',
      resourceType: 'sand',
      rate: 1,
      active: true
    }
  ],

  // Start with basic Tier 1 recipes + equipment recipes discovered and unlocked
  discoveredRecipes: [
    // Tier 1
    'planks',
    'charcoal',
    'stone_bricks',
    'gravel',
    'bricks',
    'glass',
    'iron_ingot',
    'copper_ingot',
    // Equipment (so player can build machines and generators from start)
    'production_machine',
    'manual_crank',
    'water_wheel',
    'steam_engine'
  ],

  unlockedRecipes: [
    // Tier 1
    'planks',
    'charcoal',
    'stone_bricks',
    'gravel',
    'bricks',
    'glass',
    'iron_ingot',
    'copper_ingot',
    // Equipment
    'production_machine',
    'manual_crank',
    'water_wheel',
    'steam_engine'
  ],

  // Research starts inactive (cost defined in rules)
  research: {
    active: false
  },

  // Market popularity (empty = all at default 1.0)
  marketPopularity: {},

  // Exploration map (generated dynamically based on seed)
  explorationMap: null
};

/**
 * Create a fresh copy of the initial state
 * Use this to start a new game
 */
export function createInitialState(customSeed = null, rules = defaultRules) {
  const state = JSON.parse(JSON.stringify(initialState));
  if (customSeed !== null) {
    state.rngSeed = customSeed;
  }

  // Generate exploration map using the game seed
  const explorationRules = rules.exploration;
  state.explorationMap = generateExplorationMap(
    state.rngSeed,
    explorationRules.initialGeneratedSize,
    explorationRules.initialGeneratedSize,
    rules
  );

  return state;
}
