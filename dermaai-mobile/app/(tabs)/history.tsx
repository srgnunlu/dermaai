/**
 * Case History Screen
 * Redesigned with glassmorphism and filtering/sorting
 */

import React, { useCallback, useState, useMemo } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    RefreshControl,
    ImageBackground,
    Image,
    Modal,
    Dimensions,
    Animated,
    Platform,
    Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { GlassCard } from '@/components/ui/GlassCard';
import { useRouter } from 'expo-router';
import { format, isToday, isThisWeek, isThisMonth } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import * as Haptics from 'expo-haptics';
import {
    Calendar,
    MapPin,
    ChevronRight,
    Filter,
    SlidersHorizontal,
    X,
    Check,
    Camera,
    Star,
} from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';
import { Translations } from '@/constants/Translations';
import { useColorScheme } from '@/components/useColorScheme';
import { useCases, useDeleteCase, useToggleFavorite, useUpdateCaseNotes } from '@/hooks/useCases';
import { useSubscription } from '@/hooks/useSubscription';
import { useLanguage } from '@/contexts/LanguageContext';
import { SwipeableCaseCard } from '@/components/SwipeableCaseCard';
import {
    ConfidenceBadge,
    LoadingSpinner,
    EmptyState,
} from '@/components/ui';
import { CaseContextMenu } from '@/components/CaseContextMenu';
import { NoteModal } from '@/components/NoteModal';
import type { Case } from '@/types/schema';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Filter types
type DateFilter = 'all' | 'today' | 'week' | 'month';
type ConfidenceFilter = 'all' | 'high' | 'medium' | 'low';
type SortOption = 'newest' | 'oldest' | 'highConf' | 'lowConf';

interface FilterState {
    date: DateFilter;
    confidence: ConfidenceFilter;
    location: string | null;
    favorites: boolean;
    sort: SortOption;
}

const initialFilterState: FilterState = {
    date: 'all',
    confidence: 'all',
    location: null,
    favorites: false,
    sort: 'newest',
};

