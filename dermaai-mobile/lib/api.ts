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
        retryOnUnauthorized: boolean = true,
        timeout: number = API_TIMEOUT
    ): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = await this.getHeaders(true);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

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
                    return this.request<T>(endpoint, options, false, timeout);
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

            // Handle 204 No Content responses
            if (response.status === 204) {
                return {} as T;
            }

            // Handle empty responses
            const text = await response.text();
            if (!text) return {} as T;

            return JSON.parse(text) as T;
        } catch (error) {
            clearTimeout(timeoutId);
            // Don't log authentication errors or access denied errors - they can be expected
            // e.g., when accessing a recently deleted case during cache invalidation
            const isAuthError = error instanceof Error && error.message === 'Authentication failed';
            const isAccessDenied = error instanceof Error && error.message === 'Access denied';
            if (!isAuthError && !isAccessDenied) {
                console.error('[API Debug]', endpoint, error);
            }

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
     * POST request with custom timeout (for long-running operations)
     */
    async postWithTimeout<T>(endpoint: string, data: unknown, timeout: number): Promise<T> {
        return this.request<T>(
            endpoint,
            {
                method: 'POST',
                body: data ? JSON.stringify(data) : undefined,
            },
            true,
            timeout
        );
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
     * PATCH request
     */
    async patch<T>(endpoint: string, data?: unknown): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'PATCH',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    /**
     * Select analysis provider for a case
     */
    async selectAnalysisProvider(caseId: string, provider: 'gemini' | 'openai'): Promise<void> {
        return this.patch(`/api/mobile/cases/${caseId}/select-provider`, { provider });
    }

    /**
     * Upload image as base64
     */
    async uploadImage(base64Data: string, filename: string): Promise<{ url: string }> {
        return this.post<{ url: string }>('/api/upload/base64', {
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
