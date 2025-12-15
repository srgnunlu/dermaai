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
    ImageBackground,
    ScrollView,
    Alert,
    ActivityIndicator,
    Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
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
    Check,
} from 'lucide-react-native';
import { Colors, getConfidenceColor } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing, Shadows } from '@/constants/Spacing';
import { Translations } from '@/constants/Translations';
import { useColorScheme } from '@/components/useColorScheme';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui';
import { api } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { hasTutorialBeenShown } from '@/lib/storage';
import { DiagnosisTutorial } from '@/components/DiagnosisTutorial';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { PaywallModal } from '@/components/PaywallModal';
import { Crown } from 'lucide-react-native';
import type { AnalysisResponse, DiagnosisResult } from '@/types/schema';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - Spacing.xl * 2;
const CARD_MARGIN = Spacing.sm;
// Card yüksekliğini ekrana göre dinamik hesapla (header, disclaimer, buttons için alan bırak)
const CARD_HEIGHT = SCREEN_HEIGHT - 320;
// Card + margin toplam genişlik
const ITEM_WIDTH = CARD_WIDTH + CARD_MARGIN * 2;
// Ortalama için kenar boşluğu
const SIDE_SPACING = (SCREEN_WIDTH - CARD_WIDTH) / 2 - CARD_MARGIN;

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
    onConfirmSuccess?: () => void;
}

