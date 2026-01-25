/**
 * Initial Game State
 * Updated for the Consolidated Resource System
 */

import { generateExplorationMap } from './mapGenerator.js';
import { defaultRules } from './defaultRules.js';

export const initialState = {
  tick: 0,
  rngSeed: Date.now(),
  credits: 5000000000,

  // Floor Space (2D Grid)
  floorSpace: {
    width: 16,
    height: 16,
    chunks: [{ x: 0, y: 0, width: 16, height: 16 }],
    placements: [
      // Starting generator: Wood Oven (burns wood for power)
      { id: 'starter_wood_oven', x: 4, y: 4, structureType: 'wood_oven' }
    ]
  },

  energy: {
    produced: 5,
    consumed: 0
  },

  // Inventory space
  inventorySpace: 200,

  // Starter Inventory (no machines/generators here - they go in built pools)
  inventory: {},

  // Built Machines (ready to deploy, not in regular inventory)
  builtMachines: {
    stone_furnace: 1,
    blacksmiths_anvil: 1,
    carpenters_bench: 1,
    glassblowers_workshop: 1,
    potters_wheel_machine: 1
  },

  // Built Generators (ready to deploy, not in regular inventory)
  builtGenerators: {
    wood_oven: 2
  },

  // Deployed Machines
  machines: [],

  // Deployed Generators
  generators: [
    {
      id: 'starter_wood_oven',
      type: 'wood_oven',
      x: 4,
      y: 4,
      active: true
    }
  ],

  // Pre-defined extraction nodes (Age 1 Resources)
  extractionNodes: [
    { id: 'node_wood_1', resourceType: 'wood', rate: 2, active: true },
    { id: 'node_stone_1', resourceType: 'stone', rate: 2, active: true },
    { id: 'node_iron_1', resourceType: 'iron_ore', rate: 1, active: true },
    { id: 'node_sand_1', resourceType: 'sand', rate: 1, active: true }
  ],

  // Discovery: Start with Age 1 basics
  discoveredRecipes: [
    'planks', 'wooden_beam', 'stone_bricks', 'iron_ingot', 'iron_plate', 'iron_rod', 'nails',
    'stone_furnace', 'wood_oven', 'chair', 'table'
  ],

  unlockedRecipes: [
    'planks', 'wooden_beam', 'stone_bricks', 'iron_ingot', 'iron_plate', 'iron_rod', 'nails',
    'stone_furnace', 'wood_oven', 'chair', 'table'
  ],

  research: {
    active: false,
    researchPoints: 0,
    awaitingPrototype: []
  },

  marketPopularity: {},
  marketDamage: {},  // Tracks overselling damage per item
  marketPriceHistory: [],  // Array of {tick, itemId: price, ...} sampled every N ticks
  marketRecentSales: [],  // Array of {tick, itemId} for last 100 ticks (for diversification bonus)
  explorationMap: null
};

/**
 * Create a fresh copy of the initial state
 */
export function createInitialState(customSeed = null, rules = defaultRules) {
  const state = JSON.parse(JSON.stringify(initialState));
  if (customSeed !== null) {
    state.rngSeed = customSeed;
  }

  const explorationRules = rules.exploration;
  state.explorationMap = generateExplorationMap(
    state.rngSeed,
    explorationRules.initialGeneratedSize,
    explorationRules.initialGeneratedSize,
    rules
  );

  return state;
}
