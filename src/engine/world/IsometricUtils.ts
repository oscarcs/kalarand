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
export const TILE_DEPTH = 8; // Height unit in pixels

/**
 * Convert world coordinates to isometric screen coordinates
 */
export function worldToIso(worldX: number, worldY: number): Coordinate {
    const isoX = (worldX - worldY) * (TILE_WIDTH / 2);
    const isoY = (worldX + worldY) * (TILE_HEIGHT / 2);
    
    return { x: isoX, y: isoY };
}

/**
 * Convert isometric screen coordinates to world coordinates
 */
export function isoToWorld(isoX: number, isoY: number): Coordinate {
    const worldX = (isoX / (TILE_WIDTH / 2) + isoY / (TILE_HEIGHT / 2)) / 2;
    const worldY = (isoY / (TILE_HEIGHT / 2) - isoX / (TILE_WIDTH / 2)) / 2;
    
    return { x: worldX, y: worldY };
}

/**
 * Calculate the depth/z-index for proper rendering order in isometric view
 * Tiles further back and lower should render first
 */
export function calculateDepth(worldX: number, worldY: number, height: number = 0): number {
    // Higher X and Y coordinates should render later (on top)
    // Higher height should also render later (on top)
    return (worldX + worldY) * 1000 + height;
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
