/**
 * Welcome Step - Premium Home Screen
 * Clean, minimal design matching the mockup
 */

import React, { useRef, useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Easing,
    ScrollView,
    Image,
    Dimensions,
    Platform,
    StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import {
    Camera,
    User,
    Droplets,
    Sparkles,
    Moon,
    Apple,
    Heart,
    Eye,
    Zap,
    ThermometerSnowflake,
    Hand,
    Sparkle,
} from 'lucide-react-native';
import { Colors, Gradients } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing, Shadows } from '@/constants/Spacing';
import { Duration } from '@/constants/Animations';
import { Translations } from '@/constants/Translations';
import { useColorScheme } from '@/components/useColorScheme';
import { useRouter } from 'expo-router';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSubscription } from '@/hooks/useSubscription';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface WelcomeStepProps {
    onStart: () => void;
    userName?: string;
    recentScans?: Array<{
        id: string;
        imageUrl?: string;
        date: string;
    }>;
    onScanPress?: (caseId: string) => void;
}

// Daily tips - will be localized based on language (9 tips with appropriate icons)
const getDailyTips = (language: 'tr' | 'en') => [
    { icon: Droplets, title: Translations.dailySkinCare[language], text: Translations.dailySkinCareText[language] },
    { icon: Sparkles, title: Translations.sunProtection[language], text: Translations.sunProtectionText[language] },
    { icon: Droplets, title: Translations.moisturize[language], text: Translations.moisturizeText[language] },
    { icon: Moon, title: Translations.sleepWell[language], text: Translations.sleepWellText[language] },
    { icon: Apple, title: Translations.healthyDiet[language], text: Translations.healthyDietText[language] },
    { icon: Heart, title: Translations.stressManagement[language], text: Translations.stressManagementText[language] },
    { icon: Eye, title: Translations.skinCheck[language], text: Translations.skinCheckText[language] },
    { icon: Zap, title: Translations.vitaminC[language], text: Translations.vitaminCText[language] },
    { icon: ThermometerSnowflake, title: Translations.gentleCleanse[language], text: Translations.gentleCleanseText[language] },
    { icon: Hand, title: Translations.avoidTouching[language], text: Translations.avoidTouchingText[language] },
    { icon: Sparkle, title: Translations.nightRoutine[language], text: Translations.nightRoutineText[language] },
];

// Recent scan card with press animation
const RecentScanCard = ({
    scan,
    index,
    colors,
    onPress,
}: {
    scan: { id: string; imageUrl?: string; date: string };
    index: number;
    colors: typeof Colors.light;
    onPress?: () => void;
}) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(20)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: Duration.normal,
                delay: index * 100,
                useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: 0,
                duration: Duration.normal,
                delay: index * 100,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.92,
            useNativeDriver: true,
            friction: 8,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 4,
            tension: 40,
            useNativeDriver: true,
        }).start();
    };

    const handlePress = async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.();
    };

    return (
        <TouchableOpacity
            onPress={handlePress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={1}
        >
            <Animated.View
                style={[
                    styles.scanCardWrapper,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY }, { scale: scaleAnim }],
                    },
                ]}
            >
                <BlurView
                    intensity={Platform.OS === 'ios' ? 60 : 30}
                    tint="light"
                    style={styles.scanCardBlur}
                >
                    <View style={styles.scanCard}>
                        <View style={styles.scanImagePlaceholder}>
                            {scan.imageUrl ? (
                                <Image source={{ uri: scan.imageUrl }} style={styles.scanImage} />
                            ) : (
                                <View style={styles.scanImageEmpty}>
                                    <Camera size={24} color="rgba(255,255,255,0.6)" />
                                </View>
                            )}
                        </View>
                        <Text style={styles.scanDate}>
                            {scan.date}
                        </Text>
                    </View>
                </BlurView>

                {/* Press overlay effect */}
                <Animated.View
                    style={[
                        styles.scanOverlay,
                        {
                            opacity: scaleAnim.interpolate({
                                inputRange: [0.92, 1],
                                outputRange: [0.15, 0],
                            }),
                        },
                    ]}
                />
            </Animated.View>
        </TouchableOpacity>
    );
};

