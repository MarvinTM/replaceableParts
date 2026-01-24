import { useRef, useEffect, useState, useMemo } from 'react';
import { Application, Graphics, Container, Assets, Sprite, Texture, TilingSprite } from 'pixi.js';
import {
  TILE_SIZE,
  gridToScreen,
  screenToGrid
} from './coordinateUtils';
import { getIconUrl } from '../../services/iconService';

// Fog of war color (warm parchment)
const FOG_COLOR = 0xC9B896;

// Node indicator colors
const NODE_UNLOCKED_COLOR = 0x22c55e;  // Green - active
const NODE_LOCKED_COLOR = 0xf59e0b;     // Orange - available to unlock

/**
 * Draw a top-down square tile
 */
function drawSquareTile(graphics, x, y, fillColor, lineColor = null) {
  graphics.rect(x, y, TILE_SIZE, TILE_SIZE);
  graphics.fill(fillColor);

  if (lineColor !== null) {
    graphics.stroke({ color: lineColor, width: 1, alpha: 0.3 });
  }
}

// Icon size for extraction nodes
const NODE_ICON_SIZE = 40;

// Cache for resource icon textures
const resourceIconCache = new Map();
const failedResourceIcons = new Set();

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
function drawNodeIndicatorFallback(graphics, x, y, color) {
  const radius = 8;
  const centerX = x + TILE_SIZE / 2;
  const centerY = y + TILE_SIZE / 2;

  graphics.circle(centerX, centerY, radius);
  graphics.fill(color);
  graphics.stroke({ color: 0xffffff, width: 2, alpha: 0.9 });
}

