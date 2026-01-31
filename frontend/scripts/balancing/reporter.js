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
  lines.push('');

  // Pacing
  lines.push('-'.repeat(40));
  lines.push('PACING');
  lines.push('-'.repeat(40));
  lines.push(`  Total Actions: ${summary.totalActions.toLocaleString()}`);
  lines.push(`  Decision Interval: ${summary.decisionInterval} ticks (avg)`);
  lines.push(`  Idle Ratio: ${summary.idleRatio}%`);
  lines.push('');

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

  const compare = (key, label) => {
    const a = summaryA[key] || 0;
    const b = summaryB[key] || 0;
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
    ],
    ageUnlockComparison: {
      before: summaryA.ageUnlockTicks,
      after: summaryB.ageUnlockTicks,
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
