/**
 * Cases hook for managing patient cases
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Case, PatientData, AnalysisResponse, Patient } from '@/types/schema';

export function useCases() {
    const queryClient = useQueryClient();

    // Query all cases for current user
    const {
        data: cases = [],
        isLoading,
        error,
        refetch,
    } = useQuery<Case[]>({
        queryKey: ['cases'],
        queryFn: () => api.get<Case[]>('/api/cases'),
    });

    return {
        cases,
        isLoading,
        error,
        refetch,
    };
}

export function useCase(caseId: string) {
    const { data, isLoading, error } = useQuery<Case>({
        queryKey: ['cases', caseId],
        queryFn: () => api.get<Case>(`/api/cases/${caseId}`),
        enabled: !!caseId,
    });

    return {
        caseData: data,
        isLoading,
        error,
    };
}

export function useAnalyzeCase() {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async ({
            patientData,
            imageUrls
        }: {
            patientData: PatientData;
            imageUrls: string[];
        }) => {
            // First create patient
            const patient = await api.post<Patient>('/api/patients', patientData);

            // Then analyze the case
            const caseData = {
                patientId: patient.id,
                imageUrls,
                lesionLocation: patientData.lesionLocation.join(', '),
                symptoms: patientData.symptoms,
                additionalSymptoms: patientData.additionalSymptoms,
                symptomDuration: patientData.symptomDuration,
                medicalHistory: patientData.medicalHistory,
            };

            return api.post<AnalysisResponse>('/api/cases/analyze', caseData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cases'] });
        },
    });

    return {
        analyze: mutation.mutateAsync,
        isAnalyzing: mutation.isPending,
        error: mutation.error,
        data: mutation.data,
        reset: mutation.reset,
    };
}

export function useGenerateReport() {
    const mutation = useMutation({
        mutationFn: async (caseId: string) => {
            // For PDF, we need to handle binary response differently
            const response = await api.post<Blob>(`/api/cases/${caseId}/report`);
            return response;
        },
    });

    return {
        generateReport: mutation.mutateAsync,
        isGenerating: mutation.isPending,
        error: mutation.error,
    };
}
