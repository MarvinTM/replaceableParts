/**
 * Balance scorecard evaluation for batch simulation runs.
 */

const legacyTargetBands = [
  {
    id: 'agesReached',
    label: 'Ages Reached',
    path: 'agesReached',
    min: 3,
    max: 7,
  },
  {
    id: 'idleRatio',
    label: 'Idle Ratio (%)',
    path: 'idleRatio',
    min: 8,
    max: 30,
  },
  {
    id: 'decisionInterval',
    label: 'Decision Interval (ticks)',
    path: 'decisionInterval',
    min: 1.5,
    max: 12,
  },
  {
    id: 'actionsPerActionTick',
    label: 'Actions Per Action Tick',
    path: 'actionDensity.avgActionsPerActionTick',
    min: 1.1,
    max: 3.5,
  },
  {
    id: 'maxActionsInSingleTick',
    label: 'Max Actions In One Tick',
    path: 'actionDensity.maxActionsInSingleTick',
    min: 0,
    max: 8,
  },
  {
    id: 'uniqueItemsSold',
    label: 'Unique Items Sold',
    path: 'uniqueItemsSold',
    min: 5,
    max: 9999,
  },
  {
    id: 'nodeUnlocks',
    label: 'Node Unlocks',
    path: 'expansion.nodeUnlocks',
    min: 20,
    max: 400,
  },
  {
    id: 'prototypesCompleted',
    label: 'Prototypes Completed',
    path: 'research.prototypesCompleted',
    min: 8,
    max: 2500,
  },
  {
    id: 'marketSaturationTime',
    label: 'Time With Saturation (%)',
    path: 'market.trend.timeWithAnySaturation',
    min: 5,
    max: 70,
  },
  {
    id: 'salesInSaturatedMarkets',
    label: 'Sales In Saturated Markets (%)',
    path: 'market.sales.salesInSaturatedMarketsPct',
    min: 0,
    max: 45,
  },
  {
    id: 'avgPopularityCurrent',
    label: 'Current Avg Popularity',
    path: 'market.current.avgPopularity',
    min: 0.75,
    max: 2.4,
  },
  {
    id: 'switchRate',
    label: 'Sell Switch Rate (%)',
    path: 'market.switching.switchRatePct',
    min: 20,
    max: 98,
  },
  {
    id: 'topItemRevenueShare',
    label: 'Top Item Revenue Share (%)',
    path: 'market.switching.topItemRevenueSharePct',
    min: 0,
    max: 65,
  },
  {
    id: 'rollingAvgUniqueSalesItems',
    label: 'Rolling Avg Unique Sold Items',
    path: 'market.switching.rollingWindow.avgUniqueItems',
    min: 1.5,
    max: 10,
  },
  {
    id: 'rollingAvgConcentration',
    label: 'Rolling Avg Concentration (HHI)',
    path: 'market.switching.rollingWindow.avgConcentrationHHI',
    min: 0,
    max: 0.7,
  },
  {
    id: 'spendingCoverage',
    label: 'Spending Coverage (%)',
    path: 'spending.coveragePct',
    min: 95,
    max: 100,
  },
];

const chillV1TargetBands = [
  {
    id: 'agesReached',
    label: 'Ages Reached',
    path: 'agesReached',
    min: 3,
    max: 6,
  },
  {
    id: 'idleRatio',
    label: 'Idle Ratio (%)',
    path: 'idleRatio',
    min: 3,
    max: 20,
  },
  {
    id: 'decisionInterval',
    label: 'Decision Interval (ticks)',
    path: 'decisionInterval',
    min: 1.8,
    max: 8,
  },
  {
    id: 'actionsPerActionTick',
    label: 'Actions Per Action Tick',
    path: 'actionDensity.avgActionsPerActionTick',
    min: 1.05,
    max: 2,
  },
  {
    id: 'maxActionsInSingleTick',
    label: 'Max Actions In One Tick',
    path: 'actionDensity.maxActionsInSingleTick',
    min: 0,
    max: 6,
  },
  {
    id: 'uniqueItemsSold',
    label: 'Unique Items Sold',
    path: 'uniqueItemsSold',
    min: 6,
    max: 9999,
  },
  {
    id: 'nodeUnlocks',
    label: 'Node Unlocks',
    path: 'expansion.nodeUnlocks',
    min: 80,
    max: 260,
  },
  {
    id: 'prototypesCompleted',
    label: 'Prototypes Completed',
    path: 'research.prototypesCompleted',
    min: 30,
    max: 140,
  },
  {
    id: 'marketSaturationTime',
    label: 'Time With Saturation (%)',
    path: 'market.trend.timeWithAnySaturation',
    min: 10,
    max: 75,
  },
  {
    id: 'salesInSaturatedMarkets',
    label: 'Sales In Saturated Markets (%)',
    path: 'market.sales.salesInSaturatedMarketsPct',
    min: 0,
    max: 55,
  },
  {
    id: 'avgPopularityBeforeSale',
    label: 'Avg Popularity Before Sale',
    path: 'market.sales.avgPopularityBeforeSale',
    min: 0.9,
    max: 1.9,
  },
  {
    id: 'switchRate',
    label: 'Sell Switch Rate (%)',
    path: 'market.switching.switchRatePct',
    min: 30,
    max: 98,
  },
  {
    id: 'avgSellStreak',
    label: 'Avg Sell Streak (actions)',
    path: 'market.switching.avgSellStreak',
    min: 1.1,
    max: 3.5,
  },
  {
    id: 'topItemRevenueShare',
    label: 'Top Item Revenue Share (%)',
    path: 'market.switching.topItemRevenueSharePct',
    min: 0,
    max: 55,
  },
  {
    id: 'rollingAvgUniqueSalesItems',
    label: 'Rolling Avg Unique Sold Items',
    path: 'market.switching.rollingWindow.avgUniqueItems',
    min: 2,
    max: 12,
  },
  {
    id: 'rollingAvgConcentration',
    label: 'Rolling Avg Concentration (HHI)',
    path: 'market.switching.rollingWindow.avgConcentrationHHI',
    min: 0,
    max: 0.55,
  },
  {
    id: 'spendingCoverage',
    label: 'Spending Coverage (%)',
    path: 'spending.coveragePct',
    min: 98,
    max: 100,
  },
];

