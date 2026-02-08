const DEFAULT_NODE_RATE_RANGE = {
  min: 1,
  max: 2
};

function toPositiveInteger(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  return Math.floor(numeric);
}

function getNodeRateRange(rules) {
  const configured = rules?.exploration?.nodeRateRange || {};
  const configuredMin = toPositiveInteger(configured.min);
  const configuredMax = toPositiveInteger(configured.max);

  const min = configuredMin ?? DEFAULT_NODE_RATE_RANGE.min;
  const max = configuredMax ?? DEFAULT_NODE_RATE_RANGE.max;

  return {
    min: Math.min(min, max),
    max: Math.max(min, max)
  };
}

export function getStandardizedNodeRate(resourceType, rules) {
  const configuredRates = rules?.exploration?.fixedNodeRatesByResource;
  const explicit = toPositiveInteger(configuredRates?.[resourceType]);
  if (explicit !== null) return explicit;

  // Standardization rule: all nodes use the maximum value from the configured interval.
  return getNodeRateRange(rules).max;
}

export function normalizeExtractionNodeRatesInState(state, rules) {
  if (!state || typeof state !== 'object') return state;

  if (Array.isArray(state.extractionNodes)) {
    for (const node of state.extractionNodes) {
      if (!node || typeof node.resourceType !== 'string') continue;
      node.rate = getStandardizedNodeRate(node.resourceType, rules);
    }
  }

  const tiles = state.explorationMap?.tiles;
  if (tiles && typeof tiles === 'object') {
    for (const tile of Object.values(tiles)) {
      const node = tile?.extractionNode;
      if (!node || typeof node.resourceType !== 'string') continue;
      node.rate = getStandardizedNodeRate(node.resourceType, rules);
    }
  }

  return state;
}
