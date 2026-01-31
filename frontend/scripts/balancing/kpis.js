/**
 * KPI Tracker
 * Collects and calculates game balance metrics during simulation
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
}

/**
 * Record an action taken by the bot
 * @param {Object} tracker - KPI tracker
 * @param {Object} sim - Simulation instance
 * @param {Object} action - Action that was executed
 */
export function recordAction(tracker, sim, action) {
  tracker.actions.push({
    tick: sim.currentTick,
    type: action.type,
    payload: action.payload,
  });

  // Track specific action types
  if (action.type === 'SELL_GOODS') {
    const { itemId, quantity } = action.payload;
    tracker.goodsSold[itemId] = (tracker.goodsSold[itemId] || 0) + quantity;
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
    getSummary: () => calculateSummary(tracker),
    getSnapshots: () => tracker.snapshots,
    getEvents: () => tracker.events,
  };
}
