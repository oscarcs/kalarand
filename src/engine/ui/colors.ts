/**
 * Color palette and constants for the UI system
 * 
 * This module provides a consistent set of colors that can be used
 * throughout the UI system. Colors are organized by category and
 * provide both semantic names and functional variants.
 */

/**
 * Gray scale colors (neutral tones)
 */
export const UIColors = {
    // Grays (from light to dark)
    gray: {
        50: 0xF9FAFB,   // Very light gray
        100: 0xF3F4F6,  // Light gray
        200: 0xE5E7EB,  // Light gray
        300: 0xD1D5DB,  // Medium light gray
        400: 0x9CA3AF,  // Medium gray
        500: 0x6B7280,  // Base gray
        600: 0x4B5563,  // Medium dark gray
        700: 0x374151,  // Dark gray
        800: 0x1F2937,  // Very dark gray
        900: 0x111827,  // Almost black
    },

    // Blue colors (primary theme)
    blue: {
        50: 0xEFF6FF,   // Very light blue
        100: 0xDBEAFE,  // Light blue
        200: 0xBFDBFE,  // Light blue
        300: 0x93C5FD,  // Medium light blue
        400: 0x60A5FA,  // Medium blue
        500: 0x3B82F6,  // Base blue
        600: 0x2563EB,  // Medium dark blue
        700: 0x1D4ED8,  // Dark blue
        800: 0x1E40AF,  // Very dark blue
        900: 0x1E3A8A,  // Almost navy
    },

    // Green colors (success/positive actions)
    green: {
        50: 0xF0FDF4,   // Very light green
        100: 0xDCFCE7,  // Light green
        200: 0xBBF7D0,  // Light green
        300: 0x86EFAC,  // Medium light green
        400: 0x4ADE80,  // Medium green
        500: 0x22C55E,  // Base green
        600: 0x16A34A,  // Medium dark green
        700: 0x15803D,  // Dark green
        800: 0x166534,  // Very dark green
        900: 0x14532D,  // Almost forest green
    },

    // Red colors (error/destructive actions)
    red: {
        50: 0xFEF2F2,   // Very light red
        100: 0xFEE2E2,  // Light red
        200: 0xFECACA,  // Light red
        300: 0xFCA5A5,  // Medium light red
        400: 0xF87171,  // Medium red
        500: 0xEF4444,  // Base red
        600: 0xDC2626,  // Medium dark red
        700: 0xB91C1C,  // Dark red
        800: 0x991B1B,  // Very dark red
        900: 0x7F1D1D,  // Almost maroon
    },

    // Yellow colors (warning/caution)
    yellow: {
        50: 0xFEFCE8,   // Very light yellow
        100: 0xFEF9C3,  // Light yellow
        200: 0xFEF08A,  // Light yellow
        300: 0xFDE047,  // Medium light yellow
        400: 0xFACC15,  // Medium yellow
        500: 0xEAB308,  // Base yellow
        600: 0xCA8A04,  // Medium dark yellow
        700: 0xA16207,  // Dark yellow
        800: 0x854D0E,  // Very dark yellow
        900: 0x713F12,  // Almost brown
    },

    // Purple colors (accent/special)
    purple: {
        50: 0xFAF5FF,   // Very light purple
        100: 0xF3E8FF,  // Light purple
        200: 0xE9D5FF,  // Light purple
        300: 0xD8B4FE,  // Medium light purple
        400: 0xC084FC,  // Medium purple
        500: 0xA855F7,  // Base purple
        600: 0x9333EA,  // Medium dark purple
        700: 0x7C3AED,  // Dark purple
        800: 0x6B21A8,  // Very dark purple
        900: 0x581C87,  // Almost indigo
    },

    // Common colors
    white: 0xFFFFFF,
    black: 0x000000,
    transparent: 0x000000, // Use with alpha for transparency
} as const;

/**
 * Semantic color mappings for UI components
 * These provide meaning-based color assignments that can be easily changed
 */
export const UISemanticColors = {
    // Text colors
    text: {
        primary: UIColors.gray[900],      // Main text
        secondary: UIColors.gray[600],    // Secondary text
        muted: UIColors.gray[400],        // Muted/disabled text
        inverse: UIColors.white,          // Text on dark backgrounds
        link: UIColors.blue[600],         // Links
        linkHover: UIColors.blue[700],    // Hovered links
    },

    // Background colors
    background: {
        primary: UIColors.white,          // Main background
        secondary: UIColors.gray[50],     // Secondary background
        muted: UIColors.gray[100],        // Muted background
        dark: UIColors.gray[900],         // Dark background
        overlay: UIColors.gray[900],      // Modal overlays (use with alpha)
    },

    // Border colors
    border: {
        light: UIColors.gray[200],        // Light borders
        default: UIColors.gray[300],      // Default borders
        dark: UIColors.gray[400],         // Dark borders
        focus: UIColors.blue[500],        // Focus indicators
    },

    // Button colors
    button: {
        // Primary button (main actions)
        primary: {
            background: UIColors.blue[600],
            backgroundHover: UIColors.blue[700],
            backgroundPressed: UIColors.blue[800],
            backgroundDisabled: UIColors.gray[300],
            text: UIColors.white,
            textDisabled: UIColors.gray[500],
            border: UIColors.blue[600],
        },
        
        // Secondary button (secondary actions)
        secondary: {
            background: UIColors.gray[600],
            backgroundHover: UIColors.gray[700],
            backgroundPressed: UIColors.gray[800],
            backgroundDisabled: UIColors.gray[300],
            text: UIColors.white,
            textDisabled: UIColors.gray[500],
            border: UIColors.gray[600],
        },
        
        // Success button (positive actions)
        success: {
            background: UIColors.green[600],
            backgroundHover: UIColors.green[700],
            backgroundPressed: UIColors.green[800],
            backgroundDisabled: UIColors.gray[300],
            text: UIColors.white,
            textDisabled: UIColors.gray[500],
            border: UIColors.green[600],
        },
        
        // Danger button (destructive actions)
        danger: {
            background: UIColors.red[600],
            backgroundHover: UIColors.red[700],
            backgroundPressed: UIColors.red[800],
            backgroundDisabled: UIColors.gray[300],
            text: UIColors.white,
            textDisabled: UIColors.gray[500],
            border: UIColors.red[600],
        },
        
        // Warning button (caution actions)
        warning: {
            background: UIColors.yellow[500],
            backgroundHover: UIColors.yellow[600],
            backgroundPressed: UIColors.yellow[700],
            backgroundDisabled: UIColors.gray[300],
            text: UIColors.gray[900],
            textDisabled: UIColors.gray[500],
            border: UIColors.yellow[500],
        },
    },

    // Status colors
    status: {
        success: UIColors.green[600],
        error: UIColors.red[600],
        warning: UIColors.yellow[500],
        info: UIColors.blue[600],
    },
} as const;

