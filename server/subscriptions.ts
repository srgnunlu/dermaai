/**
 * Subscription Service
 * Handles subscription validation, limits, and RevenueCat webhook processing
 */

import { eq, sql } from 'drizzle-orm';
import { db } from './db';
import { users } from '../shared/schema';
import logger from './logger';

// Subscription tier types
export type SubscriptionTier = 'free' | 'basic' | 'pro';

// Product ID mapping
export const PRODUCT_IDS = {
    basic_monthly: 'corio_basic_monthly',
    basic_yearly: 'corio_basic_yearly',
    pro_monthly: 'corio_pro_monthly',
    pro_yearly: 'corio_pro_yearly',
} as const;

// Subscription limits per tier
export const SUBSCRIPTION_LIMITS = {
    free: {
        monthlyAnalysisLimit: 3,
        historyDays: 7,
        aiProviders: ['gemini'] as const,
        pdfReport: false,
        pushNotifications: false,
    },
    basic: {
        monthlyAnalysisLimit: 30,
        historyDays: 90,
        aiProviders: ['gemini', 'openai'] as const,
        pdfReport: true,
        pushNotifications: true,
    },
    pro: {
        monthlyAnalysisLimit: Infinity,
        historyDays: Infinity,
        aiProviders: ['gemini', 'openai'] as const,
        pdfReport: true,
        pushNotifications: true,
        priorityAnalysis: true,
        patientManagement: true,
    },
} as const;

// Map RevenueCat product IDs to subscription tiers
export function getSubscriptionTierFromProductId(productId: string): SubscriptionTier {
    if (productId.includes('pro')) {
        return 'pro';
    }
    if (productId.includes('basic')) {
        return 'basic';
    }
    return 'free';
}

// Check if user can perform analysis based on their subscription
export async function canUserAnalyze(userId: string): Promise<{
    allowed: boolean;
    reason?: string;
    remainingAnalyses?: number;
    tier: SubscriptionTier;
}> {
    try {
        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });

        if (!user) {
            return { allowed: false, reason: 'User not found', tier: 'free' };
        }

        const tier = (user.subscriptionTier as SubscriptionTier) || 'free';
        const limits = SUBSCRIPTION_LIMITS[tier];

        // Check if subscription has expired
        if (user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt) < new Date()) {
            // Subscription expired, treat as free user
            return await checkFreeUserLimits(userId, user.monthlyAnalysisCount || 0, user.monthlyAnalysisResetAt);
        }

        // Pro users have unlimited analyses
        // Note: Use a large number instead of Infinity because JSON.stringify(Infinity) = null
        if (tier === 'pro') {
            return { allowed: true, remainingAnalyses: 999999, tier };
        }

        // Check monthly limit
        const currentCount = user.monthlyAnalysisCount || 0;
        const resetAt = user.monthlyAnalysisResetAt;

        // Check if we need to reset the monthly counter
        if (shouldResetMonthlyCounter(resetAt)) {
            await resetMonthlyAnalysisCount(userId);
            return {
                allowed: true,
                remainingAnalyses: limits.monthlyAnalysisLimit - 1,
                tier,
            };
        }

        if (currentCount >= limits.monthlyAnalysisLimit) {
            return {
                allowed: false,
                reason: tier === 'free'
                    ? 'Ücretsiz analiz hakkınız doldu. Premium\'a yükseltin!'
                    : 'Aylık analiz limitinize ulaştınız.',
                remainingAnalyses: 0,
                tier,
            };
        }

        return {
            allowed: true,
            remainingAnalyses: limits.monthlyAnalysisLimit - currentCount,
            tier,
        };
    } catch (error) {
        logger.error('[Subscription] Error checking analysis permission:', error);
        // Default to allowing in case of error to not block users
        return { allowed: true, tier: 'free' };
    }
}

// Check free user limits
async function checkFreeUserLimits(
    userId: string,
    currentCount: number,
    resetAt: Date | null
): Promise<{
    allowed: boolean;
    reason?: string;
    remainingAnalyses?: number;
    tier: SubscriptionTier;
}> {
    const limits = SUBSCRIPTION_LIMITS.free;

    if (shouldResetMonthlyCounter(resetAt)) {
        await resetMonthlyAnalysisCount(userId);
        return {
            allowed: true,
            remainingAnalyses: limits.monthlyAnalysisLimit - 1,
            tier: 'free',
        };
    }

    if (currentCount >= limits.monthlyAnalysisLimit) {
        return {
            allowed: false,
            reason: 'Ücretsiz analiz hakkınız doldu. Premium\'a yükseltin!',
            remainingAnalyses: 0,
            tier: 'free',
        };
    }

    return {
        allowed: true,
        remainingAnalyses: limits.monthlyAnalysisLimit - currentCount,
        tier: 'free',
    };
}

