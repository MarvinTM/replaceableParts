/**
 * Isometric coordinate utilities for exploration map
 *
 * Isometric projection uses a 2:1 ratio (width:height)
 * Grid coordinates (x, y) are converted to screen coordinates
 */

// Tile dimensions for isometric projection (2:1 ratio)
export const TILE_WIDTH = 128;
export const TILE_HEIGHT = 64;

// Legacy export for compatibility (average of width/height)
export const TILE_SIZE = 64;

/**
 * Convert grid coordinates to screen (isometric) coordinates
 * @param {number} gridX - Grid X position
 * @param {number} gridY - Grid Y position
 * @returns {{ x: number, y: number }} Screen coordinates
 */
export function gridToScreen(gridX, gridY) {
  // Isometric projection:
  // +X -> Down Right
  // +Y -> Down Left
  return {
    x: (gridX + gridY) * (TILE_WIDTH / 2),
    y: (gridX - gridY) * (TILE_HEIGHT / 2)
  };
}

/**
 * Convert screen coordinates to grid coordinates
 * @param {number} screenX - Screen X position
 * @param {number} screenY - Screen Y position
 * @returns {{ x: number, y: number }} Grid coordinates (rounded to integers)
 */
export function screenToGrid(screenX, screenY) {
  // Inverse of isometric projection
  // Using round() instead of floor() because isometric tiles are diamond-shaped,
  // and rounding gives correct tile selection by snapping to the nearest tile center
  const x = (screenX / (TILE_WIDTH / 2) + screenY / (TILE_HEIGHT / 2)) / 2;
  const y = (screenX / (TILE_WIDTH / 2) - screenY / (TILE_HEIGHT / 2)) / 2;
  return {
    x: Math.round(x),
    y: Math.round(y)
  };
}

/**
 * Calculate the world bounds for an isometric grid
 * @param {number} gridWidth - Width of grid in cells
 * @param {number} gridHeight - Height of grid in cells
 * @returns {{ minX: number, minY: number, maxX: number, maxY: number, width: number, height: number }}
 */
export function getGridBounds(gridWidth, gridHeight) {
  // In isometric view, the grid forms a diamond shape
  const cTop = gridToScreen(0, 0);
  const cLeft = gridToScreen(0, gridHeight - 1);
  const cRight = gridToScreen(gridWidth - 1, 0);
  const cBottom = gridToScreen(gridWidth - 1, gridHeight - 1);

  const corners = [cTop, cLeft, cRight, cBottom];
  const minX = Math.min(...corners.map(p => p.x)) - TILE_WIDTH / 2;
  const maxX = Math.max(...corners.map(p => p.x)) + TILE_WIDTH / 2;
  const minY = Math.min(...corners.map(p => p.y)) - TILE_HEIGHT / 2;
  const maxY = Math.max(...corners.map(p => p.y)) + TILE_HEIGHT / 2;

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY
  };
}

/**
 * Get the center point of the grid in screen coordinates
 * @param {number} gridWidth - Width of grid in cells
 * @param {number} gridHeight - Height of grid in cells
 * @returns {{ x: number, y: number }}
 */
export function getGridCenter(gridWidth, gridHeight) {
  const bounds = getGridBounds(gridWidth, gridHeight);
  return {
    x: bounds.minX + bounds.width / 2,
    y: bounds.minY + bounds.height / 2
  };
}
