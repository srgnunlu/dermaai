/**
 * Patient Form Component
 * Collects patient information and symptoms for AI analysis
 */

import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';
import { useColorScheme } from '@/components/useColorScheme';
import {
    Card,
    CardHeader,
    CardContent,
    Input,
    TextArea,
    Button,
    Chip,
    ChipGroup,
} from '@/components/ui';
import {
    SYMPTOM_OPTIONS,
    LESION_LOCATIONS,
    DURATION_OPTIONS,
    SKIN_TYPES,
    MEDICAL_CONDITIONS,
} from '@/constants/Config';
import type { PatientData } from '@/types/schema';
import { User, MapPin, Thermometer, Clock, FileText } from 'lucide-react-native';

interface PatientFormProps {
    onSubmit: (data: PatientData) => void;
    isLoading?: boolean;
    hasImages?: boolean;
    initialData?: Partial<PatientData>;
}

export function PatientForm({
    onSubmit,
    isLoading = false,
    hasImages = false,
    initialData,
}: PatientFormProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    // Form state
    const [patientId, setPatientId] = useState(initialData?.patientId || '');
    const [age, setAge] = useState(initialData?.age?.toString() || '');
    const [gender, setGender] = useState<string[]>(initialData?.gender ? [initialData.gender] : []);
    const [skinType, setSkinType] = useState<string[]>(initialData?.skinType ? [initialData.skinType] : []);
    const [lesionLocation, setLesionLocation] = useState<string[]>(initialData?.lesionLocation || []);
    const [symptoms, setSymptoms] = useState<string[]>(initialData?.symptoms || []);
    const [additionalSymptoms, setAdditionalSymptoms] = useState(initialData?.additionalSymptoms || '');
    const [symptomDuration, setSymptomDuration] = useState<string[]>(
        initialData?.symptomDuration ? [initialData.symptomDuration] : []
    );
    const [medicalHistory, setMedicalHistory] = useState<string[]>(initialData?.medicalHistory || []);

    // Handle form submission
    const handleSubmit = useCallback(() => {
        const data: PatientData = {
            patientId: patientId || `P-${Date.now()}`,
            age: age ? parseInt(age, 10) : null,
            gender: gender[0] || '',
            skinType: skinType[0] || '',
            lesionLocation,
            symptoms,
            additionalSymptoms,
            symptomDuration: symptomDuration[0] || '',
            medicalHistory,
        };

        onSubmit(data);
    }, [
        patientId,
        age,
        gender,
        skinType,
        lesionLocation,
        symptoms,
        additionalSymptoms,
        symptomDuration,
        medicalHistory,
        onSubmit,
    ]);

    // Validation
    const isValid = hasImages && lesionLocation.length > 0;

    const genderOptions = [
        { label: 'Erkek', value: 'male' },
        { label: 'Kadın', value: 'female' },
        { label: 'Diğer', value: 'other' },
    ];

    return (
        <View style={styles.container}>
            {/* Patient Info Section */}
            <Card>
                <CardHeader
                    title="Hasta Bilgileri"
                    subtitle="İsteğe bağlı"
                    icon={<User size={18} color={colors.primary} />}
                />
                <CardContent>
                    <View style={styles.row}>
                        <View style={styles.halfInput}>
                            <Input
                                label="Hasta ID"
                                placeholder="P-001"
                                value={patientId}
                                onChangeText={setPatientId}
                                containerStyle={{ marginBottom: 0 }}
                            />
                        </View>
                        <View style={styles.halfInput}>
                            <Input
                                label="Yaş"
                                placeholder="35"
                                value={age}
                                onChangeText={setAge}
                                keyboardType="numeric"
                                containerStyle={{ marginBottom: 0 }}
                            />
                        </View>
                    </View>

                    <Text style={[styles.fieldLabel, { color: colors.text }]}>Cinsiyet</Text>
                    <ChipGroup
                        options={genderOptions}
                        selected={gender}
                        onSelectionChange={setGender}
                        multiple={false}
                    />

                    <Text style={[styles.fieldLabel, { color: colors.text }]}>Cilt Tipi</Text>
                    <ChipGroup
                        options={SKIN_TYPES.map(s => ({ label: s.label, value: s.value }))}
                        selected={skinType}
                        onSelectionChange={setSkinType}
                        multiple={false}
                    />
                </CardContent>
            </Card>

            {/* Lesion Location Section */}
            <Card>
                <CardHeader
                    title="Lezyon Konumu"
                    subtitle="En az 1 konum seçin *"
                    icon={<MapPin size={18} color={colors.primary} />}
                />
                <CardContent>
                    <ChipGroup
                        options={LESION_LOCATIONS.map(l => ({ label: l.label, value: l.value }))}
                        selected={lesionLocation}
                        onSelectionChange={setLesionLocation}
                        multiple={true}
                    />
                    {lesionLocation.length === 0 && (
                        <Text style={[styles.requiredText, { color: colors.warning }]}>
                            * En az bir konum seçmeniz gerekmektedir
                        </Text>
                    )}
                </CardContent>
            </Card>

            {/* Symptoms Section */}
            <Card>
                <CardHeader
                    title="Belirtiler"
                    subtitle="Birden fazla seçebilirsiniz"
                    icon={<Thermometer size={18} color={colors.primary} />}
                />
                <CardContent>
                    <ChipGroup
                        options={SYMPTOM_OPTIONS.map(s => ({ label: s.label, value: s.value }))}
                        selected={symptoms}
                        onSelectionChange={setSymptoms}
                        multiple={true}
                    />

                    <TextArea
                        label="Ek Belirtiler"
                        placeholder="Varsa ek belirtileri açıklayın..."
                        value={additionalSymptoms}
                        onChangeText={setAdditionalSymptoms}
                        numberOfLines={3}
                        containerStyle={{ marginTop: Spacing.md }}
                    />
                </CardContent>
            </Card>

            {/* Duration Section */}
            <Card>
                <CardHeader
                    title="Belirti Süresi"
                    icon={<Clock size={18} color={colors.primary} />}
                />
                <CardContent>
                    <ChipGroup
                        options={DURATION_OPTIONS.map(d => ({ label: d.label, value: d.value }))}
                        selected={symptomDuration}
                        onSelectionChange={setSymptomDuration}
                        multiple={false}
                    />
                </CardContent>
            </Card>

            {/* Medical History Section */}
            <Card>
                <CardHeader
                    title="Tıbbi Geçmiş"
                    subtitle="Varsa ilgili durumları seçin"
                    icon={<FileText size={18} color={colors.primary} />}
                />
                <CardContent>
                    <ChipGroup
                        options={MEDICAL_CONDITIONS.map(m => ({ label: m.label, value: m.value }))}
                        selected={medicalHistory}
                        onSelectionChange={setMedicalHistory}
                        multiple={true}
                    />
                </CardContent>
            </Card>

            {/* Submit Button */}
            <Button
                variant="primary"
                size="lg"
                fullWidth
                onPress={handleSubmit}
                disabled={!isValid}
                loading={isLoading}
                style={styles.submitButton}
            >
                🔬 AI Analizi Başlat
            </Button>

            {!hasImages && (
                <Text style={[styles.hint, { color: colors.textMuted }]}>
                    Analiz için en az 1 lezyon görseli yükleyin
                </Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: Spacing.md,
    },
    row: {
        flexDirection: 'row',
        gap: Spacing.md,
        marginBottom: Spacing.md,
    },
    halfInput: {
        flex: 1,
    },
    fieldLabel: {
        ...Typography.styles.label,
        marginBottom: Spacing.sm,
        marginTop: Spacing.md,
    },
    requiredText: {
        ...Typography.styles.caption,
        marginTop: Spacing.sm,
    },
    submitButton: {
        marginTop: Spacing.md,
    },
    hint: {
        ...Typography.styles.caption,
        textAlign: 'center',
        marginTop: Spacing.sm,
    },
});
