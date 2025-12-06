/**
 * Authentication hook for DermaAssistAI
 * Provides user state and auth methods with Google OAuth support
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { getAccessToken, clearTokens, saveUserData, getUserData, saveTokens } from '@/lib/storage';
import type { User, AuthResponse } from '@/types/schema';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { API_BASE_URL } from '@/constants/Config';

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
            console.log('[AuthDebug] Fetching user...');
            const token = await getAccessToken();
            console.log('[AuthDebug] Token available:', !!token);

            if (!token) return null;

            try {
                const userData = await api.get<User>('/api/auth/mobile/user');
                console.log('[AuthDebug] User fetched:', userData?.email);
                Alert.alert('Debug', `User fetched: ${userData?.email}`);

                await saveUserData(userData);
                return userData;
            } catch (err) {
                console.error('[AuthDebug] User fetch error:', err);
                Alert.alert('Debug Error', `Fetch failed: ${(err as any).message}`);

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

    // Logout mutation
    const logoutMutation = useMutation({
        mutationFn: async () => {
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
        isLoggingIn: googleLoginMutation.isPending,
        loginError: googleLoginMutation.error,

        // Logout
        logout: logoutMutation.mutateAsync,
        isLoggingOut: logoutMutation.isPending,

        refetch: refetchUser,
    };
}
