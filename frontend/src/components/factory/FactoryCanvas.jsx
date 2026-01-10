import { useRef, useEffect, useCallback, useState } from 'react';
import { Application, Graphics, Container, Sprite, Assets, AnimatedSprite, Texture } from 'pixi.js';
import {
  TILE_WIDTH,
  TILE_HEIGHT,
  gridToScreen,
  getStructureScreenPosition,
  getGridCenter,
  COLORS
} from './useIsometric';

// Asset paths - place your images in frontend/public/assets/factory/
const ASSET_BASE = '/assets/factory';
const ASSET_MANIFEST = {
  floor: {
    light: `${ASSET_BASE}/floor_light.png`,
    dark: `${ASSET_BASE}/floor_dark.png`,
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

/**
 * Load assets and return what's available
 */
async function loadAssets() {
  const loaded = {
    floor: { light: null, dark: null },
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
 */
function drawStructure(graphics, x, y, size, height, color) {
  const halfWidth = (TILE_WIDTH * size) / 2;
  const halfHeight = (TILE_HEIGHT * size) / 2;
  const boxHeight = height;

  // Top face
  graphics.poly([
    x, y - halfHeight - boxHeight,
    x + halfWidth, y - boxHeight,
    x, y + halfHeight - boxHeight,
    x - halfWidth, y - boxHeight
  ]);
  graphics.fill(color);

  // Left face (darker)
  const darkerColor = darkenColor(color, 0.7);
  graphics.poly([
    x - halfWidth, y - boxHeight,
    x, y + halfHeight - boxHeight,
    x, y + halfHeight,
    x - halfWidth, y
  ]);
  graphics.fill(darkerColor);

  // Right face (medium)
  const mediumColor = darkenColor(color, 0.85);
  graphics.poly([
    x + halfWidth, y - boxHeight,
    x, y + halfHeight - boxHeight,
    x, y + halfHeight,
    x + halfWidth, y
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

export default function FactoryCanvas({ floorSpace, machines, generators }) {
  const containerRef = useRef(null);
  const appRef = useRef(null);
  const worldRef = useRef(null);
  const assetsRef = useRef(null);
  const dragRef = useRef({ isDragging: false, lastX: 0, lastY: 0 });
  const minZoomRef = useRef(0.25); // Dynamic minimum zoom based on factory size
  const [assetsLoaded, setAssetsLoaded] = useState(false);

  const render = useCallback(() => {
    if (!worldRef.current || !floorSpace) return;

    const world = worldRef.current;
    const assets = assetsRef.current;

    // Clear previous content
    world.removeChildren();

    const { width, height } = floorSpace;

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

    // === RENDER STRUCTURES ===
    const structuresContainer = new Container();
    structuresContainer.sortableChildren = true;

    // Render generators
    generators?.forEach((gen) => {
      const screenPos = getStructureScreenPosition(gen.x, gen.y, Math.sqrt(gen.spaceUsed));
      const size = Math.sqrt(gen.spaceUsed);

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
        displayObject.scale.set(size);
        displayObject.zIndex = gen.x - gen.y;
        structuresContainer.addChild(displayObject);
      } else {
        // Fallback to graphics
        const genGraphics = new Graphics();
        const boxHeight = 20 + size * 10;
        drawStructure(genGraphics, screenPos.x, screenPos.y, size, boxHeight, COLORS.generator);
        genGraphics.zIndex = gen.x - gen.y;
        structuresContainer.addChild(genGraphics);
      }
    });

    // Render machines
    machines?.forEach((machine) => {
      const screenPos = getStructureScreenPosition(machine.x, machine.y, Math.sqrt(machine.spaceUsed));
      const size = Math.sqrt(machine.spaceUsed);
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
        displayObject.scale.set(size);
        displayObject.zIndex = machine.x - machine.y;
        structuresContainer.addChild(displayObject);
      } else {
        // Fallback to graphics
        const machineGraphics = new Graphics();
        const boxHeight = 25 + size * 8;
        const color = getMachineColor(machine.status, machine.enabled);
        drawStructure(machineGraphics, screenPos.x, screenPos.y, size, boxHeight, color);
        machineGraphics.zIndex = machine.x - machine.y;
        structuresContainer.addChild(machineGraphics);
      }
    });

    world.addChild(structuresContainer);

  }, [floorSpace, machines, generators, assetsLoaded]);

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
      const handleMouseDown = (e) => {
        dragRef.current = { isDragging: true, lastX: e.clientX, lastY: e.clientY };
        canvas.style.cursor = 'grabbing';
      };

      const handleMouseMove = (e) => {
        const currentWorld = worldRef.current;
        if (!dragRef.current.isDragging || !currentWorld) return;
        const dx = e.clientX - dragRef.current.lastX;
        const dy = e.clientY - dragRef.current.lastY;
        currentWorld.x += dx;
        currentWorld.y += dy;
        dragRef.current.lastX = e.clientX;
        dragRef.current.lastY = e.clientY;
      };

      const handleMouseUp = () => {
        dragRef.current.isDragging = false;
        canvas.style.cursor = 'grab';
      };

      canvas.style.cursor = 'grab';
      canvas.addEventListener('wheel', handleWheel, { passive: false });
      canvas.addEventListener('mousedown', handleMouseDown);
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      app._cleanupHandlers = { handleWheel, handleMouseDown, handleMouseMove, handleMouseUp };
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
          canvas.removeEventListener('mousedown', handlers.handleMouseDown);
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
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '400px',
        borderRadius: '8px',
        overflow: 'hidden'
      }}
    />
  );
}
