/**
 * Diagnosis Wizard - Main Container
 * Multi-step wizard for AI skin lesion analysis
 */

import React, { useState, useCallback, useRef } from 'react';
import {
    View,
    StyleSheet,
    Animated,
    Dimensions,
    SafeAreaView,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { useColorScheme } from '@/components/useColorScheme';
import { useAnalyzeCase, useCases } from '@/hooks/useCases';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'expo-router';
import { useTabBarVisibility } from '@/contexts/TabBarVisibilityContext';
import { useLanguage } from '@/contexts/LanguageContext';

// Step components
import { WelcomeStep } from './wizard/WelcomeStep';
import { ImageUploadStep } from './wizard/ImageUploadStep';
import { PatientInfoStep } from './wizard/PatientInfoStep';
import { LesionLocationStep } from './wizard/LesionLocationStep';
import { SymptomsStep } from './wizard/SymptomsStep';
import { ReviewStep } from './wizard/ReviewStep';
import { AnalysisProgress } from './AnalysisProgress';
import { DiagnosisResults } from './DiagnosisResults';

import type { PatientData, AnalysisResponse } from '@/types/schema';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Step definitions
const STEPS = [
    { id: 'welcome', label: 'Hoşgeldin' },
    { id: 'images', label: 'Görseller' },
    { id: 'patient', label: 'Hasta Bilgisi' },
    { id: 'location', label: 'Konum' },
    { id: 'symptoms', label: 'Belirtiler' },
    { id: 'review', label: 'Özet' },
] as const;

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

const initialState: WizardState = {
    currentStep: 0,
    images: [],
    patientId: '',
    age: '',
    gender: '',
    skinType: '',
    lesionLocations: [],
    symptoms: [],
    additionalSymptoms: '',
    symptomDuration: '',
    medicalHistory: [],
};

export function DiagnosisWizard() {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const router = useRouter();
    const { hideTabBar, showTabBar } = useTabBarVisibility();

    const [state, setState] = useState<WizardState>(initialState);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null);
    const [showResults, setShowResults] = useState(false);

    const slideAnim = useRef(new Animated.Value(0)).current;
    const { analyze } = useAnalyzeCase();
    const { language } = useLanguage();

    // Hide/show tab bar based on current step
    React.useEffect(() => {
        if (state.currentStep > 0) {
            hideTabBar();
        } else {
            showTabBar();
        }
    }, [state.currentStep, hideTabBar, showTabBar]);

    // Navigation functions
    const goToStep = useCallback((step: number, direction: 'forward' | 'back' = 'forward') => {
        const toValue = direction === 'forward' ? -SCREEN_WIDTH : SCREEN_WIDTH;

        Animated.timing(slideAnim, {
            toValue,
            duration: 150,
            useNativeDriver: true,
        }).start(() => {
            setState(prev => ({ ...prev, currentStep: step }));
            slideAnim.setValue(direction === 'forward' ? SCREEN_WIDTH : -SCREEN_WIDTH);
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start();
        });
    }, [slideAnim]);

    const nextStep = useCallback(() => {
        if (state.currentStep < STEPS.length - 1) {
            goToStep(state.currentStep + 1, 'forward');
        }
    }, [state.currentStep, goToStep]);

    const prevStep = useCallback(() => {
        if (state.currentStep > 0) {
            goToStep(state.currentStep - 1, 'back');
        }
    }, [state.currentStep, goToStep]);

    // State update functions
    const updateState = useCallback(<K extends keyof WizardState>(
        key: K,
        value: WizardState[K]
    ) => {
        setState(prev => ({ ...prev, [key]: value }));
    }, []);

    // Handle analysis start
    const handleStartAnalysis = useCallback(async () => {
        setIsAnalyzing(true);

        try {
            const patientData: PatientData = {
                patientId: state.patientId || `P-${Date.now()}`,
                age: state.age ? parseInt(state.age, 10) : null,
                gender: state.gender,
                skinType: state.skinType,
                lesionLocation: state.lesionLocations,
                symptoms: state.symptoms,
                additionalSymptoms: state.additionalSymptoms,
                symptomDuration: state.symptomDuration,
                medicalHistory: state.medicalHistory,
            };

            const result = await analyze({
                patientData,
                imageUrls: state.images,
                language, // Pass current language for localized AI responses
            });

            setAnalysisResult(result);
            setShowResults(true);
        } catch (error) {
            console.error('Analysis error:', error);
            setIsAnalyzing(false);
        }
    }, [state, analyze]);

    // Handle new analysis
    const handleNewAnalysis = useCallback(() => {
        setState(initialState);
        setIsAnalyzing(false);
        setAnalysisResult(null);
        setShowResults(false);
    }, []);

    const { user } = useAuth();
    const { cases } = useCases();

    // Check if can proceed to next step
    const canProceed = useCallback(() => {
        switch (state.currentStep) {
            case 1: // Images step
                return state.images.length > 0;
            case 3: // Location step
                return state.lesionLocations.length > 0;
            default:
                return true;
        }
    }, [state]);

    // Handle navigation to case detail
    const handleScanPress = useCallback((caseId: string) => {
        router.push(`/case/${caseId}`);
    }, [router]);

    if (showResults && analysisResult) {
        return (
            <DiagnosisResults
                caseData={analysisResult}
                onNewAnalysis={handleNewAnalysis}
                onRequestSecondaryAnalysis={() => {
                    // Check if OpenAI analysis exists
                    if (analysisResult.openaiAnalysis?.diagnoses && analysisResult.openaiAnalysis.diagnoses.length > 0) {
                        // Switch to show OpenAI results
                        // Create a modified result with OpenAI as primary
                        const openaiResult: AnalysisResponse = {
                            ...analysisResult,
                            geminiAnalysis: analysisResult.openaiAnalysis,
                        };
                        setAnalysisResult(openaiResult);
                    } else {
                        // No OpenAI analysis available - show alert
                        import('react-native').then(({ Alert }) => {
                            Alert.alert(
                                'OpenAI Analizi',
                                'Bu vaka için OpenAI analizi mevcut değil. Analiz ayarlarından OpenAI\'ı etkinleştirmeyi deneyin.',
                                [{ text: 'Tamam' }]
                            );
                        });
                    }
                }}
            />
        );
    }

    // Show analysis progress
    if (isAnalyzing) {
        return (
            <AnalysisProgress
                isActive={true}
                onComplete={() => { }}
                imageUri={state.images[0]} // Pass user's first image
            />
        );
    }

    // Render current step
    const renderStep = () => {
        const stepProps = {
            state,
            updateState,
            onNext: nextStep,
            onBack: prevStep,
            canProceed: canProceed(),
        };

        switch (state.currentStep) {
            case 0:
                // Format cases for the welcome step
                const recentScans = cases
                    ?.slice(0, 5) // Take last 5
                    .map((c: any) => ({
                        id: c.id,
                        imageUrl: c.imageUrls?.[0] || c.imageUrl,
                        date: c.createdAt ? new Date(c.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) : ''
                    })) || [];

                return (
                    <WelcomeStep
                        onStart={nextStep}
                        userName={user?.firstName || user?.email?.split('@')[0] || 'Kullanıcı'}
                        recentScans={recentScans}
                        onScanPress={handleScanPress}
                    />
                );
            case 1:
                return (
                    <ImageUploadStep
                        images={state.images}
                        onImagesChange={(images) => updateState('images', images)}
                        onNext={nextStep}
                        onBack={prevStep}
                        canProceed={state.images.length > 0}
                    />
                );
            case 2:
                return (
                    <PatientInfoStep
                        patientId={state.patientId}
                        age={state.age}
                        gender={state.gender}
                        skinType={state.skinType}
                        onPatientIdChange={(v) => updateState('patientId', v)}
                        onAgeChange={(v) => updateState('age', v)}
                        onGenderChange={(v) => updateState('gender', v)}
                        onSkinTypeChange={(v) => updateState('skinType', v)}
                        onNext={nextStep}
                        onBack={prevStep}
                        onSkip={nextStep}
                    />
                );
            case 3:
                return (
                    <LesionLocationStep
                        selectedLocations={state.lesionLocations}
                        onLocationsChange={(v) => updateState('lesionLocations', v)}
                        onNext={nextStep}
                        onBack={prevStep}
                        canProceed={state.lesionLocations.length > 0}
                    />
                );
            case 4:
                return (
                    <SymptomsStep
                        symptoms={state.symptoms}
                        duration={state.symptomDuration}
                        additionalSymptoms={state.additionalSymptoms}
                        medicalHistory={state.medicalHistory}
                        onSymptomsChange={(v) => updateState('symptoms', v)}
                        onDurationChange={(v) => updateState('symptomDuration', v)}
                        onAdditionalSymptomsChange={(v) => updateState('additionalSymptoms', v)}
                        onMedicalHistoryChange={(v) => updateState('medicalHistory', v)}
                        onNext={nextStep}
                        onBack={prevStep}
                    />
                );
            case 5:
                return (
                    <ReviewStep
                        state={state}
                        onEdit={goToStep}
                        onBack={prevStep}
                        onStartAnalysis={handleStartAnalysis}
                    />
                );
            default:
                return null;
        }
    };

    const currentStepIndex = state.currentStep;
    const showProgress = currentStepIndex > 0;

    return (
        <SafeAreaView style={styles.container}>
            {/* Progress Bar */}
            {showProgress && (
                <View style={styles.progressContainer}>
                    <View style={[styles.progressBackground, { backgroundColor: colors.muted }]}>
                        <Animated.View
                            style={[
                                styles.progressFill,
                                {
                                    backgroundColor: colors.primary,
                                    width: `${(currentStepIndex / (STEPS.length - 1)) * 100}%`,
                                },
                            ]}
                        />
                    </View>
                    {/* Step dots */}
                    <View style={styles.stepsDotsContainer}>
                        {STEPS.slice(1).map((step, index) => (
                            <View
                                key={step.id}
                                style={[
                                    styles.stepDot,
                                    {
                                        backgroundColor:
                                            index < currentStepIndex
                                                ? colors.primary
                                                : index === currentStepIndex - 1
                                                    ? colors.primary
                                                    : colors.muted,
                                    },
                                ]}
                            />
                        ))}
                    </View>
                </View>
            )}

            {/* Step Content */}
            <Animated.View
                style={[
                    styles.stepContainer,
                    { transform: [{ translateX: slideAnim }] },
                ]}
            >
                {renderStep()}
            </Animated.View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    progressContainer: {
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.md,
        paddingBottom: Spacing.sm,
    },
    progressBackground: {
        height: 4,
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 2,
    },
    stepsDotsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: Spacing.sm,
        paddingHorizontal: Spacing.xs,
    },
    stepDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    stepContainer: {
        flex: 1,
    },
});
