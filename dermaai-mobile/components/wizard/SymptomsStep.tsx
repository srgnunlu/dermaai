/**
 * Symptoms Step - Premium Clean Design
 * Organized symptom selection with professional icons
 */

import React, { useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Animated,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import {
    ChevronLeft,
    ArrowRight,
    Check,
    // Symptom icons
    Fingerprint,      // Kaşıntı - itching
    Zap,              // Ağrı - pain
    Flame,            // Yanma - burning
    CircleDot,        // Kızarıklık - redness
    Expand,           // Şişlik - swelling
    Droplets,         // Sızıntı - discharge
    Layers,           // Kabuklanma - crusting
    Snowflake,        // Pullanma - scaling
    Wind,             // Kuruluk - dryness
    ShieldAlert,      // Hassasiyet - sensitivity
    MinusCircle,      // Uyuşma - numbness
    Gem,              // Sertlik - hardness
    Droplet,          // Kanama - bleeding
    Palette,          // Renk değişimi - color change
    Sparkles,         // Yok - none
} from 'lucide-react-native';
import { Colors, Gradients } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing, Shadows } from '@/constants/Spacing';
import { Duration } from '@/constants/Animations';
import { Translations } from '@/constants/Translations';
import { useColorScheme } from '@/components/useColorScheme';
import { useLanguage } from '@/contexts/LanguageContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SymptomsStepProps {
    symptoms: string[];
    duration: string;
    additionalSymptoms: string;
    medicalHistory: string[];
    onSymptomsChange: (symptoms: string[]) => void;
    onDurationChange: (duration: string) => void;
    onAdditionalSymptomsChange: (text: string) => void;
    onMedicalHistoryChange: (history: string[]) => void;
    onNext: () => void;
    onBack: () => void;
}

// Comprehensive symptom options with professional icons
const getSymptomOptions = (language: 'tr' | 'en') => [
    { id: 'itching', label: Translations.itching[language], IconComponent: Fingerprint },
    { id: 'pain', label: Translations.pain[language], IconComponent: Zap },
    { id: 'burning', label: Translations.burning[language], IconComponent: Flame },
    { id: 'redness', label: language === 'tr' ? 'Kızarıklık' : 'Redness', IconComponent: CircleDot },
    { id: 'swelling', label: Translations.swelling[language], IconComponent: Expand },
    { id: 'crusting', label: language === 'tr' ? 'Kabuklanma' : 'Crusting', IconComponent: Layers },
    { id: 'scaling', label: Translations.scaling[language], IconComponent: Snowflake },
    { id: 'dryness', label: language === 'tr' ? 'Kuruluk' : 'Dryness', IconComponent: Wind },
    { id: 'sensitivity', label: language === 'tr' ? 'Hassasiyet' : 'Sensitivity', IconComponent: ShieldAlert },
    { id: 'numbness', label: language === 'tr' ? 'Uyuşma' : 'Numbness', IconComponent: MinusCircle },
    { id: 'hardness', label: language === 'tr' ? 'Sertlik' : 'Hardness', IconComponent: Gem },
    { id: 'bleeding', label: Translations.bleeding[language], IconComponent: Droplet },
];

// Duration options
const getDurationOptions = (language: 'tr' | 'en') => [
    { id: 'days', label: language === 'tr' ? 'Günler' : 'Days' },
    { id: 'weeks', label: language === 'tr' ? 'Haftalar' : 'Weeks' },
    { id: 'months', label: language === 'tr' ? 'Aylar' : 'Months' },
    { id: 'years', label: language === 'tr' ? 'Yıllar' : 'Years' },
];

// Calculate dimensions for 3-column grid
const HORIZONTAL_PADDING = 24;
const CARD_GAP = 8;
const CARD_WIDTH = (SCREEN_WIDTH - (HORIZONTAL_PADDING * 2) - (CARD_GAP * 2)) / 3;
const CARD_HEIGHT = 70;

