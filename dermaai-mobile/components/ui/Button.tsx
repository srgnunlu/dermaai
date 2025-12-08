/**
 * Reusable Button component for DermaAssistAI
 * Supports multiple variants, sizes, states, and premium gradient option
 */

import React, { useRef, useEffect } from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    ViewStyle,
    TextStyle,
    Animated,
    Easing,
    View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors, Gradients } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing, Shadows } from '@/constants/Spacing';
import { Duration } from '@/constants/Animations';
import { useColorScheme } from '@/components/useColorScheme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'gradient';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
    children: React.ReactNode;
    variant?: ButtonVariant;
    size?: ButtonSize;
    onPress?: () => void;
    disabled?: boolean;
    loading?: boolean;
    fullWidth?: boolean;
    icon?: React.ReactNode;
    iconPosition?: 'left' | 'right';
    style?: ViewStyle;
    textStyle?: TextStyle;
    hapticFeedback?: boolean;
}

export function Button({
    children,
    variant = 'primary',
    size = 'md',
    onPress,
    disabled = false,
    loading = false,
    fullWidth = false,
    icon,
    iconPosition = 'left',
    style,
    textStyle,
    hapticFeedback = true,
}: ButtonProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const gradients = Gradients[colorScheme];

    const scaleAnim = useRef(new Animated.Value(1)).current;
    const shimmerAnim = useRef(new Animated.Value(0)).current;

    // Shimmer animation for gradient variant
    useEffect(() => {
        if (variant === 'gradient' && !disabled && !loading) {
            Animated.loop(
                Animated.timing(shimmerAnim, {
                    toValue: 1,
                    duration: Duration.shimmer * 2,
                    easing: Easing.linear,
                    useNativeDriver: true,
                })
            ).start();
        }
    }, [variant, disabled, loading]);

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.97,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 3,
            tension: 40,
            useNativeDriver: true,
        }).start();
    };

    const handlePress = async () => {
        if (hapticFeedback) {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onPress?.();
    };

    const getVariantStyles = (): { container: ViewStyle; text: TextStyle } => {
        switch (variant) {
            case 'primary':
                return {
                    container: {
                        backgroundColor: colors.primary,
                        borderWidth: 0,
                    },
                    text: {
                        color: colors.primaryForeground,
                    },
                };
            case 'gradient':
                return {
                    container: {
                        backgroundColor: 'transparent',
                        borderWidth: 0,
                    },
                    text: {
                        color: '#FFFFFF',
                    },
                };
            case 'secondary':
                return {
                    container: {
                        backgroundColor: colors.secondary,
                        borderWidth: 0,
                    },
                    text: {
                        color: colors.secondaryForeground,
                    },
                };
            case 'outline':
                return {
                    container: {
                        backgroundColor: 'transparent',
                        borderWidth: 1.5,
                        borderColor: colors.border,
                    },
                    text: {
                        color: colors.text,
                    },
                };
            case 'ghost':
                return {
                    container: {
                        backgroundColor: 'transparent',
                        borderWidth: 0,
                    },
                    text: {
                        color: colors.primary,
                    },
                };
            case 'destructive':
                return {
                    container: {
                        backgroundColor: colors.destructive,
                        borderWidth: 0,
                    },
                    text: {
                        color: colors.destructiveForeground,
                    },
                };
            default:
                return {
                    container: {},
                    text: {},
                };
        }
    };

    const getSizeStyles = (): { container: ViewStyle; text: TextStyle } => {
        switch (size) {
            case 'sm':
                return {
                    container: {
                        height: Spacing.buttonHeight.sm,
                        paddingHorizontal: Spacing.md,
                        borderRadius: Spacing.radius.md,
                    },
                    text: {
                        ...Typography.styles.buttonSmall,
                    },
                };
            case 'lg':
                return {
                    container: {
                        height: Spacing.buttonHeight.lg,
                        paddingHorizontal: Spacing.xl,
                        borderRadius: Spacing.radius.lg,
                    },
                    text: {
                        ...Typography.styles.button,
                    },
                };
            default:
                return {
                    container: {
                        height: Spacing.buttonHeight.md,
                        paddingHorizontal: Spacing.base,
                        borderRadius: Spacing.radius.base,
                    },
                    text: {
                        ...Typography.styles.button,
                    },
                };
        }
    };

    const variantStyles = getVariantStyles();
    const sizeStyles = getSizeStyles();
    const isDisabled = disabled || loading;

    const shimmerTranslateX = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-200, 200],
    });

    const renderContent = () => (
        <>
            {icon && iconPosition === 'left' && icon}
            <Text
                style={[
                    styles.text,
                    sizeStyles.text,
                    variantStyles.text,
                    icon && iconPosition === 'left' ? styles.textWithLeftIcon : undefined,
                    icon && iconPosition === 'right' ? styles.textWithRightIcon : undefined,
                    textStyle,
                ]}
            >
                {children}
            </Text>
            {icon && iconPosition === 'right' && icon}
        </>
    );

    // Gradient variant rendering
    if (variant === 'gradient') {
        return (
            <Animated.View
                style={[
                    fullWidth && styles.fullWidth,
                    { transform: [{ scale: scaleAnim }] },
                ]}
            >
                <TouchableOpacity
                    onPress={handlePress}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    disabled={isDisabled}
                    activeOpacity={1}
                    style={[fullWidth && styles.fullWidth]}
                >
                    <LinearGradient
                        colors={gradients.primary}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[
                            styles.container,
                            sizeStyles.container,
                            styles.gradientContainer,
                            isDisabled && styles.disabled,
                            style,
                        ]}
                    >
                        {/* Shimmer overlay */}
                        {!isDisabled && (
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
                        )}

                        {loading ? (
                            <ActivityIndicator color="#FFFFFF" size="small" />
                        ) : (
                            renderContent()
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            </Animated.View>
        );
    }

    // Standard variant rendering
    return (
        <Animated.View
            style={[
                fullWidth && styles.fullWidth,
                { transform: [{ scale: scaleAnim }] },
            ]}
        >
            <TouchableOpacity
                style={[
                    styles.container,
                    sizeStyles.container,
                    variantStyles.container,
                    isDisabled && styles.disabled,
                    style,
                ]}
                onPress={handlePress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={isDisabled}
                activeOpacity={1}
            >
                {loading ? (
                    <ActivityIndicator
                        color={variantStyles.text.color}
                        size="small"
                    />
                ) : (
                    renderContent()
                )}
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    gradientContainer: {
        shadowColor: '#0E7490',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    fullWidth: {
        width: '100%',
    },
    disabled: {
        opacity: 0.5,
    },
    text: {
        textAlign: 'center',
    },
    textWithLeftIcon: {
        marginLeft: Spacing.sm,
    },
    textWithRightIcon: {
        marginRight: Spacing.sm,
    },
    shimmerOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: 100,
    },
    shimmerGradient: {
        flex: 1,
        width: 100,
    },
});

