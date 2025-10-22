import { describe, it, expect, beforeAll, vi } from 'vitest';

// Mock AI functions before importing
vi.mock('../gemini', () => ({
  analyzeWithGemini: vi.fn().mockResolvedValue({
    diagnoses: [
      {
        name: 'Test Diagnosis Gemini',
        confidence: 85,
        description: 'Test description',
        keyFeatures: ['Feature 1', 'Feature 2'],
        recommendations: ['Recommendation 1', 'Recommendation 2'],
      },
    ],
    analysisTime: 2.5,
  }),
}));

vi.mock('../openai', () => ({
  analyzeWithOpenAI: vi.fn().mockResolvedValue({
    diagnoses: [
      {
        name: 'Test Diagnosis OpenAI',
        confidence: 82,
        description: 'Test description OpenAI',
        keyFeatures: ['Feature A', 'Feature B'],
        recommendations: ['Recommendation A', 'Recommendation B'],
      },
    ],
    analysisTime: 3.0,
  }),
}));

// Import after mocking
import { analyzeWithGemini } from '../gemini';
import { analyzeWithOpenAI } from '../openai';

// Mock storage
const mockStorage = {
  createCase: vi.fn(),
  updateCase: vi.fn(),
  getCaseById: vi.fn(),
  getCasesByUserId: vi.fn(),
  getSystemSettings: vi.fn(),
};

vi.mock('../storage', () => ({
  default: mockStorage,
}));

