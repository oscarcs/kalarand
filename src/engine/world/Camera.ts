import type { Coordinate } from "./IsometricUtils";
import { worldToScreen } from "./IsometricUtils";

/**
 * Camera controller for the isometric world
 */
export class Camera {
    /** Camera target position in world coordinates */
    public target: Coordinate = { x: 0, y: 0 };

    /** Camera movement speed in world units per frame */
    public speed: number = 0.3;
    
    /** Zoom level (1x = normal, 2x = zoomed in 2x, etc.) */
    public zoom: number = 2.0;
    public minZoom: number = 1.0;
    public maxZoom: number = 4.0;
    public zoomSpeed: number = 1.0; // Changed to 1.0 for integer steps
    
    /** Smooth movement settings */
    public smoothing: number = 0.15;
    private nextTarget: Coordinate = { x: 0, y: 0 };
    private nextZoom: number = 2.0;
    
    /** World bounds */
    private minX: number = 0;
    private minY: number = 0;
    private maxX: number = 100;
    private maxY: number = 100;

    constructor(worldWidth: number = 100, worldHeight: number = 100) {
        this.maxX = worldWidth - 1;
        this.maxY = worldHeight - 1;
        
        // Start at center of world
        this.target = { x: worldWidth / 2, y: worldHeight / 2 };
        this.nextTarget = { x: this.target.x, y: this.target.y };
        this.nextZoom = this.zoom;
    }

    /**
     * Set camera target position
     */
    public setNextTarget(worldX: number, worldY: number): void {
        this.nextTarget = {
            x: Math.max(this.minX, Math.min(this.maxX, worldX)),
            y: Math.max(this.minY, Math.min(this.maxY, worldY))
        };
    }

    /**
     * Move camera by delta amount
     */
    public move(deltaX: number, deltaY: number): void {
        this.setNextTarget(this.nextTarget.x + deltaX, this.nextTarget.y + deltaY);
    }

    /**
     * Set zoom level (rounded to nearest integer)
     */
    public setZoom(zoom: number): void {
        const integerZoom = Math.round(zoom);
        this.nextZoom = Math.max(this.minZoom, Math.min(this.maxZoom, integerZoom));
    }

    /**
     * Zoom in by one integer level
     */
    public zoomIn(): void {
        this.setZoom(this.nextZoom + 1);
    }

    /**
     * Zoom out by one integer level
     */
    public zoomOut(): void {
        this.setZoom(this.nextZoom - 1);
    }

    /**
     * Update camera position with smooth interpolation
     */
    public update(): void {
        const dx = this.nextTarget.x - this.target.x;
        const dy = this.nextTarget.y - this.target.y;
        const dz = this.nextZoom - this.zoom;

        this.target.x += dx * this.smoothing;
        this.target.y += dy * this.smoothing;
        this.zoom += dz * this.smoothing;

        // Snap to target if close enough
        if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001 && Math.abs(dz) < 0.01) {
            this.target.x = this.nextTarget.x;
            this.target.y = this.nextTarget.y;
            this.zoom = this.nextZoom;
        }
    }

    /**
     * Get the camera's screen position for rendering offset
     */
    public getScreenPosition(): Coordinate {
        const screenPos = worldToScreen(this.target);
        return {
            x: -screenPos.x * this.zoom,
            y: -screenPos.y * this.zoom
        };
    }

    /**
     * Snap camera to next target immediately without smoothing
     */
    public snapToNextTarget(): void {
        this.target = { x: this.nextTarget.x, y: this.nextTarget.y };
        this.zoom = this.nextZoom;
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
