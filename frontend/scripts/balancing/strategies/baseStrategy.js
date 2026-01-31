/**
 * Base Strategy Interface
 * Defines the interface for bot strategies
 */

/**
 * Base strategy class - extend this to create custom bot behaviors
 */
export class BaseStrategy {
  constructor(params = {}) {
    this.params = params;
    this.name = 'base';
  }

  /**
   * Called each tick to decide what actions to take
   * @param {Object} sim - Simulation instance
   * @returns {Array} Array of actions to execute
   */
  decide(sim) {
    throw new Error('Subclasses must implement decide()');
  }

  /**
   * Helper: Get all recipes the player can produce with current resources
   * @param {Object} sim - Simulation instance
   * @returns {Array} Produceable recipes
   */
  getProduceableRecipes(sim) {
    const { state, rules } = sim;
    const produceable = [];

    for (const recipeId of state.unlockedRecipes) {
      const recipe = rules.recipes.find(r => r.id === recipeId);
      if (!recipe) continue;

      // Check if we have all inputs
      let canProduce = true;
      for (const [inputId, qty] of Object.entries(recipe.inputs)) {
        if ((state.inventory[inputId] || 0) < qty) {
          canProduce = false;
          break;
        }
      }

      if (canProduce) {
        produceable.push(recipe);
      }
    }

    return produceable;
  }

  /**
   * Helper: Get machines that need recipe assignment
   * @param {Object} sim - Simulation instance
   * @returns {Array} Idle machines
   */
  getIdleMachines(sim) {
    return sim.state.machines.filter(m => !m.recipeId && m.enabled);
  }

  /**
   * Helper: Get built machines ready to deploy
   * @param {Object} sim - Simulation instance
   * @returns {Object} Built machine counts by type
   */
  getBuiltMachines(sim) {
    return sim.state.builtMachines || {};
  }

  /**
   * Helper: Find a valid placement position for a structure
   * @param {Object} sim - Simulation instance
   * @param {number} width - Structure width
   * @param {number} height - Structure height
   * @returns {Object|null} {x, y} or null if no space
   */
  findPlacement(sim, width = 3, height = 3) {
    const { state } = sim;
    const floor = state.floorSpace;

    // Get all occupied positions
    const occupied = new Set();
    for (const placement of floor.placements || []) {
      // Assume 3x3 for all structures (simplified)
      for (let dx = 0; dx < 3; dx++) {
        for (let dy = 0; dy < 3; dy++) {
          occupied.add(`${placement.x + dx},${placement.y + dy}`);
        }
      }
    }

    // Find first empty spot
    for (let y = 0; y < floor.height - height + 1; y++) {
      for (let x = 0; x < floor.width - width + 1; x++) {
        let fits = true;
        for (let dx = 0; dx < width && fits; dx++) {
          for (let dy = 0; dy < height && fits; dy++) {
            if (occupied.has(`${x + dx},${y + dy}`)) {
              fits = false;
            }
          }
        }
        if (fits) {
          return { x, y };
        }
      }
    }

    return null;
  }

  /**
   * Helper: Calculate current income potential per tick
   * Based on production capacity and prices
   * @param {Object} sim - Simulation instance
   * @returns {number} Estimated income per tick
   */
  estimateIncomeRate(sim) {
    const { state, rules } = sim;

    // Sum up extraction rates
    let rawMaterialsPerTick = 0;
    for (const node of state.extractionNodes) {
      if (node.active) {
        rawMaterialsPerTick += node.rate;
      }
    }

    // Very rough estimate: assume some conversion to sellable goods
    // This would need refinement based on actual production chains
    return rawMaterialsPerTick * 5; // Rough multiplier
  }
}
