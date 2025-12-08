/**
 * Reusable Card component for DermaAssistAI
 * Container component with optional header and footer
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing, Shadows } from '@/constants/Spacing';
import { useColorScheme } from '@/components/useColorScheme';

interface CardProps {
    children: React.ReactNode;
    style?: ViewStyle;
    elevated?: boolean;
    noPadding?: boolean;
}

interface CardHeaderProps {
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
    action?: React.ReactNode;
    style?: ViewStyle;
}

interface CardContentProps {
    children: React.ReactNode;
    style?: ViewStyle;
}

interface CardFooterProps {
    children: React.ReactNode;
    style?: ViewStyle;
}

export function Card({ children, style, elevated = false, noPadding = false }: CardProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    return (
        <View
            style={[
                styles.card,
                {
                    backgroundColor: elevated ? colors.cardElevated : colors.card,
                    borderColor: colors.border,
                },
                elevated && Shadows.md,
                noPadding && styles.noPadding,
                style,
            ]}
        >
            {children}
        </View>
    );
}

export function CardHeader({ title, subtitle, icon, action, style }: CardHeaderProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    return (
        <View style={[styles.header, style]}>
            <View style={styles.headerLeft}>
                {icon && <View style={styles.headerIcon}>{icon}</View>}
                <View style={styles.headerText}>
                    <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
                    {subtitle && (
                        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                            {subtitle}
                        </Text>
                    )}
                </View>
            </View>
            {action && <View style={styles.headerAction}>{action}</View>}
        </View>
    );
}

export function CardContent({ children, style }: CardContentProps) {
    return <View style={[styles.content, style]}>{children}</View>;
}

export function CardFooter({ children, style }: CardFooterProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    return (
        <View style={[styles.footer, { borderTopColor: colors.borderLight }, style]}>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: Spacing.radius.xl,
        borderWidth: 1,
        padding: Spacing.cardPadding,
        overflow: 'hidden',
    },
    noPadding: {
        padding: 0,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Spacing.md,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    headerIcon: {
        marginRight: Spacing.sm,
    },
    headerText: {
        flex: 1,
    },
    title: {
        ...Typography.styles.h4,
    },
    subtitle: {
        ...Typography.styles.bodySmall,
        marginTop: 2,
    },
    content: {
        // Minimal styling to allow flexible content
    },
    footer: {
        marginTop: Spacing.md,
        paddingTop: Spacing.md,
        borderTopWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerAction: {},
});
