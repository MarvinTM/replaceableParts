/**
 * Shared test utilities for Replaceable Parts engine tests
 */

import { engine } from '../engine/engine';
import { defaultRules } from '../engine/defaultRules';
import { initialState } from '../engine/initialState';

/**
 * Create a deep copy of initialState with optional overrides
 */
export function createTestState(overrides = {}) {
  const state = JSON.parse(JSON.stringify(initialState));
  return deepMerge(state, overrides);
}

/**
 * Deep merge two objects
 */
function deepMerge(target, source) {
  const output = { ...target };
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      output[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      output[key] = source[key];
    }
  }
  return output;
}

/**
 * Simulate multiple game ticks
 */
export function simulateTicks(state, rules, count) {
  let currentState = state;
  const allEvents = [];

  for (let i = 0; i < count; i++) {
    const result = engine(currentState, rules, { type: 'SIMULATE' });
    if (result.error) {
      throw new Error(`Simulation error at tick ${i}: ${result.error}`);
    }
    currentState = result.state;
    if (result.productionEvents) {
      allEvents.push(...result.productionEvents);
    }
  }

  return { state: currentState, events: allEvents };
}

/**
 * Create a test state with a deployed machine ready to work
 * @param {string} machineType - The type of machine to deploy
 * @param {string} recipeId - Optional recipe to assign (will also unlock it)
 */
export function createStateWithMachine(machineType = 'stone_furnace', recipeId = null) {
  const state = createTestState({
    credits: 10000,
    builtMachines: { [machineType]: 1 },
    machines: [],
    floorSpace: {
      width: 8,
      height: 8,
      placements: [],
      chunks: [{ x: 0, y: 0, width: 8, height: 8 }]
    }
  });

  // Add the machine
  const addResult = engine(state, defaultRules, {
    type: 'ADD_MACHINE',
    payload: { machineType, x: 0, y: 0 }
  });

  if (addResult.error) {
    throw new Error(`Failed to add machine: ${addResult.error}`);
  }

  let finalState = addResult.state;

  // Assign recipe if specified
  if (recipeId) {
    // Unlock the recipe first
    finalState.unlockedRecipes = [...finalState.unlockedRecipes, recipeId];

    const assignResult = engine(finalState, defaultRules, {
      type: 'ASSIGN_RECIPE',
      payload: {
        machineId: finalState.machines[0].id,
        recipeId
      }
    });

    if (assignResult.error) {
      throw new Error(`Failed to assign recipe: ${assignResult.error}`);
    }

    finalState = assignResult.state;
  }

  return finalState;
}

/**
 * Create a test state with a deployed generator
 */
export function createStateWithGenerator(generatorType = 'thermal_generator') {
  // Use larger floor space to accommodate different generator sizes
  const state = createTestState({
    credits: 10000,
    builtGenerators: { [generatorType]: 1 },
    generators: [],
    extractionNodes: [
      { id: 'wood_node', resourceType: 'wood', rate: 10, active: true }
    ],
    floorSpace: {
      width: 32,
      height: 32,
      placements: [],
      chunks: [{ x: 0, y: 0, width: 32, height: 32 }]
    }
  });

  const addResult = engine(state, defaultRules, {
    type: 'ADD_GENERATOR',
    payload: { generatorType, x: 0, y: 0 }
  });

  if (addResult.error) {
    throw new Error(`Failed to add generator: ${addResult.error}`);
  }

  return addResult.state;
}

/**
 * Create a test state with active extraction nodes providing raw materials
 */
export function createStateWithExtraction(resources = { iron_ore: 10, coal: 5 }) {
  const extractionNodes = Object.entries(resources).map(([resourceType, rate], index) => ({
    id: `node_${index}`,
    resourceType,
    rate,
    active: true
  }));

  return createTestState({ extractionNodes });
}

/**
 * Create a fully set up production state
 * Machine with recipe + generator + extraction
 */
export function createProductionState(options = {}) {
  const {
    machineType = 'stone_furnace',
    recipeId = 'iron_ingot',
    generatorType = 'thermal_generator',
    rawMaterials = { iron_ore: 10, coal: 5, wood: 10 } // Include wood for thermal_generator fuel
  } = options;

  const state = createTestState({
    credits: 10000,
    builtMachines: { [machineType]: 1 },
    builtGenerators: { [generatorType]: 1 },
    machines: [],
    generators: [],
    extractionNodes: Object.entries(rawMaterials).map(([resourceType, rate], index) => ({
      id: `node_${index}`,
      resourceType,
      rate,
      active: true
    })),
    floorSpace: {
      width: 32,
      height: 32,
      placements: [],
      chunks: [{ x: 0, y: 0, width: 32, height: 32 }]
    },
    unlockedRecipes: [recipeId]
  });

  // Add generator first (for power) - thermal_generator is 3x6
  let result = engine(state, defaultRules, {
    type: 'ADD_GENERATOR',
    payload: { generatorType, x: 0, y: 0 }
  });
  if (result.error) throw new Error(`Failed to add generator: ${result.error}`);

  // Add machine - place it at x=4 to avoid collision with 3-wide generator
  result = engine(result.state, defaultRules, {
    type: 'ADD_MACHINE',
    payload: { machineType, x: 4, y: 0 }
  });
  if (result.error) throw new Error(`Failed to add machine: ${result.error}`);

  // Assign recipe
  result = engine(result.state, defaultRules, {
    type: 'ASSIGN_RECIPE',
    payload: {
      machineId: result.state.machines[0].id,
      recipeId
    }
  });
  if (result.error) throw new Error(`Failed to assign recipe: ${result.error}`);

  return result.state;
}

/**
 * Get the recipe configuration from rules
 */
export function getRecipe(recipeId) {
  return defaultRules.recipes.find(r => r.id === recipeId);
}

/**
 * Get the machine configuration from rules
 */
export function getMachineConfig(machineType) {
  return defaultRules.machines.find(m => m.id === machineType);
}

/**
 * Get the generator configuration from rules
 */
export function getGeneratorConfig(generatorType) {
  return defaultRules.generators.find(g => g.id === generatorType);
}

/**
 * Get the material configuration from rules
 */
export function getMaterial(materialId) {
  return defaultRules.materials.find(m => m.id === materialId);
}

// Re-export commonly used imports
export { engine, defaultRules, initialState };