// Tip Card with premium glassmorphism design
const TipCard = ({
    tip,
    colors,
    gradients,
}: {
    tip: { icon: any; title: string; text: string };
    colors: typeof Colors.light;
    gradients: typeof Gradients.light | typeof Gradients.dark;
}) => {
    const Icon = tip.icon;

    return (
        <View style={styles.tipCardWrapper}>
            <BlurView
                intensity={Platform.OS === 'ios' ? 70 : 30}
                tint="light"
                style={styles.tipCardBlur}
            >
                <View style={styles.tipCard}>
                    <View style={styles.tipIconContainer}>
                        <Icon size={24} color="#FFFFFF" strokeWidth={2.5} />
                    </View>
                    <View style={styles.tipContent}>
                        <Text style={styles.tipTitle}>
                            {tip.title}
                        </Text>
                        <Text style={styles.tipText}>
                            {tip.text}
                        </Text>
                    </View>
                </View>
            </BlurView>
        </View>
    );
};

export function WelcomeStep({
    onStart,
    userName = 'Kullanıcı',
    recentScans = [],
    onScanPress,
}: WelcomeStepProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const gradients = Gradients[colorScheme];
    const router = useRouter();

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const greetingAnim = useRef(new Animated.Value(0)).current;
    const buttonScaleAnim = useRef(new Animated.Value(1)).current;

    // New animations for premium button
    const shimmerAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const glowAnim = useRef(new Animated.Value(0.3)).current;
    const iconBounceAnim = useRef(new Animated.Value(0)).current;

    const { language, toggleLanguage } = useLanguage();
    const DAILY_TIPS = getDailyTips(language);
    const { subscriptionStatus, getRemainingAnalysesText, isPremium } = useSubscription();

    const [currentTipIndex] = useState(() => Math.floor(Math.random() * 11));

    useEffect(() => {
        Animated.sequence([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: Duration.normal,
                useNativeDriver: true,
            }),
            Animated.timing(greetingAnim, {
                toValue: 1,
                duration: Duration.slow,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }),
        ]).start();

        // Shimmer animation - slow, subtle horizontal sweep
        Animated.loop(
            Animated.timing(shimmerAnim, {
                toValue: 1,
                duration: 3500,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();

        // Pulse animation - gentle breathing effect
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.02,
                    duration: 1800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Glow animation - subtle pulsing aura
        Animated.loop(
            Animated.sequence([
                Animated.timing(glowAnim, {
                    toValue: 0.5,
                    duration: 2000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(glowAnim, {
                    toValue: 0.3,
                    duration: 2000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Icon bounce animation - DISABLED per user request
        // Animated.loop(...).start();
    }, []);

    // Shimmer translate interpolation
    const shimmerTranslateX = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
    });

    const handlePressIn = () => {
        Animated.spring(buttonScaleAnim, {
            toValue: 0.95,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(buttonScaleAnim, {
            toValue: 1,
            friction: 3,
            tension: 40,
            useNativeDriver: true,
        }).start();
    };

    const handleStart = async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onStart();
    };

    // Check if user has real scans
    const hasRealScans = recentScans.length > 0;

    return (
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header with Language Toggle */}
                <View style={styles.header}>
                    <Text style={[styles.appName, { color: colors.textSecondary }]}>
                        Corio<Text style={{ color: colors.primary }}> Scan</Text>
                    </Text>
                    {/* Language Toggle Button - Glassmorphism Style */}
                    <TouchableOpacity
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            toggleLanguage();
                        }}
                        style={styles.languageToggleWrapper}
                        activeOpacity={0.7}
                    >
                        <BlurView intensity={60} tint="light" style={styles.languageToggleBlur}>
                            <View style={styles.languageToggleInner}>
                                <Text style={styles.languageToggleText}>
                                    {language === 'tr' ? 'EN' : 'TR'}
                                </Text>
                            </View>
                        </BlurView>
                    </TouchableOpacity>
                </View>

                {/* Greeting */}
                <Animated.View
                    style={[
                        styles.greetingContainer,
                        {
                            opacity: greetingAnim,
                            transform: [{
                                translateY: greetingAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [20, 0],
                                }),
                            }],
                        },
                    ]}
                >
                    <View style={styles.greetingRow}>
                        <View style={styles.greetingTextContainer}>
                            <Text style={[styles.greetingHello, { color: colors.text }]}>
                                {Translations.greeting[language]}
                            </Text>
                            <Text style={[styles.greetingName, { color: colors.text }]}>
                                {userName}
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={[styles.avatarContainer, { backgroundColor: '#E3EDF7' }]}
                            activeOpacity={0.7}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                router.push('/profile');
                            }}
                        >
                            <User size={20} color="#7A8B9A" />
                        </TouchableOpacity>
                    </View>
                </Animated.View>

                {/* Subscription Badge - Remaining Analyses (only for non-Pro users) */}
                {!isPremium() && (
                    <View style={styles.subscriptionBadgeContainer}>
                        <BlurView intensity={60} tint="light" style={styles.subscriptionBadgeBlur}>
                            <View style={styles.subscriptionBadgeContent}>
                                <View style={[
                                    styles.tierIndicator,
                                    isPremium() && styles.tierIndicatorPremium
                                ]}>
                                    <Zap size={12} color="#FFFFFF" />
                                </View>
                                <Text style={styles.subscriptionBadgeText}>
                                    {getRemainingAnalysesText(language)}
                                </Text>
                            </View>
                        </BlurView>
                    </View>
                )}

                {/* Start Diagnosis Button - Premium Enhanced */}
                <Animated.View style={[
                    styles.startButtonWrapper,
                    { transform: [{ scale: Animated.multiply(buttonScaleAnim, pulseAnim) }] }
                ]}>
                    <TouchableOpacity
                        onPress={handleStart}
                        onPressIn={handlePressIn}
                        onPressOut={handlePressOut}
                        activeOpacity={1}
                        style={styles.startButtonContainer}
                        accessibilityLabel="Yeni cilt analizi başlat"
                        accessibilityRole="button"
                        accessibilityHint="Yapay zeka destekli cilt taraması başlatır"
                    >
                        <BlurView intensity={80} tint="light" style={styles.blurContainer}>
                            {/* Inner Glass Highlight */}
                            <View style={styles.glassHighlight} />

                            <LinearGradient
                                colors={[
                                    'rgba(255, 255, 255, 0.25)',
                                    'rgba(93, 213, 200, 0.6)',
                                    'rgba(59, 178, 169, 0.7)',
                                ]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 0.5, y: 1 }}
                                style={styles.startButton}
                            >
                                {/* Glass Frost Overlay */}
                                <View style={styles.frostOverlay} />

                                {/* Shimmer Effect Overlay - Soft Light */}
                                <Animated.View
                                    style={[
                                        styles.shimmerOverlay,
                                        { transform: [{ translateX: shimmerTranslateX }] }
                                    ]}
                                    pointerEvents="none"
                                >
                                    <LinearGradient
                                        colors={[
                                            'transparent',
                                            'rgba(255, 255, 255, 0.15)',
                                            'rgba(200, 240, 235, 0.25)',
                                            'rgba(255, 255, 255, 0.15)',
                                            'transparent'
                                        ]}
                                        locations={[0, 0.3, 0.5, 0.7, 1]}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={styles.shimmerGradient}
                                    />
                                </Animated.View>

                                {/* Icon */}
                                <View style={styles.iconCircle}>
                                    <Camera size={28} color="#FFFFFF" strokeWidth={2.5} />
                                </View>

                                <Text style={styles.startButtonText}>{Translations.startDiagnosis[language]}</Text>
                            </LinearGradient>
                        </BlurView>
                    </TouchableOpacity>
                </Animated.View>

                {/* Recent Scans Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        {Translations.recentScans[language]}
                    </Text>
                    {hasRealScans ? (
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.scansScrollContent}
                        >
                            {recentScans.map((scan, index) => (
                                <RecentScanCard
                                    key={scan.id}
                                    scan={scan}
                                    index={index}
                                    colors={colors}
                                    onPress={() => onScanPress?.(scan.id)}
                                />
                            ))}
                        </ScrollView>
                    ) : (
                        <View style={styles.emptyStateWrapper}>
                            <BlurView intensity={60} tint="light" style={styles.emptyStateBlur}>
                                <View style={styles.emptyStateCard}>
                                    <View style={styles.emptyStateIconContainer}>
                                        <Camera size={32} color="#0891B2" strokeWidth={2} />
                                    </View>
                                    <Text style={styles.emptyStateTitle}>
                                        {Translations.noScansYet[language]}
                                    </Text>
                                    <Text style={styles.emptyStateSubtitle}>
                                        {Translations.startFirstScan[language]}
                                    </Text>
                                </View>
                            </BlurView>
                        </View>
                    )}
                </View>

                {/* Daily Skin Tip */}
                <View style={styles.section}>
                    <TipCard
                        tip={DAILY_TIPS[currentTipIndex]}
                        colors={colors}
                        gradients={gradients}
                    />
                </View>
            </ScrollView>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    gradientBackground: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: Spacing.xl,
        paddingTop: Platform.select({
            android: (StatusBar.currentHeight || 24) + Spacing['2xl'],
            ios: Spacing.lg,
        }),
        paddingBottom: Spacing['4xl'],
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing['2xl'],
        position: 'relative',
    },
    appName: {
        fontSize: 16,
        fontWeight: '500',
        letterSpacing: 0.5,
    },
    languageToggleWrapper: {
        position: 'absolute',
        right: 0,
        borderRadius: 12,
        overflow: 'hidden',
    },
    languageToggleBlur: {
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    languageToggleInner: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        backgroundColor: Platform.select({
            android: 'rgba(255, 255, 255, 0.05)',
            ios: 'rgba(255, 255, 255, 0.2)',
        }),
    },
    languageToggleText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#0891B2',
        letterSpacing: 0.5,
    },
    greetingContainer: {
        marginBottom: Spacing.xl,
    },
    greetingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    greetingTextContainer: {
        flex: 1,
    },
    greetingHello: {
        fontSize: Platform.select({ android: 30, ios: 28 }),
        fontWeight: '400',
    },
    greetingName: {
        fontSize: Platform.select({ android: 36, ios: 32 }),
        fontWeight: '700',
        marginTop: -4,
    },
    avatarContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    startButtonWrapper: {
        alignItems: 'center',
        width: '100%',
        paddingHorizontal: 0,
    },
    startButtonContainer: {
        width: '100%',
        borderRadius: 36,
        overflow: 'hidden',
    },
    blurContainer: {
        borderRadius: 36,
        overflow: 'hidden',
    },
    glassHighlight: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderTopLeftRadius: 36,
        borderTopRightRadius: 36,
    },
    frostOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 36,
    },
    startButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: Platform.select({ android: 88, ios: 80 }),
        paddingHorizontal: Platform.select({ android: 36, ios: 32 }),
        borderRadius: Platform.select({ android: 40, ios: 36 }),
        gap: Platform.select({ android: 18, ios: 16 }),
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        overflow: 'hidden',
    },
    shimmerOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: 160,
    },
    shimmerGradient: {
        flex: 1,
        width: 160,
    },
    iconCircle: {
        width: Platform.select({ android: 48, ios: 44 }),
        height: Platform.select({ android: 48, ios: 44 }),
        borderRadius: Platform.select({ android: 24, ios: 22 }),
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    startButtonText: {
        color: '#FFFFFF',
        fontSize: Platform.select({ android: 22, ios: 20 }),
        fontWeight: '700',
        letterSpacing: 0.5,
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    section: {
        marginTop: Spacing['2xl'],
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: Spacing.md,
    },
    scansScrollContent: {
        gap: 14,
        paddingRight: Spacing.xl,
    },
    scanCardWrapper: {
        width: (SCREEN_WIDTH - 80) / 3,
        borderRadius: 16,
        overflow: 'hidden',
    },
    scanCardBlur: {
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        backgroundColor: Platform.select({
            android: 'rgba(255, 255, 255, 0.2)',
            ios: 'transparent',
        }),
    },
    scanCardHighlight: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        zIndex: 1,
    },
    scanCard: {
        backgroundColor: Platform.select({
            android: 'transparent',
            ios: 'rgba(255, 255, 255, 0.1)',
        }),
    },
    scanImagePlaceholder: {
        aspectRatio: 1,
        borderTopLeftRadius: 15,
        borderTopRightRadius: 15,
        overflow: 'hidden',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    scanImage: {
        width: '100%',
        height: '100%',
    },
    scanImageEmpty: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    scanOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderRadius: 16,
    },
    scanDate: {
        ...Typography.styles.caption,
        textAlign: 'center',
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.xs,
        fontSize: 12,
        fontWeight: '600',
        color: '#1A5F5A',
    },
    tipCardWrapper: {
        borderRadius: 20,
        overflow: 'hidden',
    },
    tipCardBlur: {
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        backgroundColor: Platform.select({
            android: 'rgba(255, 255, 255, 0.2)',
            ios: 'transparent',
        }),
    },
    tipCardHighlight: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 35,
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        zIndex: 1,
    },
    tipCard: {
        flexDirection: 'row',
        padding: Platform.select({ android: 26, ios: 22 }),
        gap: Spacing.lg,
        alignItems: 'center',
        backgroundColor: Platform.select({
            android: 'transparent',
            ios: 'rgba(255, 255, 255, 0.15)',
        }),
    },
    tipIconContainer: {
        width: Platform.select({ android: 58, ios: 52 }),
        height: Platform.select({ android: 58, ios: 52 }),
        borderRadius: Platform.select({ android: 18, ios: 16 }),
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0891B2',
    },
    tipContent: {
        flex: 1,
    },
    tipTitle: {
        fontSize: Platform.select({ android: 18, ios: 17 }),
        fontWeight: '700',
        marginBottom: 6,
        color: '#0F172A',
    },
    tipText: {
        fontSize: Platform.select({ android: 15, ios: 14 }),
        fontWeight: '500',
        lineHeight: Platform.select({ android: 22, ios: 20 }),
        color: '#334155',
    },
    // Empty State Styles
    emptyStateWrapper: {
        borderRadius: 20,
        overflow: 'hidden',
    },
    emptyStateBlur: {
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    emptyStateCard: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing['2xl'],
        paddingHorizontal: Spacing.xl,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
    },
    emptyStateIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(8, 145, 178, 0.12)',
        marginBottom: Spacing.md,
    },
    emptyStateTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#1A5F5A',
        marginBottom: 4,
    },
    emptyStateSubtitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#64748B',
    },
    // Subscription Badge Styles
    subscriptionBadgeContainer: {
        marginBottom: Spacing.lg,
        borderRadius: 14,
        overflow: 'hidden',
        alignSelf: 'flex-start',
    },
    subscriptionBadgeBlur: {
        borderRadius: 14,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    subscriptionBadgeContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        gap: 8,
        backgroundColor: Platform.select({
            android: 'rgba(255, 255, 255, 0.2)',
            ios: 'rgba(255, 255, 255, 0.15)',
        }),
    },
    tierIndicator: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: '#3B82F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    tierIndicatorPremium: {
        backgroundColor: '#F59E0B',
    },
    subscriptionBadgeText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1e293b',
    },
});
