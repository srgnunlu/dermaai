/**
 * Diagnosis Tutorial Overlay
 * A 3-step onboarding tutorial for first-time users on the AI diagnosis results page
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
import { ChevronLeft, ChevronUp, CheckCircle } from 'lucide-react-native';
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

// Animated Hand for Swipe Gesture
function SwipeHand({ opacity }: { opacity: Animated.Value }) {
    const translateX = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(translateX, {
                    toValue: -60,
                    duration: 800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(translateX, {
                    toValue: 0,
                    duration: 600,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        );
        animation.start();
        return () => animation.stop();
    }, [translateX]);

    return (
        <Animated.View style={[styles.handContainer, { opacity, transform: [{ translateX }] }]}>
            <Text style={styles.handEmoji}>👆</Text>
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
                        toValue: 1.2,
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

export function DiagnosisTutorial({ language, userId, onComplete }: DiagnosisTutorialProps) {
    const [currentStep, setCurrentStep] = useState<TutorialStep>('swipe');
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const stepOpacity = useRef(new Animated.Value(1)).current;

    // Auto-progress through steps
    useEffect(() => {
        // Fade in
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
        }).start();

        const stepDuration = 4000;
        const steps: TutorialStep[] = ['swipe', 'alternativeAI', 'confirm'];
        let stepIndex = 0;

        const progressTimer = setInterval(() => {
            stepIndex++;
            if (stepIndex >= steps.length) {
                clearInterval(progressTimer);
                handleComplete();
            } else {
                // Fade out current, change step, fade in new
                Animated.sequence([
                    Animated.timing(stepOpacity, {
                        toValue: 0,
                        duration: 200,
                        useNativeDriver: true,
                    }),
                ]).start(() => {
                    setCurrentStep(steps[stepIndex]);
                    Animated.timing(stepOpacity, {
                        toValue: 1,
                        duration: 200,
                        useNativeDriver: true,
                    }).start();
                });
            }
        }, stepDuration);

        return () => clearInterval(progressTimer);
    }, []);

    const handleComplete = async () => {
        // Mark as shown in storage (user-specific)
        await markTutorialAsShown(userId);

        // Fade out
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            onComplete();
        });
    };

    const handleSkip = () => {
        handleComplete();
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
        <TouchableWithoutFeedback onPress={handleSkip}>
            <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
                {/* Step 1: Swipe Animation - Center of screen */}
                {currentStep === 'swipe' && (
                    <View style={styles.swipeStep}>
                        <SwipeHand opacity={stepOpacity} />
                        <Animated.View style={[styles.textBox, { opacity: stepOpacity }]}>
                            <BlurView intensity={80} tint="light" style={styles.textBlur}>
                                <Text style={styles.tutorialText}>{stepContent.text}</Text>
                            </BlurView>
                        </Animated.View>
                    </View>
                )}

                {/* Step 2: Alternative AI Tab - Top area */}
                {currentStep === 'alternativeAI' && (
                    <View style={styles.alternativeStep}>
                        <Animated.View style={[styles.textBoxTop, { opacity: stepOpacity }]}>
                            <BlurView intensity={80} tint="light" style={styles.textBlur}>
                                <Text style={styles.tutorialText}>{stepContent.text}</Text>
                            </BlurView>
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
                            <BlurView intensity={80} tint="light" style={styles.textBlur}>
                                <Text style={styles.tutorialText}>{stepContent.text}</Text>
                            </BlurView>
                        </Animated.View>
                    </View>
                )}

                {/* Skip hint */}
                <Animated.View style={[styles.skipHint, { opacity: fadeAnim }]}>
                    <Text style={styles.skipText}>{Translations.tutorialSkip[language]}</Text>
                </Animated.View>

                {/* Progress dots */}
                <View style={styles.progressDots}>
                    {['swipe', 'alternativeAI', 'confirm'].map((step, index) => (
                        <View
                            key={step}
                            style={[
                                styles.progressDot,
                                currentStep === step && styles.progressDotActive,
                            ]}
                        />
                    ))}
                </View>
            </Animated.View>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.35)',
        zIndex: 1000,
    },

    // Swipe step
    swipeStep: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 100,
    },
    handContainer: {
        marginBottom: 20,
    },
    handEmoji: {
        fontSize: 64,
        transform: [{ rotate: '-30deg' }],
    },

    // Alternative AI step
    alternativeStep: {
        flex: 1,
        alignItems: 'center',
    },
    arrowWrapper: {
        position: 'absolute',
        top: 100,
        right: SCREEN_WIDTH * 0.18,
    },
    arrowContainer: {},
    arrowBubble: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#0891B2',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
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
        width: 56,
        height: 56,
        borderRadius: 28,
        borderWidth: 3,
        borderColor: '#0891B2',
    },
    confirmIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#0891B2',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },

    // Text boxes
    textBox: {
        marginHorizontal: Spacing.xl,
        borderRadius: 16,
        overflow: 'hidden',
    },
    textBoxTop: {
        position: 'absolute',
        top: 160,
        marginHorizontal: Spacing.xl,
        borderRadius: 16,
        overflow: 'hidden',
        alignSelf: 'center',
    },
    textBoxBottom: {
        position: 'absolute',
        bottom: 150,
        left: Spacing.xl,
        right: Spacing.xl + 70,
        borderRadius: 16,
        overflow: 'hidden',
    },
    textBlur: {
        padding: Spacing.md,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.6)',
    },
    tutorialText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0F172A',
        textAlign: 'center',
        lineHeight: 22,
    },

    // Skip hint
    skipHint: {
        position: 'absolute',
        bottom: 40,
        alignSelf: 'center',
    },
    skipText: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.7)',
        fontWeight: '500',
    },

    // Progress dots
    progressDots: {
        position: 'absolute',
        bottom: 20,
        flexDirection: 'row',
        alignSelf: 'center',
        gap: 8,
    },
    progressDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
    },
    progressDotActive: {
        backgroundColor: '#0891B2',
        width: 16,
    },
});
