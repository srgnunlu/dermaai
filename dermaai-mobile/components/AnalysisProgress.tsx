/**
 * Analysis Progress Component - Premium Design with Lesion Detection Animation
 * Shows animated progress during AI analysis with user's image and lesion scanning effects
 */

import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Easing,
    Dimensions,
    Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Brain, Sparkles, Search, FileCheck, CheckCircle, Target, Crosshair } from 'lucide-react-native';
import { Colors, Gradients } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { Translations } from '@/constants/Translations';
import { useColorScheme } from '@/components/useColorScheme';
import { useLanguage } from '@/contexts/LanguageContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface AnalysisProgressProps {
    isActive: boolean;
    onComplete?: () => void;
    duration?: number;
    imageUri?: string;
}

const getAnalysisStages = (language: 'tr' | 'en') => [
    { id: 1, label: Translations.imageProcessing[language], Icon: Search },
    { id: 2, label: Translations.detectingLesions[language], Icon: Target },
    { id: 3, label: Translations.aiModelsAnalyzing[language], Icon: Brain },
    { id: 4, label: Translations.detailedAnalysis[language], Icon: Sparkles },
    { id: 5, label: Translations.combiningResults[language], Icon: FileCheck },
    { id: 6, label: Translations.completed[language], Icon: CheckCircle },
];

// Simulated lesion detection points (random positions within the image)
const DETECTION_POINTS = [
    { x: 0.35, y: 0.25, delay: 2000 },
    { x: 0.65, y: 0.40, delay: 4000 },
    { x: 0.45, y: 0.60, delay: 6000 },
    { x: 0.55, y: 0.35, delay: 8000 },
    { x: 0.40, y: 0.50, delay: 10000 },
];

// Detection focus component - shows targeting animation at a point
const DetectionFocus = ({
    x,
    y,
    delay,
    imageSize,
    isActive
}: {
    x: number;
    y: number;
    delay: number;
    imageSize: number;
    isActive: boolean;
}) => {
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (!isActive) return;

        const timer = setTimeout(() => {
            setIsVisible(true);

            // Appear animation
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 5,
                    tension: 40,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();

            // Pulse animation
            const pulse = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.3,
                        duration: 600,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 600,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ])
            );
            pulse.start();
        }, delay);

        return () => clearTimeout(timer);
    }, [isActive, delay]);

    if (!isVisible) return null;

    const posX = x * imageSize - 20;
    const posY = y * imageSize - 20;

    return (
        <Animated.View
            style={[
                styles.detectionFocus,
                {
                    left: posX,
                    top: posY,
                    opacity: opacityAnim,
                    transform: [{ scale: scaleAnim }],
                },
            ]}
        >
            {/* Outer ring - pulsing */}
            <Animated.View
                style={[
                    styles.detectionRingOuter,
                    { transform: [{ scale: pulseAnim }] },
                ]}
            />
            {/* Inner ring */}
            <View style={styles.detectionRingInner} />
            {/* Center dot */}
            <View style={styles.detectionDot} />
            {/* Crosshair lines */}
            <View style={[styles.crosshairLine, styles.crosshairHorizontal]} />
            <View style={[styles.crosshairLine, styles.crosshairVertical]} />
        </Animated.View>
    );
};

// Grid scanning overlay
const ScanGrid = ({ imageSize, isActive }: { imageSize: number; isActive: boolean }) => {
    const gridAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (!isActive) return;

        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(gridAnim, {
                    toValue: 1,
                    duration: 3000,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
                Animated.timing(gridAnim, {
                    toValue: 0,
                    duration: 0,
                    useNativeDriver: true,
                }),
            ])
        );

        animation.start();
        return () => animation.stop();
    }, [isActive]);

    const translateY = gridAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-imageSize, imageSize],
    });

    return (
        <Animated.View
            style={[
                styles.scanGrid,
                {
                    width: imageSize,
                    height: 60,
                    transform: [{ translateY }],
                },
            ]}
        >
            {/* Horizontal grid lines */}
            {[0, 1, 2, 3].map((i) => (
                <View
                    key={i}
                    style={[
                        styles.gridLine,
                        { top: i * 15 },
                    ]}
                />
            ))}
        </Animated.View>
    );
};

