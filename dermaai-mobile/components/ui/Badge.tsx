/**
 * Badge component for status indicators
 * Used for case status, urgency, confidence levels
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, getConfidenceColor } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';
import { useColorScheme } from '@/components/useColorScheme';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'destructive' | 'info' | 'outline';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
    children: React.ReactNode;
    variant?: BadgeVariant;
    size?: BadgeSize;
    style?: ViewStyle;
}

export function Badge({
    children,
    variant = 'default',
    size = 'md',
    style,
}: BadgeProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    const getVariantStyles = () => {
        switch (variant) {
            case 'primary':
                return {
                    backgroundColor: colors.primaryLight,
                    color: colors.primary,
                };
            case 'success':
                return {
                    backgroundColor: colors.successLight,
                    color: colors.success,
                };
            case 'warning':
                return {
                    backgroundColor: colors.warningLight,
                    color: colors.warning,
                };
            case 'destructive':
                return {
                    backgroundColor: colors.destructiveLight,
                    color: colors.destructive,
                };
            case 'info':
                return {
                    backgroundColor: colors.infoLight,
                    color: colors.info,
                };
            case 'outline':
                return {
                    backgroundColor: 'transparent',
                    color: colors.text,
                    borderWidth: 1,
                    borderColor: colors.border,
                };
            default:
                return {
                    backgroundColor: colors.muted,
                    color: colors.mutedForeground,
                };
        }
    };

    const variantStyles = getVariantStyles();
    const isSmall = size === 'sm';

    return (
        <View
            style={[
                styles.badge,
                isSmall ? styles.badgeSm : styles.badgeMd,
                { backgroundColor: variantStyles.backgroundColor },
                variantStyles.borderWidth ? {
                    borderWidth: variantStyles.borderWidth,
                    borderColor: variantStyles.borderColor,
                } : undefined,
                style,
            ]}
        >
            <Text
                style={[
                    isSmall ? styles.textSm : styles.textMd,
                    { color: variantStyles.color },
                ]}
            >
                {children}
            </Text>
        </View>
    );
}

// Specialized confidence badge
interface ConfidenceBadgeProps {
    confidence: number;
    size?: BadgeSize;
    style?: ViewStyle;
}

export function ConfidenceBadge({ confidence, size = 'md', style }: ConfidenceBadgeProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const confidenceColor = getConfidenceColor(confidence, colorScheme);

    const isSmall = size === 'sm';

    return (
        <View
            style={[
                styles.badge,
                isSmall ? styles.badgeSm : styles.badgeMd,
                { backgroundColor: `${confidenceColor}20` },
                style,
            ]}
        >
            <Text
                style={[
                    isSmall ? styles.textSm : styles.textMd,
                    { color: confidenceColor, fontWeight: '700' },
                ]}
            >
                %{confidence}
            </Text>
        </View>
    );
}

// Status badge for case status
interface StatusBadgeProps {
    status: 'pending' | 'completed' | 'in_progress';
    size?: BadgeSize;
    style?: ViewStyle;
}

export function StatusBadge({ status, size = 'md', style }: StatusBadgeProps) {
    const getStatusConfig = () => {
        switch (status) {
            case 'completed':
                return { label: 'Tamamlandı', variant: 'success' as BadgeVariant };
            case 'in_progress':
                return { label: 'Devam Ediyor', variant: 'info' as BadgeVariant };
            default:
                return { label: 'Beklemede', variant: 'warning' as BadgeVariant };
        }
    };

    const config = getStatusConfig();

    return (
        <Badge variant={config.variant} size={size} style={style}>
            {config.label}
        </Badge>
    );
}

const styles = StyleSheet.create({
    badge: {
        alignSelf: 'flex-start',
        borderRadius: Spacing.radius.md,
    },
    badgeSm: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
    },
    badgeMd: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
    },
    textSm: {
        fontSize: 10,
        fontWeight: '600',
    },
    textMd: {
        fontSize: 12,
        fontWeight: '600',
    },
});
