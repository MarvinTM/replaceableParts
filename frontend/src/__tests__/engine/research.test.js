
import { describe, it, expect } from 'vitest';
import {
  engine,
  defaultRules,
  createTestState
} from '../testHelpers';
import { calculatePassiveDiscoveryChanceDetails } from '../../engine/engine';
import { getRecipeAge, getTargetedExperimentCostForRecipe } from '../../utils/researchCosts';

describe('Research: DONATE_CREDITS', () => {
  it('should convert credits to RP at configured ratio', () => {
    const state = createTestState({
      credits: 100,
      research: { researchPoints: 0, awaitingPrototype: [] }
    });
    // Ratio is 2 credits = 1 RP
    const amount = 20;

    const result = engine(state, defaultRules, {
      type: 'DONATE_CREDITS',
      payload: { amount }
    });

    expect(result.state.credits).toBe(80);
    expect(result.state.research.researchPoints).toBe(10);
  });

  it('should fail when not enough credits', () => {
    const state = createTestState({
      credits: 10
    });

    const result = engine(state, defaultRules, {
      type: 'DONATE_CREDITS',
      payload: { amount: 20 }
    });

    expect(result.error).toBeDefined();
  });
});

describe('Research: DONATE_PARTS', () => {
  it('should convert items to RP with age multiplier', () => {
    const state = createTestState({
      inventory: { iron_ingot: 10 },
      research: { researchPoints: 0, awaitingPrototype: [] }
    });

    // iron_ingot: basePrice 8, age 1 (multiplier 1.0)
    // 8 * 1.0 * 5 = 40 RP
    
    const result = engine(state, defaultRules, {
      type: 'DONATE_PARTS',
      payload: { itemId: 'iron_ingot', quantity: 5 }
    });

    expect(result.state.inventory.iron_ingot).toBe(5);
    expect(result.state.research.researchPoints).toBe(40);
  });
  
  it('should fail for raw materials', () => {
     const state = createTestState({
      inventory: { wood: 10 }
    });
    // wood is raw
    
    const result = engine(state, defaultRules, {
      type: 'DONATE_PARTS',
      payload: { itemId: 'wood', quantity: 5 }
    });
    
    expect(result.error).toBeDefined();
  });
});

describe('Research: RUN_EXPERIMENT', () => {
  it('should discover a random recipe and deduct RP', () => {
    const state = createTestState({
      research: { researchPoints: 1000, awaitingPrototype: [] },
      discoveredRecipes: [],
      unlockedRecipes: []
    });

    const result = engine(state, defaultRules, {
      type: 'RUN_EXPERIMENT'
    });

    expect(result.state.discoveredRecipes.length).toBe(1);
    expect(result.state.research.researchPoints).toBeLessThan(1000);
    expect(result.state.research.awaitingPrototype.length).toBe(1);
  });

  it('should fail when not enough RP', () => {
    const state = createTestState({
      research: { researchPoints: 0 }
    });

    const result = engine(state, defaultRules, {
      type: 'RUN_EXPERIMENT'
    });

    expect(result.error).toBeDefined();
  });

  it('should be able to discover generator blueprint recipes (windmill)', () => {
    const allRecipeIdsExceptWindmill = defaultRules.recipes
      .map(recipe => recipe.id)
      .filter(id => id !== 'windmill');

    const state = createTestState({
      research: { researchPoints: 1000, awaitingPrototype: [] },
      discoveredRecipes: allRecipeIdsExceptWindmill,
      unlockedRecipes: allRecipeIdsExceptWindmill
    });

    const result = engine(state, defaultRules, {
      type: 'RUN_EXPERIMENT'
    });

    expect(result.error).toBeNull();
    expect(result.state.discoveredRecipes).toContain('windmill');
    expect(result.state.research.awaitingPrototype.some(p => p.recipeId === 'windmill')).toBe(true);
  });
});

