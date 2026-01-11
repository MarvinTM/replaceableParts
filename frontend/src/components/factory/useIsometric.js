/**
 * Isometric coordinate utilities
 *
 * Isometric projection uses a 2:1 ratio (width:height)
 * Grid coordinates (x, y) are converted to screen coordinates
 */

// Tile dimensions for isometric projection
export const TILE_WIDTH = 64;
export const TILE_HEIGHT = 32;

/**
 * Convert grid coordinates to screen (isometric) coordinates
 * @param {number} gridX - Grid X position
 * @param {number} gridY - Grid Y position
 * @returns {{ x: number, y: number }} Screen coordinates
 */
export function gridToScreen(gridX, gridY) {
  // Rotated 90 degrees clockwise
  // +X -> Down Right
  // +Y -> Up Right
  return {
    x: (gridX + gridY) * (TILE_WIDTH / 2),
    y: (gridX - gridY) * (TILE_HEIGHT / 2)
  };
}

/**
 * Convert screen coordinates to grid coordinates
 * @param {number} screenX - Screen X position
 * @param {number} screenY - Screen Y position
 * @returns {{ x: number, y: number }} Grid coordinates (may need rounding)
 */
export function screenToGrid(screenX, screenY) {
  // Inverse of rotated projection
  return {
    x: (screenX / (TILE_WIDTH / 2) + screenY / (TILE_HEIGHT / 2)) / 2,
    y: (screenX / (TILE_WIDTH / 2) - screenY / (TILE_HEIGHT / 2)) / 2
  };
}

/**
 * Get the screen position for a structure (machine/generator)
 * Structures are positioned at their grid cell, centered on the tile
 * @param {number} gridX - Grid X position
 * @param {number} gridY - Grid Y position
 * @param {number} sizeX - Width of the structure in grid cells
 * @param {number} sizeY - Height of the structure in grid cells (defaults to sizeX if not provided)
 * @returns {{ x: number, y: number }} Screen coordinates for the structure center
 */
export function getStructureScreenPosition(gridX, gridY, sizeX = 1, sizeY = sizeX) {
  // For multi-cell structures, we position at the center
  const centerOffsetX = (sizeX - 1) / 2;
  const centerOffsetY = (sizeY - 1) / 2;
  return gridToScreen(gridX + centerOffsetX, gridY + centerOffsetY);
}

/**
 * Calculate the world bounds for the isometric grid
 * @param {number} gridWidth - Width of grid in cells
 * @param {number} gridHeight - Height of grid in cells
 * @returns {{ minX: number, minY: number, maxX: number, maxY: number, width: number, height: number }}
 */
export function getGridBounds(gridWidth, gridHeight) {
  // In isometric view, the grid forms a diamond shape
  // Top corner is (0, 0)
  // Left visual corner is (0, gridHeight-1)
  // Right visual corner is (gridWidth-1, 0)
  // Bottom visual corner is (gridWidth-1, gridHeight-1)
  
  const cTop = gridToScreen(0, 0);
  const cLeft = gridToScreen(0, gridHeight - 1);
  const cRight = gridToScreen(gridWidth - 1, 0);
  const cBottom = gridToScreen(gridWidth - 1, gridHeight - 1);

  // The visual extremities are based on tile centers +/- half tile dimensions
  const centers = [cTop, cLeft, cRight, cBottom];
  const minX = Math.min(...centers.map(p => p.x)) - TILE_WIDTH / 2;
  const maxX = Math.max(...centers.map(p => p.x)) + TILE_WIDTH / 2;
  const minY = Math.min(...centers.map(p => p.y)) - TILE_HEIGHT / 2;
  const maxY = Math.max(...centers.map(p => p.y)) + TILE_HEIGHT / 2;

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

/**
 * Colors for the factory floor
 */
export const COLORS = {
  floorLight: 0x4a5568,    // Light gray for floor
  floorDark: 0x2d3748,     // Darker gray for floor edge
  floorLine: 0x718096,     // Grid lines
  machine: 0x48bb78,       // Green for machines
  machineIdle: 0x718096,   // Gray for idle machines
  machineBlocked: 0xe53e3e, // Red for blocked machines
  generator: 0xecc94b,     // Yellow for generators
  highlight: 0x63b3ed,     // Blue highlight
  empty: 0x1a202c          // Empty/background
};
