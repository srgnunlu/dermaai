/**
 * Animation configuration for DermaAssistAI
 * Consistent animation timing, easing, and spring configurations
 */

import { Easing } from 'react-native';

// Animation durations (in milliseconds)
export const Duration = {
    instant: 100,
    fast: 150,
    normal: 250,
    slow: 350,
    slower: 500,
    slowest: 700,

    // Specific use cases
    buttonPress: 100,
    cardExpand: 300,
    modalTransition: 350,
    pageTransition: 300,
    shimmer: 1500,
    pulse: 1000,
    bounce: 400,
};

// Easing functions for React Native Animated
export const Easings = {
    // Standard easings
    easeIn: Easing.in(Easing.ease),
    easeOut: Easing.out(Easing.ease),
    easeInOut: Easing.inOut(Easing.ease),

    // Smooth transitions
    smooth: Easing.bezier(0.4, 0, 0.2, 1),
    smoothIn: Easing.bezier(0.4, 0, 1, 1),
    smoothOut: Easing.bezier(0, 0, 0.2, 1),

    // Bounce/spring-like
    bounce: Easing.bounce,
    elastic: Easing.elastic(1),

    // Custom curves
    snappy: Easing.bezier(0.2, 0.8, 0.2, 1),
    gentle: Easing.bezier(0.25, 0.1, 0.25, 1),
};

// Spring configurations for react-native-reanimated
export const Springs = {
    // Snappy animations (buttons, quick feedback)
    snappy: {
        damping: 15,
        stiffness: 300,
        mass: 1,
    },

    // Smooth animations (cards, modals)
    smooth: {
        damping: 20,
        stiffness: 200,
        mass: 1,
    },

    // Bouncy animations (success states, celebrations)
    bouncy: {
        damping: 10,
        stiffness: 250,
        mass: 0.8,
    },

    // Gentle animations (subtle movement)
    gentle: {
        damping: 25,
        stiffness: 150,
        mass: 1,
    },

    // Wobbly animations (attention grabbing)
    wobbly: {
        damping: 8,
        stiffness: 180,
        mass: 1,
    },

    // Default button press
    buttonPress: {
        damping: 15,
        stiffness: 400,
        mass: 0.8,
    },
};

// Common animation presets
export const AnimationPresets = {
    // Fade in animations
    fadeIn: {
        from: { opacity: 0 },
        to: { opacity: 1 },
        duration: Duration.normal,
        easing: Easings.smooth,
    },

    fadeOut: {
        from: { opacity: 1 },
        to: { opacity: 0 },
        duration: Duration.fast,
        easing: Easings.smooth,
    },

    // Scale animations
    scaleIn: {
        from: { scale: 0.9, opacity: 0 },
        to: { scale: 1, opacity: 1 },
        duration: Duration.normal,
        easing: Easings.smooth,
    },

    scaleOut: {
        from: { scale: 1, opacity: 1 },
        to: { scale: 0.9, opacity: 0 },
        duration: Duration.fast,
        easing: Easings.smooth,
    },

    // Slide animations
    slideInUp: {
        from: { translateY: 20, opacity: 0 },
        to: { translateY: 0, opacity: 1 },
        duration: Duration.normal,
        easing: Easings.snappy,
    },

    slideInDown: {
        from: { translateY: -20, opacity: 0 },
        to: { translateY: 0, opacity: 1 },
        duration: Duration.normal,
        easing: Easings.snappy,
    },

    // Button press
    buttonPress: {
        scale: 0.97,
        duration: Duration.buttonPress,
    },

    // Pulse effect
    pulse: {
        scale: [1, 1.05, 1],
        duration: Duration.pulse,
    },

    // Shimmer effect
    shimmer: {
        translateX: [-100, 100],
        duration: Duration.shimmer,
    },
};

// Stagger delay for list items
export const StaggerDelay = {
    fast: 30,
    normal: 50,
    slow: 80,
};

// Z-index layers
export const ZIndex = {
    base: 0,
    dropdown: 100,
    modal: 200,
    toast: 300,
    tooltip: 400,
    overlay: 500,
};
