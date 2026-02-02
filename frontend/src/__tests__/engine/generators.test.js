
import { describe, it, expect } from 'vitest';
import {
  engine,
  defaultRules,
  createTestState
} from '../testHelpers';

describe('Generators: ADD_GENERATOR', () => {
  it('should add a generator at valid position', () => {
    const state = createTestState({
      builtGenerators: { thermal_generator: 1 },
      generators: [],
      floorSpace: {
        width: 10,
        height: 10,
        placements: [],
        chunks: [{ x: 0, y: 0, width: 10, height: 10 }]
      }
    });

    const result = engine(state, defaultRules, {
      type: 'ADD_GENERATOR',
      payload: { generatorType: 'thermal_generator', x: 0, y: 0 }
    });

    expect(result.error).toBeNull();
    expect(result.state.generators.length).toBe(1);
    expect(result.state.generators[0].type).toBe('thermal_generator');
  });

  it('should consume from builtGenerators pool', () => {
    const state = createTestState({
      builtGenerators: { thermal_generator: 1 },
      generators: []
    });

    const result = engine(state, defaultRules, {
      type: 'ADD_GENERATOR',
      payload: { generatorType: 'thermal_generator', x: 0, y: 0 }
    });

    expect(result.state.builtGenerators.thermal_generator).toBeUndefined(); // 0 is deleted
  });

  it('should fail when no built generator available', () => {
    const state = createTestState({
      builtGenerators: { thermal_generator: 0 },
      generators: []
    });

    const result = engine(state, defaultRules, {
      type: 'ADD_GENERATOR',
      payload: { generatorType: 'thermal_generator', x: 0, y: 0 }
    });

    expect(result.error).toBeDefined();
  });

  it('should fail when position is out of bounds', () => {
    const state = createTestState({
      builtGenerators: { thermal_generator: 1 },
      generators: [],
      floorSpace: { width: 5, height: 5, chunks: [{x:0,y:0,width:5,height:5}], placements: [] }
    });

    const result = engine(state, defaultRules, {
      type: 'ADD_GENERATOR',
      payload: { generatorType: 'thermal_generator', x: 10, y: 10 }
    });

    expect(result.error).toBeDefined();
  });
});

describe('Generators: REMOVE_GENERATOR', () => {
  it('should remove generator and return to pool', () => {
    const state = createTestState({
      builtGenerators: { thermal_generator: 0 },
      generators: [{ id: 'gen1', type: 'thermal_generator', x: 0, y: 0 }],
      floorSpace: {
          width: 10, height: 10, chunks: [{x:0,y:0,width:10,height:10}],
          placements: [{ id: 'gen1', x: 0, y: 0, structureType: 'thermal_generator' }]
      }
    });

    const result = engine(state, defaultRules, {
      type: 'REMOVE_GENERATOR',
      payload: { generatorId: 'gen1' }
    });

    expect(result.state.generators.length).toBe(0);
    expect(result.state.builtGenerators.thermal_generator).toBe(1);
  });
});

describe('Generators: MOVE_GENERATOR', () => {
  it('should move generator to new valid position', () => {
    const state = createTestState({
      generators: [{ id: 'gen1', type: 'thermal_generator', x: 0, y: 0 }],
      floorSpace: {
          width: 10, height: 10, chunks: [{x:0,y:0,width:10,height:10}],
          placements: [{ id: 'gen1', x: 0, y: 0, structureType: 'thermal_generator' }]
      }
    });

    // thermal_generator is 3x6
    const result = engine(state, defaultRules, {
      type: 'MOVE_GENERATOR',
      payload: { generatorId: 'gen1', x: 5, y: 0 }
    });

    expect(result.error).toBeNull();
    const gen = result.state.generators.find(g => g.id === 'gen1');
    expect(gen.x).toBe(5);
    expect(gen.y).toBe(0);
  });

  it('should fail when new position collides', () => {
     const state = createTestState({
      generators: [
          { id: 'gen1', type: 'thermal_generator', x: 0, y: 0 },
          { id: 'gen2', type: 'thermal_generator', x: 4, y: 0 } // Placed at x=4
      ],
      floorSpace: {
          width: 10, height: 10, chunks: [{x:0,y:0,width:10,height:10}],
          placements: [
              { id: 'gen1', x: 0, y: 0, structureType: 'thermal_generator' },
              { id: 'gen2', x: 4, y: 0, structureType: 'thermal_generator' }
          ]
      }
    });

    // Try to move gen1 to overlap gen2 (x=3, width=3 -> 3,4,5 overlaps with 4,5,6)
    const result = engine(state, defaultRules, {
      type: 'MOVE_GENERATOR',
      payload: { generatorId: 'gen1', x: 3, y: 0 }
    });

    expect(result.error).toBeDefined();
  });
});
