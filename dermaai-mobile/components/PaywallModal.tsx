/**
 * PaywallModal Component
 * Premium subscription upgrade screen with modern glassmorphism design
 * Shows when user reaches their analysis limit
 */

import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    Modal,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Platform,
    Dimensions,
    ActivityIndicator,
    Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import {
    Crown,
    Check,
    X,
    Sparkles,
    Zap,
    Shield,
    Clock,
    ChevronRight,
    RefreshCw,
    Infinity,
    FileText,
    Bell,
    Users,
    Gauge,
    Brain,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';
import { useSubscription, SubscriptionTier } from '@/hooks/useSubscription';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type Language = 'tr' | 'en';

interface PaywallModalProps {
    visible: boolean;
    onClose: () => void;
    language: Language;
}

// Translations
const T = {
    title: {
        tr: 'Premium\'a Yükselt',
        en: 'Upgrade to Premium',
    },
    subtitle: {
        tr: 'Sınırsız cilt analizi ve gelişmiş özellikler',
        en: 'Unlimited skin analysis and advanced features',
    },
    limitReached: {
        tr: 'Ücretsiz analiz hakkınız doldu',
        en: 'Your free analyses are used up',
    },
    unlockAll: {
        tr: 'Tüm özelliklerin kilidini açın',
        en: 'Unlock all features',
    },
    // Plans
    basicPlan: {
        tr: 'Basic',
        en: 'Basic',
    },
    proPlan: {
        tr: 'Pro',
        en: 'Pro',
    },
    mostPopular: {
        tr: 'En Popüler',
        en: 'Most Popular',
    },
    bestValue: {
        tr: 'En İyi Değer',
        en: 'Best Value',
    },
    // Features
    monthlyAnalyses: {
        tr: 'Aylık Analiz',
        en: 'Monthly Analyses',
    },
    historyDays: {
        tr: 'Geçmiş Kayıtları',
        en: 'History Records',
    },
    dualAI: {
        tr: 'Gelişmiş AI Analizi',
        en: 'Advanced AI Analysis',
    },
    pdfReports: {
        tr: 'PDF Raporları',
        en: 'PDF Reports',
    },
    pushNotifications: {
        tr: 'Bildirimler',
        en: 'Notifications',
    },
    priorityAnalysis: {
        tr: 'Öncelikli Analiz',
        en: 'Priority Analysis',
    },
    patientManagement: {
        tr: 'Hasta Yönetimi',
        en: 'Patient Management',
    },
    unlimited: {
        tr: 'Sınırsız',
        en: 'Unlimited',
    },
    days: {
        tr: 'gün',
        en: 'days',
    },
    // Pricing
    perMonth: {
        tr: '/ay',
        en: '/month',
    },
    perYear: {
        tr: '/yıl',
        en: '/year',
    },
    save: {
        tr: 'Tasarruf',
        en: 'Save',
    },
    freeMonths: {
        tr: '4 ay bedava',
        en: '4 months free',
    },
    // Actions
    subscribe: {
        tr: 'Abone Ol',
        en: 'Subscribe',
    },
    startTrial: {
        tr: 'Hemen Başla',
        en: 'Start Now',
    },
    restore: {
        tr: 'Satın Alımları Geri Yükle',
        en: 'Restore Purchases',
    },
    continueWithFree: {
        tr: 'Ücretsiz ile devam et',
        en: 'Continue with Free',
    },
    // Terms
    termsNote: {
        tr: 'Abonelik otomatik olarak yenilenir. İstediğiniz zaman iptal edebilirsiniz.',
        en: 'Subscription renews automatically. Cancel anytime.',
    },
};

// Plan configurations
const PLANS = {
    basic: {
        monthlyAnalyses: 30,
        historyDays: 90,
        dualAI: true,
        pdfReports: true,
        pushNotifications: true,
        priorityAnalysis: false,
        patientManagement: false,
        monthlyPrice: { tr: '₺79.99', usd: '$4.99' },
        yearlyPrice: { tr: '₺599.99', usd: '$39.99' },
        yearlySavings: '33%',
    },
    pro: {
        monthlyAnalyses: Infinity,
        historyDays: Infinity,
        dualAI: true,
        pdfReports: true,
        pushNotifications: true,
        priorityAnalysis: true,
        patientManagement: true,
        monthlyPrice: { tr: '₺149.99', usd: '$8.99' },
        yearlyPrice: { tr: '₺1,199.99', usd: '$74.99' },
        yearlySavings: '33%',
    },
};

// Feature icons mapping
const FEATURE_ICONS: Record<string, React.ComponentType<any>> = {
    monthlyAnalyses: Gauge,
    historyDays: Clock,
    dualAI: Brain,
    pdfReports: FileText,
    pushNotifications: Bell,
    priorityAnalysis: Zap,
    patientManagement: Users,
};

type BillingPeriod = 'monthly' | 'yearly';
type PlanType = 'basic' | 'pro';

export function PaywallModal({ visible, onClose, language }: PaywallModalProps) {
    const [selectedPlan, setSelectedPlan] = useState<PlanType>('pro');
    const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('yearly');
    const [isRestoring, setIsRestoring] = useState(false);

    // Animation values
    const basicCardScale = useRef(new Animated.Value(1)).current;
    const proCardScale = useRef(new Animated.Value(1)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;
    const shimmerAnim = useRef(new Animated.Value(0)).current;
    const crownScale = useRef(new Animated.Value(1)).current;
    const buttonScale = useRef(new Animated.Value(1)).current;

    const {
        purchaseProduct,
        restorePurchases,
        isPurchasing,
        subscriptionStatus,
    } = useSubscription();

    // Glow animation for crown
    useEffect(() => {
        if (visible) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(glowAnim, {
                        toValue: 1,
                        duration: 1500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(glowAnim, {
                        toValue: 0,
                        duration: 1500,
                        useNativeDriver: true,
                    }),
                ])
            ).start();

            // Shimmer animation
            Animated.loop(
                Animated.timing(shimmerAnim, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                })
            ).start();
        }
    }, [visible]);

    const handlePurchase = async () => {
        const productId = selectedPlan === 'basic'
            ? (billingPeriod === 'monthly' ? 'corio_basic_monthly' : 'corio_basic_yearly')
            : (billingPeriod === 'monthly' ? 'corio_pro_monthly' : 'corio_pro_yearly');

        const success = await purchaseProduct(productId);
        if (success) {
            onClose();
        }
    };

    const handleRestore = async () => {
        setIsRestoring(true);
        const restored = await restorePurchases();
        setIsRestoring(false);
        if (restored) {
            onClose();
        }
    };

    const getPrice = (plan: PlanType): string => {
        const prices = PLANS[plan];
        const priceKey = billingPeriod === 'monthly' ? 'monthlyPrice' : 'yearlyPrice';
        return language === 'tr' ? prices[priceKey].tr : prices[priceKey].usd;
    };

    const handlePlanPress = (plan: PlanType) => {
        const targetScale = plan === 'basic' ? basicCardScale : proCardScale;
        Animated.sequence([
            Animated.timing(targetScale, {
                toValue: 0.95,
                duration: 80,
                useNativeDriver: true,
            }),
            Animated.spring(targetScale, {
                toValue: 1,
                friction: 4,
                tension: 100,
                useNativeDriver: true,
            }),
        ]).start();
        setSelectedPlan(plan);
    };

    const handleButtonPressIn = () => {
        Animated.spring(buttonScale, {
            toValue: 0.97,
            friction: 5,
            tension: 100,
            useNativeDriver: true,
        }).start();
    };

    const handleButtonPressOut = () => {
        Animated.spring(buttonScale, {
            toValue: 1,
            friction: 4,
            tension: 100,
            useNativeDriver: true,
        }).start();
    };

    const renderFeatureRow = (
        featureKey: string,
        label: string,
        basicValue: string | boolean,
        proValue: string | boolean
    ) => {
        const IconComponent = FEATURE_ICONS[featureKey] || Shield;

        return (
            <View style={styles.featureRow} key={featureKey}>
                <View style={styles.featureLabelContainer}>
                    <View style={styles.featureIconContainer}>
                        <IconComponent size={14} color="#6B7280" />
                    </View>
                    <Text style={styles.featureLabel}>{label}</Text>
                </View>
                <View style={styles.featureValues}>
                    <View style={styles.featureValue}>
                        {typeof basicValue === 'boolean' ? (
                            basicValue ? (
                                <View style={styles.checkIconContainer}>
                                    <Check size={14} color="#10B981" strokeWidth={3} />
                                </View>
                            ) : (
                                <X size={14} color="#D1D5DB" />
                            )
                        ) : (
                            <Text style={styles.featureValueText}>{basicValue}</Text>
                        )}
                    </View>
                    <View style={styles.featureValue}>
                        {typeof proValue === 'boolean' ? (
                            proValue ? (
                                <View style={[styles.checkIconContainer, styles.proCheckIcon]}>
                                    <Check size={14} color="#F59E0B" strokeWidth={3} />
                                </View>
                            ) : (
                                <X size={14} color="#D1D5DB" />
                            )
                        ) : (
                            <Text style={[styles.featureValueText, styles.proValueText]}>{proValue}</Text>
                        )}
                    </View>
                </View>
            </View>
        );
    };

    const glowOpacity = glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.4, 1],
    });

    const glowScale = glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.15],
    });

    const content = (
        <ScrollView
            style={styles.modalScrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={true}
        >
            {/* Close Button */}
            <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                <View style={styles.closeButtonInner}>
                    <X size={20} color="#6B7280" />
                </View>
            </TouchableOpacity>

            {/* Premium Header with Glow Effect */}
            <View style={styles.header}>
                {/* Glow Effect Behind Crown */}
                <Animated.View style={[
                    styles.crownGlow,
                    { opacity: glowOpacity, transform: [{ scale: glowScale }] }
                ]}>
                    <LinearGradient
                        colors={['rgba(245, 158, 11, 0.6)', 'rgba(234, 179, 8, 0.4)', 'transparent']}
                        style={styles.crownGlowGradient}
                    />
                </Animated.View>

                <LinearGradient
                    colors={['#F59E0B', '#EAB308', '#FCD34D']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.crownBadge}
                >
                    <Crown size={32} color="#FFFFFF" fill="#FFFFFF" />
                </LinearGradient>

                <Text style={styles.title}>{T.title[language]}</Text>
                <Text style={styles.subtitle}>{T.subtitle[language]}</Text>
            </View>

            {/* Billing Period Toggle */}
            <View style={styles.billingToggleContainer}>
                <View style={styles.billingToggle}>
                    <TouchableOpacity
                        style={[
                            styles.billingOption,
                            billingPeriod === 'monthly' && styles.billingOptionActive,
                        ]}
                        onPress={() => setBillingPeriod('monthly')}
                    >
                        <Text style={[
                            styles.billingOptionText,
                            billingPeriod === 'monthly' && styles.billingOptionTextActive,
                        ]}>
                            {language === 'tr' ? 'Aylık' : 'Monthly'}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.billingOption,
                            billingPeriod === 'yearly' && styles.billingOptionActive,
                        ]}
                        onPress={() => setBillingPeriod('yearly')}
                    >
                        <Text style={[
                            styles.billingOptionText,
                            billingPeriod === 'yearly' && styles.billingOptionTextActive,
                        ]}>
                            {language === 'tr' ? 'Yıllık' : 'Yearly'}
                        </Text>
                        <View style={styles.saveBadge}>
                            <Sparkles size={10} color="#FFFFFF" />
                            <Text style={styles.saveBadgeText}>-33%</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Plan Selection Cards */}
            <View style={styles.plansContainer}>
                {/* Basic Plan */}
                <Animated.View style={[
                    styles.planCardWrapper,
                    { transform: [{ scale: basicCardScale }] }
                ]}>
                    <TouchableOpacity
                        style={[
                            styles.planCard,
                            selectedPlan === 'basic' && styles.planCardSelected,
                        ]}
                        onPress={() => handlePlanPress('basic')}
                        activeOpacity={0.9}
                    >
                        <View style={styles.planCardInner}>
                            <View style={styles.planHeader}>
                                <View style={styles.planIconContainer}>
                                    <Zap size={18} color="#3B82F6" />
                                </View>
                                <Text style={styles.planName}>{T.basicPlan[language]}</Text>
                            </View>
                            <Text style={styles.planPrice}>{getPrice('basic')}</Text>
                            <Text style={styles.planPeriod}>
                                {billingPeriod === 'monthly' ? T.perMonth[language] : T.perYear[language]}
                            </Text>
                            {selectedPlan === 'basic' && (
                                <View style={styles.selectedIndicator}>
                                    <Check size={14} color="#FFFFFF" strokeWidth={3} />
                                </View>
                            )}
                        </View>
                    </TouchableOpacity>
                </Animated.View>

                {/* Pro Plan */}
                <Animated.View style={[
                    styles.planCardWrapper,
                    { transform: [{ scale: proCardScale }] }
                ]}>
                    <TouchableOpacity
                        style={[
                            styles.planCard,
                            styles.proPlanCard,
                            selectedPlan === 'pro' && styles.proPlanCardSelected,
                        ]}
                        onPress={() => handlePlanPress('pro')}
                        activeOpacity={0.9}
                    >
                        {/* Popular Badge */}
                        <LinearGradient
                            colors={['#F59E0B', '#EAB308']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.popularBadge}
                        >
                            <Sparkles size={10} color="#FFFFFF" />
                            <Text style={styles.popularBadgeText}>{T.mostPopular[language]}</Text>
                        </LinearGradient>

                        <View style={[styles.planCardInner, styles.proPlanCardInner]}>
                            <View style={styles.planHeader}>
                                <View style={[styles.planIconContainer, styles.proIconContainer]}>
                                    <Crown size={18} color="#F59E0B" />
                                </View>
                                <Text style={[styles.planName, styles.proPlanName]}>{T.proPlan[language]}</Text>
                            </View>
                            <Text style={[styles.planPrice, styles.proPlanPrice]}>{getPrice('pro')}</Text>
                            <Text style={styles.planPeriod}>
                                {billingPeriod === 'monthly' ? T.perMonth[language] : T.perYear[language]}
                            </Text>
                            {billingPeriod === 'yearly' && (
                                <View style={styles.freeMonthsBadge}>
                                    <Text style={styles.freeMonthsText}>{T.freeMonths[language]}</Text>
                                </View>
                            )}
                            {selectedPlan === 'pro' && (
                                <LinearGradient
                                    colors={['#F59E0B', '#EAB308']}
                                    style={styles.selectedIndicatorPro}
                                >
                                    <Check size={14} color="#FFFFFF" strokeWidth={3} />
                                </LinearGradient>
                            )}
                        </View>
                    </TouchableOpacity>
                </Animated.View>
            </View>

            {/* Feature Comparison */}
            <View style={styles.featuresWrapper}>
                <ScrollView
                    style={styles.featuresScroll}
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                >
                    <View style={styles.featuresContainer}>
                        <View style={styles.featuresHeader}>
                            <Text style={styles.featuresTitle}>
                                {language === 'tr' ? 'Özellikler' : 'Features'}
                            </Text>
                            <View style={styles.featureHeaderLabels}>
                                <Text style={styles.featuresHeaderPlan}>Basic</Text>
                                <Text style={[styles.featuresHeaderPlan, styles.proHeaderPlan]}>Pro</Text>
                            </View>
                        </View>

                        {renderFeatureRow(
                            'monthlyAnalyses',
                            T.monthlyAnalyses[language],
                            '30',
                            '∞'
                        )}
                        {renderFeatureRow(
                            'historyDays',
                            T.historyDays[language],
                            `90 ${T.days[language]}`,
                            '∞'
                        )}
                        {renderFeatureRow('dualAI', T.dualAI[language], true, true)}
                        {renderFeatureRow('pdfReports', T.pdfReports[language], true, true)}
                        {renderFeatureRow('pushNotifications', T.pushNotifications[language], true, true)}
                        {renderFeatureRow('priorityAnalysis', T.priorityAnalysis[language], false, true)}
                        {renderFeatureRow('patientManagement', T.patientManagement[language], false, true)}
                    </View>
                </ScrollView>
            </View>

            {/* Footer Actions */}
            <View style={styles.footer}>
                {/* Subscribe Button with Scale Animation */}
                <Animated.View style={[
                    styles.subscribeButtonWrapper,
                    { transform: [{ scale: buttonScale }] }
                ]}>
                    <TouchableOpacity
                        style={styles.subscribeButton}
                        onPress={handlePurchase}
                        onPressIn={handleButtonPressIn}
                        onPressOut={handleButtonPressOut}
                        disabled={isPurchasing}
                        activeOpacity={1}
                    >
                        <LinearGradient
                            colors={selectedPlan === 'pro'
                                ? ['#F59E0B', '#EAB308', '#F59E0B']
                                : ['#3B82F6', '#2563EB', '#3B82F6']
                            }
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.subscribeButtonGradient}
                        >
                            {isPurchasing ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <>
                                    <Text style={styles.subscribeButtonText}>
                                        {T.startTrial[language]}
                                    </Text>
                                    <View style={styles.subscribePrice}>
                                        <Text style={styles.subscribePriceText}>
                                            {getPrice(selectedPlan)}
                                            {billingPeriod === 'monthly' ? T.perMonth[language] : T.perYear[language]}
                                        </Text>
                                    </View>
                                    <ChevronRight size={20} color="#FFFFFF" />
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>

                {/* Restore Purchases */}
                <TouchableOpacity
                    style={styles.restoreButton}
                    onPress={handleRestore}
                    disabled={isRestoring}
                >
                    {isRestoring ? (
                        <ActivityIndicator size="small" color="#6B7280" />
                    ) : (
                        <>
                            <RefreshCw size={14} color="#6B7280" />
                            <Text style={styles.restoreButtonText}>{T.restore[language]}</Text>
                        </>
                    )}
                </TouchableOpacity>

                {/* Terms Note */}
                <Text style={styles.termsNote}>{T.termsNote[language]}</Text>
            </View>
        </ScrollView>
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                {Platform.OS === 'ios' ? (
                    <BlurView intensity={80} tint="light" style={styles.modalContainer}>
                        <View style={styles.modalContainerInner}>
                            {content}
                        </View>
                    </BlurView>
                ) : (
                    <View style={[styles.modalContainer, styles.modalContainerAndroid]}>
                        {content}
                    </View>
                )}
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        width: '100%',
        maxHeight: SCREEN_HEIGHT * 0.92,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        overflow: 'hidden',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -10 },
                shadowOpacity: 0.25,
                shadowRadius: 25,
            },
            android: {
                elevation: 24,
            },
        }),
    },
    modalContainerAndroid: {
        backgroundColor: 'rgba(255,255,255,0.98)',
    },
    modalContainerInner: {
        backgroundColor: 'rgba(255,255,255,0.85)',
    },
    modalScrollView: {
    },
    scrollContent: {
        paddingBottom: 34,
        flexGrow: 1,
    },
    modalInner: {
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 10,
    },
    closeButtonInner: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0,0,0,0.06)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        alignItems: 'center',
        paddingTop: 32,
        paddingHorizontal: 24,
        paddingBottom: 16,
    },
    crownGlow: {
        position: 'absolute',
        top: 10,
        width: 120,
        height: 120,
    },
    crownGlowGradient: {
        width: 120,
        height: 120,
        borderRadius: 60,
    },
    crownBadge: {
        width: 72,
        height: 72,
        borderRadius: 36,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        ...Platform.select({
            ios: {
                shadowColor: '#F59E0B',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.4,
                shadowRadius: 16,
            },
            android: {
                elevation: 12,
            },
        }),
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1F2937',
        marginBottom: 6,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 15,
        color: '#6B7280',
        textAlign: 'center',
        fontWeight: '500',
    },
    billingToggleContainer: {
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    billingToggle: {
        flexDirection: 'row',
        backgroundColor: 'rgba(0,0,0,0.04)',
        borderRadius: 16,
        padding: 4,
    },
    billingOption: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        gap: 6,
    },
    billingOptionActive: {
        backgroundColor: '#FFFFFF',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 8,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    billingOptionText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#9CA3AF',
    },
    billingOptionTextActive: {
        color: '#1F2937',
        fontWeight: '700',
    },
    saveBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#10B981',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        gap: 3,
    },
    saveBadgeText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '700',
    },
    plansContainer: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    planCardWrapper: {
        flex: 1,
    },
    planCard: {
        flex: 1,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: 'rgba(0,0,0,0.08)',
        overflow: 'hidden',
        backgroundColor: '#FFFFFF',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.12,
                shadowRadius: 12,
            },
            android: {
                elevation: 6,
            },
        }),
    },
    planCardSelected: {
        borderColor: '#3B82F6',
        backgroundColor: '#EFF6FF',
        ...Platform.select({
            ios: {
                shadowColor: '#3B82F6',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.25,
                shadowRadius: 16,
            },
            android: {
                elevation: 8,
            },
        }),
    },
    proPlanCard: {
        borderColor: 'rgba(245,158,11,0.4)',
        backgroundColor: '#FFFBEB',
        ...Platform.select({
            ios: {
                shadowColor: '#F59E0B',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
            },
            android: {
                elevation: 6,
            },
        }),
    },
    proPlanCardSelected: {
        borderColor: '#F59E0B',
        borderWidth: 2.5,
        ...Platform.select({
            ios: {
                shadowColor: '#F59E0B',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.35,
                shadowRadius: 20,
            },
            android: {
                elevation: 10,
            },
        }),
    },
    planCardInner: {
        padding: 16,
    },
    proPlanCardInner: {
        paddingTop: 20,
    },
    popularBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingVertical: 6,
    },
    popularBadgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    planHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10,
    },
    planIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: 'rgba(59,130,246,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    proIconContainer: {
        backgroundColor: 'rgba(245,158,11,0.15)',
    },
    planName: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1F2937',
    },
    proPlanName: {
        color: '#D97706',
    },
    planPrice: {
        fontSize: 26,
        fontWeight: '800',
        color: '#1F2937',
        letterSpacing: -0.5,
    },
    proPlanPrice: {
        color: '#D97706',
    },
    planPeriod: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '500',
    },
    freeMonthsBadge: {
        marginTop: 8,
        backgroundColor: 'rgba(245,158,11,0.15)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    freeMonthsText: {
        color: '#D97706',
        fontSize: 11,
        fontWeight: '600',
    },
    selectedIndicator: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#3B82F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectedIndicatorPro: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    featuresWrapper: {
        marginHorizontal: 20,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.06)',
        marginBottom: 16,
        overflow: 'hidden',
    },
    featuresScroll: {
        maxHeight: 200,
    },
    featuresContainer: {
        padding: 16,
    },
    featuresHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.06)',
        marginBottom: 8,
    },
    featuresTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#374151',
    },
    featureHeaderLabels: {
        flexDirection: 'row',
    },
    featuresHeaderPlan: {
        width: 50,
        textAlign: 'center',
        fontSize: 12,
        fontWeight: '700',
        color: '#6B7280',
    },
    proHeaderPlan: {
        color: '#D97706',
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.03)',
    },
    featureLabelContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    featureIconContainer: {
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: 'rgba(0,0,0,0.04)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    featureLabel: {
        flex: 1,
        fontSize: 13,
        color: '#374151',
        fontWeight: '500',
    },
    featureValues: {
        flexDirection: 'row',
    },
    featureValue: {
        width: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    featureValueText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#374151',
    },
    proValueText: {
        color: '#D97706',
    },
    checkIconContainer: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: 'rgba(16,185,129,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    proCheckIcon: {
        backgroundColor: 'rgba(245,158,11,0.15)',
    },
    footer: {
        paddingHorizontal: 20,
        gap: 12,
    },
    subscribeButtonWrapper: {
        borderRadius: 16,
        ...Platform.select({
            ios: {
                shadowColor: '#F59E0B',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.45,
                shadowRadius: 16,
            },
            android: {
                elevation: 12,
            },
        }),
    },
    subscribeButton: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    subscribeButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        gap: 8,
    },
    subscribeButtonText: {
        fontSize: 17,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    subscribePrice: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    subscribePriceText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    restoreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        gap: 6,
    },
    restoreButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6B7280',
    },
    termsNote: {
        fontSize: 11,
        color: '#9CA3AF',
        textAlign: 'center',
        fontWeight: '400',
    },
});
