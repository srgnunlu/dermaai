/**
 * Stepper Progress Component for DermaAssistAI
 * Visual step indicator with animated progress line
 */

import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, Camera, User, Brain } from 'lucide-react-native';
import { Colors, Gradients, Glow } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';
import { Duration } from '@/constants/Animations';
import { useColorScheme } from '@/components/useColorScheme';

interface Step {
    id: number;
    label: string;
    icon: React.ComponentType<any>;
}

interface StepperProgressProps {
    currentStep: number; // 0-indexed
    steps?: Step[];
}

const DEFAULT_STEPS: Step[] = [
    { id: 1, label: 'Görseller', icon: Camera },
    { id: 2, label: 'Bilgiler', icon: User },
    { id: 3, label: 'Analiz', icon: Brain },
];

export function StepperProgress({
    currentStep,
    steps = DEFAULT_STEPS,
}: StepperProgressProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const gradients = Gradients[colorScheme];
    const glow = Glow[colorScheme];

    // Animation values for each step
    const stepAnims = useRef(steps.map(() => new Animated.Value(0))).current;
    const progressAnim = useRef(new Animated.Value(0)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Animate progress line
        Animated.timing(progressAnim, {
            toValue: currentStep / (steps.length - 1),
            duration: Duration.slow,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
        }).start();

        // Animate completed steps
        steps.forEach((_, index) => {
            Animated.timing(stepAnims[index], {
                toValue: index <= currentStep ? 1 : 0,
                duration: Duration.normal,
                delay: index * 100,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }).start();
        });

        // Glow animation for current step
        Animated.loop(
            Animated.sequence([
                Animated.timing(glowAnim, {
                    toValue: 1,
                    duration: Duration.pulse,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(glowAnim, {
                    toValue: 0,
                    duration: Duration.pulse,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [currentStep]);

    const progressWidth = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    return (
        <View style={styles.container}>
            {/* Progress Line Background */}
            <View style={styles.progressLineContainer}>
                <View
                    style={[
                        styles.progressLineBackground,
                        { backgroundColor: colors.muted }
                    ]}
                />

                {/* Animated Progress Line */}
                <Animated.View style={[styles.progressLineFill, { width: progressWidth }]}>
                    <LinearGradient
                        colors={gradients.primary}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.progressGradient}
                    />
                </Animated.View>
            </View>

            {/* Steps */}
            <View style={styles.stepsContainer}>
                {steps.map((step, index) => {
                    const isCompleted = index < currentStep;
                    const isCurrent = index === currentStep;
                    const isPending = index > currentStep;

                    const StepIcon = step.icon;

                    const scale = stepAnims[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1],
                    });

                    const glowOpacity = isCurrent ? glowAnim : new Animated.Value(0);

                    return (
                        <View key={step.id} style={styles.stepItem}>
                            {/* Glow Effect for Current Step */}
                            {isCurrent && (
                                <Animated.View
                                    style={[
                                        styles.stepGlow,
                                        {
                                            backgroundColor: glow.primary,
                                            opacity: glowOpacity,
                                        },
                                    ]}
                                />
                            )}

                            {/* Step Circle */}
                            <Animated.View
                                style={[
                                    styles.stepCircle,
                                    isCompleted && [
                                        styles.stepCircleCompleted,
                                        { backgroundColor: colors.primary },
                                    ],
                                    isCurrent && [
                                        styles.stepCircleCurrent,
                                        {
                                            backgroundColor: colors.primaryLight,
                                            borderColor: colors.primary,
                                        },
                                    ],
                                    isPending && [
                                        styles.stepCirclePending,
                                        {
                                            backgroundColor: colors.muted,
                                            borderColor: colors.border,
                                        },
                                    ],
                                    { transform: [{ scale }] },
                                ]}
                            >
                                {isCompleted ? (
                                    <Check size={16} color={colors.primaryForeground} strokeWidth={3} />
                                ) : (
                                    <StepIcon
                                        size={18}
                                        color={isCurrent ? colors.primary : colors.textMuted}
                                        strokeWidth={isCurrent ? 2 : 1.5}
                                    />
                                )}
                            </Animated.View>

                            {/* Step Label */}
                            <Text
                                style={[
                                    styles.stepLabel,
                                    {
                                        color: isCurrent
                                            ? colors.primary
                                            : isCompleted
                                                ? colors.text
                                                : colors.textMuted,
                                        fontWeight: isCurrent ? '600' : '400',
                                    },
                                ]}
                            >
                                {step.label}
                            </Text>
                        </View>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: Spacing.xl,
    },
    progressLineContainer: {
        position: 'absolute',
        top: 20,
        left: 40,
        right: 40,
        height: 3,
        zIndex: 0,
    },
    progressLineBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        borderRadius: 1.5,
    },
    progressLineFill: {
        position: 'absolute',
        top: 0,
        left: 0,
        height: 3,
        borderRadius: 1.5,
        overflow: 'hidden',
    },
    progressGradient: {
        flex: 1,
    },
    stepsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        zIndex: 1,
    },
    stepItem: {
        alignItems: 'center',
        flex: 1,
    },
    stepGlow: {
        position: 'absolute',
        top: 0,
        width: 56,
        height: 56,
        borderRadius: 28,
    },
    stepCircle: {
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        marginBottom: Spacing.sm,
    },
    stepCircleCompleted: {
        borderWidth: 0,
    },
    stepCircleCurrent: {
        borderWidth: 2,
    },
    stepCirclePending: {
        borderWidth: 1,
    },
    stepLabel: {
        ...Typography.styles.caption,
        textAlign: 'center',
    },
});
