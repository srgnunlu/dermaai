/**
 * Color scheme configuration for DermaAssistAI
 * Supports both light and dark themes
 */

const tintColorLight = '#2563eb'; // Primary blue
const tintColorDark = '#3b82f6'; // Lighter blue for dark mode

export const Colors = {
  light: {
    text: '#0f172a',
    textSecondary: '#64748b',
    background: '#ffffff',
    card: '#f8fafc',
    tint: tintColorLight,
    tabIconDefault: '#94a3b8',
    tabIconSelected: tintColorLight,
    border: '#e2e8f0',
    primary: '#2563eb',
    primaryForeground: '#ffffff',
    secondary: '#f1f5f9',
    secondaryForeground: '#0f172a',
    muted: '#f1f5f9',
    mutedForeground: '#64748b',
    accent: '#f1f5f9',
    accentForeground: '#0f172a',
    destructive: '#ef4444',
    destructiveForeground: '#ffffff',
    success: '#10b981',
    successForeground: '#ffffff',
    warning: '#f59e0b',
    warningForeground: '#ffffff',
    info: '#3b82f6',
    infoForeground: '#ffffff',
  },
  dark: {
    text: '#f8fafc',
    textSecondary: '#94a3b8',
    background: '#0f172a',
    card: '#1e293b',
    tint: tintColorDark,
    tabIconDefault: '#64748b',
    tabIconSelected: tintColorDark,
    border: '#334155',
    primary: '#3b82f6',
    primaryForeground: '#ffffff',
    secondary: '#1e293b',
    secondaryForeground: '#f8fafc',
    muted: '#1e293b',
    mutedForeground: '#94a3b8',
    accent: '#1e293b',
    accentForeground: '#f8fafc',
    destructive: '#f87171',
    destructiveForeground: '#ffffff',
    success: '#34d399',
    successForeground: '#ffffff',
    warning: '#fbbf24',
    warningForeground: '#0f172a',
    info: '#60a5fa',
    infoForeground: '#ffffff',
  },
};
