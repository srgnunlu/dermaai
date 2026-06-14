import { useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ImageUpload } from '@/components/ImageUpload';
import {
  UserCheck,
  MapPin,
  Activity,
  Camera,
  ClipboardCheck,
  Brain,
  ChevronLeft,
  ChevronRight,
  Check,
  ShieldCheck,
} from 'lucide-react';

interface PatientData {
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

interface PatientFormProps {
  onSubmit: (data: PatientData) => void;
  isLoading?: boolean;
  uploadedImages: string[];
  onImagesUploaded: (urls: string[]) => void;
}

// ---- Domain data (English-only for language consistency) ----
const LESION_REGIONS: { group: string; items: string[] }[] = [
  { group: 'Head & Neck', items: ['Scalp', 'Face', 'Ear', 'Neck'] },
  { group: 'Torso', items: ['Chest', 'Abdomen', 'Back', 'Shoulder'] },
  { group: 'Arms', items: ['Upper arm', 'Elbow', 'Forearm', 'Hand', 'Finger'] },
  { group: 'Lower body', items: ['Hip', 'Thigh', 'Knee', 'Lower leg', 'Foot', 'Toe'] },
];

const DERMATOLOGICAL_SYMPTOMS = [
  'Itching',
  'Pain',
  'Burning sensation',
  'Redness',
  'Swelling',
  'Discharge / oozing',
  'Crusting',
  'Scaling',
  'Dryness',
  'Tenderness',
  'Numbness',
  'Hardness',
];

const SYMPTOM_DURATION_OPTIONS = [
  { value: 'less-than-1-day', label: 'Less than 1 day' },
  { value: '1-7-days', label: '1–7 days' },
  { value: '1-4-weeks', label: '1–4 weeks' },
  { value: '1-6-months', label: '1–6 months' },
  { value: 'more-than-6-months', label: 'More than 6 months' },
];

const MEDICAL_CONDITIONS = [
  'Previous skin cancer',
  'Family history of melanoma',
  'Immunosuppressive medications',
  'Excessive sun exposure',
];

const FITZPATRICK_OPTIONS = [
  { value: 'type1', label: 'Type I (Very fair)' },
  { value: 'type2', label: 'Type II (Fair)' },
  { value: 'type3', label: 'Type III (Medium)' },
  { value: 'type4', label: 'Type IV (Olive)' },
  { value: 'type5', label: 'Type V (Brown)' },
  { value: 'type6', label: 'Type VI (Black)' },
];

// ---- Validation schema ----
const formSchema = z.object({
  patientId: z.string().trim().min(1, 'Patient ID is required'),
  age: z
    .string()
    .optional()
    .refine((v) => !v || (/^\d{1,3}$/.test(v) && Number(v) >= 0 && Number(v) <= 120), {
      message: 'Enter a valid age (0–120)',
    }),
  gender: z.string().optional(),
  skinType: z.string().optional(),
  lesionLocation: z.array(z.string()),
  symptoms: z.array(z.string()),
  additionalSymptoms: z.string().max(1000).optional(),
  symptomDuration: z.string().optional(),
  medicalHistory: z.array(z.string()),
  consent: z.literal(true, {
    errorMap: () => ({ message: 'Please acknowledge the notice before analyzing' }),
  }),
});

type FormValues = z.input<typeof formSchema>;

const STEPS = [
  { id: 'patient', title: 'Patient', subtitle: 'Demographics', icon: UserCheck },
  { id: 'location', title: 'Location', subtitle: 'Lesion site', icon: MapPin },
  { id: 'symptoms', title: 'Symptoms', subtitle: 'Signs & duration', icon: Activity },
  { id: 'images', title: 'Images', subtitle: 'Lesion photos', icon: Camera },
  { id: 'review', title: 'Review', subtitle: 'History & consent', icon: ClipboardCheck },
] as const;

// Selectable pill used for multi-select chips (locations & symptoms)
function SelectablePill({
  label,
  selected,
  onToggle,
  testId,
}: {
  label: string;
  selected: boolean;
  onToggle: () => void;
  testId?: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      aria-label={label}
      onClick={onToggle}
      data-testid={testId}
      className={`group flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition-all duration-200 ${
        selected
          ? 'border-transparent bg-gradient-to-r from-[#0891B2] to-[#14B8A6] text-white shadow-md shadow-primary/25'
          : 'border-border bg-card text-foreground hover:border-primary/40 hover:bg-primary/5'
      }`}
    >
      <span
        className={`flex h-4 w-4 items-center justify-center rounded-full border transition-colors ${
          selected ? 'border-white/70 bg-white/20' : 'border-muted-foreground/30'
        }`}
      >
        {selected && <Check className="h-3 w-3" />}
      </span>
      {label}
    </button>
  );
}

export function PatientForm({
  onSubmit,
  isLoading = false,
  uploadedImages,
  onImagesUploaded,
}: PatientFormProps) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [imageError, setImageError] = useState(false);

