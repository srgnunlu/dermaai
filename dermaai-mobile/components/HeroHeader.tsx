/**
 * Hero Header Component for DermaAssistAI
 * Premium animated header with gradient background, floating icons, and AI badge
 */

import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Easing,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Activity, Sparkles, Heart, Shield, Stethoscope } from 'lucide-react-native';
import { Colors, Gradients, Glass } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';
import { Duration } from '@/constants/Animations';
import { useColorScheme } from '@/components/useColorScheme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface HeroHeaderProps {
    title: string;
    subtitle: string;
    showBadge?: boolean;
    badgeText?: string;
}

// Floating icon component
const FloatingIcon = ({
    Icon,
    size,
    delay,
    duration,
    startX,
    startY,
    color,
}: {
    Icon: any;
    size: number;
    delay: number;
    duration: number;
    startX: number;
    startY: number;
    color: string;
}) => {
    const floatAnim = useRef(new Animated.Value(0)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Fade in
        Animated.timing(opacityAnim, {
            toValue: 1,
            duration: Duration.slow,
            delay,
            useNativeDriver: true,
        }).start();

        // Float animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(floatAnim, {
                    toValue: 1,
                    duration: duration / 2,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(floatAnim, {
                    toValue: 0,
                    duration: duration / 2,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const translateY = floatAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -8],
    });

    return (
        <Animated.View
            style={[
                styles.floatingIcon,
                {
                    left: startX,
                    top: startY,
                    opacity: opacityAnim,
                    transform: [{ translateY }],
                },
            ]}
        >
            <Icon size={size} color={color} strokeWidth={1.5} />
        </Animated.View>
    );
};

export function HeroHeader({
    title,
    subtitle,
    showBadge = true,
    badgeText = 'AI Destekli',
}: HeroHeaderProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const gradients = Gradients[colorScheme];
    const glass = Glass[colorScheme];

    const pulseAnim = useRef(new Animated.Value(1)).current;
    const shimmerAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Pulse animation for badge
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.05,
                    duration: Duration.pulse,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: Duration.pulse,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Shimmer animation
        Animated.loop(
            Animated.timing(shimmerAnim, {
                toValue: 1,
                duration: Duration.shimmer,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();
    }, []);

    const shimmerTranslateX = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
    });

    const iconColor = colorScheme === 'light'
        ? 'rgba(14, 116, 144, 0.2)'
        : 'rgba(34, 211, 238, 0.2)';

    return (
        <View style={styles.container}>
            {/* Background Gradient */}
            <LinearGradient
                colors={gradients.hero}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientBackground}
            />

            {/* Floating Medical Icons */}
            <View style={styles.floatingIconsContainer}>
                <FloatingIcon
                    Icon={Activity}
                    size={20}
                    delay={0}
                    duration={3000}
                    startX={20}
                    startY={15}
                    color={iconColor}
                />
                <FloatingIcon
                    Icon={Heart}
                    size={16}
                    delay={300}
                    duration={3500}
                    startX={SCREEN_WIDTH - 80}
                    startY={20}
                    color={iconColor}
                />
                <FloatingIcon
                    Icon={Shield}
                    size={18}
                    delay={600}
                    duration={3200}
                    startX={60}
                    startY={70}
                    color={iconColor}
                />
                <FloatingIcon
                    Icon={Stethoscope}
                    size={22}
                    delay={150}
                    duration={2800}
                    startX={SCREEN_WIDTH - 120}
                    startY={60}
                    color={iconColor}
                />
            </View>

            {/* Shimmer Overlay */}
            <Animated.View
                style={[
                    styles.shimmerOverlay,
                    { transform: [{ translateX: shimmerTranslateX }] },
                ]}
            >
                <LinearGradient
                    colors={gradients.shimmer}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.shimmerGradient}
                />
            </Animated.View>

            {/* Content Container with Blur */}
            <BlurView intensity={colorScheme === 'light' ? 60 : 40} style={styles.blurContainer}>
                <View style={[styles.contentContainer, { backgroundColor: glass.backgroundSubtle }]}>
                    {/* AI Badge */}
                    {showBadge && (
                        <Animated.View
                            style={[
                                styles.badge,
                                {
                                    backgroundColor: colors.primaryLight,
                                    transform: [{ scale: pulseAnim }],
                                },
                            ]}
                        >
                            <Sparkles size={12} color={colors.primary} />
                            <Text style={[styles.badgeText, { color: colors.primary }]}>
                                {badgeText}
                            </Text>
                        </Animated.View>
                    )}

                    {/* Title */}
                    <Text style={[styles.title, { color: '#FFFFFF' }]}>
                        {title}
                    </Text>

                    {/* Subtitle */}
                    <Text style={[styles.subtitle, { color: 'rgba(255, 255, 255, 0.85)' }]}>
                        {subtitle}
                    </Text>
                </View>
            </BlurView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        borderRadius: Spacing.radius['2xl'],
        overflow: 'hidden',
        marginBottom: Spacing.lg,
    },
    gradientBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    floatingIconsContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    floatingIcon: {
        position: 'absolute',
    },
    shimmerOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: SCREEN_WIDTH,
    },
    shimmerGradient: {
        flex: 1,
        width: 100,
    },
    blurContainer: {
        overflow: 'hidden',
        borderRadius: Spacing.radius['2xl'],
    },
    contentContainer: {
        padding: Spacing.xl,
        paddingVertical: Spacing['2xl'],
        alignItems: 'center',
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: Spacing.radius.full,
        gap: Spacing.xs,
        marginBottom: Spacing.md,
    },
    badgeText: {
        ...Typography.styles.caption,
        fontWeight: '600',
    },
    title: {
        ...Typography.styles.h2,
        textAlign: 'center',
        marginBottom: Spacing.xs,
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    subtitle: {
        ...Typography.styles.body,
        textAlign: 'center',
    },
});
