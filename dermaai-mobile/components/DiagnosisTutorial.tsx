/**
 * Diagnosis Tutorial Overlay
 * A 3-step onboarding tutorial for first-time users on the AI diagnosis results page
 * Enhanced with glassmorphism styling, modern animations, and tap-to-advance navigation
 */

import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    TouchableWithoutFeedback,
    Dimensions,
    Easing,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { ChevronUp, CheckCircle, Hand } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Translations } from '@/constants/Translations';
import { Spacing } from '@/constants/Spacing';
import { markTutorialAsShown } from '@/lib/storage';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface DiagnosisTutorialProps {
    language: 'tr' | 'en';
    userId?: string;
    onComplete: () => void;
}

type TutorialStep = 'swipe' | 'alternativeAI' | 'confirm';

const STEPS: TutorialStep[] = ['swipe', 'alternativeAI', 'confirm'];

// Modern Animated Hand for Swipe Gesture
function SwipeHand({ opacity }: { opacity: Animated.Value }) {
    const translateX = useRef(new Animated.Value(0)).current;
    const handScale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.parallel([
                    Animated.timing(translateX, {
                        toValue: -50,
                        duration: 700,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.sequence([
                        Animated.timing(handScale, {
                            toValue: 0.9,
                            duration: 350,
                            useNativeDriver: true,
                        }),
                        Animated.timing(handScale, {
                            toValue: 1,
                            duration: 350,
                            useNativeDriver: true,
                        }),
                    ]),
                ]),
                Animated.timing(translateX, {
                    toValue: 0,
                    duration: 500,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.delay(300),
            ])
        );
        animation.start();
        return () => animation.stop();
    }, [translateX, handScale]);

    return (
        <Animated.View style={[styles.handContainer, { opacity, transform: [{ translateX }, { scale: handScale }] }]}>
            <View style={styles.handIconWrapper}>
                <LinearGradient
                    colors={['rgba(8, 145, 178, 0.3)', 'rgba(8, 145, 178, 0.1)']}
                    style={styles.handGlow}
                />
                <View style={styles.handIcon}>
                    <Hand size={36} color="#0891B2" strokeWidth={1.5} />
                </View>
            </View>
        </Animated.View>
    );
}

