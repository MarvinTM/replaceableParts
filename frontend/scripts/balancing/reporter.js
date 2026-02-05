/**
 * Reporter
 * Generates output in multiple formats from simulation results
 */

import { writeFileSync } from 'fs';

/**
 * Generate a text summary report
 * @param {Object} summary - Summary from KPI tracker
 * @param {Object} config - Simulation config
 * @returns {string} Formatted text report
 */
export function generateTextReport(summary, config = {}) {
  const lines = [];

  lines.push('='.repeat(60));
  lines.push('SIMULATION SUMMARY');
  lines.push('='.repeat(60));
  lines.push('');
  lines.push(`Seed: ${config.seed || 'unknown'} | Ticks: ${summary.totalTicks} | Strategy: ${config.strategy || 'balanced'}`);
  lines.push('');

  // Progression
  lines.push('-'.repeat(40));
  lines.push('PROGRESSION');
  lines.push('-'.repeat(40));
  lines.push(`  Final Age Reached: ${summary.agesReached}`);

  for (let age = 2; age <= 7; age++) {
    const ticks = summary.ageUnlockTicks[age];
    if (ticks !== undefined) {
      const time = summary.ageProgressionTimes[`age${age}`] || ticks;
      lines.push(`  Age ${age - 1} → ${age}: ${ticks.toLocaleString()} ticks (${time.toLocaleString()} since prev)`);
    } else if (age <= summary.agesReached + 1) {
      lines.push(`  Age ${age - 1} → ${age}: Not reached`);
    }
  }
  lines.push('');

  // Economy
  lines.push('-'.repeat(40));
  lines.push('ECONOMY');
  lines.push('-'.repeat(40));
  lines.push(`  Final Credits: ${summary.finalCredits.toLocaleString()}`);
  lines.push(`  Total Earned: ${summary.totalCreditsEarned.toLocaleString()}`);
  lines.push(`  Total Spent: ${summary.totalCreditsSpent.toLocaleString()}`);
  lines.push(`  Net: ${(summary.totalCreditsEarned - summary.totalCreditsSpent).toLocaleString()}`);
  lines.push(`  Avg Income Rate: ${summary.avgIncomeRate} credits/tick`);
  lines.push(`  Peak Income: ${summary.peakIncome.toLocaleString()} credits (window at tick ${summary.peakIncomeTick})`);
  if (summary.peakCredits) {
    lines.push(`  Peak Credits Held: ${summary.peakCredits.toLocaleString()} (at tick ${summary.peakCreditsTick})`);
  }
  lines.push('');

  // Spending Breakdown (NEW)
  if (summary.spending) {
    lines.push('-'.repeat(40));
    lines.push('SPENDING BREAKDOWN');
    lines.push('-'.repeat(40));
    lines.push(`  Total Tracked Spending: ${summary.spending.total.toLocaleString()}`);
    if (typeof summary.spending.coveragePct === 'number') {
      lines.push(`  Coverage of Action Credit Outflow: ${summary.spending.coveragePct}%`);
    }
    if (summary.spending.untracked > 0) {
      lines.push(`  Untracked Spending: ${summary.spending.untracked.toLocaleString()}`);
    }
    const categories = [
      ['nodeUnlock', 'Node Unlocks'],
      ['researchDonation', 'Research (credits)'],
      ['floorExpansion', 'Floor Expansion'],
      ['mapExploration', 'Map Exploration'],
      ['inventoryUpgrade', 'Inventory Upgrades'],
    ];
    for (const [key, label] of categories) {
      const amount = summary.spending.byCategory[key] || 0;
      const pct = summary.spending.percentages[key] || 0;
      if (amount > 0) {
        lines.push(`  ${label}: ${amount.toLocaleString()} (${pct}%)`);
      }
    }
    lines.push('');
  }

  // Expansion Metrics (NEW)
  if (summary.expansion) {
    lines.push('-'.repeat(40));
    lines.push('EXPANSION');
    lines.push('-'.repeat(40));
    lines.push(`  Floor Expansions: ${summary.expansion.floorExpansions}`);
    if (summary.expansion.avgFloorExpansionInterval) {
      lines.push(`  Avg Floor Expansion Interval: ${summary.expansion.avgFloorExpansionInterval} ticks`);
    }
    lines.push(`  Map Expansions: ${summary.expansion.mapExpansions}`);
    lines.push(`  Node Unlocks: ${summary.expansion.nodeUnlocks}`);
    if (summary.expansion.avgNodeUnlockInterval) {
      lines.push(`  Avg Node Unlock Interval: ${summary.expansion.avgNodeUnlockInterval} ticks`);
    }
    if (summary.expansion.avgMapExpansionArea) {
      lines.push(`  Avg Map Expansion Area: ${summary.expansion.avgMapExpansionArea} cells`);
    }

    // Node unlocks by type
    const nodesByType = summary.expansion.nodeUnlocksByType || {};
    if (Object.keys(nodesByType).length > 0) {
      lines.push('  Nodes by Resource Type:');
      const sorted = Object.entries(nodesByType).sort((a, b) => b[1] - a[1]);
      for (const [type, count] of sorted.slice(0, 8)) {
        lines.push(`    ${type}: ${count}`);
      }
    }
    lines.push('');
  }

  // Research Metrics (NEW)
  if (summary.research) {
    lines.push('-'.repeat(40));
    lines.push('RESEARCH');
    lines.push('-'.repeat(40));
    lines.push(`  Total RP Earned: ${summary.research.totalRPEarned.toLocaleString()}`);
    lines.push(`  RP Sources:`);
    lines.push(`    From Credit Donation: ${summary.research.rpSources.creditDonation.toLocaleString()} (${summary.research.rpSourcePercentages.creditDonation}%)`);
    lines.push(`    From Part Donation: ${summary.research.rpSources.partDonation.toLocaleString()} (${summary.research.rpSourcePercentages.partDonation}%)`);
    lines.push(`    From Prototype Bonus: ${summary.research.rpSources.prototypeBonus.toLocaleString()} (${summary.research.rpSourcePercentages.prototypeBonus}%)`);
    lines.push(`  Experiments Run: ${summary.research.experimentsRun}`);
    lines.push(`  Prototypes Completed: ${summary.research.prototypesCompleted}`);
    if (summary.research.avgPrototypeTime) {
      lines.push(`  Avg Prototype Completion: ${summary.research.avgPrototypeTime} ticks`);
    }
    lines.push(`  Discovery Boost Active: ${summary.research.discoveryBoostRatio}% of time`);
    if (summary.research.creditsPerRecipe > 0) {
      lines.push(`  Credits Spent Per Recipe: ${summary.research.creditsPerRecipe.toLocaleString()}`);
    }
    lines.push('');
  }

  // Resources (NEW)
  if (summary.resources && Object.keys(summary.resources.finalState || {}).length > 0) {
    lines.push('-'.repeat(40));
    lines.push('RESOURCES (Final State)');
    lines.push('-'.repeat(40));
    lines.push(`  Total Extraction Rate: ${summary.resources.totalExtractionRate}/tick`);

    const sorted = Object.entries(summary.resources.finalState)
      .filter(([_, data]) => data.unlocked > 0)
      .sort((a, b) => b[1].extractionRate - a[1].extractionRate);

    if (sorted.length > 0) {
      lines.push('  By Resource (unlocked | available | rate):');
      for (const [type, data] of sorted.slice(0, 10)) {
        lines.push(`    ${type}: ${data.unlocked} | ${data.available} | ${data.extractionRate}/tick`);
      }
    }
    lines.push('');
  }

  // Market Metrics (NEW)
  if (summary.market) {
    lines.push('-'.repeat(40));
    lines.push('MARKET HEALTH');
    lines.push('-'.repeat(40));
    lines.push(`  Discovered Final Goods: ${summary.market.current.discoveredFinalGoods}`);
    lines.push(`  Current Avg Popularity: ${summary.market.current.avgPopularity}`);
    lines.push(`  Current Min Popularity: ${summary.market.current.minPopularity}`);
    lines.push(`  Saturated Markets (Current): ${summary.market.current.saturatedMarkets}`);
    lines.push(`  Saturated Markets (Avg): ${summary.market.trend.avgSaturatedMarkets}`);
    lines.push(`  Peak Saturated Markets: ${summary.market.trend.peakSaturatedMarkets}`);
    lines.push(`  Time with Any Saturation: ${summary.market.trend.timeWithAnySaturation}%`);
    lines.push(`  Avg Demand Modifier (Current): ${summary.market.current.avgDemandModifier}`);
    lines.push(`  Active Market Events (Current): ${summary.market.current.activeEvents}`);
    lines.push(`  Total Market Damage (Current): ${summary.market.current.totalDamage.toLocaleString()}`);
    lines.push(`  Recent Sales Diversity (Current): ${summary.market.current.uniqueRecentSales}`);
    lines.push('');

    lines.push('-'.repeat(40));
    lines.push('MARKET SALES');
    lines.push('-'.repeat(40));
    lines.push(`  Sell Actions: ${summary.market.sales.totalSellActions.toLocaleString()}`);
    lines.push(`  Units Sold: ${summary.market.sales.totalUnitsSold.toLocaleString()}`);
    lines.push(`  Revenue from Sales: ${summary.market.sales.totalRevenue.toLocaleString()}`);
    lines.push(`  Avg Sale Price/Unit: ${summary.market.sales.avgSalePricePerUnit}`);
    lines.push(`  Avg Popularity Before Sale: ${summary.market.sales.avgPopularityBeforeSale}`);
    lines.push(`  Avg Popularity After Sale: ${summary.market.sales.avgPopularityAfterSale}`);
    lines.push(`  Avg Event Modifier on Sales: ${summary.market.sales.avgEventModifierOnSales}`);
    lines.push(`  Sales in Saturated Markets: ${summary.market.sales.salesInSaturatedMarketsPct}%`);
    lines.push(`  Market Damage Added from Sales: ${summary.market.sales.totalDamageAdded.toLocaleString()}`);
    if (summary.market.sales.topRevenueItems && summary.market.sales.topRevenueItems.length > 0) {
      lines.push('  Top Revenue Items:');
      for (const item of summary.market.sales.topRevenueItems) {
        lines.push(`    ${item.itemId}: ${item.revenue.toLocaleString()} (${item.units.toLocaleString()} units @ ${Math.round(item.avgPricePerUnit * 100) / 100})`);
      }
    }
    lines.push('');
  }

  // Pacing
  lines.push('-'.repeat(40));
  lines.push('PACING');
  lines.push('-'.repeat(40));
  lines.push(`  Total Actions: ${summary.totalActions.toLocaleString()}`);
  lines.push(`  Decision Interval: ${summary.decisionInterval} ticks (avg)`);
  lines.push(`  Idle Ratio: ${summary.idleRatio}%`);
  if (summary.actionDensity) {
    lines.push(`  Action Ticks: ${summary.actionDensity.actionTicks.toLocaleString()}`);
    lines.push(`  Avg Actions per Action Tick: ${summary.actionDensity.avgActionsPerActionTick}`);
    lines.push(`  Max Actions in a Single Tick: ${summary.actionDensity.maxActionsInSingleTick}`);
  }
  lines.push('');

  // Milestones (NEW)
  if (summary.milestones) {
    const m = summary.milestones;
    const milestoneList = [
      ['firstSale', 'First Sale'],
      ['firstNodeUnlock', 'First Node Unlock'],
      ['firstFloorExpansion', 'First Floor Expansion'],
      ['firstExperiment', 'First Experiment'],
      ['firstPrototypeComplete', 'First Prototype Complete'],
      ['firstAge2Recipe', 'First Age 2+ Recipe'],
      ['reached1000Credits', 'Reached 1,000 Credits'],
      ['reached10000Credits', 'Reached 10,000 Credits'],
    ];

    const reachedMilestones = milestoneList.filter(([key]) => m[key] !== null);

    if (reachedMilestones.length > 0) {
      lines.push('-'.repeat(40));
      lines.push('MILESTONES');
      lines.push('-'.repeat(40));
      for (const [key, label] of reachedMilestones) {
        lines.push(`  ${label}: tick ${m[key].toLocaleString()}`);
      }
      lines.push('');
    }
  }

  // Bottlenecks
  if (Object.keys(summary.bottlenecks).length > 0) {
    lines.push('-'.repeat(40));
    lines.push('BOTTLENECKS');
    lines.push('-'.repeat(40));
    const sorted = Object.entries(summary.bottlenecks).sort((a, b) => b[1] - a[1]);
    for (const [reason, pct] of sorted.slice(0, 5)) {
      lines.push(`  ${reason}: ${pct}%`);
    }
    lines.push('');
  }

  // Production
  lines.push('-'.repeat(40));
  lines.push('PRODUCTION');
  lines.push('-'.repeat(40));
  lines.push(`  Unique Items Sold: ${summary.uniqueItemsSold}`);

  const topSold = Object.entries(summary.goodsSold)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  if (topSold.length > 0) {
    lines.push('  Top 5 Items Sold:');
    for (const [itemId, qty] of topSold) {
      lines.push(`    ${itemId}: ${qty.toLocaleString()}`);
    }
  }
  lines.push('');

  // Final State
  lines.push('-'.repeat(40));
  lines.push('FINAL STATE');
  lines.push('-'.repeat(40));
  lines.push(`  Machines Deployed: ${summary.finalState.machines}`);
  lines.push(`  Generators Deployed: ${summary.finalState.generators}`);
  lines.push(`  Floor Area: ${summary.finalState.floorArea} cells`);
  lines.push(`  Active Extraction Nodes: ${summary.finalState.extractionNodes}`);
  lines.push(`  Unlocked Recipes: ${summary.finalState.unlockedRecipes}`);
  lines.push('');

  lines.push('='.repeat(60));

  return lines.join('\n');
}

