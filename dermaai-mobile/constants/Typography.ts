/**
 * Typography configuration for DermaAssistAI
 * Consistent font sizes, weights, and line heights
 */

export const Typography = {
    // Font sizes
    sizes: {
        xs: 10,
        sm: 12,
        base: 14,
        md: 16,
        lg: 18,
        xl: 20,
        '2xl': 24,
        '3xl': 30,
        '4xl': 36,
    },

    // Font weights (React Native uses string or number)
    weights: {
        normal: '400' as const,
        medium: '500' as const,
        semibold: '600' as const,
        bold: '700' as const,
    },

    // Line heights (multipliers)
    lineHeights: {
        tight: 1.2,
        normal: 1.5,
        relaxed: 1.75,
    },

    // Pre-defined text styles
    styles: {
        // Headings
        h1: {
            fontSize: 30,
            fontWeight: '700' as const,
            lineHeight: 36,
            letterSpacing: -0.5,
        },
        h2: {
            fontSize: 24,
            fontWeight: '600' as const,
            lineHeight: 32,
            letterSpacing: -0.25,
        },
        h3: {
            fontSize: 20,
            fontWeight: '600' as const,
            lineHeight: 28,
        },
        h4: {
            fontSize: 18,
            fontWeight: '600' as const,
            lineHeight: 24,
        },

        // Body text
        body: {
            fontSize: 14,
            fontWeight: '400' as const,
            lineHeight: 20,
        },
        bodyLarge: {
            fontSize: 16,
            fontWeight: '400' as const,
            lineHeight: 24,
        },
        bodySmall: {
            fontSize: 12,
            fontWeight: '400' as const,
            lineHeight: 16,
        },

        // UI elements
        button: {
            fontSize: 16,
            fontWeight: '600' as const,
            lineHeight: 20,
        },
        buttonSmall: {
            fontSize: 14,
            fontWeight: '500' as const,
            lineHeight: 18,
        },
        label: {
            fontSize: 14,
            fontWeight: '500' as const,
            lineHeight: 18,
        },
        caption: {
            fontSize: 12,
            fontWeight: '400' as const,
            lineHeight: 16,
        },
        overline: {
            fontSize: 10,
            fontWeight: '600' as const,
            lineHeight: 14,
            letterSpacing: 0.5,
            textTransform: 'uppercase' as const,
        },
    },
};
