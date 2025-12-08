/**
 * Review Step - Premium Clean Design
 * Summary with edit options and analyze CTA
 */

import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Animated,
    ScrollView,
    Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import {
    ChevronLeft,
    Brain,
    Edit2,
    Camera,
    User,
    MapPin,
    Stethoscope,
    AlertTriangle,
} from 'lucide-react-native';
import { Colors, Gradients } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing, Shadows } from '@/constants/Spacing';
import { Duration } from '@/constants/Animations';
import { Translations } from '@/constants/Translations';
import { useColorScheme } from '@/components/useColorScheme';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Import wizard state type
interface WizardState {
    currentStep: number;
    images: string[];
    patientId: string;
    age: string;
    gender: string;
    skinType: string;
    lesionLocations: string[];
    symptoms: string[];
    additionalSymptoms: string;
    symptomDuration: string;
    medicalHistory: string[];
}

interface ReviewStepProps {
    state: WizardState;
    onEdit: (step: number, direction?: 'forward' | 'back') => void;
    onBack: () => void;
    onStartAnalysis: () => void;
}

// Label mappings
const getLocationLabels = (language: 'tr' | 'en'): Record<string, string> => ({
    face: Translations.face[language],
    scalp: language === 'tr' ? 'Saçlı Deri' : 'Scalp',
    neck: Translations.neck[language],
    chest: Translations.chest[language],
    back: Translations.bodyBack[language],
    abdomen: Translations.abdomen[language],
    arms: Translations.arms[language],
    hands: Translations.hands[language],
    legs: Translations.legs[language],
    feet: Translations.feet[language],
});

const getSymptomLabels = (language: 'tr' | 'en'): Record<string, string> => ({
    itching: Translations.itching[language],
    pain: Translations.pain[language],
    burning: Translations.burning[language],
    bleeding: Translations.bleeding[language],
    swelling: Translations.swelling[language],
    scaling: Translations.scaling[language],
    color_change: Translations.colorChange[language],
    none: language === 'tr' ? 'Yok' : 'None',
});

