import { useRef, useEffect, useCallback, useState } from 'react';
import { Application, Graphics, Container, Sprite, Assets, AnimatedSprite, Texture, Text, TextStyle } from 'pixi.js';
import {
  TILE_WIDTH,
  TILE_HEIGHT,
  gridToScreen,
  screenToGrid,
  getStructureScreenPosition,
  getGridCenter,
  COLORS
} from './useIsometric';
import { canPlaceAt } from '../../engine/engine.js';

// Asset paths - place your images in frontend/public/assets/factory/
const ASSET_BASE = '/assets/factory';
const ASSET_MANIFEST = {
  floor: {
    light: `${ASSET_BASE}/floor_light.png`,
    dark: `${ASSET_BASE}/floor_dark.png`,
  },
  walls: {
    segment: `${ASSET_BASE}/wall.png`,
  },
  machines: {
    idle: `${ASSET_BASE}/machine_idle.png`,
    working: `${ASSET_BASE}/machine_working.png`,
    blocked: `${ASSET_BASE}/machine_blocked.png`,
    // For animations, use sprite sheets named: machine_working_anim.png
    // with frames arranged horizontally
    workingAnim: `${ASSET_BASE}/machine_working_anim.png`,
  },
  generators: {
    default: `${ASSET_BASE}/generator.png`,
    // For animations: generator_anim.png
    anim: `${ASSET_BASE}/generator_anim.png`,
  }
};

// Animation config (frames per sprite sheet, animation speed, random intervals)
const ANIM_CONFIG = {
  machine: {
    frames: 4,
    speed: 0.1,
    randomInterval: { min: 10000, max: 20000 } // milliseconds between animations
  },
  generator: {
    frames: 4,
    speed: 0.08
    // Generators animate continuously when enabled - no random intervals
  }
};

// Text style for machine labels
const MACHINE_LABEL_STYLE = new TextStyle({
  fontFamily: 'Arial, sans-serif',
  fontSize: 10,
  fill: 0xffffff,
  stroke: { color: 0x000000, width: 2 },
  align: 'center'
});

// Wall positioning adjustments (tweak these values to fine-tune alignment)
const WALL_CONFIG = {
  // Upper-left wall (along x=0)
  upperLeftOffsetX: -19,
  upperLeftOffsetY: 2,
  // Upper-right wall (along y=height-1)
  upperRightOffsetX: 19,
  upperRightOffsetY: 2,
  // Lower-left wall (along y=0)
  lowerLeftOffsetX: -13,
  lowerLeftOffsetY: 18,
  // Lower-right wall (along x=width-1)
  lowerRightOffsetX: 13,
  lowerRightOffsetY: 18,
  // Transparency for lower walls (0 = fully transparent, 1 = fully opaque)
  lowerWallAlphaDefault: 0.85,  // When mouse is outside factory
  lowerWallAlphaHover: 0.10,    // When mouse is over factory
  // Common settings
  wallRowVerticalOffset: 32,   // Vertical offset for subsequent wall rows
  baseNumberOfWallRows: 3,     // Base number of wall rows at initial factory size
  initialFactorySize: 8        // Initial factory size (8x8)
};

/**
 * Calculate the number of wall rows based on factory expansion level
 * Scales only when both dimensions form a complete square at the next level
 * 8x8 = 1x, 16x16 = 2x, 32x32 = 3x, etc.
 */
function getWallRowCount(factoryWidth, factoryHeight) {
  // Use the minimum dimension - scaling only happens when full square is formed
  const minDimension = Math.min(factoryWidth, factoryHeight);
  const expansionLevel = Math.floor(Math.log2(minDimension / WALL_CONFIG.initialFactorySize)) + 1;
  return WALL_CONFIG.baseNumberOfWallRows * expansionLevel;
}

/**
 * Load assets and return what's available
 * @param {Object} rules - Game rules containing machine and generator types
 */
async function loadAssets(rules) {
  const loaded = {
    floor: { light: null, dark: null },
    walls: { segment: null },
    machines: {},
    generators: {}
  };

  // Try loading each asset, silently fail if not found
  const tryLoad = async (path) => {
    try {
      return await Assets.load(path);
    } catch {
      return null;
    }
  };

  // Load floor tiles
  loaded.floor.light = await tryLoad(ASSET_MANIFEST.floor.light);
  loaded.floor.dark = await tryLoad(ASSET_MANIFEST.floor.dark);

  // Load wall sprites
  loaded.walls.segment = await tryLoad(ASSET_MANIFEST.walls.segment);

  // Load per-type machine sprites
  for (const machineType of rules.machines) {
    loaded.machines[machineType.id] = {
      idle: await tryLoad(`${ASSET_BASE}/${machineType.id}_idle.png`),
      working: await tryLoad(`${ASSET_BASE}/${machineType.id}_working.png`),
      blocked: await tryLoad(`${ASSET_BASE}/${machineType.id}_blocked.png`),
      workingAnim: await tryLoad(`${ASSET_BASE}/${machineType.id}_working_anim.png`)
    };
  }

  // Load per-type generator sprites
  for (const generatorType of rules.generators) {
    loaded.generators[generatorType.id] = {
      static: await tryLoad(`${ASSET_BASE}/${generatorType.id}.png`),
      anim: await tryLoad(`${ASSET_BASE}/${generatorType.id}_anim.png`)
    };
  }

  return loaded;
}

/**
 * Create animation frames from a sprite sheet
 * @param {Texture} texture - The sprite sheet texture
 * @param {number} frameCount - Number of frames in the animation
 * @param {string} frameDisposition - 'horizontal' (single row) or 'matrix' (grid layout)
 * @param {number} [explicitCols] - Optional explicit column count for matrix layouts
 */
function createAnimationFrames(texture, frameCount, frameDisposition = 'horizontal', explicitCols = null) {
  if (!texture) return null;

  let cols, rows;

  if (frameDisposition === 'matrix') {
    if (explicitCols !== null && explicitCols > 0) {
      // Use explicitly provided column count
      cols = explicitCols;
    } else {
      // Assume frames form a square grid: 4 frames -> 2x2, 9 frames -> 3x3, etc.
      // This is more reliable than aspect ratio calculation which can fail
      // due to image dimensions not matching expected ratios
      cols = Math.ceil(Math.sqrt(frameCount));
    }
    rows = Math.ceil(frameCount / cols);
  } else {
    // Default: horizontal strip (all frames in a single row)
    cols = frameCount;
    rows = 1;
  }

  const frameWidth = texture.width / cols;
  const frameHeight = texture.height / rows;
  const frames = [];

  // Extract frames left-to-right, top-to-bottom
  for (let i = 0; i < frameCount; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);

    const frame = new Texture({
      source: texture.source,
      frame: {
        x: col * frameWidth,
        y: row * frameHeight,
        width: frameWidth,
        height: frameHeight
      }
    });
    frames.push(frame);
  }

  return frames;
}

/**
 * Draw an isometric tile (diamond shape) - fallback when no image
 */