/**
 * Generate JSON report
 * @param {Object} summary - Summary statistics
 * @param {Array} snapshots - Time-series snapshots
 * @param {Array} events - Event log
 * @param {Object} config - Simulation config
 * @returns {Object} Full JSON report
 */
export function generateJSONReport(summary, snapshots, events, config = {}) {
  return {
    meta: {
      generatedAt: new Date().toISOString(),
      seed: config.seed,
      strategy: config.strategy || 'balanced',
      maxTicks: config.maxTicks,
      snapshotInterval: config.snapshotInterval,
    },
    summary,
    snapshots,
    events,
  };
}

/**
 * Compare two simulation runs
 * @param {Object} reportA - First report
 * @param {Object} reportB - Second report
 * @returns {Object} Comparison results
 */
export function compareRuns(reportA, reportB) {
  const summaryA = reportA.summary;
  const summaryB = reportB.summary;

  const compare = (key, label, nested = null) => {
    let a, b;
    if (nested) {
      a = summaryA[nested]?.[key] || 0;
      b = summaryB[nested]?.[key] || 0;
    } else {
      a = summaryA[key] || 0;
      b = summaryB[key] || 0;
    }
    const diff = b - a;
    const pctChange = a !== 0 ? Math.round((diff / a) * 1000) / 10 : (b !== 0 ? Infinity : 0);

    return {
      label,
      before: a,
      after: b,
      diff,
      pctChange: isFinite(pctChange) ? pctChange : 'N/A',
    };
  };

  return {
    meta: {
      seedA: reportA.meta.seed,
      seedB: reportB.meta.seed,
    },
    comparisons: [
      compare('agesReached', 'Ages Reached'),
      compare('avgIncomeRate', 'Avg Income Rate'),
      compare('totalCreditsEarned', 'Total Credits Earned'),
      compare('idleRatio', 'Idle Ratio %'),
      compare('decisionInterval', 'Decision Interval'),
      compare('totalActions', 'Total Actions'),
      compare('nodeUnlocks', 'Node Unlocks', 'expansion'),
      compare('totalRPEarned', 'Total RP Earned', 'research'),
      compare('prototypesCompleted', 'Prototypes Completed', 'research'),
    ],
    ageUnlockComparison: {
      before: summaryA.ageUnlockTicks,
      after: summaryB.ageUnlockTicks,
    },
    spendingComparison: {
      before: summaryA.spending?.byCategory || {},
      after: summaryB.spending?.byCategory || {},
    },
  };
}

