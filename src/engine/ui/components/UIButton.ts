import { Assets, Graphics, Sprite, Text } from "pixi.js";
import { UIContainer } from "../UIContainer";
import type { UIButtonConfig } from "../types";
import { UITheme } from "../colors";

/**
 * Interactive button component with support for text, icons, and various states
 */
export class UIButton extends UIContainer {
    private background: Graphics;
    private textDisplay?: Text;
    private iconDisplay?: Sprite;
    private buttonConfig: Required<Pick<UIButtonConfig, 'backgroundColor' | 'borderColor' | 'borderWidth' | 'cornerRadius' | 'hoverColor' | 'pressedColor' | 'disabledColor'>> & UIButtonConfig;
    
    private isHovered = false;
    private currentColor: number;

    constructor(config: UIButtonConfig) {
        super(config);
        
        // Get theme colors based on variant
        const variant = config.variant || 'default';
        const themeColors = UITheme.button[variant];
        
        // Default button styling
        this.buttonConfig = {
            backgroundColor: themeColors.backgroundColor,
            borderColor: themeColors.borderColor,
            borderWidth: 2,
            cornerRadius: 4,
            hoverColor: themeColors.backgroundHover,
            pressedColor: themeColors.backgroundPressed,
            disabledColor: themeColors.backgroundDisabled,
            disabled: false,
            variant,
            ...config
        };
        
        this.currentColor = this.buttonConfig.backgroundColor;
        
        // Create background
        this.background = new Graphics();
        this.addChild(this.background);
        
        // Set up interactivity
        this.eventMode = 'static';
        this.cursor = this.buttonConfig.disabled ? 'default' : 'pointer';
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Create content (text and/or icon)
        this.createContent();
        
        // Initial render
        this.updateAppearance();
    }

    /**
     * Set up event listeners for button interactions
     */
    private setupEventListeners(): void {
        if (this.buttonConfig.disabled) return;
        
        this.on('pointerover', this.onPointerOver);
        this.on('pointerout', this.onPointerOut);
        this.on('pointerdown', this.onPointerDown);
        this.on('pointerup', this.onPointerUp);
        this.on('pointerupoutside', this.onPointerUpOutside);
        this.on('click', this.onClick);
    }

    /**
     * Create text and icon content
     */
    private async createContent(): Promise<void> {
        // Create text if specified
        if (this.buttonConfig.text) {
            const variant = this.buttonConfig.variant || 'default';
            const themeColors = UITheme.button[variant];
            
            this.textDisplay = new Text({
                text: this.buttonConfig.text,
                style: {
                    fontFamily: 'Arial',
                    fontSize: 14,
                    fill: themeColors.textColor,
                    align: 'center'
                }
            });
            this.addChild(this.textDisplay);
        }

        // Create icon if specified (for future use)
        if (this.buttonConfig.icon && typeof this.buttonConfig.icon === 'string') {
            try {
                const texture = await Assets.load(this.buttonConfig.icon);
                this.iconDisplay = new Sprite(texture);
                this.addChild(this.iconDisplay);
            }
            catch (error) {
                console.warn(`Failed to load icon: ${this.buttonConfig.icon}`, error);
            }
        }
        else if (this.buttonConfig.icon && typeof this.buttonConfig.icon !== 'string') {
            this.iconDisplay = new Sprite(this.buttonConfig.icon);
            this.addChild(this.iconDisplay);
        }

        // Layout content
        this.layoutContent();
    }

    /**
     * Layout text and icon content within the button
     */
    private layoutContent(): void {
        if (!this.buttonConfig.width || !this.buttonConfig.height) {
            // Auto-size based on content
            this.calculateAutoSize();
        }

        const centerX = (this.buttonConfig.width || 0) / 2;
        const centerY = (this.buttonConfig.height || 0) / 2;

        // Position text
        if (this.textDisplay) {
            this.textDisplay.anchor.set(0.5, 0.5);
            this.textDisplay.x = centerX;
            this.textDisplay.y = centerY;
        }

        // Position icon (if both text and icon exist, icon goes to the left)
        if (this.iconDisplay) {
            this.iconDisplay.anchor.set(0.5, 0.5);
            
            if (this.textDisplay) {
                // Icon + text layout
                const totalContentWidth = this.iconDisplay.width + 4 + this.textDisplay.width;
                const startX = centerX - totalContentWidth / 2;
                
                this.iconDisplay.x = startX + this.iconDisplay.width / 2;
                this.iconDisplay.y = centerY;
                
                this.textDisplay.x = startX + this.iconDisplay.width + 4 + this.textDisplay.width / 2;
            }
            else {
                // Icon only
                this.iconDisplay.x = centerX;
                this.iconDisplay.y = centerY;
            }
        }
    }

