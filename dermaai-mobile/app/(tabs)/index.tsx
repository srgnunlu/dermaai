/**
 * Main Diagnosis Screen - Home Tab
 * Multi-step wizard for AI skin lesion analysis
 */

import React from 'react';
import { View, StyleSheet, ImageBackground } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { DiagnosisWizard } from '@/components/DiagnosisWizard';
import { OnboardingModal } from '@/components/OnboardingModal';
import { useAuth } from '@/hooks/useAuth';
import type { UpdateProfileData } from '@/types/schema';

export default function DiagnosisScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const { user, updateProfile, refetch } = useAuth();

    // Show onboarding modal if user exists but hasn't completed profile
    const showOnboarding = user && user.isProfileComplete !== true;

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

            {/* Onboarding Modal for first-time users */}
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

