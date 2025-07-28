import { Assets, Container } from "pixi.js";
import { WorldData } from "./WorldData";
import { IsometricRenderer } from "./IsometricRenderer";
import { Camera } from "./Camera";
import { InputController } from "../input/InputController";

/**
 * Main controller for the isometric world
 */
export class WorldController extends Container {
    private worldData: WorldData;
    private renderer: IsometricRenderer;
    private camera: Camera;
    private inputController: InputController;
    private isInitialized = false;
    private lastHoveredTile: { x: number; y: number } | null = null;

    constructor(width: number = 100, height: number = 100) {
        super();
        
        this.worldData = new WorldData(width, height);
        this.renderer = new IsometricRenderer();
        this.camera = new Camera(width, height);
        this.inputController = new InputController();
        
        this.addChild(this.renderer);
    }

    /**
     * Initialize the world controller
     */
    public async initialize(): Promise<void> {
        if (this.isInitialized) return;

        const texture = await Assets.load("empty.png");
        await this.renderer.initialize(texture);
        
        this.isInitialized = true;
    }

    /**
     * Generate and render a random world
     */
    public generateRandomWorld(): void {
        if (!this.isInitialized) {
            console.warn("WorldController not initialized. Call initialize() first.");
            return;
        }

        // Generate random world data
        this.worldData.generateRandom();
        
        // Clear existing rendering
        this.renderer.clear();
        
        // Render all tiles
        this.renderWorld();
    }

    /**
     * Render the entire world
     */
    private renderWorld(): void {
        for (const tile of this.worldData.tiles.values()) {
            this.renderer.renderTile(tile, tile.northCornerHeight || 0);
        }
    }

    /**
     * Get the world data (read-only access)
     */
    public getWorldData(): WorldData {
        return this.worldData;
    }

    /**
     * Center the view on a specific world coordinate
     */
    public centerOn(worldX: number, worldY: number): void {
        this.camera.setNextTarget(worldX, worldY);
        this.camera.snapToNextTarget();
        this.updateCameraPosition();
    }

    /**
     * Update the camera and handle input
     */
    public update(): void {
        if (!this.isInitialized) return;

        // Handle input for camera movement (screen-relative)
        const movement = this.inputController.getIsometricMovementInput();
        if (movement.worldX !== 0 || movement.worldY !== 0) {
            this.camera.move(movement.worldX * this.camera.speed, movement.worldY * this.camera.speed);
        }

        // Handle zoom input
        const zoomInput = this.inputController.getZoomInput();
        if (zoomInput.zoomIn) {
            this.camera.zoomIn();
        }
        if (zoomInput.zoomOut) {
            this.camera.zoomOut();
        }

        // Update camera position
        this.camera.update();
        this.updateCameraPosition();

        // Handle mouse picking for tile hover
        this.updateMousePicking();
    }

    /**
     * Update the renderer position based on camera
     */
    private updateCameraPosition(): void {
        const screenPos = this.camera.getScreenPosition();

        this.renderer.x = screenPos.x;
        this.renderer.y = screenPos.y;
        this.renderer.scale.set(this.camera.zoom);
    }

    /**
     * Handle mouse picking for tile hover effects
     */
    private updateMousePicking(): void {
        const tileX = 0;
        const tileY = 0;

        // Check if this is a different tile than the last hovered one
        if (!this.lastHoveredTile || 
            this.lastHoveredTile.x !== tileX || 
            this.lastHoveredTile.y !== tileY) {
            
            // Clear previous hover
            if (this.lastHoveredTile) {
                this.renderer.setTileHover(this.lastHoveredTile.x, this.lastHoveredTile.y, false);
            }
            
            // Set new hover if tile exists
            const tile = this.worldData.getTile(tileX, tileY);
            if (tile) {
                this.renderer.setTileHover(tileX, tileY, true);
                this.lastHoveredTile = { x: tileX, y: tileY };
            }
            else {
                this.lastHoveredTile = null;
            }
        }
    }

    /**
     * Get the camera instance
     */
    public getCamera(): Camera {
        return this.camera;
    }

    /**
     * Get the input controller instance
     */
    public getInputController(): InputController {
        return this.inputController;
    }

    /**
     * Clean up resources
     */
    public destroy(): void {
        this.inputController.destroy();
        super.destroy();
    }
}
