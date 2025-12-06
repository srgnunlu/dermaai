/**
 * PatientForm component for collecting patient information and symptoms
 * Ported from web app PatientForm.tsx
 */

import { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import {
    SYMPTOM_OPTIONS,
    LESION_LOCATIONS,
    DURATION_OPTIONS,
    SKIN_TYPES,
    MEDICAL_CONDITIONS,
} from '@/constants/Config';
import type { PatientData } from '@/types/schema';

interface PatientFormProps {
    onSubmit: (data: PatientData) => void;
    isLoading?: boolean;
    hasImages?: boolean;
}

export function PatientForm({ onSubmit, isLoading = false, hasImages = false }: PatientFormProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    const [formData, setFormData] = useState<PatientData>({
        patientId: '',
        age: null,
        gender: '',
        skinType: '',
        lesionLocation: [],
        symptoms: [],
        additionalSymptoms: '',
        symptomDuration: '',
        medicalHistory: [],
    });

    const toggleArrayItem = (field: 'lesionLocation' | 'symptoms' | 'medicalHistory', item: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].includes(item)
                ? prev[field].filter(i => i !== item)
                : [...prev[field], item],
        }));
    };

    const handleSubmit = () => {
        onSubmit(formData);
    };

    const isFormValid = formData.lesionLocation.length > 0;

    return (
        <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>
                👤 Hasta Bilgileri ve Belirtiler
            </Text>

            {/* Patient ID */}
            <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Hasta ID (opsiyonel)</Text>
                <TextInput
                    style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                    placeholder="Hasta numarası girin"
                    placeholderTextColor={colors.textSecondary}
                    value={formData.patientId}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, patientId: text }))}
                />
            </View>

            {/* Age & Gender Row */}
            <View style={styles.row}>
                <View style={[styles.fieldGroup, { flex: 1 }]}>
                    <Text style={[styles.label, { color: colors.text }]}>Yaş</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                        placeholder="Yaş"
                        placeholderTextColor={colors.textSecondary}
                        keyboardType="numeric"
                        value={formData.age?.toString() || ''}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, age: text ? parseInt(text) : null }))}
                    />
                </View>
                <View style={[styles.fieldGroup, { flex: 1 }]}>
                    <Text style={[styles.label, { color: colors.text }]}>Cinsiyet</Text>
                    <View style={styles.chipRow}>
                        {['male', 'female'].map((g) => (
                            <TouchableOpacity
                                key={g}
                                style={[
                                    styles.chip,
                                    { borderColor: colors.border },
                                    formData.gender === g && { backgroundColor: colors.primary, borderColor: colors.primary },
                                ]}
                                onPress={() => setFormData(prev => ({ ...prev, gender: g }))}
                            >
                                <Text style={[
                                    styles.chipText,
                                    { color: formData.gender === g ? colors.primaryForeground : colors.text },
                                ]}>
                                    {g === 'male' ? 'Erkek' : 'Kadın'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>

            {/* Skin Type */}
            <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Fitzpatrick Cilt Tipi</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.chipRow}>
                        {SKIN_TYPES.map((type) => (
                            <TouchableOpacity
                                key={type.value}
                                style={[
                                    styles.chip,
                                    { borderColor: colors.border },
                                    formData.skinType === type.value && { backgroundColor: colors.primary, borderColor: colors.primary },
                                ]}
                                onPress={() => setFormData(prev => ({ ...prev, skinType: type.value }))}
                            >
                                <Text style={[
                                    styles.chipText,
                                    { color: formData.skinType === type.value ? colors.primaryForeground : colors.text },
                                ]}>
                                    {type.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>
            </View>

            {/* Lesion Location */}
            <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                    Lezyon Konumu *
                </Text>
                <View style={styles.chipGrid}>
                    {LESION_LOCATIONS.map((location) => (
                        <TouchableOpacity
                            key={location}
                            style={[
                                styles.chip,
                                { borderColor: colors.border },
                                formData.lesionLocation.includes(location) && { backgroundColor: colors.primary, borderColor: colors.primary },
                            ]}
                            onPress={() => toggleArrayItem('lesionLocation', location)}
                        >
                            <Text style={[
                                styles.chipText,
                                { color: formData.lesionLocation.includes(location) ? colors.primaryForeground : colors.text },
                            ]}>
                                {location}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Symptoms */}
            <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Belirtiler</Text>
                <View style={styles.chipGrid}>
                    {SYMPTOM_OPTIONS.map((symptom) => (
                        <TouchableOpacity
                            key={symptom.value}
                            style={[
                                styles.chip,
                                { borderColor: colors.border },
                                formData.symptoms.includes(symptom.value) && { backgroundColor: colors.primary, borderColor: colors.primary },
                            ]}
                            onPress={() => toggleArrayItem('symptoms', symptom.value)}
                        >
                            <Text style={[
                                styles.chipText,
                                { color: formData.symptoms.includes(symptom.value) ? colors.primaryForeground : colors.text },
                            ]}>
                                {symptom.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Additional Symptoms */}
            <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Ek Belirtiler</Text>
                <TextInput
                    style={[styles.textArea, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                    placeholder="Diğer belirtileri yazın..."
                    placeholderTextColor={colors.textSecondary}
                    value={formData.additionalSymptoms}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, additionalSymptoms: text }))}
                    multiline
                    numberOfLines={3}
                />
            </View>

            {/* Duration */}
            <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Belirti Süresi</Text>
                <View style={styles.chipGrid}>
                    {DURATION_OPTIONS.map((duration) => (
                        <TouchableOpacity
                            key={duration.value}
                            style={[
                                styles.chip,
                                { borderColor: colors.border },
                                formData.symptomDuration === duration.value && { backgroundColor: colors.primary, borderColor: colors.primary },
                            ]}
                            onPress={() => setFormData(prev => ({ ...prev, symptomDuration: duration.value }))}
                        >
                            <Text style={[
                                styles.chipText,
                                { color: formData.symptomDuration === duration.value ? colors.primaryForeground : colors.text },
                            ]}>
                                {duration.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
                style={[
                    styles.submitButton,
                    { backgroundColor: colors.primary },
                    (!hasImages || !isFormValid || isLoading) && styles.buttonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={!hasImages || !isFormValid || isLoading}
            >
                {isLoading ? (
                    <ActivityIndicator color={colors.primaryForeground} />
                ) : (
                    <Text style={[styles.submitButtonText, { color: colors.primaryForeground }]}>
                        🔬 AI Analizi Başlat
                    </Text>
                )}
            </TouchableOpacity>

            {!hasImages && (
                <Text style={[styles.warningText, { color: colors.warning }]}>
                    ⚠️ Analiz için en az bir görsel yüklemeniz gerekiyor.
                </Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 16,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 16,
    },
    fieldGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
    },
    input: {
        height: 44,
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 12,
        fontSize: 14,
    },
    textArea: {
        minHeight: 80,
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        textAlignVertical: 'top',
    },
    row: {
        flexDirection: 'row',
        gap: 12,
    },
    chipRow: {
        flexDirection: 'row',
        gap: 8,
    },
    chipGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
    },
    chipText: {
        fontSize: 12,
        fontWeight: '500',
    },
    submitButton: {
        height: 52,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    warningText: {
        fontSize: 12,
        textAlign: 'center',
        marginTop: 12,
    },
});
