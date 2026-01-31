/**
 * Balanced Bot Strategy
 * A reasonable player behavior that balances selling, expanding, and research
 */

import { BaseStrategy } from './baseStrategy.js';
import { getHighestUnlockedAge, getFinalGoodsInInventory, getAffordableOptions } from '../simulator.js';

export class BalancedBot extends BaseStrategy {
  constructor(params = {}) {
    super(params);
    this.name = 'balanced';

    // Tunable parameters
    this.sellThreshold = params.sellThreshold ?? 5;  // Sell when we have > N of an item
    this.researchBudgetRatio = params.researchBudgetRatio ?? 0.3;  // Spend 30% on research
    this.minCreditsBuffer = params.minCreditsBuffer ?? 100;  // Keep some credits in reserve

    // State tracking
    this.lastResearchDonation = 0;
    this.machinesDeployed = 0;
  }

  decide(sim) {
    const actions = [];
    const { state, rules } = sim;

    // Priority 1: Sell final goods above threshold
    const sellActions = this.decideSelling(sim);
    actions.push(...sellActions);

    // Priority 2: Deploy machines if we have them and space
    const deployActions = this.decideDeployment(sim);
    actions.push(...deployActions);

    // Priority 3: Assign recipes to idle machines
    const recipeActions = this.decideRecipeAssignment(sim);
    actions.push(...recipeActions);

    // Priority 4: Research (donate credits, run experiments)
    const researchActions = this.decideResearch(sim);
    actions.push(...researchActions);

    // Priority 5: Expand floor if needed
    const expansionActions = this.decideExpansion(sim);
    actions.push(...expansionActions);

    return actions;
  }

  decideSelling(sim) {
    const { state, rules } = sim;
    const actions = [];

    const finalGoods = getFinalGoodsInInventory(state, rules);

    for (const item of finalGoods) {
      if (item.quantity > this.sellThreshold) {
        // Sell everything above threshold
        const sellQty = item.quantity - this.sellThreshold;
        actions.push({
          type: 'SELL_GOODS',
          payload: { itemId: item.id, quantity: sellQty }
        });
      }
    }

    return actions;
  }

  decideDeployment(sim) {
    const { state, rules } = sim;
    const actions = [];

    const builtMachines = state.builtMachines || {};

    for (const [machineType, count] of Object.entries(builtMachines)) {
      if (count <= 0) continue;

      // Find placement
      const machineConfig = rules.machines.find(m => m.id === machineType);
      if (!machineConfig) continue;

      const pos = this.findPlacement(sim, machineConfig.sizeX || 3, machineConfig.sizeY || 3);
      if (pos) {
        actions.push({
          type: 'ADD_MACHINE',
          payload: { machineType, x: pos.x, y: pos.y }
        });
        this.machinesDeployed++;
        break; // Only deploy one per tick
      }
    }

    // Deploy generators only if we're in energy deficit
    const energyNeeded = state.energy.consumed;
    const energyProduced = state.energy.produced;

    // Only deploy if we're actually short on energy
    if (energyProduced < energyNeeded) {
      const builtGenerators = state.builtGenerators || {};
      for (const [genType, count] of Object.entries(builtGenerators)) {
        if (count <= 0) continue;

        const genConfig = rules.generators.find(g => g.id === genType);
        if (!genConfig) continue;

        const pos = this.findPlacement(sim, genConfig.sizeX || 3, genConfig.sizeY || 3);
        if (pos) {
          actions.push({
            type: 'ADD_GENERATOR',
            payload: { generatorType: genType, x: pos.x, y: pos.y }
          });
          break;
        }
      }
    }

    return actions;
  }

