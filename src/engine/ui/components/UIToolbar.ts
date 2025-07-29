import { Graphics } from "pixi.js";
import { UIContainer } from "../UIContainer";
import { UIButton } from "./UIButton";
import type { UIToolbarConfig, UIToolConfig } from "../types";
import { UITheme } from "../colors";

/**
 * Toolbar component that arranges buttons in a horizontal or vertical layout
 */
export class UIToolbar extends UIContainer {
    private toolbarConfig: Required<Pick<UIToolbarConfig, 'orientation' | 'spacing' | 'padding'>> & UIToolbarConfig;
    private buttons: UIButton[] = [];
    private activeToolId?: string;
    private background: Graphics;

    constructor(config: UIToolbarConfig) {
        super(config);
        
        this.toolbarConfig = {
            spacing: 8,
            padding: 8,
            uniformButtonSize: false,
            backgroundColor: UITheme.panel.backgroundColor,
            borderColor: UITheme.panel.borderColor,
            borderWidth: 1,
            cornerRadius: 6,
            ...config,
            orientation: config.orientation || 'horizontal'
        };
        
        // Create background graphics
        this.background = new Graphics();
        this.addChild(this.background);
        
        this.createButtons();
        this.layoutButtons();
        this.updateBackground();
    }

    /**
     * Create buttons from tool configurations
     */
    private createButtons(): void {
        for (const toolConfig of this.toolbarConfig.tools) {
            const button = new UIButton({
                text: toolConfig.name || toolConfig.id,
                icon: toolConfig.icon,
                variant: toolConfig.variant || 'default',
                cornerRadius: this.toolbarConfig.cornerRadius,
                onClick: () => this.onToolClick(toolConfig),
                interactive: true
            });
            
            button.label = `tool-${toolConfig.id}`;
            this.buttons.push(button);
            this.addChild(button);
        }
    }

    /**
     * Handle tool button clicks
     */
    private onToolClick(toolConfig: UIToolConfig): void {
        // Set this tool as active
        this.setActiveTool(toolConfig.id);
        
        // Call the tool's click handler
        toolConfig.onClick();
    }

    /**
     * Set the active tool
     */
    public setActiveTool(toolId: string): void {
        this.activeToolId = toolId;
        
        // Update button appearances (for future styling)
        this.buttons.forEach((_, index) => {
            const toolConfig = this.toolbarConfig.tools[index];
            // For now, we'll just log which tool is active
            // Later we can add visual feedback for active state
            if (toolConfig.id === toolId) {
                console.log(`Activated tool: ${toolId}`);
            }
        });
    }

    /**
     * Get the currently active tool ID
     */
    public getActiveTool(): string | undefined {
        return this.activeToolId;
    }

    /**
     * Layout buttons according to orientation
     */
    private layoutButtons(): void {
        if (this.buttons.length === 0) return;

        // If uniform button size is enabled, find the largest button dimensions
        if (this.toolbarConfig.uniformButtonSize) {
            this.applyUniformButtonSizing();
        }

        let currentX = this.toolbarConfig.padding;
        let currentY = this.toolbarConfig.padding;
        let maxWidth = 0;
        let maxHeight = 0;

        for (let i = 0; i < this.buttons.length; i++) {
            const button = this.buttons[i];
            
            // Position the button
            button.setPosition(currentX, currentY);
            
            // Update position for next button
            if (this.toolbarConfig.orientation === 'horizontal') {
                currentX += (button.getConfig().width || 0) + this.toolbarConfig.spacing;
                maxHeight = Math.max(maxHeight, button.getConfig().height || 0);
            }
            else {
                currentY += (button.getConfig().height || 0) + this.toolbarConfig.spacing;
                maxWidth = Math.max(maxWidth, button.getConfig().width || 0);
            }
        }

        // Calculate toolbar dimensions
        if (this.toolbarConfig.orientation === 'horizontal') {
            const totalWidth = currentX - this.toolbarConfig.spacing + this.toolbarConfig.padding;
            const totalHeight = maxHeight + (this.toolbarConfig.padding * 2);
            this.updateConfig({ width: totalWidth, height: totalHeight });
        }
        else {
            const totalWidth = maxWidth + (this.toolbarConfig.padding * 2);
            const totalHeight = currentY - this.toolbarConfig.spacing + this.toolbarConfig.padding;
            this.updateConfig({ width: totalWidth, height: totalHeight });
        }
        
        // Update background after layout
        this.updateBackground();
    }

