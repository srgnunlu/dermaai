/**
 * Secure storage utilities for authentication tokens
 * Uses expo-secure-store for encrypted storage on device
 */

import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS } from '@/constants/Config';

/**
 * Save authentication tokens securely
 */
export async function saveTokens(accessToken: string, refreshToken: string): Promise<void> {
    await Promise.all([
        SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, accessToken),
        SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, refreshToken),
    ]);
}

/**
 * Get access token from secure storage
 */
export async function getAccessToken(): Promise<string | null> {
    return SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
}

/**
 * Get refresh token from secure storage
 */
export async function getRefreshToken(): Promise<string | null> {
    return SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
}

/**
 * Clear all authentication tokens
 */
export async function clearTokens(): Promise<void> {
    await Promise.all([
        SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN),
        SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN),
        SecureStore.deleteItemAsync(STORAGE_KEYS.USER_DATA),
    ]);
}

/**
 * Save user data to secure storage
 */
export async function saveUserData(userData: object): Promise<void> {
    await SecureStore.setItemAsync(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
}

/**
 * Get user data from secure storage
 */
export async function getUserData<T = object>(): Promise<T | null> {
    const data = await SecureStore.getItemAsync(STORAGE_KEYS.USER_DATA);
    if (!data) return null;
    try {
        return JSON.parse(data) as T;
    } catch {
        return null;
    }
}

/**
 * Save theme preference
 */
export async function saveTheme(theme: 'light' | 'dark' | 'system'): Promise<void> {
    await SecureStore.setItemAsync(STORAGE_KEYS.THEME, theme);
}

/**
 * Get theme preference
 */
export async function getTheme(): Promise<'light' | 'dark' | 'system' | null> {
    const theme = await SecureStore.getItemAsync(STORAGE_KEYS.THEME);
    if (theme === 'light' || theme === 'dark' || theme === 'system') {
        return theme;
    }
    return null;
}
