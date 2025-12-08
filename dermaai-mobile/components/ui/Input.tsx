/**
 * Reusable Input component for DermaAssistAI
 * Text input with label, placeholder, and error states
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TextInputProps,
    ViewStyle,
    TextStyle,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';
import { useColorScheme } from '@/components/useColorScheme';

interface InputProps extends Omit<TextInputProps, 'style'> {
    label?: string;
    error?: string;
    hint?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    containerStyle?: ViewStyle;
    inputStyle?: TextStyle;
}

export function Input({
    label,
    error,
    hint,
    leftIcon,
    rightIcon,
    containerStyle,
    inputStyle,
    ...props
}: InputProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const [isFocused, setIsFocused] = useState(false);

    const borderColor = error
        ? colors.destructive
        : isFocused
            ? colors.primary
            : colors.border;

    return (
        <View style={[styles.container, containerStyle]}>
            {label && (
                <Text style={[styles.label, { color: colors.text }]}>
                    {label}
                </Text>
            )}
            <View
                style={[
                    styles.inputContainer,
                    {
                        backgroundColor: colors.background,
                        borderColor,
                    },
                    isFocused && styles.inputFocused,
                    error && styles.inputError,
                ]}
            >
                {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
                <TextInput
                    style={[
                        styles.input,
                        { color: colors.text },
                        leftIcon ? styles.inputWithLeftIcon : undefined,
                        rightIcon ? styles.inputWithRightIcon : undefined,
                        inputStyle,
                    ]}
                    placeholderTextColor={colors.textMuted}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    {...props}
                />
                {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
            </View>
            {error && (
                <Text style={[styles.error, { color: colors.destructive }]}>
                    {error}
                </Text>
            )}
            {hint && !error && (
                <Text style={[styles.hint, { color: colors.textMuted }]}>
                    {hint}
                </Text>
            )}
        </View>
    );
}

interface TextAreaProps extends InputProps {
    numberOfLines?: number;
}

export function TextArea({ numberOfLines = 4, inputStyle, ...props }: TextAreaProps) {
    return (
        <Input
            {...props}
            multiline
            numberOfLines={numberOfLines}
            inputStyle={{
                minHeight: numberOfLines * 24,
                paddingTop: Spacing.md,
                ...inputStyle,
            } as TextStyle}
        />
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: Spacing.base,
    },
    label: {
        ...Typography.styles.label,
        marginBottom: Spacing.sm,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderRadius: Spacing.radius.base,
        overflow: 'hidden',
    },
    inputFocused: {
        borderWidth: 2,
    },
    inputError: {
        borderWidth: 2,
    },
    input: {
        flex: 1,
        height: Spacing.inputHeight,
        paddingHorizontal: Spacing.md,
        ...Typography.styles.body,
    },
    inputWithLeftIcon: {
        paddingLeft: Spacing.xs,
    },
    inputWithRightIcon: {
        paddingRight: Spacing.xs,
    },
    leftIcon: {
        paddingLeft: Spacing.md,
    },
    rightIcon: {
        paddingRight: Spacing.md,
    },
    error: {
        ...Typography.styles.caption,
        marginTop: Spacing.xs,
    },
    hint: {
        ...Typography.styles.caption,
        marginTop: Spacing.xs,
    },
});
