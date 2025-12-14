/**
 * Main Diagnosis Screen - Home Tab
 * Multi-step wizard for AI skin lesion analysis
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ImageBackground } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { DiagnosisWizard } from '@/components/DiagnosisWizard';
import { OnboardingModal } from '@/components/OnboardingModal';
import { MedicalConsentModal } from '@/components/MedicalConsentModal';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { hasMedicalConsentBeenAccepted, markMedicalConsentAsAccepted } from '@/lib/storage';
import type { UpdateProfileData } from '@/types/schema';

export default function DiagnosisScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const { user, updateProfile, refetch } = useAuth();
    const { language } = useLanguage();

    // Medical consent modal state
    const [showMedicalConsent, setShowMedicalConsent] = useState(false);
    const [consentChecked, setConsentChecked] = useState(false);

    // Check if medical consent has been accepted on mount
    useEffect(() => {
        const checkConsent = async () => {
            if (user?.id) {
                const hasAccepted = await hasMedicalConsentBeenAccepted(user.id);
                if (!hasAccepted) {
                    setShowMedicalConsent(true);
                }
                setConsentChecked(true);
            }
        };
        checkConsent();
    }, [user?.id]);

    // Handle medical consent acceptance
    const handleConsentAccept = async () => {
        if (user?.id) {
            await markMedicalConsentAsAccepted(user.id);
        }
        setShowMedicalConsent(false);
    };

    // Show onboarding modal if user exists but hasn't completed profile
    const showOnboarding = user && user.isProfileComplete !== true && !showMedicalConsent;

    const handleOnboardingComplete = async (data: UpdateProfileData) => {
        console.log('[Onboarding] Starting profile update with data:', JSON.stringify(data));
        try {
            const result = await updateProfile(data);
            console.log('[Onboarding] Profile update successful:', JSON.stringify(result));
            const refreshedUser = await refetch(); // Refresh user data to close modal
            console.log('[Onboarding] User refetch result:', JSON.stringify(refreshedUser.data));
        } catch (error) {
            console.error('[Onboarding] Failed to update profile:', error);
            throw error; // Re-throw so OnboardingModal can handle it
        }
    };

    return (
        <ImageBackground
            source={require('@/assets/images/home-bg.png')}
            style={styles.container}
            resizeMode="cover"
        >
            <DiagnosisWizard />

            {/* Medical Consent Modal - shown first for new users */}
            {user && consentChecked && (
                <MedicalConsentModal
                    visible={showMedicalConsent}
                    onAccept={handleConsentAccept}
                    language={language}
                />
            )}

            {/* Onboarding Modal for first-time users - shown after consent */}
            {user && (
                <OnboardingModal
                    visible={showOnboarding || false}
                    user={user}
                    onComplete={handleOnboardingComplete}
                />
            )}
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