/**
 * Print comparison to console
 * @param {Object} comparison - Comparison results
 */
export function printComparison(comparison) {
  console.log('\n' + '='.repeat(60));
  console.log('RUN COMPARISON');
  console.log('='.repeat(60));
  console.log(`Seed A: ${comparison.meta.seedA}`);
  console.log(`Seed B: ${comparison.meta.seedB}`);
  console.log('');

  console.log('-'.repeat(60));
  console.log(`${'Metric'.padEnd(25)} ${'Before'.padStart(10)} ${'After'.padStart(10)} ${'Change'.padStart(12)}`);
  console.log('-'.repeat(60));

  for (const c of comparison.comparisons) {
    const changeStr = c.pctChange === 'N/A' ? 'N/A' : `${c.pctChange > 0 ? '+' : ''}${c.pctChange}%`;
    console.log(`${c.label.padEnd(25)} ${String(c.before).padStart(10)} ${String(c.after).padStart(10)} ${changeStr.padStart(12)}`);
  }

  console.log('');
  console.log('Age Unlock Ticks:');
  for (let age = 2; age <= 7; age++) {
    const before = comparison.ageUnlockComparison.before[age];
    const after = comparison.ageUnlockComparison.after[age];

    if (before !== undefined || after !== undefined) {
      const bStr = before !== undefined ? before.toLocaleString() : 'N/A';
      const aStr = after !== undefined ? after.toLocaleString() : 'N/A';
      console.log(`  Age ${age}: ${bStr} → ${aStr}`);
    }
  }

  // Spending comparison
  const beforeSpending = comparison.spendingComparison.before;
  const afterSpending = comparison.spendingComparison.after;
  if (Object.keys(beforeSpending).length > 0 || Object.keys(afterSpending).length > 0) {
    console.log('');
    console.log('Spending by Category:');
    const allKeys = new Set([...Object.keys(beforeSpending), ...Object.keys(afterSpending)]);
    for (const key of allKeys) {
      const before = beforeSpending[key] || 0;
      const after = afterSpending[key] || 0;
      if (before > 0 || after > 0) {
        console.log(`  ${key}: ${before.toLocaleString()} → ${after.toLocaleString()}`);
      }
    }
  }

  console.log('='.repeat(60));
}

/**
 * Save report to files
 * @param {Object} report - JSON report
 * @param {string} basePath - Base file path (without extension)
 */
export function saveReport(report, basePath) {
  // Save JSON
  writeFileSync(`${basePath}.json`, JSON.stringify(report, null, 2));

  // Save text summary
  const textReport = generateTextReport(report.summary, report.meta);
  writeFileSync(`${basePath}.txt`, textReport);

  console.log(`Reports saved to ${basePath}.json and ${basePath}.txt`);
}