describe('Research: RUN_TARGETED_EXPERIMENT', () => {
  it('should discover specific recipe', () => {
    // Find a recipe that is not discovered/unlocked
    const targetRecipe = defaultRules.recipes.find(r => r.age === 1);
    
    const state = createTestState({
      research: { researchPoints: 1000, awaitingPrototype: [] },
      discoveredRecipes: [],
      unlockedRecipes: []
    });

    const result = engine(state, defaultRules, {
      type: 'RUN_TARGETED_EXPERIMENT',
      payload: { recipeId: targetRecipe.id }
    });

    expect(result.state.discoveredRecipes).toContain(targetRecipe.id);
    expect(result.state.research.awaitingPrototype.some(p => p.recipeId === targetRecipe.id)).toBe(true);
  });

  it('should price targeted experiments using the target recipe age, not highest unlocked age', () => {
    const nonStructureRecipes = defaultRules.recipes.filter((recipe) => {
      return !defaultRules.machineRecipes?.[recipe.id] && !defaultRules.generatorRecipes?.[recipe.id];
    });
    const highestAgeRecipe = [...nonStructureRecipes]
      .sort((a, b) => getRecipeAge(b, defaultRules) - getRecipeAge(a, defaultRules))[0];
    const oldAgeRecipe = nonStructureRecipes.find((recipe) => {
      return getRecipeAge(recipe, defaultRules) === 1 && recipe.id !== highestAgeRecipe?.id;
    });

    expect(highestAgeRecipe).toBeDefined();
    expect(oldAgeRecipe).toBeDefined();

    const targetedCost = getTargetedExperimentCostForRecipe(oldAgeRecipe, defaultRules);
    const state = createTestState({
      research: { researchPoints: 1000, awaitingPrototype: [] },
      discoveredRecipes: [],
      unlockedRecipes: [highestAgeRecipe.id]
    });

    const result = engine(state, defaultRules, {
      type: 'RUN_TARGETED_EXPERIMENT',
      payload: { recipeId: oldAgeRecipe.id }
    });

    expect(result.error).toBeNull();
    expect(result.state.research.researchPoints).toBe(1000 - targetedCost);
    expect(result.state.discoveredRecipes).toContain(oldAgeRecipe.id);
  });

  it('should use the target recipe age cost in insufficient RP errors', () => {
    const nonStructureRecipes = defaultRules.recipes.filter((recipe) => {
      return !defaultRules.machineRecipes?.[recipe.id] && !defaultRules.generatorRecipes?.[recipe.id];
    });
    const highestAgeRecipe = [...nonStructureRecipes]
      .sort((a, b) => getRecipeAge(b, defaultRules) - getRecipeAge(a, defaultRules))[0];
    const oldAgeRecipe = nonStructureRecipes.find((recipe) => {
      return getRecipeAge(recipe, defaultRules) === 1 && recipe.id !== highestAgeRecipe?.id;
    });

    expect(highestAgeRecipe).toBeDefined();
    expect(oldAgeRecipe).toBeDefined();

    const targetedCost = getTargetedExperimentCostForRecipe(oldAgeRecipe, defaultRules);
    const state = createTestState({
      research: { researchPoints: targetedCost - 1, awaitingPrototype: [] },
      discoveredRecipes: [],
      unlockedRecipes: [highestAgeRecipe.id]
    });

    const result = engine(state, defaultRules, {
      type: 'RUN_TARGETED_EXPERIMENT',
      payload: { recipeId: oldAgeRecipe.id }
    });

    expect(result.error).toBe(`Not enough Research Points (need ${targetedCost} RP)`);
  });
});

