/**
 * TypeScript types for DermaAssistAI
 * Ported from shared/schema.ts
 */

// User types
export interface User {
    id: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
    role: string;
    medicalLicenseNumber: string | null;
    specialization: string | null;
    hospital: string | null;
    yearsOfExperience: number | null;
    phoneNumber: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
}

// Patient types
export interface Patient {
    id: string;
    patientId: string;
    age: number | null;
    gender: string | null;
    skinType: string | null;
    createdAt: Date | null;
}

export interface PatientData {
    patientId: string;
    age: number | null;
    gender: string;
    skinType: string;
    lesionLocation: string[];
    symptoms: string[];
    additionalSymptoms: string;
    symptomDuration: string;
    medicalHistory: string[];
}

// Diagnosis types
export interface DiagnosisResult {
    name: string;
    confidence: number;
    description: string;
    keyFeatures: string[];
    recommendations: string[];
}

export interface AIAnalysis {
    diagnoses: DiagnosisResult[];
    analysisTime: number;
}

export interface FinalDiagnosis {
    rank: number;
    name: string;
    confidence: number;
    description: string;
    keyFeatures: string[];
    recommendations: string[];
    isUrgent: boolean;
}

// Case types
export interface Case {
    id: string;
    caseId: string;
    userId: string;
    patientId: string | null;
    imageUrl: string | null;
    imageUrls: string[] | null;
    lesionLocation: string | null;
    symptoms: string[] | null;
    additionalSymptoms: string | null;
    symptomDuration: string | null;
    medicalHistory: string[] | null;
    geminiAnalysis: AIAnalysis | null;
    openaiAnalysis: AIAnalysis | null;
    finalDiagnoses: FinalDiagnosis[] | null;
    dermatologistDiagnosis: string | null;
    dermatologistNotes: string | null;
    dermatologistDiagnosedBy: string | null;
    dermatologistDiagnosedAt: Date | null;
    status: string | null;
    selectedAnalysisProvider: 'gemini' | 'openai' | null;
    createdAt: Date | null;
}

// Settings types
export interface UserSettings {
    id: string;
    userId: string;
    useGemini: boolean | null;
    useOpenAI: boolean | null;
    confidenceThreshold: number | null;
    autoSaveCases: boolean | null;
    anonymizeData: boolean | null;
    dataRetention: string | null;
    theme: string | null;
    compactMode: boolean | null;
    analysisNotifications: boolean | null;
    urgentAlerts: boolean | null;
    soundNotifications: boolean | null;
    createdAt: Date | null;
    updatedAt: Date | null;
}

// API Response types
export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    user: User;
}

export interface ApiError {
    error: string;
    message?: string;
    details?: unknown;
}

export interface AnalysisError {
    provider: string;
    code?: string;
    message: string;
    hint?: string;
    details?: unknown;
}

export interface AnalysisResponse extends Case {
    analysisErrors?: AnalysisError[];
}

// Profile with statistics
export interface ProfileWithStats extends User {
    statistics: {
        totalCases: number;
        completedCases: number;
        pendingCases: number;
        averageConfidence: number;
    };
}

// Profile update data
export interface UpdateProfileData {
    firstName?: string | null;
    lastName?: string | null;
    phoneNumber?: string | null;
    medicalLicenseNumber?: string | null;
    specialization?: string | null;
    hospital?: string | null;
    yearsOfExperience?: number | null;
    profileImageUrl?: string | null;
}

