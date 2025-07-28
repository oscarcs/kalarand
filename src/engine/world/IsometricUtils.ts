/**
 * Simple coordinate interface
 */
export interface Coordinate {
    x: number;
    y: number;
}

/**
 * Constants for isometric projection
 */
export const TILE_WIDTH = 32;
export const TILE_HEIGHT = 16;
export const TILE_WIDTH_HALF = TILE_WIDTH / 2;
export const TILE_HEIGHT_HALF = TILE_HEIGHT / 2;
export const TILE_DEPTH = TILE_HEIGHT_HALF;

/**
 * Convert world coordinates to screen coordinates
 */
export function worldToScreen(world: Coordinate): Coordinate {
    const screenX = (world.x - world.y) * TILE_WIDTH_HALF;
    const screenY = (world.x + world.y) * TILE_HEIGHT_HALF;

    return { x: screenX, y: screenY };
}

/**
 * Convert screen coordinates to world coordinates
 */
export function screenToWorld(screen: Coordinate): Coordinate {
    const worldX = (screen.x / TILE_WIDTH_HALF + screen.y / TILE_HEIGHT_HALF) / 2;
    const worldY = (screen.y / TILE_HEIGHT_HALF - screen.x / TILE_WIDTH_HALF) / 2;

    return { x: worldX, y: worldY };
}

/**
 * Calculate the depth/z-index for proper rendering order in isometric view
 * Tiles further back and lower should render first
 */
export function calculateDepth(world: Coordinate, height: number = 0): number {
    // Higher X and Y coordinates should render later (on top)
    // Higher height should also render later (on top)
    return (world.x + world.y) * 1000 + height;
}

/**
 * Get the texture coordinates for a specific tile type in the sprite sheet
 */
export function getTileUVs(tileType: number, tilesPerRow: number = 4): { x: number; y: number; width: number; height: number } {
    const col = tileType % tilesPerRow;
    const row = Math.floor(tileType / tilesPerRow);
    
    return {
        x: col * TILE_WIDTH,
        y: row * TILE_HEIGHT,
        width: TILE_WIDTH,
        height: TILE_HEIGHT,
    };
}

/**
 * Convert screen-relative movement to world-relative movement for isometric view
 * This is useful for camera controls where the user expects:
 * - Right arrow = move right on screen 
 * - Left arrow = move left on screen 
 * - Up arrow = move up on screen 
 * - Down arrow = move down on screen 
 */
export function screenToWorldMovement(screenX: number, screenY: number): Coordinate {
    // For isometric view: screen coordinates map to world coordinates as:
    // screenX affects both worldX and worldY equally
    // screenY affects worldX and worldY in opposite directions
    return {
        x: (screenX + screenY) * 0.5,   // Right/Down = +X, Left/Up = -X
        y: (screenY - screenX) * 0.5    // Down/Left = +Y, Up/Right = -Y
    };
}

/**
 * Convert world-relative movement to screen-relative movement
 */
export function worldToScreenMovement(worldX: number, worldY: number): Coordinate {
    return {
        x: worldX - worldY,   // Screen horizontal
        y: worldX + worldY    // Screen vertical
    };
}