    /**
     * Calculate auto size based on content
     */
    private calculateAutoSize(): void {
        const padding = 12;
        let contentWidth = 0;
        let contentHeight = 0;

        if (this.textDisplay) {
            contentWidth += this.textDisplay.width;
            contentHeight = Math.max(contentHeight, this.textDisplay.height);
        }

        if (this.iconDisplay) {
            if (this.textDisplay) {
                contentWidth += this.iconDisplay.width + 4; // 4px gap between icon and text
            }
            else {
                contentWidth = this.iconDisplay.width;
            }
            contentHeight = Math.max(contentHeight, this.iconDisplay.height);
        }

        this.buttonConfig.width = contentWidth + padding * 2;
        this.buttonConfig.height = contentHeight + padding * 2;
        
        // Update the base config
        this.updateConfig({
            width: this.buttonConfig.width,
            height: this.buttonConfig.height
        });
    }

    /**
     * Update the visual appearance of the button
     */
    private updateAppearance(): void {
        if (!this.buttonConfig.width || !this.buttonConfig.height) return;

        this.background.clear();
        
        // Draw background
        this.background
            .roundRect(0, 0, this.buttonConfig.width, this.buttonConfig.height, this.buttonConfig.cornerRadius)
            .fill(this.currentColor);
        
        // Draw border
        if (this.buttonConfig.borderWidth > 0) {
            this.background
                .roundRect(0, 0, this.buttonConfig.width, this.buttonConfig.height, this.buttonConfig.cornerRadius)
                .stroke({ width: this.buttonConfig.borderWidth, color: this.buttonConfig.borderColor });
        }
    }

    /**
     * Event handlers
     */
    private onPointerOver = (): void => {
        if (this.buttonConfig.disabled) return;
        
        this.isHovered = true;
        this.currentColor = this.buttonConfig.hoverColor;
        this.updateAppearance();
        
        if (this.buttonConfig.onHover) {
            this.buttonConfig.onHover(true);
        }
    };

    private onPointerOut = (): void => {
        if (this.buttonConfig.disabled) return;
        
        this.isHovered = false;
        this.currentColor = this.buttonConfig.backgroundColor;
        this.updateAppearance();
        
        if (this.buttonConfig.onHover) {
            this.buttonConfig.onHover(false);
        }
    };

    private onPointerDown = (): void => {
        if (this.buttonConfig.disabled) return;
        
        this.currentColor = this.buttonConfig.pressedColor;
        this.updateAppearance();
    };

    private onPointerUp = (): void => {
        if (this.buttonConfig.disabled) return;
        
        this.currentColor = this.isHovered ? this.buttonConfig.hoverColor : this.buttonConfig.backgroundColor;
        this.updateAppearance();
    };

    private onPointerUpOutside = (): void => {
        if (this.buttonConfig.disabled) return;
        
        this.currentColor = this.buttonConfig.backgroundColor;
        this.updateAppearance();
    };

    private onClick = (): void => {
        if (this.buttonConfig.disabled) return;
        
        if (this.buttonConfig.onClick) {
            this.buttonConfig.onClick();
        }
    };

    /**
     * Update button text
     */
    public setText(text: string): void {
        this.buttonConfig.text = text;
        
        if (this.textDisplay) {
            this.textDisplay.text = text;
        }
        else {
            this.createContent();
        }
        
        this.layoutContent();
        this.updateAppearance();
    }

    /**
     * Set button size explicitly (overrides auto-sizing)
     */
    public setSize(width: number, height: number): void {
        this.buttonConfig.width = width;
        this.buttonConfig.height = height;
        
        this.updateConfig({ width, height });
        this.layoutContent();
        this.updateAppearance();
    }

    /**
     * Get the button's current size
     */
    public getSize(): { width: number; height: number } {
        return {
            width: this.buttonConfig.width || 0,
            height: this.buttonConfig.height || 0
        };
    }

    /**
     * Enable or disable the button
     */
    public setDisabled(disabled: boolean): void {
        this.buttonConfig.disabled = disabled;
        this.cursor = disabled ? 'default' : 'pointer';
        this.currentColor = disabled ? this.buttonConfig.disabledColor : this.buttonConfig.backgroundColor;
        this.updateAppearance();
    }

    /**
     * Get the current disabled state
     */
    public isDisabled(): boolean {
        return this.buttonConfig.disabled ?? false;
    }

    /**
     * Clean up the button
     */
    public override destroy(): void {
        this.removeAllListeners();
        super.destroy();
    }
}
