import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { engine, migrateGameState } from '../src/engine/engine.js';
import { defaultRules } from '../src/engine/defaultRules.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SAVE_PATH = resolve(__dirname, 'first-real-game.rpsave.json');
const WARMUP_TICKS = 10;
const MEASURED_TICKS = 100;

function stats(arr) {
  const sorted = [...arr].sort((a, b) => a - b);
  const n = sorted.length;
  const min = sorted[0];
  const max = sorted[n - 1];
  const mean = sorted.reduce((s, v) => s + v, 0) / n;
  const median = n % 2 === 0
    ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
    : sorted[Math.floor(n / 2)];
  const p95 = sorted[Math.max(0, Math.floor(n * 0.95) - 1)];
  const p99 = sorted[Math.max(0, Math.floor(n * 0.99) - 1)];
  const variance = sorted.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
  const stddev = Math.sqrt(variance);
  return { min, max, mean, median, p95, p99, stddev };
}

const raw = JSON.parse(readFileSync(SAVE_PATH, 'utf-8'));
const saveData = raw.save.data;
let state = migrateGameState(saveData, defaultRules);

const enabled = state.machines.filter(m => m.enabled);
const working = enabled.filter(m => m.recipeId && m.status !== 'blocked');

console.log('=== SimulateTick Benchmark ===');
console.log(`Save:    ${SAVE_PATH}`);
console.log(`State:   tick=${state.tick}, machines=${state.machines.length} (${working.length} working, ${enabled.length} enabled), generators=${state.generators.length}`);
console.log(`Config:  ${WARMUP_TICKS} warmup ticks, ${MEASURED_TICKS} measured ticks\n`);

console.log('Warming up...');
for (let i = 0; i < WARMUP_TICKS; i++) {
  const result = engine(state, defaultRules, { type: 'SIMULATE' });
  state = result.state;
}

const totalTimes = [];
const phaseBreakdowns = [];
const timings = {};

console.log(`Running ${MEASURED_TICKS} ticks...`);
for (let i = 0; i < MEASURED_TICKS; i++) {
  timings.clone = 0;
  timings.generators = 0;
  timings.energy = 0;
  timings.machines = 0;
  timings.research = 0;
  timings.market = 0;

  const start = process.hrtime.bigint();
  const result = engine(state, defaultRules, { type: 'SIMULATE', timings });
  const end = process.hrtime.bigint();

  const totalMs = Number(end - start) / 1e6;
  totalTimes.push(totalMs);
  phaseBreakdowns.push({ ...timings });

  state = result.state;
}

const totalStats = stats(totalTimes);
const phaseNames = ['clone', 'generators', 'energy', 'machines', 'research', 'market'];

console.log('\n=== Total Tick Time (ms) ===');
console.log(`  min=${totalStats.min.toFixed(3)}  max=${totalStats.max.toFixed(3)}  mean=${totalStats.mean.toFixed(3)}  median=${totalStats.median.toFixed(3)}`);
console.log(`  p95=${totalStats.p95.toFixed(3)}  p99=${totalStats.p99.toFixed(3)}  stddev=${totalStats.stddev.toFixed(3)}`);

console.log('\n=== Per-Phase Breakdown (ms, mean) ===');
const breakdownSum = phaseNames.reduce((sum, p) => {
  const values = phaseBreakdowns.map(b => b[p]);
  return sum + stats(values).mean;
}, 0);

for (const phase of phaseNames) {
  const values = phaseBreakdowns.map(b => b[phase]);
  const s = stats(values);
  const pct = ((s.mean / totalStats.mean) * 100).toFixed(1);
  console.log(`  ${phase.padEnd(11)} mean=${s.mean.toFixed(3)}  median=${s.median.toFixed(3)}  (${pct}%)`);
}
