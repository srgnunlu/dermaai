/**
 * Case Detail Screen
 * Premium glassmorphism design with full case information
 */

import React from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    Image,
    TouchableOpacity,
    Alert,
    ImageBackground,
    Dimensions,
    Share,
    ActivityIndicator,
    Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { format } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import * as Haptics from 'expo-haptics';
import {
    Calendar,
    MapPin,
    Clock,
    FileText,
    Share2,
    ArrowLeft,
    Stethoscope,
    Activity,
    CheckCircle,
    AlertTriangle,
    ChevronRight,
    Download,
    Trash2,
    TrendingUp,
    Crown,
    StickyNote,
} from 'lucide-react-native';
import { Colors, getConfidenceColor } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';
import { Translations, translateValue } from '@/constants/Translations';
import { useColorScheme } from '@/components/useColorScheme';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCase, useDeleteCase } from '@/hooks/useCases';
import { useCreateLesionTracking } from '@/hooks/useLesionTracking';
import { useSubscription } from '@/hooks/useSubscription';
import {
    ConfidenceBadge,
    LoadingSpinner,
    EmptyState,
} from '@/components/ui';
import type { DiagnosisResult } from '@/types/schema';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function CaseDetailScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { language } = useLanguage();
    const insets = useSafeAreaInsets();
    const [isGeneratingPdf, setIsGeneratingPdf] = React.useState(false);
    const [isDeleting, setIsDeleting] = React.useState(false);
    const [isDeleted, setIsDeleted] = React.useState(false);
    const [isCreatingTracking, setIsCreatingTracking] = React.useState(false);

    // Disable query when case is being deleted or already deleted
    const { caseData, isLoading, error, isAnalyzing } = useCase(id || '', !isDeleted && !isDeleting);
    const { deleteCase } = useDeleteCase();
    const { createTracking } = useCreateLesionTracking();
    const { subscriptionStatus } = useSubscription();
    const isPro = subscriptionStatus?.tier === 'pro';

    const notSpecified = language === 'tr' ? 'Belirtilmedi' : 'Not specified';

    if (isLoading) {
        return (
            <ImageBackground
                source={require('@/assets/images/home-bg.png')}
                style={styles.backgroundImage}
                resizeMode="cover"
            >
                <Stack.Screen options={{ headerShown: false }} />
                <View style={[styles.container, styles.centered]}>
                    <LoadingSpinner text={Translations.loading[language]} />
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
                        title={language === 'tr' ? 'Vaka bulunamadı' : 'Case not found'}
                        description={language === 'tr'
                            ? 'Bu vaka mevcut değil veya erişim izniniz yok.'
                            : 'This case does not exist or you do not have access.'}
                        actionLabel={Translations.back[language]}
                        onAction={() => router.back()}
                    />
                </View>
            </ImageBackground>
        );
    }

    const handleShare = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        try {
            const divider = '━'.repeat(32);
            const subDivider = '─'.repeat(28);

            // Build symptoms section
            let symptomsText = '';
            if (caseData?.symptoms && caseData.symptoms.length > 0) {
                symptomsText = `\n\n🔍 ${language === 'tr' ? 'BELİRTİLER' : 'SYMPTOMS'}:\n${caseData.symptoms.map(s => `   • ${translateValue(s, language)}`).join('\n')}`;
            }

            // Build additional symptoms
            if (caseData?.additionalSymptoms) {
                symptomsText += `\n   📝 ${language === 'tr' ? 'Ek Notlar' : 'Additional Notes'}: ${caseData.additionalSymptoms}`;
            }

            // Build duration section
            const durationText = caseData?.symptomDuration
                ? `\n⏱️ ${language === 'tr' ? 'Belirti Süresi' : 'Duration'}: ${translateValue(caseData.symptomDuration, language)}`
                : '';

            // Build medical history section
            let medicalHistoryText = '';
            if (caseData?.medicalHistory && caseData.medicalHistory.length > 0) {
                medicalHistoryText = `\n\n📋 ${language === 'tr' ? 'TIBBİ GEÇMİŞ' : 'MEDICAL HISTORY'}:\n${caseData.medicalHistory.map(h => `   • ${translateValue(h, language)}`).join('\n')}`;
            }

            // Build all diagnoses section with complete details
            let diagnosesText = '';
            if (diagnoses.length > 0) {
                diagnosesText = `\n\n${divider}\n🩺 ${language === 'tr' ? 'AI ANALİZ SONUÇLARI' : 'AI ANALYSIS RESULTS'}\n${divider}`;

                diagnoses.forEach((diagnosis: DiagnosisResult, index: number) => {
                    const confidenceEmoji = diagnosis.confidence >= 70 ? '🟢' : diagnosis.confidence >= 40 ? '🟡' : '🔴';

                    diagnosesText += `\n\n${index + 1}️⃣ ${diagnosis.name}`;
                    diagnosesText += `\n${confidenceEmoji} ${language === 'tr' ? 'Güven Oranı' : 'Confidence'}: %${diagnosis.confidence}`;

                    // Full description
                    if (diagnosis.description) {
                        diagnosesText += `\n\n📖 ${language === 'tr' ? 'Açıklama' : 'Description'}:\n${diagnosis.description}`;
                    }

                    // All key features
                    if (diagnosis.keyFeatures && diagnosis.keyFeatures.length > 0) {
                        diagnosesText += `\n\n🔬 ${language === 'tr' ? 'Temel Özellikler' : 'Key Features'}:`;
                        diagnosis.keyFeatures.forEach(feature => {
                            diagnosesText += `\n   • ${feature}`;
                        });
                    }

                    // All recommendations
                    if (diagnosis.recommendations && diagnosis.recommendations.length > 0) {
                        diagnosesText += `\n\n💡 ${language === 'tr' ? 'Öneriler' : 'Recommendations'}:`;
                        diagnosis.recommendations.forEach(rec => {
                            diagnosesText += `\n   → ${rec}`;
                        });
                    }

                    if (index < diagnoses.length - 1) {
                        diagnosesText += `\n\n${subDivider}`;
                    }
                });
            }

            const shareMessage = language === 'tr'
                ? `🏥 DermAssist AI\n${language === 'tr' ? 'DETAYLI ANALİZ RAPORU' : 'DETAILED ANALYSIS REPORT'}\n${divider}\n\n📅 Tarih: ${createdDate}\n📍 Lezyon Konumu: ${translateValue(caseData?.lesionLocation, language) || notSpecified}${durationText}${symptomsText}${medicalHistoryText}${diagnosesText}\n\n${divider}\n\n⚠️ ÖNEMLİ UYARI:\nBu analiz sadece bilgi amaçlıdır ve profesyonel tıbbi tavsiye yerine geçmez. Kesin tanı için lütfen bir dermatoloji uzmanına danışın.\n\n🔗 DermAssist AI ile oluşturuldu`
                : `🏥 DermAssist AI\nDETAILED ANALYSIS REPORT\n${divider}\n\n📅 Date: ${createdDate}\n📍 Lesion Location: ${translateValue(caseData?.lesionLocation, language) || notSpecified}${durationText}${symptomsText}${medicalHistoryText}${diagnosesText}\n\n${divider}\n\n⚠️ IMPORTANT NOTICE:\nThis analysis is for informational purposes only and does not replace professional medical advice. Please consult a dermatologist for a definitive diagnosis.\n\n🔗 Generated with DermAssist AI`;

            await Share.share({
                message: shareMessage,
                title: language === 'tr' ? 'DermAssist AI Analiz Raporu' : 'DermAssist AI Analysis Report',
            });
        } catch (error) {
            console.error('Share Error:', error);
        }
    };

    const handleGenerateReport = async () => {
        if (!caseData) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            setIsGeneratingPdf(true);

            const Print = require('expo-print');
            const Sharing = require('expo-sharing');
            const { generateReportHtml } = require('@/utils/ReportGenerator');

            const html = generateReportHtml({
                caseData,
                language: language as 'tr' | 'en'
            });

            const { uri } = await Print.printToFileAsync({
                html,
                base64: false
            });

            await Sharing.shareAsync(uri, {
                UTI: '.pdf',
                mimeType: 'application/pdf',
                dialogTitle: language === 'tr' ? 'Raporu Paylaş' : 'Share Report'
            });

        } catch (error) {
            console.error('PDF Generation Error:', error);
            Alert.alert(
                language === 'tr' ? 'Hata' : 'Error',
                language === 'tr'
                    ? 'Rapor oluşturulurken bir hata oluştu.'
                    : 'An error occurred while generating the report.'
            );
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    // Use selected provider's diagnoses (default to gemini if not set)
    const selectedProvider = caseData.selectedAnalysisProvider || 'gemini';
    const diagnoses = selectedProvider === 'openai'
        ? caseData.openaiAnalysis?.diagnoses || []
        : caseData.geminiAnalysis?.diagnoses || [];
    const dateLocale = language === 'tr' ? tr : enUS;
    const createdDate = caseData.createdAt
        ? format(new Date(caseData.createdAt), 'dd MMMM yyyy, HH:mm', { locale: dateLocale })
        : '-';

    const topDiagnosis = diagnoses[0];

    return (
        <ImageBackground
            source={require('@/assets/images/home-bg.png')}
            style={styles.backgroundImage}
            resizeMode="cover"
        >
            <Stack.Screen options={{ headerShown: false }} />
            <View style={[styles.container, { paddingTop: insets.top }]}>
                {/* Custom Header */}
                <View style={styles.customHeader}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            router.back();
                        }}
                        activeOpacity={0.7}
                    >
                        <BlurView intensity={60} tint="light" style={styles.backButtonBlur}>
                            <ArrowLeft size={20} color="#0891B2" />
                        </BlurView>
                    </TouchableOpacity>

                    <Text style={styles.headerTitle}>
                        {Translations.caseDetail[language]}
                    </Text>

                    {/* Header Action Buttons */}
                    <View style={styles.headerActions}>
                        <TouchableOpacity
                            style={styles.headerIconButton}
                            onPress={handleGenerateReport}
                            disabled={isGeneratingPdf}
                            activeOpacity={0.7}
                        >
                            <BlurView intensity={60} tint="light" style={styles.headerIconBlur}>
                                {isGeneratingPdf ? (
                                    <ActivityIndicator size="small" color="#0891B2" />
                                ) : (
                                    <Download size={18} color="#0891B2" />
                                )}
                            </BlurView>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.headerIconButton}
                            onPress={handleShare}
                            activeOpacity={0.7}
                        >
                            <BlurView intensity={60} tint="light" style={styles.headerIconBlur}>
                                <Share2 size={18} color="#0891B2" />
                            </BlurView>
                        </TouchableOpacity>
                    </View>
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Analyzing Banner */}
                    {isAnalyzing && (
                        <View style={styles.analyzingBannerWrapper}>
                            <BlurView intensity={80} tint="light" style={styles.analyzingBannerBlur}>
                                <View style={styles.analyzingBanner}>
                                    <ActivityIndicator size="small" color="#0891B2" />
                                    <View style={styles.analyzingTextContainer}>
                                        <Text style={styles.analyzingTitle}>
                                            {language === 'tr' ? '🔬 Analiz Devam Ediyor...' : '🔬 Analyzing...'}
                                        </Text>
                                        <Text style={styles.analyzingSubtitle}>
                                            {language === 'tr'
                                                ? 'AI sonuçları hazırlanıyor. Sayfa otomatik güncellenecek.'
                                                : 'AI results being prepared. Page will update automatically.'}
                                        </Text>
                                    </View>
                                </View>
                            </BlurView>
                        </View>
                    )}

                    {/* Top Diagnosis Hero Card */}
                    {topDiagnosis && (
                        <View style={styles.heroCardWrapper}>
                            <BlurView intensity={75} tint="light" style={styles.heroCardBlur}>
                                <View style={styles.heroCard}>
                                    <View style={styles.heroIconContainer}>
                                        <Stethoscope size={28} color="#FFFFFF" strokeWidth={2} />
                                    </View>
                                    <View style={styles.heroContent}>
                                        <Text style={styles.heroLabel}>
                                            {Translations.possibleDiagnosis[language]}
                                        </Text>
                                        <Text style={styles.heroTitle} numberOfLines={2}>
                                            {topDiagnosis.name}
                                        </Text>
                                    </View>
                                    <ConfidenceBadge confidence={topDiagnosis.confidence} size="md" />
                                </View>
                            </BlurView>
                        </View>
                    )}

                    {/* Lesion Images */}
                    {(caseData.imageUrls?.length || caseData.imageUrl) && (
                        <View style={styles.sectionWrapper}>
                            <Text style={styles.sectionTitle}>
                                {language === 'tr' ? 'Lezyon Görselleri' : 'Lesion Images'}
                            </Text>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.imagesContainer}
                            >
                                {(caseData.imageUrls || [caseData.imageUrl]).filter(Boolean).map((url, index) => (
                                    <View key={index} style={styles.imageWrapper}>
                                        <BlurView intensity={50} tint="light" style={styles.imageBlur}>
                                            <Image
                                                source={{ uri: url! }}
                                                style={styles.lesionImage}
                                                resizeMode="cover"
                                            />
                                        </BlurView>
                                    </View>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {/* Case Information Card */}
                    <View style={styles.sectionWrapper}>
                        <Text style={styles.sectionTitle}>
                            {language === 'tr' ? 'Vaka Bilgileri' : 'Case Information'}
                        </Text>
                        <View style={styles.infoCardWrapper}>
                            <BlurView intensity={65} tint="light" style={styles.infoCardBlur}>
                                <View style={styles.infoCard}>
                                    <InfoRow
                                        icon={<Calendar size={18} color="#0891B2" />}
                                        label={Translations.analysisDate[language]}
                                        value={createdDate}
                                    />
                                    <View style={styles.infoDivider} />
                                    <InfoRow
                                        icon={<MapPin size={18} color="#0891B2" />}
                                        label={Translations.location[language]}
                                        value={translateValue(caseData.lesionLocation, language) || notSpecified}
                                    />
                                    <View style={styles.infoDivider} />
                                    <InfoRow
                                        icon={<Clock size={18} color="#0891B2" />}
                                        label={language === 'tr' ? 'Belirti Süresi' : 'Duration'}
                                        value={translateValue(caseData.symptomDuration, language) || notSpecified}
                                    />
                                </View>
                            </BlurView>
                        </View>
                    </View>

                    {/* User Notes (Pro Feature) */}
                    {caseData.userNotes && (
                        <View style={styles.sectionWrapper}>
                            <Text style={styles.sectionTitle}>
                                📝 {language === 'tr' ? 'Notlarım' : 'My Notes'}
                            </Text>
                            <View style={styles.notesCardWrapper}>
                                <BlurView intensity={60} tint="light" style={styles.notesCardBlur}>
                                    <View style={styles.notesCard}>
                                        <View style={styles.notesIconContainer}>
                                            <StickyNote size={20} color="#F59E0B" />
                                        </View>
                                        <Text style={styles.notesText}>
                                            {caseData.userNotes}
                                        </Text>
                                    </View>
                                </BlurView>
                            </View>
                        </View>
                    )}

                    {/* Symptoms */}
                    {caseData.symptoms && caseData.symptoms.length > 0 && (
                        <View style={styles.sectionWrapper}>
                            <Text style={styles.sectionTitle}>
                                {language === 'tr' ? 'Belirtiler' : 'Symptoms'}
                            </Text>
                            <View style={styles.symptomsCardWrapper}>
                                <BlurView intensity={60} tint="light" style={styles.symptomsCardBlur}>
                                    <View style={styles.symptomsCard}>
                                        <View style={styles.symptomsChipContainer}>
                                            {caseData.symptoms.map((symptom, index) => (
                                                <View key={index} style={styles.symptomChip}>
                                                    <Text style={styles.symptomChipText}>{translateValue(symptom, language)}</Text>
                                                </View>
                                            ))}
                                        </View>
                                        {caseData.additionalSymptoms && (
                                            <Text style={styles.additionalSymptoms}>
                                                {caseData.additionalSymptoms}
                                            </Text>
                                        )}
                                    </View>
                                </BlurView>
                            </View>
                        </View>
                    )}

                    {/* AI Analysis Results */}
                    {diagnoses.length > 0 && (
                        <View style={styles.sectionWrapper}>
                            <View style={styles.sectionTitleRow}>
                                <Text style={styles.sectionTitle}>
                                    🩺 {language === 'tr' ? 'AI Analiz Sonuçları' : 'AI Analysis Results'}
                                </Text>
                            </View>
                            {diagnoses.map((diagnosis: DiagnosisResult, index: number) => (
                                <DiagnosisCard
                                    key={`diagnosis-${index}`}
                                    diagnosis={diagnosis}
                                    rank={index + 1}
                                    language={language}
                                    isFirst={index === 0}
                                />
                            ))}
                        </View>
                    )}

                    {/* Disclaimer */}
                    <View style={styles.disclaimerWrapper}>
                        <BlurView intensity={50} tint="light" style={styles.disclaimerBlur}>
                            <View style={styles.disclaimer}>
                                <AlertTriangle size={16} color="#F59E0B" />
                                <Text style={styles.disclaimerText}>
                                    {Translations.medicalDisclaimer[language]}
                                </Text>
                            </View>
                        </BlurView>
                    </View>
                </ScrollView>

                {/* Floating Action Buttons */}
                <View style={[styles.fabContainer, { bottom: insets.bottom + 20 }]}>
                    {/* Left FAB - Start Tracking (Pro only) */}
                    {isPro && caseData.status === 'completed' && (
                        <TouchableOpacity
                            style={styles.fabLeft}
                            onPress={async () => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                Alert.prompt(
                                    language === 'tr' ? 'Lezyon Takibi Başlat' : 'Start Lesion Tracking',
                                    language === 'tr'
                                        ? 'Bu lezyona bir isim verin (örn: Sol koldaki ben)'
                                        : 'Give this lesion a name (e.g: Mole on left arm)',
                                    [
                                        { text: language === 'tr' ? 'İptal' : 'Cancel', style: 'cancel' },
                                        {
                                            text: language === 'tr' ? 'Başlat' : 'Start',
                                            onPress: async (name?: string) => {
                                                if (!name?.trim()) {
                                                    Alert.alert(
                                                        language === 'tr' ? 'Hata' : 'Error',
                                                        language === 'tr' ? 'Lezyon adı gereklidir.' : 'Lesion name is required.'
                                                    );
                                                    return;
                                                }
                                                try {
                                                    setIsCreatingTracking(true);
                                                    const tracking = await createTracking({
                                                        name: name.trim(),
                                                        bodyLocation: caseData.lesionLocation || undefined,
                                                        initialCaseId: caseData.id,
                                                    });
                                                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                                    Alert.alert(
                                                        language === 'tr' ? 'Başarılı' : 'Success',
                                                        language === 'tr' ? 'Lezyon takibi başlatıldı!' : 'Lesion tracking started!',
                                                        [
                                                            { text: language === 'tr' ? 'Takibe Git' : 'Go to Tracking', onPress: () => router.push(`/lesion/${tracking.id}`) },
                                                            { text: language === 'tr' ? 'Tamam' : 'OK', style: 'cancel' },
                                                        ]
                                                    );
                                                } catch (err) {
                                                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                                                    Alert.alert(language === 'tr' ? 'Hata' : 'Error', language === 'tr' ? 'Takip oluşturulamadı.' : 'Failed to create tracking.');
                                                } finally {
                                                    setIsCreatingTracking(false);
                                                }
                                            },
                                        },
                                    ],
                                    'plain-text',
                                    '',
                                    'default'
                                );
                            }}
                            activeOpacity={0.8}
                            disabled={isCreatingTracking}
                        >
                            <BlurView intensity={80} tint="light" style={styles.fabBlur}>
                                <View style={[styles.fabContent, styles.fabTracking, isCreatingTracking && styles.fabDisabled]}>
                                    {isCreatingTracking ? (
                                        <ActivityIndicator size="small" color="#FFFFFF" />
                                    ) : (
                                        <TrendingUp size={22} color="#FFFFFF" strokeWidth={2.5} />
                                    )}
                                </View>
                            </BlurView>
                            <View style={styles.fabLabelContainer}>
                                <Text style={styles.fabLabel}>{language === 'tr' ? 'Takip' : 'Track'}</Text>
                            </View>
                        </TouchableOpacity>
                    )}

                    {/* Right FAB - Delete */}
                    <TouchableOpacity
                        style={styles.fabRight}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            Alert.alert(
                                Translations.deleteCase[language],
                                Translations.deleteCaseConfirm[language],
                                [
                                    { text: Translations.cancel[language], style: 'cancel' },
                                    {
                                        text: Translations.delete[language],
                                        style: 'destructive',
                                        onPress: async () => {
                                            try {
                                                setIsDeleting(true);
                                                await deleteCase(id!);
                                                setIsDeleted(true);
                                                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                                router.back();
                                            } catch (err) {
                                                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                                                Alert.alert(Translations.error[language], Translations.deleteCaseError[language]);
                                            } finally {
                                                setIsDeleting(false);
                                            }
                                        },
                                    },
                                ]
                            );
                        }}
                        activeOpacity={0.8}
                        disabled={isDeleting}
                    >
                        <BlurView intensity={80} tint="light" style={styles.fabBlur}>
                            <View style={[styles.fabContent, styles.fabDelete, isDeleting && styles.fabDisabled]}>
                                {isDeleting ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <Trash2 size={22} color="#FFFFFF" strokeWidth={2.5} />
                                )}
                            </View>
                        </BlurView>
                        <View style={styles.fabLabelContainer}>
                            <Text style={[styles.fabLabel, styles.fabLabelDelete]}>{language === 'tr' ? 'Sil' : 'Delete'}</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
        </ImageBackground>
    );
}

