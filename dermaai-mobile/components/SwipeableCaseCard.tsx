/**
 * Swipeable Case Card Component
 * iOS-style swipe-to-delete for case items in history list
 */

import React, { useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Dimensions,
    Platform,
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureUpdateEvent, PanGestureHandlerEventPayload } from 'react-native-gesture-handler';
import { BlurView } from 'expo-blur';
import { format } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import * as Haptics from 'expo-haptics';
import {
    Calendar,
    MapPin,
    ChevronRight,
    Camera,
    Trash2,
} from 'lucide-react-native';
import { Spacing } from '@/constants/Spacing';
import { ConfidenceBadge } from '@/components/ui';
import type { Case } from '@/types/schema';
import type { Colors } from '@/constants/Colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DELETE_BUTTON_WIDTH = 80;
const SWIPE_THRESHOLD = DELETE_BUTTON_WIDTH / 2;

interface SwipeableCaseCardProps {
    caseData: Case;
    onPress: () => void;
    onDelete: () => void;
    colors: typeof Colors.light;
    language?: 'tr' | 'en';
    index: number;
}

export function SwipeableCaseCard({
    caseData,
    onPress,
    onDelete,
    colors,
    language = 'tr',
    index,
}: SwipeableCaseCardProps) {
    const translateX = useSharedValue(0);
    const isDeleting = useSharedValue(false);

    // Use selected provider's diagnosis for display
    const selectedProvider = caseData.selectedAnalysisProvider || 'gemini';
    const selectedDiagnoses = selectedProvider === 'openai'
        ? caseData.openaiAnalysis?.diagnoses
        : caseData.geminiAnalysis?.diagnoses;

    const topDiagnosis = caseData.finalDiagnoses?.[0] ||
        selectedDiagnoses?.[0] ||
        caseData.geminiAnalysis?.diagnoses?.[0];

    const createdDate = caseData.createdAt
        ? format(new Date(caseData.createdAt), 'dd MMM yyyy', { locale: language === 'tr' ? tr : enUS })
        : '-';

    const imageUrl = caseData.imageUrls?.[0] || caseData.imageUrl;

    const handleDelete = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onDelete();
    }, [onDelete]);

    const resetPosition = useCallback(() => {
        translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
    }, [translateX]);

    const panGesture = Gesture.Pan()
        .activeOffsetX([-10, 10])
        .onUpdate((event: GestureUpdateEvent<PanGestureHandlerEventPayload>) => {
            // Only allow left swipe (negative values)
            if (event.translationX < 0) {
                translateX.value = Math.max(event.translationX, -DELETE_BUTTON_WIDTH);
            } else if (translateX.value < 0) {
                // Allow swipe back to close
                translateX.value = Math.min(0, translateX.value + event.translationX);
            }
        })
        .onEnd((event: GestureUpdateEvent<PanGestureHandlerEventPayload>) => {
            if (translateX.value < -SWIPE_THRESHOLD) {
                // Snap to reveal delete button
                translateX.value = withSpring(-DELETE_BUTTON_WIDTH, { damping: 20, stiffness: 200 });
                runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
            } else {
                // Snap back to closed
                translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
            }
        });

    const tapGesture = Gesture.Tap()
        .onEnd(() => {
            if (translateX.value === 0) {
                runOnJS(onPress)();
            } else {
                // Close if open
                translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
            }
        });

    const composedGesture = Gesture.Race(panGesture, tapGesture);

    const cardAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    const deleteButtonAnimatedStyle = useAnimatedStyle(() => ({
        opacity: withTiming(translateX.value < -10 ? 1 : 0, { duration: 150 }),
        transform: [
            { scale: withSpring(translateX.value < -SWIPE_THRESHOLD ? 1 : 0.8, { damping: 20 }) },
        ],
    }));

    return (
        <View style={styles.container}>
            {/* Delete Button (behind the card) */}
            <Animated.View style={[styles.deleteButtonContainer, deleteButtonAnimatedStyle]}>
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={handleDelete}
                    activeOpacity={0.8}
                >
                    <Trash2 size={22} color="#FFFFFF" />
                    <Text style={styles.deleteButtonText}>
                        {language === 'tr' ? 'Sil' : 'Delete'}
                    </Text>
                </TouchableOpacity>
            </Animated.View>

            {/* Swipeable Card */}
            <GestureDetector gesture={composedGesture}>
                <Animated.View style={[styles.cardAnimatedWrapper, cardAnimatedStyle]}>
                    <View style={styles.caseCardWrapper}>
                        <BlurView intensity={65} tint="light" style={styles.caseCardBlur}>
                            <View style={styles.caseCard}>
                                {/* Image Thumbnail */}
                                <View style={styles.imageContainer}>
                                    {imageUrl ? (
                                        <Image source={{ uri: imageUrl }} style={styles.caseImage} />
                                    ) : (
                                        <View style={styles.imagePlaceholder}>
                                            <Camera size={24} color="rgba(255,255,255,0.6)" />
                                        </View>
                                    )}
                                </View>

                                {/* Content */}
                                <View style={styles.caseContent}>
                                    {/* Date */}
                                    <View style={styles.dateRow}>
                                        <Calendar size={12} color="#64748B" />
                                        <Text style={styles.dateText}>{createdDate}</Text>
                                    </View>

                                    {/* Diagnosis */}
                                    {topDiagnosis && (
                                        <Text style={styles.diagnosisName} numberOfLines={2}>
                                            {topDiagnosis.name}
                                        </Text>
                                    )}

                                    {/* Location */}
                                    {caseData.lesionLocation && (
                                        <View style={styles.locationRow}>
                                            <MapPin size={11} color="#94A3B8" />
                                            <Text style={styles.locationText} numberOfLines={1}>
                                                {caseData.lesionLocation}
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                {/* Confidence Badge & Arrow */}
                                <View style={styles.rightSection}>
                                    {topDiagnosis && (
                                        <ConfidenceBadge confidence={topDiagnosis.confidence} size="sm" />
                                    )}
                                    <ChevronRight size={18} color="#94A3B8" style={styles.chevron} />
                                </View>
                            </View>
                        </BlurView>
                    </View>
                </Animated.View>
            </GestureDetector>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        overflow: 'hidden',
    },
    cardAnimatedWrapper: {
        zIndex: 1,
    },
    deleteButtonContainer: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: DELETE_BUTTON_WIDTH,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 0,
    },
    deleteButton: {
        width: DELETE_BUTTON_WIDTH - 8,
        height: '100%',
        backgroundColor: '#EF4444',
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 4,
    },
    deleteButtonText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },

    // Case Card styles (matching history.tsx)
    caseCardWrapper: {
        borderRadius: 18,
        overflow: 'hidden',
    },
    caseCardBlur: {
        borderRadius: 18,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    caseCard: {
        flexDirection: 'row',
        padding: Spacing.md,
        backgroundColor: Platform.select({
            android: 'transparent',
            ios: 'rgba(255, 255, 255, 0.2)',
        }),
        alignItems: 'center',
    },
    imageContainer: {
        width: 64,
        height: 64,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: Platform.select({
            android: 'rgba(255, 255, 255, 0.1)',
            ios: 'rgba(255, 255, 255, 0.3)',
        }),
    },
    caseImage: {
        width: '100%',
        height: '100%',
    },
    imagePlaceholder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(8, 145, 178, 0.15)',
    },
    caseContent: {
        flex: 1,
        marginLeft: Spacing.md,
        marginRight: Spacing.sm,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 4,
    },
    dateText: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: '500',
    },
    diagnosisName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#0F172A',
        lineHeight: 20,
        marginBottom: 4,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    locationText: {
        fontSize: 12,
        color: '#94A3B8',
    },
    rightSection: {
        alignItems: 'flex-end',
        gap: 8,
    },
    chevron: {
        marginTop: 4,
    },
});