const profiles = {
  default: chillV1TargetBands,
  chill_v1: chillV1TargetBands,
  legacy: legacyTargetBands,
};

function getByPath(obj, path) {
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return null;
    current = current[part];
  }
  return current;
}

function percentile(values, p) {
  if (!values.length) return null;
  if (values.length === 1) return values[0];
  const sorted = [...values].sort((a, b) => a - b);
  const index = (p / 100) * (sorted.length - 1);
  const low = Math.floor(index);
  const high = Math.ceil(index);
  if (low === high) return sorted[low];
  const weight = index - low;
  return sorted[low] * (1 - weight) + sorted[high] * weight;
}

function computeStats(values) {
  if (!values.length) {
    return {
      count: 0,
      min: null,
      p10: null,
      p50: null,
      p90: null,
      max: null,
      mean: null,
    };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;

  return {
    count: values.length,
    min: sorted[0],
    p10: percentile(sorted, 10),
    p50: percentile(sorted, 50),
    p90: percentile(sorted, 90),
    max: sorted[sorted.length - 1],
    mean,
  };
}

function inBand(value, metric) {
  if (value === null || value === undefined || Number.isNaN(value)) return false;
  if (metric.min !== undefined && value < metric.min) return false;
  if (metric.max !== undefined && value > metric.max) return false;
  return true;
}

function getStatus(stats, metric) {
  if (stats.count === 0 || stats.p50 === null) return 'no_data';
  if (metric.min !== undefined && stats.p50 < metric.min) return 'too_low';
  if (metric.max !== undefined && stats.p50 > metric.max) return 'too_high';
  return 'ok';
}

export function getTargetProfiles() {
  return Object.keys(profiles);
}

export function getProfileMetrics(profile = 'default') {
  return profiles[profile] || profiles.default;
}

export function evaluateScorecard(runSummaries, options = {}) {
  const profile = options.profile || 'default';
  const metrics = getProfileMetrics(profile);

  const metricResults = metrics.map(metric => {
    const values = runSummaries
      .map(summary => getByPath(summary, metric.path))
      .filter(value => typeof value === 'number' && Number.isFinite(value));
    const stats = computeStats(values);
    const inBandCount = values.filter(value => inBand(value, metric)).length;
    const inBandPct = values.length > 0 ? (inBandCount / values.length) * 100 : 0;
    const status = getStatus(stats, metric);

    return {
      ...metric,
      stats,
      inBandCount,
      inBandPct,
      status,
    };
  });

  const okCount = metricResults.filter(metric => metric.status === 'ok').length;
  const tooLowCount = metricResults.filter(metric => metric.status === 'too_low').length;
  const tooHighCount = metricResults.filter(metric => metric.status === 'too_high').length;
  const noDataCount = metricResults.filter(metric => metric.status === 'no_data').length;
  const healthScore = metricResults.length > 0
    ? Math.round((okCount / metricResults.length) * 1000) / 10
    : 0;

  return {
    profile,
    metrics: metricResults,
    summary: {
      total: metricResults.length,
      ok: okCount,
      tooLow: tooLowCount,
      tooHigh: tooHighCount,
      noData: noDataCount,
      healthScore,
    },
  };
}

export function computeMetricStats(runSummaries, path) {
  const values = runSummaries
    .map(summary => getByPath(summary, path))
    .filter(value => typeof value === 'number' && Number.isFinite(value));
  return computeStats(values);
}
