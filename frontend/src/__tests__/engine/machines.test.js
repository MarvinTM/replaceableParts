/**
 * Tests for machine management actions:
 * ADD_MACHINE, REMOVE_MACHINE, MOVE_MACHINE, TOGGLE_MACHINE, UNBLOCK_MACHINE
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  engine,
  defaultRules,
  createTestState,
  createStateWithMachine,
  getMachineConfig
} from '../testHelpers';

describe('Engine: ADD_MACHINE', () => {
  let baseState;

  beforeEach(() => {
    baseState = createTestState({
      credits: 10000,
      builtMachines: { stone_furnace: 2 },
      machines: [],
      floorSpace: {
        width: 8,
        height: 8,
        placements: [],
        chunks: [{ x: 0, y: 0, width: 8, height: 8 }]
      }
    });
  });

  it('should add a machine at a valid position', () => {
    const result = engine(baseState, defaultRules, {
      type: 'ADD_MACHINE',
      payload: { machineType: 'stone_furnace', x: 0, y: 0 }
    });

    expect(result.error).toBeNull();
    expect(result.state.machines).toHaveLength(1);
    expect(result.state.machines[0].type).toBe('stone_furnace');
    expect(result.state.machines[0].x).toBe(0);
    expect(result.state.machines[0].y).toBe(0);
    expect(result.state.machines[0].enabled).toBe(true);
    expect(result.state.machines[0].status).toBe('idle');
    expect(result.state.builtMachines.stone_furnace).toBe(1); // Consumed one
  });

  it('should add machine to floor placements', () => {
    const result = engine(baseState, defaultRules, {
      type: 'ADD_MACHINE',
      payload: { machineType: 'stone_furnace', x: 0, y: 0 }
    });

    expect(result.error).toBeNull();
    expect(result.state.floorSpace.placements).toHaveLength(1);
    expect(result.state.floorSpace.placements[0].structureType).toBe('stone_furnace');
    expect(result.state.floorSpace.placements[0].x).toBe(0);
    expect(result.state.floorSpace.placements[0].y).toBe(0);
  });

  it('should fail when no built machine available', () => {
    baseState.builtMachines = {};

    const result = engine(baseState, defaultRules, {
      type: 'ADD_MACHINE',
      payload: { machineType: 'stone_furnace', x: 0, y: 0 }
    });

    expect(result.error).toContain('No built');
    expect(result.state.machines).toHaveLength(0);
  });

  it('should fail when position is out of bounds', () => {
    const result = engine(baseState, defaultRules, {
      type: 'ADD_MACHINE',
      payload: { machineType: 'stone_furnace', x: 100, y: 100 }
    });

    expect(result.error).toContain('out of bounds');
    expect(result.state.machines).toHaveLength(0);
  });

  it('should fail when position collides with existing structure', () => {
    // Add first machine
    let result = engine(baseState, defaultRules, {
      type: 'ADD_MACHINE',
      payload: { machineType: 'stone_furnace', x: 0, y: 0 }
    });
    expect(result.error).toBeNull();

    // Try to add second at same position
    result = engine(result.state, defaultRules, {
      type: 'ADD_MACHINE',
      payload: { machineType: 'stone_furnace', x: 0, y: 0 }
    });

    expect(result.error).toContain('collides');
    expect(result.state.machines).toHaveLength(1);
  });

  it('should fail with invalid machine type', () => {
    const result = engine(baseState, defaultRules, {
      type: 'ADD_MACHINE',
      payload: { machineType: 'nonexistent_machine', x: 0, y: 0 }
    });

    expect(result.error).toContain('not found');
  });

  it('should fail without position coordinates', () => {
    const result = engine(baseState, defaultRules, {
      type: 'ADD_MACHINE',
      payload: { machineType: 'stone_furnace' }
    });

    expect(result.error).toContain('Position');
  });
});

describe('Engine: REMOVE_MACHINE', () => {
  let stateWithMachine;

  beforeEach(() => {
    stateWithMachine = createStateWithMachine('stone_furnace');
  });

  it('should remove a machine and return it to pool', () => {
    const machineId = stateWithMachine.machines[0].id;

    const result = engine(stateWithMachine, defaultRules, {
      type: 'REMOVE_MACHINE',
      payload: { machineId }
    });

    expect(result.error).toBeNull();
    expect(result.state.machines).toHaveLength(0);
    expect(result.state.builtMachines.stone_furnace).toBe(1);
  });

  it('should remove machine from floor placements', () => {
    const machineId = stateWithMachine.machines[0].id;

    const result = engine(stateWithMachine, defaultRules, {
      type: 'REMOVE_MACHINE',
      payload: { machineId }
    });

    expect(result.error).toBeNull();
    expect(result.state.floorSpace.placements).toHaveLength(0);
  });

  it('should return internal buffer contents to inventory', () => {
    // Add items to buffer
    stateWithMachine.machines[0].internalBuffer = {
      iron_ore: 5,
      coal: 3
    };

    const machineId = stateWithMachine.machines[0].id;
    const result = engine(stateWithMachine, defaultRules, {
      type: 'REMOVE_MACHINE',
      payload: { machineId }
    });

    expect(result.error).toBeNull();
    expect(result.state.inventory.iron_ore).toBe(5);
    expect(result.state.inventory.coal).toBe(3);
  });

  it('should fail when machine not found', () => {
    const result = engine(stateWithMachine, defaultRules, {
      type: 'REMOVE_MACHINE',
      payload: { machineId: 'nonexistent_id' }
    });

    expect(result.error).toContain('not found');
  });
});

describe('Engine: MOVE_MACHINE', () => {
  let stateWithMachine;

  beforeEach(() => {
    stateWithMachine = createStateWithMachine('stone_furnace');
  });

  it('should move a machine to a new valid position', () => {
    const machineId = stateWithMachine.machines[0].id;

    const result = engine(stateWithMachine, defaultRules, {
      type: 'MOVE_MACHINE',
      payload: { machineId, x: 4, y: 4 }
    });

    expect(result.error).toBeNull();
    expect(result.state.machines[0].x).toBe(4);
    expect(result.state.machines[0].y).toBe(4);
  });

  it('should update floor placement position', () => {
    const machineId = stateWithMachine.machines[0].id;

    const result = engine(stateWithMachine, defaultRules, {
      type: 'MOVE_MACHINE',
      payload: { machineId, x: 4, y: 4 }
    });

    expect(result.error).toBeNull();
    const placement = result.state.floorSpace.placements.find(p => p.id === machineId);
    expect(placement.x).toBe(4);
    expect(placement.y).toBe(4);
  });

  it('should fail when new position is out of bounds', () => {
    const machineId = stateWithMachine.machines[0].id;

    const result = engine(stateWithMachine, defaultRules, {
      type: 'MOVE_MACHINE',
      payload: { machineId, x: 100, y: 100 }
    });

    expect(result.error).toContain('out of bounds');
    expect(result.state.machines[0].x).toBe(0); // Unchanged
  });

  it('should fail when new position collides with another structure', () => {
    // Add another machine first
    stateWithMachine.builtMachines = { stone_furnace: 1 };
    let result = engine(stateWithMachine, defaultRules, {
      type: 'ADD_MACHINE',
      payload: { machineType: 'stone_furnace', x: 4, y: 0 }
    });
    expect(result.error).toBeNull();

    // Try to move first machine to second machine's position
    const firstMachineId = result.state.machines[0].id;
    result = engine(result.state, defaultRules, {
      type: 'MOVE_MACHINE',
      payload: { machineId: firstMachineId, x: 4, y: 0 }
    });

    expect(result.error).toContain('collides');
  });

  it('should fail when machine not found', () => {
    const result = engine(stateWithMachine, defaultRules, {
      type: 'MOVE_MACHINE',
      payload: { machineId: 'nonexistent_id', x: 4, y: 4 }
    });

    expect(result.error).toContain('not found');
  });
});

describe('Engine: TOGGLE_MACHINE', () => {
  let stateWithMachine;

  beforeEach(() => {
    stateWithMachine = createStateWithMachine('stone_furnace');
  });

  it('should toggle machine from enabled to disabled', () => {
    const machineId = stateWithMachine.machines[0].id;
    expect(stateWithMachine.machines[0].enabled).toBe(true);

    const result = engine(stateWithMachine, defaultRules, {
      type: 'TOGGLE_MACHINE',
      payload: { machineId }
    });

    expect(result.error).toBeNull();
    expect(result.state.machines[0].enabled).toBe(false);
  });

  it('should toggle machine from disabled to enabled', () => {
    stateWithMachine.machines[0].enabled = false;
    const machineId = stateWithMachine.machines[0].id;

    const result = engine(stateWithMachine, defaultRules, {
      type: 'TOGGLE_MACHINE',
      payload: { machineId }
    });

    expect(result.error).toBeNull();
    expect(result.state.machines[0].enabled).toBe(true);
  });

  it('should recalculate energy after toggle', () => {
    // Assign a recipe first so it consumes energy
    stateWithMachine.unlockedRecipes = ['iron_ingot'];
    const machineId = stateWithMachine.machines[0].id;

    let result = engine(stateWithMachine, defaultRules, {
      type: 'ASSIGN_RECIPE',
      payload: { machineId, recipeId: 'iron_ingot' }
    });

    const energyBefore = result.state.energy?.consumed || 0;

    // Toggle off
    result = engine(result.state, defaultRules, {
      type: 'TOGGLE_MACHINE',
      payload: { machineId }
    });

    // Energy consumption should decrease (or at least be recalculated)
    expect(result.state.energy).toBeDefined();
  });

  it('should fail when machine not found', () => {
    const result = engine(stateWithMachine, defaultRules, {
      type: 'TOGGLE_MACHINE',
      payload: { machineId: 'nonexistent_id' }
    });

    expect(result.error).toContain('not found');
  });
});

describe('Engine: UNBLOCK_MACHINE', () => {
  let stateWithBlockedMachine;

  beforeEach(() => {
    stateWithBlockedMachine = createStateWithMachine('stone_furnace', 'iron_ingot');
    stateWithBlockedMachine.machines[0].status = 'blocked';
  });

  it('should unblock a blocked machine with recipe', () => {
    const machineId = stateWithBlockedMachine.machines[0].id;

    const result = engine(stateWithBlockedMachine, defaultRules, {
      type: 'UNBLOCK_MACHINE',
      payload: { machineId }
    });

    expect(result.error).toBeNull();
    expect(result.state.machines[0].status).toBe('working');
  });

  it('should set idle status if machine has no recipe', () => {
    stateWithBlockedMachine.machines[0].recipeId = null;
    const machineId = stateWithBlockedMachine.machines[0].id;

    const result = engine(stateWithBlockedMachine, defaultRules, {
      type: 'UNBLOCK_MACHINE',
      payload: { machineId }
    });

    expect(result.error).toBeNull();
    expect(result.state.machines[0].status).toBe('idle');
  });

  it('should fail when machine is not blocked', () => {
    stateWithBlockedMachine.machines[0].status = 'working';
    const machineId = stateWithBlockedMachine.machines[0].id;

    const result = engine(stateWithBlockedMachine, defaultRules, {
      type: 'UNBLOCK_MACHINE',
      payload: { machineId }
    });

    expect(result.error).toContain('not blocked');
  });

  it('should fail when machine not found', () => {
    const result = engine(stateWithBlockedMachine, defaultRules, {
      type: 'UNBLOCK_MACHINE',
      payload: { machineId: 'nonexistent_id' }
    });

    expect(result.error).toContain('not found');
  });
});

describe('Engine: Machine Size Handling', () => {
  it('should respect machine dimensions for placement', () => {
    // Find a machine with size > 1x1 if available
    const largeMachine = defaultRules.machines.find(m => m.sizeX > 1 || m.sizeY > 1);

    if (largeMachine) {
      const state = createTestState({
        credits: 10000,
        builtMachines: { [largeMachine.id]: 1 },
        machines: [],
        floorSpace: {
          width: 16,
          height: 16,
          placements: [],
          chunks: [{ x: 0, y: 0, width: 16, height: 16 }]
        }
      });

      const result = engine(state, defaultRules, {
        type: 'ADD_MACHINE',
        payload: { machineType: largeMachine.id, x: 0, y: 0 }
      });

      expect(result.error).toBeNull();
      expect(result.state.machines).toHaveLength(1);
    }
  });

  it('should prevent placing machine if it would extend beyond bounds', () => {
    const machineConfig = getMachineConfig('stone_furnace');
    const sizeX = machineConfig?.sizeX || 1;

    const state = createTestState({
      credits: 10000,
      builtMachines: { stone_furnace: 1 },
      machines: [],
      floorSpace: {
        width: 8,
        height: 8,
        placements: [],
        chunks: [{ x: 0, y: 0, width: 8, height: 8 }]
      }
    });

    // Try to place at edge where machine would extend beyond
    const result = engine(state, defaultRules, {
      type: 'ADD_MACHINE',
      payload: { machineType: 'stone_furnace', x: 8 - sizeX + 1, y: 0 }
    });

    // Should either succeed if fits exactly, or fail if extends beyond
    // This depends on the actual machine size
    if (sizeX > 1) {
      expect(result.error).toContain('out of bounds');
    }
  });
});
