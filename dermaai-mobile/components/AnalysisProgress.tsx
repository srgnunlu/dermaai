/**
 * AnalysisProgress component showing AI analysis progress
 * Ported from web app AnalysisProgress.tsx
 */

import { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
} from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';

interface AnalysisProgressProps {
    isActive: boolean;
    onComplete?: () => void;
}

const ANALYSIS_STAGES = [
    { emoji: '📤', text: 'Görsel yükleniyor...' },
    { emoji: '🔍', text: 'Görsel analiz ediliyor...' },
    { emoji: '🤖', text: 'AI modelleri çalışıyor...' },
    { emoji: '🧠', text: 'Gemini analizi yapılıyor...' },
    { emoji: '💡', text: 'OpenAI analizi yapılıyor...' },
    { emoji: '📊', text: 'Sonuçlar birleştiriliyor...' },
];

const TOTAL_DURATION = 60000; // 60 seconds

export function AnalysisProgress({ isActive, onComplete }: AnalysisProgressProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    const [progress, setProgress] = useState(0);
    const [stageIndex, setStageIndex] = useState(0);
    const pulseAnim = useState(new Animated.Value(1))[0];

    // Progress animation
    useEffect(() => {
        if (!isActive) {
            setProgress(0);
            setStageIndex(0);
            return;
        }

        const interval = setInterval(() => {
            setProgress(prev => {
                const next = prev + (100 / (TOTAL_DURATION / 500));
                if (next >= 100) {
                    clearInterval(interval);
                    onComplete?.();
                    return 100;
                }
                return next;
            });
        }, 500);

        return () => clearInterval(interval);
    }, [isActive, onComplete]);

    // Stage progression
    useEffect(() => {
        const stageProgress = progress / (100 / ANALYSIS_STAGES.length);
        setStageIndex(Math.min(Math.floor(stageProgress), ANALYSIS_STAGES.length - 1));
    }, [progress]);

    // Pulse animation
    useEffect(() => {
        if (!isActive) return;

        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.1,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }),
            ])
        );

        pulse.start();
        return () => pulse.stop();
    }, [isActive, pulseAnim]);

    const currentStage = ANALYSIS_STAGES[stageIndex];
    const remainingSeconds = Math.ceil((TOTAL_DURATION - (progress / 100 * TOTAL_DURATION)) / 1000);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {/* Animated Emoji */}
                <Animated.View style={[styles.emojiContainer, { transform: [{ scale: pulseAnim }] }]}>
                    <Text style={styles.emoji}>{currentStage.emoji}</Text>
                </Animated.View>

                {/* Stage Text */}
                <Text style={[styles.stageText, { color: colors.text }]}>
                    {currentStage.text}
                </Text>

                {/* Progress Bar */}
                <View style={[styles.progressBar, { backgroundColor: colors.muted }]}>
                    <View
                        style={[
                            styles.progressFill,
                            {
                                backgroundColor: colors.primary,
                                width: `${progress}%`,
                            }
                        ]}
                    />
                </View>

                {/* Progress Info */}
                <View style={styles.progressInfo}>
                    <Text style={[styles.percentage, { color: colors.primary }]}>
                        {Math.round(progress)}%
                    </Text>
                    <Text style={[styles.remaining, { color: colors.textSecondary }]}>
                        ~{remainingSeconds}s kaldı
                    </Text>
                </View>

                {/* Stage Indicators */}
                <View style={styles.stageIndicators}>
                    {ANALYSIS_STAGES.map((stage, index) => (
                        <View
                            key={index}
                            style={[
                                styles.stageIndicator,
                                { backgroundColor: index <= stageIndex ? colors.primary : colors.muted },
                            ]}
                        />
                    ))}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    card: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 20,
        borderWidth: 1,
        padding: 32,
        alignItems: 'center',
    },
    emojiContainer: {
        marginBottom: 20,
    },
    emoji: {
        fontSize: 64,
    },
    stageText: {
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 24,
    },
    progressBar: {
        width: '100%',
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 16,
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },
    progressInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 24,
    },
    percentage: {
        fontSize: 16,
        fontWeight: '700',
    },
    remaining: {
        fontSize: 14,
    },
    stageIndicators: {
        flexDirection: 'row',
        gap: 8,
    },
    stageIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
});
