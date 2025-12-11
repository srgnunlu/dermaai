/**
 * Cases hook for managing patient cases
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ANALYSIS_TIMEOUT } from '@/constants/Config';
import type { Case, PatientData, AnalysisResponse, Patient } from '@/types/schema';

// Retry helper with exponential backoff
async function withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error as Error;

            // Check if it's a network error (retry-able)
            const isNetworkError =
                error instanceof TypeError &&
                error.message.includes('Network request failed');

            if (!isNetworkError || attempt === maxRetries - 1) {
                throw error;
            }

            // Exponential backoff: 1s, 2s, 4s
            const delay = baseDelay * Math.pow(2, attempt);
            console.log(`[useCases] Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw lastError;
}

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
            imageUrls,
            language = 'en'
        }: {
            patientData: PatientData;
            imageUrls: string[];
            language?: 'tr' | 'en';
        }) => {
            // First create patient
            const patient = await api.post<Patient>('/api/patients', patientData);

            // Upload images to server and get server URLs
            // Local file URIs cannot be accessed by AI models
            const uploadedUrls: string[] = [];

            for (let i = 0; i < imageUrls.length; i++) {
                const localUri = imageUrls[i];

                try {
                    // Read the local file as base64
                    const response = await fetch(localUri);
                    const blob = await response.blob();

                    // Convert blob to base64
                    const base64 = await new Promise<string>((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            const result = reader.result as string;
                            resolve(result);
                        };
                        reader.onerror = reject;
                        reader.readAsDataURL(blob);
                    });

                    // Upload to server with retry logic for network resilience
                    const filename = `lesion-${Date.now()}-${i + 1}.jpg`;
                    const uploadResult = await withRetry(
                        () => api.uploadImage(base64, filename),
                        3, // max retries
                        1000 // base delay 1s
                    );
                    uploadedUrls.push(uploadResult.url);
                } catch (uploadError) {
                    console.error(`Failed to upload image ${i + 1}:`, uploadError);
                    throw new Error(language === 'tr'
                        ? `Görsel ${i + 1} yüklenemedi. Lütfen tekrar deneyin.`
                        : `Failed to upload image ${i + 1}. Please try again.`);
                }
            }

            if (uploadedUrls.length === 0) {
                throw new Error(language === 'tr'
                    ? 'Hiçbir görsel yüklenemedi.'
                    : 'No images were uploaded.');
            }

            // Then analyze the case with uploaded server URLs
            const caseData = {
                patientId: patient.id,
                imageUrls: uploadedUrls,
                lesionLocation: patientData.lesionLocation.join(', '),
                symptoms: patientData.symptoms,
                additionalSymptoms: patientData.additionalSymptoms,
                symptomDuration: patientData.symptomDuration,
                medicalHistory: patientData.medicalHistory,
                language, // Pass language preference for AI analysis output
                isMobileRequest: true, // Flag for personalized AI responses based on user type
            };

            // Use longer timeout for AI analysis (2 minutes)
            return api.postWithTimeout<AnalysisResponse>('/api/cases/analyze', caseData, ANALYSIS_TIMEOUT);
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

export function useDeleteCase() {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (caseId: string) => {
            await api.delete(`/api/cases/${caseId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cases'] });
        },
    });

    return {
        deleteCase: mutation.mutateAsync,
        isDeleting: mutation.isPending,
        error: mutation.error,
    };
}
