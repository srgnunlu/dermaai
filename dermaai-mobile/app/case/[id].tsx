/**
 * Case Detail Screen
 * Shows full details of a diagnosis case including AI results
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
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
    Calendar,
    MapPin,
    User,
    Clock,
    FileText,
    Share2,
    ArrowLeft,
} from 'lucide-react-native';
import { Colors, getConfidenceColor } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing, Shadows } from '@/constants/Spacing';
import { useColorScheme } from '@/components/useColorScheme';
import { useCase } from '@/hooks/useCases';
import {
    Card,
    CardHeader,
    CardContent,
    Badge,
    StatusBadge,
    ConfidenceBadge,
    LoadingSpinner,
    EmptyState,
    Button,
} from '@/components/ui';
import type { DiagnosisResult } from '@/types/schema';

export default function CaseDetailScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();

    const { caseData, isLoading, error } = useCase(id || '');

    if (isLoading) {
        return (
            <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
                <Stack.Screen options={{ title: 'Yükleniyor...' }} />
                <LoadingSpinner text="Vaka yükleniyor..." />
            </View>
        );
    }

    if (error || !caseData) {
        return (
            <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
                <Stack.Screen options={{ title: 'Hata' }} />
                <EmptyState
                    emoji="❌"
                    title="Vaka bulunamadı"
                    description="Bu vaka mevcut değil veya erişim izniniz yok."
                    actionLabel="Geri Dön"
                    onAction={() => router.back()}
                />
            </View>
        );
    }

    const handleShare = () => {
        Alert.alert('Paylaş', 'Paylaşma özelliği yakında eklenecek.');
    };

    const handleGenerateReport = () => {
        Alert.alert('PDF Raporu', 'PDF oluşturma özelliği yakında eklenecek.');
    };

    const geminiDiagnoses = caseData.geminiAnalysis?.diagnoses || [];
    const openaiDiagnoses = caseData.openaiAnalysis?.diagnoses || [];
    const createdDate = caseData.createdAt
        ? format(new Date(caseData.createdAt), 'dd MMMM yyyy, HH:mm', { locale: tr })
        : '-';

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen
                options={{
                    title: caseData.caseId,
                    headerRight: () => (
                        <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
                            <Share2 size={20} color={colors.primary} />
                        </TouchableOpacity>
                    ),
                }}
            />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Status Header */}
                <Card style={{ ...styles.statusCard, backgroundColor: colors.primaryLight }}>
                    <View style={styles.statusRow}>
                        <View>
                            <Text style={[styles.caseIdLabel, { color: colors.textSecondary }]}>
                                Vaka Numarası
                            </Text>
                            <Text style={[styles.caseIdValue, { color: colors.text }]}>
                                {caseData.caseId}
                            </Text>
                        </View>
                        <StatusBadge
                            status={caseData.status as any || 'pending'}
                            size="md"
                        />
                    </View>
                </Card>

                {/* Case Info */}
                <Card>
                    <CardHeader title="Vaka Bilgileri" icon={<FileText size={18} color={colors.primary} />} />
                    <CardContent>
                        <InfoRow
                            icon={<Calendar size={16} color={colors.textSecondary} />}
                            label="Tarih"
                            value={createdDate}
                            colors={colors}
                        />
                        <InfoRow
                            icon={<MapPin size={16} color={colors.textSecondary} />}
                            label="Lezyon Konumu"
                            value={caseData.lesionLocation || 'Belirtilmedi'}
                            colors={colors}
                        />
                        <InfoRow
                            icon={<Clock size={16} color={colors.textSecondary} />}
                            label="Belirti Süresi"
                            value={caseData.symptomDuration || 'Belirtilmedi'}
                            colors={colors}
                            isLast
                        />
                    </CardContent>
                </Card>

                {/* Symptoms */}
                {caseData.symptoms && caseData.symptoms.length > 0 && (
                    <Card>
                        <CardHeader title="Belirtiler" />
                        <CardContent>
                            <View style={styles.chipContainer}>
                                {caseData.symptoms.map((symptom, index) => (
                                    <Badge key={index} variant="default" style={styles.symptomChip}>
                                        {symptom}
                                    </Badge>
                                ))}
                            </View>
                            {caseData.additionalSymptoms && (
                                <Text style={[styles.additionalSymptoms, { color: colors.textSecondary }]}>
                                    {caseData.additionalSymptoms}
                                </Text>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Lesion Images */}
                {(caseData.imageUrls?.length || caseData.imageUrl) && (
                    <Card>
                        <CardHeader title="Lezyon Görselleri" />
                        <CardContent>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <View style={styles.imageRow}>
                                    {(caseData.imageUrls || [caseData.imageUrl]).filter(Boolean).map((url, index) => (
                                        <Image
                                            key={index}
                                            source={{ uri: url! }}
                                            style={[styles.lesionImage, { borderColor: colors.border }]}
                                            resizeMode="cover"
                                        />
                                    ))}
                                </View>
                            </ScrollView>
                        </CardContent>
                    </Card>
                )}

                {/* DermAI Analysis */}
                {geminiDiagnoses.length > 0 && (
                    <View style={styles.analysisSection}>
                        <Text style={[styles.analysisTitle, { color: colors.text }]}>
                            🩺 DermAI Analizi
                        </Text>
                        {geminiDiagnoses.map((diagnosis, index) => (
                            <DiagnosisCard
                                key={`diagnosis-${index}`}
                                diagnosis={diagnosis}
                                rank={index + 1}
                                colors={colors}
                                colorScheme={colorScheme}
                            />
                        ))}
                    </View>
                )}

                {/* Secondary Analysis (OpenAI - hidden, shown only if requested) */}
                {/* OpenAI analysis is available via secondary analysis request */}

                {/* Actions */}
                <View style={styles.actions}>
                    <Button
                        variant="primary"
                        size="lg"
                        fullWidth
                        icon={<FileText size={18} color={colors.primaryForeground} />}
                        onPress={handleGenerateReport}
                    >
                        PDF Raporu Oluştur
                    </Button>
                </View>

                {/* Disclaimer */}
                <View style={[styles.disclaimer, { backgroundColor: colors.warningLight }]}>
                    <Text style={[styles.disclaimerText, { color: colors.warning }]}>
                        ⚠️ Bu analiz sadece bilgi amaçlıdır. Kesin tanı için mutlaka bir dermatoloğa başvurunuz.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}

// Info row component
function InfoRow({
    icon,
    label,
    value,
    colors,
    isLast = false,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    colors: typeof Colors.light;
    isLast?: boolean;
}) {
    return (
        <View
            style={[
                styles.infoRow,
                !isLast && { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
            ]}
        >
            <View style={styles.infoLabel}>
                {icon}
                <Text style={[styles.infoLabelText, { color: colors.textSecondary }]}>{label}</Text>
            </View>
            <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
        </View>
    );
}

// Diagnosis card component
function DiagnosisCard({
    diagnosis,
    rank,
    colors,
    colorScheme,
}: {
    diagnosis: DiagnosisResult;
    rank: number;
    colors: typeof Colors.light;
    colorScheme: 'light' | 'dark';
}) {
    const confidenceColor = getConfidenceColor(diagnosis.confidence, colorScheme);

    return (
        <Card style={styles.diagnosisCard}>
            <View style={styles.diagnosisHeader}>
                <View style={[styles.rankBadge, { backgroundColor: colors.primaryLight }]}>
                    <Text style={[styles.rankText, { color: colors.primary }]}>#{rank}</Text>
                </View>
                <View style={styles.diagnosisInfo}>
                    <Text style={[styles.diagnosisName, { color: colors.text }]} numberOfLines={2}>
                        {diagnosis.name}
                    </Text>
                </View>
                <ConfidenceBadge confidence={diagnosis.confidence} />
            </View>

            {diagnosis.description && (
                <Text style={[styles.diagnosisDescription, { color: colors.textSecondary }]}>
                    {diagnosis.description}
                </Text>
            )}

            {diagnosis.keyFeatures && diagnosis.keyFeatures.length > 0 && (
                <View style={styles.featuresSection}>
                    <Text style={[styles.featuresSectionTitle, { color: colors.text }]}>
                        Temel Özellikler
                    </Text>
                    {diagnosis.keyFeatures.slice(0, 3).map((feature, index) => (
                        <Text key={index} style={[styles.featureItem, { color: colors.textSecondary }]}>
                            • {feature}
                        </Text>
                    ))}
                </View>
            )}

            {diagnosis.recommendations && diagnosis.recommendations.length > 0 && (
                <View style={styles.featuresSection}>
                    <Text style={[styles.featuresSectionTitle, { color: colors.text }]}>
                        Öneriler
                    </Text>
                    {diagnosis.recommendations.slice(0, 3).map((rec, index) => (
                        <Text key={index} style={[styles.featureItem, { color: colors.textSecondary }]}>
                            → {rec}
                        </Text>
                    ))}
                </View>
            )}
        </Card>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: Spacing.base,
        paddingBottom: Spacing['4xl'],
        gap: Spacing.md,
    },
    headerButton: {
        padding: Spacing.sm,
    },
    statusCard: {
        padding: Spacing.lg,
        borderWidth: 0,
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    caseIdLabel: {
        ...Typography.styles.caption,
        marginBottom: 2,
    },
    caseIdValue: {
        ...Typography.styles.h3,
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
    },
    symptomChip: {
        marginBottom: 0,
    },
    additionalSymptoms: {
        ...Typography.styles.body,
        marginTop: Spacing.md,
        fontStyle: 'italic',
    },
    imageRow: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    lesionImage: {
        width: 120,
        height: 120,
        borderRadius: Spacing.radius.lg,
        borderWidth: 1,
    },
    analysisSection: {
        marginTop: Spacing.sm,
    },
    analysisTitle: {
        ...Typography.styles.h4,
        marginBottom: Spacing.md,
    },
    diagnosisCard: {
        marginBottom: Spacing.md,
    },
    diagnosisHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: Spacing.md,
    },
    rankBadge: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    rankText: {
        ...Typography.styles.label,
        fontWeight: '700',
    },
    diagnosisInfo: {
        flex: 1,
        marginRight: Spacing.sm,
    },
    diagnosisName: {
        ...Typography.styles.h4,
    },
    diagnosisDescription: {
        ...Typography.styles.body,
        marginBottom: Spacing.md,
    },
    featuresSection: {
        marginTop: Spacing.sm,
    },
    featuresSectionTitle: {
        ...Typography.styles.label,
        marginBottom: Spacing.xs,
    },
    featureItem: {
        ...Typography.styles.bodySmall,
        marginBottom: 2,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: Spacing.md,
    },
    infoLabel: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoLabelText: {
        ...Typography.styles.body,
        marginLeft: Spacing.sm,
    },
    infoValue: {
        ...Typography.styles.body,
        fontWeight: '500',
    },
    actions: {
        marginTop: Spacing.lg,
    },
    disclaimer: {
        marginTop: Spacing.lg,
        padding: Spacing.md,
        borderRadius: Spacing.radius.lg,
    },
    disclaimerText: {
        ...Typography.styles.caption,
        textAlign: 'center',
        fontWeight: '500',
    },
});