export default function HistoryScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const router = useRouter();
    const { language } = useLanguage();

    const { cases, isLoading, error, refetch } = useCases();
    const { deleteCase, isDeleting } = useDeleteCase();
    const { toggleFavorite, isToggling } = useToggleFavorite();
    const { updateNotes, isUpdating } = useUpdateCaseNotes();
    const { subscriptionStatus } = useSubscription();
    const insets = useSafeAreaInsets();
    const [filterModalVisible, setFilterModalVisible] = useState(false);
    const [filters, setFilters] = useState<FilterState>(initialFilterState);
    const [tempFilters, setTempFilters] = useState<FilterState>(initialFilterState);

    // Pro features state
    const [contextMenuVisible, setContextMenuVisible] = useState(false);
    const [noteModalVisible, setNoteModalVisible] = useState(false);
    const [selectedCase, setSelectedCase] = useState<Case | null>(null);
    const isPro = subscriptionStatus?.tier === 'pro';

    // Get unique locations from cases
    const uniqueLocations = useMemo(() => {
        const locations = new Set<string>();
        cases.forEach(c => {
            if (c.lesionLocation) {
                c.lesionLocation.split(',').forEach(loc => locations.add(loc.trim()));
            }
        });
        return Array.from(locations);
    }, [cases]);

    // Filter and sort cases
    const filteredCases = useMemo(() => {
        let result = [...cases];

        // Filter by date
        if (filters.date !== 'all') {
            result = result.filter(c => {
                if (!c.createdAt) return false;
                const date = new Date(c.createdAt);
                switch (filters.date) {
                    case 'today': return isToday(date);
                    case 'week': return isThisWeek(date, { weekStartsOn: 1 });
                    case 'month': return isThisMonth(date);
                    default: return true;
                }
            });
        }

        // Filter by favorites (Pro feature)
        if (filters.favorites) {
            result = result.filter(c => c.isFavorite === true);
        }

        // Filter by confidence
        if (filters.confidence !== 'all') {
            result = result.filter(c => {
                const topDiagnosis = c.finalDiagnoses?.[0] ||
                    c.geminiAnalysis?.diagnoses?.[0] ||
                    c.openaiAnalysis?.diagnoses?.[0];
                if (!topDiagnosis) return false;
                const conf = topDiagnosis.confidence;
                switch (filters.confidence) {
                    case 'high': return conf > 80;
                    case 'medium': return conf >= 50 && conf <= 80;
                    case 'low': return conf < 50;
                    default: return true;
                }
            });
        }

        // Filter by location
        if (filters.location) {
            result = result.filter(c =>
                c.lesionLocation?.toLowerCase().includes(filters.location!.toLowerCase())
            );
        }

        // Sort
        result.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;

            const confA = a.finalDiagnoses?.[0]?.confidence ||
                a.geminiAnalysis?.diagnoses?.[0]?.confidence ||
                a.openaiAnalysis?.diagnoses?.[0]?.confidence || 0;
            const confB = b.finalDiagnoses?.[0]?.confidence ||
                b.geminiAnalysis?.diagnoses?.[0]?.confidence ||
                b.openaiAnalysis?.diagnoses?.[0]?.confidence || 0;

            switch (filters.sort) {
                case 'newest': return dateB - dateA;
                case 'oldest': return dateA - dateB;
                case 'highConf': return confB - confA;
                case 'lowConf': return confA - confB;
                default: return dateB - dateA;
            }
        });

        return result;
    }, [cases, filters]);

    const handleCasePress = useCallback((caseItem: Case) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(`/case/${caseItem.id}`);
    }, [router]);

    const handleDeleteCase = useCallback((caseItem: Case) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Alert.alert(
            Translations.deleteCase[language],
            Translations.deleteCaseConfirm[language],
            [
                {
                    text: Translations.cancel[language],
                    style: 'cancel',
                },
                {
                    text: Translations.delete[language],
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteCase(caseItem.id);
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        } catch (err) {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                            Alert.alert(
                                Translations.error[language],
                                Translations.deleteCaseError[language]
                            );
                        }
                    },
                },
            ]
        );
    }, [language, deleteCase]);

    const openFilterModal = useCallback(() => {
        setTempFilters(filters);
        setFilterModalVisible(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, [filters]);

    const applyFilters = useCallback(() => {
        setFilters(tempFilters);
        setFilterModalVisible(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, [tempFilters]);

    const resetFilters = useCallback(() => {
        setTempFilters(initialFilterState);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, []);

    const hasActiveFilters = filters.date !== 'all' ||
        filters.confidence !== 'all' ||
        filters.location !== null ||
        filters.favorites ||
        filters.sort !== 'newest';

    // Pro feature handlers
    const handleLongPress = useCallback((caseItem: Case) => {
        setSelectedCase(caseItem);
        setContextMenuVisible(true);
    }, []);

    const handleToggleFavorite = useCallback(async () => {
        if (!selectedCase) return;
        try {
            await toggleFavorite({
                caseId: selectedCase.id,
                isFavorite: !selectedCase.isFavorite,
            });
            setContextMenuVisible(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (err) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    }, [selectedCase, toggleFavorite]);

    const handleOpenNoteModal = useCallback(() => {
        setContextMenuVisible(false);
        setNoteModalVisible(true);
    }, []);

    const handleSaveNotes = useCallback(async (notes: string | null) => {
        if (!selectedCase) return;
        try {
            await updateNotes({
                caseId: selectedCase.id,
                notes,
            });
            setNoteModalVisible(false);
            setSelectedCase(null);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (err) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    }, [selectedCase, updateNotes]);

    const handleCloseContextMenu = useCallback(() => {
        setContextMenuVisible(false);
        setSelectedCase(null);
    }, []);

    const handleCloseNoteModal = useCallback(() => {
        setNoteModalVisible(false);
        setSelectedCase(null);
    }, []);

    const renderCaseItem = useCallback(({ item, index }: { item: Case; index: number }) => (
        <SwipeableCaseCard
            caseData={item}
            onPress={() => handleCasePress(item)}
            onDelete={() => handleDeleteCase(item)}
            onLongPress={() => handleLongPress(item)}
            colors={colors}
            language={language}
            index={index}
        />
    ), [handleCasePress, handleDeleteCase, handleLongPress, colors, language]);

    if (isLoading && cases.length === 0) {
        return (
            <ImageBackground
                source={require('@/assets/images/home-bg.png')}
                style={styles.backgroundImage}
                resizeMode="cover"
            >
                <View style={[styles.container, styles.centered]}>
                    <LoadingSpinner text={Translations.loading[language]} />
                </View>
            </ImageBackground>
        );
    }

    if (error) {
        return (
            <ImageBackground
                source={require('@/assets/images/home-bg.png')}
                style={styles.backgroundImage}
                resizeMode="cover"
            >
                <View style={[styles.container, styles.centered]}>
                    <EmptyState
                        emoji="⚠️"
                        title={language === 'tr' ? 'Bir hata oluştu' : 'An error occurred'}
                        description={language === 'tr'
                            ? 'Vakalar yüklenirken bir hata oluştu.'
                            : 'An error occurred while loading cases.'}
                        actionLabel={Translations.retry[language]}
                        onAction={refetch}
                    />
                </View>
            </ImageBackground>
        );
    }

    if (cases.length === 0) {
        return (
            <ImageBackground
                source={require('@/assets/images/home-bg.png')}
                style={styles.backgroundImage}
                resizeMode="cover"
            >
                <View style={[styles.container, styles.centered]}>
                    <EmptyState
                        emoji="📋"
                        title={Translations.noScansYet[language]}
                        description={language === 'tr'
                            ? 'İlk tanı analizinizi yapmak için Tanı sekmesine gidin.'
                            : 'Go to Diagnosis tab to start your first analysis.'}
                        actionLabel={Translations.tabDiagnosis[language]}
                        onAction={() => router.push('/(tabs)')}
                    />
                </View>
            </ImageBackground>
        );
    }

    return (
        <ImageBackground
            source={require('@/assets/images/home-bg.png')}
            style={styles.backgroundImage}
            resizeMode="cover"
        >
            <View style={[styles.container, { paddingTop: insets.top }]}>
                {/* Custom Header Title */}
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>
                        {Translations.caseHistory[language]}
                    </Text>
                </View>

                {/* Stats Header with Glassmorphism */}
                <View style={styles.statsHeaderWrapper}>
                    <BlurView intensity={70} tint="light" style={styles.statsHeaderBlur}>
                        <View style={styles.statsHeader}>
                            <StatItem
                                label={Translations.totalCases[language]}
                                value={cases.length.toString()}
                            />
                            <View style={styles.statDivider} />
                            <StatItem
                                label={Translations.thisMonth[language]}
                                value={getThisMonthCount(cases).toString()}
                            />
                            <View style={styles.statDivider} />
                            <StatItem
                                label={Translations.completedCases[language]}
                                value={cases.filter(c => c.finalDiagnoses?.length).length.toString()}
                            />
                        </View>
                    </BlurView>
                </View>

                {/* Filter Bar */}
                <View style={styles.filterBarWrapper}>
                    <BlurView intensity={60} tint="light" style={styles.filterBarBlur}>
                        {/* Favorites Toggle (Pro feature) */}
                        {isPro && (
                            <TouchableOpacity
                                style={[
                                    styles.favoritesToggle,
                                    filters.favorites && styles.favoritesToggleActive,
                                ]}
                                onPress={() => {
                                    setFilters(prev => ({ ...prev, favorites: !prev.favorites }));
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                }}
                                activeOpacity={0.7}
                            >
                                <Star
                                    size={16}
                                    color={filters.favorites ? '#FFFFFF' : '#F59E0B'}
                                    fill={filters.favorites ? '#FFFFFF' : 'transparent'}
                                />
                                <Text style={[
                                    styles.favoritesToggleText,
                                    filters.favorites && styles.favoritesToggleTextActive,
                                ]}>
                                    {Translations.favorites[language]}
                                </Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={styles.filterButton}
                            onPress={openFilterModal}
                            activeOpacity={0.7}
                        >
                            <SlidersHorizontal size={18} color="#0891B2" />
                            <Text style={styles.filterButtonText}>
                                {Translations.filterSort[language]}
                            </Text>
                            {hasActiveFilters && (
                                <View style={styles.filterBadge}>
                                    <Text style={styles.filterBadgeText}>●</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </BlurView>
                </View>

                {/* Case List */}
                {filteredCases.length === 0 ? (
                    <View style={[styles.container, styles.centered]}>
                        <EmptyState
                            emoji="🔍"
                            title={Translations.noMatchingCases[language]}
                            description={Translations.tryDifferentFilters[language]}
                            actionLabel={Translations.resetFilters[language]}
                            onAction={() => setFilters(initialFilterState)}
                        />
                    </View>
                ) : (
                    <FlatList
                        data={filteredCases}
                        renderItem={renderCaseItem}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl
                                refreshing={isLoading}
                                onRefresh={refetch}
                                tintColor="#0891B2"
                                colors={['#0891B2']}
                            />
                        }
                        ItemSeparatorComponent={() => <View style={styles.separator} />}
                    />
                )}

                {/* Filter Modal */}
                <FilterModal
                    visible={filterModalVisible}
                    onClose={() => setFilterModalVisible(false)}
                    filters={tempFilters}
                    setFilters={setTempFilters}
                    onApply={applyFilters}
                    onReset={resetFilters}
                    locations={uniqueLocations}
                    language={language}
                />

                {/* Pro Feature: Context Menu */}
                <CaseContextMenu
                    visible={contextMenuVisible}
                    onClose={handleCloseContextMenu}
                    onToggleFavorite={handleToggleFavorite}
                    onAddNote={handleOpenNoteModal}
                    caseData={selectedCase}
                    language={language}
                    isPro={isPro}
                />

                {/* Pro Feature: Note Modal */}
                <NoteModal
                    visible={noteModalVisible}
                    onClose={handleCloseNoteModal}
                    onSave={handleSaveNotes}
                    initialNotes={selectedCase?.userNotes || null}
                    language={language}
                    isLoading={isUpdating}
                />
            </View>
        </ImageBackground>
    );
}

// Case card component with glassmorphism
function CaseCard({
    caseData,
    onPress,
    colors,
    language = 'tr',
    index,
}: {
    caseData: Case;
    onPress: () => void;
    colors: typeof Colors.light;
    language?: 'tr' | 'en';
    index: number;
}) {
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

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
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
        </TouchableOpacity>
    );
}

// Filter Modal Component
function FilterModal({
    visible,
    onClose,
    filters,
    setFilters,
    onApply,
    onReset,
    locations,
    language,
}: {
    visible: boolean;
    onClose: () => void;
    filters: FilterState;
    setFilters: (f: FilterState) => void;
    onApply: () => void;
    onReset: () => void;
    locations: string[];
    language: 'tr' | 'en';
}) {
    const dateOptions: { key: DateFilter; label: string }[] = [
        { key: 'all', label: Translations.allTime[language] },
        { key: 'today', label: Translations.today[language] },
        { key: 'week', label: Translations.thisWeek[language] },
        { key: 'month', label: Translations.thisMonth[language] },
    ];

    const confidenceOptions: { key: ConfidenceFilter; label: string }[] = [
        { key: 'all', label: Translations.allTime[language] },
        { key: 'high', label: Translations.highConfidence[language] },
        { key: 'medium', label: Translations.mediumConfidence[language] },
        { key: 'low', label: Translations.lowConfidence[language] },
    ];

    const sortOptions: { key: SortOption; label: string }[] = [
        { key: 'newest', label: Translations.newestFirst[language] },
        { key: 'oldest', label: Translations.oldestFirst[language] },
        { key: 'highConf', label: Translations.highestConfidence[language] },
        { key: 'lowConf', label: Translations.lowestConfidence[language] },
    ];

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    <BlurView intensity={90} tint="light" style={styles.modalBlur}>
                        <View style={styles.modalContent}>
                            {/* Header */}
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>
                                    {Translations.filterSort[language]}
                                </Text>
                                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                    <X size={22} color="#64748B" />
                                </TouchableOpacity>
                            </View>

                            {/* Date Filter */}
                            <View style={styles.filterSection}>
                                <Text style={styles.filterSectionTitle}>
                                    {Translations.filterByDate[language]}
                                </Text>
                                <View style={styles.filterOptions}>
                                    {dateOptions.map(opt => (
                                        <FilterChip
                                            key={opt.key}
                                            label={opt.label}
                                            selected={filters.date === opt.key}
                                            onPress={() => setFilters({ ...filters, date: opt.key })}
                                        />
                                    ))}
                                </View>
                            </View>

                            {/* Confidence Filter */}
                            <View style={styles.filterSection}>
                                <Text style={styles.filterSectionTitle}>
                                    {Translations.filterByConfidence[language]}
                                </Text>
                                <View style={styles.filterOptions}>
                                    {confidenceOptions.map(opt => (
                                        <FilterChip
                                            key={opt.key}
                                            label={opt.label}
                                            selected={filters.confidence === opt.key}
                                            onPress={() => setFilters({ ...filters, confidence: opt.key })}
                                        />
                                    ))}
                                </View>
                            </View>

                            {/* Location Filter */}
                            {locations.length > 0 && (
                                <View style={styles.filterSection}>
                                    <Text style={styles.filterSectionTitle}>
                                        {Translations.filterByLocation[language]}
                                    </Text>
                                    <View style={styles.filterOptions}>
                                        <FilterChip
                                            label={Translations.allTime[language]}
                                            selected={filters.location === null}
                                            onPress={() => setFilters({ ...filters, location: null })}
                                        />
                                        {locations.slice(0, 6).map(loc => (
                                            <FilterChip
                                                key={loc}
                                                label={loc}
                                                selected={filters.location === loc}
                                                onPress={() => setFilters({ ...filters, location: loc })}
                                            />
                                        ))}
                                    </View>
                                </View>
                            )}

                            {/* Sort Options */}
                            <View style={styles.filterSection}>
                                <Text style={styles.filterSectionTitle}>
                                    {Translations.sortBy[language]}
                                </Text>
                                <View style={styles.filterOptions}>
                                    {sortOptions.map(opt => (
                                        <FilterChip
                                            key={opt.key}
                                            label={opt.label}
                                            selected={filters.sort === opt.key}
                                            onPress={() => setFilters({ ...filters, sort: opt.key })}
                                        />
                                    ))}
                                </View>
                            </View>

                            {/* Actions */}
                            <View style={styles.modalActions}>
                                <TouchableOpacity
                                    style={styles.resetButton}
                                    onPress={onReset}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.resetButtonText}>
                                        {Translations.resetFilters[language]}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.applyButton}
                                    onPress={onApply}
                                    activeOpacity={0.7}
                                >
                                    <Check size={18} color="#FFFFFF" />
                                    <Text style={styles.applyButtonText}>
                                        {Translations.apply[language]}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </BlurView>
                </View>
            </View>
        </Modal>
    );
}

// Filter Chip Component
function FilterChip({
    label,
    selected,
    onPress,
}: {
    label: string;
    selected: boolean;
    onPress: () => void;
}) {
    return (
        <TouchableOpacity
            style={[styles.filterChip, selected && styles.filterChipSelected]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <Text style={[styles.filterChipText, selected && styles.filterChipTextSelected]}>
                {label}
            </Text>
        </TouchableOpacity>
    );
}

// Stat item component
function StatItem({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <View style={styles.statItem}>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
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

    // Custom Header Title
    headerTitleContainer: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.sm,
        paddingBottom: Spacing.md,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#0F172A',
    },

    // Stats Header
    statsHeaderWrapper: {
        marginHorizontal: Spacing.lg,
        marginTop: Spacing.md,
        borderRadius: 20,
        overflow: 'hidden',
    },
    statsHeaderBlur: {
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    statsHeader: {
        flexDirection: 'row',
        padding: Spacing.lg,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 28,
        fontWeight: '700',
        color: '#0F172A',
    },
    statLabel: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 2,
        fontWeight: '500',
    },
    statDivider: {
        width: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.08)',
        marginVertical: 4,
    },

    // Filter Bar
    filterBarWrapper: {
        marginHorizontal: Spacing.lg,
        marginTop: Spacing.md,
        borderRadius: 14,
        overflow: 'hidden',
    },
    filterBarBlur: {
        borderRadius: 14,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.md,
        backgroundColor: Platform.select({
            android: 'transparent',
            ios: 'rgba(255, 255, 255, 0.2)',
        }),
        gap: 8,
    },
    filterButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0891B2',
    },
    filterBadge: {
        marginLeft: 4,
    },
    filterBadgeText: {
        fontSize: 10,
        color: '#EF4444',
    },
    favoritesToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        borderRadius: 10,
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        gap: 6,
        marginRight: Spacing.sm,
    },
    favoritesToggleActive: {
        backgroundColor: '#F59E0B',
    },
    favoritesToggleText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#F59E0B',
    },
    favoritesToggleTextActive: {
        color: '#FFFFFF',
    },

    // List
    listContent: {
        padding: Spacing.lg,
        paddingBottom: 140, // Extra padding for floating tab bar
    },
    separator: {
        height: Spacing.md,
    },

    // Case Card
    caseCardWrapper: {
        borderRadius: 18,
        overflow: 'hidden',
        // marginBottom: Spacing.md, 
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
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500',
    },
    diagnosisName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#0F172A',
        marginBottom: 4,
        lineHeight: 20,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    locationText: {
        fontSize: 11,
        color: '#94A3B8',
    },
    rightSection: {
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        height: 64,
    },
    chevron: {
        marginTop: 'auto',
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
        maxHeight: '85%',
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
    filterSection: {
        marginBottom: Spacing.xl,
    },
    filterSectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#475569',
        marginBottom: Spacing.sm,
    },
    filterOptions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    filterChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.08)',
    },
    filterChipSelected: {
        backgroundColor: '#0891B2',
        borderColor: '#0891B2',
    },
    filterChipText: {
        fontSize: 13,
        color: '#475569',
        fontWeight: '500',
    },
    filterChipTextSelected: {
        color: '#FFFFFF',
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: Spacing.lg,
    },
    resetButton: {
        flex: 1,
        padding: Spacing.md,
        borderRadius: 14,
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        alignItems: 'center',
    },
    resetButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#64748B',
    },
    applyButton: {
        flex: 2,
        flexDirection: 'row',
        padding: Spacing.md,
        borderRadius: 14,
        backgroundColor: '#0891B2',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    applyButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});
