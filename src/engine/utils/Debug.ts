import { Graphics, Container } from "pixi.js";
import { engine } from "../../app/getEngine";

/**
 * Global debug singleton for rendering debug overlays
 */
export class Debug {
    private static instance: Debug | null = null;
    private container: Container;
    private crosshair: Graphics;
    private isInitialized = false;

    private constructor() {
        this.container = new Container();
        this.crosshair = new Graphics();
        this.container.addChild(this.crosshair);
    }

    /**
     * Get the singleton instance
     */
    public static getInstance(): Debug {
        if (!Debug.instance) {
            Debug.instance = new Debug();
        }
        return Debug.instance;
    }

    /**
     * Initialize the debug system - adds it to the stage
     */
    public initialize(): void {
        if (this.isInitialized) return;

        const app = engine();
        if (app && app.stage) {
            app.stage.addChild(this.container);
            this.isInitialized = true;
            
            // Make sure debug overlay is always on top
            this.container.zIndex = 999999;
            app.stage.sortableChildren = true;
        }
    }

    /**
     * Draw crosshairs at the exact center of the viewport
     */
    public drawViewportCrosshair(): void {
        if (!this.isInitialized) {
            this.initialize();
        }

        const app = engine();
        if (!app || !app.renderer) return;

        // Get viewport dimensions
        const viewportWidth = app.renderer.width;
        const viewportHeight = app.renderer.height;
        
        // Calculate center point
        const centerX = viewportWidth * 0.5;
        const centerY = viewportHeight * 0.5;

        // Clear previous crosshair
        this.crosshair.clear();

        // Draw vertical line
        this.crosshair
            .moveTo(centerX, 0)
            .lineTo(centerX, viewportHeight)
            .stroke({ width: 2, color: 0xFF0000, alpha: 0.8 });

        // Draw horizontal line
        this.crosshair
            .moveTo(0, centerY)
            .lineTo(viewportWidth, centerY)
            .stroke({ width: 2, color: 0xFF0000, alpha: 0.8 });

        // Draw a small circle at the exact center
        this.crosshair
            .circle(centerX, centerY, 3)
            .fill({ color: 0xFF0000, alpha: 1.0 });
    }

    /**
     * Draw a crosshair at a specific screen position (for debugging mouse position)
     */
    public drawMouseCrosshair(screenX: number, screenY: number): void {
        if (!this.isInitialized) {
            this.initialize();
        }

        const app = engine();
        if (!app || !app.renderer) return;

        const size = 10; // Half size of the crosshair

        // Draw mouse crosshair in green
        this.crosshair
            .moveTo(screenX - size, screenY)
            .lineTo(screenX + size, screenY)
            .stroke({ width: 2, color: 0x00FF00, alpha: 0.8 });

        this.crosshair
            .moveTo(screenX, screenY - size)
            .lineTo(screenX, screenY + size)
            .stroke({ width: 2, color: 0x00FF00, alpha: 0.8 });

        // Draw a small circle at mouse position
        this.crosshair
            .circle(screenX, screenY, 2)
            .fill({ color: 0x00FF00, alpha: 1.0 });
    }

    /**
     * Clear all debug graphics
     */
    public clear(): void {
        this.crosshair.clear();
    }

    /**
     * Toggle visibility of debug overlay
     */
    public setVisible(visible: boolean): void {
        this.container.visible = visible;
    }

    /**
     * Clean up debug system
     */
    public destroy(): void {
        if (this.isInitialized) {
            const app = engine();
            if (app && app.stage && this.container.parent) {
                app.stage.removeChild(this.container);
            }
        }
        
        this.crosshair.destroy();
        this.container.destroy();
        this.isInitialized = false;
        Debug.instance = null;
    }
}

/**
 * Convenience function to get the debug instance
 */
export function debug(): Debug {
    return Debug.getInstance();
}
