/**
 * DiagnosisResults component showing AI analysis results
 * Ported from web app DiagnosisResults.tsx
 */

import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import type { Case, DiagnosisResult } from '@/types/schema';

interface DiagnosisResultsProps {
    caseData: Case;
    onNewAnalysis: () => void;
}

function DiagnosisCard({
    diagnosis,
    rank,
    source,
    colors,
}: {
    diagnosis: DiagnosisResult;
    rank: number;
    source: 'gemini' | 'openai';
    colors: typeof Colors.light;
}) {
    const isUrgent = diagnosis.confidence >= 70;
    const confidenceColor =
        diagnosis.confidence >= 70 ? colors.success :
            diagnosis.confidence >= 40 ? colors.warning : colors.destructive;

    return (
        <View style={[styles.diagnosisCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {/* Header */}
            <View style={styles.diagnosisHeader}>
                <View style={styles.rankBadge}>
                    <Text style={[styles.rankText, { color: colors.primary }]}>#{rank}</Text>
                </View>
                <View style={styles.diagnosisInfo}>
                    <Text style={[styles.diagnosisName, { color: colors.text }]} numberOfLines={2}>
                        {diagnosis.name}
                    </Text>
                    <Text style={[styles.sourceText, { color: colors.textSecondary }]}>
                        {source === 'gemini' ? '🤖 Gemini' : '💡 OpenAI'}
                    </Text>
                </View>
                <View style={[styles.confidenceBadge, { backgroundColor: confidenceColor + '20' }]}>
                    <Text style={[styles.confidenceText, { color: confidenceColor }]}>
                        %{diagnosis.confidence}
                    </Text>
                </View>
            </View>

            {/* Description */}
            <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={3}>
                {diagnosis.description}
            </Text>

            {/* Key Features */}
            {diagnosis.keyFeatures && diagnosis.keyFeatures.length > 0 && (
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Temel Özellikler</Text>
                    {diagnosis.keyFeatures.slice(0, 3).map((feature, index) => (
                        <Text key={index} style={[styles.listItem, { color: colors.textSecondary }]}>
                            • {feature}
                        </Text>
                    ))}
                </View>
            )}

            {/* Recommendations */}
            {diagnosis.recommendations && diagnosis.recommendations.length > 0 && (
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Öneriler</Text>
                    {diagnosis.recommendations.slice(0, 3).map((rec, index) => (
                        <Text key={index} style={[styles.listItem, { color: colors.textSecondary }]}>
                            • {rec}
                        </Text>
                    ))}
                </View>
            )}
        </View>
    );
}

export function DiagnosisResults({ caseData, onNewAnalysis }: DiagnosisResultsProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    const geminiDiagnoses = caseData.geminiAnalysis?.diagnoses || [];
    const openaiDiagnoses = caseData.openaiAnalysis?.diagnoses || [];

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: colors.background }]}
            contentContainerStyle={styles.content}
        >
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={styles.headerEmoji}>✅</Text>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Analiz Tamamlandı</Text>
                <Text style={[styles.caseId, { color: colors.primary }]}>
                    Vaka: {caseData.caseId}
                </Text>
            </View>

            {/* Gemini Results */}
            {geminiDiagnoses.length > 0 && (
                <View style={styles.resultsSection}>
                    <Text style={[styles.sectionHeader, { color: colors.text }]}>
                        🤖 Gemini Analizi
                    </Text>
                    {geminiDiagnoses.slice(0, 3).map((diagnosis, index) => (
                        <DiagnosisCard
                            key={`gemini-${index}`}
                            diagnosis={diagnosis}
                            rank={index + 1}
                            source="gemini"
                            colors={colors}
                        />
                    ))}
                </View>
            )}

            {/* OpenAI Results */}
            {openaiDiagnoses.length > 0 && (
                <View style={styles.resultsSection}>
                    <Text style={[styles.sectionHeader, { color: colors.text }]}>
                        💡 OpenAI Analizi
                    </Text>
                    {openaiDiagnoses.slice(0, 3).map((diagnosis, index) => (
                        <DiagnosisCard
                            key={`openai-${index}`}
                            diagnosis={diagnosis}
                            rank={index + 1}
                            source="openai"
                            colors={colors}
                        />
                    ))}
                </View>
            )}

            {/* Disclaimer */}
            <View style={[styles.disclaimer, { backgroundColor: colors.warning + '20' }]}>
                <Text style={[styles.disclaimerText, { color: colors.warning }]}>
                    ⚠️ Bu analiz sadece bilgi amaçlıdır. Kesin tanı için mutlaka bir dermatoloğa başvurunuz.
                </Text>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
                <TouchableOpacity
                    style={[styles.newAnalysisButton, { backgroundColor: colors.primary }]}
                    onPress={onNewAnalysis}
                >
                    <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>
                        🔄 Yeni Analiz
                    </Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 16,
        gap: 16,
    },
    header: {
        alignItems: 'center',
        padding: 24,
        borderRadius: 16,
        borderWidth: 1,
    },
    headerEmoji: {
        fontSize: 48,
        marginBottom: 12,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 4,
    },
    caseId: {
        fontSize: 14,
        fontWeight: '500',
    },
    resultsSection: {
        gap: 12,
    },
    sectionHeader: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    diagnosisCard: {
        borderRadius: 12,
        borderWidth: 1,
        padding: 16,
    },
    diagnosisHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    rankBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#e0e7ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    rankText: {
        fontSize: 14,
        fontWeight: '700',
    },
    diagnosisInfo: {
        flex: 1,
    },
    diagnosisName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    sourceText: {
        fontSize: 12,
    },
    confidenceBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        marginLeft: 8,
    },
    confidenceText: {
        fontSize: 14,
        fontWeight: '700',
    },
    description: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 12,
    },
    section: {
        marginTop: 8,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 6,
    },
    listItem: {
        fontSize: 13,
        lineHeight: 18,
        marginBottom: 2,
    },
    disclaimer: {
        padding: 16,
        borderRadius: 12,
    },
    disclaimerText: {
        fontSize: 13,
        textAlign: 'center',
        fontWeight: '500',
    },
    actions: {
        marginTop: 8,
    },
    newAnalysisButton: {
        height: 52,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});
