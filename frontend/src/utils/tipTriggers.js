const LOW_ENERGY_THRESHOLD = 0.75;
const LOW_PRODUCTION_THRESHOLD = 0.75;

function toSafeNumber(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, numeric);
}

export function getEnergyTipLevel({
  produced = 0,
  consumed = 0,
  lowThreshold = LOW_ENERGY_THRESHOLD,
} = {}) {
  const safeProduced = toSafeNumber(produced);
  const safeConsumed = toSafeNumber(consumed);
  const threshold = Number.isFinite(lowThreshold) ? lowThreshold : LOW_ENERGY_THRESHOLD;

  if (safeConsumed <= 0) return 'normal';
  if (safeProduced <= 0 || safeConsumed > safeProduced) return 'negative';

  const usageRatio = safeConsumed / safeProduced;
  if (usageRatio >= threshold) return 'low';

  return 'normal';
}

export function hasLowProduction(produced, consumed, threshold = LOW_PRODUCTION_THRESHOLD) {
  const safeProduced = toSafeNumber(produced);
  const safeConsumed = toSafeNumber(consumed);
  const safeThreshold = Number.isFinite(threshold) ? threshold : LOW_PRODUCTION_THRESHOLD;

  if (safeConsumed <= 0) return false;
  if (safeProduced <= 0) return true;

  return (safeConsumed / safeProduced) >= safeThreshold;
}

export function hasLowRawMaterialProduction(rawMaterialBalance = [], threshold = LOW_PRODUCTION_THRESHOLD) {
  return rawMaterialBalance.some(({ produced, consumed }) => hasLowProduction(produced, consumed, threshold));
}

export function hasLowPartsProduction(materialThroughput = new Map(), threshold = LOW_PRODUCTION_THRESHOLD) {
  const entries = materialThroughput instanceof Map
    ? materialThroughput.values()
    : materialThroughput;

  for (const entry of entries) {
    if (!entry) continue;
    if (hasLowProduction(entry.produced, entry.consumed, threshold)) {
      return true;
    }
  }

  return false;
}
