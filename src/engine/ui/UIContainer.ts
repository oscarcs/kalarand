import { Container } from "pixi.js";
import type { UIComponent, UIComponentConfig } from "./types";

/**
 * Base container class for all UI elements
 * Provides common functionality and lifecycle management
 */
export class UIContainer extends Container implements UIComponent {
    protected config: UIComponentConfig;

    constructor(config: UIComponentConfig = {}) {
        super();
        
        this.config = {
            position: { x: 0, y: 0 },
            anchor: { x: 0, y: 0 },
            visible: true,
            interactive: false,
            ...config
        };

        this.applyConfig();
    }

    /**
     * Apply the configuration to the container
     */
    protected applyConfig(): void {
        // Position - responsive positioning takes precedence
        if (this.config.responsivePosition) {
            // Responsive positioning will be handled by the resize method
            // Don't override position if it's already been set by responsive positioning
            // (this prevents updateConfig from resetting responsive positions)
        }
        else if (this.config.position) {
            this.x = this.config.position.x;
            this.y = this.config.position.y;
        }

        // Anchor (using pivot for containers)
        if (this.config.anchor && (this.config.width || this.config.height)) {
            this.pivot.x = (this.config.width || 0) * this.config.anchor.x;
            this.pivot.y = (this.config.height || 0) * this.config.anchor.y;
        }

        // Visibility
        if (this.config.visible !== undefined) {
            this.visible = this.config.visible;
        }

        // Interactivity
        if (this.config.interactive !== undefined) {
            this.eventMode = this.config.interactive ? 'static' : 'passive';
        }
    }

    /**
     * Update the component (called each frame)
     * Override in subclasses for custom update logic
     */
    public update(): void {
        // Base implementation - override in subclasses
    }

    /**
     * Resize the component
     * Override in subclasses for custom resize logic
     */
    public resize(width: number, height: number): void {
        // Handle responsive positioning
        if (this.config.responsivePosition) {
            this.updateResponsivePosition(width, height);
        }
    }

    /**
     * Update position based on responsive positioning configuration
     */
    protected updateResponsivePosition(screenWidth: number, screenHeight: number): void {
        if (!this.config.responsivePosition) return;

        const { anchor, offset } = this.config.responsivePosition;
        let x = 0;
        let y = 0;

        // Get component dimensions for proper positioning
        const componentWidth = this.config.width || this.getBounds().width || 0;
        const componentHeight = this.config.height || this.getBounds().height || 0;

        // Calculate base position based on anchor
        switch (anchor) {
            case 'top-left':
                x = 0;
                y = 0;
                break;
            case 'top-center':
                x = screenWidth / 2 - componentWidth / 2;
                y = 0;
                break;
            case 'top-right':
                x = screenWidth - componentWidth;
                y = 0;
                break;
            case 'center-left':
                x = 0;
                y = screenHeight / 2 - componentHeight / 2;
                break;
            case 'center':
                x = screenWidth / 2 - componentWidth / 2;
                y = screenHeight / 2 - componentHeight / 2;
                break;
            case 'center-right':
                x = screenWidth - componentWidth;
                y = screenHeight / 2 - componentHeight / 2;
                break;
            case 'bottom-left':
                x = 0;
                y = screenHeight - componentHeight;
                break;
            case 'bottom-center':
                x = screenWidth / 2 - componentWidth / 2;
                y = screenHeight - componentHeight;
                break;
            case 'bottom-right':
                x = screenWidth - componentWidth;
                y = screenHeight - componentHeight;
                break;
        }

        // Apply offset
        this.x = x + offset.x;
        this.y = y + offset.y;
    }

    /**
     * Show the component with optional animation
     */
    public async show(): Promise<void> {
        this.visible = true;
        // Can be extended in subclasses for animations
    }

    /**
     * Hide the component with optional animation
     */
    public async hide(): Promise<void> {
        this.visible = false;
        // Can be extended in subclasses for animations
    }

    /**
     * Update the configuration and re-apply it
     */
    public updateConfig(newConfig: Partial<UIComponentConfig>): void {
        this.config = { ...this.config, ...newConfig };
        this.applyConfig();
    }

    /**
     * Get the current configuration
     */
    public getConfig(): UIComponentConfig {
        return { ...this.config };
    }

    /**
     * Set the position of the component
     */
    public setPosition(x: number, y: number): void {
        this.updateConfig({ position: { x, y } });
    }

    /**
     * Set the anchor of the component
     */
    public setAnchor(x: number, y: number): void {
        this.updateConfig({ anchor: { x, y } });
    }

    /**
     * Set the size of the component
     */
    public setSize(width: number, height: number): void {
        this.updateConfig({ width, height });
    }

    /**
     * Clean up the component
     */
    public override destroy(): void {
        this.removeAllListeners();
        super.destroy();
    }
}
