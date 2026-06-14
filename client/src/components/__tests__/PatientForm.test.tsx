import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PatientForm } from '../PatientForm';

// The wizard renders ImageUpload (which calls fetch) on step 4; the early steps
// under test never touch the network, so a light render harness is enough.
function renderForm(props: Partial<React.ComponentProps<typeof PatientForm>> = {}) {
  const onSubmit = props.onSubmit ?? vi.fn();
  const onImagesUploaded = props.onImagesUploaded ?? vi.fn();
  render(
    <PatientForm
      onSubmit={onSubmit}
      uploadedImages={props.uploadedImages ?? []}
      onImagesUploaded={onImagesUploaded}
      isLoading={props.isLoading ?? false}
    />
  );
  return { onSubmit, onImagesUploaded };
}

describe('PatientForm wizard', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders the first step with patient demographic fields', () => {
    renderForm();
    expect(screen.getByText(/Patient Information/i)).toBeInTheDocument();
    expect(screen.getByTestId('input-patient-id')).toBeInTheDocument();
    expect(screen.getByTestId('input-age')).toBeInTheDocument();
    expect(screen.getByTestId('select-gender')).toBeInTheDocument();
    expect(screen.getByTestId('select-skin-type')).toBeInTheDocument();
  });

  it('shows the step stepper indicators', () => {
    renderForm();
    expect(screen.getByTestId('step-indicator-patient')).toBeInTheDocument();
    expect(screen.getByTestId('step-indicator-images')).toBeInTheDocument();
    expect(screen.getByTestId('step-indicator-review')).toBeInTheDocument();
  });

  it('updates patient ID on input change', async () => {
    const user = userEvent.setup();
    renderForm();
    const input = screen.getByTestId('input-patient-id') as HTMLInputElement;
    await user.type(input, 'P-12345');
    expect(input.value).toBe('P-12345');
  });

  it('blocks advancing past step 1 without a patient ID', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.click(screen.getByTestId('button-wizard-next'));
    // Validation error keeps us on step 1
    expect(await screen.findByText(/Patient ID is required/i)).toBeInTheDocument();
    expect(screen.getByTestId('input-patient-id')).toBeInTheDocument();
  });

  it('advances to the location step after a valid patient ID', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByTestId('input-patient-id'), 'P-1');
    await user.click(screen.getByTestId('button-wizard-next'));
    await waitFor(() => {
      expect(screen.getByTestId('select-lesion-location')).toBeInTheDocument();
    });
  });

  it('allows selecting a symptom on the symptoms step', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByTestId('input-patient-id'), 'P-1');
    await user.click(screen.getByTestId('button-wizard-next')); // -> location
    await user.click(await screen.findByTestId('button-wizard-next')); // -> symptoms

    const itching = await screen.findByTestId('checkbox-symptom-itching');
    expect(itching).toHaveAttribute('aria-checked', 'false');
    await user.click(itching);
    expect(itching).toHaveAttribute('aria-checked', 'true');
  });

  it('reaches the review step and disables analyze while loading', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onImagesUploaded = vi.fn();
    const { rerender } = render(
      <PatientForm
        onSubmit={onSubmit}
        uploadedImages={['https://example.com/a.jpg']}
        onImagesUploaded={onImagesUploaded}
        isLoading={false}
      />
    );

    // Walk to the last step, waiting for each step to settle.
    await user.type(screen.getByTestId('input-patient-id'), 'P-1');
    await user.click(screen.getByTestId('button-wizard-next'));
    await screen.findByTestId('select-lesion-location');
    await user.click(screen.getByTestId('button-wizard-next'));
    await screen.findByTestId('checkbox-symptom-itching');
    await user.click(screen.getByTestId('button-wizard-next'));
    await screen.findByTestId('images-preview');
    await user.click(screen.getByTestId('button-wizard-next'));

    const analyze = await screen.findByTestId('button-analyze');
    expect(analyze).toBeEnabled();

    // Now flip to loading and confirm the analyze button is disabled.
    rerender(
      <PatientForm
        onSubmit={onSubmit}
        uploadedImages={['https://example.com/a.jpg']}
        onImagesUploaded={onImagesUploaded}
        isLoading={true}
      />
    );
    expect(screen.getByTestId('button-analyze')).toBeDisabled();
  });
});