function drawIsometricTile(graphics, x, y, fillColor, lineColor = null) {
  const halfWidth = TILE_WIDTH / 2;
  const halfHeight = TILE_HEIGHT / 2;

  graphics.poly([
    x, y - halfHeight,
    x + halfWidth, y,
    x, y + halfHeight,
    x - halfWidth, y
  ]);
  graphics.fill(fillColor);

  if (lineColor !== null) {
    graphics.stroke({ color: lineColor, width: 1, alpha: 0.3 });
  }
}

/**
 * Draw a structure as an isometric box - fallback when no image
 * Supports rectangular structures with different sizeX and sizeY
 */
function drawStructure(graphics, x, y, sizeX, sizeY, height, color) {
  const halfW = TILE_WIDTH / 2;
  const halfH = TILE_HEIGHT / 2;
  
  // Calculate corners relative to center
  // logic derived from gridToScreen: x=(gx+gy)*halfW, y=(gx-gy)*halfH
  const halfX = sizeX / 2;
  const halfY = sizeY / 2;

  // C1: Right (+X, +Y grid relative to center)
  const c1x = (halfX + halfY) * halfW;
  const c1y = (halfX - halfY) * halfH;

  // C2: Bottom (+X, -Y grid relative to center) 
  const c2x = (halfX - halfY) * halfW;
  const c2y = (halfX + halfY) * halfH;

  // C3: Left (-X, -Y) -> -C1
  const c3x = -c1x;
  const c3y = -c1y;

  // C4: Top (-X, +Y) -> -C2
  const c4x = -c2x;
  const c4y = -c2y;

  // Top Face (at y - height)
  graphics.poly([
    x + c4x, y + c4y - height,
    x + c1x, y + c1y - height,
    x + c2x, y + c2y - height,
    x + c3x, y + c3y - height
  ]);
  graphics.fill(color);

  // Left Face (C3 to C2) - Darker
  const darkerColor = darkenColor(color, 0.7);
  graphics.poly([
    x + c3x, y + c3y - height,
    x + c2x, y + c2y - height,
    x + c2x, y + c2y,
    x + c3x, y + c3y
  ]);
  graphics.fill(darkerColor);

  // Right Face (C2 to C1) - Medium
  const mediumColor = darkenColor(color, 0.85);
  graphics.poly([
    x + c2x, y + c2y - height,
    x + c1x, y + c1y - height,
    x + c1x, y + c1y,
    x + c2x, y + c2y
  ]);
  graphics.fill(mediumColor);
}

function darkenColor(color, factor) {
  const r = Math.floor(((color >> 16) & 0xff) * factor);
  const g = Math.floor(((color >> 8) & 0xff) * factor);
  const b = Math.floor((color & 0xff) * factor);
  return (r << 16) | (g << 8) | b;
}

function getMachineColor(status, enabled) {
  if (!enabled) return COLORS.machineIdle;
  switch (status) {
    case 'working': return COLORS.machine;
    case 'blocked': return COLORS.machineBlocked;
    default: return COLORS.machineIdle;
  }
}

