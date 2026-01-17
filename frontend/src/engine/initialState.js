/**
 * Initial Game State
 * Updated for the Consolidated Resource System
 */

import { generateExplorationMap } from './mapGenerator.js';
import { defaultRules } from './defaultRules.js';

export const initialState = {
  tick: 0,
  rngSeed: Date.now(),
  credits: 500,

  // Floor Space (2D Grid)
  floorSpace: {
    width: 16,
    height: 16,
    chunks: [{ x: 0, y: 0, width: 16, height: 16 }],
    placements: [
      // Starting generator: Treadwheel (Manual power)
      { id: 'starter_treadwheel', x: 4, y: 4, structureType: 'treadwheel' }
    ]
  },

  energy: {
    produced: 5,
    consumed: 0
  },

  // Inventory space
  inventorySpace: 200,

  // Starter Inventory
  inventory: {
    carpenters_bench: 2,
    blacksmiths_anvil: 1,
    stone_furnace: 2,
    treadwheel: 1
  },

  // Deployed Machines
  machines: [],

  // Deployed Generators
  generators: [
    {
      id: 'starter_treadwheel',
      type: 'treadwheel',
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
    'basic_assembler', 'stone_furnace', 'treadwheel'
  ],

  unlockedRecipes: [
    'planks', 'wooden_beam', 'stone_bricks', 'iron_ingot', 'iron_plate', 'iron_rod', 'nails',
    'basic_assembler', 'stone_furnace', 'treadwheel'
  ],

  research: {
    active: false
  },

  marketPopularity: {},
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