  const {
    control,
    handleSubmit,
    trigger,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      patientId: '',
      age: '',
      gender: '',
      skinType: '',
      lesionLocation: [],
      symptoms: [],
      additionalSymptoms: '',
      symptomDuration: '',
      medicalHistory: [],
      consent: false as unknown as true,
    },
  });

  const isLastStep = step === STEPS.length - 1;

  const goNext = useCallback(async () => {
    // Per-step validation gates
    if (step === 0) {
      const ok = await trigger(['patientId', 'age']);
      if (!ok) return;
    }
    if (step === 3) {
      // uploadedImages is only populated after the server upload resolves, so a
      // non-empty list already means the images are persisted and safe to submit.
      if (uploadedImages.length === 0) {
        setImageError(true);
        return;
      }
      setImageError(false);
    }
    setDirection(1);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }, [step, trigger, uploadedImages.length]);

  const goBack = useCallback(() => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
  }, []);

  const submitForm = handleSubmit((values) => {
    if (uploadedImages.length === 0) {
      setImageError(true);
      setDirection(-1);
      setStep(3);
      return;
    }
    onSubmit({
      patientId: values.patientId.trim(),
      age: values.age ? parseInt(values.age, 10) : null,
      gender: values.gender ?? '',
      skinType: values.skinType ?? '',
      lesionLocation: values.lesionLocation,
      symptoms: values.symptoms,
      additionalSymptoms: values.additionalSymptoms ?? '',
      symptomDuration: values.symptomDuration ?? '',
      medicalHistory: values.medicalHistory,
    });
  });

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 32 : -32, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -32 : 32, opacity: 0 }),
  };

  return (
    <Card className="premium-card overflow-hidden rounded-2xl border-border/60 shadow-sm">
      <CardContent className="p-0">
        <WizardStepper currentStep={step} />

        <form onSubmit={submitForm} data-testid="form-patient-info" className="px-6 pb-6 pt-2 sm:px-8">
          <div className="relative min-h-[360px]">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                {step === 0 && <StepPatient control={control} errors={errors} />}
                {step === 1 && <StepLocation control={control} watch={watch} />}
                {step === 2 && <StepSymptoms control={control} watch={watch} />}
                {step === 3 && (
                  <StepImages
                    uploadedImages={uploadedImages}
                    onImagesUploaded={(urls) => {
                      onImagesUploaded(urls);
                      if (urls.length > 0) setImageError(false);
                    }}
                    showError={imageError}
                  />
                )}
                {step === 4 && <StepReview control={control} watch={watch} errors={errors} />}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer navigation */}
          <div className="mt-6 flex items-center justify-between gap-3 border-t border-border/60 pt-5">
            <Button
              type="button"
              variant="ghost"
              onClick={goBack}
              disabled={step === 0 || isLoading}
              className="gap-1.5"
              data-testid="button-wizard-back"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>

            <span className="text-xs font-medium text-muted-foreground">
              Step {step + 1} of {STEPS.length}
            </span>

            {!isLastStep ? (
              <Button
                type="button"
                onClick={goNext}
                disabled={isLoading}
                className="gap-1.5 bg-gradient-to-r from-[#0891B2] to-[#14B8A6] text-white shadow-md shadow-primary/25 hover:opacity-95"
                data-testid="button-wizard-next"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isLoading}
                className="gap-2 bg-gradient-to-r from-[#0891B2] to-[#14B8A6] text-white shadow-md shadow-primary/25 hover:opacity-95"
                data-testid="button-analyze"
              >
                {isLoading ? (
                  <>
                    <span className="loading-spinner h-4 w-4 rounded-full border-2 border-white/40 border-t-white" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Brain className="h-5 w-5" />
                    Analyze with AI Models
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ---- Stepper header ----
function WizardStepper({ currentStep }: { currentStep: number }) {
  return (
    <div className="gradient-bg border-b border-border/60 px-6 py-5 sm:px-8">
      <div className="flex items-center">
        {STEPS.map((s, index) => {
          const Icon = s.icon;
          const isComplete = index < currentStep;
          const isActive = index === currentStep;
          return (
            <div key={s.id} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center text-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                    isActive
                      ? 'feature-icon border-transparent text-white'
                      : isComplete
                        ? 'border-transparent bg-primary text-primary-foreground'
                        : 'border-border bg-card text-muted-foreground'
                  }`}
                  data-testid={`step-indicator-${s.id}`}
                >
                  {isComplete ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </div>
                <div className="mt-2 hidden sm:block">
                  <p
                    className={`text-xs font-semibold leading-tight ${
                      isActive || isComplete ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {s.title}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{s.subtitle}</p>
                </div>
              </div>
              {index < STEPS.length - 1 && (
                <div className="mx-2 h-0.5 flex-1 overflow-hidden rounded-full bg-border">
                  <div
                    className={`h-full bg-gradient-to-r from-[#0891B2] to-[#14B8A6] transition-all duration-500 ${
                      isComplete ? 'w-full' : 'w-0'
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      {/* Mobile current-step label */}
      <p className="mt-3 text-center text-sm font-semibold text-foreground sm:hidden">
        {STEPS[currentStep].title}
        <span className="ml-1 font-normal text-muted-foreground">· {STEPS[currentStep].subtitle}</span>
      </p>
    </div>
  );
}

// ---- Step content types ----
type ControlType = ReturnType<typeof useForm<FormValues>>['control'];
type WatchType = ReturnType<typeof useForm<FormValues>>['watch'];
type ErrorsType = ReturnType<typeof useForm<FormValues>>['formState']['errors'];

function StepHeading({ icon: Icon, title, hint }: { icon: typeof UserCheck; title: string; hint?: string }) {
  return (
    <div className="mb-5">
      <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
        <Icon className="h-5 w-5 text-primary" />
        {title}
      </h3>
      {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}

// Step 1 — Patient demographics
function StepPatient({ control, errors }: { control: ControlType; errors: ErrorsType }) {
  return (
    <div>
      <StepHeading icon={UserCheck} title="Patient Information" hint="Basic demographics for context." />
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <Label htmlFor="patientId" className="mb-2 block text-sm font-medium">
            Patient ID <span className="text-destructive">*</span>
          </Label>
          <Controller
            control={control}
            name="patientId"
            render={({ field }) => (
              <Input
                id="patientId"
                placeholder="Enter patient ID"
                {...field}
                data-testid="input-patient-id"
              />
            )}
          />
          {errors.patientId && (
            <p className="mt-1.5 text-xs text-destructive">{errors.patientId.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="age" className="mb-2 block text-sm font-medium">
            Age
          </Label>
          <Controller
            control={control}
            name="age"
            render={({ field }) => (
              <Input
                id="age"
                type="number"
                inputMode="numeric"
                placeholder="Patient age"
                {...field}
                data-testid="input-age"
              />
            )}
          />
          {errors.age && <p className="mt-1.5 text-xs text-destructive">{errors.age.message}</p>}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <Label className="mb-2 block text-sm font-medium">Gender</Label>
          <Controller
            control={control}
            name="gender"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger data-testid="select-gender">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div>
          <Label className="mb-2 block text-sm font-medium">Fitzpatrick Skin Type</Label>
          <Controller
            control={control}
            name="skinType"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger data-testid="select-skin-type">
                  <SelectValue placeholder="Select skin type" />
                </SelectTrigger>
                <SelectContent>
                  {FITZPATRICK_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>
    </div>
  );
}

// Step 2 — Lesion location (visual selection)
function StepLocation({ control, watch }: { control: ControlType; watch: WatchType }) {
  const selected = watch('lesionLocation') ?? [];
  return (
    <div>
      <StepHeading
        icon={MapPin}
        title="Lesion Location"
        hint="Tap every body region where the lesion appears."
      />
      <Controller
        control={control}
        name="lesionLocation"
        render={({ field }) => {
          const toggle = (item: string) => {
            const next = field.value.includes(item)
              ? field.value.filter((v) => v !== item)
              : [...field.value, item];
            field.onChange(next);
          };
          return (
            <div className="space-y-5" data-testid="select-lesion-location">
              {LESION_REGIONS.map((region) => (
                <div key={region.group}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {region.group}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {region.items.map((item) => (
                      <SelectablePill
                        key={item}
                        label={item}
                        selected={field.value.includes(item)}
                        onToggle={() => toggle(item)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          );
        }}
      />
      <p className="mt-4 text-xs text-muted-foreground">
        {selected.length > 0
          ? `${selected.length} location${selected.length > 1 ? 's' : ''} selected`
          : 'No location selected yet (optional)'}
      </p>
    </div>
  );
}

// Step 3 — Symptoms + duration
function StepSymptoms({ control, watch }: { control: ControlType; watch: WatchType }) {
  const selected = watch('symptoms') ?? [];
  return (
    <div>
      <StepHeading
        icon={Activity}
        title="Symptoms & Duration"
        hint="Select all symptoms the patient reports."
      />
      <Controller
        control={control}
        name="symptoms"
        render={({ field }) => {
          const toggle = (item: string) => {
            const next = field.value.includes(item)
              ? field.value.filter((v) => v !== item)
              : [...field.value, item];
            field.onChange(next);
          };
          return (
            <div className="flex flex-wrap gap-2">
              {DERMATOLOGICAL_SYMPTOMS.map((symptom) => (
                <SelectablePill
                  key={symptom}
                  label={symptom}
                  selected={field.value.includes(symptom)}
                  onToggle={() => toggle(symptom)}
                  testId={`checkbox-symptom-${symptom.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                />
              ))}
            </div>
          );
        }}
      />
      <p className="mt-2 text-xs text-muted-foreground">
        {selected.length} symptom{selected.length === 1 ? '' : 's'} selected
      </p>

      <div className="mt-6">
        <Label className="mb-2 block text-sm font-medium">Symptom Duration</Label>
        <Controller
          control={control}
          name="symptomDuration"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger data-testid="select-symptom-duration">
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                {SYMPTOM_DURATION_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="mt-6">
        <Label htmlFor="additionalSymptoms" className="mb-2 block text-sm font-medium">
          Additional symptoms & notes
        </Label>
        <Controller
          control={control}
          name="additionalSymptoms"
          render={({ field }) => (
            <Textarea
              id="additionalSymptoms"
              rows={3}
              placeholder="Changes in size or color, bleeding, other observations..."
              {...field}
              data-testid="textarea-additional-symptoms"
            />
          )}
        />
      </div>
    </div>
  );
}

// Step 4 — Image upload
function StepImages({
  uploadedImages,
  onImagesUploaded,
  showError,
}: {
  uploadedImages: string[];
  onImagesUploaded: (urls: string[]) => void;
  showError: boolean;
}) {
  return (
    <div>
      <StepHeading
        icon={Camera}
        title="Lesion Images"
        hint="Capture or upload 1–3 clear photos of the lesion."
      />
      <ImageUpload
        onImagesUploaded={onImagesUploaded}
        uploadedImages={uploadedImages}
        embedded
      />
      {showError && (
        <p className="mt-3 text-sm font-medium text-destructive" data-testid="error-image-required">
          At least one lesion image is required to continue.
        </p>
      )}
    </div>
  );
}

// Step 5 — Medical history + consent
function StepReview({
  control,
  watch,
  errors,
}: {
  control: ControlType;
  watch: WatchType;
  errors: ErrorsType;
}) {
  const data = watch();
  return (
    <div>
      <StepHeading
        icon={ClipboardCheck}
        title="Medical History & Consent"
        hint="Relevant risk factors and your acknowledgment."
      />

      <Label className="mb-3 block text-sm font-medium">Relevant Medical History</Label>
      <Controller
        control={control}
        name="medicalHistory"
        render={({ field }) => (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {MEDICAL_CONDITIONS.map((condition) => {
              const checked = field.value.includes(condition);
              return (
                <button
                  type="button"
                  key={condition}
                  onClick={() =>
                    field.onChange(
                      checked
                        ? field.value.filter((v) => v !== condition)
                        : [...field.value, condition]
                    )
                  }
                  data-testid={`checkbox-${condition.toLowerCase().replace(/\s+/g, '-')}`}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all ${
                    checked
                      ? 'border-primary/40 bg-primary/5'
                      : 'border-border hover:border-primary/30 hover:bg-muted/40'
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                      checked ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/40'
                    }`}
                  >
                    {checked && <Check className="h-3.5 w-3.5" />}
                  </span>
                  {condition}
                </button>
              );
            })}
          </div>
        )}
      />

      {/* Compact summary */}
      <div className="glass-card-light mt-6 rounded-xl p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Case summary
        </p>
        <div className="grid grid-cols-2 gap-y-1.5 text-sm sm:grid-cols-3">
          <SummaryItem label="Patient" value={data.patientId || '—'} />
          <SummaryItem label="Age" value={data.age || '—'} />
          <SummaryItem label="Locations" value={String(data.lesionLocation?.length ?? 0)} />
          <SummaryItem label="Symptoms" value={String(data.symptoms?.length ?? 0)} />
        </div>
      </div>

      {/* Consent */}
      <Controller
        control={control}
        name="consent"
        render={({ field }) => (
          <label
            className="mt-6 flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-muted/30 p-4"
            data-testid="checkbox-consent-wrapper"
          >
            <Checkbox
              checked={field.value === true}
              onCheckedChange={(c) => field.onChange(c === true)}
              data-testid="checkbox-consent"
              className="mt-0.5"
            />
            <span className="flex items-start gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              I understand this AI-assisted assessment is for awareness only and does not replace a
              professional medical diagnosis.
            </span>
          </label>
        )}
      />
      {errors.consent && (
        <p className="mt-1.5 text-xs text-destructive">{errors.consent.message as string}</p>
      )}
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="font-medium text-foreground">{value}</p>
    </div>
  );
}