export default function FactoryCanvas({
  floorSpace,
  machines,
  generators,
  rules,
  dragState,
  onDrop,
  onMachineClick,
  onStructureDragStart,
  onMachineRightClick,
  onGeneratorRightClick,
  engineState,
  animationsEnabled = true
}) {
  const containerRef = useRef(null);
  const appRef = useRef(null);
  const worldRef = useRef(null);
  const assetsRef = useRef(null);
  const dragRef = useRef({ isDragging: false, lastX: 0, lastY: 0 });
  const minZoomRef = useRef(0.25); // Dynamic minimum zoom based on factory size
  const lowerWallSpritesRef = useRef([]); // Store lower wall sprites for alpha updates
  const floorDimensionsRef = useRef({ width: 0, height: 0 }); // Store floor dimensions for hover check
  const animationsEnabledRef = useRef(animationsEnabled); // Track animations enabled state
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  // Force re-render when animation states change
  const [, setAnimationTrigger] = useState(0);
  const forceRender = useCallback(() => setAnimationTrigger(t => t + 1), []);
  const forceRenderRef = useRef(forceRender);
  forceRenderRef.current = forceRender;

  // Drag-and-drop placement state
  const [hoverGridPos, setHoverGridPos] = useState({ x: -1, y: -1 });

  // Structure drag tracking (machines and generators)
  const structureDragRef = useRef({ type: null, item: null, startX: 0, startY: 0, hasMoved: false });

  // Animation state tracking: stores nextTriggerTime for each machine/generator by ID
  const animationStateRef = useRef({});

  // Store AnimatedSprite references for controlling playback
  const animatedSpritesRef = useRef({});

  // Track which machines/generators are currently playing animation
  const currentlyAnimatingRef = useRef({});

  // Store latest machines/generators for ticker access
  const machinesRef = useRef(machines);
  const generatorsRef = useRef(generators);

  // Update refs when machines/generators change
  useEffect(() => {
    machinesRef.current = machines;
    generatorsRef.current = generators;
  }, [machines, generators]);

  // Update animationsEnabled ref when it changes
  useEffect(() => {
    animationsEnabledRef.current = animationsEnabled;
  }, [animationsEnabled]);

  // Clear hover position when drag ends
  useEffect(() => {
    if (!dragState?.isDragging) {
      setHoverGridPos({ x: -1, y: -1 });
    }
  }, [dragState?.isDragging]);

  // Helper to determine if an animation should be triggered
  const shouldTriggerAnimation = useCallback((id, structureType) => {
    const now = Date.now();
    const state = animationStateRef.current[id];

    // Get interval config based on structure type
    const intervalConfig = structureType === 'machine'
      ? ANIM_CONFIG.machine.randomInterval
      : ANIM_CONFIG.generator.randomInterval;

    // Initialize if first time
    if (!state) {
      const randomDelay = Math.random() * (intervalConfig.max - intervalConfig.min) + intervalConfig.min;
      animationStateRef.current[id] = {
        nextTriggerTime: now + randomDelay
      };
      return false;
    }

    // Check if it's time to trigger
    if (now >= state.nextTriggerTime) {
      // Schedule next trigger
      const randomDelay = Math.random() * (intervalConfig.max - intervalConfig.min) + intervalConfig.min;
      animationStateRef.current[id] = {
        nextTriggerTime: now + randomDelay
      };
      return true;
    }

    return false;
  }, []);

  const render = useCallback(() => {
    if (!worldRef.current || !floorSpace) return;

    const world = worldRef.current;
    const assets = assetsRef.current;

    // Clear previous content
    world.removeChildren();

    // Clean up animated sprite refs for removed machines/generators
    const currentKeys = new Set([
      ...(machines || []).map(m => `machine-${m.id}`),
      ...(generators || []).map(g => `generator-${g.id}`)
    ]);
    Object.keys(animatedSpritesRef.current).forEach(key => {
      if (!currentKeys.has(key)) {
        delete animatedSpritesRef.current[key];
        delete currentlyAnimatingRef.current[key];
        delete animationStateRef.current[key.split('-')[1]];
      }
    });

    const { width, height } = floorSpace;

    // Store dimensions for hover detection
    floorDimensionsRef.current = { width, height };

    // === RENDER FLOOR ===
    const floorContainer = new Container();

    const hasFloorSprites = assets?.floor.light && assets?.floor.dark;

    // Helper to check if a tile is valid
    const isTileValid = (tx, ty) => {
      if (!floorSpace.chunks) return true; // Legacy support or initial load
      // Simple check: is (tx, ty) inside any chunk?
      // Since tiles are 1x1, we just check point inclusion
      return floorSpace.chunks.some(c => 
        tx >= c.x && tx < c.x + c.width && 
        ty >= c.y && ty < c.y + c.height
      );
    };

    if (hasFloorSprites) {
      // Use sprite tiles
      for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
          if (!isTileValid(x, y)) continue;

          const screenPos = gridToScreen(x, y);
          const texture = (x + y) % 2 === 0 ? assets.floor.light : assets.floor.dark;
          const sprite = new Sprite(texture);

          // Center the sprite on the tile position
          sprite.anchor.set(0.5, 0.5);
          sprite.x = screenPos.x;
          sprite.y = screenPos.y;

          floorContainer.addChild(sprite);
        }
      }
    } else {
      // Fallback to graphics
      const floorGraphics = new Graphics();
      for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
          if (!isTileValid(x, y)) continue;

          const screenPos = gridToScreen(x, y);
          const fillColor = (x + y) % 2 === 0 ? COLORS.floorLight : COLORS.floorDark;
          drawIsometricTile(floorGraphics, screenPos.x, screenPos.y, fillColor, COLORS.floorLine);
        }
      }
      floorContainer.addChild(floorGraphics);
    }

    world.addChild(floorContainer);

    // === RENDER UPPER WALLS ===
    // Upper walls on the TRUE outer perimeter only (x=0 and y=height-1)
    // Internal step edges will be rendered in the lower walls section with transparency
    const wallHeight = assets?.walls.segment ? assets.walls.segment.height - WALL_CONFIG.wallRowVerticalOffset : 0;
    const numberOfRows = getWallRowCount(width, height);

    if (assets?.walls.segment) {
      const upperWallContainer = new Container();

      // Only collect outer perimeter edges (not internal step edges)
      const outerUpperLeftEdges = []; // Tiles at x=0 with no neighbor at x-1
      const outerUpperRightEdges = []; // Tiles at y=height-1 with no neighbor at y+1

      for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
          if (!isTileValid(x, y)) continue;

          // Outer upper-left: must be at x=0 (true left edge of bounding box)
          if (x === 0 && !isTileValid(x - 1, y)) {
            outerUpperLeftEdges.push({ x, y });
          }

          // Outer upper-right: must be at y=height-1 (true top edge of bounding box)
          if (y === height - 1 && !isTileValid(x, y + 1)) {
            outerUpperRightEdges.push({ x, y });
          }
        }
      }

      // Render outer upper-left walls (sorted by y for consistent overlap)
      outerUpperLeftEdges.sort((a, b) => a.y - b.y);
      for (let row = 0; row < numberOfRows; row++) {
        for (const edge of outerUpperLeftEdges) {
          const screenPos = gridToScreen(edge.x, edge.y);
          const wallSprite = new Sprite(assets.walls.segment);

          wallSprite.anchor.set(0.5, 1);
          wallSprite.x = screenPos.x + WALL_CONFIG.upperLeftOffsetX;
          wallSprite.y = screenPos.y + WALL_CONFIG.upperLeftOffsetY - (row * wallHeight);

          upperWallContainer.addChild(wallSprite);
        }
      }

      // Render outer upper-right walls (sorted by x descending for consistent overlap)
      outerUpperRightEdges.sort((a, b) => b.x - a.x);
      for (let row = 0; row < numberOfRows; row++) {
        for (const edge of outerUpperRightEdges) {
          const screenPos = gridToScreen(edge.x, edge.y);
          const wallSprite = new Sprite(assets.walls.segment);

          wallSprite.anchor.set(0.5, 1);
          wallSprite.scale.x = -1;
          wallSprite.x = screenPos.x + WALL_CONFIG.upperRightOffsetX;
          wallSprite.y = screenPos.y + WALL_CONFIG.upperRightOffsetY - (row * wallHeight);

          upperWallContainer.addChild(wallSprite);
        }
      }

      world.addChild(upperWallContainer);
    }

    // === RENDER STRUCTURES ===
    const structuresContainer = new Container();
    structuresContainer.sortableChildren = true;

    // Render generators
    generators?.forEach((gen) => {
      // Skip if generator type is not set (backwards compatibility)
      if (!gen.type) return;

      // Look up size from rules based on generator type
      let sizeX = 1;
      let sizeY = 1;

      if (rules && rules.generators) {
        const genConfig = rules.generators.find(g => g.id === gen.type);
        if (genConfig) {
          sizeX = genConfig.sizeX;
          sizeY = genConfig.sizeY;
        }
      }

      const screenPos = getStructureScreenPosition(gen.x, gen.y, sizeX, sizeY);

      let displayObject;

      // Get type-specific assets
      const genAssets = assets?.generators[gen.type];
      const genKey = `generator-${gen.id}`;

      // Generators animate continuously once placed (if animations are enabled)
      if (animationsEnabled && genAssets?.anim) {
        // Reuse existing sprite if available, otherwise create new one
        let existingSprite = animatedSpritesRef.current[genKey];

        if (existingSprite) {
          // Reuse existing sprite to preserve animation state
          displayObject = existingSprite;
        } else {
          // Create new animated sprite
          let framesToUse = ANIM_CONFIG.generator.frames;
          let speedToUse = ANIM_CONFIG.generator.speed;
          let frameDispositionToUse = 'horizontal';
          let colsToUse = null;

          if (rules && rules.generators) {
            const genConfig = rules.generators.find(g => g.id === gen.type);
            if (genConfig?.animation) {
               framesToUse = genConfig.animation.frames;
               speedToUse = genConfig.animation.speed;
               frameDispositionToUse = genConfig.animation.frameDisposition || 'horizontal';
               colsToUse = genConfig.animation.cols || null;
            }
          }

          const frames = createAnimationFrames(genAssets.anim, framesToUse, frameDispositionToUse, colsToUse);
          if (frames) {
            displayObject = new AnimatedSprite(frames);
            displayObject.animationSpeed = speedToUse;
            displayObject.loop = true; // Loop continuously
            displayObject.play(); // Start playing immediately

            // Store reference for cleanup
            animatedSpritesRef.current[genKey] = displayObject;
          }
        }
      }

      // Use static sprite when animations are disabled or no animation available
      if (!displayObject && genAssets?.static) {
        displayObject = new Sprite(genAssets.static);
      }

      if (displayObject) {
        displayObject.anchor.set(0.5, 1); // Bottom center anchor for structures
        displayObject.x = screenPos.x;
        // Position at the visual bottom of the footprint diamond to avoid "floating"
        displayObject.y = screenPos.y + (sizeX + sizeY) * (TILE_HEIGHT / 4);

        // Scale sprite to fit the isometric footprint
        // Expected width for a sizeX × sizeY structure: (sizeX + sizeY) * TILE_WIDTH / 2
        const expectedWidth = (sizeX + sizeY) * (TILE_WIDTH / 2);
        const spriteWidth = displayObject.texture.width;
        if (spriteWidth > 0) {
          const scale = expectedWidth / spriteWidth;
          displayObject.scale.set(scale);
        }

        // zIndex should be based on visual screen Y for correct isometric sorting
        displayObject.zIndex = screenPos.y;
        structuresContainer.addChild(displayObject);
      } else {
        // Fallback to graphics
        const genGraphics = new Graphics();
        const boxHeight = 20 + Math.max(sizeX, sizeY) * 10;
        drawStructure(genGraphics, screenPos.x, screenPos.y, sizeX, sizeY, boxHeight, COLORS.generator);
        genGraphics.zIndex = screenPos.y;
        structuresContainer.addChild(genGraphics);
      }
    });

    // Render machines
    machines?.forEach((machine) => {
      // Skip if machine type is not set (backwards compatibility)
      if (!machine.type) return;

      // Look up size from rules based on machine type
      let sizeX = 1;
      let sizeY = 1;

      if (rules && rules.machines) {
        const machineConfig = rules.machines.find(m => m.id === machine.type);
        if (machineConfig) {
          sizeX = machineConfig.sizeX;
          sizeY = machineConfig.sizeY;
        }
      }

      const screenPos = getStructureScreenPosition(machine.x, machine.y, sizeX, sizeY);
      const status = machine.enabled ? machine.status : 'idle';

      let displayObject;

      // Get type-specific assets
      const machineAssets = assets?.machines[machine.type];

      // Check if this machine is currently animating
      const machineKey = `machine-${machine.id}`;
      const isAnimating = currentlyAnimatingRef.current[machineKey];

      // For working machines that are currently animating, use animation (if animations enabled)
      if (animationsEnabled && status === 'working' && isAnimating && machineAssets?.workingAnim) {
        // Reuse existing sprite if available, otherwise create new one
        let existingSprite = animatedSpritesRef.current[machineKey];

        if (existingSprite) {
          // Reuse existing sprite to preserve animation state
          displayObject = existingSprite;
        } else {
          // Create new animated sprite
          let framesToUse = ANIM_CONFIG.machine.frames;
          let speedToUse = ANIM_CONFIG.machine.speed;
          let frameDispositionToUse = 'horizontal';
          let colsToUse = null;

          if (rules && rules.machines) {
            const machineConfig = rules.machines.find(m => m.id === machine.type);
            if (machineConfig?.animation) {
               framesToUse = machineConfig.animation.frames;
               speedToUse = machineConfig.animation.speed;
               frameDispositionToUse = machineConfig.animation.frameDisposition || 'horizontal';
               colsToUse = machineConfig.animation.cols || null;
            }
          }

          const frames = createAnimationFrames(machineAssets.workingAnim, framesToUse, frameDispositionToUse, colsToUse);
          if (frames) {
            displayObject = new AnimatedSprite(frames);
            displayObject.animationSpeed = speedToUse;
            displayObject.loop = false; // Play once per trigger
            displayObject.stop(); // Don't auto-play

            // Add completion handler to reset animation state
            displayObject.onComplete = () => {
              currentlyAnimatingRef.current[machineKey] = false;
              delete animatedSpritesRef.current[machineKey]; // Remove ref when done
              forceRenderRef.current(); // Re-render to show idle sprite
            };

            // Store reference for ticker control
            animatedSpritesRef.current[machineKey] = displayObject;
          }
        }
      }

      // Try static sprite based on status (or idle if working but not animating)
      if (!displayObject) {
        let texture;
        if (status === 'working' && !isAnimating) {
          // Working but not animating: show idle
          texture = machineAssets?.idle;
        } else {
          // Use appropriate texture for status
          texture = status === 'working' ? machineAssets?.working :
                   status === 'blocked' ? machineAssets?.blocked :
                   machineAssets?.idle;
        }
        if (texture) {
          displayObject = new Sprite(texture);
        }
      }

      if (displayObject) {
        displayObject.anchor.set(0.5, 1);
        displayObject.x = screenPos.x;
        // Position at the visual bottom of the footprint diamond to avoid "floating"
        displayObject.y = screenPos.y + (sizeX + sizeY) * (TILE_HEIGHT / 4);

        // Scale sprite to fit the isometric footprint
        // Expected width for a sizeX × sizeY structure: (sizeX + sizeY) * TILE_WIDTH / 2
        const expectedWidth = (sizeX + sizeY) * (TILE_WIDTH / 2);
        const spriteWidth = displayObject.texture.width;
        if (spriteWidth > 0) {
          const scale = expectedWidth / spriteWidth;
          displayObject.scale.set(scale);
        }

        // zIndex based on screen Y
        displayObject.zIndex = screenPos.y;
        structuresContainer.addChild(displayObject);
      } else {
        // Fallback to graphics
        const machineGraphics = new Graphics();
        const boxHeight = 25 + Math.max(sizeX, sizeY) * 8;
        const color = getMachineColor(machine.status, machine.enabled);
        drawStructure(machineGraphics, screenPos.x, screenPos.y, sizeX, sizeY, boxHeight, color);
        machineGraphics.zIndex = screenPos.y;
        structuresContainer.addChild(machineGraphics);
      }

      // Add recipe label above the machine
      const labelText = machine.recipeId
        ? machine.recipeId.replace(/_/g, ' ')
        : (machine.enabled ? 'No Recipe' : 'Disabled');
      const label = new Text({ text: labelText, style: MACHINE_LABEL_STYLE });
      label.anchor.set(0.5, 1);
      label.x = screenPos.x;
      // Position label relative to the machine top
      const machineVisualTop = (screenPos.y + (sizeX + sizeY) * (TILE_HEIGHT / 4)) - (machineAssets?.idle?.height || 30);
      label.y = machineVisualTop - 5; 
      label.zIndex = screenPos.y + 0.1; // Slightly above the machine
      structuresContainer.addChild(label);
    });

    world.addChild(structuresContainer);

    // === RENDER LOWER WALLS (after structures, so they appear on top) ===
    // This section renders:
    // 1. Internal step edges (upper-style walls not on outer perimeter) - with transparency
    // 2. Lower walls facing toward camera - with transparency
    // Render order: internal upper walls first, then lower walls (for correct depth)
    if (assets?.walls.segment) {
      const lowerWallContainer = new Container();
      const lowerWallSprites = [];
      const currentAlpha = isHovering ? WALL_CONFIG.lowerWallAlphaHover : WALL_CONFIG.lowerWallAlphaDefault;

      // Collect all boundary edges by checking each valid tile
      const internalUpperLeftEdges = []; // Step walls: no neighbor at x-1, but NOT at x=0
      const internalUpperRightEdges = []; // Step walls: no neighbor at y+1, but NOT at y=height-1
      const lowerLeftEdges = []; // Tiles needing wall on their bottom (no neighbor at y-1)
      const internalLowerRightEdges = []; // Step walls: no neighbor at x+1, but NOT at x=width-1
      const outerLowerRightEdges = []; // Outer perimeter: at x=width-1 with no neighbor at x+1

      for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
          if (!isTileValid(x, y)) continue;

          // Internal upper-left step wall (not on outer perimeter)
          if (x > 0 && !isTileValid(x - 1, y)) {
            internalUpperLeftEdges.push({ x, y });
          }

          // Internal upper-right step wall (not on outer perimeter)
          if (y < height - 1 && !isTileValid(x, y + 1)) {
            internalUpperRightEdges.push({ x, y });
          }

          // Lower-left wall (no valid neighbor at y-1)
          if (!isTileValid(x, y - 1)) {
            lowerLeftEdges.push({ x, y });
          }

          // Lower-right walls - split into internal step and outer perimeter
          if (!isTileValid(x + 1, y)) {
            if (x === width - 1) {
              outerLowerRightEdges.push({ x, y });
            } else {
              internalLowerRightEdges.push({ x, y });
            }
          }
        }
      }

      // 1. Render internal upper-left step walls FIRST (furthest from camera)
      internalUpperLeftEdges.sort((a, b) => a.y - b.y);
      for (let row = 0; row < numberOfRows; row++) {
        for (const edge of internalUpperLeftEdges) {
          const screenPos = gridToScreen(edge.x, edge.y);
          const wallSprite = new Sprite(assets.walls.segment);

          wallSprite.anchor.set(0.5, 1);
          wallSprite.alpha = currentAlpha;
          wallSprite.x = screenPos.x + WALL_CONFIG.upperLeftOffsetX;
          wallSprite.y = screenPos.y + WALL_CONFIG.upperLeftOffsetY - (row * wallHeight);

          lowerWallContainer.addChild(wallSprite);
          lowerWallSprites.push(wallSprite);
        }
      }

      // 2. Render lower-left walls
      lowerLeftEdges.sort((a, b) => a.x - b.x);
      for (let row = 0; row < numberOfRows; row++) {
        for (const edge of lowerLeftEdges) {
          const screenPos = gridToScreen(edge.x, edge.y);
          const wallSprite = new Sprite(assets.walls.segment);

          wallSprite.anchor.set(0.5, 1);
          wallSprite.scale.x = -1; // Flip horizontally to face the other direction
          wallSprite.alpha = currentAlpha;
          wallSprite.x = screenPos.x + WALL_CONFIG.lowerLeftOffsetX;
          wallSprite.y = screenPos.y + WALL_CONFIG.lowerLeftOffsetY - (row * wallHeight);

          lowerWallContainer.addChild(wallSprite);
          lowerWallSprites.push(wallSprite);
        }
      }

      // 3. Render internal lower-right step walls
      internalLowerRightEdges.sort((a, b) => b.y - a.y);
      for (let row = 0; row < numberOfRows; row++) {
        for (const edge of internalLowerRightEdges) {
          const screenPos = gridToScreen(edge.x, edge.y);
          const wallSprite = new Sprite(assets.walls.segment);

          wallSprite.anchor.set(0.5, 1);
          wallSprite.alpha = currentAlpha;
          wallSprite.x = screenPos.x + WALL_CONFIG.lowerRightOffsetX;
          wallSprite.y = screenPos.y + WALL_CONFIG.lowerRightOffsetY - (row * wallHeight);

          lowerWallContainer.addChild(wallSprite);
          lowerWallSprites.push(wallSprite);
        }
      }

      // 4. Render internal upper-right step walls
      internalUpperRightEdges.sort((a, b) => b.x - a.x);
      for (let row = 0; row < numberOfRows; row++) {
        for (const edge of internalUpperRightEdges) {
          const screenPos = gridToScreen(edge.x, edge.y);
          const wallSprite = new Sprite(assets.walls.segment);

          wallSprite.anchor.set(0.5, 1);
          wallSprite.scale.x = -1;
          wallSprite.alpha = currentAlpha;
          wallSprite.x = screenPos.x + WALL_CONFIG.upperRightOffsetX;
          wallSprite.y = screenPos.y + WALL_CONFIG.upperRightOffsetY - (row * wallHeight);

          lowerWallContainer.addChild(wallSprite);
          lowerWallSprites.push(wallSprite);
        }
      }

      // 5. Render outer lower-right walls LAST (original perimeter, closest to camera)
      outerLowerRightEdges.sort((a, b) => b.y - a.y);
      for (let row = 0; row < numberOfRows; row++) {
        for (const edge of outerLowerRightEdges) {
          const screenPos = gridToScreen(edge.x, edge.y);
          const wallSprite = new Sprite(assets.walls.segment);

          wallSprite.anchor.set(0.5, 1);
          wallSprite.alpha = currentAlpha;
          wallSprite.x = screenPos.x + WALL_CONFIG.lowerRightOffsetX;
          wallSprite.y = screenPos.y + WALL_CONFIG.lowerRightOffsetY - (row * wallHeight);

          lowerWallContainer.addChild(wallSprite);
          lowerWallSprites.push(wallSprite);
        }
      }

      // Store sprites ref for hover alpha updates
      lowerWallSpritesRef.current = lowerWallSprites;

      world.addChild(lowerWallContainer);
    }

    // === RENDER PLACEMENT OVERLAY (when dragging) ===
    if (dragState?.isDragging && hoverGridPos.x >= 0 && hoverGridPos.y >= 0) {
      const overlayGraphics = new Graphics();
      const { sizeX, sizeY, movingStructureId } = dragState;

      // Check if placement is valid
      let isValid = false;
      if (engineState) {
        if (movingStructureId) {
          // When moving a structure, exclude it from collision detection
          const placementsWithoutThis = engineState.floorSpace.placements.filter(p => p.id !== movingStructureId);
          const tempState = {
            ...engineState,
            floorSpace: { ...engineState.floorSpace, placements: placementsWithoutThis }
          };
          isValid = canPlaceAt(tempState, hoverGridPos.x, hoverGridPos.y, sizeX, sizeY, rules).valid;
        } else {
          isValid = canPlaceAt(engineState, hoverGridPos.x, hoverGridPos.y, sizeX, sizeY, rules).valid;
        }
      }

      const color = isValid ? 0x00ff00 : 0xff0000; // Green or Red

      // Draw each tile the structure would occupy
      for (let dx = 0; dx < sizeX; dx++) {
        for (let dy = 0; dy < sizeY; dy++) {
          const tileX = hoverGridPos.x + dx;
          const tileY = hoverGridPos.y + dy;
          const screenPos = gridToScreen(tileX, tileY);
          drawIsometricTile(overlayGraphics, screenPos.x, screenPos.y, color, null);
        }
      }

      overlayGraphics.alpha = 0.4;
      overlayGraphics.zIndex = 9999;
      world.addChild(overlayGraphics);
    }

  }, [floorSpace, machines, generators, assetsLoaded, isHovering, dragState, hoverGridPos, engineState, rules]);

  // Update lower wall transparency on hover change
  useEffect(() => {
    const alpha = isHovering ? WALL_CONFIG.lowerWallAlphaHover : WALL_CONFIG.lowerWallAlphaDefault;
    lowerWallSpritesRef.current.forEach(sprite => {
      sprite.alpha = alpha;
    });
  }, [isHovering]);

  // Initialize PixiJS Application
  useEffect(() => {
    if (!containerRef.current || appRef.current) return;

    let isMounted = true;

    const initPixi = async () => {
      const app = new Application();
      const container = containerRef.current;

      await app.init({
        background: COLORS.empty,
        resizeTo: container,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true
      });

      // Check if component unmounted during async init
      if (!isMounted || !containerRef.current) {
        app.destroy(true);
        return;
      }

      containerRef.current.appendChild(app.canvas);
      appRef.current = app;

      // Load assets
      const assets = await loadAssets(rules);

      // Check again after asset loading
      if (!isMounted) {
        app.destroy(true);
        appRef.current = null;
        return;
      }

      assetsRef.current = assets;
      setAssetsLoaded(true);

      // Create world container for zoom/pan
      const world = new Container();
      app.stage.addChild(world);
      worldRef.current = world;

      // Setup animation ticker to trigger random animations for machines only
      // Generators animate continuously when enabled
      app.ticker.add(() => {
        // Skip animation logic if animations are disabled
        if (!animationsEnabledRef.current) return;

        // Only check machines for random animation triggers
        const machineItems = (machinesRef.current || []).map(m => ({
          key: `machine-${m.id}`,
          type: 'machine',
          id: m.id
        }));

        machineItems.forEach(({ key, type, id }) => {
          // Check if should trigger
          if (shouldTriggerAnimation(id, type)) {
            // Mark as animating
            currentlyAnimatingRef.current[key] = true;
            // Trigger re-render to create AnimatedSprite
            forceRenderRef.current();
          }
        });

        // Play any machine sprites that are marked as animating
        Object.entries(animatedSpritesRef.current).forEach(([key, sprite]) => {
          if (key.startsWith('machine-') && currentlyAnimatingRef.current[key] && !sprite.playing) {
            sprite.gotoAndPlay(0);
          }
        });
      });

      // Setup zoom (mouse wheel)
      const canvas = app.canvas;
      const handleWheel = (e) => {
        const currentWorld = worldRef.current;
        if (!currentWorld) return;
        e.preventDefault();
        const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Math.min(Math.max(currentWorld.scale.x * scaleFactor, minZoomRef.current), 4);

        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const worldPos = {
          x: (mouseX - currentWorld.x) / currentWorld.scale.x,
          y: (mouseY - currentWorld.y) / currentWorld.scale.y
        };

        currentWorld.scale.set(newScale);
        currentWorld.x = mouseX - worldPos.x * newScale;
        currentWorld.y = mouseY - worldPos.y * newScale;
      };

      // Setup pan (mouse drag)
      // Setup pan (mouse drag)
      // Note: mousedown is now handled by the React handler to support priority


      const handleMouseMove = (e) => {
        const currentWorld = worldRef.current;

        // Handle dragging
        if (dragRef.current.isDragging && currentWorld) {
          const dx = e.clientX - dragRef.current.lastX;
          const dy = e.clientY - dragRef.current.lastY;
          currentWorld.x += dx;
          currentWorld.y += dy;
          dragRef.current.lastX = e.clientX;
          dragRef.current.lastY = e.clientY;
        }

          // Hover detection is now handled by the React onMouseMove handler (handleMouseMoveEnhanced)
          // to use the accurate isPointOverFactory function.
      };

      const handleMouseUp = () => {
        dragRef.current.isDragging = false;
        canvas.style.cursor = 'grab';
      };

      const handleMouseLeave = () => {
        setIsHovering(false);
      };



      canvas.style.cursor = 'grab';
      canvas.addEventListener('wheel', handleWheel, { passive: false });
      // canvas.addEventListener('mousedown', handleMouseDown); // Moved to React handler
      canvas.addEventListener('mouseleave', handleMouseLeave);
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      app._cleanupHandlers = { handleWheel, handleMouseMove, handleMouseUp, handleMouseLeave };
    };

    initPixi();

    return () => {
      isMounted = false;
      if (appRef.current) {
        const app = appRef.current;
        const canvas = app.canvas;
        const handlers = app._cleanupHandlers;

        if (handlers) {
          canvas.removeEventListener('wheel', handlers.handleWheel);

          // canvas.removeEventListener('mousedown', handlers.handleMouseDown);

          canvas.removeEventListener('mouseleave', handlers.handleMouseLeave);
          window.removeEventListener('mousemove', handlers.handleMouseMove);
          window.removeEventListener('mouseup', handlers.handleMouseUp);
        }

        app.destroy(true, { children: true });
        appRef.current = null;
        worldRef.current = null;
      }
    };
  }, []);

  // Re-render when game state changes
  useEffect(() => {
    render();
  }, [render]);

  // Re-center view when floor space dimensions change or when assets finish loading
  useEffect(() => {
    if (!appRef.current || !worldRef.current || !floorSpace || !assetsLoaded) return;

    const app = appRef.current;
    const world = worldRef.current;
    const center = getGridCenter(floorSpace.width, floorSpace.height);

    // Calculate scale to fit the factory in view with some padding
    const factoryPixelWidth = floorSpace.width * TILE_WIDTH;
    const factoryPixelHeight = floorSpace.height * TILE_HEIGHT;
    const padding = 1.2; // 20% padding
    const scaleX = app.screen.width / (factoryPixelWidth * padding);
    const scaleY = app.screen.height / (factoryPixelHeight * padding);
    const fitScale = Math.min(scaleX, scaleY, 2); // Cap at 2x zoom

    // Update dynamic minimum zoom to allow seeing the whole factory
    // Use a slightly smaller scale than fitScale to give some margin
    minZoomRef.current = Math.min(fitScale * 0.8, 0.25);

    world.scale.set(fitScale);
    world.x = app.screen.width / 2 - center.x * fitScale;
    world.y = app.screen.height / 2 - center.y * fitScale;
  }, [floorSpace?.width, floorSpace?.height, assetsLoaded]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (appRef.current && containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        appRef.current.renderer.resize(width, height);
      }
    };

    window.addEventListener('resize', handleResize);
    
    // Add global mouse move for hover detection that can access latest state/refs
    // Note: The original useEffect implementation had stale closure issues or complexity regarding updated refs.
    // We attach a listener to the window here, but we need access to isPointOverFactory which is a dependency.
    // Instead of a global window listener here, we'll delegate Hover detection to the React onMouseMove prop
    // which effectively covers the canvas area. For "leaving" the canvas, onMouseLeave is sufficient.
    
    return () => window.removeEventListener('resize', handleResize);
  }, []); // Keep empty deps for init

  // Effect to handle hover updates via React event to ensure fresh access to isPointOverFactory
  // We'll update the ref value that the PIXI render loop or other effects might need?
  // Actually, setIsHovering is state. So we just need to call it.


  // Check if a world-space point is over the factory (floor or upper walls)
  const isPointOverFactory = useCallback((worldX, worldY) => {
    if (!floorSpace) return false;
    const { width, height } = floorSpace;

    // 1. Check Floor
    const gridPos = screenToGrid(worldX, worldY);
    if (gridPos.x >= 0 && gridPos.x < width && gridPos.y >= 0 && gridPos.y < height) {
      return true;
    }

    // Calculate wall height
    let wallPixelHeight = 0;
    if (assetsRef.current?.walls?.segment) {
        const rows = getWallRowCount(width, height);
        // Effective height of the wall stack
        // The loop is: y = pos - row * wallHeight
        // So the stack extends upwards by (rows-1) * wallHeight + segmentHeight
        const wallHeight = assetsRef.current.walls.segment.height - WALL_CONFIG.wallRowVerticalOffset;
        wallPixelHeight = (rows - 1) * wallHeight + assetsRef.current.walls.segment.height;
    }

    if (wallPixelHeight <= 0) return false;

    const halfW = TILE_WIDTH / 2;
    const halfH = TILE_HEIGHT / 2;

    // 2. Check Left Upper Wall (Plane X=0)
    // Projection: sx = (0 + y) * halfW, sy = (0 - y) * halfH - z
    // Solve for y: y = sx / halfW
    // Solve for z: z = -y * halfH - sy
    const leftWallY = worldX / halfW;
    const leftWallZ = -leftWallY * halfH - worldY;

    if (leftWallY >= 0 && leftWallY <= height && leftWallZ >= 0 && leftWallZ <= wallPixelHeight) {
      return true;
    }

    // 3. Check Right Upper Wall (Plane Y=Height)
    // Projection: sx = (x + height) * halfW, sy = (x - height) * halfH - z
    // Solve for x: x = sx / halfW - height
    // Solve for z: z = (x - height) * halfH - sy
    const rightWallX = worldX / halfW - height;
    const rightWallZ = (rightWallX - height) * halfH - worldY;

    if (rightWallX >= 0 && rightWallX <= width && rightWallZ >= 0 && rightWallZ <= wallPixelHeight) {
      return true;
    }

    return false;
  }, [floorSpace]);

  // Convert screen coordinates to grid coordinates accounting for pan/zoom
  const screenToGridCoords = useCallback((clientX, clientY) => {
    if (!containerRef.current || !worldRef.current) return null;

    const rect = containerRef.current.getBoundingClientRect();
    const canvasX = clientX - rect.left;
    const canvasY = clientY - rect.top;

    const world = worldRef.current;
    const worldX = (canvasX - world.x) / world.scale.x;
    const worldY = (canvasY - world.y) / world.scale.y;

    const gridPos = screenToGrid(worldX, worldY);
    return {
      x: Math.floor(gridPos.x),
      y: Math.floor(gridPos.y)
    };
  }, []);

  // Handle drag over to update hover position
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const gridPos = screenToGridCoords(e.clientX, e.clientY);
    if (gridPos) {
      setHoverGridPos(gridPos);
    }
  }, [screenToGridCoords]);

  // Handle drop to place machine/generator
  const handleDrop = useCallback((e) => {
    e.preventDefault();

    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      const { itemType, itemId, generatorType, machineType, sizeX, sizeY } = data;

      const gridPos = screenToGridCoords(e.clientX, e.clientY);
      if (gridPos && onDrop) {
        // Calculate screen position for popup (based on where the machine will be placed)
        let screenPos = null;
        if (containerRef.current && worldRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const world = worldRef.current;
          const structureSizeX = sizeX || 1;
          const structureSizeY = sizeY || 1;
          const structureScreenPos = getStructureScreenPosition(gridPos.x, gridPos.y, structureSizeX, structureSizeY);
          screenPos = {
            left: structureScreenPos.x * world.scale.x + world.x + rect.left,
            top: structureScreenPos.y * world.scale.y + world.y + rect.top
          };
        }
        onDrop(itemType, itemId, gridPos.x, gridPos.y, generatorType, machineType, screenPos);
      }
    } catch (err) {
      console.warn('Failed to parse drop data:', err);
    }

    setHoverGridPos({ x: -1, y: -1 });
  }, [screenToGridCoords, onDrop]);

  // Handle drag leave to clear hover
  const handleDragLeave = useCallback(() => {
    setHoverGridPos({ x: -1, y: -1 });
  }, []);

  // Find structure (machine or generator) at world coordinates
  const findStructureAtWorldPos = useCallback((worldX, worldY) => {
    if (!rules) return null;

    // Helper to check collision with a list of items
    const checkItems = (items, type) => {
      if (!items) return null;
      for (const item of items) {
        let sizeX = 1;
        let sizeY = 1;

        if (type === 'machine') {
           // Look up machine size based on type
           if (rules.machines && item.type) {
             const machineConfig = rules.machines.find(m => m.id === item.type);
             if (machineConfig) {
               sizeX = machineConfig.sizeX;
               sizeY = machineConfig.sizeY;
             }
           }
        } else if (type === 'generator') {
           // Look up generator size
           if (rules.generators && item.type) {
             const genConfig = rules.generators.find(g => g.id === item.type);
             if (genConfig) {
               sizeX = genConfig.sizeX;
               sizeY = genConfig.sizeY;
             }
           }
        }

        const structureScreenPos = getStructureScreenPosition(item.x, item.y, sizeX, sizeY);
        const baseOffset = (sizeX + sizeY) * (TILE_HEIGHT / 4);
        const visualBottom = structureScreenPos.y + baseOffset;
        
        // Approximate height based on assets or defaults
        let visualHeight = 40;
        if (type === 'machine') {
            const assets = assetsRef.current?.machines[item.type];
            visualHeight = assets?.idle?.height || 40;
        } else {
            const assets = assetsRef.current?.generators[item.type];
            visualHeight = assets?.static?.height || 40;
        }

        const visualTop = visualBottom - visualHeight;
        const halfWidth = (sizeX + sizeY) * (TILE_WIDTH / 4) + 10;

        const left = structureScreenPos.x - halfWidth;
        const right = structureScreenPos.x + halfWidth;

        // Add some padding for the label area
        const clickTop = visualTop - 20;
        const clickBottom = visualBottom + 5;

        if (worldX >= left && worldX <= right && worldY >= clickTop && worldY <= clickBottom) {
          return item;
        }
      }
      return null;
    };

    const machine = checkItems(machines, 'machine');
    if (machine) return { type: 'machine', item: machine };

    const generator = checkItems(generators, 'generator');
    if (generator) return { type: 'generator', item: generator };

    return null;
  }, [machines, generators, rules]);

  // Handle mouse down to detect potential machine drag OR start camera pan
  const handleMouseDown = useCallback((e) => {
    if (!containerRef.current || !worldRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const world = worldRef.current;

    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;
    const worldX = (canvasX - world.x) / world.scale.x;
    const worldY = (canvasY - world.y) / world.scale.y;

    const structureFound = findStructureAtWorldPos(worldX, worldY);

    // Check for Right Click (Button 2) -> Remove machine/generator
    if (e.button === 2) {
      if (structureFound) {
        if (structureFound.type === 'machine' && onMachineRightClick) {
          onMachineRightClick(structureFound.item);
        } else if (structureFound.type === 'generator' && onGeneratorRightClick) {
          onGeneratorRightClick(structureFound.item);
        }
      }
      return;
    }

    // Check for Middle Click (Button 1) -> Always Pan
    if (e.button === 1) {
      dragRef.current = { isDragging: true, lastX: e.clientX, lastY: e.clientY };
      if (appRef.current && appRef.current.canvas) {
        appRef.current.canvas.style.cursor = 'grabbing';
      }
      return;
    }

    // Only proceed with Left Click (Button 0) for other interactions
    if (e.button !== 0) return;

    // Check if click is inside factory bounds (floor OR upper walls)
    const isInsideFactory = isPointOverFactory(worldX, worldY);

    if (structureFound) {
      // Priority 1: Structure Drag (Left click on machine/generator)
      structureDragRef.current = {
        type: structureFound.type,
        item: structureFound.item,
        startX: e.clientX,
        startY: e.clientY,
        hasMoved: false
      };
    } else if (!isInsideFactory) {
      // Priority 2: Camera Pan (Left click OUTSIDE factory)
      dragRef.current = { isDragging: true, lastX: e.clientX, lastY: e.clientY };
      if (appRef.current && appRef.current.canvas) {
        appRef.current.canvas.style.cursor = 'grabbing';
      }
    }
    // Else: Left click on factory (floor or wall) -> Do Nothing (prevent pan)
  }, [findStructureAtWorldPos, isPointOverFactory, onMachineRightClick, onGeneratorRightClick]);

  // Handle mouse move for structure drag
  const handleMouseMove = useCallback((e) => {
    const dragData = structureDragRef.current;
    if (!dragData.item) return;

    const dx = Math.abs(e.clientX - dragData.startX);
    const dy = Math.abs(e.clientY - dragData.startY);

    // If moved more than 5px, start the drag
    if (!dragData.hasMoved && (dx > 5 || dy > 5)) {
      dragData.hasMoved = true;

      // Determine size for drag feedback
      let sizeX = 1;
      let sizeY = 1;
      
      if (dragData.type === 'machine') {
         // Look up machine size based on type
         if (rules?.machines && dragData.item.type) {
           const machineConfig = rules.machines.find(m => m.id === dragData.item.type);
           if (machineConfig) {
             sizeX = machineConfig.sizeX;
             sizeY = machineConfig.sizeY;
           }
         }
         onStructureDragStart?.(dragData.item, 'machine', sizeX, sizeY);
      } else if (dragData.type === 'generator') {
         // Determine generator size
         if (rules?.generators && dragData.item.type) {
             const genConfig = rules.generators.find(g => g.id === dragData.item.type);
             if (genConfig) {
               sizeX = genConfig.sizeX;
               sizeY = genConfig.sizeY;
             }
         }
         onStructureDragStart?.(dragData.item, 'generator', sizeX, sizeY);
      }
    }

    // Update hover position during drag
    if (dragData.hasMoved && containerRef.current && worldRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const world = worldRef.current;
      const canvasX = e.clientX - rect.left;
      const canvasY = e.clientY - rect.top;
      const worldX = (canvasX - world.x) / world.scale.x;
      const worldY = (canvasY - world.y) / world.scale.y;
      const gridPos = screenToGrid(worldX, worldY);

      setHoverGridPos({
        x: Math.floor(gridPos.x),
        y: Math.floor(gridPos.y)
      });
    }
  }, [rules, onStructureDragStart]);


  // Handle mouse up to end drag OR click (popup)
  const handleMouseUp = useCallback((e) => {
    const dragData = structureDragRef.current;

    // 1. Handle Drag End (Drop)
    if (dragData.item && dragData.hasMoved) {
      if (containerRef.current && worldRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const world = worldRef.current;
        const canvasX = e.clientX - rect.left;
        const canvasY = e.clientY - rect.top;
        const worldX = (canvasX - world.x) / world.scale.x;
        const worldY = (canvasY - world.y) / world.scale.y;
        const gridPos = screenToGrid(worldX, worldY);

        // Call onDrop with appropriate move info
        const moveType = dragData.type === 'machine' ? 'machine-move' : 'generator-move';
        onDrop?.(moveType, dragData.item.id, Math.floor(gridPos.x), Math.floor(gridPos.y));
      }
    } 
    // 2. Handle Click (No Move) - Open Popup
    else if (dragData.item && !dragData.hasMoved) {
        if (dragData.type === 'machine' && onMachineClick && containerRef.current && worldRef.current) {
            // Re-calculate screen position for popup using actual machine size
            const rect = containerRef.current.getBoundingClientRect();
            const world = worldRef.current;
            
            let sizeX = 1;
            let sizeY = 1;

            if (rules?.machines && dragData.item.type) {
                const machineConfig = rules.machines.find(m => m.id === dragData.item.type);
                if (machineConfig) {
                    sizeX = machineConfig.sizeX;
                    sizeY = machineConfig.sizeY;
                }
            }

            const structureScreenPos = getStructureScreenPosition(dragData.item.x, dragData.item.y, sizeX, sizeY);
            
            const screenX = structureScreenPos.x * world.scale.x + world.x + rect.left;
            const screenY = structureScreenPos.y * world.scale.y + world.y + rect.top;

            onMachineClick(dragData.item, { left: screenX, top: screenY });
        }
    }

    // Reset drag state
    structureDragRef.current = { type: null, item: null, startX: 0, startY: 0, hasMoved: false };
    setHoverGridPos({ x: -1, y: -1 });
  }, [onDrop, onMachineClick, rules]);

  // Enhanced Mouse Move to handle both machine drag AND hover detection
  const handleMouseMoveEnhanced = useCallback((e) => {
    // 1. Hover Detection
    if (containerRef.current && worldRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const world = worldRef.current;
        const canvasX = e.clientX - rect.left;
        const canvasY = e.clientY - rect.top;
        const worldX = (canvasX - world.x) / world.scale.x;
        const worldY = (canvasY - world.y) / world.scale.y;
        
        const isOver = isPointOverFactory(worldX, worldY);
        setIsHovering(isOver);
    }

    // 2. Machine Drag (delegate to existing logic)
    handleMouseMove(e);
  }, [isPointOverFactory, handleMouseMove]);

  return (
    <div
      ref={containerRef}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragLeave={handleDragLeave}
      onContextMenu={(e) => e.preventDefault()}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMoveEnhanced}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        setIsHovering(false);
      }}
      style={{
        width: '100%',
        height: '400px',
        borderRadius: '8px',
        overflow: 'hidden'
      }}
    />
  );
}
