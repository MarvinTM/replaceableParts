/**
 * Top-down coordinate utilities for exploration map
 *
 * Simple grid-to-screen conversion for top-down square tiles
 */

// Tile size for top-down square tiles
export const TILE_SIZE = 64;

/**
 * Convert grid coordinates to screen coordinates (top-down)
 * @param {number} gridX - Grid X position
 * @param {number} gridY - Grid Y position
 * @returns {{ x: number, y: number }} Screen coordinates
 */
export function gridToScreen(gridX, gridY) {
  return {
    x: gridX * TILE_SIZE,
    y: gridY * TILE_SIZE
  };
}

/**
 * Convert screen coordinates to grid coordinates (top-down)
 * @param {number} screenX - Screen X position
 * @param {number} screenY - Screen Y position
 * @returns {{ x: number, y: number }} Grid coordinates
 */
export function screenToGrid(screenX, screenY) {
  return {
    x: Math.floor(screenX / TILE_SIZE),
    y: Math.floor(screenY / TILE_SIZE)
  };
}