// Info row component
function InfoRow({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
}) {
    return (
        <View style={styles.infoRow}>
            <View style={styles.infoRowLeft}>
                {icon}
                <Text style={styles.infoLabel}>{label}</Text>
            </View>
            <Text style={styles.infoValue}>{value}</Text>
        </View>
    );
}

// Diagnosis card component with glassmorphism
function DiagnosisCard({
    diagnosis,
    rank,
    language = 'tr',
    isFirst = false,
}: {
    diagnosis: DiagnosisResult;
    rank: number;
    language?: 'tr' | 'en';
    isFirst?: boolean;
}) {
    return (
        <View style={[styles.diagnosisCardWrapper, isFirst && styles.diagnosisCardFirst]}>
            <BlurView intensity={60} tint="light" style={styles.diagnosisCardBlur}>
                <View style={styles.diagnosisCard}>
                    {/* Header */}
                    <View style={styles.diagnosisHeader}>
                        <View style={styles.rankBadge}>
                            <Text style={styles.rankText}>#{rank}</Text>
                        </View>
                        <View style={styles.diagnosisInfo}>
                            <Text style={styles.diagnosisName} numberOfLines={2}>
                                {diagnosis.name}
                            </Text>
                        </View>
                        <ConfidenceBadge confidence={diagnosis.confidence} size="sm" />
                    </View>

                    {/* Description */}
                    {diagnosis.description && (
                        <Text style={styles.diagnosisDescription}>
                            {diagnosis.description}
                        </Text>
                    )}

                    {/* Key Features */}
                    {diagnosis.keyFeatures && diagnosis.keyFeatures.length > 0 && (
                        <View style={styles.featuresSection}>
                            <Text style={styles.featuresSectionTitle}>
                                {language === 'tr' ? 'Temel Özellikler' : 'Key Features'}
                            </Text>
                            {diagnosis.keyFeatures.slice(0, 4).map((feature, index) => (
                                <View key={index} style={styles.featureRow}>
                                    <View style={styles.featureDot} />
                                    <Text style={styles.featureItem}>{feature}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Recommendations */}
                    {diagnosis.recommendations && diagnosis.recommendations.length > 0 && (
                        <View style={styles.recommendationsSection}>
                            <Text style={styles.featuresSectionTitle}>
                                {Translations.recommendations[language]}
                            </Text>
                            {diagnosis.recommendations.slice(0, 4).map((rec, index) => (
                                <View key={index} style={styles.recommendationRow}>
                                    <ChevronRight size={14} color="#0891B2" />
                                    <Text style={styles.recommendationItem}>{rec}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            </BlurView>
        </View>
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

    // Analyzing Banner
    analyzingBannerWrapper: {
        marginBottom: Spacing.lg,
        borderRadius: 16,
        overflow: 'hidden',
    },
    analyzingBannerBlur: {
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#0891B2',
        ...Platform.select({
            android: {
                backgroundColor: 'rgba(8, 145, 178, 0.1)',
            },
            ios: {},
        }),
    },
    analyzingBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.lg,
        backgroundColor: Platform.select({
            android: 'transparent',
            ios: 'rgba(8, 145, 178, 0.1)',
        }),
    },
    analyzingTextContainer: {
        flex: 1,
        marginLeft: Spacing.md,
    },
    analyzingTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0891B2',
        marginBottom: 4,
    },
    analyzingSubtitle: {
        fontSize: 13,
        color: '#64748B',
        lineHeight: 18,
    },

    // Custom Header
    customHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        position: 'relative',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        overflow: 'hidden',
        zIndex: 1,
    },
    backButtonBlur: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        borderRadius: 20,
        backgroundColor: Platform.select({
            android: 'rgba(255, 255, 255, 0.2)',
            ios: 'rgba(255, 255, 255, 0.2)',
        }),
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#0F172A',
        position: 'absolute',
        left: 0,
        right: 0,
        textAlign: 'center',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        zIndex: 1,
    },
    headerIconButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        overflow: 'hidden',
    },
    headerIconBlur: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        borderRadius: 18,
        backgroundColor: Platform.select({
            android: 'rgba(255, 255, 255, 0.2)',
            ios: 'rgba(255, 255, 255, 0.25)',
        }),
    },

    // Scroll
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: Spacing.lg,
        paddingBottom: 100,
    },

    // Hero Card
    heroCardWrapper: {
        marginBottom: Spacing.lg,
        borderRadius: 20,
        overflow: 'hidden',
    },
    heroCardBlur: {
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        ...Platform.select({
            android: {
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
            },
            ios: {},
        }),
    },
    heroCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.lg,
        backgroundColor: Platform.select({
            android: 'transparent',
            ios: 'rgba(255, 255, 255, 0.2)',
        }),
    },
    heroIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: '#0891B2',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.md,
    },
    heroContent: {
        flex: 1,
        marginRight: Spacing.sm,
    },
    heroLabel: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500',
        marginBottom: 4,
    },
    heroTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#0F172A',
        lineHeight: 22,
    },

    // Section
    sectionWrapper: {
        marginBottom: Spacing.lg,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0F172A',
        marginBottom: Spacing.sm,
    },
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },

    // Images
    imagesContainer: {
        gap: 12,
    },
    imageWrapper: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    imageBlur: {
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.6)',
    },
    lesionImage: {
        width: 140,
        height: 140,
        borderRadius: 14,
    },

    // Info Card
    infoCardWrapper: {
        borderRadius: 18,
        overflow: 'hidden',
    },
    infoCardBlur: {
        borderRadius: 18,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        ...Platform.select({
            android: {
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
            },
            ios: {},
        }),
    },
    infoCard: {
        padding: Spacing.lg,
        backgroundColor: Platform.select({
            android: 'transparent',
            ios: 'rgba(255, 255, 255, 0.2)',
        }),
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: Spacing.sm,
    },
    infoRowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    infoLabel: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
    },
    infoValue: {
        fontSize: 14,
        color: '#0F172A',
        fontWeight: '600',
        maxWidth: '50%',
        textAlign: 'right',
    },
    infoDivider: {
        height: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.06)',
        marginVertical: 4,
    },

    // Symptoms Card
    symptomsCardWrapper: {
        borderRadius: 18,
        overflow: 'hidden',
    },
    symptomsCardBlur: {
        borderRadius: 18,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        ...Platform.select({
            android: {
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
            },
            ios: {},
        }),
    },
    symptomsCard: {
        padding: Spacing.lg,
        backgroundColor: Platform.select({
            android: 'transparent',
            ios: 'rgba(255, 255, 255, 0.2)',
        }),
    },
    symptomsChipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    symptomChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(8, 145, 178, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(8, 145, 178, 0.3)',
    },
    symptomChipText: {
        fontSize: 13,
        color: '#0891B2',
        fontWeight: '600',
    },
    additionalSymptoms: {
        fontSize: 14,
        color: '#64748B',
        marginTop: Spacing.md,
        fontStyle: 'italic',
        lineHeight: 20,
    },

    // Diagnosis Card
    diagnosisCardWrapper: {
        marginBottom: Spacing.md,
        borderRadius: 18,
        overflow: 'hidden',
    },
    diagnosisCardFirst: {
        shadowOpacity: 0.18,
    },
    diagnosisCardBlur: {
        borderRadius: 18,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        ...Platform.select({
            android: {
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
            },
            ios: {},
        }),
    },
    diagnosisCard: {
        padding: Spacing.lg,
        backgroundColor: Platform.select({
            android: 'transparent',
            ios: 'rgba(255, 255, 255, 0.25)',
        }),
    },
    diagnosisHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    rankBadge: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(8, 145, 178, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.md,
        borderWidth: 1,
        borderColor: 'rgba(8, 145, 178, 0.3)',
    },
    rankText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0891B2',
    },
    diagnosisInfo: {
        flex: 1,
        marginRight: Spacing.sm,
    },
    diagnosisName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0F172A',
        lineHeight: 21,
    },
    diagnosisDescription: {
        fontSize: 14,
        color: '#64748B',
        lineHeight: 20,
        marginBottom: Spacing.md,
    },
    featuresSection: {
        marginTop: Spacing.sm,
        paddingTop: Spacing.md,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0, 0, 0, 0.06)',
    },
    featuresSectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#475569',
        marginBottom: Spacing.sm,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 6,
    },
    featureDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#0891B2',
        marginRight: 10,
        marginTop: 6,
    },
    featureItem: {
        flex: 1,
        fontSize: 13,
        color: '#64748B',
        lineHeight: 18,
    },
    recommendationsSection: {
        marginTop: Spacing.md,
        paddingTop: Spacing.md,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0, 0, 0, 0.06)',
    },
    recommendationRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 6,
    },
    recommendationItem: {
        flex: 1,
        fontSize: 13,
        color: '#64748B',
        lineHeight: 18,
        marginLeft: 4,
    },

    // Action Section
    actionSection: {
        marginTop: Spacing.md,
        marginBottom: Spacing.lg,
    },
    reportButtonWrapper: {
        borderRadius: 24,
        overflow: 'hidden',
    },
    reportButtonBlur: {
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    reportButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        paddingHorizontal: 24,
        backgroundColor: 'rgba(8, 145, 178, 0.85)',
        gap: 12,
    },
    reportButtonDisabled: {
        opacity: 0.6,
    },
    reportIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    reportButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },

    // Quick Actions Bar
    quickActionsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.md,
    },
    quickActionButton: {
        flex: 1,
        maxWidth: 140,
        borderRadius: 16,
        overflow: 'hidden',
    },
    quickActionBlur: {
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    quickActionContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        gap: 8,
    },
    quickActionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0891B2',
    },

    // Disclaimer
    disclaimerWrapper: {
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: Spacing.lg,
    },
    disclaimerBlur: {
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(245, 158, 11, 0.3)',
    },
    disclaimer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        backgroundColor: 'rgba(254, 243, 199, 0.5)',
        gap: 10,
    },
    disclaimerText: {
        flex: 1,
        fontSize: 12,
        color: '#92400E',
        lineHeight: 18,
    },

    // Delete Button
    deleteButtonWrapper: {
        marginBottom: Spacing.lg,
        borderRadius: 20,
        overflow: 'hidden',
    },
    deleteButtonTouchable: {
        borderRadius: 20,
        overflow: 'hidden',
    },
    deleteButtonBlur: {
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    deleteButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        backgroundColor: 'rgba(239, 68, 68, 0.85)',
        gap: 10,
    },
    deleteButtonDisabled: {
        opacity: 0.6,
    },
    deleteButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },

    // Lesion Tracking Button Styles
    trackingButtonWrapper: {
        marginTop: Spacing.lg,
        borderRadius: 20,
        overflow: 'hidden',
    },
    trackingButtonTouchable: {
        borderRadius: 20,
        overflow: 'hidden',
    },
    trackingButtonBlur: {
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(8, 145, 178, 0.3)',
    },
    trackingButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        backgroundColor: 'rgba(8, 145, 178, 0.1)',
        gap: 10,
    },
    trackingButtonDisabled: {
        opacity: 0.6,
    },
    trackingButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0891B2',
    },
    proBadgeMini: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        gap: 3,
    },
    proBadgeMiniText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#F59E0B',
    },

    // Floating Action Button Styles
    fabContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
    },
    fabLeft: {
        alignItems: 'center',
    },
    fabRight: {
        alignItems: 'center',
        marginLeft: 'auto',
    },
    fabBlur: {
        borderRadius: 30,
        overflow: 'hidden',
    },
    fabContent: {
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    fabTracking: {
        backgroundColor: 'rgba(8, 145, 178, 0.9)',
    },
    fabDelete: {
        backgroundColor: 'rgba(239, 68, 68, 0.9)',
    },
    fabDisabled: {
        opacity: 0.6,
    },
    fabLabelContainer: {
        marginTop: 6,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
    },
    fabLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    fabLabelDelete: {
        color: '#FFFFFF',
    },

    // User Notes Styles
    notesCardWrapper: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    notesCardBlur: {
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(245, 158, 11, 0.3)',
    },
    notesCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 16,
        backgroundColor: 'rgba(245, 158, 11, 0.08)',
        gap: 12,
    },
    notesIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    notesText: {
        flex: 1,
        fontSize: 15,
        lineHeight: 22,
        color: '#374151',
        fontStyle: 'italic',
    },
});
