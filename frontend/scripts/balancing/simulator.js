/**
 * Headless Game Simulator
 * Runs the game engine without UI for balancing analysis
 */

import { engine } from '../../src/engine/engine.js';
import { createInitialState } from '../../src/engine/initialState.js';
import { defaultRules } from '../../src/engine/defaultRules.js';

/**
 * Create a new simulation instance
 * @param {Object} config - Simulation configuration
 * @returns {Object} Simulation state and methods
 */
export function createSimulation(config = {}) {
  const {
    seed = Date.now(),
    rules = defaultRules,
    maxTicks = 50000,
    snapshotInterval = 100,
  } = config;

  const state = createInitialState(seed, rules);

  // Reset credits to a realistic starting value (not the debug 5 billion)
  state.credits = config.startingCredits ?? 500;

  return {
    state,
    rules,
    config: { seed, maxTicks, snapshotInterval },
    currentTick: 0,
    snapshots: [],
    events: [],
    lastCredits: state.credits,
  };
}

/**
 * Execute a single game tick
 * @param {Object} sim - Simulation instance
 * @returns {Object} Result with production events
 */
export function simulateTick(sim) {
  const result = engine(sim.state, sim.rules, { type: 'SIMULATE' });

  if (result.error) {
    console.error(`Tick ${sim.currentTick} error:`, result.error);
    return { error: result.error };
  }

  sim.state = result.state;
  sim.currentTick = sim.state.tick;

  return {
    productionEvents: result.productionEvents || [],
  };
}

/**
 * Execute a game action
 * @param {Object} sim - Simulation instance
 * @param {Object} action - Action to execute
 * @returns {Object} Result
 */
export function executeAction(sim, action) {
  const result = engine(sim.state, sim.rules, action);

  if (result.error) {
    return { success: false, error: result.error };
  }

  sim.state = result.state;
  return { success: true };
}

/**
 * Run simulation for N ticks with a strategy
 * @param {Object} sim - Simulation instance
 * @param {number} ticks - Number of ticks to run
 * @param {Object} strategy - Bot strategy to use
 * @param {Object} kpiTracker - KPI tracker instance
 * @returns {Object} Simulation results
 */
export function runTicks(sim, ticks, strategy, kpiTracker) {
  const startTick = sim.currentTick;
  const endTick = Math.min(startTick + ticks, sim.config.maxTicks);

  for (let i = startTick; i < endTick; i++) {
    // Take snapshot before tick if interval reached
    if (i % sim.config.snapshotInterval === 0) {
      kpiTracker.takeSnapshot(sim);
    }

    // Let strategy make decisions before tick
    const actions = strategy.decide(sim);
    for (const action of actions) {
      const result = executeAction(sim, action);
      if (result.success) {
        kpiTracker.recordAction(sim, action);
      }
    }

    // If no actions were possible, record idle tick
    if (actions.length === 0) {
      kpiTracker.recordIdleTick(sim);
    }

    // Execute game tick
    const tickResult = simulateTick(sim);

    if (tickResult.error) {
      return { error: tickResult.error, ticksCompleted: i - startTick };
    }

    // Check for age progression
    kpiTracker.checkAgeProgression(sim);

    // Track income
    const creditsDelta = sim.state.credits - sim.lastCredits;
    if (creditsDelta !== 0) {
      kpiTracker.recordCreditChange(sim, creditsDelta);
    }
    sim.lastCredits = sim.state.credits;
  }

  // Final snapshot
  kpiTracker.takeSnapshot(sim);

  return {
    ticksCompleted: endTick - startTick,
    finalTick: sim.currentTick,
  };
}

/**
 * Run simulation until a condition is met
 * @param {Object} sim - Simulation instance
 * @param {Function} condition - Function that returns true when done
 * @param {Object} strategy - Bot strategy
 * @param {Object} kpiTracker - KPI tracker
 * @returns {Object} Results
 */
export function runUntil(sim, condition, strategy, kpiTracker) {
  const startTick = sim.currentTick;

  while (!condition(sim) && sim.currentTick < sim.config.maxTicks) {
    const result = runTicks(sim, 1, strategy, kpiTracker);
    if (result.error) {
      return {
        success: false,
        error: result.error,
        ticksCompleted: sim.currentTick - startTick
      };
    }
  }

  return {
    success: condition(sim),
    ticksCompleted: sim.currentTick - startTick,
    reachedMaxTicks: sim.currentTick >= sim.config.maxTicks,
  };
}

/**
 * Get highest unlocked age from state
 * @param {Object} state - Game state
 * @param {Object} rules - Game rules
 * @returns {number} Highest age with any unlocked recipe
 */
export function getHighestUnlockedAge(state, rules) {
  let highestAge = 1;

  for (const recipeId of state.unlockedRecipes) {
    const recipe = rules.recipes.find(r => r.id === recipeId);
    if (recipe) {
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
 * Get all final goods in inventory
 * @param {Object} state - Game state
 * @param {Object} rules - Game rules
 * @returns {Array} Array of {id, quantity, material}
 */
export function getFinalGoodsInInventory(state, rules) {
  const finals = [];

  for (const [itemId, quantity] of Object.entries(state.inventory)) {
    if (quantity <= 0) continue;

    const material = rules.materials.find(m => m.id === itemId);
    if (material && material.category === 'final') {
      finals.push({ id: itemId, quantity, material });
    }
  }

  return finals;
}

/**
 * Calculate total inventory value at base prices
 * @param {Object} state - Game state
 * @param {Object} rules - Game rules
 * @returns {number} Total value
 */
export function calculateInventoryValue(state, rules) {
  let total = 0;

  for (const [itemId, quantity] of Object.entries(state.inventory)) {
    if (quantity <= 0) continue;
    const material = rules.materials.find(m => m.id === itemId);
    if (material) {
      total += material.basePrice * quantity;
    }
  }

  return total;
}

/**
 * Get affordable expansion options
 * @param {Object} sim - Simulation instance
 * @returns {Object} What can be afforded
 */
export function getAffordableOptions(sim) {
  const { state, rules } = sim;
  const credits = state.credits;

  // Floor expansion cost
  const floorCost = rules.floorSpace.costPerCell *
    (rules.floorSpace.chunkWidth || 4) *
    (rules.floorSpace.chunkHeight || 4);

  // Map exploration cost
  const mapCost = rules.exploration.baseCostPerCell;

  // Node unlock cost (simplified - actual cost may vary)
  const nodeCost = rules.exploration.nodeUnlockCost;

  // Research cost (donate credits for RP)
  const experimentCost = (rules.research.experimentCosts[1] || 100) *
    rules.research.creditsToRPRatio;

  return {
    canExpandFloor: credits >= floorCost,
    floorCost,
    canExploreMap: credits >= mapCost,
    mapCost,
    canUnlockNode: credits >= nodeCost,
    nodeCost,
    canRunExperiment: state.research.researchPoints >= (rules.research.experimentCosts[1] || 100),
    canDonateForResearch: credits >= experimentCost,
    experimentCreditCost: experimentCost,
  };
}
