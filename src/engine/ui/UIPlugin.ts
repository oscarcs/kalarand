import { ExtensionType } from "pixi.js";
import type { Application, ExtensionMetadata } from "pixi.js";
import { UIManager } from "./UIManager";

/**
 * Middleware for Application's UI functionality.
 *
 * Adds the following to Application:
 * * Application#ui - UIManager instance for managing UI components
 */
export class BeachUIPlugin {
    /** @ignore */
    public static extension: ExtensionMetadata = ExtensionType.Application;

    /**
     * Initialize the plugin with scope of application instance
     */
    public static init(): void {
        const app = this as unknown as Application;
        
        // Create and initialize the UI manager
        const uiManager = new UIManager();
        
        // Add the UI container to the stage
        app.stage.addChild(uiManager.container);
        
        // Set initial size
        uiManager.resize(app.renderer.width, app.renderer.height);
        
        // Attach the UI manager to the app
        app.ui = uiManager;
    }

    /**
     * Clean up the UI system
     */
    public static destroy(): void {
        const app = this as unknown as Application;
        if (app.ui) {
            app.stage.removeChild(app.ui.container);
            app.ui = null as unknown as Application["ui"];
        }
    }
}
