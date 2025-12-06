import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useCases } from '@/hooks/useCases';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import type { Case } from '@/types/schema';

function CaseCard({ caseData, onPress }: { caseData: Case; onPress: () => void }) {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    const topDiagnosis = caseData.geminiAnalysis?.diagnoses?.[0] ||
        caseData.openaiAnalysis?.diagnoses?.[0];

    const statusColor = caseData.status === 'completed' ? colors.success : colors.warning;
    const statusText = caseData.status === 'completed' ? 'Tamamlandı' : 'Beklemede';

    return (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={onPress}
        >
            <View style={styles.cardHeader}>
                <Text style={[styles.caseId, { color: colors.primary }]}>
                    {caseData.caseId}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                    <Text style={[styles.statusText, { color: statusColor }]}>
                        {statusText}
                    </Text>
                </View>
            </View>

            {topDiagnosis && (
                <View style={styles.diagnosisRow}>
                    <Text style={[styles.diagnosisLabel, { color: colors.textSecondary }]}>
                        En Olası Tanı:
                    </Text>
                    <Text style={[styles.diagnosisName, { color: colors.text }]} numberOfLines={1}>
                        {topDiagnosis.name}
                    </Text>
                    <Text style={[styles.confidence, { color: colors.primary }]}>
                        %{topDiagnosis.confidence}
                    </Text>
                </View>
            )}

            <View style={styles.cardFooter}>
                <Text style={[styles.location, { color: colors.textSecondary }]} numberOfLines={1}>
                    📍 {caseData.lesionLocation || 'Belirtilmedi'}
                </Text>
                <Text style={[styles.date, { color: colors.textSecondary }]}>
                    {caseData.createdAt
                        ? format(new Date(caseData.createdAt), 'dd MMM yyyy', { locale: tr })
                        : '-'
                    }
                </Text>
            </View>
        </TouchableOpacity>
    );
}

export default function HistoryScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const router = useRouter();
    const { cases, isLoading, refetch } = useCases();

    const handleCasePress = (caseId: string) => {
        router.push(`/case/${caseId}`);
    };

    if (isLoading) {
        return (
            <View style={[styles.centered, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                    Vakalar yükleniyor...
                </Text>
            </View>
        );
    }

    if (cases.length === 0) {
        return (
            <View style={[styles.centered, { backgroundColor: colors.background }]}>
                <Text style={styles.emptyEmoji}>📋</Text>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                    Henüz vaka yok
                </Text>
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                    İlk tanı analizinizi başlatmak için "Tanı" sekmesine gidin.
                </Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <FlatList
                data={cases}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <CaseCard
                        caseData={item}
                        onPress={() => handleCasePress(item.id)}
                    />
                )}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl
                        refreshing={isLoading}
                        onRefresh={refetch}
                        tintColor={colors.primary}
                    />
                }
                ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
    },
    emptyEmoji: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        textAlign: 'center',
    },
    list: {
        padding: 16,
    },
    card: {
        borderRadius: 12,
        borderWidth: 1,
        padding: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    caseId: {
        fontSize: 16,
        fontWeight: '600',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '500',
    },
    diagnosisRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    diagnosisLabel: {
        fontSize: 12,
    },
    diagnosisName: {
        flex: 1,
        fontSize: 14,
        fontWeight: '500',
    },
    confidence: {
        fontSize: 14,
        fontWeight: '600',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    location: {
        flex: 1,
        fontSize: 12,
    },
    date: {
        fontSize: 12,
    },
});
