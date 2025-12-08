/**
 * Case History Screen
 * Displays list of past diagnosis cases
 */

import React, { useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
    Calendar,
    MapPin,
    ChevronRight,
    FileSearch,
} from 'lucide-react-native';
import { Colors, getConfidenceColor } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing, Shadows } from '@/constants/Spacing';
import { useColorScheme } from '@/components/useColorScheme';
import { useCases } from '@/hooks/useCases';
import {
    Card,
    ConfidenceBadge,
    StatusBadge,
    LoadingSpinner,
    EmptyState,
} from '@/components/ui';
import type { Case } from '@/types/schema';

export default function HistoryScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const router = useRouter();

    const { cases, isLoading, error, refetch } = useCases();

    const handleCasePress = useCallback((caseItem: Case) => {
        router.push(`/case/${caseItem.id}`);
    }, [router]);

    const renderCaseItem = useCallback(({ item }: { item: Case }) => (
        <CaseCard
            caseData={item}
            onPress={() => handleCasePress(item)}
            colors={colors}
            colorScheme={colorScheme}
        />
    ), [handleCasePress, colors, colorScheme]);

    if (isLoading && cases.length === 0) {
        return (
            <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
                <LoadingSpinner text="Vakalar yükleniyor..." />
            </View>
        );
    }

    if (error) {
        return (
            <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
                <EmptyState
                    emoji="⚠️"
                    title="Bir hata oluştu"
                    description="Vakalar yüklenirken bir hata oluştu."
                    actionLabel="Tekrar Dene"
                    onAction={refetch}
                />
            </View>
        );
    }

    if (cases.length === 0) {
        return (
            <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
                <EmptyState
                    emoji="📋"
                    title="Henüz vaka yok"
                    description="İlk tanı analizinizi yapmak için Tanı sekmesine gidin."
                    actionLabel="Tanı Yap"
                    onAction={() => router.push('/(tabs)')}
                />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Stats Header */}
            <View style={[styles.statsHeader, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <StatItem
                    label="Toplam Vaka"
                    value={cases.length.toString()}
                    colors={colors}
                />
                <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                <StatItem
                    label="Bu Ay"
                    value={getThisMonthCount(cases).toString()}
                    colors={colors}
                />
                <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                <StatItem
                    label="Tamamlanan"
                    value={cases.filter(c => c.finalDiagnoses?.length).length.toString()}
                    colors={colors}
                />
            </View>

            <FlatList
                data={cases}
                renderItem={renderCaseItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isLoading}
                        onRefresh={refetch}
                        tintColor={colors.primary}
                        colors={[colors.primary]}
                    />
                }
                ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
        </View>
    );
}

// Case card component
function CaseCard({
    caseData,
    onPress,
    colors,
    colorScheme,
}: {
    caseData: Case;
    onPress: () => void;
    colors: typeof Colors.light;
    colorScheme: 'light' | 'dark';
}) {
    const topDiagnosis = caseData.finalDiagnoses?.[0] ||
        caseData.geminiAnalysis?.diagnoses?.[0] ||
        caseData.openaiAnalysis?.diagnoses?.[0];

    const createdDate = caseData.createdAt
        ? format(new Date(caseData.createdAt), 'dd MMM yyyy', { locale: tr })
        : '-';

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
            <Card style={Shadows.sm}>
                {/* Header Row */}
                <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                        <Text style={[styles.caseId, { color: colors.text }]}>
                            {caseData.caseId}
                        </Text>
                        <View style={styles.metaRow}>
                            <Calendar size={12} color={colors.textMuted} />
                            <Text style={[styles.metaText, { color: colors.textMuted }]}>
                                {createdDate}
                            </Text>
                        </View>
                    </View>
                    <ChevronRight size={20} color={colors.textMuted} />
                </View>

                {/* Diagnosis Info */}
                {topDiagnosis && (
                    <View style={styles.diagnosisRow}>
                        <View style={styles.diagnosisInfo}>
                            <Text style={[styles.diagnosisLabel, { color: colors.textSecondary }]}>
                                Olası Tanı
                            </Text>
                            <Text
                                style={[styles.diagnosisName, { color: colors.text }]}
                                numberOfLines={1}
                            >
                                {topDiagnosis.name}
                            </Text>
                        </View>
                        <ConfidenceBadge confidence={topDiagnosis.confidence} size="sm" />
                    </View>
                )}

                {/* Location */}
                {caseData.lesionLocation && (
                    <View style={styles.locationRow}>
                        <MapPin size={14} color={colors.textSecondary} />
                        <Text style={[styles.locationText, { color: colors.textSecondary }]}>
                            {caseData.lesionLocation}
                        </Text>
                    </View>
                )}
            </Card>
        </TouchableOpacity>
    );
}

// Stat item component
function StatItem({
    label,
    value,
    colors,
}: {
    label: string;
    value: string;
    colors: typeof Colors.light;
}) {
    return (
        <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
        </View>
    );
}

// Helper function
function getThisMonthCount(cases: Case[]): number {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    return cases.filter(c => {
        if (!c.createdAt) return false;
        const date = new Date(c.createdAt);
        return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
    }).length;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    statsHeader: {
        flexDirection: 'row',
        padding: Spacing.base,
        borderBottomWidth: 1,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        ...Typography.styles.h3,
    },
    statLabel: {
        ...Typography.styles.caption,
        marginTop: 2,
    },
    statDivider: {
        width: 1,
        marginVertical: Spacing.sm,
    },
    listContent: {
        padding: Spacing.base,
        paddingBottom: Spacing['4xl'],
    },
    separator: {
        height: Spacing.md,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    cardHeaderLeft: {},
    caseId: {
        ...Typography.styles.h4,
        marginBottom: 4,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    metaText: {
        ...Typography.styles.caption,
    },
    diagnosisRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: Spacing.md,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
        marginBottom: Spacing.sm,
    },
    diagnosisInfo: {
        flex: 1,
        marginRight: Spacing.md,
    },
    diagnosisLabel: {
        ...Typography.styles.caption,
        marginBottom: 2,
    },
    diagnosisName: {
        ...Typography.styles.body,
        fontWeight: '600',
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    locationText: {
        ...Typography.styles.caption,
    },
});
