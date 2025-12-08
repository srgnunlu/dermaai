/**
 * Animated Chip Component for DermaAssistAI
 * Premium selection chip with animations and haptic feedback
 */

import React, { useRef, useEffect } from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    Animated,
    Easing,
    View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Check } from 'lucide-react-native';
import { Colors, Gradients, Glow } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing, Shadows } from '@/constants/Spacing';
import { Duration } from '@/constants/Animations';
import { useColorScheme } from '@/components/useColorScheme';

interface AnimatedChipProps {
    label: string;
    value: string;
    selected: boolean;
    onPress: (value: string) => void;
    icon?: React.ReactNode;
    size?: 'sm' | 'md';
}

export function AnimatedChip({
    label,
    value,
    selected,
    onPress,
    icon,
    size = 'md',
}: AnimatedChipProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const gradients = Gradients[colorScheme];

    const scaleAnim = useRef(new Animated.Value(1)).current;
    const selectAnim = useRef(new Animated.Value(selected ? 1 : 0)).current;
    const bounceAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.spring(selectAnim, {
            toValue: selected ? 1 : 0,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
        }).start();

        if (selected) {
            // Bounce effect on selection
            Animated.sequence([
                Animated.timing(bounceAnim, {
                    toValue: 1,
                    duration: Duration.fast,
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(bounceAnim, {
                    toValue: 0,
                    duration: Duration.fast,
                    easing: Easing.in(Easing.ease),
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [selected]);

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.95,
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
        await Haptics.selectionAsync();
        onPress(value);
    };

    const scale = Animated.add(
        scaleAnim,
        bounceAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 0.05],
        })
    );

    const checkmarkScale = selectAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
    });

    const checkmarkOpacity = selectAnim;

    const containerHeight = size === 'sm' ? 32 : 38;
    const fontSize = size === 'sm' ? 12 : 14;
    const paddingHorizontal = size === 'sm' ? Spacing.sm : Spacing.md;

    return (
        <Animated.View style={{ transform: [{ scale }] }}>
            <TouchableOpacity
                onPress={handlePress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                activeOpacity={1}
            >
                {selected ? (
                    <View style={styles.selectedContainer}>
                        {/* Glow Effect */}
                        <View
                            style={[
                                styles.glow,
                                { backgroundColor: Glow[colorScheme].primary },
                            ]}
                        />
                        <LinearGradient
                            colors={gradients.primary}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={[
                                styles.chipSelected,
                                { height: containerHeight, paddingHorizontal },
                            ]}
                        >
                            {/* Checkmark */}
                            <Animated.View
                                style={[
                                    styles.checkmark,
                                    {
                                        opacity: checkmarkOpacity,
                                        transform: [{ scale: checkmarkScale }],
                                    },
                                ]}
                            >
                                <Check size={14} color="#FFFFFF" strokeWidth={3} />
                            </Animated.View>

                            {icon && <View style={styles.iconContainer}>{icon}</View>}

                            <Text
                                style={[
                                    styles.labelSelected,
                                    { fontSize },
                                ]}
                            >
                                {label}
                            </Text>
                        </LinearGradient>
                    </View>
                ) : (
                    <View
                        style={[
                            styles.chip,
                            {
                                height: containerHeight,
                                paddingHorizontal,
                                backgroundColor: colors.card,
                                borderColor: colors.border,
                            },
                        ]}
                    >
                        {icon && (
                            <View style={styles.iconContainer}>
                                {icon}
                            </View>
                        )}
                        <Text
                            style={[
                                styles.label,
                                { fontSize, color: colors.textSecondary },
                            ]}
                        >
                            {label}
                        </Text>
                    </View>
                )}
            </TouchableOpacity>
        </Animated.View>
    );
}

// Chip Group that uses AnimatedChip
interface AnimatedChipGroupProps {
    options: { label: string; value: string; icon?: React.ReactNode }[];
    selected: string[];
    onSelectionChange: (selected: string[]) => void;
    multiple?: boolean;
    size?: 'sm' | 'md';
}

export function AnimatedChipGroup({
    options,
    selected,
    onSelectionChange,
    multiple = false,
    size = 'md',
}: AnimatedChipGroupProps) {
    const handleChipPress = (value: string) => {
        if (multiple) {
            if (selected.includes(value)) {
                onSelectionChange(selected.filter((v) => v !== value));
            } else {
                onSelectionChange([...selected, value]);
            }
        } else {
            if (selected.includes(value)) {
                onSelectionChange([]);
            } else {
                onSelectionChange([value]);
            }
        }
    };

    return (
        <View style={styles.group}>
            {options.map((option) => (
                <AnimatedChip
                    key={option.value}
                    label={option.label}
                    value={option.value}
                    selected={selected.includes(option.value)}
                    onPress={handleChipPress}
                    icon={option.icon}
                    size={size}
                />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    selectedContainer: {
        position: 'relative',
    },
    glow: {
        position: 'absolute',
        top: -2,
        left: -2,
        right: -2,
        bottom: -2,
        borderRadius: Spacing.radius.full,
        opacity: 0.5,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: Spacing.radius.full,
        borderWidth: 1.5,
        gap: Spacing.xs,
    },
    chipSelected: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: Spacing.radius.full,
        gap: Spacing.xs,
        ...Shadows.sm,
    },
    checkmark: {
        marginRight: 2,
    },
    iconContainer: {
        marginRight: 2,
    },
    label: {
        ...Typography.styles.label,
    },
    labelSelected: {
        ...Typography.styles.label,
        color: '#FFFFFF',
        fontWeight: '600',
    },
    group: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
    },
});
