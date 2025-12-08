/**
 * Loading indicator components
 */

import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';
import { useColorScheme } from '@/components/useColorScheme';

interface LoadingSpinnerProps {
    size?: 'small' | 'large';
    color?: string;
    text?: string;
    style?: ViewStyle;
}

export function LoadingSpinner({
    size = 'large',
    color,
    text,
    style,
}: LoadingSpinnerProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    return (
        <View style={[styles.container, style]}>
            <ActivityIndicator
                size={size}
                color={color || colors.primary}
            />
            {text && (
                <Text style={[styles.text, { color: colors.textSecondary }]}>
                    {text}
                </Text>
            )}
        </View>
    );
}

// Full screen loading overlay
interface LoadingOverlayProps {
    visible: boolean;
    text?: string;
}

export function LoadingOverlay({ visible, text }: LoadingOverlayProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    if (!visible) return null;

    return (
        <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
            <View style={[styles.overlayContent, { backgroundColor: colors.card }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                {text && (
                    <Text style={[styles.overlayText, { color: colors.text }]}>
                        {text}
                    </Text>
                )}
            </View>
        </View>
    );
}

// Inline loading for lists/content
interface InlineLoadingProps {
    style?: ViewStyle;
}

export function InlineLoading({ style }: InlineLoadingProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    return (
        <View style={[styles.inlineContainer, style]}>
            <ActivityIndicator size="small" color={colors.primary} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.xl,
    },
    text: {
        ...Typography.styles.body,
        marginTop: Spacing.md,
        textAlign: 'center',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999,
    },
    overlayContent: {
        padding: Spacing.xl,
        borderRadius: Spacing.radius.xl,
        alignItems: 'center',
        minWidth: 120,
    },
    overlayText: {
        ...Typography.styles.body,
        marginTop: Spacing.md,
        textAlign: 'center',
    },
    inlineContainer: {
        padding: Spacing.base,
        alignItems: 'center',
    },
});