  decideRecipeAssignment(sim) {
    const { state, rules } = sim;
    const actions = [];

    // Build recipe priority map
    const recipePriority = this.buildRecipePriority(rules);

    // Build map of what we're already producing
    const currentlyProducing = new Set(
      state.machines.filter(m => m.recipeId).map(m => m.recipeId)
    );

    // Check if we should reassign any machine to make a final good
    // Do this periodically (every 200 ticks) to avoid constant switching
    if (sim.currentTick % 200 === 0) {
      const reassignAction = this.tryReassignForFinal(sim, rules, recipePriority);
      if (reassignAction) {
        actions.push(reassignAction);
        return actions; // Only one reassignment per tick
      }
    }

    // Get machines without recipes
    const idleMachines = state.machines.filter(m => !m.recipeId && m.enabled);

    for (const machine of idleMachines) {
      const machineConfig = rules.machines.find(m => m.id === machine.type);
      if (!machineConfig || !machineConfig.allowedRecipes) continue;

      // Filter to unlocked recipes
      let availableRecipes = machineConfig.allowedRecipes
        .filter(recipeId => state.unlockedRecipes.includes(recipeId));

      // What outputs are we currently producing?
      const currentOutputs = new Set();
      for (const recipeId of currentlyProducing) {
        const r = rules.recipes.find(rec => rec.id === recipeId);
        if (r) {
          for (const outputId of Object.keys(r.outputs)) {
            currentOutputs.add(outputId);
          }
        }
      }

      // Score recipes based on:
      // 1. Can we actually produce it? (inputs available)
      // 2. Priority (leads to final goods)
      // 3. Not already being produced (diversity)
      // 4. Fills a gap in our production chain
      const scoredRecipes = availableRecipes.map(recipeId => {
        const recipe = rules.recipes.find(r => r.id === recipeId);
        if (!recipe) return { recipeId, score: -1 };

        // Start with priority
        let score = recipePriority[recipeId] || 1;

        // CRITICAL: Check if inputs can be satisfied from raw materials or current production
        const canProduce = this.canProduceRecipe(recipe, state, rules, currentlyProducing);
        if (!canProduce) {
          score = 0; // Can't make this at all - skip it
          return { recipeId, score };
        }

        // Bonus if not already producing this recipe
        if (!currentlyProducing.has(recipeId)) {
          score += 10;
        }

        // Bonus if this recipe produces something needed by other recipes we're making
        const outputIds = Object.keys(recipe.outputs);
        for (const recipeId2 of currentlyProducing) {
          const r2 = rules.recipes.find(r => r.id === recipeId2);
          if (r2) {
            for (const inputId of Object.keys(r2.inputs)) {
              if (outputIds.includes(inputId)) {
                score += 100; // Big bonus - this feeds another recipe!
              }
            }
          }
        }

        // Bonus for producing something new
        const producesNew = outputIds.some(id => !currentOutputs.has(id));
        if (producesNew) {
          score += 30;
        }

        return { recipeId, score };
      });

      // Sort by score descending
      scoredRecipes.sort((a, b) => b.score - a.score);

      if (scoredRecipes.length > 0 && scoredRecipes[0].score > 0) {
        const bestRecipe = scoredRecipes[0].recipeId;
        actions.push({
          type: 'ASSIGN_RECIPE',
          payload: { machineId: machine.id, recipeId: bestRecipe }
        });
        currentlyProducing.add(bestRecipe);
      }
    }

    return actions;
  }

  /**
   * Check if we can produce a recipe's inputs
   */
  canProduceRecipe(recipe, state, rules, currentlyProducing) {
    // Get raw materials we're extracting
    const extractingRaw = new Set(
      state.extractionNodes.filter(n => n.active).map(n => n.resourceType)
    );

    // Get what we're currently producing
    const producing = new Set();
    for (const recipeId of currentlyProducing) {
      const r = rules.recipes.find(rec => rec.id === recipeId);
      if (r) {
        for (const outputId of Object.keys(r.outputs)) {
          producing.add(outputId);
        }
      }
    }

    // Check if all inputs can be obtained
    for (const inputId of Object.keys(recipe.inputs)) {
      const material = rules.materials.find(m => m.id === inputId);
      if (!material) return false;

      // Can get from extraction?
      if (material.category === 'raw' && extractingRaw.has(inputId)) {
        continue;
      }

      // Already in inventory?
      if ((state.inventory[inputId] || 0) > 0) {
        continue;
      }

      // Being produced by another machine?
      if (producing.has(inputId)) {
        continue;
      }

      // Can't get this input
      return false;
    }

    return true;
  }