// Pulsing Arrow for Alternative AI
function PulsingUpArrow({ opacity }: { opacity: Animated.Value }) {
    const scale = useRef(new Animated.Value(1)).current;
    const translateY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.parallel([
                Animated.sequence([
                    Animated.timing(scale, {
                        toValue: 1.15,
                        duration: 600,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(scale, {
                        toValue: 1,
                        duration: 600,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ]),
                Animated.sequence([
                    Animated.timing(translateY, {
                        toValue: -8,
                        duration: 600,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(translateY, {
                        toValue: 0,
                        duration: 600,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ]),
            ])
        );
        animation.start();
        return () => animation.stop();
    }, [scale, translateY]);

    return (
        <Animated.View style={[styles.arrowContainer, { opacity, transform: [{ scale }, { translateY }] }]}>
            <View style={styles.arrowBubble}>
                <LinearGradient
                    colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.85)']}
                    style={styles.arrowGradient}
                />
                <ChevronUp size={28} color="#0891B2" strokeWidth={3} />
            </View>
        </Animated.View>
    );
}

// Pulsing Circle for Confirm Button
function PulsingCircle({ opacity }: { opacity: Animated.Value }) {
    const scale = useRef(new Animated.Value(1)).current;
    const ringOpacity = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.parallel([
                Animated.sequence([
                    Animated.timing(scale, {
                        toValue: 1.4,
                        duration: 800,
                        easing: Easing.out(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(scale, {
                        toValue: 1,
                        duration: 800,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ]),
                Animated.sequence([
                    Animated.timing(ringOpacity, {
                        toValue: 0,
                        duration: 800,
                        easing: Easing.out(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(ringOpacity, {
                        toValue: 0.8,
                        duration: 800,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ]),
            ])
        );
        animation.start();
        return () => animation.stop();
    }, [scale, ringOpacity]);

    return (
        <Animated.View style={[styles.confirmContainer, { opacity }]}>
            <Animated.View style={[styles.pulsingRing, { transform: [{ scale }], opacity: ringOpacity }]} />
            <View style={styles.confirmIcon}>
                <CheckCircle size={24} color="#0891B2" />
            </View>
        </Animated.View>
    );
}

// Glassmorphism Tooltip Component
function GlassTooltip({ text, opacity }: { text: string; opacity: Animated.Value }) {
    return (
        <Animated.View style={[styles.glassTooltip, { opacity }]}>
            <BlurView intensity={40} tint="light" style={styles.tooltipBlur}>
                <LinearGradient
                    colors={['rgba(255, 255, 255, 0.7)', 'rgba(255, 255, 255, 0.4)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.tooltipGradient}
                >
                    <View style={styles.tooltipGlassHighlight} />
                    <Text style={styles.tutorialText}>{text}</Text>
                </LinearGradient>
            </BlurView>
        </Animated.View>
    );
}

export function DiagnosisTutorial({ language, userId, onComplete }: DiagnosisTutorialProps) {
    const [currentStep, setCurrentStep] = useState<TutorialStep>('swipe');
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const stepOpacity = useRef(new Animated.Value(1)).current;

    // Fade in on mount
    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
        }).start();
    }, [fadeAnim]);

    const handleComplete = async () => {
        await markTutorialAsShown(userId);
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            onComplete();
        });
    };

    const handleTap = () => {
        const nextIndex = currentStepIndex + 1;

        if (nextIndex >= STEPS.length) {
            handleComplete();
        } else {
            // Fade out current, change step, fade in new
            Animated.timing(stepOpacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start(() => {
                setCurrentStepIndex(nextIndex);
                setCurrentStep(STEPS[nextIndex]);
                Animated.timing(stepOpacity, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }).start();
            });
        }
    };

    const getStepContent = () => {
        switch (currentStep) {
            case 'swipe':
                return {
                    text: Translations.tutorialSwipe[language],
                    position: 'center' as const,
                };
            case 'alternativeAI':
                return {
                    text: Translations.tutorialAlternativeAI[language],
                    position: 'top' as const,
                };
            case 'confirm':
                return {
                    text: Translations.tutorialConfirm[language],
                    position: 'bottom' as const,
                };
        }
    };

    const stepContent = getStepContent();

    return (
        <TouchableWithoutFeedback onPress={handleTap}>
            <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
                {/* Spotlight overlay effect */}
                <View style={styles.spotlightOverlay} />

                {/* Step 1: Swipe Animation - Center of screen */}
                {currentStep === 'swipe' && (
                    <View style={styles.swipeStep}>
                        <SwipeHand opacity={stepOpacity} />
                        <GlassTooltip text={stepContent.text} opacity={stepOpacity} />
                    </View>
                )}

                {/* Step 2: Alternative AI Tab - Top area */}
                {currentStep === 'alternativeAI' && (
                    <View style={styles.alternativeStep}>
                        <Animated.View style={[styles.textBoxTop, { opacity: stepOpacity }]}>
                            <GlassTooltip text={stepContent.text} opacity={stepOpacity} />
                        </Animated.View>
                        <View style={styles.arrowWrapper}>
                            <PulsingUpArrow opacity={stepOpacity} />
                        </View>
                    </View>
                )}

                {/* Step 3: Confirm Button - Bottom right */}
                {currentStep === 'confirm' && (
                    <View style={styles.confirmStep}>
                        <View style={styles.confirmWrapper}>
                            <PulsingCircle opacity={stepOpacity} />
                        </View>
                        <Animated.View style={[styles.textBoxBottom, { opacity: stepOpacity }]}>
                            <GlassTooltip text={stepContent.text} opacity={stepOpacity} />
                        </Animated.View>
                    </View>
                )}

                {/* Tap to continue hint */}
                <Animated.View style={[styles.skipHint, { opacity: fadeAnim }]}>
                    <BlurView intensity={30} tint="dark" style={styles.skipHintBlur}>
                        <Text style={styles.skipText}>{Translations.tutorialTapToContinue[language]}</Text>
                    </BlurView>
                </Animated.View>

                {/* Enhanced Progress dots with step indicator */}
                <View style={styles.progressContainer}>
                    <View style={styles.progressDots}>
                        {STEPS.map((step, index) => (
                            <View
                                key={step}
                                style={[
                                    styles.progressDot,
                                    currentStepIndex === index && styles.progressDotActive,
                                    currentStepIndex > index && styles.progressDotCompleted,
                                ]}
                            >
                                {currentStepIndex === index && (
                                    <View style={styles.progressDotInner} />
                                )}
                            </View>
                        ))}
                    </View>
                    <Text style={styles.stepIndicator}>
                        {currentStepIndex + 1}/{STEPS.length}
                    </Text>
                </View>
            </Animated.View>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1000,
    },

    spotlightOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'transparent',
    },

    // Swipe step
    swipeStep: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 100,
    },
    handContainer: {
        marginBottom: 24,
    },
    handIconWrapper: {
        width: 80,
        height: 80,
        alignItems: 'center',
        justifyContent: 'center',
    },
    handGlow: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    handIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.8)',
    },

    // Glass Tooltip
    glassTooltip: {
        marginHorizontal: Spacing.xl,
        borderRadius: 20,
        overflow: 'hidden',
    },
    tooltipBlur: {
        borderRadius: 20,
        overflow: 'hidden',
    },
    tooltipGradient: {
        padding: Spacing.lg,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.6)',
        position: 'relative',
        overflow: 'hidden',
    },
    tooltipGlassHighlight: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '50%',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    tutorialText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0F172A',
        textAlign: 'center',
        lineHeight: 24,
        letterSpacing: 0.3,
    },

    // Alternative AI step
    alternativeStep: {
        flex: 1,
        alignItems: 'center',
    },
    arrowWrapper: {
        position: 'absolute',
        top: 145,
        right: SCREEN_WIDTH * 0.22,
    },
    arrowContainer: {},
    arrowBubble: {
        width: 54,
        height: 54,
        borderRadius: 27,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.8)',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        overflow: 'hidden',
    },
    arrowGradient: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 27,
    },
    textBoxTop: {
        position: 'absolute',
        top: 210,
        alignSelf: 'center',
    },

    // Confirm step
    confirmStep: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    confirmWrapper: {
        position: 'absolute',
        bottom: 80,
        right: Spacing.xl + 5,
    },
    confirmContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    pulsingRing: {
        position: 'absolute',
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 3,
        borderColor: '#0891B2',
    },
    confirmIcon: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.8)',
    },
    textBoxBottom: {
        position: 'absolute',
        bottom: 150,
        left: Spacing.xl,
        right: Spacing.xl + 70,
    },

    // Skip/Continue hint
    skipHint: {
        position: 'absolute',
        bottom: 55,
        alignSelf: 'center',
    },
    skipHintBlur: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        overflow: 'hidden',
    },
    skipText: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        fontWeight: '500',
        letterSpacing: 0.3,
    },

    // Progress indicator
    progressContainer: {
        position: 'absolute',
        bottom: 20,
        alignSelf: 'center',
        alignItems: 'center',
        gap: 8,
    },
    progressDots: {
        flexDirection: 'row',
        gap: 10,
    },
    progressDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.4)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressDotActive: {
        backgroundColor: 'rgba(8, 145, 178, 0.3)',
        borderColor: '#0891B2',
        width: 20,
        borderRadius: 10,
    },
    progressDotCompleted: {
        backgroundColor: '#0891B2',
        borderColor: '#0891B2',
    },
    progressDotInner: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#0891B2',
    },
    stepIndicator: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.7)',
        fontWeight: '600',
    },
});
