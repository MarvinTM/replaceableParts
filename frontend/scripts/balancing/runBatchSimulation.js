#!/usr/bin/env node
/**
 * Batch Balance Simulation Runner
 *
 * Runs multiple seeds and reports percentile aggregates + scorecard.
 */

import { writeFileSync } from 'fs';
import { createSimulation, runTicks } from './simulator.js';
import { createTracker } from './kpis.js';
import { createBalancedBot } from './strategies/balancedBot.js';
import { getBotProfileParams, getBotProfiles, resolveBotProfile } from './strategies/botProfiles.js';
import { computeMetricStats, evaluateScorecard, getTargetProfiles } from './scorecard.js';

function parseInteger(value, fallback) {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    ticks: 20000,
    runs: 8,
    seed: 1,
    seeds: null,
    output: null,
    verbose: false,
    startingCredits: 500,
    snapshotInterval: 100,
    profile: 'default',
    botProfile: 'default',
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--ticks':
        options.ticks = parseInteger(args[++i], options.ticks);
        break;
      case '--runs':
        options.runs = parseInteger(args[++i], options.runs);
        break;
      case '--seed':
        options.seed = parseInteger(args[++i], options.seed);
        break;
      case '--seeds':
        options.seeds = args[++i]
          .split(',')
          .map(token => parseInteger(token.trim(), null))
          .filter(value => Number.isFinite(value));
        break;
      case '--output':
        options.output = args[++i];
        break;
      case '--verbose':
        options.verbose = true;
        break;
      case '--starting-credits':
        options.startingCredits = parseInteger(args[++i], options.startingCredits);
        break;
      case '--snapshot-interval':
        options.snapshotInterval = parseInteger(args[++i], options.snapshotInterval);
        break;
      case '--profile':
        options.profile = args[++i];
        break;
      case '--bot-profile':
        options.botProfile = args[++i];
        break;
      case '--help':
        printHelp();
        process.exit(0);
        break;
      default:
        if (arg.startsWith('--')) {
          console.error(`Unknown option: ${arg}`);
          process.exit(1);
        }
    }
  }

  return options;
}

function printHelp() {
  console.log(`
Batch Balance Simulation Runner

Usage: node runBatchSimulation.js [options]

Options:
  --ticks N              Ticks per run (default: 20000)
  --runs N               Number of runs (default: 8)
  --seed N               Starting seed when --seeds is not used (default: 1)
  --seeds A,B,C          Explicit seed list (overrides --runs/--seed)
  --starting-credits N   Starting credits per run (default: 500)
  --snapshot-interval N  Snapshot interval (default: 100)
  --profile NAME         Scorecard profile (default: default)
  --bot-profile NAME     Balanced bot profile (default: default)
  --output PATH          Save report to PATH.json and PATH.txt
  --verbose              Print per-run progress
  --help                 Show this help

Available profiles: ${getTargetProfiles().join(', ')}
Available bot profiles: ${getBotProfiles().join(', ')}

Examples:
  node runBatchSimulation.js --runs 12 --ticks 20000 --seed 100
  node runBatchSimulation.js --seeds 1,2,3,4,5 --output ./scripts/balancing/results/batch_v1
  `);
}

function resolveSeeds(options) {
  if (Array.isArray(options.seeds) && options.seeds.length > 0) {
    return options.seeds;
  }

  const seeds = [];
  for (let i = 0; i < options.runs; i++) {
    seeds.push(options.seed + i);
  }
  return seeds;
}

function round(value, decimals = 2) {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
}

