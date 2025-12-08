/**
 * Patient Info Step - Premium Clean Design
 * Minimal patient information collection
 */

import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Animated,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import {
    ChevronLeft,
    ArrowRight,
    Check,
} from 'lucide-react-native';
import { Colors, Gradients } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing, Shadows } from '@/constants/Spacing';
import { Duration } from '@/constants/Animations';
import { useColorScheme } from '@/components/useColorScheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface PatientInfoStepProps {
    patientId: string;
    age: string;
    gender: string;
    skinType: string;
    onPatientIdChange: (value: string) => void;
    onAgeChange: (value: string) => void;
    onGenderChange: (value: string) => void;
    onSkinTypeChange: (value: string) => void;
    onNext: () => void;
    onBack: () => void;
    onSkip: () => void;
}

// Selection chip - Clean design
const SelectionChip = ({
    label,
    selected,
    onPress,
    colors,
    gradients,
}: {
    label: string;
    selected: boolean;
    onPress: () => void;
    colors: typeof Colors.light;
    gradients: typeof Gradients.light | typeof Gradients.dark;
}) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePress = async () => {
        await Haptics.selectionAsync();
        Animated.sequence([
            Animated.timing(scaleAnim, {
                toValue: 0.95,
                duration: 50,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 3,
                tension: 40,
                useNativeDriver: true,
            }),
        ]).start();
        onPress();
    };

    return (
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
                {selected ? (
                    <LinearGradient
                        colors={gradients.primary}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.chipSelected}
                    >
                        <Check size={14} color="#FFFFFF" strokeWidth={3} />
                        <Text style={styles.chipTextSelected}>{label}</Text>
                    </LinearGradient>
                ) : (
                    <View style={[styles.chip, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.chipText, { color: colors.textSecondary }]}>{label}</Text>
                    </View>
                )}
            </TouchableOpacity>
        </Animated.View>
    );
};

// Gender options
const GENDER_OPTIONS = [
    { label: 'Erkek', value: 'male' },
    { label: 'Kadın', value: 'female' },
    { label: 'Diğer', value: 'other' },
];

// Skin type options - Simplified
const SKIN_TYPE_OPTIONS = [
    { label: 'Açık', value: 'light' },
    { label: 'Orta', value: 'medium' },
    { label: 'Koyu', value: 'dark' },
];

export function PatientInfoStep({
    patientId,
    age,
    gender,
    skinType,
    onPatientIdChange,
    onAgeChange,
    onGenderChange,
    onSkinTypeChange,
    onNext,
    onBack,
    onSkip,
}: PatientInfoStepProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const gradients = Gradients[colorScheme];

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const buttonScaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: Duration.normal,
            useNativeDriver: true,
        }).start();
    }, []);

    const handlePressIn = () => {
        Animated.spring(buttonScaleAnim, { toValue: 0.97, useNativeDriver: true }).start();
    };

    const handlePressOut = () => {
        Animated.spring(buttonScaleAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start();
    };

    const handleNext = async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onNext();
    };

    return (
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <ChevronLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.appName, { color: colors.textSecondary }]}>
                    DermaAssist<Text style={{ color: colors.primary }}>AI</Text>
                </Text>
                <TouchableOpacity onPress={onSkip} style={styles.skipButton}>
                    <Text style={[styles.skipText, { color: colors.primary }]}>Atla</Text>
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Title */}
                    <Text style={[styles.title, { color: colors.text }]}>
                        Hasta Bilgileri
                    </Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                        Bu bilgiler isteğe bağlıdır
                    </Text>

                    {/* Age Input with glassmorphism */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.inputLabel, { color: colors.text }]}>Yaş</Text>
                        <BlurView intensity={60} tint="light" style={styles.inputBlur}>
                            <TextInput
                                style={styles.input}
                                placeholder="Yaşınızı girin"
                                placeholderTextColor="#64748B"
                                value={age}
                                onChangeText={onAgeChange}
                                keyboardType="numeric"
                                maxLength={3}
                            />
                        </BlurView>
                    </View>

                    {/* Gender Selection */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.inputLabel, { color: colors.text }]}>Cinsiyet</Text>
                        <View style={styles.chipsRow}>
                            {GENDER_OPTIONS.map((option) => (
                                <SelectionChip
                                    key={option.value}
                                    label={option.label}
                                    selected={gender === option.value}
                                    onPress={() => onGenderChange(option.value)}
                                    colors={colors}
                                    gradients={gradients}
                                />
                            ))}
                        </View>
                    </View>

                    {/* Skin Type Selection */}
                    <View style={styles.inputGroup}>
                        <Text style={[styles.inputLabel, { color: colors.text }]}>Cilt Tonu</Text>
                        <View style={styles.chipsRow}>
                            {SKIN_TYPE_OPTIONS.map((option) => (
                                <SelectionChip
                                    key={option.value}
                                    label={option.label}
                                    selected={skinType === option.value}
                                    onPress={() => onSkinTypeChange(option.value)}
                                    colors={colors}
                                    gradients={gradients}
                                />
                            ))}
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Footer */}
            <View style={styles.footer}>
                <Animated.View style={[styles.footerButton, { transform: [{ scale: buttonScaleAnim }] }]}>
                    <TouchableOpacity
                        onPress={handleNext}
                        onPressIn={handlePressIn}
                        onPressOut={handlePressOut}
                        activeOpacity={1}
                    >
                        <LinearGradient
                            colors={gradients.primary}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.continueButton}
                        >
                            <Text style={styles.continueButtonText}>Devam</Text>
                            <ArrowRight size={20} color="#FFFFFF" />
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
    },
    backButton: {
        padding: Spacing.sm,
    },
    appName: {
        fontSize: 16,
        fontWeight: '500',
        letterSpacing: 0.5,
    },
    skipButton: {
        padding: Spacing.sm,
    },
    skipText: {
        fontSize: 15,
        fontWeight: '600',
    },
    keyboardView: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.xl,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        marginBottom: Spacing.xs,
    },
    subtitle: {
        ...Typography.styles.body,
        marginBottom: Spacing['2xl'],
    },
    inputGroup: {
        marginBottom: Spacing.xl,
    },
    inputLabel: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: Spacing.sm,
    },
    inputBlur: {
        borderRadius: 14,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    input: {
        height: 52,
        paddingHorizontal: Spacing.base,
        fontSize: 16,
        color: '#1E293B',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
    },
    chipsRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    chip: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    chipSelected: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: 12,
        borderRadius: 12,
        gap: 6,
        ...Shadows.sm,
    },
    chipText: {
        fontSize: 15,
        fontWeight: '500',
        color: '#334155',
    },
    chipTextSelected: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    footer: {
        padding: Spacing.xl,
    },
    footerButton: {
        width: '100%',
    },
    continueButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 14,
        gap: Spacing.sm,
    },
    continueButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '600',
    },
});