  /**
   * Build a priority map for recipes based on their value chain
   * Higher priority = more useful for producing final goods
   */
  buildRecipePriority(rules) {
    if (this._recipePriority) return this._recipePriority;

    const priority = {};
    const materialCategory = new Map(rules.materials.map(m => [m.id, m.category]));

    // Count how many recipes use each material as input
    // Materials used by more recipes are more "foundational"
    const usedByCount = new Map();
    for (const recipe of rules.recipes) {
      for (const inputId of Object.keys(recipe.inputs)) {
        usedByCount.set(inputId, (usedByCount.get(inputId) || 0) + 1);
      }
    }

    // Build recipe lookup by output
    const recipeByOutput = new Map();
    for (const recipe of rules.recipes) {
      for (const outputId of Object.keys(recipe.outputs)) {
        if (!recipeByOutput.has(outputId)) {
          recipeByOutput.set(outputId, []);
        }
        recipeByOutput.get(outputId).push(recipe);
      }
    }

    // Walk backwards from final goods, assigning decreasing priority
    const visited = new Set();

    function assignPriority(materialId, basePriority) {
      if (visited.has(materialId)) return;
      visited.add(materialId);

      const recipes = recipeByOutput.get(materialId) || [];
      for (const recipe of recipes) {
        if (!priority[recipe.id] || priority[recipe.id] < basePriority) {
          priority[recipe.id] = basePriority;
        }
        // Recursively assign priority to input materials
        for (const inputId of Object.keys(recipe.inputs)) {
          const inputMaterial = rules.materials.find(m => m.id === inputId);
          if (inputMaterial && inputMaterial.category !== 'raw') {
            assignPriority(inputId, basePriority * 0.9);
          }
        }
      }
    }

    // Start from final goods
    for (const material of rules.materials) {
      if (material.category === 'final') {
        assignPriority(material.id, 100);
      }
    }

    // Add bonus for "foundational" materials (used by many recipes)
    for (const recipe of rules.recipes) {
      const outputIds = Object.keys(recipe.outputs);
      for (const outputId of outputIds) {
        const foundationBonus = (usedByCount.get(outputId) || 0) * 5;
        priority[recipe.id] = (priority[recipe.id] || 1) + foundationBonus;
      }
    }

    // Default priority for other recipes
    for (const recipe of rules.recipes) {
      if (!priority[recipe.id]) {
        priority[recipe.id] = 1;
      }
    }

    this._recipePriority = priority;
    return priority;
  }

  decideResearch(sim) {
    const { state, rules } = sim;
    const actions = [];

    const currentAge = getHighestUnlockedAge(state, rules);

    // Don't overspend on research
    const researchBudget = state.credits * this.researchBudgetRatio;
    const creditsToRPRatio = rules.research.creditsToRPRatio;
    const experimentCost = rules.research.experimentCosts[currentAge] || 100;

    // Donate credits to get RP if we can afford it and haven't recently
    if (state.credits > this.minCreditsBuffer + researchBudget) {
      const donationAmount = Math.min(
        Math.floor(researchBudget),
        Math.floor((state.credits - this.minCreditsBuffer) / 2)
      );

      if (donationAmount >= creditsToRPRatio * 10 &&
          sim.currentTick - this.lastResearchDonation > 500) {
        actions.push({
          type: 'DONATE_CREDITS',
          payload: { amount: donationAmount }
        });
        this.lastResearchDonation = sim.currentTick;
      }
    }

    // Run experiment if we have enough RP
    if (state.research.researchPoints >= experimentCost) {
      actions.push({
        type: 'RUN_EXPERIMENT',
        payload: { age: currentAge }
      });
    }

    // Fill prototype slots if we have awaiting prototypes
    if (state.research.awaitingPrototype && state.research.awaitingPrototype.length > 0) {
      for (const proto of state.research.awaitingPrototype) {
        if (proto.slots) {
          // Slots mode
          for (let i = 0; i < proto.slots.length; i++) {
            const slot = proto.slots[i];
            if (slot.filled < slot.quantity) {
              const available = state.inventory[slot.material] || 0;
              if (available > 0) {
                const fillAmount = Math.min(available, slot.quantity - slot.filled);
                actions.push({
                  type: 'FILL_PROTOTYPE_SLOT',
                  payload: {
                    recipeId: proto.recipeId,
                    slotIndex: i,
                    quantity: fillAmount
                  }
                });
              }
            }
          }
        }
      }
    }

    return actions;
  }

