/**
 * OnboardingModal Component
 * Full-screen modal for first-time user onboarding
 * Collects name and health professional status
 */

import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TextInput,
    TouchableOpacity,
    Animated,
    Easing,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Stethoscope, User as UserIcon, Heart, ArrowRight } from 'lucide-react-native';
import { Colors, Gradients } from '@/constants/Colors';
import { Translations } from '@/constants/Translations';
import { useLanguage } from '@/contexts/LanguageContext';
import type { User, UpdateProfileData } from '@/types/schema';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface OnboardingModalProps {
    visible: boolean;
    user: User;
    onComplete: (data: UpdateProfileData) => Promise<void>;
}

export function OnboardingModal({ visible, user, onComplete }: OnboardingModalProps) {
    const { language } = useLanguage();

    // Pre-fill with existing user data from Google OAuth
    const [firstName, setFirstName] = useState(user.firstName || '');
    const [lastName, setLastName] = useState(user.lastName || '');
    const [isHealthProfessional, setIsHealthProfessional] = useState<boolean | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showError, setShowError] = useState(false);

    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 500,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 400,
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible]);

    // Update state if user data changes (e.g., after Google login)
    useEffect(() => {
        if (user.firstName) setFirstName(user.firstName);
        if (user.lastName) setLastName(user.lastName);
    }, [user]);

    const handleOptionSelect = async (isProfessional: boolean) => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setIsHealthProfessional(isProfessional);
        setShowError(false);
    };

    const handleSubmit = async () => {
        // Validate
        if (!firstName.trim()) {
            setShowError(true);
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }

        if (isHealthProfessional === null) {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }

        setIsSubmitting(true);
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        console.log('[OnboardingModal] Submitting with data:', {
            firstName: firstName.trim(),
            lastName: lastName.trim() || null,
            isHealthProfessional,
            isProfileComplete: true,
        });

        try {
            await onComplete({
                firstName: firstName.trim(),
                lastName: lastName.trim() || null,
                isHealthProfessional,
                isProfileComplete: true,
            });
            console.log('[OnboardingModal] onComplete finished successfully');
            // Modal should close via parent state - don't reset isSubmitting
        } catch (error) {
            console.error('[OnboardingModal] Onboarding error:', error);
            setIsSubmitting(false);
        }
    };

    const canSubmit = firstName.trim() && isHealthProfessional !== null && !isSubmitting;

    return (
        <Modal visible={visible} animationType="none" transparent statusBarTranslucent>
            <BlurView intensity={90} tint="light" style={styles.backdrop}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <Animated.View
                        style={[
                            styles.container,
                            {
                                opacity: fadeAnim,
                                transform: [
                                    { translateY: slideAnim },
                                    { scale: scaleAnim },
                                ],
                            },
                        ]}
                    >
                        <ScrollView
                            contentContainerStyle={styles.scrollContent}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                        >
                            {/* Glass Card */}
                            <BlurView intensity={80} tint="light" style={styles.cardBlur}>
                                <View style={styles.card}>
                                    {/* Glass highlight */}
                                    <View style={styles.glassHighlight} />

                                    {/* Icon */}
                                    <View style={styles.iconContainer}>
                                        <Stethoscope size={40} color="#FFFFFF" strokeWidth={2} />
                                    </View>

                                    {/* Title */}
                                    <Text style={styles.title}>
                                        {Translations.onboardingWelcome[language]}
                                    </Text>
                                    <Text style={styles.subtitle}>
                                        {Translations.onboardingSubtitle[language]}
                                    </Text>

                                    {/* Name Inputs */}
                                    <View style={styles.inputSection}>
                                        <View style={styles.inputContainer}>
                                            <Text style={styles.inputLabel}>
                                                {Translations.onboardingFirstName[language]} *
                                            </Text>
                                            <TextInput
                                                style={[
                                                    styles.input,
                                                    showError && !firstName.trim() && styles.inputError,
                                                ]}
                                                value={firstName}
                                                onChangeText={(text) => {
                                                    setFirstName(text);
                                                    setShowError(false);
                                                }}
                                                placeholder={Translations.onboardingFirstName[language]}
                                                placeholderTextColor="rgba(0,0,0,0.3)"
                                                autoCapitalize="words"
                                            />
                                        </View>
                                        <View style={styles.inputContainer}>
                                            <Text style={styles.inputLabel}>
                                                {Translations.onboardingLastName[language]}
                                            </Text>
                                            <TextInput
                                                style={styles.input}
                                                value={lastName}
                                                onChangeText={setLastName}
                                                placeholder={Translations.onboardingLastName[language]}
                                                placeholderTextColor="rgba(0,0,0,0.3)"
                                                autoCapitalize="words"
                                            />
                                        </View>
                                    </View>

                                    {showError && (
                                        <Text style={styles.errorText}>
                                            {Translations.onboardingNameRequired[language]}
                                        </Text>
                                    )}

                                    {/* Profession Question */}
                                    <Text style={styles.questionText}>
                                        {Translations.onboardingProfessionQuestion[language]}
                                    </Text>

                                    {/* Option Cards */}
                                    <View style={styles.optionsContainer}>
                                        {/* Health Professional Option */}
                                        <TouchableOpacity
                                            onPress={() => handleOptionSelect(true)}
                                            activeOpacity={0.8}
                                        >
                                            <View
                                                style={[
                                                    styles.optionCard,
                                                    isHealthProfessional === true && styles.optionCardSelected,
                                                ]}
                                            >
                                                <View
                                                    style={[
                                                        styles.optionIcon,
                                                        isHealthProfessional === true && styles.optionIconSelected,
                                                    ]}
                                                >
                                                    <Stethoscope
                                                        size={28}
                                                        color={isHealthProfessional === true ? '#FFFFFF' : '#0891B2'}
                                                        strokeWidth={2}
                                                    />
                                                </View>
                                                <View style={styles.optionTextContainer}>
                                                    <Text
                                                        style={[
                                                            styles.optionTitle,
                                                            isHealthProfessional === true && styles.optionTitleSelected,
                                                        ]}
                                                    >
                                                        {Translations.onboardingHealthProfessional[language]}
                                                    </Text>
                                                    <Text style={styles.optionDesc}>
                                                        {Translations.onboardingHealthProfessionalDesc[language]}
                                                    </Text>
                                                </View>
                                            </View>
                                        </TouchableOpacity>

                                        {/* Regular User Option */}
                                        <TouchableOpacity
                                            onPress={() => handleOptionSelect(false)}
                                            activeOpacity={0.8}
                                        >
                                            <View
                                                style={[
                                                    styles.optionCard,
                                                    isHealthProfessional === false && styles.optionCardSelected,
                                                ]}
                                            >
                                                <View
                                                    style={[
                                                        styles.optionIcon,
                                                        isHealthProfessional === false && styles.optionIconSelected,
                                                    ]}
                                                >
                                                    <Heart
                                                        size={28}
                                                        color={isHealthProfessional === false ? '#FFFFFF' : '#0891B2'}
                                                        strokeWidth={2}
                                                    />
                                                </View>
                                                <View style={styles.optionTextContainer}>
                                                    <Text
                                                        style={[
                                                            styles.optionTitle,
                                                            isHealthProfessional === false && styles.optionTitleSelected,
                                                        ]}
                                                    >
                                                        {Translations.onboardingRegularUser[language]}
                                                    </Text>
                                                    <Text style={styles.optionDesc}>
                                                        {Translations.onboardingRegularUserDesc[language]}
                                                    </Text>
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    </View>

                                    {/* Submit Button */}
                                    <TouchableOpacity
                                        onPress={handleSubmit}
                                        disabled={!canSubmit}
                                        activeOpacity={0.8}
                                        style={styles.submitButtonWrapper}
                                    >
                                        <LinearGradient
                                            colors={
                                                canSubmit
                                                    ? ['#5DD5C8', '#3BB2A9']
                                                    : ['#CCCCCC', '#AAAAAA']
                                            }
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                            style={styles.submitButton}
                                        >
                                            <Text style={styles.submitButtonText}>
                                                {isSubmitting
                                                    ? Translations.saving[language]
                                                    : Translations.onboardingStart[language]}
                                            </Text>
                                            {!isSubmitting && (
                                                <ArrowRight size={20} color="#FFFFFF" strokeWidth={2.5} />
                                            )}
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>
                            </BlurView>
                        </ScrollView>
                    </Animated.View>
                </KeyboardAvoidingView>
            </BlurView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 100, 100, 0.3)',
    },
    keyboardView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        width: SCREEN_WIDTH - 40,
        maxHeight: SCREEN_HEIGHT * 0.85,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    cardBlur: {
        borderRadius: 28,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.6)',
    },
    card: {
        padding: 28,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    glassHighlight: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 80,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 24,
        backgroundColor: '#0891B2',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1A5F5A',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 24,
    },
    inputSection: {
        gap: 16,
        marginBottom: 16,
    },
    inputContainer: {
        gap: 6,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1A5F5A',
        marginLeft: 4,
    },
    input: {
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderRadius: 16,
        paddingHorizontal: 18,
        paddingVertical: 14,
        fontSize: 16,
        color: '#333',
        borderWidth: 1.5,
        borderColor: 'rgba(8, 145, 178, 0.2)',
    },
    inputError: {
        borderColor: '#EF4444',
        borderWidth: 2,
    },
    errorText: {
        color: '#EF4444',
        fontSize: 13,
        marginTop: -8,
        marginBottom: 12,
        marginLeft: 4,
    },
    questionText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1A5F5A',
        marginTop: 8,
        marginBottom: 16,
        textAlign: 'center',
    },
    optionsContainer: {
        gap: 14,
        marginBottom: 24,
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        borderRadius: 20,
        borderWidth: 2,
        borderColor: 'rgba(8, 145, 178, 0.2)',
        gap: 16,
    },
    optionCardSelected: {
        backgroundColor: 'rgba(8, 145, 178, 0.1)',
        borderColor: '#0891B2',
    },
    optionIcon: {
        width: 52,
        height: 52,
        borderRadius: 16,
        backgroundColor: 'rgba(8, 145, 178, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    optionIconSelected: {
        backgroundColor: '#0891B2',
    },
    optionTextContainer: {
        flex: 1,
    },
    optionTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#333',
        marginBottom: 2,
    },
    optionTitleSelected: {
        color: '#0891B2',
    },
    optionDesc: {
        fontSize: 13,
        color: '#666',
    },
    submitButtonWrapper: {
        borderRadius: 24,
        overflow: 'hidden',
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        paddingHorizontal: 32,
        gap: 10,
    },
    submitButtonText: {
        fontSize: 17,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
});