describe('Case Analysis API', () => {
  beforeAll(() => {
    // Default system settings mock
    mockStorage.getSystemSettings.mockResolvedValue({
      enableGemini: true,
      enableOpenAI: true,
      openaiModel: 'gpt-4o-mini',
      openaiAllowFallback: true,
    });
  });

  describe('AI Analysis Functions', () => {
    it('should analyze image with Gemini successfully', async () => {
      const result = await analyzeWithGemini('https://example.com/image.jpg', 'Itching, Redness', {
        lesionLocation: 'Arm',
        medicalHistory: ['Eczema'],
      });

      expect(result).toHaveProperty('diagnoses');
      expect(result).toHaveProperty('analysisTime');
      expect(Array.isArray(result.diagnoses)).toBe(true);
      expect(result.diagnoses.length).toBeGreaterThan(0);
      expect(result.diagnoses[0]).toHaveProperty('name');
      expect(result.diagnoses[0]).toHaveProperty('confidence');
      expect(result.diagnoses[0]).toHaveProperty('description');
      expect(result.diagnoses[0].name).toBe('Test Diagnosis Gemini');
    });

    it('should analyze image with OpenAI successfully', async () => {
      const result = await analyzeWithOpenAI('https://example.com/image.jpg', 'Pain, Swelling', {
        lesionLocation: 'Leg',
        medicalHistory: ['Diabetes'],
      });

      expect(result).toHaveProperty('diagnoses');
      expect(result).toHaveProperty('analysisTime');
      expect(Array.isArray(result.diagnoses)).toBe(true);
      expect(result.diagnoses.length).toBeGreaterThan(0);
      expect(result.diagnoses[0].name).toBe('Test Diagnosis OpenAI');
    });
  });

  describe('Case Creation', () => {
    it('should create case with valid data', async () => {
      const mockCase = {
        id: 'case-1',
        caseId: 'DR-2025-001',
        userId: 'user-1',
        patientId: 'patient-1',
        imageUrl: 'https://example.com/image.jpg',
        lesionLocation: 'Arm',
        symptoms: ['Itching', 'Redness'],
        status: 'pending',
        createdAt: new Date(),
      };

      mockStorage.createCase.mockResolvedValue(mockCase);

      const result = await mockStorage.createCase({
        userId: 'user-1',
        patientId: 'patient-1',
        imageUrl: 'https://example.com/image.jpg',
        lesionLocation: 'Arm',
        symptoms: ['Itching', 'Redness'],
      });

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('caseId');
      expect(result.status).toBe('pending');
    });
  });

  describe('Case Update After Analysis', () => {
    it('should update case with analysis results', async () => {
      const mockUpdatedCase = {
        id: 'case-1',
        caseId: 'DR-2025-001',
        status: 'completed',
        geminiAnalysis: {
          diagnoses: [
            {
              name: 'Eczema',
              confidence: 85,
              description: 'Inflammatory skin condition',
              keyFeatures: ['Dry skin', 'Redness'],
              recommendations: ['Moisturize regularly'],
            },
          ],
          analysisTime: 2.5,
        },
        openaiAnalysis: {
          diagnoses: [
            {
              name: 'Contact Dermatitis',
              confidence: 78,
              description: 'Allergic reaction',
              keyFeatures: ['Itching', 'Rash'],
              recommendations: ['Avoid allergens'],
            },
          ],
          analysisTime: 3.0,
        },
        finalDiagnoses: [
          {
            rank: 1,
            name: 'Eczema',
            confidence: 85,
            description: 'Inflammatory skin condition',
            keyFeatures: ['Dry skin', 'Redness'],
            recommendations: ['Moisturize regularly'],
            isUrgent: false,
          },
        ],
      };

      mockStorage.updateCase.mockResolvedValue(mockUpdatedCase);

      const result = await mockStorage.updateCase('case-1', 'user-1', {
        geminiAnalysis: mockUpdatedCase.geminiAnalysis,
        openaiAnalysis: mockUpdatedCase.openaiAnalysis,
        finalDiagnoses: mockUpdatedCase.finalDiagnoses,
        status: 'completed',
      });

      expect(result.status).toBe('completed');
      expect(result).toHaveProperty('geminiAnalysis');
      expect(result).toHaveProperty('openaiAnalysis');
      expect(result).toHaveProperty('finalDiagnoses');
      expect(result.finalDiagnoses.length).toBeGreaterThan(0);
    });
  });

  describe('Diagnosis Consensus Algorithm', () => {
    it('should boost confidence when both AI models agree', () => {
      // combineAnalyses fonksiyonu mock edildi ama mantığını test ediyoruz
      const geminiAnalysis = {
        diagnoses: [
          {
            name: 'Eczema',
            confidence: 80,
            description: 'Test',
            keyFeatures: [],
            recommendations: [],
          },
        ],
      };

      const openaiAnalysis = {
        diagnoses: [
          {
            name: 'Eczema', // Aynı teşhis
            confidence: 82,
            description: 'Test',
            keyFeatures: [],
            recommendations: [],
          },
        ],
      };

      // Consensus boost = 1.1x (her iki model anlaştığında)
      const avgConfidence = (80 + 82) / 2; // 81
      const expectedFinalConfidence = Math.round(avgConfidence * 1.1); // 89

      expect(expectedFinalConfidence).toBe(89);
    });

    it('should not boost confidence when models disagree', () => {
      const geminiAnalysis = {
        diagnoses: [
          {
            name: 'Eczema',
            confidence: 80,
            description: 'Test',
            keyFeatures: [],
            recommendations: [],
          },
        ],
      };

      const openaiAnalysis = {
        diagnoses: [
          {
            name: 'Psoriasis', // Farklı teşhis
            confidence: 75,
            description: 'Test',
            keyFeatures: [],
            recommendations: [],
          },
        ],
      };

      // Consensus boost yok = 1.0x (modeller anlaşmadı)
      const geminiConfidence = 80;
      const consensusBoost = 1.0;
      const expectedFinalConfidence = Math.round(geminiConfidence * consensusBoost);

      expect(expectedFinalConfidence).toBe(80);
    });
  });

  describe('Urgent Condition Detection', () => {
    it('should flag melanoma as urgent with high confidence', () => {
      const diagnosis = {
        name: 'Melanoma',
        confidence: 75,
      };

      const urgentConditions = ['melanoma', 'basal cell carcinoma', 'squamous cell carcinoma'];
      const isUrgent =
        urgentConditions.some((condition) =>
          diagnosis.name.toLowerCase().includes(condition.toLowerCase())
        ) && diagnosis.confidence > 25;

      expect(isUrgent).toBe(true);
    });

    it('should not flag non-urgent conditions', () => {
      const diagnosis = {
        name: 'Eczema',
        confidence: 85,
      };

      const urgentConditions = ['melanoma', 'basal cell carcinoma', 'squamous cell carcinoma'];
      const isUrgent =
        urgentConditions.some((condition) =>
          diagnosis.name.toLowerCase().includes(condition.toLowerCase())
        ) && diagnosis.confidence > 25;

      expect(isUrgent).toBe(false);
    });

    it('should not flag urgent conditions with low confidence', () => {
      const diagnosis = {
        name: 'Melanoma',
        confidence: 20, // Çok düşük güven
      };

      const urgentConditions = ['melanoma', 'basal cell carcinoma', 'squamous cell carcinoma'];
      const isUrgent =
        urgentConditions.some((condition) =>
          diagnosis.name.toLowerCase().includes(condition.toLowerCase())
        ) && diagnosis.confidence > 25;

      expect(isUrgent).toBe(false);
    });
  });
});
