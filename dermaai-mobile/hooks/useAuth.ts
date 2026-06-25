/**
 * Authentication hook for DermaAssistAI
 * Provides user state and auth methods with Google OAuth support
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { getAccessToken, clearTokens, saveUserData, getUserData, saveTokens } from '@/lib/storage';
import type { User, AuthResponse, UpdateProfileData } from '@/types/schema';
import { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/constants/Config';
import Purchases from 'react-native-purchases';
import { Platform } from 'react-native';
import { getRevenueCatApiKey } from '@/constants/Config';

export function useAuth() {
    const queryClient = useQueryClient();
    const [isInitialized, setIsInitialized] = useState(false);

    // Check if user has a token on mount
    useEffect(() => {
        const checkAuth = async () => {
            const token = await getAccessToken();
            if (!token) {
                setIsInitialized(true);
            }
        };
        checkAuth();
    }, []);

    // Query current user
    const {
        data: user,
        isLoading: isLoadingUser,
        error,
        refetch: refetchUser,
    } = useQuery<User | null>({
        queryKey: ['auth', 'user'],
        queryFn: async () => {
            const token = await getAccessToken();

            if (!token) return null;

            try {
                const userData = await api.get<User>('/api/auth/mobile/user');
                await saveUserData(userData);
                return userData;
            } catch (err) {
                // Auth errors are expected when not logged in - don't log them
                // If auth fails, try to get cached user data
                const cachedUser = await getUserData<User>();
                if (cachedUser) return cachedUser;
                // Clear tokens if auth failed
                await clearTokens();
                return null;
            }
        },
        enabled: true,
        retry: false,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    // Google OAuth login mutation
    const googleLoginMutation = useMutation({
        mutationFn: async (accessToken: string) => {
            const response = await fetch(`${API_BASE_URL}/api/auth/mobile/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accessToken }),
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({ error: 'Login failed' }));
                throw new Error(error.message || error.error);
            }

            return response.json() as Promise<AuthResponse>;
        },
        onSuccess: async (data: AuthResponse) => {
            await saveTokens(data.accessToken, data.refreshToken);
            await saveUserData(data.user);
            queryClient.setQueryData(['auth', 'user'], data.user);
        },
    });

    const appleLoginMutation = useMutation({
        mutationFn: async (credentials: {
            identityToken: string;
            firstName?: string;
            lastName?: string;
        }) => {
            const response = await fetch(`${API_BASE_URL}/api/auth/mobile/apple`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials),
            });

            if (!response.ok) {
                const authError = await response.json().catch(() => ({ error: 'Apple login failed' }));
                throw new Error(authError.message || authError.error);
            }

            return response.json() as Promise<AuthResponse>;
        },
        onSuccess: async (data: AuthResponse) => {
            await saveTokens(data.accessToken, data.refreshToken);
            await saveUserData(data.user);
            queryClient.setQueryData(['auth', 'user'], data.user);
        },
    });

    // App Review demo login (email + password). Backend only accepts the single
    // pre-configured reviewer credential and is disabled in normal operation.
    const demoLoginMutation = useMutation({
        mutationFn: async (credentials: { email: string; password: string }) => {
            const response = await fetch(`${API_BASE_URL}/api/auth/mobile/demo`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials),
            });

            if (!response.ok) {
                const authError = await response.json().catch(() => ({ error: 'Login failed' }));
                throw new Error(authError.message || authError.error);
            }

            return response.json() as Promise<AuthResponse>;
        },
        onSuccess: async (data: AuthResponse) => {
            await saveTokens(data.accessToken, data.refreshToken);
            await saveUserData(data.user);
            queryClient.setQueryData(['auth', 'user'], data.user);
        },
    });

    // Update profile mutation
    const updateProfileMutation = useMutation({
        mutationFn: async (profileData: UpdateProfileData) => {
            const response = await api.put<any>('/api/profile', profileData);
            // API returns { ...userFields, statistics }, extract just user fields
            const { statistics, ...userData } = response;
            return userData as User;
        },
        onSuccess: async (userData) => {
            await saveUserData(userData);
            queryClient.setQueryData(['auth', 'user'], userData);
            // Also invalidate to trigger refetch
            queryClient.invalidateQueries({ queryKey: ['auth', 'user'] });
        },
    });

    // Logout mutation
    const logoutMutation = useMutation({
        mutationFn: async () => {
            if (getRevenueCatApiKey(Platform.OS)) {
                await Purchases.logOut().catch(() => undefined);
            }
            await clearTokens();
        },
        onSuccess: () => {
            queryClient.setQueryData(['auth', 'user'], null);
            queryClient.clear();
        },
    });

    // Mark as initialized after first load
    useEffect(() => {
        if (!isLoadingUser) {
            setIsInitialized(true);
        }
    }, [isLoadingUser]);

    return {
        user,
        isLoading: !isInitialized || isLoadingUser,
        isAuthenticated: !!user,
        error,

        // Google OAuth login
        loginWithGoogle: googleLoginMutation.mutateAsync,
        loginWithApple: appleLoginMutation.mutateAsync,
        loginWithDemo: demoLoginMutation.mutateAsync,
        isLoggingIn: googleLoginMutation.isPending || appleLoginMutation.isPending || demoLoginMutation.isPending,
        loginError: googleLoginMutation.error || appleLoginMutation.error || demoLoginMutation.error,

        // Update profile
        updateProfile: updateProfileMutation.mutateAsync,
        isUpdatingProfile: updateProfileMutation.isPending,
        updateProfileError: updateProfileMutation.error,

        // Logout
        logout: logoutMutation.mutateAsync,
        isLoggingOut: logoutMutation.isPending,

        refetch: refetchUser,
    };
}
