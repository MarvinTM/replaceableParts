/**
 * KPI Tracker
 * Collects and calculates game balance metrics during simulation
 *
 * Tracks metrics for:
 * 1. Economy (credits, spending breakdown, income rates)
 * 2. Expansion (floor, map, nodes)
 * 3. Research (RP sources, prototypes, discoveries)
 * 4. Resources (extraction rates, node availability)
 * 5. Pacing (milestones, idle time, decision frequency)
 */

import { getHighestUnlockedAge, calculateInventoryValue } from './simulator.js';

function safeAvg(values) {
  if (!values || values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function round(value, decimals = 2) {
  if (!Number.isFinite(value)) return 0;
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

function calculateHHI(values) {
  const total = values.reduce((sum, value) => sum + value, 0);
  if (total <= 0) return 0;

  let hhi = 0;
  for (const value of values) {
    const share = value / total;
    hhi += share * share;
  }
  return hhi;
}

function calculateRollingSellConcentration(sellSequence, windowTicks) {
  if (!sellSequence.length) {
    return {
      sampleCount: 0,
      avgUniqueItems: 0,
      minUniqueItems: 0,
      avgConcentrationHHI: 0,
      peakConcentrationHHI: 0,
    };
  }

  const rollingUnitsByItem = new Map();
  let totalWindowUnits = 0;
  let windowStartIndex = 0;

  let sampleCount = 0;
  let uniqueItemTotal = 0;
  let hhiTotal = 0;
  let minUniqueItems = Infinity;
  let peakConcentrationHHI = 0;

  for (let i = 0; i < sellSequence.length; i++) {
    const sale = sellSequence[i];
    rollingUnitsByItem.set(sale.itemId, (rollingUnitsByItem.get(sale.itemId) || 0) + sale.units);
    totalWindowUnits += sale.units;

    while (windowStartIndex <= i && sellSequence[windowStartIndex].tick < (sale.tick - windowTicks + 1)) {
      const leftSale = sellSequence[windowStartIndex];
      const updatedUnits = (rollingUnitsByItem.get(leftSale.itemId) || 0) - leftSale.units;
      if (updatedUnits <= 0) {
        rollingUnitsByItem.delete(leftSale.itemId);
      } else {
        rollingUnitsByItem.set(leftSale.itemId, updatedUnits);
      }
      totalWindowUnits = Math.max(0, totalWindowUnits - leftSale.units);
      windowStartIndex++;
    }

    const uniqueItems = rollingUnitsByItem.size;
    const concentrationHHI = totalWindowUnits > 0
      ? calculateHHI(Array.from(rollingUnitsByItem.values()))
      : 0;

    sampleCount++;
    uniqueItemTotal += uniqueItems;
    hhiTotal += concentrationHHI;
    minUniqueItems = Math.min(minUniqueItems, uniqueItems);
    peakConcentrationHHI = Math.max(peakConcentrationHHI, concentrationHHI);
  }

  return {
    sampleCount,
    avgUniqueItems: sampleCount > 0 ? uniqueItemTotal / sampleCount : 0,
    minUniqueItems: Number.isFinite(minUniqueItems) ? minUniqueItems : 0,
    avgConcentrationHHI: sampleCount > 0 ? hhiTotal / sampleCount : 0,
    peakConcentrationHHI,
  };
}

function calculateSellSwitchingMetrics(marketSales, windowTicks) {
  const sellSequence = marketSales.sellSequence || [];
  if (sellSequence.length === 0) {
    return {
      totalTransitions: 0,
      switchCount: 0,
      switchRatePct: 0,
      switchesPer100SellActions: 0,
      avgSellStreak: 0,
      maxSellStreak: 0,
      avgStreakUnits: 0,
      maxStreakUnits: 0,
      topItemUnitsSharePct: 0,
      topItemRevenueSharePct: 0,
      unitsHHI: 0,
      revenueHHI: 0,
      dominantItemByUnits: null,
      dominantItemByRevenue: null,
      rollingWindow: {
        windowTicks,
        sampleCount: 0,
        avgUniqueItems: 0,
        minUniqueItems: 0,
        avgConcentrationHHI: 0,
        peakConcentrationHHI: 0,
      },
    };
  }

  let switchCount = 0;
  const streaks = [];
  let currentStreak = {
    itemId: sellSequence[0].itemId,
    length: 1,
    units: sellSequence[0].units,
  };

  for (let i = 1; i < sellSequence.length; i++) {
    const previous = sellSequence[i - 1];
    const current = sellSequence[i];

    if (current.itemId !== previous.itemId) {
      switchCount++;
      streaks.push(currentStreak);
      currentStreak = {
        itemId: current.itemId,
        length: 1,
        units: current.units,
      };
      continue;
    }

    currentStreak.length += 1;
    currentStreak.units += current.units;
  }
  streaks.push(currentStreak);

  const totalTransitions = Math.max(0, sellSequence.length - 1);
  const switchRatePct = totalTransitions > 0
    ? (switchCount / totalTransitions) * 100
    : 0;
  const switchesPer100SellActions = sellSequence.length > 0
    ? (switchCount / sellSequence.length) * 100
    : 0;

  const avgSellStreak = safeAvg(streaks.map(streak => streak.length));
  const maxSellStreak = streaks.reduce((max, streak) => Math.max(max, streak.length), 0);
  const avgStreakUnits = safeAvg(streaks.map(streak => streak.units));
  const maxStreakUnits = streaks.reduce((max, streak) => Math.max(max, streak.units), 0);

  const byItemEntries = Object.entries(marketSales.byItem || {});
  const totalUnits = byItemEntries.reduce((sum, [_, item]) => sum + (item.units || 0), 0);
  const totalRevenue = byItemEntries.reduce((sum, [_, item]) => sum + (item.revenue || 0), 0);
  const topUnitsEntry = byItemEntries.reduce((best, entry) => {
    if (!best || (entry[1].units || 0) > (best[1].units || 0)) return entry;
    return best;
  }, null);
  const topRevenueEntry = byItemEntries.reduce((best, entry) => {
    if (!best || (entry[1].revenue || 0) > (best[1].revenue || 0)) return entry;
    return best;
  }, null);

  const topItemUnitsSharePct = totalUnits > 0 && topUnitsEntry
    ? ((topUnitsEntry[1].units || 0) / totalUnits) * 100
    : 0;
  const topItemRevenueSharePct = totalRevenue > 0 && topRevenueEntry
    ? ((topRevenueEntry[1].revenue || 0) / totalRevenue) * 100
    : 0;

  const unitsHHI = calculateHHI(byItemEntries.map(([_, item]) => item.units || 0));
  const revenueHHI = calculateHHI(byItemEntries.map(([_, item]) => item.revenue || 0));
  const rollingWindow = calculateRollingSellConcentration(sellSequence, windowTicks);

  return {
    totalTransitions,
    switchCount,
    switchRatePct,
    switchesPer100SellActions,
    avgSellStreak,
    maxSellStreak,
    avgStreakUnits,
    maxStreakUnits,
    topItemUnitsSharePct,
    topItemRevenueSharePct,
    unitsHHI,
    revenueHHI,
    dominantItemByUnits: topUnitsEntry
      ? {
          itemId: topUnitsEntry[0],
          units: topUnitsEntry[1].units || 0,
        }
      : null,
    dominantItemByRevenue: topRevenueEntry
      ? {
          itemId: topRevenueEntry[0],
          revenue: topRevenueEntry[1].revenue || 0,
        }
      : null,
    rollingWindow: {
      windowTicks,
      ...rollingWindow,
    },
  };
}

function getDiscoveredFinalGoods(state, rules) {
  const discovered = new Set();
  const discoveredRecipes = new Set(state.discoveredRecipes || []);
  const unlockedRecipes = new Set(state.unlockedRecipes || []);
  const materialMap = new Map(rules.materials.map(material => [material.id, material]));

  for (const recipe of rules.recipes) {
    if (!discoveredRecipes.has(recipe.id) && !unlockedRecipes.has(recipe.id)) continue;
    for (const outputId of Object.keys(recipe.outputs || {})) {
      const material = materialMap.get(outputId);
      if (material?.category === 'final') {
        discovered.add(outputId);
      }
    }
  }

  return Array.from(discovered);
}

function getMarketSnapshot(state, rules) {
  const finalGoods = getDiscoveredFinalGoods(state, rules);
  const windowSize = rules.market?.diversificationWindow || 100;
  const marketRecentSales = state.marketRecentSales || [];
  const recentWindowStart = state.tick - windowSize;
  const uniqueRecentSales = new Set(
    marketRecentSales.filter(sale => sale.tick > recentWindowStart).map(sale => sale.itemId)
  ).size;

  if (finalGoods.length === 0) {
    return {
      discoveredFinalGoods: 0,
      avgPopularity: 1.0,
      minPopularity: 1.0,
      saturatedMarkets: 0,
      heavilySaturatedMarkets: 0,
      activeEvents: 0,
      totalDamage: 0,
      avgDemandModifier: 1.0,
      uniqueRecentSales,
    };
  }

  let popularitySum = 0;
  let minPopularity = Infinity;
  let saturatedMarkets = 0;
  let heavilySaturatedMarkets = 0;
  let activeEvents = 0;
  let totalDamage = 0;
  let demandModifierSum = 0;

  for (const itemId of finalGoods) {
    const popularity = state.marketPopularity?.[itemId] ?? 1.0;
    const damage = state.marketDamage?.[itemId] || 0;
    const eventModifier = state.marketEvents?.[itemId]?.modifier || 1.0;

    popularitySum += popularity;
    minPopularity = Math.min(minPopularity, popularity);
    demandModifierSum += popularity * eventModifier;
    totalDamage += damage;

    if (popularity < 1.0) saturatedMarkets++;
    if (popularity <= 0.6) heavilySaturatedMarkets++;
    if (state.marketEvents?.[itemId]) activeEvents++;
  }

  return {
    discoveredFinalGoods: finalGoods.length,
    avgPopularity: popularitySum / finalGoods.length,
    minPopularity,
    saturatedMarkets,
    heavilySaturatedMarkets,
    activeEvents,
    totalDamage,
    avgDemandModifier: demandModifierSum / finalGoods.length,
    uniqueRecentSales,
  };
}

/**
 * Create a new KPI tracker
 * @returns {Object} KPI tracker instance
 */
export function createKPITracker() {
  return {
    // Raw data collection
    snapshots: [],
    events: [],
    actions: [],
    actionCountsByTick: {},
    idleTicks: 0,
    totalTicks: 0,

    // Age progression tracking
    ageUnlockTicks: {},  // { 1: 0, 2: 1523, 3: 4891, ... }
    currentAge: 1,

    // Income tracking
    creditChanges: [],  // { tick, delta }
    incomeWindows: [],  // Aggregated income over windows

    // Bottleneck tracking
    bottlenecks: {},  // { reason: count }

    // Production tracking
    goodsSold: {},  // { itemId: totalQuantity }
    totalCreditsEarned: 0,
    totalCreditsSpent: 0,
    grossCreditsSpentByActions: 0,
    marketSales: {
      totalSellActions: 0,
      totalUnitsSold: 0,
      totalRevenue: 0,
      weightedPopularityBefore: 0,
      weightedPopularityAfter: 0,
      weightedEventModifier: 0,
      salesInSaturatedMarkets: 0,
      damageAdded: 0,
      byItem: {}, // { itemId: { units, revenue, sellActions } }
      sellSequence: [], // [{ tick, itemId, units, revenue }]
      rollingWindowTicks: null,
    },

    // === NEW: Spending breakdown ===
    spendingByCategory: {
      floorExpansion: 0,
      mapExploration: 0,
      nodeUnlock: 0,
      researchDonation: 0,
      inventoryUpgrade: 0,
      other: 0
    },

    // === NEW: Expansion tracking ===
    floorExpansions: [],      // { tick, newArea, cost }
    mapExpansions: [],        // { tick, cost }
    nodeUnlocks: [],          // { tick, resourceType, cost }

    // === NEW: Research tracking ===
    rpSources: {
      creditDonation: 0,
      partDonation: 0,
      prototypeBonus: 0
    },
    experiments: [],          // { tick, age, cost, recipeDiscovered }
    prototypes: {
      started: [],            // { tick, recipeId }
      completed: [],          // { tick, recipeId, ticksToComplete, rpBonus }
    },
    discoveryBoostTicks: 0,   // Total ticks with prototype boost active

    // === NEW: Resource tracking ===
    resourceSnapshots: [],    // { tick, byType: { wood: { available, unlocked, extractionRate } } }

    // === NEW: Milestones ===
    milestones: {
      firstSale: null,
      firstFloorExpansion: null,
      firstNodeUnlock: null,
      firstExperiment: null,
      firstPrototypeComplete: null,
      firstAge2Recipe: null,
      reached1000Credits: null,
      reached10000Credits: null,
    },

    // === NEW: Peak credits (for tracking excess) ===
    peakCredits: 0,
    peakCreditsTick: 0,
  };
}

/**
 * Take a snapshot of current game state
 * @param {Object} tracker - KPI tracker
 * @param {Object} sim - Simulation instance
 */
export function takeSnapshot(tracker, sim) {
  const { state, rules } = sim;
  if (!tracker.marketSales.rollingWindowTicks) {
    const marketWindow = rules.market?.diversificationWindow || 100;
    tracker.marketSales.rollingWindowTicks = Math.max(100, marketWindow * 2);
  }

  const snapshot = {
    tick: sim.currentTick,
    credits: state.credits,
    age: getHighestUnlockedAge(state, rules),
    inventoryValue: calculateInventoryValue(state, rules),
    inventoryItemCount: Object.values(state.inventory).reduce((a, b) => a + (b || 0), 0),
    machineCount: state.machines.length,
    generatorCount: state.generators.length,
    extractionNodeCount: state.extractionNodes.filter(n => n.active).length,
    floorArea: state.floorSpace.width * state.floorSpace.height,
    researchPoints: state.research.researchPoints,
    unlockedRecipes: state.unlockedRecipes.length,
    discoveredRecipes: state.discoveredRecipes.length,
    energy: { ...state.energy },
    market: getMarketSnapshot(state, rules),
  };

  tracker.snapshots.push(snapshot);
  tracker.totalTicks = sim.currentTick;

  // Track peak credits
  if (state.credits > tracker.peakCredits) {
    tracker.peakCredits = state.credits;
    tracker.peakCreditsTick = sim.currentTick;
  }

  // Take resource snapshot (every 500 ticks to reduce data)
  if (sim.currentTick % 500 === 0) {
    takeResourceSnapshot(tracker, sim);
  }
}

/**
 * Take a snapshot of resource node state
 */
function takeResourceSnapshot(tracker, sim) {
  const { state, rules } = sim;
  const byType = {};

  // Count available (visible but not unlocked) nodes from exploration map
  const availableByType = {};
  if (state.explorationMap?.tiles) {
    for (const tile of Object.values(state.explorationMap.tiles)) {
      if (tile.explored && tile.extractionNode && !tile.extractionNode.unlocked) {
        const resType = tile.extractionNode.resourceType;
        availableByType[resType] = (availableByType[resType] || 0) + 1;
      }
    }
  }

  // Count unlocked/active nodes and extraction rates
  const rawMaterials = rules.materials.filter(m => m.category === 'raw');
  for (const mat of rawMaterials) {
    const activeNodes = state.extractionNodes.filter(n => n.active && n.resourceType === mat.id);
    byType[mat.id] = {
      available: availableByType[mat.id] || 0,
      unlocked: activeNodes.length,
      extractionRate: activeNodes.reduce((sum, n) => sum + n.rate, 0)
    };
  }

  tracker.resourceSnapshots.push({
    tick: sim.currentTick,
    byType
  });
}

function getAddedPrototypeRecipes(context) {
  const before = context?.before?.awaitingPrototypeRecipeIds || [];
  const after = context?.after?.awaitingPrototypeRecipeIds || [];
  const beforeSet = new Set(before);
  return after.filter(recipeId => !beforeSet.has(recipeId));
}

function getCompletedPrototypeRecipes(context) {
  const before = context?.before?.awaitingPrototypeRecipeIds || [];
  const after = context?.after?.awaitingPrototypeRecipeIds || [];
  const afterSet = new Set(after);
  return before.filter(recipeId => !afterSet.has(recipeId));
}

/**
 * Record an action taken by the bot
 * @param {Object} tracker - KPI tracker
 * @param {Object} sim - Simulation instance
 * @param {Object} action - Action that was executed
 */
export function recordAction(tracker, sim, action, context = null) {
  const { state, rules } = sim;
  const tick = sim.currentTick;
  const creditsDelta = context?.deltas?.credits || 0;
  const rpDelta = context?.deltas?.researchPoints || 0;
  const creditsSpent = Math.max(0, -creditsDelta);

  tracker.actions.push({
    tick,
    type: action.type,
    payload: action.payload,
    creditsDelta,
    researchPointsDelta: rpDelta,
  });
  tracker.actionCountsByTick[tick] = (tracker.actionCountsByTick[tick] || 0) + 1;
  tracker.grossCreditsSpentByActions += creditsSpent;

  let spendTracked = false;

  // Track specific action types
  switch (action.type) {
    case 'SELL_GOODS': {
      const { itemId, quantity } = action.payload;
      const quantityFromInventory = context?.before?.sell && context?.after?.sell
        ? Math.max(0, context.before.sell.inventory - context.after.sell.inventory)
        : null;
      const soldQty = quantityFromInventory ?? quantity;
      const revenue = Math.max(0, creditsDelta);
      const popularityBefore = context?.before?.sell?.popularity ?? 1.0;
      const popularityAfter = context?.after?.sell?.popularity ?? popularityBefore;
      const eventModifier = context?.before?.sell?.eventModifier || 1.0;
      const damageBefore = context?.before?.sell?.damage || 0;
      const damageAfter = context?.after?.sell?.damage || damageBefore;

      tracker.goodsSold[itemId] = (tracker.goodsSold[itemId] || 0) + soldQty;
      tracker.marketSales.totalSellActions++;
      tracker.marketSales.totalUnitsSold += soldQty;
      tracker.marketSales.totalRevenue += revenue;
      tracker.marketSales.weightedPopularityBefore += popularityBefore * soldQty;
      tracker.marketSales.weightedPopularityAfter += popularityAfter * soldQty;
      tracker.marketSales.weightedEventModifier += eventModifier * soldQty;
      tracker.marketSales.damageAdded += Math.max(0, damageAfter - damageBefore);
      if (popularityBefore < 1.0) {
        tracker.marketSales.salesInSaturatedMarkets++;
      }

      if (!tracker.marketSales.byItem[itemId]) {
        tracker.marketSales.byItem[itemId] = { units: 0, revenue: 0, sellActions: 0 };
      }
      tracker.marketSales.byItem[itemId].units += soldQty;
      tracker.marketSales.byItem[itemId].revenue += revenue;
      tracker.marketSales.byItem[itemId].sellActions++;
      tracker.marketSales.sellSequence.push({
        tick,
        itemId,
        units: soldQty,
        revenue,
      });

      // Milestone: first sale
      if (tracker.milestones.firstSale === null) {
        tracker.milestones.firstSale = tick;
      }
      break;
    }

    case 'BUY_FLOOR_SPACE': {
      const cost = creditsSpent;
      tracker.spendingByCategory.floorExpansion += cost;
      tracker.floorExpansions.push({
        tick,
        newArea: state.floorSpace.width * state.floorSpace.height,
        cost
      });
      spendTracked = true;

      // Milestone
      if (tracker.milestones.firstFloorExpansion === null) {
        tracker.milestones.firstFloorExpansion = tick;
      }
      break;
    }

    case 'EXPAND_EXPLORATION': {
      const cost = creditsSpent;
      tracker.spendingByCategory.mapExploration += cost;
      tracker.mapExpansions.push({
        tick,
        cost,
        areaAdded: context?.deltas?.exploredArea || 0,
      });
      spendTracked = true;
      break;
    }

    case 'UNLOCK_EXPLORATION_NODE': {
      const cost = creditsSpent;
      const resourceType = context?.nodeResourceType || 'unknown';

      tracker.spendingByCategory.nodeUnlock += cost;
      tracker.nodeUnlocks.push({ tick, resourceType, cost });
      spendTracked = true;

      // Milestone
      if (tracker.milestones.firstNodeUnlock === null) {
        tracker.milestones.firstNodeUnlock = tick;
      }
      break;
    }

    case 'DONATE_CREDITS': {
      const cost = creditsSpent;
      tracker.spendingByCategory.researchDonation += cost;
      const rpGained = Math.max(0, rpDelta);
      tracker.rpSources.creditDonation += rpGained;
      spendTracked = true;
      break;
    }

    case 'DONATE_PARTS': {
      const { itemId, quantity } = action.payload;
      const material = rules.materials.find(m => m.id === itemId);
      const fallbackRPGained = material
        ? Math.floor(material.basePrice * (rules.research.ageMultipliers?.[material.age || 1] || 1) * quantity)
        : 0;
      const rpGained = Math.max(0, rpDelta || fallbackRPGained);
      tracker.rpSources.partDonation += rpGained;
      break;
    }

    case 'RUN_EXPERIMENT': {
      const { age } = action.payload;
      const cost = Math.max(0, -rpDelta);
      const recipeDiscovered = (context?.deltas?.discoveredRecipes || 0) > 0;
      tracker.experiments.push({ tick, age, cost, recipeDiscovered });

      if (tracker.milestones.firstExperiment === null) {
        tracker.milestones.firstExperiment = tick;
      }
      for (const recipeId of getAddedPrototypeRecipes(context)) {
        recordPrototypeStarted(tracker, sim, recipeId);
      }
      break;
    }

    case 'RUN_TARGETED_EXPERIMENT': {
      const cost = Math.max(0, -rpDelta);
      tracker.experiments.push({
        tick,
        age: getHighestUnlockedAge(state, rules),
        cost,
        recipeDiscovered: (context?.deltas?.discoveredRecipes || 0) > 0,
      });

      if (tracker.milestones.firstExperiment === null) {
        tracker.milestones.firstExperiment = tick;
      }
      for (const recipeId of getAddedPrototypeRecipes(context)) {
        recordPrototypeStarted(tracker, sim, recipeId);
      }
      break;
    }

    case 'FILL_PROTOTYPE_SLOT': {
      const completedRecipes = getCompletedPrototypeRecipes(context);
      const rpBonus = Math.max(0, rpDelta);
      const bonusPerRecipe = completedRecipes.length > 0
        ? Math.floor(rpBonus / completedRecipes.length)
        : rpBonus;

      for (const recipeId of completedRecipes) {
        recordPrototypeCompleted(tracker, sim, recipeId, bonusPerRecipe);
      }
      break;
    }

    case 'BUY_INVENTORY_SPACE': {
      const cost = creditsSpent;
      tracker.spendingByCategory.inventoryUpgrade += cost;
      spendTracked = true;
      break;
    }
  }

  if (!spendTracked && creditsSpent > 0) {
    tracker.spendingByCategory.other += creditsSpent;
  }
}

/**
 * Record prototype events
 */
export function recordPrototypeStarted(tracker, sim, recipeId) {
  tracker.prototypes.started.push({
    tick: sim.currentTick,
    recipeId
  });
}

export function recordPrototypeCompleted(tracker, sim, recipeId, rpBonus) {
  const started = tracker.prototypes.started.find(p => p.recipeId === recipeId);
  const ticksToComplete = started ? sim.currentTick - started.tick : 0;

  tracker.prototypes.completed.push({
    tick: sim.currentTick,
    recipeId,
    ticksToComplete,
    rpBonus
  });

  tracker.rpSources.prototypeBonus += rpBonus;

  if (tracker.milestones.firstPrototypeComplete === null) {
    tracker.milestones.firstPrototypeComplete = sim.currentTick;
  }
}

/**
 * Record an idle tick (no actions possible)
 * @param {Object} tracker - KPI tracker
 * @param {Object} sim - Simulation instance
 */
export function recordIdleTick(tracker, sim) {
  tracker.idleTicks++;
}

/**
 * Record per-tick KPI signals that should not depend on snapshot cadence
 * @param {Object} tracker - KPI tracker
 * @param {Object} sim - Simulation instance
 */
export function recordTick(tracker, sim) {
  const prototypeBoost = sim.state.research?.prototypeBoost;
  if (prototypeBoost?.ticksRemaining > 0) {
    tracker.discoveryBoostTicks++;
  }
}

/**
 * Check for age progression events
 * @param {Object} tracker - KPI tracker
 * @param {Object} sim - Simulation instance
 */
export function checkAgeProgression(tracker, sim) {
  const { state, rules } = sim;
  const age = getHighestUnlockedAge(state, rules);

  if (age > tracker.currentAge) {
    // Record age unlock
    tracker.ageUnlockTicks[age] = sim.currentTick;
    tracker.events.push({
      tick: sim.currentTick,
      type: 'age_unlocked',
      age,
    });
    tracker.currentAge = age;

    // Milestone: first age 2 recipe
    if (age >= 2 && tracker.milestones.firstAge2Recipe === null) {
      tracker.milestones.firstAge2Recipe = sim.currentTick;
    }
  }
}

/**
 * Record credit change
 * @param {Object} tracker - KPI tracker
 * @param {Object} sim - Simulation instance
 * @param {number} delta - Credit change amount
 */
export function recordCreditChange(tracker, sim, delta) {
  tracker.creditChanges.push({
    tick: sim.currentTick,
    delta,
  });

  if (delta > 0) {
    tracker.totalCreditsEarned += delta;
  } else {
    tracker.totalCreditsSpent += Math.abs(delta);
  }

  // Credit milestones
  const currentCredits = sim.state.credits;
  if (currentCredits >= 1000 && tracker.milestones.reached1000Credits === null) {
    tracker.milestones.reached1000Credits = sim.currentTick;
  }
  if (currentCredits >= 10000 && tracker.milestones.reached10000Credits === null) {
    tracker.milestones.reached10000Credits = sim.currentTick;
  }
}

/**
 * Record a bottleneck event
 * @param {Object} tracker - KPI tracker
 * @param {string} reason - What caused the bottleneck
 */
export function recordBottleneck(tracker, reason) {
  tracker.bottlenecks[reason] = (tracker.bottlenecks[reason] || 0) + 1;
}

/**
 * Calculate summary statistics
 * @param {Object} tracker - KPI tracker
 * @returns {Object} Summary statistics
 */
export function calculateSummary(tracker) {
  const totalTicks = tracker.totalTicks || 1;

  // Income rate calculation
  const windowSize = 100;
  const incomeByWindow = [];

  for (let i = 0; i < tracker.creditChanges.length; i++) {
    const change = tracker.creditChanges[i];
    const windowIndex = Math.floor(change.tick / windowSize);

    while (incomeByWindow.length <= windowIndex) {
      incomeByWindow.push(0);
    }

    if (change.delta > 0) {
      incomeByWindow[windowIndex] += change.delta;
    }
  }

  const avgIncomeRate = incomeByWindow.length > 0
    ? incomeByWindow.reduce((a, b) => a + b, 0) / incomeByWindow.length / windowSize
    : 0;

  const peakIncome = incomeByWindow.length > 0
    ? Math.max(...incomeByWindow)
    : 0;

  const peakIncomeWindow = incomeByWindow.indexOf(peakIncome);

  // Decision interval (average ticks between actions)
  const actionCount = tracker.actions.length;
  const decisionInterval = actionCount > 0 ? totalTicks / actionCount : totalTicks;
  const actionCounts = Object.values(tracker.actionCountsByTick);
  const actionTicks = actionCounts.length;
  const avgActionsPerActionTick = actionTicks > 0 ? actionCount / actionTicks : 0;
  const maxActionsInSingleTick = actionCounts.length > 0 ? Math.max(...actionCounts) : 0;

  // Idle ratio
  const idleRatio = totalTicks > 0 ? tracker.idleTicks / totalTicks : 0;

  // Bottleneck analysis
  const totalBottlenecks = Object.values(tracker.bottlenecks).reduce((a, b) => a + b, 0);
  const bottleneckPercentages = {};
  for (const [reason, count] of Object.entries(tracker.bottlenecks)) {
    bottleneckPercentages[reason] = totalBottlenecks > 0
      ? Math.round(count / totalBottlenecks * 100)
      : 0;
  }

  // Age progression times
  const ageProgressionTimes = {};
  let prevTick = 0;
  for (let age = 1; age <= 7; age++) {
    if (tracker.ageUnlockTicks[age] !== undefined) {
      ageProgressionTimes[`age${age}`] = tracker.ageUnlockTicks[age] - prevTick;
      prevTick = tracker.ageUnlockTicks[age];
    }
  }

  // Final state from last snapshot
  const lastSnapshot = tracker.snapshots[tracker.snapshots.length - 1] || {};

  // === NEW: Calculate spending analysis ===
  const totalSpent = Object.values(tracker.spendingByCategory).reduce((a, b) => a + b, 0);
  const actionSpendBase = tracker.grossCreditsSpentByActions;
  const totalUntrackedSpend = Math.max(0, actionSpendBase - totalSpent);
  const spendingCoverage = actionSpendBase > 0
    ? Math.round((totalSpent / actionSpendBase) * 1000) / 10
    : 100;
  const spendingPercentages = {};
  for (const [category, amount] of Object.entries(tracker.spendingByCategory)) {
    spendingPercentages[category] = totalSpent > 0
      ? Math.round(amount / totalSpent * 1000) / 10  // One decimal place percentage
      : 0;
  }

  // === NEW: Calculate expansion rates ===
  const floorExpansionCount = tracker.floorExpansions.length;
  const avgFloorExpansionInterval = floorExpansionCount > 1
    ? (tracker.floorExpansions[floorExpansionCount - 1].tick - tracker.floorExpansions[0].tick) / (floorExpansionCount - 1)
    : null;

  const nodeUnlockCount = tracker.nodeUnlocks.length;
  const avgNodeUnlockInterval = nodeUnlockCount > 1
    ? (tracker.nodeUnlocks[nodeUnlockCount - 1].tick - tracker.nodeUnlocks[0].tick) / (nodeUnlockCount - 1)
    : null;
  const avgMapExpansionArea = tracker.mapExpansions.length > 0
    ? safeAvg(tracker.mapExpansions.map(expansion => expansion.areaAdded || 0))
    : null;

  // Node unlocks by resource type
  const nodeUnlocksByType = {};
  for (const unlock of tracker.nodeUnlocks) {
    nodeUnlocksByType[unlock.resourceType] = (nodeUnlocksByType[unlock.resourceType] || 0) + 1;
  }

  // === NEW: Calculate research analysis ===
  const totalRPEarned = tracker.rpSources.creditDonation +
                        tracker.rpSources.partDonation +
                        tracker.rpSources.prototypeBonus;

  const rpSourcePercentages = {};
  for (const [source, amount] of Object.entries(tracker.rpSources)) {
    rpSourcePercentages[source] = totalRPEarned > 0
      ? Math.round(amount / totalRPEarned * 1000) / 10
      : 0;
  }

  const prototypeCount = tracker.prototypes.completed.length;
  const avgPrototypeTime = prototypeCount > 0
    ? tracker.prototypes.completed.reduce((sum, p) => sum + p.ticksToComplete, 0) / prototypeCount
    : null;

  const discoveryBoostRatio = totalTicks > 0
    ? Math.round(tracker.discoveryBoostTicks / totalTicks * 1000) / 10
    : 0;

  // === NEW: Market health and market sell analytics ===
  const marketSnapshots = tracker.snapshots
    .map(snapshot => snapshot.market)
    .filter(Boolean);
  const marketCurrent = lastSnapshot.market || {
    discoveredFinalGoods: 0,
    avgPopularity: 1.0,
    minPopularity: 1.0,
    saturatedMarkets: 0,
    heavilySaturatedMarkets: 0,
    activeEvents: 0,
    totalDamage: 0,
    avgDemandModifier: 1.0,
    uniqueRecentSales: 0,
  };
  const avgMarketPopularity = safeAvg(marketSnapshots.map(s => s.avgPopularity));
  const avgSaturatedMarkets = safeAvg(marketSnapshots.map(s => s.saturatedMarkets));
  const peakSaturatedMarkets = marketSnapshots.length > 0
    ? Math.max(...marketSnapshots.map(s => s.saturatedMarkets))
    : 0;
  const timeWithAnySaturation = marketSnapshots.length > 0
    ? Math.round((marketSnapshots.filter(s => s.saturatedMarkets > 0).length / marketSnapshots.length) * 1000) / 10
    : 0;
  const avgUniqueRecentSales = safeAvg(marketSnapshots.map(s => s.uniqueRecentSales));

  const marketSales = tracker.marketSales;
  const avgSalePricePerUnit = marketSales.totalUnitsSold > 0
    ? marketSales.totalRevenue / marketSales.totalUnitsSold
    : 0;
  const avgPopularityBeforeSale = marketSales.totalUnitsSold > 0
    ? marketSales.weightedPopularityBefore / marketSales.totalUnitsSold
    : 1.0;
  const avgPopularityAfterSale = marketSales.totalUnitsSold > 0
    ? marketSales.weightedPopularityAfter / marketSales.totalUnitsSold
    : 1.0;
  const avgEventModifierOnSales = marketSales.totalUnitsSold > 0
    ? marketSales.weightedEventModifier / marketSales.totalUnitsSold
    : 1.0;
  const salesInSaturatedMarketsPct = marketSales.totalSellActions > 0
    ? (marketSales.salesInSaturatedMarkets / marketSales.totalSellActions) * 100
    : 0;
  const marketSwitching = calculateSellSwitchingMetrics(
    marketSales,
    marketSales.rollingWindowTicks || 200
  );
  const topRevenueItems = Object.entries(marketSales.byItem)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 5)
    .map(([itemId, data]) => ({
      itemId,
      revenue: data.revenue,
      units: data.units,
      avgPricePerUnit: data.units > 0 ? data.revenue / data.units : 0,
    }));

  // === NEW: Resource analysis from last snapshot ===
  const lastResourceSnapshot = tracker.resourceSnapshots[tracker.resourceSnapshots.length - 1];
  const resourceSummary = lastResourceSnapshot?.byType || {};

  // Calculate total extraction rate
  let totalExtractionRate = 0;
  for (const data of Object.values(resourceSummary)) {
    totalExtractionRate += data.extractionRate || 0;
  }

  // === NEW: Cost per recipe unlocked ===
  const recipesUnlocked = lastSnapshot.unlockedRecipes || 0;
  const creditsPerRecipe = recipesUnlocked > 0
    ? Math.round(tracker.spendingByCategory.researchDonation / recipesUnlocked)
    : 0;

  return {
    // General
    totalTicks,
    finalCredits: lastSnapshot.credits || 0,
    agesReached: tracker.currentAge,

    // Income
    avgIncomeRate: Math.round(avgIncomeRate * 100) / 100,
    peakIncome,
    peakIncomeTick: peakIncomeWindow * windowSize,
    totalCreditsEarned: tracker.totalCreditsEarned,
    totalCreditsSpent: tracker.totalCreditsSpent,
    peakCredits: tracker.peakCredits,
    peakCreditsTick: tracker.peakCreditsTick,

    // Pacing
    decisionInterval: Math.round(decisionInterval * 10) / 10,
    idleRatio: Math.round(idleRatio * 1000) / 10, // As percentage
    totalActions: actionCount,
    actionDensity: {
      actionTicks,
      avgActionsPerActionTick: Math.round(avgActionsPerActionTick * 100) / 100,
      maxActionsInSingleTick,
    },

    // Progression
    ageUnlockTicks: tracker.ageUnlockTicks,
    ageProgressionTimes,

    // Bottlenecks
    bottlenecks: bottleneckPercentages,

    // Production
    goodsSold: tracker.goodsSold,
    uniqueItemsSold: Object.keys(tracker.goodsSold).length,

    // Final state
    finalState: {
      machines: lastSnapshot.machineCount || 0,
      generators: lastSnapshot.generatorCount || 0,
      floorArea: lastSnapshot.floorArea || 0,
      extractionNodes: lastSnapshot.extractionNodeCount || 0,
      unlockedRecipes: lastSnapshot.unlockedRecipes || 0,
    },

    // === NEW SECTIONS ===

    // Spending breakdown
    spending: {
      byCategory: tracker.spendingByCategory,
      percentages: spendingPercentages,
      total: totalSpent,
      coveragePct: spendingCoverage,
      untracked: totalUntrackedSpend,
    },

    // Expansion metrics
    expansion: {
      floorExpansions: floorExpansionCount,
      avgFloorExpansionInterval: avgFloorExpansionInterval ? Math.round(avgFloorExpansionInterval) : null,
      nodeUnlocks: nodeUnlockCount,
      avgNodeUnlockInterval: avgNodeUnlockInterval ? Math.round(avgNodeUnlockInterval) : null,
      nodeUnlocksByType,
      mapExpansions: tracker.mapExpansions.length,
      avgMapExpansionArea: avgMapExpansionArea ? Math.round(avgMapExpansionArea) : null,
    },

    // Research metrics
    research: {
      rpSources: tracker.rpSources,
      rpSourcePercentages,
      totalRPEarned,
      experimentsRun: tracker.experiments.length,
      prototypesCompleted: prototypeCount,
      avgPrototypeTime: avgPrototypeTime ? Math.round(avgPrototypeTime) : null,
      discoveryBoostRatio,
      creditsPerRecipe,
    },

    // Resource metrics
    resources: {
      finalState: resourceSummary,
      totalExtractionRate,
    },

    // Market metrics
    market: {
      current: {
        discoveredFinalGoods: marketCurrent?.discoveredFinalGoods || 0,
        avgPopularity: Math.round((marketCurrent?.avgPopularity || 0) * 1000) / 1000,
        minPopularity: Math.round((marketCurrent?.minPopularity || 0) * 1000) / 1000,
        saturatedMarkets: marketCurrent?.saturatedMarkets || 0,
        heavilySaturatedMarkets: marketCurrent?.heavilySaturatedMarkets || 0,
        activeEvents: marketCurrent?.activeEvents || 0,
        totalDamage: marketCurrent?.totalDamage || 0,
        avgDemandModifier: Math.round((marketCurrent?.avgDemandModifier || 0) * 1000) / 1000,
        uniqueRecentSales: marketCurrent?.uniqueRecentSales || 0,
      },
      trend: {
        avgPopularity: Math.round(avgMarketPopularity * 1000) / 1000,
        avgSaturatedMarkets: Math.round(avgSaturatedMarkets * 100) / 100,
        peakSaturatedMarkets,
        timeWithAnySaturation,
        avgUniqueRecentSales: Math.round(avgUniqueRecentSales * 100) / 100,
      },
      sales: {
        totalSellActions: marketSales.totalSellActions,
        totalUnitsSold: marketSales.totalUnitsSold,
        totalRevenue: marketSales.totalRevenue,
        avgSalePricePerUnit: Math.round(avgSalePricePerUnit * 100) / 100,
        avgPopularityBeforeSale: Math.round(avgPopularityBeforeSale * 1000) / 1000,
        avgPopularityAfterSale: Math.round(avgPopularityAfterSale * 1000) / 1000,
        avgEventModifierOnSales: Math.round(avgEventModifierOnSales * 1000) / 1000,
        salesInSaturatedMarketsPct: Math.round(salesInSaturatedMarketsPct * 10) / 10,
        totalDamageAdded: marketSales.damageAdded,
        topRevenueItems,
      },
      switching: {
        totalTransitions: marketSwitching.totalTransitions,
        switchCount: marketSwitching.switchCount,
        switchRatePct: round(marketSwitching.switchRatePct, 1),
        switchesPer100SellActions: round(marketSwitching.switchesPer100SellActions, 1),
        avgSellStreak: round(marketSwitching.avgSellStreak, 2),
        maxSellStreak: marketSwitching.maxSellStreak,
        avgStreakUnits: round(marketSwitching.avgStreakUnits, 2),
        maxStreakUnits: marketSwitching.maxStreakUnits,
        topItemUnitsSharePct: round(marketSwitching.topItemUnitsSharePct, 1),
        topItemRevenueSharePct: round(marketSwitching.topItemRevenueSharePct, 1),
        unitsHHI: round(marketSwitching.unitsHHI, 3),
        revenueHHI: round(marketSwitching.revenueHHI, 3),
        dominantItemByUnits: marketSwitching.dominantItemByUnits,
        dominantItemByRevenue: marketSwitching.dominantItemByRevenue,
        rollingWindow: {
          windowTicks: marketSwitching.rollingWindow.windowTicks,
          sampleCount: marketSwitching.rollingWindow.sampleCount,
          avgUniqueItems: round(marketSwitching.rollingWindow.avgUniqueItems, 2),
          minUniqueItems: marketSwitching.rollingWindow.minUniqueItems,
          avgConcentrationHHI: round(marketSwitching.rollingWindow.avgConcentrationHHI, 3),
          peakConcentrationHHI: round(marketSwitching.rollingWindow.peakConcentrationHHI, 3),
        },
      },
    },

    // Milestones
    milestones: tracker.milestones,
  };
}

/**
 * Create a tracker with bound methods for easier use
 * @returns {Object} Tracker with methods
 */
export function createTracker() {
  const tracker = createKPITracker();

  return {
    data: tracker,
    takeSnapshot: (sim) => takeSnapshot(tracker, sim),
    recordAction: (sim, action, context) => recordAction(tracker, sim, action, context),
    recordIdleTick: (sim) => recordIdleTick(tracker, sim),
    recordTick: (sim) => recordTick(tracker, sim),
    checkAgeProgression: (sim) => checkAgeProgression(tracker, sim),
    recordCreditChange: (sim, delta) => recordCreditChange(tracker, sim, delta),
    recordBottleneck: (reason) => recordBottleneck(tracker, reason),
    recordPrototypeStarted: (sim, recipeId) => recordPrototypeStarted(tracker, sim, recipeId),
    recordPrototypeCompleted: (sim, recipeId, rpBonus) => recordPrototypeCompleted(tracker, sim, recipeId, rpBonus),
    getSummary: () => calculateSummary(tracker),
    getSnapshots: () => tracker.snapshots,
    getEvents: () => tracker.events,
  };
}
