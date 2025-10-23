import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DiagnosisResults } from '../DiagnosisResults';
import type { Case } from '@shared/schema';

describe('DiagnosisResults', () => {
  const mockCase: Case = {
    id: '1',
    caseId: 'CASE-001',
    userId: 'user1',
    patientId: 'patient1',
    imageUrl: 'https://example.com/image.jpg',
    status: 'completed',
    createdAt: new Date(),
    lesionLocation: 'arm',
    symptoms: ['redness', 'itching'],
    geminiAnalysis: {
      diagnoses: [
        {
          name: 'Eczema',
          confidence: 85,
          description: 'Inflammatory skin condition',
          keyFeatures: ['Dry skin', 'Itching'],
          recommendations: ['Moisturize regularly', 'Avoid irritants'],
        },
      ],
      analysisTime: 2.5,
    },
    openaiAnalysis: {
      diagnoses: [
        {
          name: 'Contact Dermatitis',
          confidence: 80,
          description: 'Allergic reaction',
          keyFeatures: ['Redness', 'Swelling'],
          recommendations: ['Identify allergen', 'Use corticosteroid cream'],
        },
      ],
      analysisTime: 3.2,
    },
    finalDiagnoses: null,
  };

  const mockHandlers = {
    onSaveCase: vi.fn(),
    onGenerateReport: vi.fn(),
    onNewAnalysis: vi.fn(),
  };

  it('should show loading state when no analysis is available', () => {
    const loadingCase = { ...mockCase, geminiAnalysis: null, openaiAnalysis: null };
    render(<DiagnosisResults caseData={loadingCase} {...mockHandlers} />);

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.getByText('Processing Analysis...')).toBeInTheDocument();
  });

  it('should display both AI analysis results', () => {
    render(<DiagnosisResults caseData={mockCase} {...mockHandlers} />);

    expect(screen.getByText('Gemini 2.5 Flash')).toBeInTheDocument();
    expect(screen.getByText('Eczema')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();

    expect(screen.getByText('GPT-4o Mini')).toBeInTheDocument();
    expect(screen.getByText('Contact Dermatitis')).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument();
  });

  it('should display analysis times', () => {
    render(<DiagnosisResults caseData={mockCase} {...mockHandlers} />);

    expect(screen.getByText('2.5s')).toBeInTheDocument();
    expect(screen.getByText('3.2s')).toBeInTheDocument();
  });

  it('should display key features', () => {
    render(<DiagnosisResults caseData={mockCase} {...mockHandlers} />);

    expect(screen.getByText('Dry skin')).toBeInTheDocument();
    expect(screen.getByText('Itching')).toBeInTheDocument();
    expect(screen.getByText('Redness')).toBeInTheDocument();
    expect(screen.getByText('Swelling')).toBeInTheDocument();
  });

  it('should display recommendations', () => {
    render(<DiagnosisResults caseData={mockCase} {...mockHandlers} />);

    expect(screen.getByText('Moisturize regularly')).toBeInTheDocument();
    expect(screen.getByText('Identify allergen')).toBeInTheDocument();
  });

  it('should show action buttons', () => {
    render(<DiagnosisResults caseData={mockCase} {...mockHandlers} />);

    expect(screen.getByTestId('button-save-case')).toBeInTheDocument();
    expect(screen.getByTestId('button-generate-report')).toBeInTheDocument();
    expect(screen.getByTestId('button-new-analysis')).toBeInTheDocument();
  });

  it('should handle missing Gemini analysis', () => {
    const caseWithoutGemini = { ...mockCase, geminiAnalysis: null };
    render(<DiagnosisResults caseData={caseWithoutGemini} {...mockHandlers} />);

    expect(screen.getByText('No analysis available')).toBeInTheDocument();
    expect(screen.getByText('Contact Dermatitis')).toBeInTheDocument();
  });

  it('should handle missing OpenAI analysis', () => {
    const caseWithoutOpenAI = { ...mockCase, openaiAnalysis: null };
    render(<DiagnosisResults caseData={caseWithoutOpenAI} {...mockHandlers} />);

    expect(screen.getByText('Eczema')).toBeInTheDocument();
    const noAnalysisTexts = screen.getAllByText('No analysis available');
    expect(noAnalysisTexts.length).toBeGreaterThan(0);
  });

  it('should display medical disclaimer', () => {
    render(<DiagnosisResults caseData={mockCase} {...mockHandlers} />);

    expect(screen.getByText(/Medical Disclaimer/)).toBeInTheDocument();
  });

  it('should show rank numbers for diagnoses', () => {
    render(<DiagnosisResults caseData={mockCase} {...mockHandlers} />);

    const rankBadges = screen.getAllByText('1');
    expect(rankBadges.length).toBeGreaterThan(0);
  });

  it('should display diagnosis descriptions', () => {
    render(<DiagnosisResults caseData={mockCase} {...mockHandlers} />);

    expect(screen.getByText('Inflammatory skin condition')).toBeInTheDocument();
    expect(screen.getByText('Allergic reaction')).toBeInTheDocument();
  });

  it('should show AI Analysis Results header', () => {
    render(<DiagnosisResults caseData={mockCase} {...mockHandlers} />);

    expect(screen.getByText('AI Analysis Results')).toBeInTheDocument();
  });

  it('should handle multiple diagnoses from each AI', () => {
    const caseWithMultiple = {
      ...mockCase,
      geminiAnalysis: {
        diagnoses: [
          { name: 'Diagnosis 1', confidence: 90, description: '', keyFeatures: [], recommendations: [] },
          { name: 'Diagnosis 2', confidence: 75, description: '', keyFeatures: [], recommendations: [] },
        ],
        analysisTime: 2.0,
      },
    };

    render(<DiagnosisResults caseData={caseWithMultiple} {...mockHandlers} />);

    expect(screen.getByText('Diagnosis 1')).toBeInTheDocument();
    expect(screen.getByText('Diagnosis 2')).toBeInTheDocument();
  });

  it('should show diagnoses in cards', () => {
    render(<DiagnosisResults caseData={mockCase} {...mockHandlers} />);

    // Both diagnoses should be displayed in the UI
    expect(screen.getByText('Eczema')).toBeInTheDocument();
    expect(screen.getByText('Contact Dermatitis')).toBeInTheDocument();
  });
});
