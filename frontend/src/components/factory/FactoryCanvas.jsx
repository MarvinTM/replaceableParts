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

// Animation config (frames per sprite sheet, animation speed)
const ANIM_CONFIG = {
  machine: { frames: 4, speed: 0.1 },
  generator: { frames: 4, speed: 0.08 }
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
 */
async function loadAssets() {
  const loaded = {
    floor: { light: null, dark: null },
    walls: { segment: null },
    machines: { idle: null, working: null, blocked: null, workingAnim: null },
    generators: { default: null, anim: null }
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

  // Load machine sprites
  loaded.machines.idle = await tryLoad(ASSET_MANIFEST.machines.idle);
  loaded.machines.working = await tryLoad(ASSET_MANIFEST.machines.working);
  loaded.machines.blocked = await tryLoad(ASSET_MANIFEST.machines.blocked);
  loaded.machines.workingAnim = await tryLoad(ASSET_MANIFEST.machines.workingAnim);

  // Load generator sprites
  loaded.generators.default = await tryLoad(ASSET_MANIFEST.generators.default);
  loaded.generators.anim = await tryLoad(ASSET_MANIFEST.generators.anim);

  return loaded;
}

/**
 * Create animation frames from a horizontal sprite sheet
 */
function createAnimationFrames(texture, frameCount) {
  if (!texture) return null;

  const frameWidth = texture.width / frameCount;
  const frameHeight = texture.height;
  const frames = [];

  for (let i = 0; i < frameCount; i++) {
    const frame = new Texture({
      source: texture.source,
      frame: {
        x: i * frameWidth,
        y: 0,
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
  onMachineDragStart,
  engineState
}) {
  const containerRef = useRef(null);
  const appRef = useRef(null);
  const worldRef = useRef(null);
  const assetsRef = useRef(null);
  const dragRef = useRef({ isDragging: false, lastX: 0, lastY: 0 });
  const minZoomRef = useRef(0.25); // Dynamic minimum zoom based on factory size
  const lowerWallSpritesRef = useRef([]); // Store lower wall sprites for alpha updates
  const floorDimensionsRef = useRef({ width: 0, height: 0 }); // Store floor dimensions for hover check
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  // Drag-and-drop placement state
  const [hoverGridPos, setHoverGridPos] = useState({ x: -1, y: -1 });

  // Machine drag tracking (for repositioning existing machines)
  const machineDragRef = useRef({ machine: null, startX: 0, startY: 0, hasMoved: false });

  // Clear hover position when drag ends
  useEffect(() => {
    if (!dragState?.isDragging) {
      setHoverGridPos({ x: -1, y: -1 });
    }
  }, [dragState?.isDragging]);

  const render = useCallback(() => {
    if (!worldRef.current || !floorSpace) return;

    const world = worldRef.current;
    const assets = assetsRef.current;

    // Clear previous content
    world.removeChildren();

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
    const wallHeight = assets?.walls.segment ? assets.walls.segment.height - WALL_CONFIG.wallRowVerticalOffset : 0;
    const numberOfRows = getWallRowCount(width, height);

    if (assets?.walls.segment) {
      const upperWallContainer = new Container();

      // Upper-left wall: along x=0 (grows up-right as y increases)
      for (let row = 0; row < numberOfRows; row++) {
        for (let y = 0; y < height; y++) {
          if (!isTileValid(0, y)) continue;

          const screenPos = gridToScreen(0, y);
          const wallSprite = new Sprite(assets.walls.segment);

          wallSprite.anchor.set(0.5, 1);
          wallSprite.x = screenPos.x + WALL_CONFIG.upperLeftOffsetX;
          wallSprite.y = screenPos.y + WALL_CONFIG.upperLeftOffsetY - (row * wallHeight);

          upperWallContainer.addChild(wallSprite);
        }
      }

      // Upper-right wall: along y=height-1 (last row)
      // Render in reverse order so overlapping matches the left wall
      for (let row = 0; row < numberOfRows; row++) {
        for (let x = width - 1; x >= 0; x--) {
          if (!isTileValid(x, height - 1)) continue;

          const screenPos = gridToScreen(x, height - 1);
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
      // Look up size from rules based on generator type
      let sizeX = 1;
      let sizeY = 1;
      
      if (rules && rules.generators && rules.generators.types) {
        const genConfig = rules.generators.types.find(g => g.id === gen.type);
        if (genConfig) {
          sizeX = genConfig.sizeX;
          sizeY = genConfig.sizeY;
        }
      }

      const screenPos = getStructureScreenPosition(gen.x, gen.y, sizeX, sizeY);

      let displayObject;

      // Try animated sprite first, then static, then fallback to graphics
      if (assets?.generators.anim) {
        const frames = createAnimationFrames(assets.generators.anim, ANIM_CONFIG.generator.frames);
        if (frames) {
          displayObject = new AnimatedSprite(frames);
          displayObject.animationSpeed = ANIM_CONFIG.generator.speed;
          displayObject.play();
        }
      }

      if (!displayObject && assets?.generators.default) {
        displayObject = new Sprite(assets.generators.default);
      }

      if (displayObject) {
        displayObject.anchor.set(0.5, 1); // Bottom center anchor for structures
        displayObject.x = screenPos.x;
        displayObject.y = screenPos.y + TILE_HEIGHT / 2;
        displayObject.scale.set(sizeX, sizeY);
        displayObject.zIndex = gen.x - gen.y;
        structuresContainer.addChild(displayObject);
      } else {
        // Fallback to graphics
        const genGraphics = new Graphics();
        const boxHeight = 20 + Math.max(sizeX, sizeY) * 10;
        drawStructure(genGraphics, screenPos.x, screenPos.y, sizeX, sizeY, boxHeight, COLORS.generator);
        genGraphics.zIndex = gen.x - gen.y;
        structuresContainer.addChild(genGraphics);
      }
    });

    // Render machines
    machines?.forEach((machine) => {
      // Look up size from rules (machines have base size)
      let sizeX = 1;
      let sizeY = 1;

      if (rules && rules.machines) {
        sizeX = rules.machines.baseSizeX;
        sizeY = rules.machines.baseSizeY;
      }

      const screenPos = getStructureScreenPosition(machine.x, machine.y, sizeX, sizeY);
      const status = machine.enabled ? machine.status : 'idle';

      let displayObject;

      // For working machines, try animation first
      if (status === 'working' && assets?.machines.workingAnim) {
        const frames = createAnimationFrames(assets.machines.workingAnim, ANIM_CONFIG.machine.frames);
        if (frames) {
          displayObject = new AnimatedSprite(frames);
          displayObject.animationSpeed = ANIM_CONFIG.machine.speed;
          displayObject.play();
        }
      }

      // Try static sprite based on status
      if (!displayObject) {
        const texture = status === 'working' ? assets?.machines.working :
                       status === 'blocked' ? assets?.machines.blocked :
                       assets?.machines.idle;
        if (texture) {
          displayObject = new Sprite(texture);
        }
      }

      if (displayObject) {
        displayObject.anchor.set(0.5, 1);
        displayObject.x = screenPos.x;
        displayObject.y = screenPos.y + TILE_HEIGHT / 2;
        displayObject.scale.set(sizeX, sizeY);
        displayObject.zIndex = machine.x - machine.y;
        structuresContainer.addChild(displayObject);
      } else {
        // Fallback to graphics
        const machineGraphics = new Graphics();
        const boxHeight = 25 + Math.max(sizeX, sizeY) * 8;
        const color = getMachineColor(machine.status, machine.enabled);
        drawStructure(machineGraphics, screenPos.x, screenPos.y, sizeX, sizeY, boxHeight, color);
        machineGraphics.zIndex = machine.x - machine.y;
        structuresContainer.addChild(machineGraphics);
      }

      // Add recipe label above the machine
      const labelText = machine.recipeId
        ? machine.recipeId.replace(/_/g, ' ')
        : (machine.enabled ? 'No Recipe' : 'Disabled');
      const label = new Text({ text: labelText, style: MACHINE_LABEL_STYLE });
      label.anchor.set(0.5, 1);
      label.x = screenPos.x;
      label.y = screenPos.y - 30; // Position above the machine
      label.zIndex = machine.x - machine.y + 0.1; // Slightly above the machine
      structuresContainer.addChild(label);
    });

    world.addChild(structuresContainer);

    // === RENDER LOWER WALLS (after structures, so they appear on top) ===
    if (assets?.walls.segment) {
      const lowerWallContainer = new Container();
      const lowerWallSprites = [];
      const currentAlpha = isHovering ? WALL_CONFIG.lowerWallAlphaHover : WALL_CONFIG.lowerWallAlphaDefault;

      // Lower-left wall: along y=0 (with transparency, upright but on lower edge)
      for (let row = 0; row < numberOfRows; row++) {
        for (let x = 0; x < width; x++) {
          if (!isTileValid(x, 0)) continue;

          const screenPos = gridToScreen(x, 0);
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

      // Lower-right wall: along x=width-1 (with transparency, upright but on lower edge)
      // Render in reverse order so overlapping is consistent
      for (let row = 0; row < numberOfRows; row++) {
        for (let y = height - 1; y >= 0; y--) {
          if (!isTileValid(width - 1, y)) continue;

          const screenPos = gridToScreen(width - 1, y);
          const wallSprite = new Sprite(assets.walls.segment);

          wallSprite.anchor.set(0.5, 1);
          // No horizontal flip - faces same direction as upper-left
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
      const { sizeX, sizeY, movingMachineId } = dragState;

      // Check if placement is valid
      let isValid = false;
      if (engineState) {
        if (movingMachineId) {
          // When moving a machine, exclude it from collision detection
          const placementsWithoutThis = engineState.floorSpace.placements.filter(p => p.id !== movingMachineId);
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
      const assets = await loadAssets();

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
      const { itemType, itemId, generatorType } = data;

      const gridPos = screenToGridCoords(e.clientX, e.clientY);
      if (gridPos && onDrop) {
        onDrop(itemType, itemId, gridPos.x, gridPos.y, generatorType);
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

  // Find machine at world coordinates (for click/drag detection)
  const findMachineAtWorldPos = useCallback((worldX, worldY) => {
    if (!machines || !rules) return null;

    const sizeX = rules.machines?.baseSizeX || 1;
    const sizeY = rules.machines?.baseSizeY || 1;

    for (const machine of machines) {
      const structureScreenPos = getStructureScreenPosition(machine.x, machine.y, sizeX, sizeY);

      // Define bounding box in world coordinates (including label)
      const labelTop = structureScreenPos.y - 45;
      const machineBottom = structureScreenPos.y + TILE_HEIGHT / 2 + 10;
      const halfWidth = (sizeX + sizeY) * TILE_WIDTH / 4 + 20;

      const left = structureScreenPos.x - halfWidth;
      const right = structureScreenPos.x + halfWidth;

      if (worldX >= left && worldX <= right && worldY >= labelTop && worldY <= machineBottom) {
        return machine;
      }
    }
    return null;
  }, [machines, rules]);

  // Handle mouse down to detect potential machine drag OR start camera pan
  const handleMouseDown = useCallback((e) => {
    if (!containerRef.current || !worldRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const world = worldRef.current;
    
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

    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;
    const worldX = (canvasX - world.x) / world.scale.x;
    const worldY = (canvasY - world.y) / world.scale.y;

    const machine = findMachineAtWorldPos(worldX, worldY);
    
    // Check if click is inside factory bounds (floor OR upper walls)
    const isInsideFactory = isPointOverFactory(worldX, worldY);

    if (machine) {
      // Priority 1: Machine Drag (Left click on machine)
      machineDragRef.current = {
        machine,
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
  }, [findMachineAtWorldPos, isPointOverFactory]);

  // Handle mouse move for machine drag
  const handleMouseMove = useCallback((e) => {
    // Global mouse move for panning is handled by window listener in initPixi
    // This handler is for machine dragging and hovering state

    // Updating isHovering state logic moved here to use React state/refs correctly if needed
    // But the original implementation used a window listener inside useEffect for hover
    // We need to update that one or unify.
    // The useEffect at line 734 adds 'mousemove' to window calling handleMouseMove (the one from initPixi).
    // THAT handleMouseMove (line 687) is defined inside useEffect closure.
    // It doesn't have access to the new isPointOverFactory unless we refactor.
    
    // However, this handleMouseMove (React hook) is attached to the DIV.
    
    // Let's rely on the React Handler for dragging machine, 
    // but we need to fix the Hover detection in the useEffect or move it here.
    
    // The previous code had `setIsHovering` inside the PIXI loop.
    // Let's move handling of `machineDragRef` here (it was already here).
    
    const dragData = machineDragRef.current;
    if (dragData.machine) {
      const dx = Math.abs(e.clientX - dragData.startX);
      const dy = Math.abs(e.clientY - dragData.startY);

      // If moved more than 5px, start the machine drag
      if (!dragData.hasMoved && (dx > 5 || dy > 5)) {
        dragData.hasMoved = true;

        const sizeX = rules?.machines?.baseSizeX || 1;
        const sizeY = rules?.machines?.baseSizeY || 1;

        // Notify parent to start machine move mode
        onMachineDragStart?.(dragData.machine, sizeX, sizeY);
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
    }
  }, [rules, onMachineDragStart]);


  // Handle mouse up to end machine drag
  const handleMouseUp = useCallback((e) => {
    const dragData = machineDragRef.current;

    if (dragData.machine && dragData.hasMoved) {
      // Get the drop position
      if (containerRef.current && worldRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const world = worldRef.current;
        const canvasX = e.clientX - rect.left;
        const canvasY = e.clientY - rect.top;
        const worldX = (canvasX - world.x) / world.scale.x;
        const worldY = (canvasY - world.y) / world.scale.y;
        const gridPos = screenToGrid(worldX, worldY);

        // Call onDrop with machine move info
        onDrop?.('machine-move', dragData.machine.id, Math.floor(gridPos.x), Math.floor(gridPos.y));
      }
    }

    // Reset drag state
    machineDragRef.current = { machine: null, startX: 0, startY: 0, hasMoved: false };
    setHoverGridPos({ x: -1, y: -1 });
  }, [onDrop]);

  // Handle right-click context menu to show machine popup
  const handleContextMenu = useCallback((e) => {
    e.preventDefault();

    // Don't fire if we just finished a drag (though unlikely with right click, good safely)
    if (machineDragRef.current.hasMoved) {
      return;
    }

    if (!onMachineClick || !machines || !rules) return;
    if (!containerRef.current || !worldRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const world = worldRef.current;

    // Convert click to world coordinates
    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;
    const worldX = (canvasX - world.x) / world.scale.x;
    const worldY = (canvasY - world.y) / world.scale.y;

    const sizeX = rules.machines?.baseSizeX || 1;
    const sizeY = rules.machines?.baseSizeY || 1;

    // Check if click is within any machine's bounding box (including label area)
    for (const machine of machines) {
      const structureScreenPos = getStructureScreenPosition(machine.x, machine.y, sizeX, sizeY);

      // Define bounding box in world coordinates
      // Label is at y - 30, machine extends down from screenPos
      const labelTop = structureScreenPos.y - 45; // Label position with some padding
      const machineBottom = structureScreenPos.y + TILE_HEIGHT / 2 + 10;
      const halfWidth = (sizeX + sizeY) * TILE_WIDTH / 4 + 20; // Approximate width with padding

      const left = structureScreenPos.x - halfWidth;
      const right = structureScreenPos.x + halfWidth;
      const top = labelTop;
      const bottom = machineBottom;

      // Check if click is within this bounding box
      if (worldX >= left && worldX <= right && worldY >= top && worldY <= bottom) {
        // Calculate screen position for the popup
        const screenX = structureScreenPos.x * world.scale.x + world.x + rect.left;
        const screenY = structureScreenPos.y * world.scale.y + world.y + rect.top;

        onMachineClick(machine, { left: screenX, top: screenY });
        return;
      }
    }
  }, [onMachineClick, machines, rules]);

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
      onContextMenu={handleContextMenu}
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
