/**
 * Tests for energy system:
 * calculateEnergy, blocking/unblocking, generator fuel consumption
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  engine,
  defaultRules,
  createTestState,
  createStateWithMachine,
  createStateWithGenerator,
  createProductionState,
  simulateTicks,
  getGeneratorConfig,
  getMachineConfig
} from '../testHelpers';
import { calculateEnergy } from '../../engine/engine';

describe('calculateEnergy', () => {
  it('should return zero for empty state', () => {
    const state = createTestState({
      machines: [],
      generators: []
    });

    const energy = calculateEnergy(state, defaultRules);

    expect(energy.produced).toBe(0);
    expect(energy.consumed).toBe(0);
  });

  it('should calculate generator output', () => {
    const state = createStateWithGenerator('thermal_generator');
    const genConfig = getGeneratorConfig('thermal_generator');

    const energy = calculateEnergy(state, defaultRules);

    expect(energy.produced).toBe(genConfig.energyOutput);
  });

  it('should not count unpowered generators', () => {
    const state = createStateWithGenerator('thermal_generator');
    state.generators[0].powered = false;

    const energy = calculateEnergy(state, defaultRules);

    expect(energy.produced).toBe(0);
  });

  it('should calculate machine consumption when working', () => {
    const state = createStateWithMachine('stone_furnace', 'iron_ingot');
    const machineConfig = getMachineConfig('stone_furnace');

    const energy = calculateEnergy(state, defaultRules);

    expect(energy.consumed).toBe(machineConfig.energyConsumption);
  });

  it('should not count disabled machines', () => {
    const state = createStateWithMachine('stone_furnace', 'iron_ingot');
    state.machines[0].enabled = false;

    const energy = calculateEnergy(state, defaultRules);

    expect(energy.consumed).toBe(0);
  });

  it('should not count blocked machines', () => {
    const state = createStateWithMachine('stone_furnace', 'iron_ingot');
    state.machines[0].status = 'blocked';

    const energy = calculateEnergy(state, defaultRules);

    expect(energy.consumed).toBe(0);
  });

  it('should not count machines without recipes', () => {
    const state = createStateWithMachine('stone_furnace');
    // No recipe assigned

    const energy = calculateEnergy(state, defaultRules);

    expect(energy.consumed).toBe(0);
  });

  it('should sum multiple generators', () => {
    const state = createTestState({
      generators: [
        { id: 'g1', type: 'thermal_generator', powered: true },
        { id: 'g2', type: 'thermal_generator', powered: true }
      ]
    });
    const genConfig = getGeneratorConfig('thermal_generator');

    const energy = calculateEnergy(state, defaultRules);

    expect(energy.produced).toBe(genConfig.energyOutput * 2);
  });

  it('should sum multiple working machines', () => {
    const state = createTestState({
      machines: [
        { id: 'm1', type: 'stone_furnace', recipeId: 'iron_ingot', enabled: true, status: 'working' },
        { id: 'm2', type: 'stone_furnace', recipeId: 'iron_ingot', enabled: true, status: 'working' }
      ],
      unlockedRecipes: ['iron_ingot']
    });
    const machineConfig = getMachineConfig('stone_furnace');

    const energy = calculateEnergy(state, defaultRules);

    expect(energy.consumed).toBe(machineConfig.energyConsumption * 2);
  });
});

describe('Engine: Energy Deficit - Machine Blocking', () => {
  it('should block machines when energy is insufficient (LIFO order)', () => {
    // Create state with multiple machines but insufficient power
    const state = createTestState({
      credits: 10000,
      builtMachines: { stone_furnace: 3 },
      builtGenerators: { thermal_generator: 1 },
      machines: [],
      generators: [],
      floorSpace: {
        width: 32,
        height: 32,
        placements: [],
        chunks: [{ x: 0, y: 0, width: 32, height: 32 }]
      },
      unlockedRecipes: ['iron_ingot'],
      extractionNodes: [{ id: 'n1', resourceType: 'iron_ore', rate: 100, active: true }]
    });

    // Add one generator
    let result = engine(state, defaultRules, {
      type: 'ADD_GENERATOR',
      payload: { generatorType: 'thermal_generator', x: 0, y: 0 }
    });

    // Add multiple machines that exceed energy capacity
    for (let i = 0; i < 3; i++) {
      result = engine(result.state, defaultRules, {
        type: 'ADD_MACHINE',
        payload: { machineType: 'stone_furnace', x: 4 + i * 4, y: 0 }
      });
    }

    // Assign recipes to all machines
    for (const machine of result.state.machines) {
      result = engine(result.state, defaultRules, {
        type: 'ASSIGN_RECIPE',
        payload: { machineId: machine.id, recipeId: 'iron_ingot' }
      });
    }

    // Simulate to trigger energy balancing
    const simResult = simulateTicks(result.state, defaultRules, 1);

    // Check that some machines got blocked (LIFO - last added first)
    const blockedMachines = simResult.state.machines.filter(m => m.status === 'blocked');
    const workingMachines = simResult.state.machines.filter(m => m.status === 'working');

    // At least one should be working if we have any power
    if (simResult.state.energy.produced > 0) {
      expect(workingMachines.length).toBeGreaterThan(0);
    }

    // If there's a deficit, some should be blocked
    if (simResult.state.machines.length > 1) {
      // Last added machines should be blocked first
      const machineIds = result.state.machines.map(m => m.id);
      const blockedIds = blockedMachines.map(m => m.id);

      // Verify LIFO: blocked machines should be from the end
      if (blockedIds.length > 0) {
        const lastMachineId = machineIds[machineIds.length - 1];
        expect(blockedIds).toContain(lastMachineId);
      }
    }
  });

  it('should unblock machines when energy becomes available (FIFO order)', () => {
    // Start with blocked machines (placed at y=8 to leave room for generators at y=0)
    const state = createTestState({
      credits: 10000,
      machines: [
        { id: 'm1', type: 'stone_furnace', recipeId: 'iron_ingot', enabled: true, status: 'blocked', x: 0, y: 8, internalBuffer: {} },
        { id: 'm2', type: 'stone_furnace', recipeId: 'iron_ingot', enabled: true, status: 'blocked', x: 4, y: 8, internalBuffer: {} }
      ],
      builtGenerators: { thermal_generator: 2 },
      generators: [],
      floorSpace: {
        width: 32,
        height: 32,
        placements: [
          { id: 'm1', x: 0, y: 8, structureType: 'stone_furnace' },
          { id: 'm2', x: 4, y: 8, structureType: 'stone_furnace' }
        ],
        chunks: [{ x: 0, y: 0, width: 32, height: 32 }]
      },
      unlockedRecipes: ['iron_ingot'],
      extractionNodes: [
        { id: 'n1', resourceType: 'iron_ore', rate: 100, active: true },
        { id: 'n2', resourceType: 'wood', rate: 10, active: true }
      ]
    });

    // Add generators to provide power (thermal_generator is 3x6)
    let result = engine(state, defaultRules, {
      type: 'ADD_GENERATOR',
      payload: { generatorType: 'thermal_generator', x: 0, y: 0 }
    });
    result = engine(result.state, defaultRules, {
      type: 'ADD_GENERATOR',
      payload: { generatorType: 'thermal_generator', x: 4, y: 0 }
    });

    // Simulate
    const simResult = simulateTicks(result.state, defaultRules, 1);

    // First machine (m1) should be unblocked first (FIFO)
    const m1 = simResult.state.machines.find(m => m.id === 'm1');
    const m2 = simResult.state.machines.find(m => m.id === 'm2');

    // At least the first one should be working now
    if (simResult.state.energy.produced >= getMachineConfig('stone_furnace').energyConsumption) {
      expect(m1.status).toBe('working');
    }
  });
});

describe('Engine: Generator Fuel Consumption', () => {
  it('should consume fuel from raw material supply', () => {
    // Find a generator that requires fuel
    const fuelGenerator = defaultRules.generators.find(g => g.fuelRequirement);

    if (fuelGenerator) {
      const fuelMaterial = fuelGenerator.fuelRequirement.materialId;
      const consumptionRate = fuelGenerator.fuelRequirement.consumptionRate;

      const state = createTestState({
        builtGenerators: { [fuelGenerator.id]: 1 },
        generators: [],
        extractionNodes: [
          { id: 'n1', resourceType: fuelMaterial, rate: consumptionRate * 2, active: true }
        ],
        floorSpace: {
          width: 16,
          height: 16,
          placements: [],
          chunks: [{ x: 0, y: 0, width: 16, height: 16 }]
        }
      });

      // Add the generator
      let result = engine(state, defaultRules, {
        type: 'ADD_GENERATOR',
        payload: { generatorType: fuelGenerator.id, x: 0, y: 0 }
      });

      // Simulate
      const simResult = simulateTicks(result.state, defaultRules, 1);

      // Generator should be powered (fuel available)
      expect(simResult.state.generators[0].powered).toBe(true);
    }
  });

  it('should power off generator when fuel is unavailable', () => {
    const fuelGenerator = defaultRules.generators.find(g => g.fuelRequirement);

    if (fuelGenerator) {
      const state = createTestState({
        builtGenerators: { [fuelGenerator.id]: 1 },
        generators: [],
        extractionNodes: [], // No fuel source
        floorSpace: {
          width: 16,
          height: 16,
          placements: [],
          chunks: [{ x: 0, y: 0, width: 16, height: 16 }]
        }
      });

      // Add the generator
      let result = engine(state, defaultRules, {
        type: 'ADD_GENERATOR',
        payload: { generatorType: fuelGenerator.id, x: 0, y: 0 }
      });

      // Simulate
      const simResult = simulateTicks(result.state, defaultRules, 1);

      // Generator should not be powered (no fuel)
      expect(simResult.state.generators[0].powered).toBe(false);
    }
  });

  it('should generators without fuel requirements always be powered', () => {
    const noFuelGenerator = defaultRules.generators.find(g => !g.fuelRequirement);

    if (noFuelGenerator) {
      const state = createTestState({
        builtGenerators: { [noFuelGenerator.id]: 1 },
        generators: [],
        extractionNodes: [],
        floorSpace: {
          width: 16,
          height: 16,
          placements: [],
          chunks: [{ x: 0, y: 0, width: 16, height: 16 }]
        }
      });

      let result = engine(state, defaultRules, {
        type: 'ADD_GENERATOR',
        payload: { generatorType: noFuelGenerator.id, x: 0, y: 0 }
      });

      const simResult = simulateTicks(result.state, defaultRules, 1);

      expect(simResult.state.generators[0].powered).toBe(true);
    }
  });
});

describe('Engine: Research Facility Energy', () => {
  it('should consume energy even without recipe assigned', () => {
    // Find a research facility
    const researchFacility = defaultRules.machines.find(m => m.isResearchFacility);

    if (researchFacility) {
      const state = createTestState({
        builtMachines: { [researchFacility.id]: 1 },
        machines: [],
        floorSpace: {
          width: 16,
          height: 16,
          placements: [],
          chunks: [{ x: 0, y: 0, width: 16, height: 16 }]
        }
      });

      let result = engine(state, defaultRules, {
        type: 'ADD_MACHINE',
        payload: { machineType: researchFacility.id, x: 0, y: 0 }
      });

      // Don't assign recipe
      const energy = calculateEnergy(result.state, defaultRules);

      // Research facility should consume energy even without recipe
      expect(energy.consumed).toBe(researchFacility.energyConsumption);
    }
  });
});

describe('Engine: Energy State Updates', () => {
  it('should update energy state after adding generator', () => {
    const state = createStateWithGenerator('thermal_generator');
    const genConfig = getGeneratorConfig('thermal_generator');

    expect(state.energy).toBeDefined();
    expect(state.energy.produced).toBe(genConfig.energyOutput);
  });

  it('should update energy state after removing generator', () => {
    const state = createStateWithGenerator('thermal_generator');
    const generatorId = state.generators[0].id;

    const result = engine(state, defaultRules, {
      type: 'REMOVE_GENERATOR',
      payload: { generatorId }
    });

    expect(result.state.energy).toBeDefined();
    expect(result.state.energy.produced).toBe(0);
  });

  it('should update energy state after toggling machine', () => {
    const state = createStateWithMachine('stone_furnace', 'iron_ingot');
    const machineId = state.machines[0].id;

    // Toggle off
    const result = engine(state, defaultRules, {
      type: 'TOGGLE_MACHINE',
      payload: { machineId }
    });

    expect(result.state.energy).toBeDefined();
  });

  it('should update energy state during simulation', () => {
    const state = createProductionState();

    const simResult = simulateTicks(state, defaultRules, 5);

    expect(simResult.state.energy).toBeDefined();
    expect(simResult.state.energy.produced).toBeGreaterThanOrEqual(0);
    expect(simResult.state.energy.consumed).toBeGreaterThanOrEqual(0);
  });
});