  decideExpansion(sim) {
    const { state, rules } = sim;
    const actions = [];

    const affordable = getAffordableOptions(sim);

    // Expand floor if we can't place more machines
    const hasUndeployedMachines = Object.values(state.builtMachines || {}).some(c => c > 0);
    if (hasUndeployedMachines && !this.findPlacement(sim, 3, 3)) {
      if (affordable.canExpandFloor && state.credits > affordable.floorCost + this.minCreditsBuffer) {
        actions.push({
          type: 'BUY_FLOOR_SPACE',
          payload: {}
        });
      }
    }

    return actions;
  }

  /**
   * Try to reassign a machine to produce a final good or its missing input
   */
  tryReassignForFinal(sim, rules, recipePriority) {
    const { state } = sim;
    const materialCategory = new Map(rules.materials.map(m => [m.id, m.category]));

    // Find final good recipes and check what's blocking them
    const finalRecipes = rules.recipes.filter(r => {
      const outputIds = Object.keys(r.outputs);
      return outputIds.some(id => materialCategory.get(id) === 'final');
    });

    for (const recipe of finalRecipes) {
      if (!state.unlockedRecipes.includes(recipe.id)) continue;

      // Check what inputs we're missing
      const missingInputs = [];
      let canMake = true;

      for (const [inputId, needed] of Object.entries(recipe.inputs)) {
        const have = state.inventory[inputId] || 0;
        if (have < needed) {
          canMake = false;
          missingInputs.push({ id: inputId, needed, have });
        }
      }

      if (canMake) {
        // We CAN make this final! Reassign a machine to make it
        for (const machine of state.machines) {
          if (!machine.enabled) continue;

          const machineConfig = rules.machines.find(m => m.id === machine.type);
          if (!machineConfig || !machineConfig.allowedRecipes) continue;

          if (machineConfig.allowedRecipes.includes(recipe.id) &&
              machine.recipeId !== recipe.id) {
            return {
              type: 'ASSIGN_RECIPE',
              payload: { machineId: machine.id, recipeId: recipe.id }
            };
          }
        }
      } else if (missingInputs.length === 1) {
        // We're only missing ONE input - try to produce it
        const missing = missingInputs[0];

        // Find a recipe that produces this missing input
        const producerRecipe = rules.recipes.find(r => {
          const outputs = Object.keys(r.outputs);
          return outputs.includes(missing.id) && state.unlockedRecipes.includes(r.id);
        });

        if (producerRecipe) {
          // Check if we can make the producer recipe
          let canMakeProducer = true;
          for (const [inputId, needed] of Object.entries(producerRecipe.inputs)) {
            if ((state.inventory[inputId] || 0) < needed) {
              canMakeProducer = false;
              break;
            }
          }

          if (canMakeProducer) {
            // Find a machine that can make the missing input
            for (const machine of state.machines) {
              if (!machine.enabled || machine.recipeId === producerRecipe.id) continue;

              const machineConfig = rules.machines.find(m => m.id === machine.type);
              if (!machineConfig || !machineConfig.allowedRecipes) continue;

              if (machineConfig.allowedRecipes.includes(producerRecipe.id)) {
                return {
                  type: 'ASSIGN_RECIPE',
                  payload: { machineId: machine.id, recipeId: producerRecipe.id }
                };
              }
            }
          }
        }
      }
    }

    return null;
  }
}

/**
 * Create a balanced bot with default parameters
 */
export function createBalancedBot(params = {}) {
  return new BalancedBot(params);
}
