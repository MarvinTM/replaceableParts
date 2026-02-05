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
  };

  tracker.snapshots.push(snapshot);
  tracker.totalTicks = sim.currentTick;

  // Track peak credits
  if (state.credits > tracker.peakCredits) {
    tracker.peakCredits = state.credits;
    tracker.peakCreditsTick = sim.currentTick;
  }

  // Track discovery boost
  if (state.research.prototypeBoost && state.research.prototypeBoost > 0) {
    tracker.discoveryBoostTicks++;
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

/**
 * Record an action taken by the bot
 * @param {Object} tracker - KPI tracker
 * @param {Object} sim - Simulation instance
 * @param {Object} action - Action that was executed
 */
export function recordAction(tracker, sim, action) {
  const { state, rules } = sim;
  const tick = sim.currentTick;

  tracker.actions.push({
    tick,
    type: action.type,
    payload: action.payload,
  });

  // Track specific action types
  switch (action.type) {
    case 'SELL_GOODS': {
      const { itemId, quantity } = action.payload;
      tracker.goodsSold[itemId] = (tracker.goodsSold[itemId] || 0) + quantity;

      // Milestone: first sale
      if (tracker.milestones.firstSale === null) {
        tracker.milestones.firstSale = tick;
      }
      break;
    }

    case 'BUY_FLOOR_SPACE': {
      const cost = rules.floorSpace.costPerCell *
        (rules.floorSpace.chunkWidth || 4) *
        (rules.floorSpace.chunkHeight || 4);
      tracker.spendingByCategory.floorExpansion += cost;
      tracker.floorExpansions.push({
        tick,
        newArea: state.floorSpace.width * state.floorSpace.height,
        cost
      });

      // Milestone
      if (tracker.milestones.firstFloorExpansion === null) {
        tracker.milestones.firstFloorExpansion = tick;
      }
      break;
    }

    case 'EXPAND_EXPLORATION': {
      const cost = rules.exploration.baseCostPerCell * 16; // Assume 4x4 chunk
      tracker.spendingByCategory.mapExploration += cost;
      tracker.mapExpansions.push({ tick, cost });
      break;
    }

    case 'UNLOCK_EXPLORATION_NODE': {
      const { x, y } = action.payload;
      const tile = state.explorationMap?.tiles[`${x},${y}`];
      const resourceType = tile?.extractionNode?.resourceType || 'unknown';

      // Estimate cost with both per-resource and global scaling
      // Note: State has already been updated, so counts are current (post-unlock)
      const sameResourceCount = state.extractionNodes.filter(n => n.resourceType === resourceType).length - 1;
      const totalNodes = state.extractionNodes.length - 1;
      const resourceScaleFactor = rules.exploration.unlockScaleFactors?.[resourceType] || 1.2;
      const globalScaleFactor = rules.exploration.globalNodeScaleFactor || 1.0;
      const cost = Math.floor(
        rules.exploration.nodeUnlockCost *
        Math.pow(resourceScaleFactor, Math.max(0, sameResourceCount)) *
        Math.pow(globalScaleFactor, Math.max(0, totalNodes))
      );

      tracker.spendingByCategory.nodeUnlock += cost;
      tracker.nodeUnlocks.push({ tick, resourceType, cost });

      // Milestone
      if (tracker.milestones.firstNodeUnlock === null) {
        tracker.milestones.firstNodeUnlock = tick;
      }
      break;
    }

    case 'DONATE_CREDITS': {
      const { amount } = action.payload;
      tracker.spendingByCategory.researchDonation += amount;
      const rpGained = Math.floor(amount / rules.research.creditsToRPRatio);
      tracker.rpSources.creditDonation += rpGained;
      break;
    }

    case 'DONATE_PARTS': {
      const { itemId, quantity } = action.payload;
      const material = rules.materials.find(m => m.id === itemId);
      if (material) {
        const age = material.age || 1;
        const multiplier = rules.research.ageMultipliers?.[age] || 1;
        const rpGained = Math.floor(material.basePrice * multiplier * quantity);
        tracker.rpSources.partDonation += rpGained;
      }
      break;
    }

    case 'RUN_EXPERIMENT': {
      const { age } = action.payload;
      const cost = rules.research.experimentCosts[age] || 100;
      tracker.experiments.push({ tick, age, cost, recipeDiscovered: null });

      if (tracker.milestones.firstExperiment === null) {
        tracker.milestones.firstExperiment = tick;
      }
      break;
    }

    case 'BUY_INVENTORY_SPACE': {
      const level = state.inventorySpace / (rules.inventorySpace?.upgradeAmount || 50);
      const cost = Math.floor(
        (rules.inventorySpace?.baseCost || 50) *
        Math.pow(rules.inventorySpace?.costGrowth || 1.5, level)
      );
      tracker.spendingByCategory.inventoryUpgrade += cost;
      break;
    }
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
    },

    // Expansion metrics
    expansion: {
      floorExpansions: floorExpansionCount,
      avgFloorExpansionInterval: avgFloorExpansionInterval ? Math.round(avgFloorExpansionInterval) : null,
      nodeUnlocks: nodeUnlockCount,
      avgNodeUnlockInterval: avgNodeUnlockInterval ? Math.round(avgNodeUnlockInterval) : null,
      nodeUnlocksByType,
      mapExpansions: tracker.mapExpansions.length,
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
    recordAction: (sim, action) => recordAction(tracker, sim, action),
    recordIdleTick: (sim) => recordIdleTick(tracker, sim),
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
