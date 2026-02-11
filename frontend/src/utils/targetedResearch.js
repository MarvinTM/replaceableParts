import { getRecipeAge, getTargetedExperimentCostForRecipe } from './researchCosts.js';

/**
 * Build targeted-research candidates grouped by type:
 * - materialRecipes: recipes that produce currently missing input materials.
 * - productionEnablers: machine blueprints that unblock discovered/unlocked recipes
 *   that currently have no buildable machine path.
 */
export function getEligibleTargetedResearchOptions({
  rules,
  discoveredRecipes = [],
  unlockedRecipes = [],
  maxRecipeAge = Infinity,
}) {
  if (!rules?.recipes || !rules?.materials) {
    return { materialRecipes: [], productionEnablers: [] };
  }

  const recipeMap = new Map(rules.recipes.map(recipe => [recipe.id, recipe]));
  const materialMap = new Map(rules.materials.map(material => [material.id, material]));
  const discoveredOrUnlocked = new Set([...(discoveredRecipes || []), ...(unlockedRecipes || [])]);
  const unlockedSet = new Set(unlockedRecipes || []);

  const materialRecipes = getMissingInputTargets({
    rules,
    recipeMap,
    materialMap,
    discoveredOrUnlocked,
    maxRecipeAge,
  });

  const productionEnablers = getProductionEnablerTargets({
    rules,
    recipeMap,
    materialMap,
    discoveredOrUnlocked,
    unlockedSet,
    maxRecipeAge,
  });

  return { materialRecipes, productionEnablers };
}

function getMissingInputTargets({
  rules,
  recipeMap,
  materialMap,
  discoveredOrUnlocked,
  maxRecipeAge,
}) {
  const neededInputMaterials = new Set();

  for (const recipeId of discoveredOrUnlocked) {
    const recipe = recipeMap.get(recipeId);
    if (!recipe?.inputs) continue;

    for (const inputMaterialId of Object.keys(recipe.inputs)) {
      neededInputMaterials.add(inputMaterialId);
    }
  }

  const eligibleRecipes = [];

  for (const recipe of recipeMap.values()) {
    if (discoveredOrUnlocked.has(recipe.id)) continue;
    const recipeAge = getRecipeAge(recipe, rules);
    if (recipeAge > maxRecipeAge) continue;

    const outputMaterialIds = Object.keys(recipe.outputs || {});
    const outputId = outputMaterialIds[0];
    if (!outputId) continue;

    if (!outputMaterialIds.some(id => neededInputMaterials.has(id))) continue;

    const material = materialMap.get(outputId);
    const neededBy = [];

    for (const discoveredRecipeId of discoveredOrUnlocked) {
      const discoveredRecipe = recipeMap.get(discoveredRecipeId);
      if (!discoveredRecipe?.inputs || !(outputId in discoveredRecipe.inputs)) continue;

      const downstreamOutputId = Object.keys(discoveredRecipe.outputs || {})[0];
      neededBy.push(downstreamOutputId || discoveredRecipe.id);
    }

    eligibleRecipes.push({
      type: 'material',
      recipe,
      outputId,
      materialName: material?.name || recipe.id,
      recipeAge,
      materialAge: material?.age,
      category: material?.category || 'intermediate',
      neededBy,
      targetedCost: getTargetedExperimentCostForRecipe(recipe, rules),
    });
  }

  return eligibleRecipes;
}

function getProductionEnablerTargets({
  rules,
  recipeMap,
  materialMap,
  discoveredOrUnlocked,
  unlockedSet,
  maxRecipeAge,
}) {
  const machinesByRecipeId = new Map();

  for (const machine of rules.machines || []) {
    if (machine?.disabled) continue;

    for (const recipeId of machine.allowedRecipes || []) {
      if (!machinesByRecipeId.has(recipeId)) {
        machinesByRecipeId.set(recipeId, []);
      }
      machinesByRecipeId.get(recipeId).push(machine);
    }
  }

  const blockedByMachineId = new Map();

  for (const recipeId of discoveredOrUnlocked) {
    const recipe = recipeMap.get(recipeId);
    if (!recipe) continue;

    const requiredMachines = machinesByRecipeId.get(recipe.id) || [];
    if (requiredMachines.length === 0) continue;

    const hasUnlockedMachinePath = requiredMachines.some(machine => unlockedSet.has(machine.id));
    if (hasUnlockedMachinePath) continue;

    const blockedOutputId = Object.keys(recipe.outputs || {})[0] || recipe.id;

    for (const machine of requiredMachines) {
      if (!blockedByMachineId.has(machine.id)) {
        blockedByMachineId.set(machine.id, new Set());
      }
      blockedByMachineId.get(machine.id).add(blockedOutputId);
    }
  }

  const enablers = [];

  for (const [machineId, blockedOutputs] of blockedByMachineId.entries()) {
    if (discoveredOrUnlocked.has(machineId)) continue;

    const recipe = recipeMap.get(machineId);
    if (!recipe) continue;
    const recipeAge = getRecipeAge(recipe, rules);
    if (recipeAge > maxRecipeAge) continue;

    const outputId = Object.keys(recipe.outputs || {})[0] || machineId;
    const material = materialMap.get(outputId);
    const neededBy = Array.from(blockedOutputs);

    enablers.push({
      type: 'enabler',
      structureId: machineId,
      recipe,
      outputId,
      materialName: material?.name || machineId,
      recipeAge,
      materialAge: material?.age,
      category: material?.category || 'equipment',
      neededBy,
      blockedCount: neededBy.length,
      targetedCost: getTargetedExperimentCostForRecipe(recipe, rules),
    });
  }

  return enablers;
}
