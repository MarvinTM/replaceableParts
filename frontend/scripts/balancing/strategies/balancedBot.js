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
    this.sellThreshold = params.sellThreshold ?? 3;  // Sell when we have > N of an item
    this.researchBudgetRatio = params.researchBudgetRatio ?? 0.2;  // Spend 20% on research
    this.minCreditsBuffer = params.minCreditsBuffer ?? 50;  // Keep some credits in reserve
    this.buildCooldownTicks = params.buildCooldownTicks ?? 100;
    this.maxMachines = params.maxMachines ?? null;  // null = no hard cap
    this.maxUndeployedMachines = params.maxUndeployedMachines ?? 8;
    this.maxUndeployedGenerators = params.maxUndeployedGenerators ?? 3;
    this.maxPrototypeBacklog = params.maxPrototypeBacklog ?? 8;
    this.maxPrototypeBacklogForDonation = params.maxPrototypeBacklogForDonation ?? 40;
    this.maxSellActionsPerTick = params.maxSellActionsPerTick ?? 2;
    this.sellBatchSize = params.sellBatchSize ?? 8;
    this.minMarketPopularityToSell = params.minMarketPopularityToSell ?? 0.85;
    this.emergencyMinPopularityToSell = params.emergencyMinPopularityToSell ?? 0.6;
    this.minTicksBetweenSameItemSell = params.minTicksBetweenSameItemSell ?? 20;
    this.cooldownUnderPressureFactor = params.cooldownUnderPressureFactor ?? 0.75;
    this.cooldownOverridePenalty = params.cooldownOverridePenalty ?? 45;
    this.sellAnalysisWindowTicks = params.sellAnalysisWindowTicks ?? 220;
    this.maxRecentSalesSharePerItem = params.maxRecentSalesSharePerItem ?? 0.55;
    this.hardMaxRecentSalesSharePerItem = params.hardMaxRecentSalesSharePerItem ?? 0.72;
    this.maxConsecutiveSameItemSells = params.maxConsecutiveSameItemSells ?? 2;
    this.sameItemStreakPenalty = params.sameItemStreakPenalty ?? 30;
    this.switchPreferenceMinRelativeScore = params.switchPreferenceMinRelativeScore ?? 0.55;
    this.dominancePenaltyWeight = params.dominancePenaltyWeight ?? 220;
    this.diversityBoostWeight = params.diversityBoostWeight ?? 85;
    this.enableSellRotationPlanner = params.enableSellRotationPlanner ?? true;
    this.sellRotationPlanSize = params.sellRotationPlanSize ?? 4;
    this.sellRotationRefreshTicks = params.sellRotationRefreshTicks ?? 40;
    this.sellRotationMinRelativeScore = params.sellRotationMinRelativeScore ?? 0.3;
    this.sellRotationForceSelection = params.sellRotationForceSelection ?? true;
    this.researchDonationCooldownTicks = params.researchDonationCooldownTicks ?? 500;
    this.maxRPReserveForDonationInExperiments = params.maxRPReserveForDonationInExperiments ?? 18;
    this.maxExperimentsPerTick = params.maxExperimentsPerTick ?? 3;
    this.maxExperimentsPerTickWhenStalled = params.maxExperimentsPerTickWhenStalled ?? 6;
    this.researchStallTicks = params.researchStallTicks ?? 2500;
    this.enableTargetedCatchUpResearch = params.enableTargetedCatchUpResearch ?? true;

    // State tracking
    this.lastResearchDonation = 0;
    this.lastExploration = 0;
    this.lastBuild = 0;
    this.machinesDeployed = 0;
    this.lastSellTickByItem = {};
    this.lastSoldItemId = null;
    this.consecutiveSameItemSells = 0;
    this.sellRotationPlan = null;
    this.lastObservedAge = 1;
    this.lastAgeAdvanceTick = 0;
  }

  decide(sim) {
    const actions = [];
    const ageInfo = this.updateAgeTracking(sim);

    // Priority 1: Sell final goods above threshold (get income flowing)
    const sellActions = this.decideSelling(sim);
    actions.push(...sellActions);

    // Priority 2: Build machines/generators if we have materials
    const buildActions = this.decideBuildingMachines(sim);
    actions.push(...buildActions);

    // Priority 3: Deploy machines if we have them and space
    const deployActions = this.decideDeployment(sim);
    actions.push(...deployActions);

    // Priority 4: Assign recipes to idle machines
    const recipeActions = this.decideRecipeAssignment(sim, ageInfo);
    actions.push(...recipeActions);

    // Priority 5: Research (donate credits, run experiments)
    const researchActions = this.decideResearch(sim, ageInfo);
    actions.push(...researchActions);

    // Priority 6: Expand floor/map if needed
    const expansionActions = this.decideExpansion(sim);
    actions.push(...expansionActions);

    // Priority 7: Explore and unlock extraction nodes
    const explorationActions = this.decideExploration(sim);
    actions.push(...explorationActions);

    return actions;
  }

  updateAgeTracking(sim) {
    const currentAge = getHighestUnlockedAge(sim.state, sim.rules);
    if (currentAge > this.lastObservedAge) {
      this.lastObservedAge = currentAge;
      this.lastAgeAdvanceTick = sim.currentTick;
    }

    const ticksSinceAgeAdvance = sim.currentTick - this.lastAgeAdvanceTick;
    return {
      currentAge,
      ticksSinceAgeAdvance,
      ageStalled: ticksSinceAgeAdvance >= this.researchStallTicks,
    };
  }

  decideSelling(sim) {
    const { state, rules } = sim;
    const actions = [];

    const finalGoods = getFinalGoodsInInventory(state, rules);
    if (finalGoods.length === 0) {
      return actions;
    }

    const recentSales = state.marketRecentSales || [];
    const baseWindow = rules.market?.diversificationWindow || 100;
    const analysisWindow = Math.max(baseWindow, this.sellAnalysisWindowTicks);
    const recentWindowStart = state.tick - analysisWindow;
    const recentSalesWindow = recentSales.filter(sale => sale.tick > recentWindowStart);
    const recentCounts = {};
    for (const sale of recentSalesWindow) {
      recentCounts[sale.itemId] = (recentCounts[sale.itemId] || 0) + 1;
    }

    const totalInventoryItems = Object.values(state.inventory || {}).reduce((sum, qty) => sum + qty, 0);
    const finalGoodsUnits = finalGoods.reduce((sum, item) => sum + item.quantity, 0);
    const inventoryFillRatio = state.inventorySpace > 0 ? totalInventoryItems / state.inventorySpace : 0;
    const finalGoodsPressureRatio = finalGoodsUnits / 120;
    const pressureScore = Math.max(inventoryFillRatio, finalGoodsPressureRatio);
    const inventoryPressure =
      inventoryFillRatio > 0.85 ||
      finalGoodsUnits > 120;
    const emergencyPressure =
      inventoryFillRatio > 0.95 ||
      finalGoodsUnits > 180 ||
      pressureScore > 1.15;

    const localRecent = new Set(Object.keys(recentCounts));
    const localRecentCounts = { ...recentCounts };
    let localRecentTotal = recentSalesWindow.length;
    const selectedItems = new Set();
    this.refreshSellRotationPlan(sim, finalGoods, localRecentCounts, localRecentTotal);

    for (let actionIndex = 0; actionIndex < this.maxSellActionsPerTick; actionIndex++) {
      const candidate = this.selectBestSellCandidate(
        finalGoods,
        state,
        rules,
        localRecent,
        localRecentCounts,
        localRecentTotal,
        selectedItems,
        inventoryPressure,
        emergencyPressure,
        {
          allowCooldownOverride: false,
          useRotationPlanner: true,
        }
      );
      const fallbackCandidate = !candidate && emergencyPressure
        ? this.selectBestSellCandidate(
          finalGoods,
          state,
          rules,
          localRecent,
          localRecentCounts,
          localRecentTotal,
          selectedItems,
          inventoryPressure,
          emergencyPressure,
          {
            allowCooldownOverride: true,
            useRotationPlanner: true,
          }
        )
        : candidate;

      if (!fallbackCandidate) {
        break;
      }

      actions.push({
        type: 'SELL_GOODS',
        payload: {
          itemId: fallbackCandidate.item.id,
          quantity: fallbackCandidate.quantity
        }
      });

      this.recordSellSelection(fallbackCandidate.item.id, state.tick);
      this.advanceSellRotationPlanAfterSelection(fallbackCandidate.item.id);
      selectedItems.add(fallbackCandidate.item.id);
      localRecent.add(fallbackCandidate.item.id);
      localRecentCounts[fallbackCandidate.item.id] = (localRecentCounts[fallbackCandidate.item.id] || 0) + 1;
      localRecentTotal++;
    }

    return actions;
  }

  selectBestSellCandidate(
    finalGoods,
    state,
    rules,
    localRecent,
    localRecentCounts,
    localRecentTotal,
    selectedItems,
    inventoryPressure,
    emergencyPressure,
    options = {}
  ) {
    const candidates = [];
    const allowCooldownOverride = options.allowCooldownOverride === true;
    const requiredCooldown = this.getRequiredSellCooldownTicks(inventoryPressure, emergencyPressure);

    for (const item of finalGoods) {
      const availableToSell = item.quantity - this.sellThreshold;
      if (availableToSell <= 0) continue;
      if (selectedItems.has(item.id)) continue;

      const popularity = state.marketPopularity?.[item.id] ?? 1.0;
      const lastSellTick = this.lastSellTickByItem[item.id] ?? -Infinity;
      const sellCooldownActive = (state.tick - lastSellTick) < requiredCooldown;
      const minPopularity = inventoryPressure ? this.emergencyMinPopularityToSell : this.minMarketPopularityToSell;

      if (sellCooldownActive && !allowCooldownOverride) continue;
      if (popularity < minPopularity) continue;

      const nextItemSalesCount = (localRecentCounts[item.id] || 0) + 1;
      const projectedRecentTotal = localRecentTotal + 1;
      const projectedShare = projectedRecentTotal > 0 ? nextItemSalesCount / projectedRecentTotal : 0;
      const projectedUnique = localRecent.has(item.id) ? localRecent.size : localRecent.size + 1;

      const eventModifier = state.marketEvents?.[item.id]?.modifier || 1.0;
      const obsolescence = this.estimateObsolescenceMultiplier(item.material.age, state, rules);
      const diversificationBonus = this.getDiversificationBonus(projectedUnique, rules);
      const expectedUnitPrice = item.material.basePrice * popularity * eventModifier * obsolescence * diversificationBonus;
      const recencyPenalty = 1 + ((localRecentCounts[item.id] || 0) * 0.8);
      const noveltyBonus = localRecent.has(item.id) ? 0 : (expectedUnitPrice * 0.15 + 8);
      const ageBonus = (item.material.age || 1) * 2;
      const dominancePenalty = this.getDominancePenalty(projectedShare);
      const diversityBoost = this.getDiversityBoost(projectedShare, localRecent.size, finalGoods.length);
      const streakPenalty = this.getStreakPenalty(item.id);
      const cooldownPenalty = sellCooldownActive ? this.cooldownOverridePenalty : 0;
      const score =
        (expectedUnitPrice / recencyPenalty) +
        noveltyBonus +
        ageBonus +
        diversityBoost -
        dominancePenalty -
        streakPenalty -
        cooldownPenalty;

      let quantity = Math.min(availableToSell, this.getSellBatchForPopularity(popularity, inventoryPressure));
      quantity = this.adjustSellQuantityForRotation(quantity, item.id, projectedShare);

      if (quantity <= 0) continue;

      candidates.push({
        item,
        quantity,
        score,
        projectedShare,
      });
    }

    if (candidates.length === 0) {
      return null;
    }

    candidates.sort((a, b) => b.score - a.score);
    if (options.useRotationPlanner) {
      const plannedCandidate = this.selectPlannedSellCandidate(candidates);
      if (plannedCandidate) {
        return plannedCandidate;
      }
    }
    return this.selectCandidateWithRotationGuard(candidates);
  }

  refreshSellRotationPlan(sim, finalGoods, recentCounts, recentTotal) {
    if (!this.enableSellRotationPlanner) {
      this.sellRotationPlan = null;
      return;
    }

    const shouldRefresh = !this.sellRotationPlan ||
      (sim.currentTick - this.sellRotationPlan.generatedTick) >= this.sellRotationRefreshTicks;
    if (!shouldRefresh) {
      return;
    }

    const { state, rules } = sim;
    const scoredItems = finalGoods
      .filter(item => item.quantity > this.sellThreshold)
      .map(item => {
        const popularity = state.marketPopularity?.[item.id] ?? 1.0;
        const eventModifier = state.marketEvents?.[item.id]?.modifier || 1.0;
        const obsolescence = this.estimateObsolescenceMultiplier(item.material.age, state, rules);
        const expectedUnitPrice = item.material.basePrice * popularity * eventModifier * obsolescence;
        const recentShare = recentTotal > 0 ? (recentCounts[item.id] || 0) / recentTotal : 0;
        const noveltyBoost = recentCounts[item.id] ? 0 : 25;
        const inventoryBoost = Math.min(40, Math.max(0, item.quantity - this.sellThreshold) * 1.2);
        const score =
          expectedUnitPrice * (1 - recentShare * 0.7) +
          noveltyBoost +
          inventoryBoost +
          (item.material.age || 1) * 2;

        return {
          itemId: item.id,
          score,
        };
      })
      .sort((a, b) => b.score - a.score);

    const planSize = Math.max(2, Math.min(this.sellRotationPlanSize, scoredItems.length));
    const itemIds = scoredItems.slice(0, planSize).map(entry => entry.itemId);

    if (itemIds.length < 2) {
      this.sellRotationPlan = null;
      return;
    }

    this.sellRotationPlan = {
      itemIds,
      index: 0,
      generatedTick: sim.currentTick,
    };
  }

  selectPlannedSellCandidate(candidates) {
    if (!this.sellRotationPlan || !Array.isArray(this.sellRotationPlan.itemIds) || this.sellRotationPlan.itemIds.length < 2) {
      return null;
    }

    const bestCandidate = candidates[0];
    const planLength = this.sellRotationPlan.itemIds.length;
    const startIndex = this.sellRotationPlan.index % planLength;

    for (let offset = 0; offset < planLength; offset++) {
      const planIndex = (startIndex + offset) % planLength;
      const targetItemId = this.sellRotationPlan.itemIds[planIndex];
      const candidate = candidates.find(entry => entry.item.id === targetItemId);
      if (!candidate) continue;

      if (this.sellRotationForceSelection || candidate.score >= bestCandidate.score * this.sellRotationMinRelativeScore) {
        this.sellRotationPlan.index = (planIndex + 1) % planLength;
        return candidate;
      }
    }

    return null;
  }

  advanceSellRotationPlanAfterSelection(itemId) {
    if (!this.sellRotationPlan || !Array.isArray(this.sellRotationPlan.itemIds)) {
      return;
    }

    const selectedIndex = this.sellRotationPlan.itemIds.indexOf(itemId);
    if (selectedIndex >= 0) {
      this.sellRotationPlan.index = (selectedIndex + 1) % this.sellRotationPlan.itemIds.length;
    }
  }

  selectCandidateWithRotationGuard(candidates) {
    const bestCandidate = candidates[0];
    const alternatives = candidates.filter(candidate => candidate.item.id !== this.lastSoldItemId);
    const hasAlternatives = alternatives.length > 0;
    const bestAlternative = hasAlternatives ? alternatives[0] : null;

    if (
      this.lastSoldItemId &&
      bestCandidate.item.id === this.lastSoldItemId &&
      bestAlternative &&
      bestAlternative.score >= bestCandidate.score * this.switchPreferenceMinRelativeScore
    ) {
      return bestAlternative;
    }

    if (
      this.lastSoldItemId &&
      this.consecutiveSameItemSells >= this.maxConsecutiveSameItemSells &&
      hasAlternatives
    ) {
      return alternatives[0];
    }

    if (
      candidates[0].projectedShare > this.hardMaxRecentSalesSharePerItem &&
      hasAlternatives
    ) {
      return alternatives[0];
    }

    return bestCandidate;
  }

  recordSellSelection(itemId, tick) {
    this.lastSellTickByItem[itemId] = tick;
    if (this.lastSoldItemId === itemId) {
      this.consecutiveSameItemSells++;
      return;
    }
    this.lastSoldItemId = itemId;
    this.consecutiveSameItemSells = 1;
  }

  getRequiredSellCooldownTicks(inventoryPressure, emergencyPressure) {
    if (!inventoryPressure) return this.minTicksBetweenSameItemSell;

    const pressureFactor = emergencyPressure
      ? Math.max(0.55, this.cooldownUnderPressureFactor - 0.15)
      : this.cooldownUnderPressureFactor;
    return Math.max(1, Math.ceil(this.minTicksBetweenSameItemSell * pressureFactor));
  }

  getDominancePenalty(projectedShare) {
    if (projectedShare <= this.maxRecentSalesSharePerItem) {
      return 0;
    }
    return (projectedShare - this.maxRecentSalesSharePerItem) * this.dominancePenaltyWeight;
  }

  getDiversityBoost(projectedShare, recentUniqueCount, totalFinalGoods) {
    const diversityTargetDenominator = Math.max(2, Math.min(totalFinalGoods, recentUniqueCount + 1));
    const targetShare = 1 / diversityTargetDenominator;
    if (projectedShare >= targetShare) return 0;
    return (targetShare - projectedShare) * this.diversityBoostWeight;
  }

  getStreakPenalty(itemId) {
    if (itemId !== this.lastSoldItemId) {
      return 0;
    }
    return this.consecutiveSameItemSells * this.sameItemStreakPenalty;
  }

  adjustSellQuantityForRotation(quantity, itemId, projectedShare) {
    let adjusted = quantity;
    if (itemId === this.lastSoldItemId && this.consecutiveSameItemSells >= 2) {
      adjusted = Math.max(1, Math.floor(adjusted * 0.5));
    }
    if (projectedShare > this.maxRecentSalesSharePerItem) {
      adjusted = Math.max(1, Math.floor(adjusted * 0.6));
    }
    return adjusted;
  }

  getSellBatchForPopularity(popularity, inventoryPressure) {
    if (inventoryPressure && popularity >= this.emergencyMinPopularityToSell) {
      return Math.max(this.sellBatchSize, 12);
    }
    if (popularity >= 1.4) return Math.max(this.sellBatchSize, 12);
    if (popularity >= 1.0) return this.sellBatchSize;
    if (popularity >= 0.8) return Math.max(3, Math.floor(this.sellBatchSize / 2));
    return 2;
  }

  getDiversificationBonus(uniqueItemsSold, rules) {
    const bonuses = rules.market?.diversificationBonuses || {};
    const thresholds = Object.keys(bonuses).map(Number).sort((a, b) => b - a);
    for (const threshold of thresholds) {
      if (uniqueItemsSold >= threshold) {
        return bonuses[threshold];
      }
    }
    return 1.0;
  }

  estimateObsolescenceMultiplier(itemAge, state, rules) {
    if (!rules.market?.obsolescenceEnabled) return 1.0;
    if (!itemAge || itemAge >= 7) return 1.0;

    const nextAge = itemAge + 1;
    const nextAgeFinals = rules.recipes.filter(recipe => {
      const outputs = Object.keys(recipe.outputs || {});
      return outputs.some(outputId => {
        const material = rules.materials.find(m => m.id === outputId);
        return material?.category === 'final' && material.age === nextAge;
      });
    });

    if (nextAgeFinals.length === 0) {
      return 1.0;
    }

    const discovered = new Set(state.discoveredRecipes || []);
    const discoveredCount = nextAgeFinals.filter(recipe => discovered.has(recipe.id)).length;
    const progress = discoveredCount / nextAgeFinals.length;
    const maxDebuff = rules.market?.obsolescenceMaxDebuff || 0;
    return 1.0 - (progress * maxDebuff);
  }

  /**
   * Decide whether to build new machines or generators from materials
   */
  decideBuildingMachines(sim) {
    const { state, rules } = sim;
    const actions = [];

    // Don't build too frequently
    if (sim.currentTick - this.lastBuild < this.buildCooldownTicks) {
      return actions;
    }

    const builtMachineCount = Object.values(state.builtMachines || {}).reduce((a, b) => a + b, 0);
    const builtGeneratorCount = Object.values(state.builtGenerators || {}).reduce((a, b) => a + b, 0);
    const totalMachines = state.machines.length + builtMachineCount;

    // Try to build generators first if we need power
    const potentialEnergyNeed = this.calculatePotentialEnergyNeed(state, rules);
    const needsMorePower = state.energy.produced < potentialEnergyNeed + 5;
    if (needsMorePower && builtGeneratorCount < this.maxUndeployedGenerators) {
      const genAction = this.tryBuildGenerator(sim);
      if (genAction) {
        actions.push(genAction);
      }
    }

    // Build machines if under configured cap and not already overstocked in undeployed pool
    const underMachineCap = this.maxMachines === null || totalMachines < this.maxMachines;
    if (underMachineCap && builtMachineCount < this.maxUndeployedMachines) {
      const machineAction = this.tryBuildMachine(sim);
      if (machineAction) {
        actions.push(machineAction);
      }
    }

    if (actions.length > 0) {
      this.lastBuild = sim.currentTick;
    }

    return actions;
  }

  calculatePotentialEnergyNeed(state, rules) {
    let need = state.energy.consumed;
    for (const machine of state.machines) {
      if (machine.status === 'blocked') {
        const config = rules.machines.find(m => m.id === machine.type);
        need += config?.energyConsumption || 1;
      }
    }
    for (const [type, count] of Object.entries(state.builtMachines || {})) {
      const config = rules.machines.find(m => m.id === type);
      need += (config?.energyConsumption || 1) * count;
    }
    return need;
  }

  tryBuildGenerator(sim) {
    const { state, rules } = sim;
    const candidates = [];
    for (const genConfig of rules.generators) {
      const recipe = rules.generatorRecipes?.[genConfig.id];
      if (!recipe?.slots) continue;
      if (!this.canBuildFromSlots(state, recipe.slots)) continue;
      if (!this.canSustainGenerator(state, rules, genConfig)) continue;

      const deployedCount = state.generators.filter(g => g.type === genConfig.id).length;
      const builtCount = state.builtGenerators?.[genConfig.id] || 0;
      const totalCount = deployedCount + builtCount;
      const footprint = (genConfig.sizeX || 3) * (genConfig.sizeY || 3);
      const noFuelBonus = genConfig.fuelRequirement ? 0 : 40;
      const fuelSurplus = this.getFuelSurplusForGenerator(state, rules, genConfig);

      const score =
        (genConfig.energyOutput || 0) * 2 +
        noFuelBonus +
        Math.max(-20, Math.min(20, fuelSurplus * 5)) -
        totalCount * 60 -
        footprint * 0.3;

      candidates.push({
        score,
        generatorType: genConfig.id,
      });
    }

    if (candidates.length === 0) {
      return null;
    }

    candidates.sort((a, b) => b.score - a.score);
    return {
      type: 'BUILD_GENERATOR',
      payload: { generatorType: candidates[0].generatorType }
    };
  }

  tryBuildMachine(sim) {
    const { state, rules } = sim;
    const unlockedSet = new Set(state.unlockedRecipes || []);
    const recipeById = new Map(rules.recipes.map(recipe => [recipe.id, recipe]));
    const materialById = new Map(rules.materials.map(material => [material.id, material]));
    const prototypeNeeds = this.getPrototypeMaterialNeeds(state);
    const candidates = [];

    for (const machineConfig of rules.machines) {
      const recipe = rules.machineRecipes?.[machineConfig.id];
      if (!recipe?.slots) continue;
      if (!this.canBuildFromSlots(state, recipe.slots)) continue;

      const deployedCount = state.machines.filter(m => m.type === machineConfig.id).length;
      const builtCount = state.builtMachines?.[machineConfig.id] || 0;
      const totalCount = deployedCount + builtCount;
      const allowedRecipes = machineConfig.allowedRecipes || [];
      const unlockedAllowedRecipes = allowedRecipes.filter(recipeId => unlockedSet.has(recipeId));

      let prototypeCoverage = 0;
      let finalCoverage = 0;
      for (const allowedRecipeId of unlockedAllowedRecipes) {
        const allowedRecipe = recipeById.get(allowedRecipeId);
        if (!allowedRecipe) continue;
        const outputs = Object.keys(allowedRecipe.outputs || {});

        for (const outputId of outputs) {
          if (prototypeNeeds[outputId] > 0) {
            prototypeCoverage++;
            break;
          }
        }

        for (const outputId of outputs) {
          if (materialById.get(outputId)?.category === 'final') {
            finalCoverage++;
            break;
          }
        }
      }

      const score =
        prototypeCoverage * 500 +
        finalCoverage * 50 +
        unlockedAllowedRecipes.length * 3 -
        totalCount * 80;

      candidates.push({
        score,
        machineType: machineConfig.id,
      });
    }

    if (candidates.length === 0) {
      return null;
    }

    candidates.sort((a, b) => b.score - a.score);
    return {
      type: 'BUILD_MACHINE',
      payload: { machineType: candidates[0].machineType }
    };
  }

  canBuildFromSlots(state, slots) {
    const required = {};
    for (const slot of slots) {
      const quantity = slot.quantity || 1;
      required[slot.material] = (required[slot.material] || 0) + quantity;
    }

    for (const [materialId, needed] of Object.entries(required)) {
      if ((state.inventory[materialId] || 0) < needed) {
        return false;
      }
    }

    return true;
  }

  getFuelSurplusForGenerator(state, rules, genConfig) {
    if (!genConfig.fuelRequirement) return 0;

    const fuelType = genConfig.fuelRequirement.materialId;
    const fuelExtraction = state.extractionNodes
      .filter(node => node.active && node.resourceType === fuelType)
      .reduce((sum, node) => sum + node.rate, 0);

    let currentFuelConsumption = 0;
    for (const generator of state.generators) {
      const existingGenConfig = rules.generators.find(g => g.id === generator.type);
      if (existingGenConfig?.fuelRequirement?.materialId === fuelType) {
        currentFuelConsumption += existingGenConfig.fuelRequirement.consumptionRate || 1;
      }
    }

    return fuelExtraction - currentFuelConsumption;
  }

  canSustainGenerator(state, rules, genConfig) {
    if (!genConfig.fuelRequirement) return true;
    const fuelConsumption = genConfig.fuelRequirement.consumptionRate || 1;
    return this.getFuelSurplusForGenerator(state, rules, genConfig) >= fuelConsumption;
  }

  getRecipeOutputMaxAge(recipe, materialById) {
    if (!recipe) return 1;
    let maxAge = 1;
    for (const outputId of Object.keys(recipe.outputs || {})) {
      const age = materialById.get(outputId)?.age || 1;
      if (age > maxAge) {
        maxAge = age;
      }
    }
    return maxAge;
  }

  getPrototypeMaterialNeeds(state, rules = null, options = {}) {
    const needs = {};
    const recipeById = rules ? new Map(rules.recipes.map(recipe => [recipe.id, recipe])) : null;
    const materialById = rules ? new Map(rules.materials.map(material => [material.id, material])) : null;
    const currentAge = rules
      ? (options.currentAge ?? getHighestUnlockedAge(state, rules))
      : 1;
    const prioritizeNextAge = options.prioritizeNextAge ?? false;
    const ageStalled = options.ageStalled ?? false;
    const preferNearComplete = options.preferNearComplete ?? false;

    for (const prototype of state.research?.awaitingPrototype || []) {
      if (prototype.mode !== 'slots' || !prototype.slots) continue;

      let priorityMultiplier = 1;
      if (rules && recipeById && materialById) {
        const recipe = recipeById.get(prototype.recipeId);
        const outputAge = this.getRecipeOutputMaxAge(recipe, materialById);
        if (prioritizeNextAge && outputAge >= currentAge + 1) {
          priorityMultiplier += ageStalled ? 3 : 1.5;
        }

        if (preferNearComplete) {
          let totalRequired = 0;
          let totalFilled = 0;
          for (const slot of prototype.slots) {
            if (slot.isRaw) continue;
            totalRequired += slot.quantity || 0;
            totalFilled += slot.filled || 0;
          }
          const completionRatio = totalRequired > 0 ? totalFilled / totalRequired : 0;
          priorityMultiplier += completionRatio * 0.75;
        }
      }

      for (const slot of prototype.slots) {
        if (slot.isRaw) continue;
        const remaining = (slot.quantity || 0) - (slot.filled || 0);
        if (remaining > 0) {
          const weightedRemaining = Math.max(1, Math.round(remaining * priorityMultiplier));
          needs[slot.material] = (needs[slot.material] || 0) + weightedRemaining;
        }
      }
    }
    return needs;
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

    // Deploy generators if we need more power
    const energyProduced = state.energy.produced;

    // Calculate potential energy needs: current consumption + blocked machines + undeployed machines
    let potentialNeeds = state.energy.consumed;

    // Add blocked machines
    for (const machine of state.machines) {
      if (machine.status === 'blocked') {
        const machineConfig = rules.machines.find(m => m.id === machine.type);
        potentialNeeds += machineConfig?.energyConsumption || 1;
      }
    }

    // Add undeployed machines (we'll want power for them)
    for (const [machineType, count] of Object.entries(state.builtMachines || {})) {
      if (count > 0) {
        const machineConfig = rules.machines.find(m => m.id === machineType);
        potentialNeeds += (machineConfig?.energyConsumption || 1) * count;
      }
    }

    // Deploy generators if we don't have enough for potential needs
    if (energyProduced < potentialNeeds) {
      const builtGenerators = state.builtGenerators || {};
      for (const [genType, count] of Object.entries(builtGenerators)) {
        if (count <= 0) continue;

        const genConfig = rules.generators.find(g => g.id === genType);
        if (!genConfig) continue;

        // Check if deploying this fuel-based generator would starve production
        if (genConfig.fuelRequirement) {
          const fuelType = genConfig.fuelRequirement.materialId;
          const fuelConsumption = genConfig.fuelRequirement.consumptionRate || 1;

          // Calculate current fuel extraction rate
          const fuelExtraction = state.extractionNodes
            .filter(n => n.active && n.resourceType === fuelType)
            .reduce((sum, n) => sum + n.rate, 0);

          // Calculate current fuel consumption by existing generators
          let currentFuelConsumption = 0;
          for (const gen of state.generators) {
            const existingGenConfig = rules.generators.find(g => g.id === gen.type);
            if (existingGenConfig?.fuelRequirement?.materialId === fuelType) {
              currentFuelConsumption += existingGenConfig.fuelRequirement.consumptionRate || 1;
            }
          }

          // Only deploy if we can sustain current + new fuel demand
          const fuelSurplus = fuelExtraction - currentFuelConsumption;
          if (fuelSurplus < fuelConsumption) {
            continue;
          }
        }

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

  decideRecipeAssignment(sim, ageInfo = null) {
    const { state, rules } = sim;
    const actions = [];

    // Build recipe priority map
    const recipePriority = this.buildRecipePriority(rules);
    const currentAge = ageInfo?.currentAge ?? getHighestUnlockedAge(state, rules);
    const prototypeNeeds = this.getPrototypeMaterialNeeds(state, rules, {
      currentAge,
      prioritizeNextAge: true,
      ageStalled: ageInfo?.ageStalled,
      preferNearComplete: true,
    });

    // Build map of what we're already producing
    const currentlyProducing = new Set(
      state.machines.filter(m => m.recipeId).map(m => m.recipeId)
    );

    // If we have prototype backlogs, periodically force production toward missing prototype materials
    if (sim.currentTick % 25 === 0) {
      const prototypeAction = this.tryReassignForPrototype(sim, rules, currentlyProducing, ageInfo);
      if (prototypeAction) {
        actions.push(prototypeAction);
        return actions;
      }
    }

    // Check if we should reassign any machine to make a final good
    // Do this frequently (every 50 ticks) to keep production flowing
    if (sim.currentTick % 50 === 0) {
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

        // Strong bonus for producing materials needed by active prototypes
        for (const outputId of outputIds) {
          if (prototypeNeeds[outputId] > 0) {
            score += 250 + Math.min(120, prototypeNeeds[outputId] * 4);
          }
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

  findTargetedCatchUpRecipe(state, rules, currentAge) {
    const discovered = new Set(state.discoveredRecipes || []);
    const unlocked = new Set(state.unlockedRecipes || []);
    const materialById = new Map(rules.materials.map(material => [material.id, material]));

    const candidates = rules.recipes
      .filter(recipe => !discovered.has(recipe.id) && !unlocked.has(recipe.id))
      .map(recipe => {
        const outputAge = this.getRecipeOutputMaxAge(recipe, materialById);
        if (outputAge < currentAge + 1) return null;

        const nonRawInputCount = Object.keys(recipe.inputs || {}).filter(inputId => {
          const category = materialById.get(inputId)?.category;
          return category && category !== 'raw';
        }).length;
        const totalInputQuantity = Object.values(recipe.inputs || {}).reduce((sum, qty) => sum + qty, 0);

        return {
          recipe,
          outputAge,
          nonRawInputCount,
          totalInputQuantity,
          ticksToComplete: recipe.ticksToComplete || 10,
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        if (a.outputAge !== b.outputAge) return a.outputAge - b.outputAge;
        if (a.nonRawInputCount !== b.nonRawInputCount) return a.nonRawInputCount - b.nonRawInputCount;
        if (a.totalInputQuantity !== b.totalInputQuantity) return a.totalInputQuantity - b.totalInputQuantity;
        return a.ticksToComplete - b.ticksToComplete;
      });

    return candidates.length > 0 ? candidates[0].recipe.id : null;
  }

  getPrioritizedPrototypesForFilling(state, rules, currentAge, ageStalled) {
    const awaiting = state.research?.awaitingPrototype || [];
    if (awaiting.length === 0) return [];

    const recipeById = new Map(rules.recipes.map(recipe => [recipe.id, recipe]));
    const materialById = new Map(rules.materials.map(material => [material.id, material]));

    return [...awaiting]
      .filter(prototype => prototype.mode === 'slots' && prototype.slots)
      .map(prototype => {
        const recipe = recipeById.get(prototype.recipeId);
        const outputAge = this.getRecipeOutputMaxAge(recipe, materialById);

        let totalRequired = 0;
        let totalFilled = 0;
        for (const slot of prototype.slots) {
          if (slot.isRaw) continue;
          totalRequired += slot.quantity || 0;
          totalFilled += slot.filled || 0;
        }
        const completionRatio = totalRequired > 0 ? totalFilled / totalRequired : 0;
        const remaining = Math.max(0, totalRequired - totalFilled);
        const nextAgePriority = outputAge >= currentAge + 1 ? (ageStalled ? 1200 : 800) : 0;
        const score =
          nextAgePriority +
          completionRatio * 300 +
          outputAge * 25 -
          remaining * 5;

        return { prototype, score };
      })
      .sort((a, b) => b.score - a.score)
      .map(entry => entry.prototype);
  }

  decideResearch(sim, ageInfo = null) {
    const { state, rules } = sim;
    const actions = [];

    const currentAge = ageInfo?.currentAge ?? getHighestUnlockedAge(state, rules);
    const ageStalled = ageInfo?.ageStalled || false;
    const researchBudget = state.credits * this.researchBudgetRatio;
    const creditsToRPRatio = rules.research.creditsToRPRatio;
    const experimentCost = rules.research.experimentCosts[currentAge] || 100;
    const prototypeBacklog = state.research.awaitingPrototype?.length || 0;
    const donationRPThreshold = experimentCost * this.maxRPReserveForDonationInExperiments;

    // Donate credits only when RP stock is low enough to justify more funding.
    if (state.credits > this.minCreditsBuffer + researchBudget) {
      const donationAmount = Math.min(
        Math.floor(researchBudget),
        Math.floor((state.credits - this.minCreditsBuffer) / 2)
      );

      if (donationAmount >= creditsToRPRatio * 10 &&
          sim.currentTick - this.lastResearchDonation > this.researchDonationCooldownTicks &&
          state.research.researchPoints < donationRPThreshold &&
          prototypeBacklog <= this.maxPrototypeBacklogForDonation) {
        actions.push({
          type: 'DONATE_CREDITS',
          payload: { amount: donationAmount }
        });
        this.lastResearchDonation = sim.currentTick;
      }
    }

    let researchPointsAvailable = state.research.researchPoints || 0;

    // If age progression is stalling, prioritize a targeted next-age discovery.
    if (ageStalled && this.enableTargetedCatchUpResearch) {
      const targetedRecipeId = this.findTargetedCatchUpRecipe(state, rules, currentAge);
      const targetedCost = experimentCost * (rules.research.targetedExperimentMultiplier || 10);
      if (targetedRecipeId && researchPointsAvailable >= targetedCost) {
        actions.push({
          type: 'RUN_TARGETED_EXPERIMENT',
          payload: { recipeId: targetedRecipeId }
        });
        researchPointsAvailable -= targetedCost;
      }
    }

    // Experiments are the primary RP sink; run them whenever affordable.
    const experimentBudget = ageStalled ? this.maxExperimentsPerTickWhenStalled : this.maxExperimentsPerTick;
    const experimentsToRun = Math.min(
      experimentBudget,
      Math.floor(researchPointsAvailable / experimentCost)
    );

    for (let i = 0; i < experimentsToRun; i++) {
      actions.push({
        type: 'RUN_EXPERIMENT',
        payload: { age: currentAge }
      });
    }

    // Fill prototype slots with next-age / near-complete prototypes first.
    const prioritizedPrototypes = this.getPrioritizedPrototypesForFilling(state, rules, currentAge, ageStalled);
    for (const proto of prioritizedPrototypes) {
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
                materialId: slot.material,
                quantity: fillAmount
              }
            });
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

    // Expand floor if we cannot place at least one undeployed structure using its real size
    const hasUndeployedMachines = Object.values(state.builtMachines || {}).some(c => c > 0);
    const hasUndeployedGenerators = Object.values(state.builtGenerators || {}).some(c => c > 0);
    const needsSpace = this.hasUnplaceableUndeployedStructure(sim);

    if ((hasUndeployedMachines || hasUndeployedGenerators) && needsSpace) {
      if (affordable.canExpandFloor && state.credits > affordable.floorCost + this.minCreditsBuffer) {
        actions.push({
          type: 'BUY_FLOOR_SPACE',
          payload: {}
        });
      }
    }

    return actions;
  }

  hasUnplaceableUndeployedStructure(sim) {
    const { state, rules } = sim;
    const structuresToPlace = [];

    for (const [machineType, count] of Object.entries(state.builtMachines || {})) {
      if (count <= 0) continue;
      const machineConfig = rules.machines.find(machine => machine.id === machineType);
      if (!machineConfig) continue;
      for (let i = 0; i < count; i++) {
        structuresToPlace.push({
          sizeX: machineConfig.sizeX || 3,
          sizeY: machineConfig.sizeY || 3,
        });
      }
    }

    for (const [generatorType, count] of Object.entries(state.builtGenerators || {})) {
      if (count <= 0) continue;
      const generatorConfig = rules.generators.find(generator => generator.id === generatorType);
      if (!generatorConfig) continue;
      for (let i = 0; i < count; i++) {
        structuresToPlace.push({
          sizeX: generatorConfig.sizeX || 3,
          sizeY: generatorConfig.sizeY || 3,
        });
      }
    }

    if (structuresToPlace.length === 0) {
      return false;
    }

    // Place larger structures first to avoid false positives from fragmentation.
    structuresToPlace.sort((a, b) => (b.sizeX * b.sizeY) - (a.sizeX * a.sizeY));

    const occupied = this.getOccupiedCellsForPlanning(state, rules);
    for (const structure of structuresToPlace) {
      const position = this.findPlacementWithOccupied(
        state.floorSpace,
        occupied,
        structure.sizeX,
        structure.sizeY
      );
      if (!position) {
        return true;
      }
      this.markOccupiedCells(occupied, position.x, position.y, structure.sizeX, structure.sizeY);
    }

    return false;
  }

  getOccupiedCellsForPlanning(state, rules) {
    const occupied = new Set();
    for (const placement of state.floorSpace.placements || []) {
      let sizeX = 3;
      let sizeY = 3;
      const machineConfig = rules.machines.find(machine => machine.id === placement.structureType);
      if (machineConfig) {
        sizeX = machineConfig.sizeX || 3;
        sizeY = machineConfig.sizeY || 3;
      } else {
        const generatorConfig = rules.generators.find(generator => generator.id === placement.structureType);
        if (generatorConfig) {
          sizeX = generatorConfig.sizeX || 3;
          sizeY = generatorConfig.sizeY || 3;
        }
      }

      this.markOccupiedCells(occupied, placement.x, placement.y, sizeX, sizeY);
    }
    return occupied;
  }

  markOccupiedCells(occupied, x, y, sizeX, sizeY) {
    for (let dx = 0; dx < sizeX; dx++) {
      for (let dy = 0; dy < sizeY; dy++) {
        occupied.add(`${x + dx},${y + dy}`);
      }
    }
  }

  findPlacementWithOccupied(floorSpace, occupied, width, height) {
    for (let y = 0; y < floorSpace.height - height + 1; y++) {
      for (let x = 0; x < floorSpace.width - width + 1; x++) {
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
   * Explore the map and unlock extraction nodes
   * This is a key progression mechanic - unlocking nodes increases production throughput
   */
  decideExploration(sim) {
    const { state, rules } = sim;
    const actions = [];

    if (!state.explorationMap) return actions;

    // Only check for nodes periodically to avoid expensive map scans
    if (sim.currentTick - this.lastExploration < 50) {
      return actions;
    }

    // PRIORITY 1: Unlock available nodes
    const nodeUnlockBaseCost = rules.exploration.nodeUnlockCost || 15;
    const globalScaleFactor = rules.exploration.globalNodeScaleFactor || 1.0;
    const totalNodes = state.extractionNodes.length;
    const globalMultiplier = Math.pow(globalScaleFactor, totalNodes);

    // Find unlockable nodes - only scan explored bounds to limit iterations
    const bounds = state.explorationMap.exploredBounds;
    let bestNode = null;
    let bestScore = -Infinity;

    for (let y = bounds.minY; y <= bounds.maxY; y++) {
      for (let x = bounds.minX; x <= bounds.maxX; x++) {
        const tile = state.explorationMap.tiles[`${x},${y}`];
        if (!tile?.explored || !tile.extractionNode || tile.extractionNode.unlocked) continue;

        const resourceType = tile.extractionNode.resourceType;
        const existingCount = state.extractionNodes.filter(n => n.resourceType === resourceType).length;
        const resourceScaleFactor = rules.exploration.unlockScaleFactors?.[resourceType] || 1.2;
        // Apply both per-resource and global scaling
        const cost = Math.floor(nodeUnlockBaseCost * Math.pow(resourceScaleFactor, existingCount) * globalMultiplier);

        // Can we afford it?
        if (state.credits <= cost + this.minCreditsBuffer) continue;

        // Score: prioritize fewer existing nodes (diversify), lower cost
        const score = -existingCount * 1000 - cost;
        if (score > bestScore) {
          bestScore = score;
          bestNode = { x, y, cost };
        }
      }
    }

    if (bestNode) {
      actions.push({
        type: 'UNLOCK_EXPLORATION_NODE',
        payload: { x: bestNode.x, y: bestNode.y }
      });
      this.lastExploration = sim.currentTick;
      return actions;
    }

    // PRIORITY 2: Expand exploration (less frequent)
    if (sim.currentTick - this.lastExploration < 200) {
      return actions;
    }

    const explorationCost = rules.exploration.baseCostPerCell * 16;
    if (state.credits > explorationCost + this.minCreditsBuffer * 3) {
      actions.push({
        type: 'EXPAND_EXPLORATION',
        payload: {}
      });
      this.lastExploration = sim.currentTick;
    }

    return actions;
  }

  /**
   * Try to reassign a machine to produce a final good or its missing input
   */
  tryReassignForFinal(sim, rules, recipePriority) {
    const { state } = sim;
    const materialCategory = new Map(rules.materials.map(m => [m.id, m.category]));
    const materialById = new Map(rules.materials.map(m => [m.id, m]));
    const recentWindow = Math.max(rules.market?.diversificationWindow || 100, this.sellAnalysisWindowTicks);
    const recentWindowStart = state.tick - recentWindow;
    const recentSalesWindow = (state.marketRecentSales || []).filter(sale => sale.tick > recentWindowStart);
    const recentSalesCounts = {};
    for (const sale of recentSalesWindow) {
      recentSalesCounts[sale.itemId] = (recentSalesCounts[sale.itemId] || 0) + 1;
    }
    const recentSalesTotal = recentSalesWindow.length;
    const machinesByRecipe = {};
    for (const machine of state.machines) {
      if (!machine.recipeId) continue;
      machinesByRecipe[machine.recipeId] = (machinesByRecipe[machine.recipeId] || 0) + 1;
    }

    // Get raw materials we're extracting
    const extractingRaw = new Set(
      state.extractionNodes.filter(n => n.active).map(n => n.resourceType)
    );

    // Get what's being produced by machines
    const beingProduced = new Set();
    for (const machine of state.machines) {
      if (machine.recipeId && machine.status !== 'blocked') {
        const r = rules.recipes.find(rec => rec.id === machine.recipeId);
        if (r) {
          for (const outputId of Object.keys(r.outputs)) {
            beingProduced.add(outputId);
          }
        }
      }
    }

    // Score unlocked final recipes to avoid converging on a single dominant output.
    const finalRecipeCandidates = rules.recipes
      .filter(recipe => state.unlockedRecipes.includes(recipe.id))
      .map(recipe => {
        const finalOutputs = Object.keys(recipe.outputs || {})
          .map(outputId => ({ outputId, material: materialById.get(outputId) }))
          .filter(({ material }) => material?.category === 'final');
        if (finalOutputs.length === 0) return null;

        const nonRawInputCount = Object.keys(recipe.inputs || {})
          .filter(inputId => materialCategory.get(inputId) !== 'raw')
          .length;
        const producingCount = machinesByRecipe[recipe.id] || 0;

        let outputScore = -Infinity;
        for (const output of finalOutputs) {
          const popularity = state.marketPopularity?.[output.outputId] ?? 1.0;
          const recentCount = recentSalesCounts[output.outputId] || 0;
          const recentShare = recentSalesTotal > 0 ? recentCount / recentSalesTotal : 0;
          const inventory = state.inventory?.[output.outputId] || 0;
          const age = output.material?.age || 1;
          const basePrice = output.material?.basePrice || 0;
          const score =
            popularity * 120 +
            Math.log2(basePrice + 1) * 10 +
            (recentCount === 0 ? 35 : 0) -
            recentShare * 180 -
            inventory * 2 +
            age * 5;
          outputScore = Math.max(outputScore, score);
        }

        const chainPriority = recipePriority?.[recipe.id] || 1;
        const recipeScore =
          outputScore +
          chainPriority * 0.4 -
          nonRawInputCount * 8 -
          producingCount * 70;

        return {
          recipe,
          recipeScore,
          nonRawInputCount,
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        if (b.recipeScore !== a.recipeScore) return b.recipeScore - a.recipeScore;
        return a.nonRawInputCount - b.nonRawInputCount;
      });

    for (const candidate of finalRecipeCandidates) {
      const recipe = candidate.recipe;
      if (!state.unlockedRecipes.includes(recipe.id)) continue;

      // Check what inputs we're missing
      const missingInputs = [];
      let canMake = true;

      for (const [inputId, needed] of Object.entries(recipe.inputs)) {
        const material = rules.materials.find(m => m.id === inputId);
        const isRaw = material?.category === 'raw';

        if (isRaw) {
          // Raw materials come from extraction
          if (!extractingRaw.has(inputId)) {
            canMake = false;
            missingInputs.push({ id: inputId, needed, have: 0, isRaw: true });
          }
        } else {
          // Non-raw from inventory or production
          const have = state.inventory[inputId] || 0;
          const producing = beingProduced.has(inputId);
          if (have < needed && !producing) {
            canMake = false;
            missingInputs.push({ id: inputId, needed, have, isRaw: false });
          } else if (have >= needed) {
            // We have it in inventory - can make!
          } else if (producing) {
            // It's being produced - wait for it
            canMake = false;
          }
        }
      }

      if (canMake) {
        // We CAN make this final! Reassign a machine to make it
        for (const machine of state.machines) {
          if (!machine.enabled || machine.status === 'blocked') continue;

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
      } else if (missingInputs.length > 0) {
        // Try to produce missing inputs (prioritize non-raw ones)
        for (const missing of missingInputs.filter(m => !m.isRaw)) {
          // Find a recipe that produces this missing input
          const producerRecipe = rules.recipes.find(r => {
            const outputs = Object.keys(r.outputs);
            return outputs.includes(missing.id) && state.unlockedRecipes.includes(r.id);
          });

          if (producerRecipe) {
            // Check if we can make the producer recipe
            let canMakeProducer = true;
            for (const [inputId, needed] of Object.entries(producerRecipe.inputs)) {
              const mat = rules.materials.find(m => m.id === inputId);
              if (mat?.category === 'raw') {
                if (!extractingRaw.has(inputId)) canMakeProducer = false;
              } else {
                if ((state.inventory[inputId] || 0) < needed && !beingProduced.has(inputId)) {
                  canMakeProducer = false;
                }
              }
            }

            if (canMakeProducer) {
              // Find a machine that can make the missing input
              for (const machine of state.machines) {
                if (!machine.enabled || machine.status === 'blocked') continue;
                if (machine.recipeId === producerRecipe.id) continue;

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
    }

    return null;
  }

  tryReassignForPrototype(sim, rules, currentlyProducing, ageInfo = null) {
    const { state } = sim;
    const currentAge = ageInfo?.currentAge ?? getHighestUnlockedAge(state, rules);
    const prototypeNeeds = this.getPrototypeMaterialNeeds(state, rules, {
      currentAge,
      prioritizeNextAge: true,
      ageStalled: ageInfo?.ageStalled,
      preferNearComplete: true,
    });
    const neededMaterials = Object.entries(prototypeNeeds)
      .sort((a, b) => b[1] - a[1]);

    if (neededMaterials.length === 0) {
      return null;
    }

    const unlockedSet = new Set(state.unlockedRecipes || []);
    const candidateMachines = [...state.machines]
      .filter(machine => machine.enabled && machine.status !== 'blocked')
      .sort((a, b) => (a.recipeId ? 1 : 0) - (b.recipeId ? 1 : 0)); // Prefer idle machines

    for (const [neededMaterial] of neededMaterials) {
      const producerRecipes = rules.recipes
        .filter(recipe =>
          unlockedSet.has(recipe.id) &&
          Object.prototype.hasOwnProperty.call(recipe.outputs || {}, neededMaterial)
        )
        .sort((a, b) => (a.ticksToComplete || 10) - (b.ticksToComplete || 10));

      for (const producerRecipe of producerRecipes) {
        if (!this.canProduceRecipe(producerRecipe, state, rules, currentlyProducing)) continue;

        for (const machine of candidateMachines) {
          if (machine.recipeId === producerRecipe.id) continue;
          const machineConfig = rules.machines.find(m => m.id === machine.type);
          if (!machineConfig?.allowedRecipes?.includes(producerRecipe.id)) continue;
          return {
            type: 'ASSIGN_RECIPE',
            payload: { machineId: machine.id, recipeId: producerRecipe.id }
          };
        }
      }
    }

    return null;
  }

  /**
   * Get a diverse set of final goods to produce
   */
  getTargetFinalGoods(state, rules) {
    const unlocked = new Set(state.unlockedRecipes);
    const finals = [];

    for (const recipe of rules.recipes) {
      if (!unlocked.has(recipe.id)) continue;
      for (const outputId of Object.keys(recipe.outputs)) {
        const mat = rules.materials.find(m => m.id === outputId);
        if (mat?.category === 'final') {
          finals.push({ recipeId: recipe.id, materialId: outputId, age: mat.age });
        }
      }
    }

    // Sort by age (lower first for easier production)
    return finals.sort((a, b) => a.age - b.age);
  }
}

/**
 * Create a balanced bot with default parameters
 */
export function createBalancedBot(params = {}) {
  return new BalancedBot(params);
}
