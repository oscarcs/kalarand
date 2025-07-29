import type { Container, Texture } from "pixi.js";

/**
 * Position anchor types for responsive positioning
 */
export type UIPositionAnchor = 
    | 'top-left' | 'top-center' | 'top-right'
    | 'center-left' | 'center' | 'center-right'
    | 'bottom-left' | 'bottom-center' | 'bottom-right';

/**
 * Responsive position configuration
 */
export interface UIResponsivePosition {
    /** Anchor point for positioning */
    anchor: UIPositionAnchor;
    /** Offset from the anchor point */
    offset: { x: number; y: number };
}

/**
 * Base configuration for all UI components
 */
export interface UIComponentConfig {
    /** Position relative to parent (absolute positioning) */
    position?: { x: number; y: number };
    /** Responsive position relative to screen edges */
    responsivePosition?: UIResponsivePosition;
    /** Anchor point (default: 0, 0) */
    anchor?: { x: number; y: number };
    /** Width of the component (auto if not specified) */
    width?: number;
    /** Height of the component (auto if not specified) */
    height?: number;
    /** Whether the component is visible */
    visible?: boolean;
    /** Whether the component is interactive */
    interactive?: boolean;
}

/**
 * Button style variants
 */
export type UIButtonVariant = 'default' | 'primary' | 'success' | 'danger' | 'warning';

/**
 * Configuration for UI buttons
 */
export interface UIButtonConfig extends UIComponentConfig {
    /** Icon texture or asset alias */
    icon?: string | Texture;
    /** Button text (optional, can be icon-only) */
    text?: string;
    /** Button style variant */
    variant?: UIButtonVariant;
    
    /** Background color */
    backgroundColor?: number;
    /** Border color */
    borderColor?: number;
    /** Border thickness */
    borderWidth?: number;
    /** Corner radius for rounded corners */
    cornerRadius?: number;
    
    /** Color when hovered */
    hoverColor?: number;
    /** Color when pressed */
    pressedColor?: number;
    /** Color when disabled */
    disabledColor?: number;
    
    /** Click callback */
    onClick?: () => void;
    /** Hover callback */
    onHover?: (hovered: boolean) => void;
    /** Whether button is disabled */
    disabled?: boolean;
    
    /** Tooltip text on hover */
    tooltip?: string;
}

/**
 * Configuration for UI panels/containers
 */
export interface UIPanelConfig extends UIComponentConfig {
    /** Background color */
    backgroundColor?: number;
    /** Border color */
    borderColor?: number;
    /** Border thickness */
    borderWidth?: number;
    /** Corner radius for rounded corners */
    cornerRadius?: number;
    /** Internal padding */
    padding?: number;
}

/**
 * Configuration for UI labels/text
 */
export interface UILabelConfig extends UIComponentConfig {
    /** Text content */
    text: string;
    /** Text color */
    color?: number;
    /** Font family */
    fontFamily?: string;
    /** Font size */
    fontSize?: number;
    /** Text alignment */
    align?: "left" | "center" | "right";
}

/**
 * Tool definition for toolbars
 */
export interface UIToolConfig {
    /** Unique tool identifier */
    id: string;
    /** Tool display name */
    name?: string;
    /** Tool icon */
    icon: string | Texture;
    /** Tool tooltip */
    tooltip?: string;
    /** Keyboard shortcut (e.g., "KeyB") */
    shortcut?: string;
    /** Tool activation callback */
    onClick: () => void;
    /** Whether tool is currently active */
    isActive?: boolean;
    /** Button style variant */
    variant?: UIButtonVariant;
}

/**
 * Configuration for UI toolbars
 */
export interface UIToolbarConfig extends UIComponentConfig {
    /** Toolbar orientation */
    orientation: "horizontal" | "vertical";
    /** Space between buttons */
    spacing?: number;
    /** Internal padding */
    padding?: number;
    /** Whether all buttons should have uniform width (based on widest button) */
    uniformButtonSize?: boolean;
    
    /** Background color */
    backgroundColor?: number;
    /** Border color */
    borderColor?: number;
    /** Border thickness */
    borderWidth?: number;
    /** Corner radius for rounded corners */
    cornerRadius?: number;
    
    /** Array of tool definitions */
    tools: UIToolConfig[];
}

/**
 * Base interface for UI components
 */
export interface UIComponent extends Container {
    /** Update the component (called each frame) */
    update?(): void;
    /** Resize the component */
    resize?(width: number, height: number): void;
    /** Show the component */
    show?(): Promise<void>;
    /** Hide the component */
    hide?(): Promise<void>;
}