// Symptom card component
const SymptomCard = ({
    option,
    selected,
    onPress,
    index,
    colors,
    gradients,
}: {
    option: { id: string; label: string; IconComponent: any };
    selected: boolean;
    onPress: () => void;
    index: number;
    colors: typeof Colors.light;
    gradients: typeof Gradients.light | typeof Gradients.dark;
}) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const IconComponent = option.IconComponent;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: Duration.fast,
            delay: index * 20,
            useNativeDriver: true,
        }).start();
    }, []);

    const handlePress = async () => {
        await Haptics.selectionAsync();
        Animated.sequence([
            Animated.timing(scaleAnim, { toValue: 0.95, duration: 40, useNativeDriver: true }),
            Animated.spring(scaleAnim, { toValue: 1, friction: 4, tension: 60, useNativeDriver: true }),
        ]).start();
        onPress();
    };

    if (selected) {
        return (
            <Animated.View
                style={[
                    styles.symptomCardWrapper,
                    { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
                ]}
            >
                <TouchableOpacity onPress={handlePress} activeOpacity={0.8} style={{ flex: 1 }}>
                    <LinearGradient
                        colors={gradients.primary}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.symptomCardSelected}
                    >
                        <View style={styles.checkBadge}>
                            <Check size={8} color={colors.primary} strokeWidth={3} />
                        </View>
                        <View style={styles.cardContentVertical}>
                            <IconComponent size={18} color="#FFFFFF" strokeWidth={1.8} />
                            <Text style={styles.symptomLabelSelected} numberOfLines={1}>{option.label}</Text>
                        </View>
                    </LinearGradient>
                </TouchableOpacity>
            </Animated.View>
        );
    }

    return (
        <Animated.View
            style={[
                styles.symptomCardWrapper,
                { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
            ]}
        >
            <TouchableOpacity onPress={handlePress} activeOpacity={0.8} style={{ flex: 1 }}>
                <BlurView intensity={50} tint="light" style={styles.symptomCardBlur}>
                    <View style={styles.symptomCard}>
                        <View style={styles.cardContentVertical}>
                            <IconComponent size={18} color="#0891B2" strokeWidth={1.8} />
                            <Text style={styles.symptomLabel} numberOfLines={1}>{option.label}</Text>
                        </View>
                    </View>
                </BlurView>
            </TouchableOpacity>
        </Animated.View>
    );
};

// Duration chip component
const DurationChip = ({
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
            Animated.timing(scaleAnim, { toValue: 0.95, duration: 50, useNativeDriver: true }),
            Animated.spring(scaleAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }),
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
                        style={styles.durationChipSelected}
                    >
                        <Text style={styles.durationChipTextSelected}>{label}</Text>
                    </LinearGradient>
                ) : (
                    <View style={styles.durationChip}>
                        <Text style={styles.durationChipText}>{label}</Text>
                    </View>
                )}
            </TouchableOpacity>
        </Animated.View>
    );
};