// Check if monthly counter should be reset
function shouldResetMonthlyCounter(resetAt: Date | null): boolean {
    if (!resetAt) return true;

    const now = new Date();
    const resetDate = new Date(resetAt);

    // Reset if the reset date is in the past
    return now >= resetDate;
}

// Reset monthly analysis count for a user
export async function resetMonthlyAnalysisCount(userId: string): Promise<void> {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    await db
        .update(users)
        .set({
            monthlyAnalysisCount: 0,
            monthlyAnalysisResetAt: nextMonth,
            updatedAt: now,
        })
        .where(eq(users.id, userId));

    logger.info(`[Subscription] Reset monthly analysis count for user ${userId}`);
}

// Increment analysis count after successful analysis
export async function incrementAnalysisCount(userId: string): Promise<void> {
    try {
        await db
            .update(users)
            .set({
                monthlyAnalysisCount: sql`COALESCE(${users.monthlyAnalysisCount}, 0) + 1`,
                updatedAt: new Date(),
            })
            .where(eq(users.id, userId));

        logger.info(`[Subscription] Incremented analysis count for user ${userId}`);
    } catch (error) {
        logger.error('[Subscription] Error incrementing analysis count:', error);
    }
}

// Update user subscription from RevenueCat webhook
export async function updateUserSubscription(
    userId: string,
    tier: SubscriptionTier,
    expiresAt: Date | null,
    revenueCatId?: string
): Promise<void> {
    try {
        await db
            .update(users)
            .set({
                subscriptionTier: tier,
                subscriptionExpiresAt: expiresAt,
                revenueCatId: revenueCatId || undefined,
                updatedAt: new Date(),
            })
            .where(eq(users.id, userId));

        logger.info(`[Subscription] Updated subscription for user ${userId} to ${tier}`);
    } catch (error) {
        logger.error('[Subscription] Error updating subscription:', error);
        throw error;
    }
}

// Get user subscription status
export async function getUserSubscriptionStatus(userId: string): Promise<{
    tier: SubscriptionTier;
    expiresAt: Date | null;
    monthlyAnalysisCount: number;
    monthlyAnalysisLimit: number;
    remainingAnalyses: number;
    features: typeof SUBSCRIPTION_LIMITS[SubscriptionTier];
}> {
    const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
    });

    if (!user) {
        throw new Error('User not found');
    }

    let tier = (user.subscriptionTier as SubscriptionTier) || 'free';

    // Check if subscription has expired
    if (user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt) < new Date()) {
        tier = 'free';
    }

    const limits = SUBSCRIPTION_LIMITS[tier];
    const currentCount = user.monthlyAnalysisCount || 0;
    // Note: Use a large number instead of Infinity because JSON.stringify(Infinity) = null
    // which causes canAnalyze() to return false on the mobile app
    const remaining = tier === 'pro'
        ? 999999
        : Math.max(0, limits.monthlyAnalysisLimit - currentCount);

    return {
        tier,
        expiresAt: user.subscriptionExpiresAt,
        monthlyAnalysisCount: currentCount,
        monthlyAnalysisLimit: limits.monthlyAnalysisLimit,
        remainingAnalyses: remaining,
        features: limits,
    };
}

// RevenueCat webhook event types
export type RevenueCatEventType =
    | 'INITIAL_PURCHASE'
    | 'RENEWAL'
    | 'CANCELLATION'
    | 'UNCANCELLATION'
    | 'NON_RENEWING_PURCHASE'
    | 'SUBSCRIPTION_PAUSED'
    | 'EXPIRATION'
    | 'BILLING_ISSUE'
    | 'PRODUCT_CHANGE';

// Process RevenueCat webhook
export async function processRevenueCatWebhook(event: {
    type: RevenueCatEventType;
    app_user_id: string;
    product_id: string;
    expiration_at_ms?: number;
}): Promise<void> {
    const { type, app_user_id: userId, product_id: productId, expiration_at_ms } = event;

    logger.info(`[RevenueCat] Processing webhook: ${type} for user ${userId}`);

    const tier = getSubscriptionTierFromProductId(productId);
    const expiresAt = expiration_at_ms ? new Date(expiration_at_ms) : null;

    switch (type) {
        case 'INITIAL_PURCHASE':
        case 'RENEWAL':
        case 'UNCANCELLATION':
        case 'NON_RENEWING_PURCHASE':
        case 'PRODUCT_CHANGE':
            await updateUserSubscription(userId, tier, expiresAt);
            break;

        case 'EXPIRATION':
        case 'CANCELLATION':
            // Downgrade to free tier
            await updateUserSubscription(userId, 'free', null);
            break;

        case 'BILLING_ISSUE':
            // Log but don't change subscription yet - RevenueCat handles grace period
            logger.warn(`[RevenueCat] Billing issue for user ${userId}`);
            break;

        case 'SUBSCRIPTION_PAUSED':
            // Treat paused as free tier
            await updateUserSubscription(userId, 'free', null);
            break;

        default:
            logger.warn(`[RevenueCat] Unknown event type: ${type}`);
    }
}
