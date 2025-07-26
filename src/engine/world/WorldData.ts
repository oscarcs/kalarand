/**
 * Represents a single tile in the world
 */
export interface Tile {
    type: number;
    northCornerHeight: number;
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
     * Get the height of a specific corner of a tile
     * @param x - tile x coordinate
     * @param y - tile y coordinate
     * @param corner - which corner: 0=north, 1=east, 2=south, 3=west
     */
    public getCornerHeight(x: number, y: number, corner: number): number {
        switch (corner) {
            case 0: // North corner - stored in this tile
                const tile = this.getTile(x, y);
                return tile?.northCornerHeight ?? 0;
            
            case 1: // East corner - north corner of tile to the east
                const eastTile = this.getTile(x + 1, y);
                return eastTile?.northCornerHeight ?? 0;
            
            case 2: // South corner - north corner of tile to the south
                const southTile = this.getTile(x, y + 1);
                return southTile?.northCornerHeight ?? 0;
            
            case 3: // West corner - north corner of tile to the west
                const westTile = this.getTile(x - 1, y);
                return westTile?.northCornerHeight ?? 0;
            
            default:
                return 0;
        }
    }

    /**
     * Get all four corner heights for a tile
     * @param x - tile x coordinate
     * @param y - tile y coordinate
     * @returns array of heights [north, east, south, west]
     */
    public getTileCornerHeights(x: number, y: number): [number, number, number, number] {
        return [
            this.getCornerHeight(x, y, 0), // north
            this.getCornerHeight(x, y, 1), // east
            this.getCornerHeight(x, y, 2), // south
            this.getCornerHeight(x, y, 3), // west
        ];
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
                    northCornerHeight: 0,
                    x,
                    y,
                };
                this.setTile(x, y, tile);
            }
        }
    }
}
