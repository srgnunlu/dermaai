/**
 * Color scheme configuration for DermaAssistAI
 * Warm, calming medical design with teal primary
 * Supports both light and dark themes
 * 
 * Enhanced with gradients, glassmorphism, and premium UI colors
 */

// Primary colors - Teal for medical trust and calm
const primaryLight = '#0E7490';
const primaryDark = '#22D3EE';

// Gradient colors
export const Gradients = {
  light: {
    primary: ['#0E7490', '#0891B2', '#06B6D4'] as const,
    primarySoft: ['#E0F2FE', '#CFFAFE', '#A5F3FC'] as const,
    accent: ['#06B6D4', '#22D3EE', '#67E8F9'] as const,
    success: ['#059669', '#10B981', '#34D399'] as const,
    warm: ['#F97316', '#FB923C', '#FDBA74'] as const,
    medical: ['#0E7490', '#0D9488', '#14B8A6'] as const,
    hero: ['#0E7490', '#0891B2', '#0D9488'] as const,
    card: ['#FFFFFF', '#F8FAFC'] as const,
    shimmer: ['transparent', 'rgba(255,255,255,0.4)', 'transparent'] as const,
  },
  dark: {
    primary: ['#22D3EE', '#06B6D4', '#0891B2'] as const,
    primarySoft: ['#164E63', '#155E75', '#0E7490'] as const,
    accent: ['#67E8F9', '#22D3EE', '#06B6D4'] as const,
    success: ['#34D399', '#10B981', '#059669'] as const,
    warm: ['#FDBA74', '#FB923C', '#F97316'] as const,
    medical: ['#14B8A6', '#0D9488', '#0E7490'] as const,
    hero: ['#0D9488', '#0891B2', '#0E7490'] as const,
    card: ['#1E293B', '#334155'] as const,
    shimmer: ['transparent', 'rgba(255,255,255,0.1)', 'transparent'] as const,
  },
};

// Glassmorphism configuration
export const Glass = {
  light: {
    background: 'rgba(255, 255, 255, 0.7)',
    backgroundStrong: 'rgba(255, 255, 255, 0.9)',
    backgroundSubtle: 'rgba(255, 255, 255, 0.5)',
    border: 'rgba(255, 255, 255, 0.3)',
    blur: 10,
    blurStrong: 20,
  },
  dark: {
    background: 'rgba(30, 41, 59, 0.7)',
    backgroundStrong: 'rgba(30, 41, 59, 0.9)',
    backgroundSubtle: 'rgba(30, 41, 59, 0.5)',
    border: 'rgba(255, 255, 255, 0.1)',
    blur: 10,
    blurStrong: 20,
  },
};

// Glow and animation colors
export const Glow = {
  light: {
    primary: 'rgba(14, 116, 144, 0.3)',
    primaryStrong: 'rgba(14, 116, 144, 0.5)',
    success: 'rgba(5, 150, 105, 0.3)',
    accent: 'rgba(6, 182, 212, 0.3)',
  },
  dark: {
    primary: 'rgba(34, 211, 238, 0.3)',
    primaryStrong: 'rgba(34, 211, 238, 0.5)',
    success: 'rgba(52, 211, 153, 0.3)',
    accent: 'rgba(103, 232, 249, 0.3)',
  },
};

