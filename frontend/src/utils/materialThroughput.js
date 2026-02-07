/**
 * Calculate per-material produced/consumed rates for non-raw materials.
 *
 * @param {object} params
 * @param {Array} params.machines  – deployed machine instances from engine state
 * @param {Array} params.materials – material definitions from rules
 * @param {Array} params.recipes   – recipe definitions from rules
 * @returns {Map<string, {produced: number, consumed: number}>}
 */
export function calculateMaterialThroughput({
  machines = [],
  materials = [],
  recipes = [],
}) {
  const rawMaterialIds = new Set(
    materials
      .filter(m => m?.category === 'raw')
      .map(m => m.id)
  );

  const throughput = new Map();

  for (const machine of machines) {
    if (!machine.recipeId || !machine.enabled) continue;
    const recipe = recipes.find(r => r.id === machine.recipeId);
    if (!recipe) continue;

    // Outputs: add to produced for non-raw materials
    if (recipe.outputs) {
      for (const [matId, qty] of Object.entries(recipe.outputs)) {
        if (rawMaterialIds.has(matId)) continue;
        const entry = throughput.get(matId) || { produced: 0, consumed: 0 };
        entry.produced += qty;
        throughput.set(matId, entry);
      }
    }

    // Inputs: add to consumed for non-raw materials
    if (recipe.inputs) {
      for (const [matId, qty] of Object.entries(recipe.inputs)) {
        if (rawMaterialIds.has(matId)) continue;
        const entry = throughput.get(matId) || { produced: 0, consumed: 0 };
        entry.consumed += qty;
        throughput.set(matId, entry);
      }
    }
  }

  return throughput;
}
