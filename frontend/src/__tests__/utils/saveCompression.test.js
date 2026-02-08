import { describe, it, expect } from 'vitest';
import { generateExplorationMap } from '../../engine/mapGenerator';
import { defaultRules } from '../../engine/defaultRules';
import { compressImportPayload, compressStateForSave, expandStateFromSave } from '../../utils/saveCompression';

function buildState() {
  return {
    tick: 42,
    explorationMap: generateExplorationMap(12345, 128, 128, defaultRules),
    machines: [],
    extractionNodes: []
  };
}

describe('saveCompression', () => {
  it('round-trips exploration maps through compact encoding', () => {
    const state = buildState();

    const compressed = compressStateForSave(state);
    expect(compressed.explorationMap.tiles).toBeUndefined();
    expect(compressed.explorationMap.tileEncoding).toBeTruthy();

    const expanded = expandStateFromSave(compressed);
    expect(expanded.explorationMap.tiles).toBeTruthy();
    expect(expanded.explorationMap.generatedWidth).toBe(state.explorationMap.generatedWidth);
    expect(expanded.explorationMap.generatedHeight).toBe(state.explorationMap.generatedHeight);
    expect(expanded.explorationMap.exploredBounds).toEqual(state.explorationMap.exploredBounds);
    expect(expanded.explorationMap.exploredChunks).toEqual(state.explorationMap.exploredChunks);
    expect(expanded.explorationMap.seed).toBe(state.explorationMap.seed);
    expect(expanded.explorationMap.tiles).toEqual(state.explorationMap.tiles);
  });

  it('substantially reduces exploration map payload size', () => {
    const state = buildState();
    const compressed = compressStateForSave(state);

    const originalBytes = Buffer.byteLength(JSON.stringify(state.explorationMap));
    const compressedBytes = Buffer.byteLength(JSON.stringify(compressed.explorationMap));

    expect(compressedBytes).toBeLessThan(originalBytes * 0.45);
  });

  it('compresses imported payloads in all supported shapes', () => {
    const state = buildState();

    const savePayload = compressImportPayload({
      format: 'replaceableParts-save',
      save: { name: 'Test', data: state }
    });
    expect(savePayload.save.data.explorationMap.tileEncoding).toBeTruthy();

    const legacyStatePayload = compressImportPayload({ name: 'Legacy', state });
    expect(legacyStatePayload.state.explorationMap.tileEncoding).toBeTruthy();

    const directDataPayload = compressImportPayload({ name: 'Direct', data: state });
    expect(directDataPayload.data.explorationMap.tileEncoding).toBeTruthy();
  });
});