export const Colors = {
  light: {
    // Core colors
    text: '#0F172A',
    textSecondary: '#64748B',
    textMuted: '#94A3B8',
    background: '#F8FAFC',
    card: '#FFFFFF',
    cardElevated: '#FFFFFF',

    // Brand colors
    tint: primaryLight,
    primary: primaryLight,
    primaryForeground: '#FFFFFF',
    primaryLight: '#E0F2FE',
    primaryDark: '#155E75',

    // Secondary
    secondary: '#F1F5F9',
    secondaryForeground: '#0F172A',

    // Muted
    muted: '#F1F5F9',
    mutedForeground: '#64748B',

    // Accent
    accent: '#E0F2FE',
    accentForeground: '#0E7490',
    accentCyan: '#06B6D4',
    accentTeal: '#14B8A6',

    // Borders
    border: '#E2E8F0',
    borderLight: '#F1F5F9',
    borderGradientStart: '#0E7490',
    borderGradientEnd: '#06B6D4',

    // Tab bar
    tabIconDefault: '#94A3B8',
    tabIconSelected: primaryLight,

    // Status colors
    success: '#059669',
    successForeground: '#FFFFFF',
    successLight: '#D1FAE5',

    warning: '#D97706',
    warningForeground: '#FFFFFF',
    warningLight: '#FEF3C7',

    destructive: '#DC2626',
    destructiveForeground: '#FFFFFF',
    destructiveLight: '#FEE2E2',

    info: '#0284C7',
    infoForeground: '#FFFFFF',
    infoLight: '#E0F2FE',

    // Confidence colors
    confidenceHigh: '#059669',
    confidenceMedium: '#D97706',
    confidenceLow: '#DC2626',

    // Shadows (for iOS)
    shadow: 'rgba(0, 0, 0, 0.08)',
    shadowStrong: 'rgba(0, 0, 0, 0.12)',
    shadowColored: 'rgba(14, 116, 144, 0.15)',

    // Overlay
    overlay: 'rgba(0, 0, 0, 0.5)',
    overlayLight: 'rgba(0, 0, 0, 0.2)',

    // Premium UI
    shimmer: 'rgba(255, 255, 255, 0.6)',
    glow: 'rgba(14, 116, 144, 0.25)',
    glowStrong: 'rgba(14, 116, 144, 0.4)',
    skeleton: '#E2E8F0',
    skeletonHighlight: '#F1F5F9',
  },
  dark: {
    // Core colors
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    background: '#0F172A',
    card: '#1E293B',
    cardElevated: '#334155',

    // Brand colors
    tint: primaryDark,
    primary: primaryDark,
    primaryForeground: '#0F172A',
    primaryLight: '#164E63',
    primaryDark: '#0E7490',

    // Secondary
    secondary: '#1E293B',
    secondaryForeground: '#F8FAFC',

    // Muted
    muted: '#1E293B',
    mutedForeground: '#94A3B8',

    // Accent
    accent: '#164E63',
    accentForeground: '#22D3EE',
    accentCyan: '#22D3EE',
    accentTeal: '#2DD4BF',

    // Borders
    border: '#334155',
    borderLight: '#1E293B',
    borderGradientStart: '#22D3EE',
    borderGradientEnd: '#14B8A6',

    // Tab bar
    tabIconDefault: '#64748B',
    tabIconSelected: primaryDark,

    // Status colors
    success: '#34D399',
    successForeground: '#0F172A',
    successLight: '#064E3B',

    warning: '#FBBF24',
    warningForeground: '#0F172A',
    warningLight: '#78350F',

    destructive: '#F87171',
    destructiveForeground: '#0F172A',
    destructiveLight: '#7F1D1D',

    info: '#38BDF8',
    infoForeground: '#0F172A',
    infoLight: '#0C4A6E',

    // Confidence colors
    confidenceHigh: '#34D399',
    confidenceMedium: '#FBBF24',
    confidenceLow: '#F87171',

    // Shadows
    shadow: 'rgba(0, 0, 0, 0.3)',
    shadowStrong: 'rgba(0, 0, 0, 0.5)',
    shadowColored: 'rgba(34, 211, 238, 0.15)',

    // Overlay
    overlay: 'rgba(0, 0, 0, 0.7)',
    overlayLight: 'rgba(0, 0, 0, 0.4)',

    // Premium UI
    shimmer: 'rgba(255, 255, 255, 0.15)',
    glow: 'rgba(34, 211, 238, 0.25)',
    glowStrong: 'rgba(34, 211, 238, 0.4)',
    skeleton: '#334155',
    skeletonHighlight: '#475569',
  },
};

// Helper to get confidence color based on value
export function getConfidenceColor(confidence: number, colorScheme: 'light' | 'dark'): string {
  const colors = Colors[colorScheme];
  if (confidence >= 70) return colors.confidenceHigh;
  if (confidence >= 40) return colors.confidenceMedium;
  return colors.confidenceLow;
}

// Type export for components
export type ColorScheme = typeof Colors.light;
