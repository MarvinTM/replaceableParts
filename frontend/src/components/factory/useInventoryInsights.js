import { useMemo } from 'react';
import { getMaterialName } from '../../utils/translationHelpers';

function getMaxStack(material, inventoryCapacity) {
  if (!Number.isFinite(inventoryCapacity) || inventoryCapacity <= 0) {
    return null;
  }
  const weight = Number(material?.weight);
  const safeWeight = Number.isFinite(weight) && weight > 0 ? weight : 1;
  return Math.max(1, Math.floor(inventoryCapacity / safeWeight));
}

function calculateSeverity({ fillRatio, consumed, produced }) {
  const deficit = Math.max(0, consumed - produced);
  const lowFillPenalty = Math.max(0, 0.2 - (fillRatio ?? 1)) * 100;
  const throughputWeight = consumed > 0 ? Math.log(consumed + 1) * 5 : 0;
  return deficit * 3 + lowFillPenalty + throughputWeight;
}

export default function useInventoryInsights({
  inventory,
  materialsById,
  materialThroughput,
  inventoryCapacity,
}) {
  return useMemo(() => {
    const inventoryById = inventory || {};
    const itemIds = new Set(Object.keys(inventoryById));

    for (const itemId of materialThroughput.keys()) {
      itemIds.add(itemId);
    }

    const rows = [...itemIds].map((itemId) => {
      const quantity = Number(inventoryById[itemId]) || 0;
      const material = materialsById.get(itemId);
      const category = material?.category || 'unknown';
      const name = getMaterialName(itemId, material?.name);
      const tp = materialThroughput.get(itemId);
      const produced = Number(tp?.produced) || 0;
      const consumed = Number(tp?.consumed) || 0;
      const hasThroughput = produced > 0 || consumed > 0;
      const deficit = consumed > produced;
      const isFinalUsedAsPart = category === 'final' && consumed > 0;
      const isBottleneckEligible = category !== 'final' || isFinalUsedAsPart;
      const maxStack = getMaxStack(material, inventoryCapacity);
      const fillRatio = maxStack ? Math.min((Number(quantity) || 0) / maxStack, 1) : null;
      const severity = calculateSeverity({ fillRatio, consumed, produced });

      return {
        itemId,
        quantity: Number(quantity) || 0,
        category,
        name,
        material,
        produced,
        consumed,
        hasThroughput,
        deficit,
        isFinalUsedAsPart,
        isBottleneckEligible,
        maxStack,
        fillRatio,
        severity,
      };
    });

    const readyToShip = rows
      .filter((row) => row.category === 'final' && row.quantity > 0)
      .sort((a, b) => b.quantity - a.quantity || a.name.localeCompare(b.name));

    const bottlenecks = rows
      .filter((row) => row.isBottleneckEligible)
      .filter((row) => row.deficit || (row.consumed > 0 && row.fillRatio !== null && row.fillRatio <= 0.15))
      .sort((a, b) =>
        Number(b.deficit) - Number(a.deficit)
        || b.severity - a.severity
        || a.name.localeCompare(b.name)
      );

    const stockpile = rows
      .filter((row) => row.quantity > 0 && (row.category !== 'final' || row.isFinalUsedAsPart))
      .sort((a, b) => {
        const fillRatioA = Number.isFinite(a.fillRatio) ? a.fillRatio : -1;
        const fillRatioB = Number.isFinite(b.fillRatio) ? b.fillRatio : -1;
        const isHighStockA = fillRatioA >= 0.85;
        const isHighStockB = fillRatioB >= 0.85;
        return Number(isHighStockB) - Number(isHighStockA)
          || (fillRatioB - fillRatioA)
          || (b.quantity - a.quantity)
          || a.name.localeCompare(b.name);
      });

    return {
      rows,
      readyToShip,
      bottlenecks,
      stockpile,
    };
  }, [inventory, materialsById, materialThroughput, inventoryCapacity]);
}
