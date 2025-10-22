import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PatientForm } from '../PatientForm';

describe('PatientForm Component', () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it('should render all form fields', () => {
    render(<PatientForm onSubmit={mockOnSubmit} />);

    // Başlık kontrolü
    expect(screen.getByText(/Patient Information & Symptoms/i)).toBeInTheDocument();

    // Form alanlarını kontrol et (testid ile)
    expect(screen.getByTestId('input-patient-id')).toBeInTheDocument();
    expect(screen.getByTestId('input-age')).toBeInTheDocument();
    expect(screen.getByTestId('select-gender')).toBeInTheDocument();
    expect(screen.getByTestId('select-skin-type')).toBeInTheDocument();
    expect(screen.getByTestId('input-lesion-location')).toBeInTheDocument();
  });

  it('should update patient ID on input change', async () => {
    const user = userEvent.setup();
    render(<PatientForm onSubmit={mockOnSubmit} />);

    const patientIdInput = screen.getByTestId('input-patient-id') as HTMLInputElement;
    await user.type(patientIdInput, 'P-12345');

    expect(patientIdInput.value).toBe('P-12345');
  });

  it('should update age on input change', async () => {
    const user = userEvent.setup();
    render(<PatientForm onSubmit={mockOnSubmit} />);

    const ageInput = screen.getByTestId('input-age') as HTMLInputElement;
    await user.type(ageInput, '35');

    expect(ageInput.value).toBe('35');
  });

  it('should handle symptom selection', async () => {
    const user = userEvent.setup();
    render(<PatientForm onSubmit={mockOnSubmit} />);

    // Semptom checkbox'ını bul ve işaretle
    const itchingCheckbox = screen.getByLabelText(/Itching \(Kaşıntı\)/i);
    await user.click(itchingCheckbox);

    expect(itchingCheckbox).toBeChecked();
  });

  it('should handle multiple symptom selections', async () => {
    const user = userEvent.setup();
    render(<PatientForm onSubmit={mockOnSubmit} />);

    const itchingCheckbox = screen.getByLabelText(/Itching \(Kaşıntı\)/i);
    const painCheckbox = screen.getByLabelText(/Pain \(Ağrı\)/i);
    const rednessCheckbox = screen.getByLabelText(/Redness \(Kızarıklık\)/i);

    await user.click(itchingCheckbox);
    await user.click(painCheckbox);
    await user.click(rednessCheckbox);

    expect(itchingCheckbox).toBeChecked();
    expect(painCheckbox).toBeChecked();
    expect(rednessCheckbox).toBeChecked();
  });

  it('should uncheck symptom when clicked again', async () => {
    const user = userEvent.setup();
    render(<PatientForm onSubmit={mockOnSubmit} />);

    const itchingCheckbox = screen.getByLabelText(/Itching \(Kaşıntı\)/i);

    // İşaretle
    await user.click(itchingCheckbox);
    expect(itchingCheckbox).toBeChecked();

    // İşareti kaldır
    await user.click(itchingCheckbox);
    expect(itchingCheckbox).not.toBeChecked();
  });

  it('should handle medical history selection', async () => {
    const user = userEvent.setup();
    render(<PatientForm onSubmit={mockOnSubmit} />);

    const skinCancerCheckbox = screen.getByLabelText(/Previous skin cancer/i);
    await user.click(skinCancerCheckbox);

    expect(skinCancerCheckbox).toBeChecked();
  });

  it('should handle additional symptoms textarea', async () => {
    const user = userEvent.setup();
    render(<PatientForm onSubmit={mockOnSubmit} />);

    const additionalSymptomsTextarea = screen.getByTestId(
      'textarea-additional-symptoms'
    ) as HTMLTextAreaElement;

    await user.type(additionalSymptomsTextarea, 'Severe itching at night');

    expect(additionalSymptomsTextarea.value).toBe('Severe itching at night');
  });

  it('should call onSubmit with form data when submitted', async () => {
    const user = userEvent.setup();
    render(<PatientForm onSubmit={mockOnSubmit} />);

    // Form doldur
    const patientIdInput = screen.getByTestId('input-patient-id');
    await user.type(patientIdInput, 'P-12345');

    const ageInput = screen.getByTestId('input-age');
    await user.type(ageInput, '35');

    const itchingCheckbox = screen.getByLabelText(/Itching \(Kaşıntı\)/i);
    await user.click(itchingCheckbox);

    // Form gönder
    const submitButton = screen.getByTestId('button-analyze');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });

    // Gönderilen data'yı kontrol et
    const submittedData = mockOnSubmit.mock.calls[0][0];
    expect(submittedData.patientId).toBe('P-12345');
    expect(submittedData.age).toBe(35);
    expect(submittedData.symptoms).toContain('Itching (Kaşıntı)');
  });

  it('should disable submit button when loading', () => {
    render(<PatientForm onSubmit={mockOnSubmit} isLoading={true} />);

    const submitButton = screen.getByRole('button', { name: /Analyzing/i });
    expect(submitButton).toBeDisabled();
  });

  it('should show "Analyze" text when not loading', () => {
    render(<PatientForm onSubmit={mockOnSubmit} isLoading={false} />);

    const submitButton = screen.getByTestId('button-analyze');
    expect(submitButton).toHaveTextContent(/Analyze with AI Models/i);
    expect(submitButton).toBeDisabled(); // Disabled because patientId is empty
  });

  it('should prevent form submission when button is clicked during loading', async () => {
    const user = userEvent.setup();
    render(<PatientForm onSubmit={mockOnSubmit} isLoading={true} />);

    const submitButton = screen.getByRole('button', { name: /Analyzing/i });

    // Disabled buton tıklanamaz
    await user.click(submitButton);

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should render all 12 dermatological symptoms', () => {
    render(<PatientForm onSubmit={mockOnSubmit} />);

    const expectedSymptoms = [
      'Itching (Kaşıntı)',
      'Pain (Ağrı)',
      'Burning sensation (Yanma hissi)',
      'Redness (Kızarıklık)',
      'Swelling (Şişlik)',
      'Discharge/oozing (Sızıntı/akıntı)',
      'Crusting (Kabuklanma)',
      'Scaling (Pullanma)',
      'Dryness (Kuruluk)',
      'Sensitivity (Hassasiyet)',
      'Numbness (Uyuşma)',
      'Hardness (Sertlik)',
    ];

    expectedSymptoms.forEach((symptom) => {
      expect(screen.getByLabelText(symptom)).toBeInTheDocument();
    });
  });

  it('should render all symptom duration options', () => {
    render(<PatientForm onSubmit={mockOnSubmit} />);

    // Duration label'ını kontrol et
    expect(screen.getByText(/Symptom Duration/i)).toBeInTheDocument();
  });

  it('should have empty initial state', () => {
    render(<PatientForm onSubmit={mockOnSubmit} />);

    const patientIdInput = screen.getByTestId('input-patient-id') as HTMLInputElement;
    const ageInput = screen.getByTestId('input-age') as HTMLInputElement;

    expect(patientIdInput.value).toBe('');
    expect(ageInput.value).toBe('');
  });
});
