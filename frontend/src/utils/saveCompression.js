const TERRAIN_TO_CODE = {
  water: '0',
  plains: '1',
  grassland: '2',
  forest: '3',
  hills: '4',
  mountain: '5',
  jungle: '6',
  desert: '7',
  swamp: '8'
};

const CODE_TO_TERRAIN = Object.fromEntries(
  Object.entries(TERRAIN_TO_CODE).map(([terrain, code]) => [code, terrain])
);

const DEFAULT_TERRAIN_CODE = TERRAIN_TO_CODE.plains;
const COMPACT_TILE_ENCODING_VERSION = 1;

function isObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function toTileIndex(x, y, width) {
  return y * width + x;
}

function buildCompactTileEncoding(explorationMap) {
  const width = Number(explorationMap.generatedWidth);
  const height = Number(explorationMap.generatedHeight);
  const tiles = explorationMap.tiles;

  if (!Number.isInteger(width) || width <= 0 || !Number.isInteger(height) || height <= 0 || !isObject(tiles)) {
    return null;
  }

  const terrainChars = new Array(width * height).fill(DEFAULT_TERRAIN_CODE);
  const explored = [];
  const nodes = [];
  const resources = [];
  const resourceToCode = new Map();

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const key = `${x},${y}`;
      const tile = tiles[key];
      const index = toTileIndex(x, y, width);

      if (tile?.terrain) {
        terrainChars[index] = TERRAIN_TO_CODE[tile.terrain] ?? DEFAULT_TERRAIN_CODE;
      }

      if (tile?.explored) {
        explored.push(index);
      }

      const extractionNode = tile?.extractionNode;
      if (extractionNode && typeof extractionNode.resourceType === 'string') {
        let resourceCode = resourceToCode.get(extractionNode.resourceType);
        if (resourceCode === undefined) {
          resourceCode = resources.length;
          resources.push(extractionNode.resourceType);
          resourceToCode.set(extractionNode.resourceType, resourceCode);
        }

        const rate = Number.isFinite(extractionNode.rate) ? Math.max(1, Math.floor(extractionNode.rate)) : 1;
        const tuple = [index, resourceCode, rate];
        if (extractionNode.unlocked) {
          tuple.push(1);
        }
        nodes.push(tuple);
      }
    }
  }

  return {
    version: COMPACT_TILE_ENCODING_VERSION,
    width,
    height,
    terrain: terrainChars.join(''),
    explored,
    resources,
    nodes
  };
}

function expandCompactTileEncoding(explorationMap) {
  const encoding = explorationMap?.tileEncoding;
  if (!isObject(encoding)) return explorationMap;

  const width = Number(encoding.width ?? explorationMap.generatedWidth);
  const height = Number(encoding.height ?? explorationMap.generatedHeight);
  const terrain = typeof encoding.terrain === 'string' ? encoding.terrain : '';
  const explored = Array.isArray(encoding.explored) ? encoding.explored : [];
  const resources = Array.isArray(encoding.resources) ? encoding.resources : [];
  const nodes = Array.isArray(encoding.nodes) ? encoding.nodes : [];

  if (!Number.isInteger(width) || width <= 0 || !Number.isInteger(height) || height <= 0) {
    return explorationMap;
  }

  const exploredSet = new Set();
  for (const rawIndex of explored) {
    const index = Number(rawIndex);
    if (Number.isInteger(index) && index >= 0 && index < width * height) {
      exploredSet.add(index);
    }
  }

  const nodeByIndex = new Map();
  for (const tuple of nodes) {
    if (!Array.isArray(tuple) || tuple.length < 3) continue;
    const index = Number(tuple[0]);
    const resourceCode = Number(tuple[1]);
    const rate = Number(tuple[2]);
    const unlocked = tuple[3] === 1 || tuple[3] === true;

    if (!Number.isInteger(index) || index < 0 || index >= width * height) continue;
    if (!Number.isInteger(resourceCode) || resourceCode < 0 || resourceCode >= resources.length) continue;

    const resourceType = resources[resourceCode];
    if (typeof resourceType !== 'string' || !resourceType) continue;

    nodeByIndex.set(index, {
      resourceType,
      rate: Number.isFinite(rate) ? Math.max(1, Math.floor(rate)) : 1,
      unlocked
    });
  }

  const tiles = {};
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = toTileIndex(x, y, width);
      const terrainCode = terrain[index] || DEFAULT_TERRAIN_CODE;
      const terrainType = CODE_TO_TERRAIN[terrainCode] || 'plains';
      const node = nodeByIndex.get(index);

      tiles[`${x},${y}`] = {
        x,
        y,
        terrain: terrainType,
        explored: exploredSet.has(index),
        extractionNode: node ? {
          id: `exp_node_${node.resourceType}_${x}_${y}`,
          resourceType: node.resourceType,
          rate: node.rate,
          unlocked: node.unlocked
        } : null
      };
    }
  }

  const { tileEncoding, ...restMap } = explorationMap;
  return {
    ...restMap,
    generatedWidth: width,
    generatedHeight: height,
    tiles
  };
}

export function compressStateForSave(state) {
  if (!isObject(state) || !isObject(state.explorationMap)) return state;

  const compact = buildCompactTileEncoding(state.explorationMap);
  if (!compact) return state;

  const { tiles, ...mapWithoutTiles } = state.explorationMap;
  return {
    ...state,
    explorationMap: {
      ...mapWithoutTiles,
      tileEncoding: compact
    }
  };
}

export function expandStateFromSave(state) {
  if (!isObject(state) || !isObject(state.explorationMap)) return state;
  if (isObject(state.explorationMap.tiles)) return state;
  if (!isObject(state.explorationMap.tileEncoding)) return state;

  return {
    ...state,
    explorationMap: expandCompactTileEncoding(state.explorationMap)
  };
}

export function compressImportPayload(payload) {
  if (!isObject(payload)) return payload;

  if (isObject(payload.save)) {
    return {
      ...payload,
      save: {
        ...payload.save,
        data: compressStateForSave(payload.save.data)
      }
    };
  }

  if (payload.state !== undefined) {
    return {
      ...payload,
      state: compressStateForSave(payload.state)
    };
  }

  if (payload.data !== undefined) {
    return {
      ...payload,
      data: compressStateForSave(payload.data)
    };
  }

  return payload;
}
