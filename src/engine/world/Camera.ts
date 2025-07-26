import type { Coordinate } from "./IsometricUtils";
import { worldToIso } from "./IsometricUtils";

/**
 * Camera controller for the isometric world
 */
export class Camera {
    /** Camera position in world coordinates */
    public worldX: number = 0;
    public worldY: number = 0;
    
    /** Camera movement speed in world units per frame */
    public speed: number = 0.2;
    
    /** Smooth movement settings */
    public smoothing: number = 0.15;
    private targetX: number = 0;
    private targetY: number = 0;
    
    /** World bounds */
    private minX: number = 0;
    private minY: number = 0;
    private maxX: number = 100;
    private maxY: number = 100;

    constructor(worldWidth: number = 100, worldHeight: number = 100) {
        this.maxX = worldWidth - 1;
        this.maxY = worldHeight - 1;
        
        // Start at center of world
        this.worldX = worldWidth / 2;
        this.worldY = worldHeight / 2;
        this.targetX = this.worldX;
        this.targetY = this.worldY;
    }

    /**
     * Set camera target position
     */
    public setTarget(worldX: number, worldY: number): void {
        this.targetX = Math.max(this.minX, Math.min(this.maxX, worldX));
        this.targetY = Math.max(this.minY, Math.min(this.maxY, worldY));
    }

    /**
     * Move camera by delta amount
     */
    public move(deltaX: number, deltaY: number): void {
        this.setTarget(this.targetX + deltaX, this.targetY + deltaY);
    }

    /**
     * Update camera position with smooth interpolation
     */
    public update(): void {
        const dx = this.targetX - this.worldX;
        const dy = this.targetY - this.worldY;
        
        this.worldX += dx * this.smoothing;
        this.worldY += dy * this.smoothing;
    }

    /**
     * Get the camera's screen position for rendering offset
     */
    public getScreenPosition(): Coordinate {
        const isoPos = worldToIso(this.worldX, this.worldY);
        return { x: -isoPos.x, y: -isoPos.y };
    }

    /**
     * Snap camera to target immediately (no smoothing)
     */
    public snapToTarget(): void {
        this.worldX = this.targetX;
        this.worldY = this.targetY;
    }

    /**
     * Set world bounds for camera movement
     */
    public setBounds(minX: number, minY: number, maxX: number, maxY: number): void {
        this.minX = minX;
        this.minY = minY;
        this.maxX = maxX;
        this.maxY = maxY;
    }
}