function buildAggregate(runResults) {
  const summaries = runResults.map(result => result.summary);

  const keyMetrics = [
    { id: 'agesReached', label: 'Ages Reached', path: 'agesReached', decimals: 2 },
    { id: 'idleRatio', label: 'Idle Ratio (%)', path: 'idleRatio', decimals: 1 },
    { id: 'decisionInterval', label: 'Decision Interval', path: 'decisionInterval', decimals: 2 },
    { id: 'actionsPerTick', label: 'Actions/Action Tick', path: 'actionDensity.avgActionsPerActionTick', decimals: 2 },
    { id: 'uniqueItemsSold', label: 'Unique Items Sold', path: 'uniqueItemsSold', decimals: 2 },
    { id: 'machines', label: 'Final Machines', path: 'finalState.machines', decimals: 2 },
    { id: 'generators', label: 'Final Generators', path: 'finalState.generators', decimals: 2 },
    { id: 'nodeUnlocks', label: 'Node Unlocks', path: 'expansion.nodeUnlocks', decimals: 2 },
    { id: 'prototypesCompleted', label: 'Prototypes Completed', path: 'research.prototypesCompleted', decimals: 2 },
    { id: 'marketSatTime', label: 'Time With Saturation (%)', path: 'market.trend.timeWithAnySaturation', decimals: 1 },
    { id: 'salesInSat', label: 'Sales In Saturated Markets (%)', path: 'market.sales.salesInSaturatedMarketsPct', decimals: 1 },
    { id: 'switchRate', label: 'Sell Switch Rate (%)', path: 'market.switching.switchRatePct', decimals: 1 },
    { id: 'topItemRevenueShare', label: 'Top Item Revenue Share (%)', path: 'market.switching.topItemRevenueSharePct', decimals: 1 },
    { id: 'rollingUniqueItems', label: 'Rolling Avg Unique Sold Items', path: 'market.switching.rollingWindow.avgUniqueItems', decimals: 2 },
    { id: 'rollingHHI', label: 'Rolling Avg Sales Concentration (HHI)', path: 'market.switching.rollingWindow.avgConcentrationHHI', decimals: 3 },
  ];

  const metrics = keyMetrics.map(metric => {
    const stats = computeMetricStats(summaries, metric.path);
    return {
      ...metric,
      stats: {
        count: stats.count,
        min: round(stats.min, metric.decimals),
        p10: round(stats.p10, metric.decimals),
        p50: round(stats.p50, metric.decimals),
        p90: round(stats.p90, metric.decimals),
        max: round(stats.max, metric.decimals),
        mean: round(stats.mean, metric.decimals),
      },
    };
  });

  const elapsedValues = runResults.map(result => result.elapsedMs);
  const elapsedStats = computeMetricStats(
    runResults.map(result => ({ elapsedMs: result.elapsedMs })),
    'elapsedMs'
  );

  return {
    runCount: runResults.length,
    elapsed: {
      totalMs: elapsedValues.reduce((sum, value) => sum + value, 0),
      avgMs: round(elapsedStats.mean, 1),
      p50Ms: round(elapsedStats.p50, 1),
      p90Ms: round(elapsedStats.p90, 1),
    },
    metrics,
  };
}

function formatTarget(metric) {
  const min = metric.min !== undefined ? metric.min : '-inf';
  const max = metric.max !== undefined ? metric.max : '+inf';
  return `[${min}, ${max}]`;
}

function formatValue(value) {
  if (value === null || value === undefined) return 'N/A';
  if (typeof value !== 'number' || !Number.isFinite(value)) return String(value);
  return value.toLocaleString();
}

function formatStatus(status) {
  if (status === 'ok') return 'OK';
  if (status === 'too_low') return 'TOO_LOW';
  if (status === 'too_high') return 'TOO_HIGH';
  return 'NO_DATA';
}

function generateBatchTextReport(report) {
  const lines = [];
  const { config, seeds, aggregate, scorecard } = report;

  lines.push('='.repeat(80));
  lines.push('BATCH BALANCE SIMULATION');
  lines.push('='.repeat(80));
  lines.push('');
  lines.push(
    `Runs: ${aggregate.runCount} | Ticks/Run: ${config.ticks} | ` +
    `Profile: ${config.profile} | Bot: ${config.botProfile || 'default'}`
  );
  lines.push(`Seeds: ${seeds.join(', ')}`);
  lines.push(`Elapsed: total ${aggregate.elapsed.totalMs}ms | avg ${aggregate.elapsed.avgMs}ms | p50 ${aggregate.elapsed.p50Ms}ms | p90 ${aggregate.elapsed.p90Ms}ms`);
  lines.push('');

  lines.push('-'.repeat(80));
  lines.push('SCORECARD');
  lines.push('-'.repeat(80));
  lines.push(`Health Score: ${scorecard.summary.healthScore}%`);
  lines.push(`Status Counts: OK=${scorecard.summary.ok} | TOO_LOW=${scorecard.summary.tooLow} | TOO_HIGH=${scorecard.summary.tooHigh} | NO_DATA=${scorecard.summary.noData}`);
  lines.push('');

  const orderedMetrics = [...scorecard.metrics].sort((a, b) => {
    const rank = { too_high: 0, too_low: 1, no_data: 2, ok: 3 };
    return rank[a.status] - rank[b.status];
  });

  for (const metric of orderedMetrics) {
    lines.push(
      `  [${formatStatus(metric.status).padEnd(8)}] ${metric.label}: p50=${formatValue(round(metric.stats.p50, 2))} ` +
      `(p10=${formatValue(round(metric.stats.p10, 2))}, p90=${formatValue(round(metric.stats.p90, 2))}) ` +
      `target=${formatTarget(metric)} | in-band=${round(metric.inBandPct, 1)}%`
    );
  }
  lines.push('');

  lines.push('-'.repeat(80));
  lines.push('KEY AGGREGATES');
  lines.push('-'.repeat(80));
  for (const metric of aggregate.metrics) {
    lines.push(
      `  ${metric.label}: p50=${formatValue(metric.stats.p50)} ` +
      `(p10=${formatValue(metric.stats.p10)}, p90=${formatValue(metric.stats.p90)})`
    );
  }
  lines.push('');

  lines.push('-'.repeat(80));
  lines.push('PER RUN');
  lines.push('-'.repeat(80));
  for (const run of report.runs) {
    lines.push(
      `  Seed ${run.seed}: age=${run.summary.agesReached}, machines=${run.summary.finalState.machines}, ` +
      `generators=${run.summary.finalState.generators}, idle=${run.summary.idleRatio}%, ` +
      `nodeUnlocks=${run.summary.expansion.nodeUnlocks}, prototypes=${run.summary.research.prototypesCompleted}, ` +
      `switchRate=${run.summary.market.switching.switchRatePct}%, topShare=${run.summary.market.switching.topItemRevenueSharePct}%, ` +
      `elapsed=${run.elapsedMs}ms`
    );
  }
  lines.push('');
  lines.push('='.repeat(80));

  return lines.join('\n');
}

