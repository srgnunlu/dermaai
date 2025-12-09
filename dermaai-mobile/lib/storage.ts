/**
 * Secure storage utilities for authentication tokens
 * Uses expo-secure-store for encrypted storage on device
 * Falls back to localStorage on web platform
 */

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { STORAGE_KEYS } from '@/constants/Config';

/**
 * Platform-aware storage helpers
 * Web uses localStorage, native uses SecureStore
 */
const storage = {
    async getItem(key: string): Promise<string | null> {
        if (Platform.OS === 'web') {
            return localStorage.getItem(key);
        }
        return SecureStore.getItemAsync(key);
    },
    async setItem(key: string, value: string): Promise<void> {
        if (Platform.OS === 'web') {
            localStorage.setItem(key, value);
            return;
        }
        await SecureStore.setItemAsync(key, value);
    },
    async deleteItem(key: string): Promise<void> {
        if (Platform.OS === 'web') {
            localStorage.removeItem(key);
            return;
        }
        await SecureStore.deleteItemAsync(key);
    },
};

/**
 * Save authentication tokens securely
 */
export async function saveTokens(accessToken: string, refreshToken: string): Promise<void> {
    await Promise.all([
        storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken),
        storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken),
    ]);
}

/**
 * Get access token from secure storage
 */
export async function getAccessToken(): Promise<string | null> {
    return storage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
}

/**
 * Get refresh token from secure storage
 */
export async function getRefreshToken(): Promise<string | null> {
    return storage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
}

/**
 * Clear all authentication tokens
 */
export async function clearTokens(): Promise<void> {
    await Promise.all([
        storage.deleteItem(STORAGE_KEYS.ACCESS_TOKEN),
        storage.deleteItem(STORAGE_KEYS.REFRESH_TOKEN),
        storage.deleteItem(STORAGE_KEYS.USER_DATA),
    ]);
}

/**
 * Save user data to secure storage
 */
export async function saveUserData(userData: object): Promise<void> {
    await storage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
}

/**
 * Get user data from secure storage
 */
export async function getUserData<T = object>(): Promise<T | null> {
    const data = await storage.getItem(STORAGE_KEYS.USER_DATA);
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
    await storage.setItem(STORAGE_KEYS.THEME, theme);
}

/**
 * Get theme preference
 */
export async function getTheme(): Promise<'light' | 'dark' | 'system' | null> {
    const theme = await storage.getItem(STORAGE_KEYS.THEME);
    if (theme === 'light' || theme === 'dark' || theme === 'system') {
        return theme;
    }
    return null;
}
