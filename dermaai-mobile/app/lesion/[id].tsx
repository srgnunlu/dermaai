/**
 * Lesion Tracking Detail Screen
 * Shows timeline of snapshots and comparison results (Pro Feature)
 */

import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    ImageBackground,
    Image,
    Alert,
    ActivityIndicator,
    Platform,
    Modal,
    TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { format } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import * as Haptics from 'expo-haptics';
import {
    ArrowLeft,
    Calendar,
    MapPin,
    Camera,
    Plus,
    ChevronRight,
    Activity,
    TrendingUp,
    AlertTriangle,
    CheckCircle,
    Trash2,
    Edit3,
    X,
    Save,
} from 'lucide-react-native';
import { Spacing } from '@/constants/Spacing';
import { useLanguage } from '@/contexts/LanguageContext';
import {
    useLesionTracking,
    useDeleteLesionTracking,
    useUpdateLesionTracking,
    useRiskLevelStyle,
} from '@/hooks/useLesionTracking';
import { LoadingSpinner, EmptyState } from '@/components/ui';
import type { LesionSnapshot, LesionComparison } from '@/types/schema';

export default function LesionDetailScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { language } = useLanguage();
    const insets = useSafeAreaInsets();
    const dateLocale = language === 'tr' ? tr : enUS;

    const { tracking, snapshots, comparisons, isLoading, error, refetch } = useLesionTracking(id || '');
    const { deleteTracking, isDeleting } = useDeleteLesionTracking();
    const { updateTracking, isUpdating } = useUpdateLesionTracking();
    const { getRiskColor, getRiskLabel, getProgressionLabel, getProgressionIcon } = useRiskLevelStyle();

    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editName, setEditName] = useState('');
    const [editLocation, setEditLocation] = useState('');

    const handleDelete = useCallback(() => {
        Alert.alert(
            language === 'tr' ? 'Takibi Sil' : 'Delete Tracking',
            language === 'tr'
                ? 'Bu lezyon takibini silmek istediğinize emin misiniz? Tüm kayıtlar silinecektir.'
                : 'Are you sure you want to delete this lesion tracking? All records will be deleted.',
            [
                { text: language === 'tr' ? 'İptal' : 'Cancel', style: 'cancel' },
                {
                    text: language === 'tr' ? 'Sil' : 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteTracking(id!);
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            router.back();
                        } catch (err) {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                            Alert.alert(
                                language === 'tr' ? 'Hata' : 'Error',
                                language === 'tr' ? 'Takip silinemedi.' : 'Failed to delete tracking.'
                            );
                        }
                    },
                },
            ]
        );
    }, [id, language, deleteTracking, router]);

    const handleEdit = useCallback(() => {
        if (tracking) {
            setEditName(tracking.name);
            setEditLocation(tracking.bodyLocation || '');
            setEditModalVisible(true);
        }
    }, [tracking]);

    const handleSaveEdit = useCallback(async () => {
        if (!editName.trim()) {
            Alert.alert(
                language === 'tr' ? 'Hata' : 'Error',
                language === 'tr' ? 'Lezyon adı gereklidir.' : 'Lesion name is required.'
            );
            return;
        }

        try {
            await updateTracking({
                id: id!,
                data: {
                    name: editName.trim(),
                    bodyLocation: editLocation.trim() || null,
                },
            });
            setEditModalVisible(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (err) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert(
                language === 'tr' ? 'Hata' : 'Error',
                language === 'tr' ? 'Güncelleme başarısız.' : 'Update failed.'
            );
        }
    }, [id, editName, editLocation, language, updateTracking]);

    const handleAddSnapshot = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        // Navigate to diagnosis wizard with tracking context
        router.push({
            pathname: '/(tabs)',
            params: { lesionTrackingId: id },
        });
    }, [id, router]);

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

    if (error || !tracking) {
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
                        title={language === 'tr' ? 'Takip bulunamadı' : 'Tracking not found'}
                        description={language === 'tr'
                            ? 'Bu lezyon takibi mevcut değil.'
                            : 'This lesion tracking does not exist.'}
                        actionLabel={language === 'tr' ? 'Geri Dön' : 'Go Back'}
                        onAction={() => router.back()}
                    />
                </View>
            </ImageBackground>
        );
    }

    const statusColors = {
        monitoring: { bg: 'rgba(8, 145, 178, 0.15)', text: '#0891B2', label: language === 'tr' ? 'Takipte' : 'Monitoring' },
        resolved: { bg: 'rgba(34, 197, 94, 0.15)', text: '#22C55E', label: language === 'tr' ? 'Çözüldü' : 'Resolved' },
        urgent: { bg: 'rgba(239, 68, 68, 0.15)', text: '#EF4444', label: language === 'tr' ? 'Acil' : 'Urgent' },
    };
    const statusStyle = statusColors[tracking.status as keyof typeof statusColors] || statusColors.monitoring;

    // Get the latest comparison if exists
    const latestComparison = comparisons[0];

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

                    <Text style={styles.headerTitle}>
                        {language === 'tr' ? 'Lezyon Takibi' : 'Lesion Tracking'}
                    </Text>

                    <View style={styles.headerActions}>
                        <TouchableOpacity
                            style={styles.headerIconButton}
                            onPress={handleEdit}
                            activeOpacity={0.7}
                        >
                            <BlurView intensity={60} tint="light" style={styles.headerIconBlur}>
                                <Edit3 size={18} color="#0891B2" />
                            </BlurView>
                        </TouchableOpacity>
                    </View>
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Lesion Info Card */}
                    <View style={styles.infoCardWrapper}>
                        <BlurView intensity={70} tint="light" style={styles.infoCardBlur}>
                            <View style={styles.infoCard}>
                                <View style={styles.infoHeader}>
                                    <View style={styles.infoIconContainer}>
                                        <Activity size={24} color="#0891B2" />
                                    </View>
                                    <View style={styles.infoContent}>
                                        <Text style={styles.lesionName}>{tracking.name}</Text>
                                        {tracking.bodyLocation && (
                                            <View style={styles.locationRow}>
                                                <MapPin size={14} color="#64748B" />
                                                <Text style={styles.locationText}>{tracking.bodyLocation}</Text>
                                            </View>
                                        )}
                                    </View>
                                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                                        {tracking.status === 'urgent' && (
                                            <AlertTriangle size={12} color={statusStyle.text} />
                                        )}
                                        {tracking.status === 'resolved' && (
                                            <CheckCircle size={12} color={statusStyle.text} />
                                        )}
                                        <Text style={[styles.statusText, { color: statusStyle.text }]}>
                                            {statusStyle.label}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.infoDivider} />

                                <View style={styles.statsRow}>
                                    <View style={styles.statItem}>
                                        <Camera size={16} color="#64748B" />
                                        <Text style={styles.statValue}>{tracking.snapshotCount}</Text>
                                        <Text style={styles.statLabel}>
                                            {language === 'tr' ? 'Kayıt' : 'Records'}
                                        </Text>
                                    </View>
                                    <View style={styles.statDivider} />
                                    <View style={styles.statItem}>
                                        <TrendingUp size={16} color="#64748B" />
                                        <Text style={styles.statValue}>{comparisons.length}</Text>
                                        <Text style={styles.statLabel}>
                                            {language === 'tr' ? 'Karşılaştırma' : 'Comparisons'}
                                        </Text>
                                    </View>
                                    <View style={styles.statDivider} />
                                    <View style={styles.statItem}>
                                        <Calendar size={16} color="#64748B" />
                                        <Text style={styles.statValue}>
                                            {tracking.createdAt
                                                ? format(new Date(tracking.createdAt), 'dd MMM', { locale: dateLocale })
                                                : '-'}
                                        </Text>
                                        <Text style={styles.statLabel}>
                                            {language === 'tr' ? 'Başlangıç' : 'Started'}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </BlurView>
                    </View>

                    {/* Latest Comparison Result (if exists) */}
                    {latestComparison && latestComparison.comparisonAnalysis && (
                        <View style={styles.sectionWrapper}>
                            <Text style={styles.sectionTitle}>
                                {language === 'tr' ? '📊 Son Karşılaştırma' : '📊 Latest Comparison'}
                            </Text>
                            <TouchableOpacity
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    router.push(`/lesion/compare/${latestComparison.id}`);
                                }}
                                activeOpacity={0.8}
                            >
                                <View style={styles.comparisonCardWrapper}>
                                    <BlurView intensity={65} tint="light" style={styles.comparisonCardBlur}>
                                        <View style={styles.comparisonCard}>
                                            <View style={styles.comparisonHeader}>
                                                <View
                                                    style={[
                                                        styles.riskBadge,
                                                        { backgroundColor: getRiskColor(latestComparison.comparisonAnalysis.riskLevel).bg },
                                                    ]}
                                                >
                                                    <Text
                                                        style={[
                                                            styles.riskBadgeText,
                                                            { color: getRiskColor(latestComparison.comparisonAnalysis.riskLevel).text },
                                                        ]}
                                                    >
                                                        {getRiskLabel(latestComparison.comparisonAnalysis.riskLevel, language)}
                                                    </Text>
                                                </View>
                                                <Text style={styles.progressionText}>
                                                    {getProgressionIcon(latestComparison.comparisonAnalysis.overallProgression)}{' '}
                                                    {getProgressionLabel(latestComparison.comparisonAnalysis.overallProgression, language)}
                                                </Text>
                                            </View>

                                            <Text style={styles.changeSummary} numberOfLines={2}>
                                                {latestComparison.comparisonAnalysis.changeSummary}
                                            </Text>

                                            <View style={styles.comparisonFooter}>
                                                <Text style={styles.timeElapsed}>
                                                    ⏱️ {latestComparison.comparisonAnalysis.timeElapsed}
                                                </Text>
                                                <View style={styles.viewDetailRow}>
                                                    <Text style={styles.viewDetailText}>
                                                        {language === 'tr' ? 'Detayları Gör' : 'View Details'}
                                                    </Text>
                                                    <ChevronRight size={16} color="#0891B2" />
                                                </View>
                                            </View>
                                        </View>
                                    </BlurView>
                                </View>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Timeline Section */}
                    <View style={styles.sectionWrapper}>
                        <View style={styles.sectionTitleRow}>
                            <Text style={styles.sectionTitle}>
                                {language === 'tr' ? '📅 Zaman Çizelgesi' : '📅 Timeline'}
                            </Text>
                            <TouchableOpacity
                                style={styles.addButton}
                                onPress={handleAddSnapshot}
                                activeOpacity={0.7}
                            >
                                <BlurView intensity={60} tint="light" style={styles.addButtonBlur}>
                                    <Plus size={16} color="#0891B2" />
                                    <Text style={styles.addButtonText}>
                                        {language === 'tr' ? 'Yeni Kayıt' : 'New Record'}
                                    </Text>
                                </BlurView>
                            </TouchableOpacity>
                        </View>

                        {snapshots.map((snapshot, index) => (
                            <SnapshotCard
                                key={snapshot.id}
                                snapshot={snapshot}
                                index={index}
                                total={snapshots.length}
                                language={language}
                                dateLocale={dateLocale}
                                onPress={() => {
                                    if (snapshot.caseId) {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        router.push(`/case/${snapshot.caseId}`);
                                    }
                                }}
                            />
                        ))}
                    </View>

                    {/* Delete Button */}
                    <View style={styles.deleteButtonWrapper}>
                        <TouchableOpacity
                            style={styles.deleteButtonTouchable}
                            onPress={handleDelete}
                            disabled={isDeleting}
                            activeOpacity={0.7}
                        >
                            <BlurView intensity={60} tint="light" style={styles.deleteButtonBlur}>
                                <View style={[styles.deleteButtonContent, isDeleting && styles.deleteButtonDisabled]}>
                                    {isDeleting ? (
                                        <ActivityIndicator size="small" color="#FFFFFF" />
                                    ) : (
                                        <Trash2 size={20} color="#FFFFFF" />
                                    )}
                                    <Text style={styles.deleteButtonText}>
                                        {language === 'tr' ? 'Takibi Sil' : 'Delete Tracking'}
                                    </Text>
                                </View>
                            </BlurView>
                        </TouchableOpacity>
                    </View>
                </ScrollView>

                {/* Edit Modal */}
                <Modal
                    visible={editModalVisible}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setEditModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContainer}>
                            <BlurView intensity={90} tint="light" style={styles.modalBlur}>
                                <View style={styles.modalContent}>
                                    <View style={styles.modalHeader}>
                                        <Text style={styles.modalTitle}>
                                            {language === 'tr' ? 'Takibi Düzenle' : 'Edit Tracking'}
                                        </Text>
                                        <TouchableOpacity
                                            onPress={() => setEditModalVisible(false)}
                                            style={styles.closeButton}
                                        >
                                            <X size={22} color="#64748B" />
                                        </TouchableOpacity>
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>
                                            {language === 'tr' ? 'Lezyon Adı *' : 'Lesion Name *'}
                                        </Text>
                                        <TextInput
                                            style={styles.textInput}
                                            value={editName}
                                            onChangeText={setEditName}
                                            placeholder={language === 'tr' ? 'Örn: Sol koldaki ben' : 'E.g: Mole on left arm'}
                                            placeholderTextColor="#94A3B8"
                                        />
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>
                                            {language === 'tr' ? 'Vücut Bölgesi' : 'Body Location'}
                                        </Text>
                                        <TextInput
                                            style={styles.textInput}
                                            value={editLocation}
                                            onChangeText={setEditLocation}
                                            placeholder={language === 'tr' ? 'Örn: Sol kol, üst kısım' : 'E.g: Left arm, upper area'}
                                            placeholderTextColor="#94A3B8"
                                        />
                                    </View>

                                    <View style={styles.modalActions}>
                                        <TouchableOpacity
                                            style={styles.cancelButton}
                                            onPress={() => setEditModalVisible(false)}
                                            activeOpacity={0.7}
                                        >
                                            <Text style={styles.cancelButtonText}>
                                                {language === 'tr' ? 'İptal' : 'Cancel'}
                                            </Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.saveButton}
                                            onPress={handleSaveEdit}
                                            disabled={isUpdating}
                                            activeOpacity={0.7}
                                        >
                                            {isUpdating ? (
                                                <ActivityIndicator size="small" color="#FFFFFF" />
                                            ) : (
                                                <>
                                                    <Save size={16} color="#FFFFFF" />
                                                    <Text style={styles.saveButtonText}>
                                                        {language === 'tr' ? 'Kaydet' : 'Save'}
                                                    </Text>
                                                </>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </BlurView>
                        </View>
                    </View>
                </Modal>
            </View>
        </ImageBackground>
    );
}

