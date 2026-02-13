import { useRef, useEffect, useState, useMemo } from 'react';
import { Application, Graphics, Container, Assets, Sprite, Texture } from 'pixi.js';
import {
  TILE_WIDTH,
  TILE_HEIGHT,
  gridToScreen,
  screenToGrid,
  getGridBounds
} from './coordinateUtils';
import { getIconUrl } from '../../services/iconService';
import { getIconTexture } from '../../services/assetLoaderService';

// Fog of war color (warm parchment)
const FOG_COLOR = 0xC9B896;

// Node indicator colors
const NODE_UNLOCKED_COLOR = 0x22c55e;  // Green - active
const NODE_LOCKED_COLOR = 0xf59e0b;     // Orange - available to unlock

/**
 * Transform a square texture to an isometric diamond
 * @param {HTMLImageElement} img - Source image element
 * @returns {HTMLCanvasElement} Canvas with transformed texture
 */
function transformToIsometric(img) {
  const canvas = document.createElement('canvas');
  canvas.width = TILE_WIDTH;
  canvas.height = TILE_HEIGHT;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, TILE_WIDTH, TILE_HEIGHT);

  // Transform: translate to center, scale Y by 0.5, rotate 45 degrees
  ctx.save();
  ctx.translate(TILE_WIDTH / 2, TILE_HEIGHT / 2);
  ctx.scale(1, 0.5);
  ctx.rotate(Math.PI / 4);

  // Calculate size after rotation to fill the diamond
  const size = img.width / Math.sqrt(2);
  ctx.drawImage(img, -size / 2, -size / 2, size, size);

  ctx.restore();

  return canvas;
}

/**
 * Draw an isometric diamond tile
 */
function drawIsometricTile(graphics, screenX, screenY, fillColor, strokeColor = null) {
  const halfW = TILE_WIDTH / 2;
  const halfH = TILE_HEIGHT / 2;

  graphics.moveTo(screenX, screenY - halfH);        // Top
  graphics.lineTo(screenX + halfW, screenY);        // Right
  graphics.lineTo(screenX, screenY + halfH);        // Bottom
  graphics.lineTo(screenX - halfW, screenY);        // Left
  graphics.closePath();
  graphics.fill(fillColor);

  if (strokeColor !== null) {
    graphics.stroke({ color: strokeColor, width: 1, alpha: 0.3 });
  }
}

// Icon size for extraction nodes
const NODE_ICON_SIZE = 40;

// Cache for resource icon textures
const resourceIconCache = new Map();
const failedResourceIcons = new Set();

// Cache for transformed isometric textures
const isometricTextureCache = new Map();

/**
 * Load an image and transform it to isometric
 * @param {string} path - Path to the image file
 * @returns {Promise<Texture>} - Transformed isometric texture
 */
async function loadAndTransformTexture(path) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = transformToIsometric(img);
      resolve(Texture.from(canvas));
    };

    img.onerror = () => {
      resolve(Texture.WHITE);
    };

    img.src = path;
  });
}

/**
 * Load a resource icon texture (with caching)
 * @param {string} resourceType - The resource type ID
 * @returns {Promise<Texture|null>}
 */
async function loadResourceIcon(resourceType) {
  if (resourceIconCache.has(resourceType)) {
    return resourceIconCache.get(resourceType);
  }
  if (failedResourceIcons.has(resourceType)) {
    return null;
  }

  // Check for preloaded icon first
  const preloadedIcon = getIconTexture(resourceType);
  if (preloadedIcon) {
    resourceIconCache.set(resourceType, preloadedIcon);
    return preloadedIcon;
  }

  try {
    const texture = await Assets.load(getIconUrl(resourceType));
    resourceIconCache.set(resourceType, texture);
    return texture;
  } catch {
    failedResourceIcons.add(resourceType);
    return null;
  }
}

/**
 * Draw a circular indicator for extraction nodes (fallback when icon not loaded)
 */
function drawNodeIndicatorFallback(graphics, screenX, screenY, color) {
  const radius = 8;
  graphics.circle(screenX, screenY, radius);
  graphics.fill(color);
  graphics.stroke({ color: 0xffffff, width: 2, alpha: 0.9 });
}