// Detection marker that appears when a lesion is "found"
const DetectionMarker = ({
    x,
    y,
    delay,
    imageSize,
    isActive,
    index,
    language = 'tr'
}: {
    x: number;
    y: number;
    delay: number;
    imageSize: number;
    isActive: boolean;
    index: number;
    language?: 'tr' | 'en';
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (!isActive) return;

        const timer = setTimeout(() => {
            setIsVisible(true);
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 6,
                    tension: 50,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        }, delay + 1000); // Appear 1 second after focus

        return () => clearTimeout(timer);
    }, [isActive, delay]);

    if (!isVisible) return null;

    const posX = x * imageSize - 35;
    const posY = y * imageSize + 25;

    return (
        <Animated.View
            style={[
                styles.detectionMarker,
                {
                    left: posX,
                    top: posY,
                    opacity: opacityAnim,
                    transform: [{ scale: scaleAnim }],
                },
            ]}
        >
            <LinearGradient
                colors={['#0891B2', '#06B6D4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.markerGradient}
            >
                <Text style={styles.markerText}>{language === 'tr' ? 'Bölge' : 'Area'} {index + 1}</Text>
            </LinearGradient>
        </Animated.View>
    );
};

export function AnalysisProgress({
    isActive,
    onComplete,
    duration = 60,
    imageUri,
}: AnalysisProgressProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const gradients = Gradients[colorScheme];
    const { language } = useLanguage();
    const ANALYSIS_STAGES = getAnalysisStages(language);

    const [progress, setProgress] = useState(0);
    const [currentStage, setCurrentStage] = useState(0);
    const [timeRemaining, setTimeRemaining] = useState(duration);
    const [detectedCount, setDetectedCount] = useState(0);

    // Animations
    const scanLineAnim = useRef(new Animated.Value(0)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const iconRotateAnim = useRef(new Animated.Value(0)).current;

    // Fade in animation
    useEffect(() => {
        if (isActive) {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }).start();
        }
    }, [isActive]);

    // Scanning line animation
    useEffect(() => {
        if (!isActive) return;

        const scanAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(scanLineAnim, {
                    toValue: 1,
                    duration: 2500,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(scanLineAnim, {
                    toValue: 0,
                    duration: 2500,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        );

        scanAnimation.start();
        return () => scanAnimation.stop();
    }, [isActive]);

    // Glow animation
    useEffect(() => {
        if (!isActive) return;

        const glowAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(glowAnim, {
                    toValue: 1,
                    duration: 1500,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: false,
                }),
                Animated.timing(glowAnim, {
                    toValue: 0,
                    duration: 1500,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: false,
                }),
            ])
        );

        glowAnimation.start();
        return () => glowAnimation.stop();
    }, [isActive]);

    // Icon rotation
    useEffect(() => {
        if (!isActive) return;

        const rotateAnimation = Animated.loop(
            Animated.timing(iconRotateAnim, {
                toValue: 1,
                duration: 3000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        );

        rotateAnimation.start();
        return () => rotateAnimation.stop();
    }, [isActive]);

    // Update detected count based on progress
    useEffect(() => {
        const count = DETECTION_POINTS.filter((_, i) =>
            progress >= ((i + 1) / DETECTION_POINTS.length) * 50
        ).length;
        setDetectedCount(count);
    }, [progress]);

    // Progress tracking
    useEffect(() => {
        if (!isActive) {
            setProgress(0);
            setCurrentStage(0);
            setTimeRemaining(duration);
            return;
        }

        const startTime = Date.now();
        const endTime = startTime + duration * 1000;

        const interval = setInterval(() => {
            const now = Date.now();
            const elapsed = now - startTime;
            const remaining = Math.max(0, endTime - now);

            const newProgress = Math.min(100, (elapsed / (duration * 1000)) * 100);
            setProgress(newProgress);
            setTimeRemaining(Math.ceil(remaining / 1000));

            const stageIndex = Math.min(
                Math.floor((newProgress / 100) * ANALYSIS_STAGES.length),
                ANALYSIS_STAGES.length - 1
            );
            setCurrentStage(stageIndex);

            if (newProgress >= 100) {
                clearInterval(interval);
                onComplete?.();
            }
        }, 100);

        return () => clearInterval(interval);
    }, [isActive, duration, onComplete]);

    if (!isActive) return null;

    const CurrentIcon = ANALYSIS_STAGES[currentStage]?.Icon || Brain;
    const currentLabel = ANALYSIS_STAGES[currentStage]?.label || 'Analiz ediliyor...';

    const scanLineTranslate = scanLineAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, IMAGE_SIZE - 4],
    });

    const glowOpacity = glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.8],
    });

    const iconRotation = iconRotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
            {/* Background gradient */}
            <LinearGradient
                colors={['#E0F7FA', '#B2EBF2', '#80DEEA']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.backgroundGradient}
            />

            {/* Main content */}
            <View style={styles.content}>
                {/* Image preview with scanning effect */}
                <View style={styles.imageSection}>
                    <Animated.View
                        style={[
                            styles.imageGlow,
                            { shadowOpacity: glowOpacity },
                        ]}
                    >
                        <View style={styles.imageContainer}>
                            {imageUri ? (
                                <Image
                                    source={{ uri: imageUri }}
                                    style={styles.previewImage}
                                    resizeMode="cover"
                                />
                            ) : (
                                <View style={styles.placeholderImage}>
                                    <Crosshair size={60} color="#0891B2" strokeWidth={1} />
                                </View>
                            )}

                            {/* Grid scanning overlay */}
                            <ScanGrid imageSize={IMAGE_SIZE} isActive={isActive} />

                            {/* Scanning line effect */}
                            <Animated.View
                                style={[
                                    styles.scanLine,
                                    { transform: [{ translateY: scanLineTranslate }] },
                                ]}
                            >
                                <LinearGradient
                                    colors={['transparent', 'rgba(8, 145, 178, 0.8)', 'transparent']}
                                    style={styles.scanLineGradient}
                                />
                            </Animated.View>

                            {/* Corner brackets */}
                            <View style={[styles.cornerBracket, styles.topLeft]} />
                            <View style={[styles.cornerBracket, styles.topRight]} />
                            <View style={[styles.cornerBracket, styles.bottomLeft]} />
                            <View style={[styles.cornerBracket, styles.bottomRight]} />
                        </View>
                    </Animated.View>
                </View>

                {/* Info card with glassmorphism */}
                <BlurView intensity={60} tint="light" style={styles.infoCardBlur}>
                    <View style={styles.infoCard}>
                        {/* Animated icon */}
                        <View style={styles.iconRow}>
                            <Animated.View
                                style={[
                                    styles.iconContainer,
                                    { transform: [{ rotate: iconRotation }] },
                                ]}
                            >
                                <CurrentIcon size={24} color="#0891B2" strokeWidth={1.8} />
                            </Animated.View>
                            <View style={styles.titleContainer}>
                                <Text style={styles.title}>
                                    {language === 'tr' ? 'AI Analizi Yapılıyor' : 'AI Analysis in Progress'}
                                </Text>
                                <Text style={styles.stageLabel}>{currentLabel}</Text>
                            </View>
                        </View>

                        {/* Progress bar */}
                        <View style={styles.progressSection}>
                            <View style={styles.progressBarContainer}>
                                <LinearGradient
                                    colors={gradients.primary}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={[styles.progressBar, { width: `${progress}%` }]}
                                />
                                <Animated.View
                                    style={[
                                        styles.progressShimmer,
                                        { opacity: glowOpacity, width: `${progress}%` },
                                    ]}
                                />
                            </View>
                            <View style={styles.progressInfo}>
                                <Text style={styles.progressText}>%{Math.round(progress)}</Text>
                                <Text style={styles.timeText}>
                                    {language === 'tr'
                                        ? `~${timeRemaining}s kaldı`
                                        : `~${timeRemaining}s remaining`}
                                </Text>
                            </View>
                        </View>

                        {/* Stage indicators */}
                        <View style={styles.stageIndicators}>
                            {ANALYSIS_STAGES.slice(0, 5).map((stage, index) => (
                                <View
                                    key={stage.id}
                                    style={[
                                        styles.stageIndicator,
                                        {
                                            backgroundColor:
                                                index <= currentStage ? '#0891B2' : 'rgba(8, 145, 178, 0.2)',
                                        },
                                    ]}
                                />
                            ))}
                        </View>

                        {/* Disclaimer */}
                        <Text style={styles.disclaimer}>
                            {language === 'tr'
                                ? 'DermAI yapay zeka sistemi analiz ediyor...\nBu işlem 30-60 saniye sürebilir.'
                                : 'DermAI system is analyzing...\nThis may take 30-60 seconds.'}
                        </Text>
                    </View>
                </BlurView>
            </View>
        </Animated.View>
    );
}

