/**
 * Represents a corner of a tile with height information
 */
export interface TileCorner {
    height: number;
}

/**
 * Represents a single tile in the world
 */
export interface Tile {
    type: number;
    corners: [TileCorner, TileCorner, TileCorner, TileCorner];
    x: number;
    y: number;
}

/**
 * Represents the entire world data structure
 */
export class WorldData {
    public tiles: Map<string, Tile> = new Map();
    public width: number;
    public height: number;

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
    }

    /**
     * Get a tile at the specified coordinates
     */
    public getTile(x: number, y: number): Tile | undefined {
        return this.tiles.get(`${x},${y}`);
    }

    /**
     * Set a tile at the specified coordinates
     */
    public setTile(x: number, y: number, tile: Tile): void {
        tile.x = x;
        tile.y = y;
        this.tiles.set(`${x},${y}`, tile);
    }

    /**
     * Generate a random world with the specified dimensions
     */
    public generateRandom(): void {
        this.tiles.clear();
        
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const tile: Tile = {
                    type: Math.floor(Math.random() * 4),
                    corners: [
                        { height: 0 }, // top-left
                        { height: 0 }, // top-right
                        { height: 0 }, // bottom-right
                        { height: 0 }, // bottom-left
                    ],
                    x,
                    y,
                };
                this.setTile(x, y, tile);
            }
        }
    }
}