export function DiagnosisResults({
    caseData,
    onNewAnalysis,
    onRequestSecondaryAnalysis,
    onConfirmSuccess,
}: DiagnosisResultsProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const { language } = useLanguage();
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const router = useRouter();
    const [activeIndex, setActiveIndex] = useState(0);
    const [activeProvider, setActiveProvider] = useState<'gemini' | 'openai'>('gemini');
    const [isSelecting, setIsSelecting] = useState(false);
    const [isSelected, setIsSelected] = useState(false);
    const [showTutorial, setShowTutorial] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const flatListRef = useRef<FlatList>(null);
    const successModalAnim = useRef(new Animated.Value(0)).current;

    // Subscription status for upgrade banner
    const { isPremium, getRemainingAnalysesText } = useSubscription();
    const [showPaywall, setShowPaywall] = useState(false);

    // Check if tutorial should be shown (first-time user - now user-based)
    useEffect(() => {
        const checkTutorial = async () => {
            // Use user ID for user-specific tutorial tracking
            const hasBeenShown = await hasTutorialBeenShown(user?.id);
            if (!hasBeenShown) {
                // Small delay to let the UI render first
                setTimeout(() => setShowTutorial(true), 500);
            }
        };
        checkTutorial();
    }, [user?.id]);

    // Get diagnoses based on active provider
    const geminiDiagnoses = caseData.geminiAnalysis?.diagnoses || [];
    const openaiDiagnoses = caseData.openaiAnalysis?.diagnoses || [];
    const diagnoses = activeProvider === 'gemini' ? geminiDiagnoses : openaiDiagnoses;

    const hasErrors = caseData.analysisErrors && caseData.analysisErrors.length > 0;
    const hasAlternativeAnalysis = openaiDiagnoses.length > 0;

    // Reset card index when switching providers
    useEffect(() => {
        setActiveIndex(0);
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }, [activeProvider]);

    // Handle provider toggle
    const handleProviderToggle = (provider: 'gemini' | 'openai') => {
        if (provider === 'openai' && !hasAlternativeAnalysis) {
            Alert.alert(
                language === 'tr' ? 'Bilgi' : 'Info',
                Translations.noAlternativeAnalysis[language]
            );
            return;
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setActiveProvider(provider);
        setIsSelected(false); // Reset selection when switching
    };

    // Handle diagnosis selection
    const handleSelectDiagnosis = async () => {
        if (!caseData.id) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setIsSelecting(true);

        try {
            await api.selectAnalysisProvider(caseData.id, activeProvider);

            // Invalidate cache so case detail page gets updated data
            queryClient.invalidateQueries({ queryKey: ['cases'] });
            queryClient.invalidateQueries({ queryKey: ['cases', caseData.id] });

            setIsSelected(true);

            // Show success modal
            setTimeout(() => {
                setShowSuccessModal(true);
                Animated.spring(successModalAnim, {
                    toValue: 1,
                    useNativeDriver: true,
                    tension: 65,
                    friction: 8,
                }).start();
            }, 300);
        } catch (error) {
            console.error('Error selecting provider:', error);
            Alert.alert(
                Translations.error[language],
                language === 'tr' ? 'Tanı seçimi kaydedilemedi' : 'Failed to save diagnosis selection'
            );
        } finally {
            setIsSelecting(false);
        }
    };

    // Handle success modal confirm and navigate home
    const handleSuccessConfirm = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Animated.timing(successModalAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
        }).start(() => {
            setShowSuccessModal(false);
            // Use callback if provided, otherwise try router
            if (onConfirmSuccess) {
                onConfirmSuccess();
            } else {
                setTimeout(() => {
                    router.push('/(tabs)');
                }, 100);
            }
        });
    };

    // Handle scroll with haptic feedback
    const handleScroll = useCallback((event: any) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / ITEM_WIDTH);

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
            showArrow={activeIndex === index && index < diagnoses.length - 1}
            colors={colors}
            colorScheme={colorScheme}
            language={language}
        />
    );

    return (
        <ImageBackground
            source={require('@/assets/images/home-bg.png')}
            style={styles.container}
            resizeMode="cover"
        >
            {/* Corio Scan Header */}
            <View style={styles.brandHeader}>
                <Text style={styles.brandTitle}>Corio Scan</Text>
            </View>

            {/* AI Provider Toggle Tabs */}
            <View style={styles.toggleContainer}>
                <BlurView intensity={60} tint="light" style={styles.toggleBlur}>
                    <View style={styles.toggleRow}>
                        <TouchableOpacity
                            style={[
                                styles.toggleTab,
                                activeProvider === 'gemini' && styles.toggleTabActive,
                            ]}
                            onPress={() => handleProviderToggle('gemini')}
                            activeOpacity={0.7}
                        >
                            <Text style={[
                                styles.toggleTabText,
                                activeProvider === 'gemini' && styles.toggleTabTextActive,
                            ]}>
                                {Translations.primaryAI[language]}
                            </Text>
                            {isSelected && activeProvider === 'gemini' && (
                                <Check size={14} color="#FFFFFF" style={{ marginLeft: 4 }} />
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.toggleTab,
                                activeProvider === 'openai' && styles.toggleTabActive,
                                !hasAlternativeAnalysis && styles.toggleTabDisabled,
                            ]}
                            onPress={() => handleProviderToggle('openai')}
                            activeOpacity={0.7}
                        >
                            <Text style={[
                                styles.toggleTabText,
                                activeProvider === 'openai' && styles.toggleTabTextActive,
                                !hasAlternativeAnalysis && styles.toggleTabTextDisabled,
                            ]}>
                                {Translations.alternativeAI[language]}
                            </Text>
                            {isSelected && activeProvider === 'openai' && (
                                <Check size={14} color="#FFFFFF" style={{ marginLeft: 4 }} />
                            )}
                        </TouchableOpacity>
                    </View>
                </BlurView>
            </View>

            {/* Errors (if any) */}
            {hasErrors && (
                <View style={[styles.errorBanner, { backgroundColor: colors.warningLight }]}>
                    <AlertTriangle size={18} color={colors.warning} />
                    <Text style={[styles.errorText, { color: colors.warning }]}>
                        {language === 'tr'
                            ? 'Analiz sırasında bazı sorunlar oluştu.'
                            : 'Some issues occurred during analysis.'}
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
                        keyExtractor={(_, index) => `diagnosis-${activeProvider}-${index}`}
                        horizontal
                        pagingEnabled={false}
                        showsHorizontalScrollIndicator={false}
                        snapToOffsets={diagnoses.map((_, index) => index * ITEM_WIDTH)}
                        decelerationRate="fast"
                        contentContainerStyle={[
                            styles.cardsContainer,
                            { paddingHorizontal: SIDE_SPACING }
                        ]}
                        onScroll={handleScroll}
                        scrollEventThrottle={16}
                        getItemLayout={(_, index) => ({
                            length: ITEM_WIDTH,
                            offset: ITEM_WIDTH * index,
                            index,
                        })}
                        extraData={activeIndex}
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
                                {language === 'tr'
                                    ? 'Analiz sonucu bulunamadı.\nLütfen tekrar deneyin.'
                                    : 'No analysis results found.\nPlease try again.'}
                            </Text>
                        </View>
                    </BlurView>
                </View>
            )}

            {/* Disclaimer - Compact */}
            <View style={styles.disclaimer}>
                <AlertTriangle size={14} color="#D97706" />
                <Text style={styles.disclaimerText}>
                    {language === 'tr'
                        ? 'Bilgi amaçlıdır, dermatolog kontrolü önerilir.'
                        : 'For informational purposes only, consult a dermatologist.'}
                </Text>
            </View>

            {/* Upgrade Banner for Free Users */}
            {!isPremium() && (
                <TouchableOpacity
                    style={styles.upgradeBanner}
                    onPress={() => setShowPaywall(true)}
                    activeOpacity={0.8}
                >
                    <BlurView intensity={60} tint="light" style={styles.upgradeBannerBlur}>
                        <View style={styles.upgradeBannerContent}>
                            <View style={styles.upgradeBannerIcon}>
                                <Crown size={16} color="#F59E0B" />
                            </View>
                            <View style={styles.upgradeBannerText}>
                                <Text style={styles.upgradeBannerTitle}>
                                    {language === 'tr' ? 'Premium\'a Yükselt' : 'Upgrade to Premium'}
                                </Text>
                                <Text style={styles.upgradeBannerSubtitle}>
                                    {getRemainingAnalysesText(language)}
                                </Text>
                            </View>
                            <Sparkles size={16} color="#F59E0B" />
                        </View>
                    </BlurView>
                </TouchableOpacity>
            )}

            {/* Action Buttons Row */}
            <View style={styles.buttonRow}>
                <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={onNewAnalysis}
                    activeOpacity={0.8}
                >
                    <BlurView intensity={60} tint="light" style={styles.secondaryButtonBlur}>
                        <View style={styles.secondaryButtonContent}>
                            <RefreshCw size={18} color="#0891B2" />
                            <Text style={styles.secondaryButtonText}>
                                {Translations.newAnalysis[language]}
                            </Text>
                        </View>
                    </BlurView>
                </TouchableOpacity>

                {/* Confirm Diagnosis Button */}
                <TouchableOpacity
                    style={[
                        styles.primaryButton,
                        isSelected && styles.confirmButtonSelected,
                    ]}
                    onPress={handleSelectDiagnosis}
                    disabled={isSelecting || isSelected}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={isSelected ? ['#10B981', '#059669'] : ['#0E7490', '#0891B2', '#06B6D4']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.primaryButtonGradient}
                    >
                        {isSelecting ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : isSelected ? (
                            <Check size={18} color="#FFFFFF" />
                        ) : (
                            <CheckCircle size={18} color="#FFFFFF" />
                        )}
                        <Text style={styles.primaryButtonText}>
                            {isSelected
                                ? (language === 'tr' ? 'Onaylandı' : 'Confirmed')
                                : (language === 'tr' ? 'Sonucu Kaydet' : 'Save Result')}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            {/* Onboarding Tutorial Overlay */}
            {showTutorial && (
                <DiagnosisTutorial
                    language={language}
                    userId={user?.id}
                    onComplete={() => setShowTutorial(false)}
                />
            )}

            {/* Success Modal */}
            <Modal
                visible={showSuccessModal}
                transparent
                animationType="none"
                statusBarTranslucent
            >
                <View style={styles.modalOverlay}>
                    <Animated.View
                        style={[
                            styles.modalContainer,
                            {
                                transform: [
                                    {
                                        scale: successModalAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [0.8, 1],
                                        }),
                                    },
                                ],
                                opacity: successModalAnim,
                            },
                        ]}
                    >
                        <BlurView intensity={60} tint="light" style={styles.modalBlur}>
                            <View style={styles.modalContent}>
                                {/* Glass Highlight */}
                                <View style={styles.modalGlassHighlight} />

                                {/* Success Icon */}
                                <View style={styles.successIconWrapper}>
                                    <LinearGradient
                                        colors={['#10B981', '#059669']}
                                        style={styles.successIconGradient}
                                    >
                                        <Check size={32} color="#FFFFFF" strokeWidth={3} />
                                    </LinearGradient>
                                </View>

                                {/* Success Text */}
                                <Text style={styles.modalTitle}>
                                    {language === 'tr' ? 'Sonuç Kaydedildi!' : 'Result Saved!'}
                                </Text>
                                <Text style={styles.modalSubtitle}>
                                    {Translations.diagnosisSelected[language]}
                                </Text>

                                {/* Confirm Button */}
                                <TouchableOpacity
                                    style={styles.modalButton}
                                    onPress={handleSuccessConfirm}
                                    activeOpacity={0.8}
                                >
                                    <LinearGradient
                                        colors={['#0E7490', '#0891B2', '#06B6D4']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={styles.modalButtonGradient}
                                    >
                                        <Text style={styles.modalButtonText}>
                                            {Translations.ok[language]}
                                        </Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </BlurView>
                    </Animated.View>
                </View>
            </Modal>

            {/* Paywall Modal */}
            <PaywallModal
                visible={showPaywall}
                onClose={() => setShowPaywall(false)}
                language={language}
            />
        </ImageBackground>
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
    language = 'tr',
}: {
    diagnosis: DiagnosisResult;
    rank: number;
    isFirst: boolean;
    isLast: boolean;
    showArrow: boolean;
    colors: typeof Colors.light;
    colorScheme: 'light' | 'dark';
    language?: 'tr' | 'en';
}) {
    const confidenceColor = getConfidenceColor(diagnosis.confidence, colorScheme);

    return (
        <View style={styles.cardWrapper}>
            <BlurView intensity={95} tint="light" style={styles.cardBlur}>
                <View style={styles.card}>
                    {/* Subtle top glass highlight */}
                    <View style={styles.glassHighlightBar} />

                    {/* Fixed Header Section - Stays at top */}
                    <View style={styles.cardFixedHeader}>
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
                                        {language === 'tr' ? 'Birincil Sonuç' : 'Primary Result'}
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
                    </View>

                    {/* Scrollable Content Area */}
                    <ScrollView
                        style={styles.cardScrollView}
                        contentContainerStyle={styles.cardScrollContent}
                        showsVerticalScrollIndicator={false}
                        bounces={false}
                    >
                        {/* Description */}
                        {diagnosis.description && (
                            <Text style={[styles.description, { color: colors.textSecondary }]}>
                                {diagnosis.description}
                            </Text>
                        )}

                        {/* Lower Section - Features & Recommendations */}
                        <View style={styles.cardLowerSection}>
                            {/* Key Features */}
                            {diagnosis.keyFeatures && diagnosis.keyFeatures.length > 0 && (
                                <View style={styles.featuresSection}>
                                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                        📋 {language === 'tr' ? 'Temel Özellikler' : 'Key Features'}
                                    </Text>
                                    {diagnosis.keyFeatures.slice(0, 4).map((feature, idx) => (
                                        <View key={idx} style={styles.featureRow}>
                                            <View style={[styles.featureDot, { backgroundColor: colors.primary }]} />
                                            <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                                                {feature}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            )}

                            {/* Recommendations */}
                            {diagnosis.recommendations && diagnosis.recommendations.length > 0 && (
                                <View style={styles.recommendationsSection}>
                                    <Text style={[styles.sectionTitle, { color: '#0E7490' }]}>
                                        💡 {Translations.recommendations[language]}
                                    </Text>
                                    {diagnosis.recommendations.slice(0, 4).map((rec, idx) => (
                                        <Text key={idx} style={styles.recommendationText}>
                                            → {rec}
                                        </Text>
                                    ))}
                                </View>
                            )}
                        </View>
                    </ScrollView>
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
        paddingTop: Spacing['2xl'] + 16,
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
        paddingVertical: Spacing.sm,
        alignItems: 'center',
    },
    cardWrapper: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
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
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.4)',
        flex: 1,
    },
    card: {
        padding: Spacing.lg,
        paddingTop: Spacing.lg + 4,
        paddingBottom: Spacing.lg,
        backgroundColor: Platform.select({
            android: 'rgba(255, 255, 255, 0.05)',
            ios: 'rgba(255,255,255,0.25)',
        }),
        flex: 1,
        justifyContent: 'space-between',
    },
    glassHighlightBar: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.6)',
    },
    cardUpperSection: {
        flex: 0,
    },
    cardFixedHeader: {
        paddingBottom: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(14, 116, 144, 0.08)',
        marginBottom: Spacing.xs,
    },
    cardScrollView: {
        flex: 1,
        marginTop: 4,
    },
    cardScrollContent: {
        flexGrow: 1,
        paddingBottom: Spacing.md,
    },
    cardLowerSection: {
        marginTop: Spacing.sm,
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
        marginBottom: Spacing.md,
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
        fontSize: 13,
        lineHeight: 20,
        marginBottom: Spacing.md,
    },
    featuresSection: {
        marginBottom: Spacing.md,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: Spacing.xs,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: Spacing.xs,
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
        fontSize: 13,
        lineHeight: 18,
    },
    recommendationsSection: {
        padding: Spacing.md,
        borderRadius: 14,
        marginTop: Spacing.md,
        backgroundColor: 'rgba(14, 116, 144, 0.06)',
        borderWidth: 1,
        borderColor: 'rgba(14, 116, 144, 0.1)',
    },
    recommendationText: {
        fontSize: 13,
        lineHeight: 18,
        marginBottom: Spacing.xs,
        color: '#475569',
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
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#0E7490',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 8,
    },
    primaryButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: Spacing.lg,
        gap: Spacing.sm,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '600',
        letterSpacing: 0.3,
    },
    secondaryButton: {
        flex: 1,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: 'rgba(8, 145, 178, 0.2)',
        shadowColor: '#0E7490',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
    },
    secondaryButtonBlur: {
        flex: 1,
        borderRadius: 16,
        overflow: 'hidden',
    },
    secondaryButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: Spacing.md,
        gap: Spacing.sm,
        backgroundColor: Platform.select({
            android: 'rgba(255, 255, 255, 0.7)',
            ios: 'rgba(255, 255, 255, 0.3)',
        }),
    },
    secondaryButtonText: {
        color: '#0891B2',
        fontSize: 15,
        fontWeight: '600',
        letterSpacing: 0.3,
    },
    confirmButtonSelected: {
        opacity: 0.8,
    },
    secondaryIconButton: {
        width: 52,
        height: 52,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(8, 145, 178, 0.15)',
        shadowColor: '#0E7490',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
    },
    // AI Provider Toggle Styles
    toggleContainer: {
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.sm,
    },
    toggleBlur: {
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    toggleRow: {
        flexDirection: 'row',
        padding: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    toggleTab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 12,
    },
    toggleTabActive: {
        backgroundColor: '#0891B2',
    },
    toggleTabDisabled: {
        opacity: 0.5,
    },
    toggleTabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
    },
    toggleTabTextActive: {
        color: '#FFFFFF',
    },
    toggleTabTextDisabled: {
        color: '#94A3B8',
    },
    confirmButton: {
        width: 52,
        height: 52,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(8, 145, 178, 0.15)',
        shadowColor: '#0E7490',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
    },

    // Success Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: SCREEN_WIDTH * 0.85,
        maxWidth: 340,
        borderRadius: 28,
        overflow: 'hidden',
        shadowColor: '#0E7490',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.25,
        shadowRadius: 24,
        elevation: 15,
    },
    modalBlur: {
        borderRadius: 28,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.7)',
        overflow: 'hidden',
    },
    modalContent: {
        padding: Spacing.xl,
        paddingTop: Spacing['2xl'],
        paddingBottom: Spacing.xl,
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        position: 'relative',
    },
    modalGlassHighlight: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '40%',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
    },
    successIconWrapper: {
        marginBottom: Spacing.lg,
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 8,
    },
    successIconGradient: {
        width: 72,
        height: 72,
        borderRadius: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: Spacing.xs,
        textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: 15,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: Spacing.xl,
        lineHeight: 22,
    },
    modalButton: {
        width: '100%',
        borderRadius: 16,
        overflow: 'hidden',
    },
    modalButtonGradient: {
        paddingVertical: Spacing.md + 2,
        paddingHorizontal: Spacing.xl,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.3,
    },
    // Upgrade Banner Styles
    upgradeBanner: {
        marginHorizontal: Spacing.lg,
        marginTop: Spacing.sm,
        borderRadius: 14,
        overflow: 'hidden',
    },
    upgradeBannerBlur: {
        borderRadius: 14,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(245, 158, 11, 0.3)',
    },
    upgradeBannerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm + 2,
        backgroundColor: Platform.select({
            android: 'rgba(255, 251, 235, 0.4)',
            ios: 'rgba(255, 251, 235, 0.3)',
        }),
    },
    upgradeBannerIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.sm,
    },
    upgradeBannerText: {
        flex: 1,
    },
    upgradeBannerTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#92400E',
    },
    upgradeBannerSubtitle: {
        fontSize: 12,
        fontWeight: '500',
        color: '#B45309',
        marginTop: 1,
    },
});
