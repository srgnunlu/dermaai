/**
 * Diagnosis Results Component - Premium Swipeable Card Design
 * Displays AI analysis results with horizontal swipeable glassmorphism cards
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    FlatList,
    TouchableOpacity,
    Animated,
    Platform,
    Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import {
    CheckCircle,
    AlertTriangle,
    ChevronRight,
    RefreshCw,
    Sparkles,
    Stethoscope,
} from 'lucide-react-native';
import { Colors, getConfidenceColor } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing, Shadows } from '@/constants/Spacing';
import { useColorScheme } from '@/components/useColorScheme';
import { Button } from '@/components/ui';
import type { AnalysisResponse, DiagnosisResult } from '@/types/schema';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - Spacing.xl * 2;
const CARD_MARGIN = Spacing.sm;

// Pulsing Arrow Component for swipe hint
function PulsingArrow() {
    const opacity = useRef(new Animated.Value(0.3)).current;
    const translateX = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.parallel([
                Animated.sequence([
                    Animated.timing(opacity, {
                        toValue: 1,
                        duration: 800,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(opacity, {
                        toValue: 0.3,
                        duration: 800,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ]),
                Animated.sequence([
                    Animated.timing(translateX, {
                        toValue: 5,
                        duration: 800,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(translateX, {
                        toValue: 0,
                        duration: 800,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ]),
            ])
        );
        animation.start();
        return () => animation.stop();
    }, [opacity, translateX]);

    return (
        <Animated.View style={{ opacity, transform: [{ translateX }] }}>
            <ChevronRight size={24} color="rgba(8,145,178,0.6)" />
        </Animated.View>
    );
}

interface DiagnosisResultsProps {
    caseData: AnalysisResponse;
    onNewAnalysis: () => void;
    onRequestSecondaryAnalysis?: () => void;
}

export function DiagnosisResults({
    caseData,
    onNewAnalysis,
    onRequestSecondaryAnalysis,
}: DiagnosisResultsProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    const [activeIndex, setActiveIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);

    // Get diagnoses from gemini (primary) analysis
    const diagnoses = caseData.geminiAnalysis?.diagnoses || [];
    const hasErrors = caseData.analysisErrors && caseData.analysisErrors.length > 0;
    const hasSecondaryAnalysis = caseData.openaiAnalysis?.diagnoses && caseData.openaiAnalysis.diagnoses.length > 0;

    // Handle scroll with haptic feedback
    const handleScroll = useCallback((event: any) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / (CARD_WIDTH + CARD_MARGIN * 2));

        if (index !== activeIndex && index >= 0 && index < diagnoses.length) {
            setActiveIndex(index);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    }, [activeIndex, diagnoses.length]);

    // Render pagination dots
    const renderPaginationDots = () => (
        <View style={styles.paginationContainer}>
            {diagnoses.map((_, index) => (
                <View
                    key={index}
                    style={[
                        styles.paginationDot,
                        {
                            backgroundColor: index === activeIndex
                                ? colors.primary
                                : colors.muted,
                            width: index === activeIndex ? 20 : 8,
                        },
                    ]}
                />
            ))}
        </View>
    );

    // Render single diagnosis card
    const renderDiagnosisCard = ({ item, index }: { item: DiagnosisResult; index: number }) => (
        <DiagnosisCard
            diagnosis={item}
            rank={index + 1}
            isFirst={index === 0}
            isLast={index === diagnoses.length - 1}
            showArrow={diagnoses.length > 1 && index < diagnoses.length - 1 && index < 4}
            colors={colors}
            colorScheme={colorScheme}
        />
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Background Gradient */}
            <LinearGradient
                colors={['#E0F7FA', '#B2EBF2', '#E0F7FA']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.backgroundGradient}
            />

            {/* DermAssistAI Header */}
            <View style={styles.brandHeader}>
                <Text style={styles.brandTitle}>DermAssistAI</Text>
            </View>

            {/* Errors (if any) */}
            {hasErrors && (
                <View style={[styles.errorBanner, { backgroundColor: colors.warningLight }]}>
                    <AlertTriangle size={18} color={colors.warning} />
                    <Text style={[styles.errorText, { color: colors.warning }]}>
                        Analiz sırasında bazı sorunlar oluştu.
                    </Text>
                </View>
            )}

            {/* Diagnosis Cards - Horizontal Scroll */}
            {diagnoses.length > 0 ? (
                <>
                    <FlatList
                        ref={flatListRef}
                        data={diagnoses}
                        renderItem={renderDiagnosisCard}
                        keyExtractor={(_, index) => `diagnosis-${index}`}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        snapToInterval={CARD_WIDTH + CARD_MARGIN * 2}
                        decelerationRate="fast"
                        contentContainerStyle={styles.cardsContainer}
                        onScroll={handleScroll}
                        scrollEventThrottle={16}
                    />

                    {/* Pagination Dots Only */}
                    {diagnoses.length > 1 && (
                        <View style={styles.paginationSection}>
                            {renderPaginationDots()}
                        </View>
                    )}
                </>
            ) : (
                <View style={styles.noResultsContainer}>
                    <BlurView intensity={50} tint="light" style={styles.noResultsBlur}>
                        <View style={styles.noResults}>
                            <Stethoscope size={48} color={colors.textMuted} />
                            <Text style={[styles.noResultsText, { color: colors.textSecondary }]}>
                                Analiz sonucu bulunamadı.{'\n'}Lütfen tekrar deneyin.
                            </Text>
                        </View>
                    </BlurView>
                </View>
            )}

            {/* Disclaimer - Compact */}
            <View style={styles.disclaimer}>
                <AlertTriangle size={14} color="#D97706" />
                <Text style={styles.disclaimerText}>
                    Bu analiz sadece bilgi amaçlıdır. Dermatolog kontrolü önerilir.
                </Text>
            </View>

            {/* Action Buttons Row */}
            <View style={styles.buttonRow}>
                <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={onNewAnalysis}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={['#0E7490', '#0891B2', '#06B6D4']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.primaryButtonGradient}
                    >
                        <RefreshCw size={16} color="#FFFFFF" />
                        <Text style={styles.primaryButtonText}>Yeni Analiz</Text>
                    </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.secondaryIconButton}
                    onPress={onRequestSecondaryAnalysis}
                    activeOpacity={0.7}
                >
                    <Sparkles size={20} color="#0891B2" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