    /**
     * Apply uniform sizing to all buttons based on the largest button
     */
    private applyUniformButtonSizing(): void {
        if (this.buttons.length === 0) return;

        // Find the maximum width and height among all buttons
        let maxWidth = 0;
        let maxHeight = 0;

        for (const button of this.buttons) {
            const size = button.getSize();
            maxWidth = Math.max(maxWidth, size.width);
            maxHeight = Math.max(maxHeight, size.height);
        }

        // Apply uniform sizing to all buttons
        for (const button of this.buttons) {
            if (this.toolbarConfig.orientation === 'horizontal') {
                // For horizontal toolbars, make all buttons the same width
                button.setSize(maxWidth, button.getSize().height);
            }
            else {
                // For vertical toolbars, make all buttons the same width and height
                button.setSize(maxWidth, maxHeight);
            }
        }
    }

    /**
     * Update the toolbar background appearance
     */
    private updateBackground(): void {
        const width = this.getConfig().width || 0;
        const height = this.getConfig().height || 0;
        
        if (width === 0 || height === 0) return;

        this.background.clear();
        
        // Draw background
        if (this.toolbarConfig.backgroundColor !== undefined) {
            this.background
                .roundRect(0, 0, width, height, this.toolbarConfig.cornerRadius || 0)
                .fill(this.toolbarConfig.backgroundColor);
        }
        
        // Draw border
        if (this.toolbarConfig.borderWidth && this.toolbarConfig.borderWidth > 0 && this.toolbarConfig.borderColor !== undefined) {
            this.background
                .roundRect(0, 0, width, height, this.toolbarConfig.cornerRadius || 0)
                .stroke({ 
                    width: this.toolbarConfig.borderWidth, 
                    color: this.toolbarConfig.borderColor 
                });
        }
    }

    /**
     * Add a new tool to the toolbar
     */
    public addTool(toolConfig: UIToolConfig): void {
        this.toolbarConfig.tools.push(toolConfig);
        
        const button = new UIButton({
            text: toolConfig.name || toolConfig.id,
            icon: toolConfig.icon,
            variant: toolConfig.variant || 'default',
            onClick: () => this.onToolClick(toolConfig),
            interactive: true
        });
        
        button.label = `tool-${toolConfig.id}`;
        this.buttons.push(button);
        this.addChild(button);
        
        this.layoutButtons();
    }

    /**
     * Remove a tool from the toolbar
     */
    public removeTool(toolId: string): void {
        const toolIndex = this.toolbarConfig.tools.findIndex(tool => tool.id === toolId);
        if (toolIndex === -1) return;
        
        // Remove from config
        this.toolbarConfig.tools.splice(toolIndex, 1);
        
        // Remove button
        const button = this.buttons[toolIndex];
        this.removeChild(button);
        button.destroy();
        this.buttons.splice(toolIndex, 1);
        
        // Re-layout
        this.layoutButtons();
        
        // Clear active tool if it was the removed one
        if (this.activeToolId === toolId) {
            this.activeToolId = undefined;
        }
    }

    /**
     * Update toolbar layout
     */
    public override resize(width: number, height: number): void {
        // First, layout the buttons to calculate toolbar dimensions
        this.layoutButtons();
        
        // Then apply responsive positioning with the correct dimensions
        super.resize(width, height);
    }

    /**
     * Clean up the toolbar
     */
    public override destroy(): void {
        this.buttons.forEach(button => button.destroy());
        this.buttons = [];
        super.destroy();
    }
}