export function SymptomsStep({
    symptoms,
    duration,
    additionalSymptoms,
    medicalHistory,
    onSymptomsChange,
    onDurationChange,
    onAdditionalSymptomsChange,
    onMedicalHistoryChange,
    onNext,
    onBack,
}: SymptomsStepProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const gradients = Gradients[colorScheme];
    const { language } = useLanguage();
    const SYMPTOM_OPTIONS = getSymptomOptions(language);
    const DURATION_OPTIONS = getDurationOptions(language);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const buttonScaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: Duration.normal,
            useNativeDriver: true,
        }).start();
    }, []);

    const toggleSymptom = (id: string) => {
        if (symptoms.includes(id)) {
            onSymptomsChange(symptoms.filter(s => s !== id));
        } else {
            onSymptomsChange([...symptoms, id]);
        }
    };

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
                <View style={styles.headerRight} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 120 : 0}
            >
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="interactive"
                >
                    {/* Title */}
                    <Text style={[styles.title, { color: colors.text }]}>
                        {Translations.selectSymptoms[language]}
                    </Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                        {language === 'tr' ? 'Mevcut belirtileri seçin' : 'Select current symptoms'}
                    </Text>

                    {/* Symptoms Grid - 3 columns */}
                    <View style={styles.symptomsGrid}>
                        {SYMPTOM_OPTIONS.map((option, index) => (
                            <SymptomCard
                                key={option.id}
                                option={option}
                                selected={symptoms.includes(option.id)}
                                onPress={() => toggleSymptom(option.id)}
                                index={index}
                                colors={colors}
                                gradients={gradients}
                            />
                        ))}
                    </View>

                    {/* Duration */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                            {Translations.howLong[language]} <Text style={[styles.optionalLabel, { color: colors.textSecondary }]}>({language === 'tr' ? 'opsiyonel' : 'optional'})</Text>
                        </Text>
                        <View style={styles.durationRow}>
                            {DURATION_OPTIONS.map((option) => (
                                <DurationChip
                                    key={option.id}
                                    label={option.label}
                                    selected={duration === option.id}
                                    onPress={() => onDurationChange(duration === option.id ? '' : option.id)}
                                    colors={colors}
                                    gradients={gradients}
                                />
                            ))}
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                            {Translations.additionalSymptoms[language]} <Text style={[styles.optionalLabel, { color: colors.textSecondary }]}>({language === 'tr' ? 'opsiyonel' : 'optional'})</Text>
                        </Text>
                        <View style={styles.textAreaContainer}>
                            <BlurView intensity={50} tint="light" style={styles.textAreaBlur}>
                                <TextInput
                                    style={styles.textArea}
                                    placeholder={language === 'tr' ? 'Eklemek istediğiniz bilgiler...' : 'Additional information...'}
                                    placeholderTextColor="#64748B"
                                    value={additionalSymptoms}
                                    onChangeText={onAdditionalSymptomsChange}
                                    multiline
                                    numberOfLines={3}
                                    textAlignVertical="top"
                                    scrollEnabled={false}
                                />
                            </BlurView>
                        </View>
                    </View>

                    {/* Extra padding for keyboard */}
                    <View style={{ height: 100 }} />
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
                            <Text style={styles.continueButtonText}>{Translations.next[language]}</Text>
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
        paddingVertical: Spacing.sm,
    },
    backButton: {
        padding: Spacing.sm,
    },
    appName: {
        fontSize: 16,
        fontWeight: '500',
        letterSpacing: 0.5,
    },
    headerRight: {
        width: 40,
    },
    keyboardView: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: HORIZONTAL_PADDING,
        paddingBottom: Spacing.lg,
    },
    title: {
        fontSize: 26,
        fontWeight: '700',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 15,
        color: '#64748B',
        marginBottom: Spacing.md,
    },
    selectedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: Spacing.md,
        borderRadius: 8,
        marginBottom: Spacing.md,
        alignSelf: 'flex-start',
    },
    selectedText: {
        fontSize: 13,
        fontWeight: '600',
    },
    symptomsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: CARD_GAP,
        marginBottom: Spacing.lg,
    },
    symptomCardWrapper: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
    },
    symptomCardBlur: {
        height: CARD_HEIGHT,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.6)',
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
    },
    symptomCard: {
        height: CARD_HEIGHT,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    symptomCardSelected: {
        height: CARD_HEIGHT,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadows.md,
    },
    cardContentVertical: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingHorizontal: 4,
    },
    checkBadge: {
        position: 'absolute',
        top: 4,
        right: 4,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    symptomLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#1E293B',
        textAlign: 'center',
    },
    symptomLabelSelected: {
        fontSize: 11,
        fontWeight: '600',
        color: '#FFFFFF',
        textAlign: 'center',
    },
    section: {
        marginBottom: Spacing.lg,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: Spacing.sm,
    },
    optionalLabel: {
        fontWeight: '400',
    },
    durationRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
    },
    durationChip: {
        paddingHorizontal: Spacing.md,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.6)',
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
    },
    durationChipSelected: {
        paddingHorizontal: Spacing.md,
        paddingVertical: 10,
        borderRadius: 10,
        ...Shadows.sm,
    },
    durationChipText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#334155',
    },
    durationChipTextSelected: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    textAreaContainer: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    textAreaBlur: {
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.6)',
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
    },
    textArea: {
        minHeight: 60,
        paddingHorizontal: Spacing.base,
        paddingVertical: Spacing.md,
        fontSize: 14,
        color: '#1E293B',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    footer: {
        padding: Spacing.lg,
        paddingBottom: Spacing.xl,
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
