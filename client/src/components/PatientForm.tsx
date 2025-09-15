import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { UserCheck, Brain } from "lucide-react";

interface PatientData {
  patientId: string;
  age: number | null;
  gender: string;
  skinType: string;
  lesionLocation: string;
  symptoms: string;
  medicalHistory: string[];
}

interface PatientFormProps {
  onSubmit: (data: PatientData) => void;
  isLoading?: boolean;
}

export function PatientForm({ onSubmit, isLoading = false }: PatientFormProps) {
  const [formData, setFormData] = useState<PatientData>({
    patientId: "",
    age: null,
    gender: "",
    skinType: "",
    lesionLocation: "",
    symptoms: "",
    medicalHistory: []
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleMedicalHistoryChange = (condition: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      medicalHistory: checked 
        ? [...prev.medicalHistory, condition]
        : prev.medicalHistory.filter(item => item !== condition)
    }));
  };

  const medicalConditions = [
    "Previous skin cancer",
    "Family history of melanoma", 
    "Immunosuppressive medications",
    "Excessive sun exposure"
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
                onChange={(e) => setFormData(prev => ({ ...prev, patientId: e.target.value }))}
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
                value={formData.age || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value ? parseInt(e.target.value) : null }))}
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
                onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}
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
              <Label className="text-sm font-medium text-foreground mb-2">Fitzpatrick Skin Type</Label>
              <Select 
                value={formData.skinType} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, skinType: value }))}
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
              onChange={(e) => setFormData(prev => ({ ...prev, lesionLocation: e.target.value }))}
              className="w-full"
              data-testid="input-lesion-location"
            />
          </div>

          {/* Symptom Description */}
          <div>
            <Label htmlFor="symptoms" className="text-sm font-medium text-foreground mb-2">
              Symptom Description
            </Label>
            <Textarea
              id="symptoms"
              rows={4}
              placeholder="Describe symptoms: itching, pain, changes in size/color, duration, etc."
              value={formData.symptoms}
              onChange={(e) => setFormData(prev => ({ ...prev, symptoms: e.target.value }))}
              className="w-full"
              data-testid="textarea-symptoms"
            />
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
                    onCheckedChange={(checked) => handleMedicalHistoryChange(condition, checked as boolean)}
                    data-testid={`checkbox-${condition.toLowerCase().replace(/\s+/g, '-')}`}
                  />
                  <Label
                    htmlFor={condition}
                    className="text-sm text-foreground"
                  >
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
}
