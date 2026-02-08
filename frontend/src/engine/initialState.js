/**
 * Initial Game State
 * Updated for the Consolidated Resource System
 */

import { generateExplorationMap } from './mapGenerator.js';
import { defaultRules } from './defaultRules.js';
import { getStandardizedNodeRate } from './extractionNodeRates.js';

export const initialState = {
  tick: 0,
  rngSeed: Date.now(),
  credits: 500,
  tutorialCompleted: false,
  shownTips: [],  // Array of tip IDs that have been shown

  // Floor Space (2D Grid) - Larger starting area
  floorSpace: {
    width: 16,
    height: 16,
    chunks: [{ x: 0, y: 0, width: 16, height: 16 }],
    placements: []
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
  // Moderate increase for better throughput
  builtMachines: {
    stone_furnace: 2,
    blacksmiths_anvil: 2,
    carpenters_bench: 2
  },

  // Built Generators (ready to deploy, not in regular inventory)
  builtGenerators: {
    thermal_generator: 2
  },

  // Deployed Machines
  machines: [],

  // Deployed Generators
  generators: [
    {
      id: 'starter_thermal_generator',
      type: 'thermal_generator',
      x: 4,
      y: 4,
      active: true
    }
  ],

  // Pre-defined extraction nodes (Age 1 Resources)
  // Normal rates - player should unlock more nodes from the map for better throughput
  extractionNodes: [
    { id: 'node_wood_1', resourceType: 'wood', rate: 2, active: true },
    { id: 'node_stone_1', resourceType: 'stone', rate: 2, active: true },
    { id: 'node_iron_1', resourceType: 'iron_ore', rate: 2, active: true }
  ],

  // Discovery: Start with Age 1 basics
  discoveredRecipes: [
    'planks', 'wooden_beam', 'stone_bricks', 'iron_ingot', 'iron_plate', 'iron_rod', 'nails',
    'stone_furnace', 'thermal_generator', 'chair', 'table'
  ],

  unlockedRecipes: [
    'planks', 'wooden_beam', 'stone_bricks', 'iron_ingot', 'iron_plate', 'iron_rod', 'nails',
    'stone_furnace', 'thermal_generator', 'chair', 'table'
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

  state.extractionNodes = (state.extractionNodes || []).map((node) => ({
    ...node,
    rate: getStandardizedNodeRate(node.resourceType, rules)
  }));

  const explorationRules = rules.exploration;
  state.explorationMap = generateExplorationMap(
    state.rngSeed,
    explorationRules.initialGeneratedSize,
    explorationRules.initialGeneratedSize,
    rules
  );

  return state;
}
