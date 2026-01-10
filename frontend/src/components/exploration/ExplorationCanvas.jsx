import { useRef, useEffect } from 'react';
import { Application, Graphics, Container } from 'pixi.js';
import {
  TILE_WIDTH,
  TILE_HEIGHT,
  gridToScreen
} from '../factory/useIsometric';

// Fog of war color
const FOG_COLOR = 0x1a1a2e;

// Node indicator colors
const NODE_UNLOCKED_COLOR = 0x22c55e;  // Green - active
const NODE_LOCKED_COLOR = 0xf59e0b;     // Orange - available to unlock

/**
 * Draw an isometric tile (diamond shape)
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
 * Draw a small diamond indicator for extraction nodes
 */
function drawNodeIndicator(graphics, x, y, color) {
  const size = 6;
  graphics.poly([
    x, y - size,
    x + size, y,
    x, y + size,
    x - size, y
  ]);
  graphics.fill(color);
  graphics.stroke({ color: 0xffffff, width: 1, alpha: 0.8 });
}

export default function ExplorationCanvas({ explorationMap, rules, onTileClick }) {
  const containerRef = useRef(null);
  const appRef = useRef(null);
  const worldRef = useRef(null);
  const dragRef = useRef({ isDragging: false, lastX: 0, lastY: 0 });
  const explorationMapRef = useRef(explorationMap);
  const onTileClickRef = useRef(onTileClick);

  // Keep refs updated with latest props
  useEffect(() => {
    explorationMapRef.current = explorationMap;
  }, [explorationMap]);

  useEffect(() => {
    onTileClickRef.current = onTileClick;
  }, [onTileClick]);

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
    const totalWidth = (exploredWidth + padding * 2) * TILE_WIDTH;
    const totalHeight = (exploredHeight + padding * 2) * TILE_HEIGHT;
    const scaleX = app.screen.width / totalWidth;
    const scaleY = app.screen.height / totalHeight;
    const initialScale = Math.max(Math.min(scaleX, scaleY, 2), 0.5);

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
          const terrainGraphics = new Graphics();
          const terrainConfig = terrainTypes[tile.terrain];
          const color = terrainConfig?.color || 0x808080;
          drawIsometricTile(terrainGraphics, screenPos.x, screenPos.y, color, 0x000000);
          terrainContainer.addChild(terrainGraphics);

          // Draw extraction node indicator if present
          if (tile.extractionNode) {
            const nodeGraphics = new Graphics();
            const nodeColor = tile.extractionNode.unlocked ? NODE_UNLOCKED_COLOR : NODE_LOCKED_COLOR;
            drawNodeIndicator(nodeGraphics, screenPos.x, screenPos.y, nodeColor);
            nodeContainer.addChild(nodeGraphics);
          }
        } else {
          // Draw fog tile
          const fogGraphics = new Graphics();
          drawIsometricTile(fogGraphics, screenPos.x, screenPos.y, FOG_COLOR, 0x0a0a14);
          fogContainer.addChild(fogGraphics);
        }
      }
    }

    world.addChild(terrainContainer);
    world.addChild(fogContainer);
    world.addChild(nodeContainer);
  };

  // Re-render when map changes
  useEffect(() => {
    render();
  }, [explorationMap]);

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

      // Initial render
      render();

      // Setup zoom (mouse wheel)
      const canvas = app.canvas;
      const handleWheel = (e) => {
        const currentWorld = worldRef.current;
        if (!currentWorld) return;
        e.preventDefault();
        const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Math.min(Math.max(currentWorld.scale.x * scaleFactor, 0.25), 4);

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

        // Convert world to grid (approximate - for click detection)
        // Inverse of: screenX = (gridX - gridY) * (TILE_WIDTH / 2)
        //             screenY = (gridX + gridY) * (TILE_HEIGHT / 2)
        const gridX = Math.round((worldX / (TILE_WIDTH / 2) + worldY / (TILE_HEIGHT / 2)) / 2);
        const gridY = Math.round((worldY / (TILE_HEIGHT / 2) - worldX / (TILE_WIDTH / 2)) / 2);

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
        height: '400px',
        borderRadius: '8px',
        overflow: 'hidden'
      }}
    />
  );
}
