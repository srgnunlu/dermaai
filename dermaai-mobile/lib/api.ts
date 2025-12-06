/**
 * API client for DermaAssistAI backend
 * Handles authentication, token refresh, and API requests
 */

import { API_BASE_URL, API_TIMEOUT } from '@/constants/Config';
import { getAccessToken, getRefreshToken, saveTokens, clearTokens } from './storage';
import type { AuthResponse, ApiError } from '@/types/schema';

class ApiClient {
    private baseUrl: string;
    private isRefreshing: boolean = false;
    private refreshPromise: Promise<string | null> | null = null;

    constructor(baseUrl: string = API_BASE_URL) {
        this.baseUrl = baseUrl;
    }

    /**
     * Get authorization headers
     */
    private async getHeaders(includeAuth: boolean = true): Promise<HeadersInit> {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };

        if (includeAuth) {
            const token = await getAccessToken();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        }

        return headers;
    }

    /**
     * Refresh the access token using the refresh token
     */
    private async refreshToken(): Promise<string | null> {
        // If already refreshing, wait for the existing promise
        if (this.isRefreshing && this.refreshPromise) {
            return this.refreshPromise;
        }

        this.isRefreshing = true;
        this.refreshPromise = (async () => {
            try {
                const refreshToken = await getRefreshToken();
                if (!refreshToken) {
                    await clearTokens();
                    return null;
                }

                const response = await fetch(`${this.baseUrl}/api/auth/mobile/refresh`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refreshToken }),
                });

                if (!response.ok) {
                    await clearTokens();
                    return null;
                }

                const data: AuthResponse = await response.json();
                await saveTokens(data.accessToken, data.refreshToken);
                return data.accessToken;
            } catch (error) {
                console.error('Token refresh failed:', error);
                await clearTokens();
                return null;
            } finally {
                this.isRefreshing = false;
                this.refreshPromise = null;
            }
        })();

        return this.refreshPromise;
    }

    /**
     * Make an authenticated API request
     */
    async request<T>(
        endpoint: string,
        options: RequestInit = {},
        retryOnUnauthorized: boolean = true
    ): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = await this.getHeaders(true);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

        try {
            const response = await fetch(url, {
                ...options,
                headers: { ...headers, ...options.headers },
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            // Handle 401 Unauthorized - try token refresh
            if (response.status === 401 && retryOnUnauthorized) {
                const newToken = await this.refreshToken();
                if (newToken) {
                    // Retry the request with new token
                    return this.request<T>(endpoint, options, false);
                }
                throw new Error('Authentication failed');
            }

            if (!response.ok) {
                const errorData: ApiError = await response.json().catch(() => ({
                    error: 'Request failed',
                    message: response.statusText,
                }));
                throw new Error(errorData.message || errorData.error);
            }

            // Handle empty responses
            const text = await response.text();
            if (!text) return {} as T;

            return JSON.parse(text) as T;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error('Request timed out');
            }
            throw error;
        }
    }

    /**
     * GET request
     */
    async get<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: 'GET' });
    }

    /**
     * POST request
     */
    async post<T>(endpoint: string, data?: unknown): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    /**
     * PUT request
     */
    async put<T>(endpoint: string, data?: unknown): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    /**
     * DELETE request
     */
    async delete<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: 'DELETE' });
    }

    /**
     * Upload image as base64
     */
    async uploadImage(base64Data: string, filename: string): Promise<{ url: string }> {
        return this.post<{ url: string }>('/api/upload', {
            base64: base64Data,
            filename,
        });
    }

    /**
     * Login with email and password
     */
    async login(email: string, password: string): Promise<AuthResponse> {
        const response = await fetch(`${this.baseUrl}/api/auth/mobile/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            const error: ApiError = await response.json().catch(() => ({
                error: 'Login failed',
            }));
            throw new Error(error.message || error.error);
        }

        const data: AuthResponse = await response.json();
        await saveTokens(data.accessToken, data.refreshToken);
        return data;
    }

    /**
     * Register new user
     */
    async register(email: string, password: string, firstName?: string, lastName?: string): Promise<AuthResponse> {
        const response = await fetch(`${this.baseUrl}/api/auth/mobile/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, firstName, lastName }),
        });

        if (!response.ok) {
            const error: ApiError = await response.json().catch(() => ({
                error: 'Registration failed',
            }));
            throw new Error(error.message || error.error);
        }

        const data: AuthResponse = await response.json();
        await saveTokens(data.accessToken, data.refreshToken);
        return data;
    }

    /**
     * Logout - clear tokens
     */
    async logout(): Promise<void> {
        await clearTokens();
    }
}

// Export singleton instance
export const api = new ApiClient();
