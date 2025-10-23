import { useState, useCallback, memo } from 'react';
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
import { UserCheck, Brain } from 'lucide-react';

interface PatientData {
  patientId: string;
  age: number | null;
  gender: string;
  skinType: string;
  lesionLocation: string;
  symptoms: string[];
  additionalSymptoms: string;
  symptomDuration: string;
  medicalHistory: string[];
}

interface PatientFormProps {
  onSubmit: (data: PatientData) => void;
  isLoading?: boolean;
}

export const PatientForm = memo(function PatientForm({
  onSubmit,
  isLoading = false,
}: PatientFormProps) {
  const [formData, setFormData] = useState<PatientData>({
    patientId: '',
    age: null,
    gender: '',
    skinType: '',
    lesionLocation: '',
    symptoms: [],
    additionalSymptoms: '',
    symptomDuration: '',
    medicalHistory: [],
  });

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit(formData);
    },
    [formData, onSubmit]
  );

  const handleMedicalHistoryChange = useCallback((condition: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      medicalHistory: checked
        ? [...prev.medicalHistory, condition]
        : prev.medicalHistory.filter((item) => item !== condition),
    }));
  }, []);

  const handleSymptomChange = useCallback((symptom: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      symptoms: checked
        ? [...prev.symptoms, symptom]
        : prev.symptoms.filter((item) => item !== symptom),
    }));
  }, []);

  const dermatologicalSymptoms = [
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

  const symptomDurationOptions = [
    { value: 'less-than-1-day', label: 'Less than 1 day (1 günden az)' },
    { value: '1-7-days', label: '1-7 days (1-7 gün)' },
    { value: '1-4-weeks', label: '1-4 weeks (1-4 hafta)' },
    { value: '1-6-months', label: '1-6 months (1-6 ay)' },
    { value: 'more-than-6-months', label: 'More than 6 months (6 aydan fazla)' },
  ];

  const medicalConditions = [
    'Previous skin cancer',
    'Family history of melanoma',
    'Immunosuppressive medications',
    'Excessive sun exposure',
  ];

  return (
    <Card className="bg-card border border-border shadow-sm">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center">
          <UserCheck className="text-primary mr-2" size={20} />
          Patient Information & Symptoms
        </h3>

        <form onSubmit={handleSubmit} className="space-y-6" data-testid="form-patient-info">
          {/* Patient Demographics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="patientId" className="text-sm font-medium text-foreground mb-2">
                Patient ID
              </Label>
              <Input
                id="patientId"
                type="text"
                placeholder="Enter patient ID"
                value={formData.patientId}
                onChange={(e) => setFormData((prev) => ({ ...prev, patientId: e.target.value }))}
                className="w-full"
                required
                data-testid="input-patient-id"
              />
            </div>
            <div>
              <Label htmlFor="age" className="text-sm font-medium text-foreground mb-2">
                Age
              </Label>
              <Input
                id="age"
                type="number"
                placeholder="Patient age"
                value={formData.age || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    age: e.target.value ? parseInt(e.target.value) : null,
                  }))
                }
                className="w-full"
                data-testid="input-age"
              />
            </div>
          </div>

          {/* Gender and Skin Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-foreground mb-2">Gender</Label>
              <Select
                value={formData.gender}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, gender: value }))}
              >
                <SelectTrigger className="w-full" data-testid="select-gender">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium text-foreground mb-2">
                Fitzpatrick Skin Type
              </Label>
              <Select
                value={formData.skinType}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, skinType: value }))}
              >
                <SelectTrigger className="w-full" data-testid="select-skin-type">
                  <SelectValue placeholder="Select skin type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="type1">Type I (Very fair)</SelectItem>
                  <SelectItem value="type2">Type II (Fair)</SelectItem>
                  <SelectItem value="type3">Type III (Medium)</SelectItem>
                  <SelectItem value="type4">Type IV (Olive)</SelectItem>
                  <SelectItem value="type5">Type V (Brown)</SelectItem>
                  <SelectItem value="type6">Type VI (Black)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Lesion Location */}
          <div>
            <Label htmlFor="lesionLocation" className="text-sm font-medium text-foreground mb-2">
              Lesion Location
            </Label>
            <Input
              id="lesionLocation"
              type="text"
              placeholder="e.g., Left shoulder, Face, etc."
              value={formData.lesionLocation}
              onChange={(e) => setFormData((prev) => ({ ...prev, lesionLocation: e.target.value }))}
              className="w-full"
              data-testid="input-lesion-location"
            />
          </div>

          {/* Structured Symptoms Collection */}
          <div className="space-y-6">
            {/* Common Dermatological Symptoms */}
            <div>
              <Label className="text-sm font-medium text-foreground mb-4 block">
                Common Dermatological Symptoms (Yaygın Dermatolojik Semptomlar)
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {dermatologicalSymptoms.map((symptom) => (
                  <div key={symptom} className="flex items-center space-x-2">
                    <Checkbox
                      id={symptom}
                      checked={formData.symptoms.includes(symptom)}
                      onCheckedChange={(checked) =>
                        handleSymptomChange(symptom, checked as boolean)
                      }
                      data-testid={`checkbox-symptom-${symptom.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                    />
                    <Label htmlFor={symptom} className="text-sm text-foreground leading-5">
                      {symptom}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Symptoms */}
            <div>
              <Label
                htmlFor="additionalSymptoms"
                className="text-sm font-medium text-foreground mb-2"
              >
                Additional symptoms and descriptions (Ek semptomlar ve açıklamalar)
              </Label>
              <Textarea
                id="additionalSymptoms"
                rows={3}
                placeholder="Describe any additional symptoms, changes in size/color, other observations..."
                value={formData.additionalSymptoms}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, additionalSymptoms: e.target.value }))
                }
                className="w-full"
                data-testid="textarea-additional-symptoms"
              />
            </div>

            {/* Symptom Duration */}
            <div>
              <Label className="text-sm font-medium text-foreground mb-2">
                Symptom Duration (Semptom Süresi)
              </Label>
              <Select
                value={formData.symptomDuration}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, symptomDuration: value }))
                }
              >
                <SelectTrigger className="w-full" data-testid="select-symptom-duration">
                  <SelectValue placeholder="Select duration (Süre seçiniz)" />
                </SelectTrigger>
                <SelectContent>
                  {symptomDurationOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Medical History */}
          <div>
            <Label className="text-sm font-medium text-foreground mb-2">
              Relevant Medical History
            </Label>
            <div className="space-y-3">
              {medicalConditions.map((condition) => (
                <div key={condition} className="flex items-center space-x-2">
                  <Checkbox
                    id={condition}
                    checked={formData.medicalHistory.includes(condition)}
                    onCheckedChange={(checked) =>
                      handleMedicalHistoryChange(condition, checked as boolean)
                    }
                    data-testid={`checkbox-${condition.toLowerCase().replace(/\s+/g, '-')}`}
                  />
                  <Label htmlFor={condition} className="text-sm text-foreground">
                    {condition}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-border">
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 px-4 text-lg font-medium"
              disabled={isLoading || !formData.patientId}
              data-testid="button-analyze"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                  Analyzing...
                </div>
              ) : (
                <>
                  <Brain className="mr-2" size={20} />
                  Analyze with AI Models
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
});