describe('Research: FILL_PROTOTYPE_SLOT', () => {
  it('should fill slot from inventory', () => {
    // Create a state with a slots-mode prototype
    const recipe = defaultRules.recipes.find(r => r.id === 'iron_ingot'); // Has 1 intermediate output from raw? No iron_ingot takes iron_ore (raw).
    // Need a recipe with non-raw input to be slots mode. 
    // iron_plate takes iron_ingot (intermediate).
    const targetRecipe = defaultRules.recipes.find(r => r.id === 'iron_plate');
    
    // Manually add prototype to state
    const prototype = {
        recipeId: targetRecipe.id,
        mode: 'slots',
        slots: [
            { material: 'iron_ingot', quantity: 6, filled: 0 } // quantity is inputs * multiplier (2 * 3 = 6)
        ]
    };
    
    const state = createTestState({
        inventory: { iron_ingot: 10 },
        research: { 
            active: false,
            researchPoints: 0,
            awaitingPrototype: [prototype] 
        }
    });
    
    const result = engine(state, defaultRules, {
        type: 'FILL_PROTOTYPE_SLOT',
        payload: { recipeId: targetRecipe.id, materialId: 'iron_ingot', quantity: 2 }
    });
    
    const updatedProto = result.state.research.awaitingPrototype[0];
    expect(updatedProto.slots[0].filled).toBe(2);
    expect(result.state.inventory.iron_ingot).toBe(8);
  });
  
  it('should complete prototype when all slots filled', () => {
     const targetRecipe = defaultRules.recipes.find(r => r.id === 'iron_plate');
     
      const prototype = {
        recipeId: targetRecipe.id,
        mode: 'slots',
        slots: [
            { material: 'iron_ingot', quantity: 6, filled: 4 }
        ]
    };
    
    const state = createTestState({
        inventory: { iron_ingot: 10 },
        unlockedRecipes: [],
        research: { 
            active: false,
            researchPoints: 0,
            awaitingPrototype: [prototype] 
        }
    });
    
    const result = engine(state, defaultRules, {
        type: 'FILL_PROTOTYPE_SLOT',
        payload: { recipeId: targetRecipe.id, materialId: 'iron_ingot', quantity: 2 }
    });
    
    // Should be removed from awaiting
    expect(result.state.research.awaitingPrototype.length).toBe(0);
    // Should be unlocked
    expect(result.state.unlockedRecipes).toContain(targetRecipe.id);
  });
});

describe('Research: TOGGLE_RESEARCH', () => {
  it('should toggle research active state', () => {
    const state = createTestState({
      research: { active: false }
    });

    const result = engine(state, defaultRules, {
      type: 'TOGGLE_RESEARCH',
      payload: { active: true }
    });

    expect(result.state.research.active).toBe(true);
  });
});

describe('Research: PASSIVE_DISCOVERY_BALANCING', () => {
  it('should apply diminishing returns and hard-cap passive discovery chance', () => {
    const state = createTestState({
      research: {
        active: false,
        researchPoints: 0,
        awaitingPrototype: [],
        prototypeBoost: { bonus: 5000, ticksRemaining: 30 }
      }
    });

    const rules = structuredClone(defaultRules);
    rules.research.passiveDiscoveryMaxChance = 0.01;

    const details = calculatePassiveDiscoveryChanceDetails(state, rules);

    expect(details.effectivePrototypeBoostPercent).toBeLessThanOrEqual(rules.research.prototypeBoostMaxPercent);
    expect(details.effectiveChance).toBeCloseTo(rules.research.passiveDiscoveryMaxChance, 8);
  });

  it('should consume stored prototype boost on passive discovery success', () => {
    const rules = structuredClone(defaultRules);
    rules.research.passiveDiscoveryChance = 1;
    rules.research.passiveDiscoveryMaxChance = 1;
    rules.research.prototypeBoostConsumeOnPassiveSuccess = 0.6;

    const state = createTestState({
      rngSeed: 12345,
      research: {
        active: false,
        researchPoints: 0,
        awaitingPrototype: [],
        prototypeBoost: { bonus: 1000, ticksRemaining: 10 }
      }
    });

    const result = engine(state, rules, { type: 'SIMULATE' });

    expect(result.error).toBeNull();
    expect(result.state.discoveredRecipes.length).toBe(state.discoveredRecipes.length + 1);
    expect(result.state.research.prototypeBoost.bonus).toBe(400);
  });
});
