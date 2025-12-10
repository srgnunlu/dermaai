/**
 * Mobile Authentication Module
 * JWT-based authentication for React Native mobile app
 * Supports Google OAuth token verification
 */

import jwt from 'jsonwebtoken';
import type { RequestHandler, Express } from 'express';
import { storage } from './storage';
import crypto from 'crypto';
import logger from './logger';

// JWT secrets - should be set in environment variables
const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'dermaai-jwt-secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET + '-refresh';

// Token expiration times
const ACCESS_TOKEN_EXPIRY = '1h'; // 1 hour
const REFRESH_TOKEN_EXPIRY = '7d'; // 7 days

interface JWTPayload {
    userId: string;
    email: string;
    role: string;
}

/**
 * Generate access and refresh tokens
 */
export function generateTokens(user: { id: string; email: string; role: string }) {
    const payload: JWTPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
    };

    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
    const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });

    return { accessToken, refreshToken };
}

/**
 * Verify access token
 */
export function verifyAccessToken(token: string): JWTPayload | null {
    try {
        return jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (error) {
        return null;
    }
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token: string): JWTPayload | null {
    try {
        return jwt.verify(token, JWT_REFRESH_SECRET) as JWTPayload;
    } catch (error) {
        return null;
    }
}

/**
 * Verify Google ID token
 */
async function verifyGoogleToken(idToken: string): Promise<{
    email: string;
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
} | null> {
    try {
        // Verify with Google's tokeninfo endpoint
        const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);

        if (!response.ok) {
            logger.error('[MOBILE_AUTH] Google token verification failed:', response.status);
            return null;
        }

        const data = await response.json();

        // Verify the token is for our app
        if (data.aud !== process.env.GOOGLE_CLIENT_ID &&
            data.aud !== process.env.GOOGLE_MOBILE_CLIENT_ID) {
            logger.error('[MOBILE_AUTH] Token audience mismatch');
            return null;
        }

        return {
            email: data.email,
            firstName: data.given_name,
            lastName: data.family_name,
            profileImageUrl: data.picture,
        };
    } catch (error) {
        logger.error('[MOBILE_AUTH] Error verifying Google token:', error);
        return null;
    }
}

/**
 * Setup mobile authentication routes
 */
export function setupMobileAuth(app: Express) {
    logger.debug('[MOBILE_AUTH] Setting up mobile authentication routes...');

    /**
   * Mobile Google OAuth login
   * Receives Google access token from mobile app, gets user info, and returns JWT tokens
   */
    app.post('/api/auth/mobile/google', async (req, res) => {
        try {
            const { accessToken, idToken } = req.body;

            const token = accessToken || idToken;
            if (!token) {
                return res.status(400).json({ error: 'Google token is required' });
            }

            // Get user info from Google using access token
            let googleUser;

            if (accessToken) {
                // Use access token to get user info from userinfo endpoint
                const userInfoResponse = await fetch('https://www.googleapis.com/userinfo/v2/me', {
                    headers: { Authorization: `Bearer ${accessToken}` },
                });

                if (!userInfoResponse.ok) {
                    logger.error('[MOBILE_AUTH] Failed to get user info from Google');
                    return res.status(401).json({ error: 'Invalid Google access token' });
                }

                const userInfo = await userInfoResponse.json();
                googleUser = {
                    email: userInfo.email,
                    firstName: userInfo.given_name,
                    lastName: userInfo.family_name,
                    profileImageUrl: userInfo.picture,
                };
            } else {
                // Fallback to id token verification
                googleUser = await verifyGoogleToken(idToken);
            }

            if (!googleUser || !googleUser.email) {
                return res.status(401).json({ error: 'Invalid Google token' });
            }
            // Find or create user
            let user;
            try {
                user = await storage.getUserByEmail(googleUser.email);
            } catch (error) {
                user = undefined;
            }

            if (!user) {
                // Create new user
                const role = googleUser.email === process.env.ADMIN_EMAIL ? 'admin' : 'user';
                user = await storage.upsertUser({
                    id: crypto.randomUUID(),
                    email: googleUser.email,
                    firstName: googleUser.firstName || googleUser.email.split('@')[0],
                    lastName: googleUser.lastName || '',
                    profileImageUrl: googleUser.profileImageUrl || null,
                    role,
                });
                logger.debug(`[MOBILE_AUTH] Created new mobile user: ${googleUser.email}`);
            }

            // Generate tokens
            const tokens = generateTokens({
                id: user.id,
                email: user.email || '',
                role: user.role,
            });

            res.json({
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    profileImageUrl: user.profileImageUrl,
                    role: user.role,
                },
            });
        } catch (error) {
            logger.error('[MOBILE_AUTH] Google auth error:', error);
            res.status(500).json({ error: 'Authentication failed' });
        }
    });

    /**
     * Refresh access token
     */
    app.post('/api/auth/mobile/refresh', async (req, res) => {
        try {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                return res.status(400).json({ error: 'Refresh token is required' });
            }

            const payload = verifyRefreshToken(refreshToken);

            if (!payload) {
                return res.status(401).json({ error: 'Invalid or expired refresh token' });
            }

            // Get fresh user data
            const user = await storage.getUser(payload.userId);

            if (!user) {
                return res.status(401).json({ error: 'User not found' });
            }

            // Generate new tokens
            const tokens = generateTokens({
                id: user.id,
                email: user.email || '',
                role: user.role,
            });

            res.json({
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    profileImageUrl: user.profileImageUrl,
                    role: user.role,
                },
            });
        } catch (error) {
            logger.error('[MOBILE_AUTH] Token refresh error:', error);
            res.status(500).json({ error: 'Token refresh failed' });
        }
    });

    /**
     * Verify token and get user info
     */
    app.get('/api/auth/mobile/user', isMobileAuthenticated, async (req: any, res) => {
        try {
            const userId = req.mobileUser.userId;
            const user = await storage.getUser(userId);

            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            res.json({
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                profileImageUrl: user.profileImageUrl,
                role: user.role,
                isHealthProfessional: user.isHealthProfessional ?? false,
                isProfileComplete: user.isProfileComplete ?? false,
            });
        } catch (error) {
            logger.error('[MOBILE_AUTH] Get user error:', error);
            res.status(500).json({ error: 'Failed to get user' });
        }
    });

    logger.debug('[MOBILE_AUTH] Mobile authentication routes configured');
}

/**
 * Middleware to authenticate mobile requests via JWT
 */
export const isMobileAuthenticated: RequestHandler = (req: any, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);

    if (!payload) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Attach user info to request
    req.mobileUser = payload;
    next();
};
