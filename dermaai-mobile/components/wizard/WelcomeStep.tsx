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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import {
    Camera,
    User,
    Droplets,
    Sparkles,
} from 'lucide-react-native';
import { Colors, Gradients } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing, Shadows } from '@/constants/Spacing';
import { Duration } from '@/constants/Animations';
import { useColorScheme } from '@/components/useColorScheme';
import { useRouter } from 'expo-router';

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

// Daily tips
const DAILY_TIPS = [
    { icon: Droplets, title: 'Günlük Cilt Bakımı', text: 'Sağlıklı bir cilt için günde en az 2 litre su için.' },
    { icon: Sparkles, title: 'Güneş Koruması', text: 'Her gün SPF 30+ güneş kremi kullanın.' },
    { icon: Droplets, title: 'Nemlendir', text: 'Duş sonrası 3 dakika içinde nemlendirici sürün.' },
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
                <BlurView intensity={60} tint="light" style={styles.scanCardBlur}>
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
    tip: typeof DAILY_TIPS[0];
    colors: typeof Colors.light;
    gradients: typeof Gradients.light | typeof Gradients.dark;
}) => {
    const Icon = tip.icon;

    return (
        <View style={styles.tipCardWrapper}>
            <BlurView intensity={70} tint="light" style={styles.tipCardBlur}>
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

    const [currentTipIndex] = useState(() => Math.floor(Math.random() * DAILY_TIPS.length));

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

    // Demo recent scans if empty
    const displayScans = recentScans.length > 0 ? recentScans : [
        { id: '1', date: 'Eki 15' },
        { id: '2', date: 'Eki 12' },
        { id: '3', date: 'Eki 12' },
    ];

    return (
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={[styles.appName, { color: colors.textSecondary }]}>
                        DermaAssist<Text style={{ color: colors.primary }}>AI</Text>
                    </Text>
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
                                Merhaba,
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

                                <Text style={styles.startButtonText}>Tanı Başlat</Text>
                            </LinearGradient>
                        </BlurView>
                    </TouchableOpacity>
                </Animated.View>

                {/* Recent Scans Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        Son Taramalar
                    </Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.scansScrollContent}
                    >
                        {displayScans.map((scan, index) => (
                            <RecentScanCard
                                key={scan.id}
                                scan={scan}
                                index={index}
                                colors={colors}
                                onPress={() => onScanPress?.(scan.id)}
                            />
                        ))}
                    </ScrollView>
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
        paddingTop: Spacing.lg,
        paddingBottom: Spacing['4xl'],
    },
    header: {
        alignItems: 'center',
        marginBottom: Spacing['2xl'],
    },
    appName: {
        fontSize: 16,
        fontWeight: '500',
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
        fontSize: 28,
        fontWeight: '400',
    },
    greetingName: {
        fontSize: 32,
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
        shadowColor: '#0891B2',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 8,
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
        height: 80,
        paddingHorizontal: 32,
        borderRadius: 36,
        gap: 16,
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
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    startButtonText: {
        color: '#FFFFFF',
        fontSize: 20,
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
        shadowColor: '#0891B2',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 5,
    },
    scanCardBlur: {
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
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
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
        shadowColor: '#0891B2',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
        borderRadius: 20,
        overflow: 'hidden',
    },
    tipCardBlur: {
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
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
        padding: 22,
        gap: Spacing.lg,
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
    },
    tipIconContainer: {
        width: 52,
        height: 52,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0891B2',
        shadowColor: '#0891B2',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
    },
    tipContent: {
        flex: 1,
    },
    tipTitle: {
        fontSize: 17,
        fontWeight: '700',
        marginBottom: 6,
        color: '#0F172A',
    },
    tipText: {
        fontSize: 14,
        fontWeight: '500',
        lineHeight: 20,
        color: '#334155',
    },
});