// Snapshot Card Component
function SnapshotCard({
    snapshot,
    index,
    total,
    language,
    dateLocale,
    onPress,
}: {
    snapshot: LesionSnapshot;
    index: number;
    total: number;
    language: 'tr' | 'en';
    dateLocale: typeof tr | typeof enUS;
    onPress: () => void;
}) {
    const isFirst = index === 0;
    const isLast = index === total - 1;
    const imageUrl = snapshot.imageUrls?.[0];
    const createdDate = snapshot.createdAt
        ? format(new Date(snapshot.createdAt), 'dd MMM yyyy, HH:mm', { locale: dateLocale })
        : '-';

    // Get diagnosis from case if available
    const topDiagnosis = snapshot.case?.geminiAnalysis?.diagnoses?.[0];

    return (
        <View style={styles.timelineItem}>
            {/* Timeline Line */}
            <View style={styles.timelineLine}>
                <View style={[styles.timelineDot, isFirst && styles.timelineDotFirst]} />
                {!isLast && <View style={styles.timelineConnector} />}
            </View>

            {/* Content */}
            <TouchableOpacity
                style={styles.snapshotCardWrapper}
                onPress={onPress}
                activeOpacity={snapshot.caseId ? 0.8 : 1}
                disabled={!snapshot.caseId}
            >
                <BlurView intensity={60} tint="light" style={styles.snapshotCardBlur}>
                    <View style={styles.snapshotCard}>
                        {/* Image */}
                        {imageUrl && (
                            <Image
                                source={{ uri: imageUrl }}
                                style={styles.snapshotImage}
                                resizeMode="cover"
                            />
                        )}

                        {/* Info */}
                        <View style={styles.snapshotInfo}>
                            <Text style={styles.snapshotDate}>{createdDate}</Text>
                            {topDiagnosis && (
                                <Text style={styles.snapshotDiagnosis} numberOfLines={1}>
                                    {topDiagnosis.name}
                                </Text>
                            )}
                            {snapshot.notes && (
                                <Text style={styles.snapshotNotes} numberOfLines={1}>
                                    📝 {snapshot.notes}
                                </Text>
                            )}
                            <Text style={styles.snapshotOrder}>
                                #{snapshot.snapshotOrder} {language === 'tr' ? 'kayıt' : 'record'}
                            </Text>
                        </View>

                        {/* Arrow */}
                        {snapshot.caseId && (
                            <ChevronRight size={18} color="#94A3B8" />
                        )}
                    </View>
                </BlurView>
            </TouchableOpacity>
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
        justifyContent: 'space-between',
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
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#0F172A',
    },
    headerActions: {
        flexDirection: 'row',
        gap: 8,
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

    // Info Card
    infoCardWrapper: {
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: Spacing.lg,
    },
    infoCardBlur: {
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    infoCard: {
        padding: Spacing.lg,
        backgroundColor: Platform.select({
            android: 'rgba(255, 255, 255, 0.1)',
            ios: 'rgba(255, 255, 255, 0.2)',
        }),
    },
    infoHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    infoIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: 'rgba(8, 145, 178, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.md,
    },
    infoContent: {
        flex: 1,
    },
    lesionName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 4,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    locationText: {
        fontSize: 14,
        color: '#64748B',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
        gap: 5,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    infoDivider: {
        height: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.06)',
        marginVertical: Spacing.md,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
    },
    statItem: {
        alignItems: 'center',
        gap: 4,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
    },
    statLabel: {
        fontSize: 11,
        color: '#64748B',
    },
    statDivider: {
        width: 1,
        height: 40,
        backgroundColor: 'rgba(0, 0, 0, 0.06)',
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
        justifyContent: 'space-between',
        marginBottom: Spacing.sm,
    },

    // Add Button
    addButton: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    addButtonBlur: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(8, 145, 178, 0.3)',
        gap: 6,
        backgroundColor: Platform.select({
            android: 'rgba(8, 145, 178, 0.1)',
            ios: 'rgba(8, 145, 178, 0.1)',
        }),
    },
    addButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#0891B2',
    },

    // Comparison Card
    comparisonCardWrapper: {
        borderRadius: 18,
        overflow: 'hidden',
    },
    comparisonCardBlur: {
        borderRadius: 18,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    comparisonCard: {
        padding: Spacing.md,
        backgroundColor: Platform.select({
            android: 'rgba(255, 255, 255, 0.1)',
            ios: 'rgba(255, 255, 255, 0.2)',
        }),
    },
    comparisonHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Spacing.sm,
    },
    riskBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    riskBadgeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    progressionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0F172A',
    },
    changeSummary: {
        fontSize: 14,
        color: '#475569',
        lineHeight: 20,
        marginBottom: Spacing.sm,
    },
    comparisonFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    timeElapsed: {
        fontSize: 12,
        color: '#64748B',
    },
    viewDetailRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    viewDetailText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#0891B2',
    },

    // Timeline
    timelineItem: {
        flexDirection: 'row',
        marginBottom: Spacing.sm,
    },
    timelineLine: {
        width: 24,
        alignItems: 'center',
        marginRight: Spacing.sm,
    },
    timelineDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#0891B2',
        marginTop: 6,
    },
    timelineDotFirst: {
        backgroundColor: '#0891B2',
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 3,
        borderColor: 'rgba(8, 145, 178, 0.3)',
    },
    timelineConnector: {
        flex: 1,
        width: 2,
        backgroundColor: 'rgba(8, 145, 178, 0.3)',
        marginVertical: 4,
    },

    // Snapshot Card
    snapshotCardWrapper: {
        flex: 1,
        borderRadius: 16,
        overflow: 'hidden',
    },
    snapshotCardBlur: {
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    snapshotCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        backgroundColor: Platform.select({
            android: 'rgba(255, 255, 255, 0.1)',
            ios: 'rgba(255, 255, 255, 0.2)',
        }),
    },
    snapshotImage: {
        width: 56,
        height: 56,
        borderRadius: 12,
        marginRight: Spacing.md,
    },
    snapshotInfo: {
        flex: 1,
    },
    snapshotDate: {
        fontSize: 12,
        color: '#64748B',
        marginBottom: 2,
    },
    snapshotDiagnosis: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0F172A',
        marginBottom: 2,
    },
    snapshotNotes: {
        fontSize: 12,
        color: '#64748B',
        fontStyle: 'italic',
    },
    snapshotOrder: {
        fontSize: 11,
        color: '#94A3B8',
        marginTop: 2,
    },

    // Delete Button
    deleteButtonWrapper: {
        marginTop: Spacing.lg,
        marginBottom: Spacing.xl,
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

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        overflow: 'hidden',
    },
    modalBlur: {
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        overflow: 'hidden',
    },
    modalContent: {
        padding: Spacing.xl,
        paddingBottom: Spacing['3xl'],
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#0F172A',
    },
    closeButton: {
        padding: 4,
    },
    inputGroup: {
        marginBottom: Spacing.lg,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: Spacing.sm,
    },
    textInput: {
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.08)',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 15,
        color: '#0F172A',
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: Spacing.lg,
    },
    cancelButton: {
        flex: 1,
        padding: Spacing.md,
        borderRadius: 14,
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#64748B',
    },
    saveButton: {
        flex: 2,
        flexDirection: 'row',
        padding: Spacing.md,
        borderRadius: 14,
        backgroundColor: '#0891B2',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    saveButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});