export default function ExplorationCanvas({ explorationMap, rules, unlockedRecipes, discoveredRecipes, focusTile, onTileClick }) {
  const containerRef = useRef(null);
  const appRef = useRef(null);
  const worldRef = useRef(null);
  const dragRef = useRef({ isDragging: false, lastX: 0, lastY: 0 });
  const explorationMapRef = useRef(explorationMap);
  const onTileClickRef = useRef(onTileClick);
  const texturesRef = useRef({});
  const [texturesLoaded, setTexturesLoaded] = useState(false);
  const [appInitialized, setAppInitialized] = useState(false);
  const [resourceIconsLoaded, setResourceIconsLoaded] = useState(false);
  const hasInitializedViewRef = useRef(false);

  // Compute the set of resources used by discovered or unlocked recipes
  // Resources appear on map as soon as a recipe requiring them is discovered
  const usedResources = useMemo(() => {
    const resources = new Set();
    if (!rules?.recipes) return resources;

    const recipeMap = new Map(rules.recipes.map(r => [r.id, r]));

    // Include resources from unlocked recipes
    if (unlockedRecipes) {
      for (const recipeId of unlockedRecipes) {
        const recipe = recipeMap.get(recipeId);
        if (recipe?.inputs) {
          for (const inputResource of Object.keys(recipe.inputs)) {
            resources.add(inputResource);
          }
        }
      }
    }

    // Include resources from discovered recipes (not yet unlocked)
    if (discoveredRecipes) {
      for (const recipeId of discoveredRecipes) {
        const recipe = recipeMap.get(recipeId);
        if (recipe?.inputs) {
          for (const inputResource of Object.keys(recipe.inputs)) {
            resources.add(inputResource);
          }
        }
      }
    }

    return resources;
  }, [rules?.recipes, unlockedRecipes, discoveredRecipes]);
  const usedResourcesRef = useRef(usedResources);

  // Keep refs updated with latest props
  useEffect(() => {
    explorationMapRef.current = explorationMap;
  }, [explorationMap]);

  useEffect(() => {
    usedResourcesRef.current = usedResources;
  }, [usedResources]);

  // Preload resource icons when usedResources changes
  useEffect(() => {
    const loadIcons = async () => {
      if (usedResources.size === 0) return;

      setResourceIconsLoaded(false);
      await Promise.all(
        Array.from(usedResources).map(resourceType => loadResourceIcon(resourceType))
      );
      setResourceIconsLoaded(true);
    };

    loadIcons();
  }, [usedResources]);

  useEffect(() => {
    onTileClickRef.current = onTileClick;
  }, [onTileClick]);

  // Load and transform terrain textures
  useEffect(() => {
    const loadTextures = async () => {
      const terrainTypes = ['water', 'plains', 'grassland', 'forest', 'jungle', 'hills', 'mountain', 'desert', 'swamp'];
      const transformedTextures = {};

      // Load and transform each terrain texture directly
      await Promise.all(
        terrainTypes.map(async (terrain) => {
          // Check cache first
          if (isometricTextureCache.has(terrain)) {
            transformedTextures[terrain] = isometricTextureCache.get(terrain);
            return;
          }

          // Load and transform
          const texture = await loadAndTransformTexture(`/assets/exploration/${terrain}.png`);
          transformedTextures[terrain] = texture;
          isometricTextureCache.set(terrain, texture);
        })
      );

      texturesRef.current = transformedTextures;
      setTexturesLoaded(true);
    };

    loadTextures();
  }, []);

  const render = () => {
    if (!worldRef.current || !explorationMap) return;

    const app = appRef.current;
    const world = worldRef.current;
    const { exploredBounds, generatedWidth, generatedHeight, tiles } = explorationMap;
    const terrainTypes = rules?.exploration?.terrainTypes || {};

    // Clear previous content
    world.removeChildren();

    // Only set initial zoom/pan on first render, preserve user's manual adjustments thereafter
    if (!hasInitializedViewRef.current) {
      // Calculate center using isometric coordinates
      const centerX = (exploredBounds.minX + exploredBounds.maxX) / 2;
      const centerY = (exploredBounds.minY + exploredBounds.maxY) / 2;
      const center = gridToScreen(centerX, centerY);

      // Calculate bounds for the explored area
      const exploredWidth = exploredBounds.maxX - exploredBounds.minX + 1;
      const exploredHeight = exploredBounds.maxY - exploredBounds.minY + 1;
      const bounds = getGridBounds(exploredWidth, exploredHeight);

      // Calculate scale to fit the isometric diamond in view
      const padding = 1.5;
      const scaleX = app.screen.width / (bounds.width * padding);
      const scaleY = app.screen.height / (bounds.height * padding);
      const initialScale = Math.max(Math.min(scaleX, scaleY, 1), 0.3);

      world.scale.set(initialScale);
      world.x = app.screen.width / 2 - center.x * initialScale;
      world.y = app.screen.height / 2 - center.y * initialScale;

      hasInitializedViewRef.current = true;
    }

    // Create a single container for all tiles (needed for proper depth sorting)
    const tileContainer = new Container();
    tileContainer.sortableChildren = true;

    // Calculate visible bounds (explored area plus some fog around it)
    const fogPadding = 3;
    const visibleBounds = {
      minX: Math.max(0, exploredBounds.minX - fogPadding),
      maxX: Math.min(generatedWidth - 1, exploredBounds.maxX + fogPadding),
      minY: Math.max(0, exploredBounds.minY - fogPadding),
      maxY: Math.min(generatedHeight - 1, exploredBounds.maxY + fogPadding)
    };

    // Collect all visible tiles and sort by depth (back to front)
    const visibleTiles = [];
    for (let y = visibleBounds.minY; y <= visibleBounds.maxY; y++) {
      for (let x = visibleBounds.minX; x <= visibleBounds.maxX; x++) {
        const key = `${x},${y}`;
        const tile = tiles[key];
        if (tile) {
          visibleTiles.push({ x, y, tile, depth: x + y });
        }
      }
    }

    // Sort by depth (lower depth = further back = render first)
    visibleTiles.sort((a, b) => a.depth - b.depth);

    // Draw tiles in depth order
    for (const { x, y, tile, depth } of visibleTiles) {
      const screenPos = gridToScreen(x, y);

      if (tile.explored) {
        // Draw terrain tile
        const texture = texturesRef.current[tile.terrain];

        if (texture && texturesLoaded && texture !== Texture.WHITE) {
          // Use pre-transformed isometric texture
          const sprite = new Sprite(texture);
          sprite.anchor.set(0.5, 0.5);
          sprite.x = screenPos.x;
          sprite.y = screenPos.y;
          sprite.zIndex = depth;

          // Add subtle variation through random flipping (deterministic based on position)
          const seed = x * 7919 + y * 6421;
          if (seed % 2 === 0) {
            sprite.scale.x = -1;
          }

          tileContainer.addChild(sprite);
        } else {
          // Fallback to solid color diamond if texture not loaded
          const terrainGraphics = new Graphics();
          const terrainConfig = terrainTypes[tile.terrain];
          const color = terrainConfig?.color || 0x808080;
          drawIsometricTile(terrainGraphics, screenPos.x, screenPos.y, color, 0x000000);
          terrainGraphics.zIndex = depth;
          tileContainer.addChild(terrainGraphics);
        }

        // Draw extraction node indicator if present and its resource is used in unlocked recipes
        if (tile.extractionNode && usedResources.has(tile.extractionNode.resourceType)) {
          const resourceType = tile.extractionNode.resourceType;
          const isUnlocked = tile.extractionNode.unlocked;
          const nodeColor = isUnlocked ? NODE_UNLOCKED_COLOR : NODE_LOCKED_COLOR;

          // Node is centered on the tile
          const nodeCenterX = screenPos.x;
          const nodeCenterY = screenPos.y;

          // Draw background circle to indicate status
          const bgGraphics = new Graphics();
          const bgRadius = NODE_ICON_SIZE / 2 + 4;
          bgGraphics.circle(nodeCenterX, nodeCenterY, bgRadius);
          bgGraphics.fill({ color: 0x000000, alpha: 0.6 });
          bgGraphics.stroke({ color: nodeColor, width: 2, alpha: 1 });
          bgGraphics.zIndex = depth + 0.1; // Slightly above terrain
          tileContainer.addChild(bgGraphics);

          // Try to use icon texture
          const iconTexture = resourceIconCache.get(resourceType);
          if (iconTexture) {
            const iconSprite = new Sprite(iconTexture);
            iconSprite.width = NODE_ICON_SIZE;
            iconSprite.height = NODE_ICON_SIZE;
            iconSprite.anchor.set(0.5);
            iconSprite.x = nodeCenterX;
            iconSprite.y = nodeCenterY;
            iconSprite.zIndex = depth + 0.2; // Above background
            tileContainer.addChild(iconSprite);
          } else {
            // Fallback to colored circle if icon not loaded
            const fallbackGraphics = new Graphics();
            drawNodeIndicatorFallback(fallbackGraphics, nodeCenterX, nodeCenterY, nodeColor);
            fallbackGraphics.zIndex = depth + 0.2;
            tileContainer.addChild(fallbackGraphics);
          }
        }
      } else {
        // Draw fog tile (unexplored)
        const fogGraphics = new Graphics();
        drawIsometricTile(fogGraphics, screenPos.x, screenPos.y, FOG_COLOR, 0x0a0a14);
        fogGraphics.zIndex = depth;
        tileContainer.addChild(fogGraphics);
      }
    }

    world.addChild(tileContainer);
  };

  // Re-render when map changes, textures load, app initializes, used resources change, or resource icons load
  useEffect(() => {
    if (appInitialized) {
      render();
    }
  }, [explorationMap, texturesLoaded, appInitialized, usedResources, resourceIconsLoaded]);

  // Allow external requests to center the camera on a specific tile (used by sidebar "find node" action).
  useEffect(() => {
    if (!focusTile || !appInitialized || !appRef.current || !worldRef.current) return;

    const tileX = Number(focusTile.x);
    const tileY = Number(focusTile.y);
    if (!Number.isFinite(tileX) || !Number.isFinite(tileY)) return;

    const app = appRef.current;
    const world = worldRef.current;
    const targetScreenPos = gridToScreen(tileX, tileY);
    const currentScale = world.scale.x || 1;

    world.x = app.screen.width / 2 - targetScreenPos.x * currentScale;
    world.y = app.screen.height / 2 - targetScreenPos.y * currentScale;
  }, [focusTile, appInitialized]);

  // Initialize PixiJS Application
  useEffect(() => {
    if (!containerRef.current || appRef.current) return;

    let isMounted = true;

    const initPixi = async () => {
      const app = new Application();
      const container = containerRef.current;

      await app.init({
        background: FOG_COLOR,
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

      // Create world container for zoom/pan
      const world = new Container();
      app.stage.addChild(world);
      worldRef.current = world;

      // Mark app as initialized - this will trigger render via useEffect
      setAppInitialized(true);

      // Setup zoom (mouse wheel)
      const canvas = app.canvas;
      const handleWheel = (e) => {
        const currentWorld = worldRef.current;
        if (!currentWorld) return;
        e.preventDefault();
        const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Math.min(Math.max(currentWorld.scale.x * scaleFactor, 0.15), 1.5);

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

      // Setup click handler for tile selection
      const handleClick = (e) => {
        const currentWorld = worldRef.current;
        const currentMap = explorationMapRef.current;
        const currentOnTileClick = onTileClickRef.current;
        if (!currentOnTileClick || !currentWorld || !currentMap) return;

        // Don't trigger click if we were dragging
        const wasDragging = Math.abs(e.clientX - dragRef.current.lastX) > 5 ||
                           Math.abs(e.clientY - dragRef.current.lastY) > 5;
        if (wasDragging) return;

        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Convert screen to world coordinates
        const worldX = (mouseX - currentWorld.x) / currentWorld.scale.x;
        const worldY = (mouseY - currentWorld.y) / currentWorld.scale.y;

        // Convert world to grid coordinates (isometric)
        const gridCoords = screenToGrid(worldX, worldY);
        const gridX = gridCoords.x;
        const gridY = gridCoords.y;

        const key = `${gridX},${gridY}`;
        const tile = currentMap.tiles[key];
        if (tile && tile.explored) {
          currentOnTileClick(tile);
        }
      };

      canvas.style.cursor = 'grab';
      canvas.addEventListener('wheel', handleWheel, { passive: false });
      canvas.addEventListener('mousedown', handleMouseDown);
      canvas.addEventListener('click', handleClick);
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      app._cleanupHandlers = { handleWheel, handleMouseDown, handleMouseMove, handleMouseUp, handleClick };
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
          canvas.removeEventListener('click', handlers.handleClick);
          window.removeEventListener('mousemove', handlers.handleMouseMove);
          window.removeEventListener('mouseup', handlers.handleMouseUp);
        }

        app.destroy(true, { children: true });
        appRef.current = null;
        worldRef.current = null;
        hasInitializedViewRef.current = false;
        setAppInitialized(false);
      }
    };
  }, []);

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
        height: '100%',
        minHeight: '300px',
        borderRadius: '8px',
        overflow: 'hidden'
      }}
    />
  );
}