const IMAGE_SIZE = SCREEN_WIDTH * 0.65;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    backgroundGradient: {
        ...StyleSheet.absoluteFillObject,
    },
    content: {
        flex: 1,
        paddingHorizontal: Spacing.xl,
        paddingTop: SCREEN_HEIGHT * 0.08,
        alignItems: 'center',
    },
    imageSection: {
        marginBottom: Spacing.lg,
        alignItems: 'center',
    },
    imageGlow: {
        borderRadius: 24,
        shadowColor: '#0891B2',
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 30,
        elevation: 15,
    },
    imageContainer: {
        width: IMAGE_SIZE,
        height: IMAGE_SIZE,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        position: 'relative',
    },
    previewImage: {
        width: '100%',
        height: '100%',
    },
    placeholderImage: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(8, 145, 178, 0.1)',
    },
    scanLine: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 4,
        top: 0,
    },
    scanLineGradient: {
        flex: 1,
    },
    scanGrid: {
        position: 'absolute',
        left: 0,
        overflow: 'hidden',
    },
    gridLine: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 1,
        backgroundColor: 'rgba(8, 145, 178, 0.3)',
    },
    // Detection focus styles
    detectionFocus: {
        position: 'absolute',
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    detectionRingOuter: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: 'rgba(8, 145, 178, 0.5)',
    },
    detectionRingInner: {
        position: 'absolute',
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: '#0891B2',
    },
    detectionDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#0891B2',
    },
    crosshairLine: {
        position: 'absolute',
        backgroundColor: 'rgba(8, 145, 178, 0.6)',
    },
    crosshairHorizontal: {
        width: 40,
        height: 1,
    },
    crosshairVertical: {
        width: 1,
        height: 40,
    },
    // Detection marker styles
    detectionMarker: {
        position: 'absolute',
        borderRadius: 8,
        overflow: 'hidden',
    },
    markerGradient: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    markerText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    // Detection badge
    detectionBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#0891B2',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        marginTop: Spacing.md,
    },
    detectionBadgeText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    // Corner brackets
    cornerBracket: {
        position: 'absolute',
        width: 30,
        height: 30,
        borderColor: '#0891B2',
        borderWidth: 3,
    },
    topLeft: {
        top: 10,
        left: 10,
        borderRightWidth: 0,
        borderBottomWidth: 0,
        borderTopLeftRadius: 8,
    },
    topRight: {
        top: 10,
        right: 10,
        borderLeftWidth: 0,
        borderBottomWidth: 0,
        borderTopRightRadius: 8,
    },
    bottomLeft: {
        bottom: 10,
        left: 10,
        borderRightWidth: 0,
        borderTopWidth: 0,
        borderBottomLeftRadius: 8,
    },
    bottomRight: {
        bottom: 10,
        right: 10,
        borderLeftWidth: 0,
        borderTopWidth: 0,
        borderBottomRightRadius: 8,
    },
    infoCardBlur: {
        borderRadius: 20,
        overflow: 'hidden',
        width: '100%',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.6)',
    },
    infoCard: {
        padding: Spacing.lg,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        alignItems: 'center',
    },
    iconRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.md,
        width: '100%',
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(8, 145, 178, 0.12)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.md,
    },
    titleContainer: {
        flex: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 2,
    },
    stageLabel: {
        fontSize: 13,
        color: '#64748B',
    },
    progressSection: {
        width: '100%',
        marginBottom: Spacing.md,
    },
    progressBarContainer: {
        width: '100%',
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(8, 145, 178, 0.15)',
        overflow: 'hidden',
        marginBottom: Spacing.sm,
    },
    progressBar: {
        height: '100%',
        borderRadius: 4,
    },
    progressShimmer: {
        position: 'absolute',
        top: 0,
        left: 0,
        height: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
        borderRadius: 4,
    },
    progressInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    progressText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#0891B2',
    },
    timeText: {
        fontSize: 13,
        color: '#64748B',
    },
    stageIndicators: {
        flexDirection: 'row',
        gap: Spacing.sm,
        marginBottom: Spacing.md,
    },
    stageIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    disclaimer: {
        fontSize: 11,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 16,
    },
});
