/**
 * Calculate raw material balance (supply vs demand) for the Factory HUD.
 *
 * @param {object} params
 * @param {Array} params.machines       – deployed machine instances from engine state
 * @param {Array} params.generators     – deployed generator instances from engine state
 * @param {Array} params.extractionNodes – active extraction nodes from engine state
 * @param {Array} params.materials      – material definitions from rules
 * @param {Array} params.recipes        – recipe definitions from rules
 * @param {Array} params.generatorConfigs – generator definitions from rules
 * @returns {Array<{materialId: string, produced: number, consumed: number}>}
 */
export function calculateRawMaterialBalance({
  machines = [],
  generators = [],
  extractionNodes = [],
  materials = [],
  recipes = [],
  generatorConfigs = [],
}) {
  const rawMaterialIds = new Set(
    materials
      .filter(m => m?.category === 'raw')
      .map(m => m.id)
  );

  // --- Supply: sum extraction node rates for raw materials ---
  const produced = new Map();
  for (const node of extractionNodes) {
    if (!node?.active || !rawMaterialIds.has(node.resourceType)) continue;
    const rate = Number(node.rate);
    if (!Number.isFinite(rate) || rate <= 0) continue;
    produced.set(node.resourceType, (produced.get(node.resourceType) || 0) + rate);
  }

  // Only report materials that have active extraction (supply > 0)
  if (produced.size === 0) return [];

  // --- Demand: machines with recipes + generators with fuel ---
  const consumed = new Map();

  // Machine recipe demand (enabled machines only)
  for (const machine of machines) {
    if (!machine.recipeId || !machine.enabled) continue;
    const recipe = recipes.find(r => r.id === machine.recipeId);
    if (!recipe?.inputs) continue;
    for (const [matId, qty] of Object.entries(recipe.inputs)) {
      if (!rawMaterialIds.has(matId)) continue;
      consumed.set(matId, (consumed.get(matId) || 0) + qty);
    }
  }

  // Generator fuel demand
  for (const generator of generators) {
    const config = generatorConfigs.find(g => g.id === generator.type);
    if (!config?.fuelRequirement) continue;
    const { materialId, consumptionRate } = config.fuelRequirement;
    if (!rawMaterialIds.has(materialId)) continue;
    consumed.set(materialId, (consumed.get(materialId) || 0) + consumptionRate);
  }

  // Build result: only materials with active extraction
  return Array.from(produced.keys())
    .sort((a, b) => a.localeCompare(b))
    .map(materialId => ({
      materialId,
      produced: produced.get(materialId) || 0,
      consumed: consumed.get(materialId) || 0,
    }));
}
