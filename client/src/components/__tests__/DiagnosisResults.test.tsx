import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DiagnosisResults } from '../DiagnosisResults';
import type { Case } from '@shared/schema';

describe('DiagnosisResults Component', () => {
  const mockOnSaveCase = vi.fn();
  const mockOnGenerateReport = vi.fn();
  const mockOnNewAnalysis = vi.fn();

  const mockCaseData: Case = {
    id: 'case-1',
    caseId: 'DR-2025-001',
    userId: 'user-1',
    imageUrl: 'https://example.com/image.jpg',
    status: 'completed',
    createdAt: new Date(),
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
          name: 'Eczema',
          confidence: 82,
          description: 'Inflammatory skin condition',
          keyFeatures: ['Itching', 'Scaling'],
          recommendations: ['Consult dermatologist'],
        },
      ],
      analysisTime: 3.0,
    },
    finalDiagnoses: [
      {
        rank: 1,
        name: 'Eczema',
        confidence: 85,
        description: 'Inflammatory skin condition causing dry, itchy skin',
        keyFeatures: ['Dry skin', 'Redness', 'Itching'],
        recommendations: ['Moisturize regularly', 'Avoid triggers'],
        isUrgent: false,
      },
      {
        rank: 2,
        name: 'Contact Dermatitis',
        confidence: 65,
        description: 'Skin reaction to allergens or irritants',
        keyFeatures: ['Rash', 'Blisters'],
        recommendations: ['Identify and avoid allergens'],
        isUrgent: false,
      },
    ],
    lesionLocation: null,
    symptoms: null,
    additionalSymptoms: null,
    symptomDuration: null,
    medicalHistory: null,
    patientId: null,
  };

  beforeEach(() => {
    mockOnSaveCase.mockClear();
    mockOnGenerateReport.mockClear();
    mockOnNewAnalysis.mockClear();
  });

  it('should show loading state when no diagnoses available', () => {
    const caseDataWithoutDiagnoses: Case = {
      ...mockCaseData,
      finalDiagnoses: [],
    };

    render(
      <DiagnosisResults
        caseData={caseDataWithoutDiagnoses}
        onSaveCase={mockOnSaveCase}
        onGenerateReport={mockOnGenerateReport}
        onNewAnalysis={mockOnNewAnalysis}
      />
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.getByText(/Processing Analysis/i)).toBeInTheDocument();
  });

  it('should render AI analysis results header', () => {
    render(
      <DiagnosisResults
        caseData={mockCaseData}
        onSaveCase={mockOnSaveCase}
        onGenerateReport={mockOnGenerateReport}
        onNewAnalysis={mockOnNewAnalysis}
      />
    );

    expect(screen.getByText(/AI Analysis Results/i)).toBeInTheDocument();
    expect(screen.getByText(/Dual AI model analysis completed/i)).toBeInTheDocument();
  });

  it('should show Gemini and OpenAI status when both are present', () => {
    render(
      <DiagnosisResults
        caseData={mockCaseData}
        onSaveCase={mockOnSaveCase}
        onGenerateReport={mockOnGenerateReport}
        onNewAnalysis={mockOnNewAnalysis}
      />
    );

    expect(screen.getByText(/Gemini 2.5 Flash/i)).toBeInTheDocument();
    expect(screen.getByText(/ChatGPT-5/i)).toBeInTheDocument();
  });

  it('should render all diagnoses in order', () => {
    render(
      <DiagnosisResults
        caseData={mockCaseData}
        onSaveCase={mockOnSaveCase}
        onGenerateReport={mockOnGenerateReport}
        onNewAnalysis={mockOnNewAnalysis}
      />
    );

    expect(screen.getByTestId('diagnosis-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('diagnosis-card-2')).toBeInTheDocument();
  });

  it('should display diagnosis name and confidence correctly', () => {
    render(
      <DiagnosisResults
        caseData={mockCaseData}
        onSaveCase={mockOnSaveCase}
        onGenerateReport={mockOnGenerateReport}
        onNewAnalysis={mockOnNewAnalysis}
      />
    );

    expect(screen.getByTestId('text-diagnosis-name-1')).toHaveTextContent('Eczema');
    expect(screen.getByTestId('text-confidence-1')).toHaveTextContent('85%');

    expect(screen.getByTestId('text-diagnosis-name-2')).toHaveTextContent('Contact Dermatitis');
    expect(screen.getByTestId('text-confidence-2')).toHaveTextContent('65%');
  });

  it('should display diagnosis description', () => {
    render(
      <DiagnosisResults
        caseData={mockCaseData}
        onSaveCase={mockOnSaveCase}
        onGenerateReport={mockOnGenerateReport}
        onNewAnalysis={mockOnNewAnalysis}
      />
    );

    expect(screen.getByTestId('text-description-1')).toHaveTextContent(
      'Inflammatory skin condition causing dry, itchy skin'
    );
  });

  it('should display key features', () => {
    render(
      <DiagnosisResults
        caseData={mockCaseData}
        onSaveCase={mockOnSaveCase}
        onGenerateReport={mockOnGenerateReport}
        onNewAnalysis={mockOnNewAnalysis}
      />
    );

    expect(screen.getByText(/Key Features:/i)).toBeInTheDocument();
    expect(screen.getByText(/• Dry skin/i)).toBeInTheDocument();
    expect(screen.getByText(/• Redness/i)).toBeInTheDocument();
    expect(screen.getByText(/• Itching/i)).toBeInTheDocument();
  });

  it('should display recommendations', () => {
    render(
      <DiagnosisResults
        caseData={mockCaseData}
        onSaveCase={mockOnSaveCase}
        onGenerateReport={mockOnGenerateReport}
        onNewAnalysis={mockOnNewAnalysis}
      />
    );

    expect(screen.getByText(/Recommendations:/i)).toBeInTheDocument();
    expect(screen.getByText(/• Moisturize regularly/i)).toBeInTheDocument();
    expect(screen.getByText(/• Avoid triggers/i)).toBeInTheDocument();
  });

  it('should show urgent warning for urgent diagnoses', () => {
    const urgentCaseData: Case = {
      ...mockCaseData,
      finalDiagnoses: [
        {
          rank: 1,
          name: 'Melanoma',
          confidence: 75,
          description: 'Serious skin cancer',
          keyFeatures: ['Dark spots', 'Irregular borders'],
          recommendations: ['Seek immediate medical attention'],
          isUrgent: true,
        },
      ],
    };

    render(
      <DiagnosisResults
        caseData={urgentCaseData}
        onSaveCase={mockOnSaveCase}
        onGenerateReport={mockOnGenerateReport}
        onNewAnalysis={mockOnNewAnalysis}
      />
    );

    expect(screen.getByText(/URGENT MEDICAL ATTENTION REQUIRED/i)).toBeInTheDocument();
  });

  it('should call onGenerateReport when report button is clicked', () => {
    render(
      <DiagnosisResults
        caseData={mockCaseData}
        onSaveCase={mockOnSaveCase}
        onGenerateReport={mockOnGenerateReport}
        onNewAnalysis={mockOnNewAnalysis}
      />
    );

    const reportButton = screen.getByRole('button', { name: /Generate PDF Report/i });
    fireEvent.click(reportButton);

    expect(mockOnGenerateReport).toHaveBeenCalledTimes(1);
  });

  it('should call onNewAnalysis when new analysis button is clicked', () => {
    render(
      <DiagnosisResults
        caseData={mockCaseData}
        onSaveCase={mockOnSaveCase}
        onGenerateReport={mockOnGenerateReport}
        onNewAnalysis={mockOnNewAnalysis}
      />
    );

    const newAnalysisButton = screen.getByRole('button', { name: /New Analysis/i });
    fireEvent.click(newAnalysisButton);

    expect(mockOnNewAnalysis).toHaveBeenCalledTimes(1);
  });

  it('should apply correct confidence color for high confidence (>=80)', () => {
    render(
      <DiagnosisResults
        caseData={mockCaseData}
        onSaveCase={mockOnSaveCase}
        onGenerateReport={mockOnGenerateReport}
        onNewAnalysis={mockOnNewAnalysis}
      />
    );

    const confidence1 = screen.getByTestId('text-confidence-1');
    expect(confidence1).toHaveClass('text-success');
  });

  it('should apply correct confidence color for medium confidence (60-79)', () => {
    render(
      <DiagnosisResults
        caseData={mockCaseData}
        onSaveCase={mockOnSaveCase}
        onGenerateReport={mockOnGenerateReport}
        onNewAnalysis={mockOnNewAnalysis}
      />
    );

    const confidence2 = screen.getByTestId('text-confidence-2');
    expect(confidence2).toHaveClass('text-foreground');
  });

  it('should apply correct confidence color for low confidence (<40)', () => {
    const lowConfidenceCaseData: Case = {
      ...mockCaseData,
      finalDiagnoses: [
        {
          rank: 1,
          name: 'Unknown Condition',
          confidence: 25,
          description: 'Low confidence diagnosis',
          keyFeatures: [],
          recommendations: [],
          isUrgent: false,
        },
      ],
    };

    render(
      <DiagnosisResults
        caseData={lowConfidenceCaseData}
        onSaveCase={mockOnSaveCase}
        onGenerateReport={mockOnGenerateReport}
        onNewAnalysis={mockOnNewAnalysis}
      />
    );

    const confidence = screen.getByTestId('text-confidence-1');
    expect(confidence).toHaveClass('text-destructive');
  });

  it('should display rank badges correctly', () => {
    render(
      <DiagnosisResults
        caseData={mockCaseData}
        onSaveCase={mockOnSaveCase}
        onGenerateReport={mockOnGenerateReport}
        onNewAnalysis={mockOnNewAnalysis}
      />
    );

    // Rank 1 badge should have success styling
    const rank1Badge = screen.getByText('1');
    expect(rank1Badge).toHaveClass('bg-success');

    // Rank 2 badge should have muted styling
    const rank2Badge = screen.getByText('2');
    expect(rank2Badge).toHaveClass('bg-muted');
  });
});