// Premium Glassmorphism Diagnosis Card
function DiagnosisCard({
    diagnosis,
    rank,
    isFirst,
    isLast,
    showArrow,
    colors,
    colorScheme,
}: {
    diagnosis: DiagnosisResult;
    rank: number;
    isFirst: boolean;
    isLast: boolean;
    showArrow: boolean;
    colors: typeof Colors.light;
    colorScheme: 'light' | 'dark';
}) {
    const confidenceColor = getConfidenceColor(diagnosis.confidence, colorScheme);

    return (
        <View style={styles.cardWrapper}>
            <BlurView intensity={80} tint="light" style={styles.cardBlur}>
                <View style={styles.card}>
                    {/* Glass highlight effect */}
                    <LinearGradient
                        colors={['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.1)', 'transparent']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 0.3 }}
                        style={styles.glassHighlight}
                    />

                    {/* Card Header */}
                    <View style={styles.cardHeader}>
                        <View style={styles.rankContainer}>
                            <LinearGradient
                                colors={isFirst ? ['#0E7490', '#0891B2', '#06B6D4'] : ['rgba(8,145,178,0.2)', 'rgba(8,145,178,0.1)']}
                                style={styles.rankBadge}
                            >
                                <Text style={[styles.rankText, { color: isFirst ? '#FFFFFF' : colors.primary }]}>
                                    #{rank}
                                </Text>
                            </LinearGradient>
                            {isFirst && (
                                <Text style={[styles.primaryLabel, { color: colors.primary }]}>
                                    Ana Tanı
                                </Text>
                            )}
                        </View>

                        {/* Confidence Badge */}
                        <View style={[styles.confidenceBadge, { backgroundColor: confidenceColor + '20' }]}>
                            <Text style={[styles.confidenceText, { color: confidenceColor }]}>
                                %{diagnosis.confidence}
                            </Text>
                        </View>
                    </View>

                    {/* Diagnosis Name */}
                    <Text style={[styles.diagnosisName, { color: colors.text }]} numberOfLines={2}>
                        {diagnosis.name}
                    </Text>

                    {/* Confidence Progress Bar */}
                    <View style={styles.progressContainer}>
                        <View style={[styles.progressBg, { backgroundColor: 'rgba(8,145,178,0.15)' }]}>
                            <LinearGradient
                                colors={[confidenceColor, confidenceColor + 'CC']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={[styles.progressFill, { width: `${diagnosis.confidence}%` }]}
                            />
                        </View>
                    </View>

                    {/* Description */}
                    {diagnosis.description && (
                        <Text style={[styles.description, { color: colors.textSecondary }]}>
                            {diagnosis.description}
                        </Text>
                    )}

                    {/* Key Features */}
                    {diagnosis.keyFeatures && diagnosis.keyFeatures.length > 0 && (
                        <View style={styles.featuresSection}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                📋 Temel Özellikler
                            </Text>
                            {diagnosis.keyFeatures.slice(0, 3).map((feature, idx) => (
                                <View key={idx} style={styles.featureRow}>
                                    <View style={[styles.featureDot, { backgroundColor: colors.primary }]} />
                                    <Text style={[styles.featureText, { color: colors.textSecondary }]} numberOfLines={2}>
                                        {feature}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Recommendations */}
                    {diagnosis.recommendations && diagnosis.recommendations.length > 0 && (
                        <View style={[styles.recommendationsSection, { backgroundColor: 'rgba(8,145,178,0.08)' }]}>
                            <Text style={[styles.sectionTitle, { color: colors.info }]}>
                                💡 Öneriler
                            </Text>
                            {diagnosis.recommendations.slice(0, 2).map((rec, idx) => (
                                <Text key={idx} style={[styles.recommendationText, { color: colors.textSecondary }]} numberOfLines={2}>
                                    → {rec}
                                </Text>
                            ))}
                        </View>
                    )}
                </View>
            </BlurView>

            {/* Pulsing Arrow Indicator */}
            {showArrow && (
                <View style={styles.arrowIndicator}>
                    <PulsingArrow />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    backgroundGradient: {
        ...StyleSheet.absoluteFillObject,
    },
    headerBlur: {
        marginHorizontal: Spacing.lg,
        marginTop: Spacing.lg,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.6)',
    },
    successHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    successIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(16,185,129,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.md,
    },
    successText: {
        flex: 1,
    },
    successTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#10B981',
        marginBottom: 2,
    },
    successSubtitle: {
        fontSize: 13,
        color: '#64748B',
    },
    errorBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: Spacing.lg,
        marginTop: Spacing.sm,
        padding: Spacing.md,
        borderRadius: 12,
        gap: Spacing.sm,
    },
    errorText: {
        fontSize: 13,
        flex: 1,
    },
    brandHeader: {
        alignItems: 'center',
        paddingTop: Spacing['2xl'],
        paddingBottom: Spacing.sm,
    },
    brandTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#0E7490',
        letterSpacing: -0.5,
    },
    brandSubtitle: {
        fontSize: 14,
        marginTop: 4,
    },
    paginationSection: {
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    swipeHint: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: Spacing.sm,
        gap: 4,
    },
    swipeHintText: {
        fontSize: 13,
        fontWeight: '500',
    },
    cardsContainer: {
        paddingHorizontal: Spacing.lg - CARD_MARGIN,
        paddingVertical: Spacing.sm,
        flex: 1,
    },
    cardWrapper: {
        width: CARD_WIDTH,
        marginHorizontal: CARD_MARGIN,
        position: 'relative',
    },
    arrowIndicator: {
        position: 'absolute',
        right: -8,
        top: '50%',
        marginTop: -12,
        zIndex: 10,
    },
    cardBlur: {
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.6)',
        height: 480,
        ...Shadows.md,
    },
    card: {
        padding: Spacing.md,
        paddingTop: Spacing.lg,
        backgroundColor: 'rgba(255,255,255,0.35)',
        height: '100%',
    },
    glassHighlight: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 80,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    rankContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    rankBadge: {
        width: 32,
        height: 32,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rankText: {
        fontSize: 14,
        fontWeight: '800',
    },
    primaryLabel: {
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    confidenceBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 16,
    },
    confidenceText: {
        fontSize: 14,
        fontWeight: '700',
    },
    diagnosisName: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: Spacing.sm,
        lineHeight: 22,
    },
    progressContainer: {
        marginBottom: Spacing.sm,
    },
    progressBg: {
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    description: {
        fontSize: 12,
        lineHeight: 16,
        marginBottom: Spacing.sm,
    },
    featuresSection: {
        marginBottom: Spacing.sm,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 3,
    },
    featureDot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
        marginTop: 5,
        marginRight: Spacing.xs,
    },
    featureText: {
        flex: 1,
        fontSize: 11,
        lineHeight: 15,
    },
    recommendationsSection: {
        padding: Spacing.sm,
        borderRadius: 10,
    },
    recommendationText: {
        fontSize: 11,
        lineHeight: 15,
        marginBottom: 2,
    },
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
        marginBottom: Spacing.md,
    },
    paginationDot: {
        height: 8,
        borderRadius: 4,
    },
    noResultsContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
    },
    noResultsBlur: {
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.6)',
    },
    noResults: {
        padding: Spacing.xl,
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    noResultsText: {
        fontSize: 15,
        textAlign: 'center',
        marginTop: Spacing.md,
        lineHeight: 22,
    },
    disclaimer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.sm,
        padding: Spacing.sm,
        borderRadius: 8,
        backgroundColor: 'rgba(251, 191, 36, 0.12)',
        gap: Spacing.xs,
    },
    disclaimerText: {
        flex: 1,
        fontSize: 11,
        color: '#D97706',
        lineHeight: 14,
    },
    buttonRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing['2xl'],
        gap: Spacing.sm,
    },
    primaryButton: {
        flex: 1,
        borderRadius: 14,
        overflow: 'hidden',
        ...Shadows.md,
    },
    primaryButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: Spacing.lg,
        gap: Spacing.sm,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '600',
    },
    secondaryIconButton: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: 'rgba(8, 145, 178, 0.12)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(8, 145, 178, 0.2)',
    },
});
