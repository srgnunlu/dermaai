/**
 * Lesion Comparison Detail Screen
 * Shows detailed AI comparison analysis between two lesion snapshots
 */

import React from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    ImageBackground,
    Image,
    Platform,
    Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { format } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import * as Haptics from 'expo-haptics';
import {
    ArrowLeft,
    ArrowRight,
    TrendingUp,
    TrendingDown,
    Minus,
    AlertTriangle,
    CheckCircle,
    Maximize2,
    Palette,
    Circle,
    Layers,
    Clock,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Spacing } from '@/constants/Spacing';
import { useLanguage } from '@/contexts/LanguageContext';
import { useComparisonDetail, useRiskLevelStyle } from '@/hooks/useLesionTracking';
import { LoadingSpinner, EmptyState } from '@/components/ui';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_SIZE = (SCREEN_WIDTH - Spacing.lg * 2 - 20) / 2;

export default function ComparisonDetailScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { language } = useLanguage();
    const insets = useSafeAreaInsets();
    const dateLocale = language === 'tr' ? tr : enUS;

    const {
        comparison,
        previousSnapshot,
        currentSnapshot,
        tracking,
        isLoading,
        error,
    } = useComparisonDetail(id || '');

    const { getRiskColor, getRiskLabel, getProgressionLabel } = useRiskLevelStyle();

    if (isLoading) {
        return (
            <ImageBackground
                source={require('@/assets/images/home-bg.png')}
                style={styles.backgroundImage}
                resizeMode="cover"
            >
                <Stack.Screen options={{ headerShown: false }} />
                <View style={[styles.container, styles.centered]}>
                    <LoadingSpinner text={language === 'tr' ? 'Yükleniyor...' : 'Loading...'} />
                </View>
            </ImageBackground>
        );
    }

    if (error || !comparison || !comparison.comparisonAnalysis) {
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
                        title={language === 'tr' ? 'Karşılaştırma bulunamadı' : 'Comparison not found'}
                        description={language === 'tr'
                            ? 'Bu karşılaştırma mevcut değil.'
                            : 'This comparison does not exist.'}
                        actionLabel={language === 'tr' ? 'Geri Dön' : 'Go Back'}
                        onAction={() => router.back()}
                    />
                </View>
            </ImageBackground>
        );
    }

    const analysis = comparison.comparisonAnalysis;
    const riskColors = getRiskColor(analysis.riskLevel);

    const getProgressionIcon = (progression: string) => {
        switch (progression) {
            case 'stable':
                return <Minus size={20} color="#64748B" />;
            case 'improved':
                return <TrendingDown size={20} color="#22C55E" />;
            case 'worsened':
                return <TrendingUp size={20} color="#EF4444" />;
            case 'significant_change':
                return <AlertTriangle size={20} color="#F59E0B" />;
            default:
                return <Minus size={20} color="#64748B" />;
        }
    };

    const getProgressionColor = (progression: string) => {
        switch (progression) {
            case 'stable':
                return '#64748B';
            case 'improved':
                return '#22C55E';
            case 'worsened':
                return '#EF4444';
            case 'significant_change':
                return '#F59E0B';
            default:
                return '#64748B';
        }
    };

    const previousDate = previousSnapshot?.createdAt
        ? format(new Date(previousSnapshot.createdAt), 'dd MMM yyyy', { locale: dateLocale })
        : '-';

    const currentDate = currentSnapshot?.createdAt
        ? format(new Date(currentSnapshot.createdAt), 'dd MMM yyyy', { locale: dateLocale })
        : '-';

    return (
        <ImageBackground
            source={require('@/assets/images/home-bg.png')}
            style={styles.backgroundImage}
            resizeMode="cover"
        >
            <Stack.Screen options={{ headerShown: false }} />
            <View style={[styles.container, { paddingTop: insets.top }]}>
                {/* Header */}
                <View style={styles.header}>
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

                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerTitle}>
                            {language === 'tr' ? 'Karşılaştırma Analizi' : 'Comparison Analysis'}
                        </Text>
                        {tracking && (
                            <Text style={styles.headerSubtitle} numberOfLines={1}>
                                {tracking.name}
                            </Text>
                        )}
                    </View>

                    <View style={styles.headerSpacer} />
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Risk & Progression Banner */}
                    <View style={styles.bannerWrapper}>
                        <LinearGradient
                            colors={[riskColors.bg, 'rgba(255,255,255,0.95)']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.bannerGradient}
                        >
                            <View style={[styles.riskIndicator, { borderColor: riskColors.border }]}>
                                <Text style={[styles.riskLabel, { color: riskColors.text }]}>
                                    {getRiskLabel(analysis.riskLevel, language)}
                                </Text>
                            </View>

                            <View style={styles.progressionContainer}>
                                {getProgressionIcon(analysis.overallProgression)}
                                <Text
                                    style={[
                                        styles.progressionLabel,
                                        { color: getProgressionColor(analysis.overallProgression) },
                                    ]}
                                >
                                    {getProgressionLabel(analysis.overallProgression, language)}
                                </Text>
                            </View>

                            <View style={styles.timeContainer}>
                                <Clock size={14} color="#64748B" />
                                <Text style={styles.timeText}>{analysis.timeElapsed}</Text>
                            </View>
                        </LinearGradient>
                    </View>

                    {/* Image Comparison */}
                    <View style={styles.imageComparisonWrapper}>
                        <BlurView intensity={70} tint="light" style={styles.imageComparisonBlur}>
                            <View style={styles.imageComparison}>
                                <View style={styles.imageColumn}>
                                    <Text style={styles.imageLabel}>
                                        {language === 'tr' ? '📅 Önceki' : '📅 Before'}
                                    </Text>
                                    <Text style={styles.imageDateText}>{previousDate}</Text>
                                    {previousSnapshot?.imageUrls?.[0] ? (
                                        <Image
                                            source={{ uri: previousSnapshot.imageUrls[0] }}
                                            style={styles.comparisonImage}
                                            resizeMode="cover"
                                        />
                                    ) : (
                                        <View style={[styles.comparisonImage, styles.placeholderImage]}>
                                            <Text style={styles.placeholderText}>?</Text>
                                        </View>
                                    )}
                                </View>

                                <View style={styles.arrowContainer}>
                                    <ArrowRight size={24} color="#0891B2" />
                                </View>

                                <View style={styles.imageColumn}>
                                    <Text style={styles.imageLabel}>
                                        {language === 'tr' ? '📅 Şimdi' : '📅 After'}
                                    </Text>
                                    <Text style={styles.imageDateText}>{currentDate}</Text>
                                    {currentSnapshot?.imageUrls?.[0] ? (
                                        <Image
                                            source={{ uri: currentSnapshot.imageUrls[0] }}
                                            style={styles.comparisonImage}
                                            resizeMode="cover"
                                        />
                                    ) : (
                                        <View style={[styles.comparisonImage, styles.placeholderImage]}>
                                            <Text style={styles.placeholderText}>?</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        </BlurView>
                    </View>

                    {/* Change Summary */}
                    <View style={styles.sectionWrapper}>
                        <Text style={styles.sectionTitle}>
                            {language === 'tr' ? '📋 Değişim Özeti' : '📋 Change Summary'}
                        </Text>
                        <View style={styles.summaryCardWrapper}>
                            <BlurView intensity={65} tint="light" style={styles.summaryCardBlur}>
                                <View style={styles.summaryCard}>
                                    <Text style={styles.summaryText}>{analysis.changeSummary}</Text>
                                </View>
                            </BlurView>
                        </View>
                    </View>

                    {/* Detailed Changes */}
                    <View style={styles.sectionWrapper}>
                        <Text style={styles.sectionTitle}>
                            {language === 'tr' ? '🔍 Detaylı Değişiklikler' : '🔍 Detailed Changes'}
                        </Text>

                        <View style={styles.changesGrid}>
                            {/* Size Change */}
                            <ChangeCard
                                icon={<Maximize2 size={18} color="#0891B2" />}
                                title={language === 'tr' ? 'Boyut' : 'Size'}
                                value={analysis.sizeChange}
                                language={language}
                            />

                            {/* Color Change */}
                            <ChangeCard
                                icon={<Palette size={18} color="#8B5CF6" />}
                                title={language === 'tr' ? 'Renk' : 'Color'}
                                value={analysis.colorChange}
                                language={language}
                            />

                            {/* Border Change */}
                            <ChangeCard
                                icon={<Circle size={18} color="#F59E0B" />}
                                title={language === 'tr' ? 'Kenar' : 'Border'}
                                value={analysis.borderChange}
                                language={language}
                            />

                            {/* Texture Change */}
                            <ChangeCard
                                icon={<Layers size={18} color="#10B981" />}
                                title={language === 'tr' ? 'Doku' : 'Texture'}
                                value={analysis.textureChange}
                                language={language}
                            />
                        </View>
                    </View>

                    {/* Detailed Analysis */}
                    <View style={styles.sectionWrapper}>
                        <Text style={styles.sectionTitle}>
                            {language === 'tr' ? '🧠 Detaylı Analiz' : '🧠 Detailed Analysis'}
                        </Text>
                        <View style={styles.analysisCardWrapper}>
                            <BlurView intensity={65} tint="light" style={styles.analysisCardBlur}>
                                <View style={styles.analysisCard}>
                                    <Text style={styles.analysisText}>{analysis.detailedAnalysis}</Text>
                                </View>
                            </BlurView>
                        </View>
                    </View>

                    {/* Recommendations */}
                    {analysis.recommendations && analysis.recommendations.length > 0 && (
                        <View style={styles.sectionWrapper}>
                            <Text style={styles.sectionTitle}>
                                {language === 'tr' ? '💡 Öneriler' : '💡 Recommendations'}
                            </Text>
                            <View style={styles.recommendationsWrapper}>
                                <BlurView intensity={65} tint="light" style={styles.recommendationsBlur}>
                                    <View style={styles.recommendationsCard}>
                                        {analysis.recommendations.map((rec, index) => (
                                            <View key={index} style={styles.recommendationItem}>
                                                <View style={styles.recommendationBullet}>
                                                    <CheckCircle size={16} color="#0891B2" />
                                                </View>
                                                <Text style={styles.recommendationText}>{rec}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </BlurView>
                            </View>
                        </View>
                    )}

                    {/* Analysis Time */}
                    <View style={styles.analysisTimeContainer}>
                        <Text style={styles.analysisTimeText}>
                            ⏱️ {language === 'tr' ? 'Analiz süresi:' : 'Analysis time:'}{' '}
                            {analysis.analysisTime.toFixed(1)}s
                        </Text>
                    </View>
                </ScrollView>
            </View>
        </ImageBackground>
    );
}

// Change Card Component
function ChangeCard({
    icon,
    title,
    value,
    language,
}: {
    icon: React.ReactNode;
    title: string;
    value: string | null;
    language: 'tr' | 'en';
}) {
    const noChange = language === 'tr' ? 'Değişiklik yok' : 'No change';

    return (
        <View style={styles.changeCardWrapper}>
            <BlurView intensity={60} tint="light" style={styles.changeCardBlur}>
                <View style={styles.changeCard}>
                    <View style={styles.changeIconContainer}>{icon}</View>
                    <Text style={styles.changeTitle}>{title}</Text>
                    <Text
                        style={[styles.changeValue, !value && styles.changeValueNull]}
                        numberOfLines={3}
                    >
                        {value || noChange}
                    </Text>
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

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        overflow: 'hidden',
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
    headerTitleContainer: {
        flex: 1,
        marginLeft: Spacing.md,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#0F172A',
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 2,
    },
    headerSpacer: {
        width: 40,
    },

    // Scroll
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: Spacing.lg,
        paddingBottom: 100,
    },

    // Banner
    bannerWrapper: {
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: Spacing.lg,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
            },
            android: {
                elevation: 6,
            },
        }),
    },
    bannerGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Spacing.md,
    },
    riskIndicator: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 2,
        backgroundColor: 'rgba(255,255,255,0.8)',
    },
    riskLabel: {
        fontSize: 13,
        fontWeight: '700',
    },
    progressionContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    progressionLabel: {
        fontSize: 14,
        fontWeight: '600',
    },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    timeText: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500',
    },

    // Image Comparison
    imageComparisonWrapper: {
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: Spacing.lg,
    },
    imageComparisonBlur: {
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    imageComparison: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        backgroundColor: Platform.select({
            android: 'rgba(255, 255, 255, 0.1)',
            ios: 'rgba(255, 255, 255, 0.2)',
        }),
    },
    imageColumn: {
        flex: 1,
        alignItems: 'center',
    },
    imageLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#0F172A',
        marginBottom: 4,
    },
    imageDateText: {
        fontSize: 11,
        color: '#64748B',
        marginBottom: 8,
    },
    comparisonImage: {
        width: IMAGE_SIZE,
        height: IMAGE_SIZE,
        borderRadius: 14,
    },
    placeholderImage: {
        backgroundColor: 'rgba(0,0,0,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    placeholderText: {
        fontSize: 24,
        color: '#94A3B8',
    },
    arrowContainer: {
        paddingHorizontal: 8,
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

    // Summary Card
    summaryCardWrapper: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    summaryCardBlur: {
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    summaryCard: {
        padding: Spacing.md,
        backgroundColor: Platform.select({
            android: 'rgba(255, 255, 255, 0.1)',
            ios: 'rgba(255, 255, 255, 0.2)',
        }),
    },
    summaryText: {
        fontSize: 15,
        color: '#374151',
        lineHeight: 22,
    },

    // Changes Grid
    changesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    changeCardWrapper: {
        width: (SCREEN_WIDTH - Spacing.lg * 2 - 12) / 2,
        borderRadius: 14,
        overflow: 'hidden',
    },
    changeCardBlur: {
        borderRadius: 14,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    changeCard: {
        padding: Spacing.md,
        minHeight: 100,
        backgroundColor: Platform.select({
            android: 'rgba(255, 255, 255, 0.1)',
            ios: 'rgba(255, 255, 255, 0.2)',
        }),
    },
    changeIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: 'rgba(0,0,0,0.04)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    changeTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748B',
        marginBottom: 4,
    },
    changeValue: {
        fontSize: 12,
        color: '#374151',
        lineHeight: 16,
    },
    changeValueNull: {
        color: '#94A3B8',
        fontStyle: 'italic',
    },

    // Analysis Card
    analysisCardWrapper: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    analysisCardBlur: {
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    analysisCard: {
        padding: Spacing.md,
        backgroundColor: Platform.select({
            android: 'rgba(255, 255, 255, 0.1)',
            ios: 'rgba(255, 255, 255, 0.2)',
        }),
    },
    aiIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 10,
    },
    aiIndicatorText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#0891B2',
    },
    analysisText: {
        fontSize: 14,
        color: '#374151',
        lineHeight: 22,
    },

    // Recommendations
    recommendationsWrapper: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    recommendationsBlur: {
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    recommendationsCard: {
        padding: Spacing.md,
        backgroundColor: Platform.select({
            android: 'rgba(255, 255, 255, 0.1)',
            ios: 'rgba(255, 255, 255, 0.2)',
        }),
    },
    recommendationItem: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    recommendationBullet: {
        marginRight: 10,
        marginTop: 2,
    },
    recommendationText: {
        flex: 1,
        fontSize: 14,
        color: '#374151',
        lineHeight: 20,
    },

    // Analysis Time
    analysisTimeContainer: {
        alignItems: 'center',
        marginTop: Spacing.md,
        marginBottom: Spacing.lg,
    },
    analysisTimeText: {
        fontSize: 12,
        color: '#94A3B8',
    },
});

