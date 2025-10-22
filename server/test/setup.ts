import { vi, beforeAll, afterAll } from 'vitest';
import dotenv from 'dotenv';

// Test environment variables yükle
dotenv.config({ path: '.env.test' });

// Varsayılan test environment variables
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/dermaai_test';
}

if (!process.env.SESSION_SECRET) {
  process.env.SESSION_SECRET = 'test-session-secret';
}

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'test';
}

// Mock AI services (test sırasında gerçek API çağrısı yapmamak için)
vi.mock('../gemini', () => ({
  analyzeWithGemini: vi.fn().mockResolvedValue({
    diagnoses: [
      {
        name: 'Test Diagnosis',
        confidence: 85,
        description: 'Test description',
        keyFeatures: ['Feature 1', 'Feature 2'],
        recommendations: ['Recommendation 1', 'Recommendation 2']
      }
    ],
    analysisTime: 2.5
  })
}));

vi.mock('../openai', () => ({
  analyzeWithOpenAI: vi.fn().mockResolvedValue({
    diagnoses: [
      {
        name: 'Test Diagnosis OpenAI',
        confidence: 82,
        description: 'Test description OpenAI',
        keyFeatures: ['Feature A', 'Feature B'],
        recommendations: ['Recommendation A', 'Recommendation B']
      }
    ],
    analysisTime: 3.2
  })
}));

// Console logları test sırasında sustur (isteğe bağlı)
beforeAll(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  vi.restoreAllMocks();
});