export default function ExplorationCanvas({ explorationMap, rules, unlockedRecipes, onTileClick }) {
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

  // Compute the set of resources used by unlocked recipes
  const usedResources = useMemo(() => {
    const resources = new Set();
    if (!rules?.recipes || !unlockedRecipes) return resources;

    const recipeMap = new Map(rules.recipes.map(r => [r.id, r]));
    for (const recipeId of unlockedRecipes) {
      const recipe = recipeMap.get(recipeId);
      if (recipe?.inputs) {
        for (const inputResource of Object.keys(recipe.inputs)) {
          resources.add(inputResource);
        }
      }
    }
    return resources;
  }, [rules?.recipes, unlockedRecipes]);
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

  // Load terrain textures
  useEffect(() => {
    const loadTextures = async () => {
      const terrainTypes = ['water', 'plains', 'grassland', 'forest', 'jungle', 'hills', 'mountain', 'desert', 'swamp'];
      const textures = {};

      for (const terrain of terrainTypes) {
        try {
          const texture = await Assets.load(`/assets/exploration/${terrain}.png`);
          textures[terrain] = texture;
        } catch (error) {
          console.warn(`Failed to load texture for ${terrain}:`, error);
          // Create a fallback white texture if loading fails
          textures[terrain] = Texture.WHITE;
        }
      }

      texturesRef.current = textures;
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

    // Calculate center and zoom to fit explored area
    // Only re-center if we haven't manipulated the view? 
    // For now, let's keep the re-centering behavior as it ensures new chunks are visible
    // Ideally we might want to preserve user pan/zoom unless bounds change significantly.
    // Given the 'key' behavior previously forced re-center, this preserves existing UX.
    
    const centerX = (exploredBounds.minX + exploredBounds.maxX) / 2;
    const centerY = (exploredBounds.minY + exploredBounds.maxY) / 2;
    const center = gridToScreen(centerX, centerY);

    const exploredWidth = exploredBounds.maxX - exploredBounds.minX + 1;
    const exploredHeight = exploredBounds.maxY - exploredBounds.minY + 1;
    const padding = 4;
    const totalWidth = (exploredWidth + padding * 2) * TILE_SIZE;
    const totalHeight = (exploredHeight + padding * 2) * TILE_SIZE;
    const scaleX = app.screen.width / totalWidth;
    const scaleY = app.screen.height / totalHeight;
    const initialScale = Math.max(Math.min(scaleX, scaleY, 1), 0.5);

    world.scale.set(initialScale);
    world.x = app.screen.width / 2 - center.x * initialScale;
    world.y = app.screen.height / 2 - center.y * initialScale;

    // Create containers for different layers
    const fogContainer = new Container();
    const terrainContainer = new Container();
    const nodeContainer = new Container();

    // Calculate visible bounds (explored area plus some fog around it)
    const fogPadding = 3;
    const visibleBounds = {
      minX: Math.max(0, exploredBounds.minX - fogPadding),
      maxX: Math.min(generatedWidth - 1, exploredBounds.maxX + fogPadding),
      minY: Math.max(0, exploredBounds.minY - fogPadding),
      maxY: Math.min(generatedHeight - 1, exploredBounds.maxY + fogPadding)
    };

    // Draw visible tiles
    for (let y = visibleBounds.minY; y <= visibleBounds.maxY; y++) {
      for (let x = visibleBounds.minX; x <= visibleBounds.maxX; x++) {
        const key = `${x},${y}`;
        const tile = tiles[key];
        if (!tile) continue;

        const screenPos = gridToScreen(x, y);

        if (tile.explored) {
          // Draw terrain tile
          const texture = texturesRef.current[tile.terrain];

          if (texture && texturesLoaded) {
            // Use TilingSprite for texture offset variation
            const sprite = new TilingSprite(texture, TILE_SIZE, TILE_SIZE);
            sprite.x = screenPos.x;
            sprite.y = screenPos.y;

            // Add random rotation/flipping and texture offset based on tile position (deterministic)
            // This breaks up the repetitive pattern
            const seed = x * 7919 + y * 6421; // Large primes for good distribution
            const rotationChoice = seed % 8; // 8 possible transformations

            // Random texture offset (sample from different parts of the texture)
            const offsetSeedX = (x * 5237 + y * 3119) % 128; // Different seed for X offset
            const offsetSeedY = (x * 4283 + y * 7151) % 128; // Different seed for Y offset
            sprite.tilePosition.x = -offsetSeedX; // Negative to shift the texture
            sprite.tilePosition.y = -offsetSeedY;

            // Set anchor to center for rotation
            sprite.anchor.set(0.5, 0.5);
            sprite.x = screenPos.x + TILE_SIZE / 2;
            sprite.y = screenPos.y + TILE_SIZE / 2;

            // Apply rotation (0°, 90°, 180°, 270°) and flipping
            if (rotationChoice === 0) {
              // No transformation
            } else if (rotationChoice === 1) {
              sprite.rotation = Math.PI / 2; // 90°
            } else if (rotationChoice === 2) {
              sprite.rotation = Math.PI; // 180°
            } else if (rotationChoice === 3) {
              sprite.rotation = (3 * Math.PI) / 2; // 270°
            } else if (rotationChoice === 4) {
              sprite.scale.x = -1; // Flip horizontally
            } else if (rotationChoice === 5) {
              sprite.scale.y = -1; // Flip vertically
            } else if (rotationChoice === 6) {
              sprite.rotation = Math.PI / 2; // 90°
              sprite.scale.x = -1; // Flip
            } else {
              sprite.rotation = Math.PI; // 180°
              sprite.scale.x = -1; // Flip
            }

            terrainContainer.addChild(sprite);
          } else {
            // Fallback to solid color if texture not loaded
            const terrainGraphics = new Graphics();
            const terrainConfig = terrainTypes[tile.terrain];
            const color = terrainConfig?.color || 0x808080;
            drawSquareTile(terrainGraphics, screenPos.x, screenPos.y, color, 0x000000);
            terrainContainer.addChild(terrainGraphics);
          }

          // Draw extraction node indicator if present and its resource is used in unlocked recipes
          if (tile.extractionNode && usedResources.has(tile.extractionNode.resourceType)) {
            const resourceType = tile.extractionNode.resourceType;
            const isUnlocked = tile.extractionNode.unlocked;
            const nodeColor = isUnlocked ? NODE_UNLOCKED_COLOR : NODE_LOCKED_COLOR;
            const centerX = screenPos.x + TILE_SIZE / 2;
            const centerY = screenPos.y + TILE_SIZE / 2;

            // Draw background circle to indicate status
            const bgGraphics = new Graphics();
            const bgRadius = NODE_ICON_SIZE / 2 + 4;
            bgGraphics.circle(centerX, centerY, bgRadius);
            bgGraphics.fill({ color: 0x000000, alpha: 0.6 });
            bgGraphics.stroke({ color: nodeColor, width: 2, alpha: 1 });
            nodeContainer.addChild(bgGraphics);

            // Try to use icon texture
            const iconTexture = resourceIconCache.get(resourceType);
            if (iconTexture) {
              const iconSprite = new Sprite(iconTexture);
              iconSprite.width = NODE_ICON_SIZE;
              iconSprite.height = NODE_ICON_SIZE;
              iconSprite.anchor.set(0.5);
              iconSprite.x = centerX;
              iconSprite.y = centerY;
              nodeContainer.addChild(iconSprite);
            } else {
              // Fallback to colored circle if icon not loaded
              const fallbackGraphics = new Graphics();
              drawNodeIndicatorFallback(fallbackGraphics, screenPos.x, screenPos.y, nodeColor);
              nodeContainer.addChild(fallbackGraphics);
            }
          }
        } else {
          // Draw fog tile
          const fogGraphics = new Graphics();
          drawSquareTile(fogGraphics, screenPos.x, screenPos.y, FOG_COLOR, 0x0a0a14);
          fogContainer.addChild(fogGraphics);
        }
      }
    }

    world.addChild(terrainContainer);
    world.addChild(fogContainer);
    world.addChild(nodeContainer);
  };

  // Re-render when map changes, textures load, app initializes, used resources change, or resource icons load
  useEffect(() => {
    if (appInitialized) {
      render();
    }
  }, [explorationMap, texturesLoaded, appInitialized, usedResources, resourceIconsLoaded]);

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
        const newScale = Math.min(Math.max(currentWorld.scale.x * scaleFactor, 0.25), 1);

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

        // Convert world to grid coordinates (top-down is simple)
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
