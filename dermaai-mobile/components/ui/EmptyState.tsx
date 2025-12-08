/**
 * Empty state component for lists and content
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';
import { useColorScheme } from '@/components/useColorScheme';
import { Button } from './Button';

interface EmptyStateProps {
    icon?: React.ReactNode;
    emoji?: string;
    title: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
    style?: ViewStyle;
}

export function EmptyState({
    icon,
    emoji,
    title,
    description,
    actionLabel,
    onAction,
    style,
}: EmptyStateProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    return (
        <View style={[styles.container, style]}>
            {emoji && <Text style={styles.emoji}>{emoji}</Text>}
            {icon && <View style={styles.icon}>{icon}</View>}

            <Text style={[styles.title, { color: colors.text }]}>
                {title}
            </Text>

            {description && (
                <Text style={[styles.description, { color: colors.textSecondary }]}>
                    {description}
                </Text>
            )}

            {actionLabel && onAction && (
                <Button
                    variant="primary"
                    size="md"
                    onPress={onAction}
                    style={styles.action}
                >
                    {actionLabel}
                </Button>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.xl,
    },
    emoji: {
        fontSize: 64,
        marginBottom: Spacing.lg,
    },
    icon: {
        marginBottom: Spacing.lg,
    },
    title: {
        ...Typography.styles.h3,
        textAlign: 'center',
        marginBottom: Spacing.sm,
    },
    description: {
        ...Typography.styles.body,
        textAlign: 'center',
        maxWidth: 280,
    },
    action: {
        marginTop: Spacing.xl,
    },
});
