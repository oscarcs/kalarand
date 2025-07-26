import { Container, Rectangle, Sprite, Texture } from "pixi.js";
import type { Tile } from "./WorldData";
import { calculateDepth, getTileUVs, TILE_DEPTH, worldToIso } from "./IsometricUtils";

/**
 * Represents a single rendered tile sprite
 */
export class TileSprite extends Sprite {
    public worldX: number;
    public worldY: number;
    public tile: Tile;
    public northCornerHeight: number;

    constructor(texture: Texture, tile: Tile, northHeight: number) {
        super(texture);
        this.tile = tile;
        this.worldX = tile.x;
        this.worldY = tile.y;
        this.northCornerHeight = northHeight;
        
        this.anchor.set(0.5, 1); // Anchor at bottom center for isometric tiles
        this.updatePosition();
    }

    /**
     * Update the sprite's screen position based on world coordinates and height
     */
    public updatePosition(): void {
        const isoPos = worldToIso(this.worldX, this.worldY);
        
        this.x = isoPos.x;
        this.y = isoPos.y - (this.northCornerHeight * TILE_DEPTH);
        
        // Set z-index for proper depth sorting
        this.zIndex = calculateDepth(this.worldX, this.worldY, this.northCornerHeight);
    }
}

/**
 * Manages rendering of the isometric world
 */
export class IsometricRenderer extends Container {
    private tileTextures: Texture[] = [];
    private tileSprites: Map<string, TileSprite> = new Map();
    private baseTexture: Texture | null = null;

    constructor() {
        super();
        this.sortableChildren = true; // Enable z-index sorting
    }

    /**
     * Initialize the renderer with the tile texture
     */
    public async initialize(baseTexture: Texture): Promise<void> {
        this.baseTexture = baseTexture;
        this.createTileTextures();
    }

    /**
     * Create individual tile textures from the base sprite sheet
     */
    private createTileTextures(): void {
        if (!this.baseTexture) return;

        this.tileTextures = [];
        
        // Ensure the base texture uses nearest neighbor filtering for crisp pixels
        if (this.baseTexture.source) {
            this.baseTexture.source.scaleMode = 'nearest';
        }
        
        for (let i = 0; i < 4; i++) {
            const uvs = getTileUVs(i);
            const frame = new Rectangle(uvs.x, uvs.y, uvs.width, uvs.height);
            const tileTexture = new Texture({
                source: this.baseTexture.source,
                frame,
            });
            this.tileTextures.push(tileTexture);
        }
    }

    /**
     * Render a single tile
     */
    public renderTile(tile: Tile, northCornerHeight: number): void {
        const key = `${tile.x},${tile.y}`;
        
        // Remove existing sprite if it exists
        this.removeTile(tile.x, tile.y);
        
        // Create new sprite
        const texture = this.tileTextures[tile.type];
        if (!texture) return;
        
        const sprite = new TileSprite(texture, tile, northCornerHeight);
        this.tileSprites.set(key, sprite);
        this.addChild(sprite);
    }

    /**
     * Remove a tile from rendering
     */
    public removeTile(x: number, y: number): void {
        const key = `${x},${y}`;
        const sprite = this.tileSprites.get(key);
        
        if (sprite) {
            this.removeChild(sprite);
            this.tileSprites.delete(key);
            sprite.destroy();
        }
    }

    /**
     * Clear all rendered tiles
     */
    public clear(): void {
        for (const sprite of this.tileSprites.values()) {
            this.removeChild(sprite);
            sprite.destroy();
        }
        this.tileSprites.clear();
    }

    /**
     * Update positions of all rendered tiles (useful when heights change)
     */
    public updateAllPositions(): void {
        for (const sprite of this.tileSprites.values()) {
            sprite.updatePosition();
        }
    }
}
