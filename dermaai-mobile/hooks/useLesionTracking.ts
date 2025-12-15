/**
 * Lesion Tracking Hook (Pro Feature)
 * Manages lesion tracking state for progression monitoring
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
    LesionTracking,
    LesionTrackingWithData,
    LesionComparison,
    CreateLesionTrackingData,
    AddSnapshotData,
    AddSnapshotResponse,
    ComparisonDetailResponse,
} from '@/types/schema';

// Query keys
export const lesionTrackingKeys = {
    all: ['lesion-trackings'] as const,
    detail: (id: string) => ['lesion-trackings', id] as const,
    comparison: (id: string) => ['lesion-comparisons', id] as const,
};

/**
 * Get all lesion trackings for current user
 */
export function useLesionTrackings() {
    const queryClient = useQueryClient();

    const {
        data: trackings = [],
        isLoading,
        error,
        refetch,
    } = useQuery<LesionTracking[]>({
        queryKey: lesionTrackingKeys.all,
        queryFn: () => api.get<LesionTracking[]>('/api/lesion-trackings'),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    return {
        trackings,
        isLoading,
        error,
        refetch,
    };
}

/**
 * Get single lesion tracking with all snapshots and comparisons
 */
export function useLesionTracking(id: string, enabled: boolean = true) {
    const {
        data,
        isLoading,
        error,
        refetch,
    } = useQuery<LesionTrackingWithData>({
        queryKey: lesionTrackingKeys.detail(id),
        queryFn: () => api.get<LesionTrackingWithData>(`/api/lesion-trackings/${id}`),
        enabled: !!id && enabled,
        staleTime: 2 * 60 * 1000, // 2 minutes
    });

    return {
        tracking: data?.tracking,
        snapshots: data?.snapshots || [],
        comparisons: data?.comparisons || [],
        isLoading,
        error,
        refetch,
    };
}

/**
 * Create new lesion tracking
 */
export function useCreateLesionTracking() {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (data: CreateLesionTrackingData) => {
            return api.post<LesionTracking>('/api/lesion-trackings', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: lesionTrackingKeys.all });
        },
    });

    return {
        createTracking: mutation.mutateAsync,
        isCreating: mutation.isPending,
        error: mutation.error,
    };
}

/**
 * Update lesion tracking
 */
export function useUpdateLesionTracking() {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async ({
            id,
            data,
        }: {
            id: string;
            data: Partial<Pick<LesionTracking, 'name' | 'bodyLocation' | 'description' | 'status'>>;
        }) => {
            return api.patch<LesionTracking>(`/api/lesion-trackings/${id}`, data);
        },
        onSuccess: (updated: LesionTracking) => {
            queryClient.invalidateQueries({ queryKey: lesionTrackingKeys.all });
            queryClient.invalidateQueries({ queryKey: lesionTrackingKeys.detail(updated.id) });
        },
    });

    return {
        updateTracking: mutation.mutateAsync,
        isUpdating: mutation.isPending,
        error: mutation.error,
    };
}

/**
 * Delete lesion tracking
 */
export function useDeleteLesionTracking() {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/api/lesion-trackings/${id}`);
            return id;
        },
        onSuccess: (deletedId: string) => {
            queryClient.removeQueries({ queryKey: lesionTrackingKeys.detail(deletedId) });
            queryClient.invalidateQueries({ queryKey: lesionTrackingKeys.all });
        },
    });

    return {
        deleteTracking: mutation.mutateAsync,
        isDeleting: mutation.isPending,
        error: mutation.error,
    };
}

/**
 * Add new snapshot to tracking (with optional comparison)
 */
export function useAddSnapshot() {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async ({
            trackingId,
            data,
        }: {
            trackingId: string;
            data: AddSnapshotData;
        }) => {
            return api.post<AddSnapshotResponse>(
                `/api/lesion-trackings/${trackingId}/snapshots`,
                data
            );
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: lesionTrackingKeys.detail(variables.trackingId),
            });
            queryClient.invalidateQueries({ queryKey: lesionTrackingKeys.all });
        },
    });

    return {
        addSnapshot: mutation.mutateAsync,
        isAdding: mutation.isPending,
        error: mutation.error,
        data: mutation.data,
    };
}

/**
 * Get comparison details
 */
export function useComparisonDetail(id: string, enabled: boolean = true) {
    const {
        data,
        isLoading,
        error,
        refetch,
    } = useQuery<ComparisonDetailResponse>({
        queryKey: lesionTrackingKeys.comparison(id),
        queryFn: () => api.get<ComparisonDetailResponse>(`/api/lesion-comparisons/${id}`),
        enabled: !!id && enabled,
    });

    return {
        comparison: data?.comparison,
        previousSnapshot: data?.previousSnapshot,
        currentSnapshot: data?.currentSnapshot,
        tracking: data?.tracking,
        isLoading,
        error,
        refetch,
    };
}

/**
 * Manually trigger comparison between two snapshots
 */
export function useRunComparison() {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async ({
            trackingId,
            previousSnapshotId,
            currentSnapshotId,
            language = 'tr',
        }: {
            trackingId: string;
            previousSnapshotId: string;
            currentSnapshotId: string;
            language?: 'tr' | 'en';
        }) => {
            return api.post<{ comparison: LesionComparison; analysis: any }>(
                `/api/lesion-trackings/${trackingId}/compare`,
                { previousSnapshotId, currentSnapshotId, language }
            );
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: lesionTrackingKeys.detail(variables.trackingId),
            });
        },
    });

    return {
        runComparison: mutation.mutateAsync,
        isComparing: mutation.isPending,
        error: mutation.error,
        data: mutation.data,
    };
}

/**
 * Helper hook to get risk level styling
 */
export function useRiskLevelStyle() {
    return {
        getRiskColor: (level: string) => {
            switch (level) {
                case 'low':
                    return { bg: '#DCFCE7', text: '#166534', border: '#22C55E' };
                case 'moderate':
                    return { bg: '#FEF3C7', text: '#92400E', border: '#F59E0B' };
                case 'elevated':
                    return { bg: '#FED7AA', text: '#C2410C', border: '#EA580C' };
                case 'high':
                    return { bg: '#FEE2E2', text: '#991B1B', border: '#EF4444' };
                default:
                    return { bg: '#F3F4F6', text: '#374151', border: '#9CA3AF' };
            }
        },
        getRiskLabel: (level: string, language: 'tr' | 'en' = 'tr') => {
            const labels: Record<string, { tr: string; en: string }> = {
                low: { tr: 'Düşük Risk', en: 'Low Risk' },
                moderate: { tr: 'Orta Risk', en: 'Moderate Risk' },
                elevated: { tr: 'Yüksek Risk', en: 'Elevated Risk' },
                high: { tr: 'Acil', en: 'Urgent' },
            };
            return labels[level]?.[language] || level;
        },
        getProgressionLabel: (progression: string, language: 'tr' | 'en' = 'tr') => {
            const labels: Record<string, { tr: string; en: string }> = {
                stable: { tr: 'Stabil', en: 'Stable' },
                improved: { tr: 'İyileşme', en: 'Improved' },
                worsened: { tr: 'Kötüleşme', en: 'Worsened' },
                significant_change: { tr: 'Önemli Değişim', en: 'Significant Change' },
            };
            return labels[progression]?.[language] || progression;
        },
        getProgressionIcon: (progression: string) => {
            switch (progression) {
                case 'stable':
                    return '➖';
                case 'improved':
                    return '✅';
                case 'worsened':
                    return '⚠️';
                case 'significant_change':
                    return '🔴';
                default:
                    return '❓';
            }
        },
    };
}

