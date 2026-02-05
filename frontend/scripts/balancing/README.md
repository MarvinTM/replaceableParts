# Game Balance Simulation Framework

A headless simulation tool for analyzing and balancing the game economy. Runs the game engine without UI, using an automated "bot" player to generate KPIs that measure game pacing and economy health.

## Purpose

Balancing a game economy is iterative. This framework helps by:
- Running automated playthroughs to measure progression speed
- Tracking income rates, idle time, and bottlenecks
- Comparing different rule configurations (A/B testing)
- Providing data to inform balance decisions

## Quick Start

```bash
cd frontend

# Basic simulation (10,000 ticks, random seed)
node scripts/balancing/runSimulation.js

# With specific options
node scripts/balancing/runSimulation.js --ticks 5000 --seed 12345 --verbose

# Save results to files
node scripts/balancing/runSimulation.js --ticks 10000 --output ./scripts/balancing/results/run1

# Batch simulation with scorecard (multiple seeds)
node scripts/balancing/runBatchSimulation.js --runs 8 --ticks 20000 --seed 1 --verbose

# Batch simulation with explicit seeds + saved reports
node scripts/balancing/runBatchSimulation.js --seeds 1,2,3,4,5 --output ./scripts/balancing/results/batch_v1
```

## CLI Options

| Option | Description | Default |
|--------|-------------|---------|
| `--ticks N` | Number of game ticks to simulate | 10000 |
| `--seed N` | Random seed for deterministic runs | Current timestamp |
| `--output PATH` | Save JSON and TXT reports to PATH | None (console only) |
| `--verbose` | Show progress during simulation | Off |
| `--starting-credits N` | Initial credits for the bot | 500 |
| `--snapshot-interval N` | Take snapshots every N ticks | 100 |
| `--help` | Show help message | - |

### Batch Runner Options (`runBatchSimulation.js`)

| Option | Description | Default |
|--------|-------------|---------|
| `--ticks N` | Number of ticks per run | 20000 |
| `--runs N` | Number of runs (used with `--seed`) | 8 |
| `--seed N` | Starting seed when generating seed sequence | 1 |
| `--seeds A,B,C` | Explicit comma-separated seeds (overrides `--runs/--seed`) | None |
| `--profile NAME` | Scorecard target profile | `default` |
| `--output PATH` | Save JSON and TXT reports to PATH | None |
| `--verbose` | Print per-run progress | Off |

Profiles:
- `default` / `chill_v1`: tuned for "rewarding + chill" evaluation on long runs (recommended for 20k-tick batches)
- `legacy`: older broad target bands

## Output Explained

### Progression
- **Age Reached**: Highest technology age unlocked
- **Age X → Y**: Ticks required to progress between ages

### Economy
- **Total Earned**: Credits from selling goods
- **Total Spent**: Credits spent on research, expansion, etc.
- **Avg Income Rate**: Credits earned per tick (smoothed average)
- **Peak Income**: Highest income in any 100-tick window

### Pacing
- **Total Actions**: Number of decisions the bot made
- **Decision Interval**: Average ticks between actions (lower = more active gameplay)
- **Idle Ratio**: Percentage of time with nothing affordable to do (higher = player waiting)

### Production
- **Unique Items Sold**: Diversity of goods produced
- **Top 5 Items Sold**: Most produced final goods

### Market Health & Switching
- **Time With Saturation**: % of snapshots with at least one saturated market
- **Sales In Saturated Markets**: % of sell actions executed below popularity 1.0
- **Sell Switch Rate**: % of transitions where consecutive sell actions switch item
- **Avg/Max Sell Streak**: How long the bot keeps selling the same item
- **Top Item Revenue Share**: Dominance of one final good in sales revenue
- **Rolling Avg Unique Sold Items**: Local sell diversity in a moving tick window
- **Rolling Avg Concentration (HHI)**: Local concentration of sales mix (higher = less diverse)

### Final State
- Machines, generators, floor area, extraction nodes at simulation end

## Understanding the Results

### Good Signs
- **Low idle ratio** (<5%): Player always has something to do
- **Moderate decision interval** (10-50 ticks): Not overwhelming, not boring
- **Steady income growth**: Economy progresses over time
- **Multiple items sold**: Production diversity

### Warning Signs
- **High idle ratio** (>20%): Player waiting too long for credits
- **Very low decision interval** (<5): Might be overwhelming
- **Flat income**: Economy stagnates
- **Only 1 item sold**: Production chain too narrow

## The Bot Strategy

The `balancedBot` makes decisions like a reasonable player:

1. **Sells final goods** using market-aware candidate scoring (popularity, events, obsolescence, diversity) with per-tick action caps and anti-repeat cooldowns
2. **Builds/deploys machines and generators** while accounting for energy sustainability and undeployed inventory caps
3. **Assigns recipes** prioritizing:
   - Recipes that can actually be produced (inputs available)
   - "Foundational" recipes used by many other recipes
   - Prototype requirements and production diversity
4. **Reassigns recipes** periodically toward final-goods and prototype bottlenecks
5. **Researches** with credit donation budgets and prototype backlog limits
6. **Expands floor/map and unlocks nodes** when progression constraints appear

The bot is not optimal - it's meant to simulate typical player behavior.

## File Structure

```
scripts/balancing/
├── README.md              # This file
├── runSimulation.js       # CLI entry point
├── simulator.js           # Core headless runner
├── kpis.js                # KPI tracking and calculation
├── reporter.js            # Output generation
├── strategies/
│   ├── baseStrategy.js    # Strategy interface
│   └── balancedBot.js     # Default bot behavior
└── results/               # Output files (gitignored)
```

## Key Levers for Balancing

These parameters in `defaultRules.js` have the most impact:

| Lever | Location | Effect |
|-------|----------|--------|
| `basePrice` | materials[] | Direct income per item |
| `costPerCell` | floorSpace | Factory expansion cost |
| `baseCostPerCell` | exploration | Map expansion cost |
| `nodeUnlockCost` | exploration | Resource node cost |
| `creditsToRPRatio` | research | Research speed |
| `experimentCosts` | research | Age unlock cost |
| Extraction `rate` | initialState | Raw material throughput |

## Example Workflow

1. **Baseline run**: Establish current metrics
   ```bash
   node scripts/balancing/runSimulation.js --ticks 20000 --seed 1 --output results/baseline
   ```

2. **Modify a lever**: Edit `defaultRules.js` (e.g., increase chair price)

3. **Comparison run**: Same seed, modified rules
   ```bash
   node scripts/balancing/runSimulation.js --ticks 20000 --seed 1 --output results/higher-prices
   ```

4. **Compare results**: Check JSON files or use reporter's compare function

5. **Iterate**: Adjust levers based on data until KPIs match desired feel

## Limitations

- Bot makes reasonable but not optimal decisions
- Single bot strategy (could add aggressive/passive variants)
- No visualization yet (JSON data can be graphed externally)
- Simulation is slower than real-time (~3 minutes for 10k ticks)

## Future Improvements

- Multiple bot strategies for comparison
- Built-in comparison mode (`--compare file1.json file2.json`)
- KPI visualization / charts
- Parallel simulation runs
- CI integration for regression testing
