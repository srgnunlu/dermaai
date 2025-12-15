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
    isHealthProfessional: boolean | null;
    isProfileComplete: boolean | null;
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
    // Pro user features
    isFavorite: boolean | null;
    userNotes: string | null;
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
    isHealthProfessional?: boolean | null;
    isProfileComplete?: boolean | null;
}

// ============================================
// PRO FEATURE: Lesion Tracking Types
// ============================================

export type LesionTrackingStatus = 'monitoring' | 'resolved' | 'urgent';
export type LesionProgressionType = 'stable' | 'improved' | 'worsened' | 'significant_change';
export type LesionRiskLevel = 'low' | 'moderate' | 'elevated' | 'high';

export interface LesionTracking {
    id: string;
    userId: string;
    name: string;
    bodyLocation: string | null;
    description: string | null;
    initialCaseId: string | null;
    status: LesionTrackingStatus;
    lastComparisonAt: Date | null;
    snapshotCount: number;
    createdAt: Date | null;
    updatedAt: Date | null;
}

export interface LesionSnapshot {
    id: string;
    lesionTrackingId: string;
    caseId: string | null;
    imageUrls: string[] | null;
    notes: string | null;
    snapshotOrder: number;
    createdAt: Date | null;
    // Enriched with case data
    case?: Case;
}

export interface LesionComparisonAnalysis {
    changeDetected: boolean;
    changeSummary: string;
    sizeChange: string | null;
    colorChange: string | null;
    borderChange: string | null;
    textureChange: string | null;
    overallProgression: LesionProgressionType;
    riskLevel: LesionRiskLevel;
    recommendations: string[];
    detailedAnalysis: string;
    timeElapsed: string;
    analysisTime: number;
}

export interface LesionComparison {
    id: string;
    lesionTrackingId: string;
    previousSnapshotId: string;
    currentSnapshotId: string;
    comparisonAnalysis: LesionComparisonAnalysis | null;
    createdAt: Date | null;
}

export interface LesionTrackingWithData {
    tracking: LesionTracking;
    snapshots: LesionSnapshot[];
    comparisons: LesionComparison[];
}

export interface CreateLesionTrackingData {
    name: string;
    bodyLocation?: string;
    description?: string;
    initialCaseId?: string;
}

export interface AddSnapshotData {
    imageUrls: string[];
    caseId?: string;
    notes?: string;
    runComparison?: boolean;
    language?: 'tr' | 'en';
}

export interface AddSnapshotResponse {
    snapshot: LesionSnapshot;
    comparison: LesionComparison | null;
}

export interface ComparisonDetailResponse {
    comparison: LesionComparison;
    previousSnapshot: LesionSnapshot;
    currentSnapshot: LesionSnapshot;
    tracking: LesionTracking;
}