/**
 * Default UI theme configuration
 * This provides the default color scheme for UI components
 */
export const UITheme = {
    button: {
        default: {
            backgroundColor: UISemanticColors.button.secondary.background,
            backgroundHover: UISemanticColors.button.secondary.backgroundHover,
            backgroundPressed: UISemanticColors.button.secondary.backgroundPressed,
            backgroundDisabled: UISemanticColors.button.secondary.backgroundDisabled,
            textColor: UISemanticColors.button.secondary.text,
            textColorDisabled: UISemanticColors.button.secondary.textDisabled,
            borderColor: UISemanticColors.button.secondary.border,
        },
        primary: {
            backgroundColor: UISemanticColors.button.primary.background,
            backgroundHover: UISemanticColors.button.primary.backgroundHover,
            backgroundPressed: UISemanticColors.button.primary.backgroundPressed,
            backgroundDisabled: UISemanticColors.button.primary.backgroundDisabled,
            textColor: UISemanticColors.button.primary.text,
            textColorDisabled: UISemanticColors.button.primary.textDisabled,
            borderColor: UISemanticColors.button.primary.border,
        },
        success: {
            backgroundColor: UISemanticColors.button.success.background,
            backgroundHover: UISemanticColors.button.success.backgroundHover,
            backgroundPressed: UISemanticColors.button.success.backgroundPressed,
            backgroundDisabled: UISemanticColors.button.success.backgroundDisabled,
            textColor: UISemanticColors.button.success.text,
            textColorDisabled: UISemanticColors.button.success.textDisabled,
            borderColor: UISemanticColors.button.success.border,
        },
        danger: {
            backgroundColor: UISemanticColors.button.danger.background,
            backgroundHover: UISemanticColors.button.danger.backgroundHover,
            backgroundPressed: UISemanticColors.button.danger.backgroundPressed,
            backgroundDisabled: UISemanticColors.button.danger.backgroundDisabled,
            textColor: UISemanticColors.button.danger.text,
            textColorDisabled: UISemanticColors.button.danger.textDisabled,
            borderColor: UISemanticColors.button.danger.border,
        },
        warning: {
            backgroundColor: UISemanticColors.button.warning.background,
            backgroundHover: UISemanticColors.button.warning.backgroundHover,
            backgroundPressed: UISemanticColors.button.warning.backgroundPressed,
            backgroundDisabled: UISemanticColors.button.warning.backgroundDisabled,
            textColor: UISemanticColors.button.warning.text,
            textColorDisabled: UISemanticColors.button.warning.textDisabled,
            borderColor: UISemanticColors.button.warning.border,
        },
    },
    
    panel: {
        backgroundColor: UISemanticColors.background.primary,
        borderColor: UISemanticColors.border.default,
    },
    
    text: {
        color: UISemanticColors.text.primary,
        colorSecondary: UISemanticColors.text.secondary,
        colorMuted: UISemanticColors.text.muted,
        colorInverse: UISemanticColors.text.inverse,
    },
} as const;

/**
 * Utility function to get alpha-blended colors
 * Note: Pixi.js handles alpha separately, so this is mainly for reference
 */
export function withAlpha(color: number, alpha: number): { color: number; alpha: number } {
    return { color, alpha };
}

/**
 * Utility function to lighten a color (approximate)
 * This is a simple approximation - for more complex color manipulation,
 * consider using a color manipulation library
 */
export function lightenColor(color: number, amount: number = 0.1): number {
    const r = (color >> 16) & 0xFF;
    const g = (color >> 8) & 0xFF;
    const b = color & 0xFF;
    
    const newR = Math.min(255, Math.floor(r + (255 - r) * amount));
    const newG = Math.min(255, Math.floor(g + (255 - g) * amount));
    const newB = Math.min(255, Math.floor(b + (255 - b) * amount));
    
    return (newR << 16) | (newG << 8) | newB;
}

/**
 * Utility function to darken a color (approximate)
 */
export function darkenColor(color: number, amount: number = 0.1): number {
    const r = (color >> 16) & 0xFF;
    const g = (color >> 8) & 0xFF;
    const b = color & 0xFF;
    
    const newR = Math.max(0, Math.floor(r * (1 - amount)));
    const newG = Math.max(0, Math.floor(g * (1 - amount)));
    const newB = Math.max(0, Math.floor(b * (1 - amount)));
    
    return (newR << 16) | (newG << 8) | newB;
}
