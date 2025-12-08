/**
 * Main Diagnosis Screen - Home Tab
 * Multi-step wizard for AI skin lesion analysis
 */

import React from 'react';
import { View, StyleSheet, ImageBackground } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { DiagnosisWizard } from '@/components/DiagnosisWizard';

export default function DiagnosisScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    return (
        <ImageBackground
            source={require('@/assets/images/home-bg.png')}
            style={styles.container}
            resizeMode="cover"
        >
            <DiagnosisWizard />
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});


