const LOW_ENERGY_THRESHOLD = 0.75;
const LOW_PRODUCTION_THRESHOLD = 0.75;
const SATURATED_MARKET_THRESHOLD = 0.8;

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

export function hasMachineWithoutRecipeAssigned({
  machines = [],
  machineConfigs = [],
} = {}) {
  const configById = new Map(machineConfigs.map(config => [config.id, config]));

  return machines.some((machine) => {
    if (!machine?.enabled) return false;
    if (machine.recipeId) return false;

    const machineConfig = configById.get(machine.type);
    return !machineConfig?.isResearchFacility;
  });
}

export function hasGeneratorOutOfFuel({
  generators = [],
  generatorConfigs = [],
} = {}) {
  const configById = new Map(generatorConfigs.map(config => [config.id, config]));

  return generators.some((generator) => {
    const config = configById.get(generator?.type);
    if (!config?.fuelRequirement) return false;
    return generator.powered === false;
  });
}

export function hasPrototypeReadyForParts({
  awaitingPrototype = [],
  inventory = {},
  materials = [],
} = {}) {
  const rawMaterialIds = new Set(
    materials
      .filter(material => material?.category === 'raw')
      .map(material => material.id)
  );

  for (const prototype of awaitingPrototype) {
    if (prototype?.mode !== 'slots' || !Array.isArray(prototype.slots)) continue;

    for (const slot of prototype.slots) {
      if (!slot?.material) continue;

      const isRaw = slot.isRaw === true || rawMaterialIds.has(slot.material);
      if (isRaw) continue;

      const required = toSafeNumber(slot.quantity);
      const filled = toSafeNumber(slot.filled);
      if (filled >= required) continue;

      if (toSafeNumber(inventory[slot.material]) > 0) {
        return true;
      }
    }
  }

  return false;
}

export function hasAffordableLockedExplorationNode({
  explorationMap = null,
  extractionNodes = [],
  credits = 0,
  relevantResourceIds = null,
  getUnlockCost,
} = {}) {
  if (!explorationMap?.tiles || typeof getUnlockCost !== 'function') return false;

  const affordableCredits = toSafeNumber(credits);
  const costByResource = new Map();

  for (const tile of Object.values(explorationMap.tiles)) {
    if (!tile?.explored || !tile?.extractionNode || tile.extractionNode.unlocked) continue;

    const resourceType = tile.extractionNode.resourceType;
    if (relevantResourceIds && relevantResourceIds.size > 0 && !relevantResourceIds.has(resourceType)) {
      continue;
    }

    if (!costByResource.has(resourceType)) {
      costByResource.set(resourceType, toSafeNumber(getUnlockCost(resourceType, extractionNodes)));
    }

    if (affordableCredits >= costByResource.get(resourceType)) {
      return true;
    }
  }

  return false;
}

export function hasMarketSaturationWarning({
  marketRecentSales = [],
  marketPopularity = {},
  tick = 0,
  recentTicks = 20,
  saturationThreshold = SATURATED_MARKET_THRESHOLD,
} = {}) {
  const currentTick = Number.isFinite(Number(tick)) ? Number(tick) : 0;
  const safeRecentTicks = Math.max(0, Number(recentTicks) || 0);
  const threshold = Number.isFinite(Number(saturationThreshold))
    ? Number(saturationThreshold)
    : SATURATED_MARKET_THRESHOLD;
  const windowStart = currentTick - safeRecentTicks;

  return marketRecentSales.some((sale) => {
    if (!sale?.itemId || !Number.isFinite(Number(sale.tick))) return false;
    if (sale.tick <= windowStart) return false;

    const popularity = Number(marketPopularity?.[sale.itemId]);
    const safePopularity = Number.isFinite(popularity) ? popularity : 1;

    return safePopularity <= threshold;
  });
}

export function hasMarketDiversificationOpportunity({
  marketRecentSales = [],
  tick = 0,
  diversificationWindow = 100,
  diversificationBonuses = {},
  inStockFinalGoodIds = [],
} = {}) {
  const currentTick = Number.isFinite(Number(tick)) ? Number(tick) : 0;
  const safeWindow = Math.max(0, Number(diversificationWindow) || 0);
  const windowStart = currentTick - safeWindow;

  const validSales = marketRecentSales.filter((sale) => (
    sale?.itemId &&
    Number.isFinite(Number(sale.tick)) &&
    sale.tick > windowStart
  ));

  const soldItemIds = new Set(validSales.map(sale => sale.itemId));
  const uniqueItemsSold = soldItemIds.size;

  const thresholds = Object.keys(diversificationBonuses)
    .map(Number)
    .filter(Number.isFinite)
    .sort((a, b) => a - b);

  const nextThreshold = thresholds.find(threshold => uniqueItemsSold < threshold);
  if (!nextThreshold) return false;

  if (nextThreshold - uniqueItemsSold !== 1) return false;

  return inStockFinalGoodIds.some(itemId => !soldItemIds.has(itemId));
}
