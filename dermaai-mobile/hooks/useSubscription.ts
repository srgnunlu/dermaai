/**
 * useSubscription Hook
 * Manages subscription state using RevenueCat SDK
 */

import { useEffect, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Purchases, {
    LOG_LEVEL,
    PurchasesPackage,
    CustomerInfo,
    PurchasesOffering,
} from 'react-native-purchases';
import { api } from '@/lib/api';

// Subscription tier types
export type SubscriptionTier = 'free' | 'basic' | 'pro';

// Product IDs for RevenueCat
export const PRODUCT_IDS = {
    basic_monthly: 'corio_basic_monthly',
    basic_yearly: 'corio_basic_yearly',
    pro_monthly: 'corio_pro_monthly',
    pro_yearly: 'corio_pro_yearly',
} as const;

// RevenueCat API Keys
const REVENUECAT_IOS_API_KEY = 'test_NVaCJScnTJldnjDHXLEQeiXAGXk';
const REVENUECAT_ANDROID_API_KEY = 'test_NVaCJScnTJldnjDHXLEQeiXAGXk';

// Entitlement IDs in RevenueCat
const ENTITLEMENTS = {
    basic: 'basic_access',
    pro: 'pro_access',
} as const;

// Subscription status from backend
export interface SubscriptionStatus {
    tier: SubscriptionTier;
    expiresAt: Date | null;
    monthlyAnalysisCount: number;
    monthlyAnalysisLimit: number;
    remainingAnalyses: number;
    features: {
        monthlyAnalysisLimit: number;
        historyDays: number;
        aiProviders: readonly string[];
        pdfReport: boolean;
        pushNotifications: boolean;
        priorityAnalysis?: boolean;
        patientManagement?: boolean;
    };
}

// Plan information for display
export interface SubscriptionPlan {
    name: string;
    monthlyAnalysisLimit: number;
    historyDays: number;
    aiProviders: string[];
    pdfReport: boolean;
    pushNotifications: boolean;
    priorityAnalysis?: boolean;
    patientManagement?: boolean;
}

export interface SubscriptionPlans {
    plans: {
        free: SubscriptionPlan;
        basic: SubscriptionPlan;
        pro: SubscriptionPlan;
    };
    productIds: typeof PRODUCT_IDS;
}

// Initialize RevenueCat (call once at app startup)
export async function initializeRevenueCat(appUserId?: string): Promise<void> {
    try {
        Purchases.setLogLevel(LOG_LEVEL.VERBOSE);

        const apiKey = Platform.OS === 'ios'
            ? REVENUECAT_IOS_API_KEY
            : REVENUECAT_ANDROID_API_KEY;

        if (appUserId) {
            await Purchases.configure({ apiKey, appUserID: appUserId });
        } else {
            await Purchases.configure({ apiKey });
        }

        console.log('[RevenueCat] Initialized successfully');
    } catch (error) {
        console.error('[RevenueCat] Initialization failed:', error);
        throw error;
    }
}

// Get tier from RevenueCat customer info
function getTierFromCustomerInfo(customerInfo: CustomerInfo): SubscriptionTier {
    if (customerInfo.entitlements.active[ENTITLEMENTS.pro]) {
        return 'pro';
    }
    if (customerInfo.entitlements.active[ENTITLEMENTS.basic]) {
        return 'basic';
    }
    return 'free';
}

export function useSubscription() {
    const queryClient = useQueryClient();
    const [isRevenueCatReady, setIsRevenueCatReady] = useState(false);
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [offerings, setOfferings] = useState<PurchasesOffering | null>(null);
    const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);

    // Fetch subscription status from backend
    const {
        data: subscriptionStatus,
        isLoading: isLoadingStatus,
        error: statusError,
        refetch: refetchStatus,
    } = useQuery<SubscriptionStatus>({
        queryKey: ['subscription-status'],
        queryFn: async () => {
            const response = await api.get<SubscriptionStatus>('/api/subscription');
            return response;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    // Fetch available plans
    const {
        data: plansData,
        isLoading: isLoadingPlans,
    } = useQuery<SubscriptionPlans>({
        queryKey: ['subscription-plans'],
        queryFn: async () => {
            const response = await api.get<SubscriptionPlans>('/api/subscription/plans');
            return response;
        },
        staleTime: 24 * 60 * 60 * 1000, // 24 hours
    });

    // Initialize RevenueCat and fetch offerings
    useEffect(() => {
        const init = async () => {
            try {
                // Get offerings from RevenueCat
                const offerings = await Purchases.getOfferings();
                if (offerings.current) {
                    setOfferings(offerings.current);
                }

                // Get customer info
                const info = await Purchases.getCustomerInfo();
                setCustomerInfo(info);

                setIsRevenueCatReady(true);
            } catch (error) {
                console.error('[Subscription] Failed to initialize RevenueCat:', error);
            }
        };

        init();

        // Listen for customer info updates
        const customerInfoListener = (info: CustomerInfo) => {
            setCustomerInfo(info);
            // Refresh backend status when RevenueCat status changes
            refetchStatus();
        };

        Purchases.addCustomerInfoUpdateListener(customerInfoListener);

        return () => {
            Purchases.removeCustomerInfoUpdateListener(customerInfoListener);
        };
    }, [refetchStatus]);

    // Check if user can analyze (has remaining analyses)
    const canAnalyze = useCallback((): boolean => {
        if (!subscriptionStatus) return true; // Allow by default if status unknown
        // Pro users always have unlimited analyses
        if (subscriptionStatus.tier === 'pro') return true;
        return subscriptionStatus.remainingAnalyses > 0;
    }, [subscriptionStatus]);

    // Check if user is premium (basic or pro)
    const isPremium = useCallback((): boolean => {
        if (!subscriptionStatus) return false;
        return subscriptionStatus.tier !== 'free';
    }, [subscriptionStatus]);

    // Get current tier from RevenueCat
    const getCurrentTier = useCallback((): SubscriptionTier => {
        if (customerInfo) {
            return getTierFromCustomerInfo(customerInfo);
        }
        return subscriptionStatus?.tier || 'free';
    }, [customerInfo, subscriptionStatus]);

    // Get remaining analyses string for display
    const getRemainingAnalysesText = useCallback((language: 'tr' | 'en' = 'tr'): string => {
        // Default fallback when subscription status not loaded
        if (!subscriptionStatus) {
            return language === 'tr' ? '3/3 analiz kaldı' : '3/3 analyses remaining';
        }

        const { remainingAnalyses, monthlyAnalysisLimit, tier } = subscriptionStatus;

        if (tier === 'pro') {
            return language === 'tr' ? 'Sınırsız analiz' : 'Unlimited analyses';
        }

        return language === 'tr'
            ? `${remainingAnalyses}/${monthlyAnalysisLimit} analiz kaldı`
            : `${remainingAnalyses}/${monthlyAnalysisLimit} analyses remaining`;
    }, [subscriptionStatus]);

    // Get available packages for purchase
    const getPackages = useCallback((): PurchasesPackage[] => {
        if (!offerings) return [];
        return offerings.availablePackages;
    }, [offerings]);

    // Purchase a package
    const purchasePackage = useCallback(async (pkg: PurchasesPackage): Promise<boolean> => {
        setIsPurchasing(true);
        try {
            const { customerInfo: newInfo } = await Purchases.purchasePackage(pkg);
            setCustomerInfo(newInfo);

            // Refetch subscription status from backend
            await refetchStatus();

            console.log('[Subscription] Purchase successful');
            return true;
        } catch (error: any) {
            if (error.userCancelled) {
                console.log('[Subscription] Purchase cancelled by user');
            } else {
                console.error('[Subscription] Purchase failed:', error);
            }
            return false;
        } finally {
            setIsPurchasing(false);
        }
    }, [refetchStatus]);

    // Purchase by product ID (alternative method)
    const purchaseProduct = useCallback(async (productId: string): Promise<boolean> => {
        const packages = getPackages();
        const pkg = packages.find(p => p.product.identifier === productId);

        if (!pkg) {
            console.error('[Subscription] Product not found:', productId);
            return false;
        }

        return purchasePackage(pkg);
    }, [getPackages, purchasePackage]);

    // Restore purchases
    const restorePurchases = useCallback(async (): Promise<boolean> => {
        try {
            const info = await Purchases.restorePurchases();
            setCustomerInfo(info);
            await refetchStatus();

            const tier = getTierFromCustomerInfo(info);
            console.log('[Subscription] Restored tier:', tier);

            return tier !== 'free';
        } catch (error) {
            console.error('[Subscription] Restore failed:', error);
            return false;
        }
    }, [refetchStatus]);

    // Refresh subscription status
    const refreshStatus = useCallback(async () => {
        await refetchStatus();

        try {
            const info = await Purchases.getCustomerInfo();
            setCustomerInfo(info);
        } catch (error) {
            console.error('[Subscription] Failed to refresh customer info:', error);
        }

        // Also invalidate cases query as limits may have changed
        queryClient.invalidateQueries({ queryKey: ['cases'] });
    }, [refetchStatus, queryClient]);

    // Log in user to RevenueCat (call after authentication)
    const loginToRevenueCat = useCallback(async (userId: string): Promise<void> => {
        try {
            const { customerInfo: newInfo } = await Purchases.logIn(userId);
            setCustomerInfo(newInfo);
            await refetchStatus();
            console.log('[RevenueCat] Logged in user:', userId);
        } catch (error) {
            console.error('[RevenueCat] Login failed:', error);
        }
    }, [refetchStatus]);

    // Log out from RevenueCat (call on user logout)
    const logoutFromRevenueCat = useCallback(async (): Promise<void> => {
        try {
            const info = await Purchases.logOut();
            setCustomerInfo(info);
            console.log('[RevenueCat] Logged out');
        } catch (error) {
            console.error('[RevenueCat] Logout failed:', error);
        }
    }, []);

    return {
        // Status
        subscriptionStatus,
        customerInfo,
        isLoading: isLoadingStatus || isLoadingPlans,
        error: statusError,
        isRevenueCatReady,
        isPurchasing,

        // Plans and offerings
        plans: plansData?.plans,
        productIds: plansData?.productIds || PRODUCT_IDS,
        offerings,

        // Helpers
        canAnalyze,
        isPremium,
        getCurrentTier,
        getRemainingAnalysesText,
        getPackages,

        // Actions
        purchasePackage,
        purchaseProduct,
        restorePurchases,
        refreshStatus,
        loginToRevenueCat,
        logoutFromRevenueCat,
    };
}

// Hook to check if paywall should be shown
export function usePaywallTrigger() {
    const { subscriptionStatus, canAnalyze } = useSubscription();

    const shouldShowPaywall = useCallback((): boolean => {
        if (!subscriptionStatus) return false;
        return !canAnalyze();
    }, [subscriptionStatus, canAnalyze]);

    const getPaywallReason = useCallback((language: 'tr' | 'en' = 'tr'): string => {
        if (!subscriptionStatus) return '';

        if (subscriptionStatus.tier === 'free') {
            return language === 'tr'
                ? 'Ücretsiz analiz hakkınız doldu. Premium\'a yükseltin!'
                : 'Your free analyses are used up. Upgrade to Premium!';
        }

        return language === 'tr'
            ? 'Aylık analiz limitinize ulaştınız.'
            : 'You have reached your monthly analysis limit.';
    }, [subscriptionStatus]);

    return {
        shouldShowPaywall,
        getPaywallReason,
    };
}
