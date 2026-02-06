#!/usr/bin/env node
/**
 * CLI Runner for Balance Simulation
 * Usage:
 *   node runSimulation.js [options]
 *
 * Options:
 *   --ticks N       Run for N ticks (default: 10000)
 *   --seed N        Use seed N for deterministic runs
 *   --output PATH   Save results to PATH (without extension)
 *   --verbose       Show progress during simulation
 *   --starting-credits N  Starting credits (default: 500)
 */

import { createSimulation, runTicks } from './simulator.js';
import { createTracker } from './kpis.js';
import { createBalancedBot } from './strategies/balancedBot.js';
import { getBotProfileParams, getBotProfiles, resolveBotProfile } from './strategies/botProfiles.js';
import { generateTextReport, generateJSONReport, saveReport } from './reporter.js';

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    ticks: 10000,
    seed: Date.now(),
    output: null,
    verbose: false,
    startingCredits: 500,
    snapshotInterval: 100,
    botProfile: 'default',
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--ticks':
        options.ticks = parseInt(args[++i], 10);
        break;
      case '--seed':
        options.seed = parseInt(args[++i], 10);
        break;
      case '--output':
        options.output = args[++i];
        break;
      case '--verbose':
        options.verbose = true;
        break;
      case '--starting-credits':
        options.startingCredits = parseInt(args[++i], 10);
        break;
      case '--snapshot-interval':
        options.snapshotInterval = parseInt(args[++i], 10);
        break;
      case '--bot-profile':
        options.botProfile = args[++i];
        break;
      case '--help':
        console.log(`
Balance Simulation Runner

Usage: node runSimulation.js [options]

Options:
  --ticks N              Run for N ticks (default: 10000)
  --seed N               Use seed N for deterministic runs
  --output PATH          Save results to PATH (without extension)
  --verbose              Show progress during simulation
  --starting-credits N   Starting credits (default: 500)
  --snapshot-interval N  Take snapshots every N ticks (default: 100)
  --bot-profile NAME     Balanced bot profile (default: default)
  --help                 Show this help message

Available bot profiles: ${getBotProfiles().join(', ')}

Examples:
  node runSimulation.js --ticks 5000 --seed 12345
  node runSimulation.js --output ./results/run1 --verbose
        `);
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

async function main() {
  const options = parseArgs();
  const resolvedProfile = resolveBotProfile(options.botProfile);
  if (!resolvedProfile) {
    console.error(`Unknown --bot-profile "${options.botProfile}". Available: ${getBotProfiles().join(', ')}`);
    process.exit(1);
  }
  const botParams = getBotProfileParams(resolvedProfile);

  console.log('='.repeat(60));
  console.log('BALANCE SIMULATION');
  console.log('='.repeat(60));
  console.log(`Seed: ${options.seed}`);
  console.log(`Ticks: ${options.ticks}`);
  console.log(`Starting Credits: ${options.startingCredits}`);
  console.log(`Bot Profile: ${resolvedProfile}`);
  console.log('');

  // Create simulation
  const sim = createSimulation({
    seed: options.seed,
    startingCredits: options.startingCredits,
    snapshotInterval: options.snapshotInterval,
  });

  // Create KPI tracker
  const tracker = createTracker();

  // Create bot strategy
  const bot = createBalancedBot(botParams);

  // Track initial state
  tracker.data.ageUnlockTicks[1] = 0;

  console.log('Starting simulation...');
  const startTime = Date.now();

  // Run in chunks for progress reporting
  const chunkSize = 1000;
  let ticksRun = 0;

  while (ticksRun < options.ticks) {
    const remaining = options.ticks - ticksRun;
    const toRun = Math.min(chunkSize, remaining);

    const result = runTicks(sim, toRun, bot, tracker);

    if (result.error) {
      console.error(`Error at tick ${sim.currentTick}: ${result.error}`);
      break;
    }

    ticksRun += result.ticksCompleted;

    if (options.verbose) {
      const pct = Math.round((ticksRun / options.ticks) * 100);
      const age = tracker.data.currentAge;
      const credits = sim.state.credits;
      process.stdout.write(`\r  Progress: ${pct}% | Tick: ${ticksRun} | Age: ${age} | Credits: ${credits.toLocaleString()}`);
    }
  }

  if (options.verbose) {
    console.log(''); // New line after progress
  }

  const elapsed = Date.now() - startTime;
  console.log(`\nSimulation complete in ${elapsed}ms`);
  console.log('');

  // Generate reports
  const summary = tracker.getSummary();
  const textReport = generateTextReport(summary, {
    seed: options.seed,
    strategy: `balanced:${resolvedProfile}`,
  });

  console.log(textReport);

  // Save to file if requested
  if (options.output) {
    const jsonReport = generateJSONReport(
      summary,
      tracker.getSnapshots(),
      tracker.getEvents(),
      {
        seed: options.seed,
        strategy: `balanced:${resolvedProfile}`,
        maxTicks: options.ticks,
        snapshotInterval: options.snapshotInterval,
        botProfile: resolvedProfile,
      }
    );
    saveReport(jsonReport, options.output);
  }
}

main().catch(err => {
  console.error('Simulation failed:', err);
  process.exit(1);
});
