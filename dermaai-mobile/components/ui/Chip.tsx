/**
 * Chip component for selectable options
 * Used for symptoms, lesion locations, etc.
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';
import { useColorScheme } from '@/components/useColorScheme';

interface ChipProps {
    label: string;
    selected?: boolean;
    onPress?: () => void;
    disabled?: boolean;
    style?: ViewStyle;
}

export function Chip({
    label,
    selected = false,
    onPress,
    disabled = false,
    style,
}: ChipProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    return (
        <TouchableOpacity
            style={[
                styles.chip,
                {
                    backgroundColor: selected ? colors.primary : colors.background,
                    borderColor: selected ? colors.primary : colors.border,
                },
                disabled && styles.disabled,
                style,
            ]}
            onPress={onPress}
            disabled={disabled}
            activeOpacity={0.7}
        >
            <Text
                style={[
                    styles.label,
                    {
                        color: selected ? colors.primaryForeground : colors.text,
                    },
                ]}
            >
                {label}
            </Text>
        </TouchableOpacity>
    );
}

// Chip group for managing multiple selections
interface ChipGroupProps {
    options: { label: string; value: string }[];
    selected: string[];
    onSelectionChange: (selected: string[]) => void;
    multiple?: boolean;
    style?: ViewStyle;
}

export function ChipGroup({
    options,
    selected,
    onSelectionChange,
    multiple = true,
    style,
}: ChipGroupProps) {
    const handlePress = (value: string) => {
        if (multiple) {
            if (selected.includes(value)) {
                onSelectionChange(selected.filter((v) => v !== value));
            } else {
                onSelectionChange([...selected, value]);
            }
        } else {
            onSelectionChange(selected.includes(value) ? [] : [value]);
        }
    };

    return (
        <TouchableOpacity
            style={[styles.chipGroup, style]}
            activeOpacity={1}
        >
            {options.map((option) => (
                <Chip
                    key={option.value}
                    label={option.label}
                    selected={selected.includes(option.value)}
                    onPress={() => handlePress(option.value)}
                />
            ))}
        </TouchableOpacity>
    );
}

// Simple chip list for displaying values
interface ChipListProps {
    values: string[];
    style?: ViewStyle;
}

export function ChipList({ values, style }: ChipListProps) {
    return (
        <TouchableOpacity
            style={[styles.chipGroup, style]}
            activeOpacity={1}
        >
            {values.map((value, index) => (
                <Chip key={index} label={value} selected={false} disabled />
            ))}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    chip: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: Spacing.radius.md,
        borderWidth: 1.5,
        marginRight: Spacing.sm,
        marginBottom: Spacing.sm,
    },
    label: {
        ...Typography.styles.buttonSmall,
    },
    disabled: {
        opacity: 0.6,
    },
    chipGroup: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
});
