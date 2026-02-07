/**
 * Aggregate current raw-material income from active extraction nodes.
 *
 * @param {Array<{resourceType?: string, rate?: number, active?: boolean}>} extractionNodes
 * @param {Array<{id: string, category?: string}>} materials
 * @returns {Array<{materialId: string, rate: number}>}
 */
export function calculateRawMaterialIncome(extractionNodes = [], materials = []) {
  const rawMaterialIds = new Set(
    materials
      .filter(material => material?.category === 'raw')
      .map(material => material.id)
  );

  const incomeByMaterial = new Map();

  for (const node of extractionNodes) {
    if (!node?.active || !rawMaterialIds.has(node.resourceType)) continue;

    const numericRate = Number(node.rate);
    if (!Number.isFinite(numericRate) || numericRate <= 0) continue;

    const current = incomeByMaterial.get(node.resourceType) || 0;
    incomeByMaterial.set(node.resourceType, current + numericRate);
  }

  return Array.from(incomeByMaterial.entries())
    .map(([materialId, rate]) => ({ materialId, rate }))
    .sort((a, b) => a.materialId.localeCompare(b.materialId));
}

