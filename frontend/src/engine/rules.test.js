import { describe, it, expect } from 'vitest';
import { analyzeIssues } from '../utils/graphAnalysis';
import { defaultRules } from './defaultRules';
import { initialState } from './initialState';

describe('Game Rules Validation', () => {
  const issues = analyzeIssues(defaultRules, initialState);

  it('should have no missing materials', () => {
    expect(issues.missingMaterials, `Missing materials: ${issues.missingMaterials.join(', ')}`).toEqual([]);
  });

  it('should have no unproduceable materials', () => {
    // We map to names for better error messages
    const names = issues.unproduceable.map(id => defaultRules.materials.find(m => m.id === id)?.name || id);
    expect(issues.unproduceable, `Unproduceable materials: ${names.join(', ')}`).toEqual([]);
  });

  it('should have no recipes missing machines', () => {
    expect(issues.recipesMissingMachine, `Recipes missing machines: ${issues.recipesMissingMachine.join(', ')}`).toEqual([]);
  });

  it('should have no outputs without machines', () => {
    expect(issues.noMachineOutputs, `Outputs with no machine: ${issues.noMachineOutputs.join(', ')}`).toEqual([]);
  });

  it('should have no unused parts', () => {
    const names = issues.unusedParts.map(id => defaultRules.materials.find(m => m.id === id)?.name || id);
    expect(issues.unusedParts, `Unused parts: ${names.join(', ')}`).toEqual([]);
  });

  it('should have no recipes with zero quantity inputs/outputs', () => {
    const formatted = issues.recipesWithZeroQuantity.map(i => `${i.recipeId} (Zero In: ${i.zeroInputs}, Zero Out: ${i.zeroOutputs})`);
    expect(issues.recipesWithZeroQuantity, `Recipes with zero quantity: ${formatted.join(', ')}`).toEqual([]);
  });

  it('should have no intermediate parts not used in their own age', () => {
    const formatted = issues.intermediateNotUsedInAge.map(i => `${i.name} (Age ${i.age})`);
    expect(issues.intermediateNotUsedInAge, `Intermediates not used in age: ${formatted.join(', ')}`).toEqual([]);
  });

  it('should have no machine age mismatches', () => {
    const formatted = issues.recipeAgeIssues.map(i => `Recipe ${i.recipeId} (Age ${i.recipeAge}) needs Machine Age ${i.minMachineAge}`);
    expect(issues.recipeAgeIssues, `Machine age mismatches: ${formatted.join('; ')}`).toEqual([]);
  });

  it('should have no circular machine dependencies', () => {
    const formatted = issues.machineCycleIssues.map(i => {
      if (i.type === 'self_dependency') {
        return `${i.machineName}: ${i.reason}`;
      } else {
        return `Cycle: ${i.cycle}`;
      }
    });
    expect(issues.machineCycleIssues, `Circular dependencies: ${formatted.join('; ')}`).toEqual([]);
  });
});
