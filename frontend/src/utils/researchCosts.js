/**
 * Shared research cost helpers used by engine, UI, and balancing scripts.
 */

export function getRecipeAge(recipe, rules) {
  const declaredAge = Number.isFinite(recipe?.age) && recipe.age > 0
    ? recipe.age
    : 1;

  if (!recipe?.outputs || !rules?.materials) {
    return declaredAge;
  }

  let derivedAge = 1;
  for (const outputId of Object.keys(recipe.outputs)) {
    const material = rules.materials.find((m) => m.id === outputId);
    if (material && material.age > derivedAge) {
      derivedAge = material.age;
    }
  }

  // Respect explicit recipe age while still guarding against underspecified entries.
  return Math.max(declaredAge, derivedAge);
}

export function getExperimentCostForAge(age, rules) {
  const costs = rules?.research?.experimentCosts || {};
  return costs[age] || costs[1] || 0;
}

export function getTargetedExperimentCostForRecipe(recipe, rules) {
  const recipeAge = getRecipeAge(recipe, rules);
  const baseCost = getExperimentCostForAge(recipeAge, rules);
  const multiplier = rules?.research?.targetedExperimentMultiplier || 10;
  return baseCost * multiplier;
}
