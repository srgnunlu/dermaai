/**
 * Results Screen - Displays analysis results from push notification
 * Uses DiagnosisResults component for consistent UI
 */

import React from 'react';
import {
    View,
    StyleSheet,
    ImageBackground,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useCase } from '@/hooks/useCases';
import { DiagnosisResults } from '@/components/DiagnosisResults';
import { LoadingSpinner, EmptyState } from '@/components/ui';
import { Translations } from '@/constants/Translations';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ResultsScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { language } = useLanguage();
    const insets = useSafeAreaInsets();

    const { caseData, isLoading, error, isAnalyzing } = useCase(id || '');

    const handleNewAnalysis = () => {
        router.replace('/(tabs)');
    };

    if (isLoading || isAnalyzing) {
        return (
            <ImageBackground
                source={require('@/assets/images/home-bg.png')}
                style={styles.backgroundImage}
                resizeMode="cover"
            >
                <Stack.Screen options={{ headerShown: false }} />
                <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
                    <LoadingSpinner
                        text={isAnalyzing
                            ? (language === 'tr' ? 'Analiz devam ediyor...' : 'Analysis in progress...')
                            : Translations.loading[language]}
                    />
                </View>
            </ImageBackground>
        );
    }

    if (error || !caseData) {
        return (
            <ImageBackground
                source={require('@/assets/images/home-bg.png')}
                style={styles.backgroundImage}
                resizeMode="cover"
            >
                <Stack.Screen options={{ headerShown: false }} />
                <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
                    <EmptyState
                        emoji="❌"
                        title={language === 'tr' ? 'Sonuç bulunamadı' : 'Results not found'}
                        description={language === 'tr'
                            ? 'Analiz sonucu bulunamadı veya erişim izniniz yok.'
                            : 'Analysis results not found or you do not have access.'}
                        actionLabel={Translations.back[language]}
                        onAction={() => router.replace('/(tabs)')}
                    />
                </View>
            </ImageBackground>
        );
    }

    return (
        <ImageBackground
            source={require('@/assets/images/home-bg.png')}
            style={styles.backgroundImage}
            resizeMode="cover"
        >
            <Stack.Screen options={{ headerShown: false }} />
            <DiagnosisResults
                caseData={caseData}
                onNewAnalysis={handleNewAnalysis}
            />
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    backgroundImage: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
});