// Review section
const ReviewSection = ({
    icon: Icon,
    title,
    onEdit,
    children,
    colors,
}: {
    icon: any;
    title: string;
    onEdit: () => void;
    children: React.ReactNode;
    colors: typeof Colors.light;
}) => (
    <BlurView intensity={60} tint="light" style={styles.sectionBlur}>
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                    <Icon size={18} color={colors.primary} />
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
                </View>
                <TouchableOpacity onPress={onEdit} style={styles.editBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Edit2 size={16} color={colors.primary} />
                </TouchableOpacity>
            </View>
            {children}
        </View>
    </BlurView>
);

export function ReviewStep({
    state,
    onEdit,
    onBack,
    onStartAnalysis,
}: ReviewStepProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const gradients = Gradients[colorScheme];
    const { language } = useLanguage();
    const LOCATION_LABELS = getLocationLabels(language);
    const SYMPTOM_LABELS = getSymptomLabels(language);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const buttonScaleAnim = useRef(new Animated.Value(1)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: Duration.normal,
            useNativeDriver: true,
        }).start();

        // Pulse animation for analyze button
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.02,
                    duration: 1200,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1200,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const handlePressIn = () => {
        Animated.spring(buttonScaleAnim, { toValue: 0.97, useNativeDriver: true }).start();
    };

    const handlePressOut = () => {
        Animated.spring(buttonScaleAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start();
    };

    const handleStartAnalysis = async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        onStartAnalysis();
    };

    const hasPatientInfo = state.age || state.gender || state.skinType;

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

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Title */}
                <Text style={[styles.title, { color: colors.text }]}>
                    {Translations.reviewSummary[language]}
                </Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    {language === 'tr'
                        ? 'Bilgileri kontrol edin ve analizi başlatın'
                        : 'Review information and start analysis'}
                </Text>

                {/* Images Section */}
                <ReviewSection
                    icon={Camera}
                    title={language === 'tr' ? 'Görseller' : 'Images'}
                    onEdit={() => onEdit(1, 'back')}
                    colors={colors}
                >
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imagesRow}>
                        {state.images.map((uri, index) => (
                            <View key={uri} style={styles.imageThumb}>
                                <Image source={{ uri }} style={[styles.thumbImage, { borderColor: colors.border }]} />
                                <View style={[styles.imageBadge, { backgroundColor: colors.primary }]}>
                                    <Text style={styles.imageBadgeText}>{index + 1}</Text>
                                </View>
                            </View>
                        ))}
                    </ScrollView>
                </ReviewSection>

                {/* Patient Info */}
                {hasPatientInfo && (
                    <ReviewSection
                        icon={User}
                        title={Translations.patientInfo[language]}
                        onEdit={() => onEdit(2, 'back')}
                        colors={colors}
                    >
                        <View style={styles.infoRow}>
                            {state.age && (
                                <View style={styles.infoItem}>
                                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                                        {Translations.age[language]}
                                    </Text>
                                    <Text style={[styles.infoValue, { color: colors.text }]}>{state.age}</Text>
                                </View>
                            )}
                            {state.gender && (
                                <View style={styles.infoItem}>
                                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                                        {Translations.gender[language]}
                                    </Text>
                                    <Text style={[styles.infoValue, { color: colors.text }]}>
                                        {state.gender === 'male'
                                            ? (language === 'tr' ? 'Erkek' : 'Male')
                                            : state.gender === 'female'
                                                ? (language === 'tr' ? 'Kadın' : 'Female')
                                                : (language === 'tr' ? 'Diğer' : 'Other')}
                                    </Text>
                                </View>
                            )}
                            {state.skinType && (
                                <View style={styles.infoItem}>
                                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                                        {Translations.skinType[language]}
                                    </Text>
                                    <Text style={[styles.infoValue, { color: colors.text }]}>
                                        {state.skinType === 'light'
                                            ? (language === 'tr' ? 'Açık' : 'Light')
                                            : state.skinType === 'medium'
                                                ? (language === 'tr' ? 'Orta' : 'Medium')
                                                : (language === 'tr' ? 'Koyu' : 'Dark')}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </ReviewSection>
                )}

                {/* Location Section */}
                <ReviewSection
                    icon={MapPin}
                    title={Translations.location[language]}
                    onEdit={() => onEdit(3, 'back')}
                    colors={colors}
                >
                    <View style={styles.tagsWrap}>
                        {state.lesionLocations.map((loc) => (
                            <View key={loc} style={[styles.tag, { backgroundColor: `${colors.primary}15` }]}>
                                <Text style={[styles.tagText, { color: colors.primary }]}>
                                    {LOCATION_LABELS[loc] || loc}
                                </Text>
                            </View>
                        ))}
                    </View>
                </ReviewSection>

                {/* Symptoms Section */}
                {state.symptoms.length > 0 && (
                    <ReviewSection
                        icon={Stethoscope}
                        title={Translations.selectSymptoms[language]}
                        onEdit={() => onEdit(4, 'back')}
                        colors={colors}
                    >
                        <View style={styles.tagsWrap}>
                            {state.symptoms.map((symptom) => (
                                <View key={symptom} style={[styles.tag, { backgroundColor: `${colors.warning}15` }]}>
                                    <Text style={[styles.tagText, { color: colors.warning }]}>
                                        {SYMPTOM_LABELS[symptom] || symptom}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </ReviewSection>
                )}

                {/* Disclaimer */}
                <LinearGradient
                    colors={[`${colors.warning}12`, `${colors.warning}05`]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.disclaimer}
                >
                    <AlertTriangle size={18} color={colors.warning} />
                    <Text style={[styles.disclaimerText, { color: colors.warning }]}>
                        {Translations.medicalDisclaimer[language]}
                    </Text>
                </LinearGradient>
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                <Animated.View style={[styles.footerButton, { transform: [{ scale: Animated.multiply(buttonScaleAnim, pulseAnim) }] }]}>
                    <TouchableOpacity
                        onPress={handleStartAnalysis}
                        onPressIn={handlePressIn}
                        onPressOut={handlePressOut}
                        activeOpacity={1}
                    >
                        <LinearGradient
                            colors={gradients.primary}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.analyzeButton}
                        >
                            <Brain size={22} color="#FFFFFF" />
                            <Text style={styles.analyzeButtonText}>
                                {Translations.startAnalysis[language]}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </Animated.View >
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
    headerRight: {
        width: 40,
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
        marginBottom: Spacing.xl,
    },
    sectionBlur: {
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    section: {
        padding: Spacing.md,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '600',
    },
    editBtn: {
        padding: Spacing.xs,
    },
    imagesRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    imageThumb: {
        position: 'relative',
    },
    thumbImage: {
        width: 60,
        height: 60,
        borderRadius: 10,
        borderWidth: 1,
    },
    imageBadge: {
        position: 'absolute',
        top: -4,
        left: -4,
        width: 18,
        height: 18,
        borderRadius: 9,
        alignItems: 'center',
        justifyContent: 'center',
    },
    imageBadgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '700',
    },
    infoRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.lg,
    },
    infoItem: {},
    infoLabel: {
        ...Typography.styles.caption,
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 15,
        fontWeight: '500',
    },
    tagsWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.xs,
    },
    tag: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: 8,
    },
    tagText: {
        fontSize: 13,
        fontWeight: '500',
    },
    disclaimer: {
        flexDirection: 'row',
        padding: Spacing.md,
        borderRadius: 14,
        gap: Spacing.sm,
        alignItems: 'flex-start',
        marginTop: Spacing.md,
    },
    disclaimerText: {
        ...Typography.styles.caption,
        flex: 1,
        lineHeight: 18,
    },
    footer: {
        padding: Spacing.xl,
    },
    footerButton: {
        width: '100%',
    },
    analyzeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        borderRadius: 14,
        gap: Spacing.sm,
        ...Shadows.md,
    },
    analyzeButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
});
