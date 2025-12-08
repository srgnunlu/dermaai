/**
 * Spacing configuration for DermaAssistAI
 * Consistent spacing scale based on 4px grid
 */

export const Spacing = {
    // Base spacing scale (4px grid)
    xs: 4,
    sm: 8,
    md: 12,
    base: 16,
    lg: 20,
    xl: 24,
    '2xl': 32,
    '3xl': 40,
    '4xl': 48,
    '5xl': 64,

    // Semantic spacing
    screenPadding: 16,
    cardPadding: 16,
    cardPaddingLarge: 24,
    sectionGap: 24,
    itemGap: 12,
    inlineGap: 8,

    // Border radius
    radius: {
        xs: 4,
        sm: 6,
        md: 8,
        base: 10,
        lg: 12,
        xl: 16,
        '2xl': 20,
        full: 9999,
    },

    // Common component sizes
    buttonHeight: {
        sm: 36,
        md: 44,
        lg: 52,
    },
    inputHeight: 48,
    iconSize: {
        sm: 16,
        md: 20,
        lg: 24,
        xl: 32,
    },
    avatarSize: {
        sm: 32,
        md: 48,
        lg: 64,
        xl: 80,
    },
};

// Helper to create consistent shadow styles
export const Shadows = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    xl: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 8,
    },
};