function saveBatchReport(report, outputPath) {
  writeFileSync(`${outputPath}.json`, JSON.stringify(report, null, 2));
  writeFileSync(`${outputPath}.txt`, generateBatchTextReport(report));
  console.log(`Reports saved to ${outputPath}.json and ${outputPath}.txt`);
}

async function main() {
  const options = parseArgs();
  const resolvedBotProfile = resolveBotProfile(options.botProfile);
  if (!resolvedBotProfile) {
    console.error(`Unknown --bot-profile "${options.botProfile}". Available: ${getBotProfiles().join(', ')}`);
    process.exit(1);
  }
  const botParams = getBotProfileParams(resolvedBotProfile);
  const seeds = resolveSeeds(options);
  const runResults = [];
  const startAll = Date.now();

  console.log('='.repeat(80));
  console.log('BATCH BALANCE SIMULATION');
  console.log('='.repeat(80));
  console.log(`Runs: ${seeds.length}`);
  console.log(`Ticks per run: ${options.ticks}`);
  console.log(`Profile: ${options.profile}`);
  console.log(`Bot Profile: ${resolvedBotProfile}`);
  console.log(`Seeds: ${seeds.join(', ')}`);
  console.log('');

  for (let index = 0; index < seeds.length; index++) {
    const seed = seeds[index];
    const runStart = Date.now();

    const sim = createSimulation({
      seed,
      maxTicks: options.ticks,
      snapshotInterval: options.snapshotInterval,
      startingCredits: options.startingCredits,
    });
    const tracker = createTracker();
    tracker.data.ageUnlockTicks[1] = 0;
    const bot = createBalancedBot(botParams);

    const result = runTicks(sim, options.ticks, bot, tracker);
    if (result.error) {
      console.error(`Run failed for seed ${seed}: ${result.error}`);
      process.exit(1);
    }

    const elapsedMs = Date.now() - runStart;
    const summary = tracker.getSummary();
    runResults.push({ seed, elapsedMs, summary });

    if (options.verbose) {
      const progressPct = round(((index + 1) / seeds.length) * 100, 1);
      console.log(
        `[${index + 1}/${seeds.length}] ${progressPct}% seed=${seed} ` +
        `age=${summary.agesReached} machines=${summary.finalState.machines} ` +
        `generators=${summary.finalState.generators} idle=${summary.idleRatio}% ` +
        `elapsed=${elapsedMs}ms`
      );
    }
  }

  const aggregate = buildAggregate(runResults);
  const scorecard = evaluateScorecard(runResults.map(run => run.summary), {
    profile: options.profile,
  });
  const report = {
    meta: {
      generatedAt: new Date().toISOString(),
      totalElapsedMs: Date.now() - startAll,
    },
    config: {
      ticks: options.ticks,
      runs: seeds.length,
      startingCredits: options.startingCredits,
      snapshotInterval: options.snapshotInterval,
      profile: options.profile,
      strategy: `balanced:${resolvedBotProfile}`,
      botProfile: resolvedBotProfile,
    },
    seeds,
    runs: runResults,
    aggregate,
    scorecard,
  };

  const textReport = generateBatchTextReport(report);
  console.log('');
  console.log(textReport);

  if (options.output) {
    saveBatchReport(report, options.output);
  }
}

main().catch(err => {
  console.error('Batch simulation failed:', err);
  process.exit(1);
});
