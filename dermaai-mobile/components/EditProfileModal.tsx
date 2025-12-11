/**
 * Edit Profile Modal Component
 * Allows users to edit their profile information with glassmorphism design
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TextInput,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { X, Save, User, Phone, Award, Building2, Calendar } from 'lucide-react-native';
import { Spacing } from '@/constants/Spacing';
import { Translations } from '@/constants/Translations';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import type { UpdateProfileData } from '@/types/schema';

interface EditProfileModalProps {
    visible: boolean;
    onClose: () => void;
    isHealthProfessional: boolean;
}

export default function EditProfileModal({ visible, onClose, isHealthProfessional }: EditProfileModalProps) {
    const { language } = useLanguage();
    const { user, updateProfile, isUpdatingProfile, refetch } = useAuth();

    // Form state
    const [formData, setFormData] = useState<UpdateProfileData>({
        firstName: '',
        lastName: '',
        phoneNumber: '',
        specialization: '',
        hospital: '',
        yearsOfExperience: null,
    });

    // Initialize form with user data when modal opens
    useEffect(() => {
        if (visible && user) {
            setFormData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                phoneNumber: user.phoneNumber || '',
                specialization: user.specialization || '',
                hospital: user.hospital || '',
                yearsOfExperience: user.yearsOfExperience,
            });
        }
    }, [visible, user]);

    const handleSave = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            // Clean up the data - convert empty strings to null
            const cleanedData: UpdateProfileData = {
                firstName: formData.firstName?.trim() || null,
                lastName: formData.lastName?.trim() || null,
                phoneNumber: formData.phoneNumber?.trim() || null,
                specialization: formData.specialization?.trim() || null,
                hospital: formData.hospital?.trim() || null,
                yearsOfExperience: formData.yearsOfExperience,
            };

            await updateProfile(cleanedData);

            // Refetch to ensure UI shows updated data
            await refetch();

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert(
                language === 'tr' ? 'Başarılı' : 'Success',
                Translations.profileUpdated[language]
            );
            onClose();
        } catch (error) {
            console.error('Profile update error:', error);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert(
                Translations.error[language],
                Translations.profileUpdateError[language]
            );
        }
    };

    const handleClose = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onClose();
    };

    const updateField = (field: keyof UpdateProfileData, value: string | number | null) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={handleClose}
        >
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={handleClose}
                        activeOpacity={0.7}
                    >
                        <X size={24} color="#64748B" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>
                        {Translations.editProfileInfo[language]}
                    </Text>
                    <TouchableOpacity
                        style={[styles.saveButton, isUpdatingProfile && styles.saveButtonDisabled]}
                        onPress={handleSave}
                        disabled={isUpdatingProfile}
                        activeOpacity={0.7}
                    >
                        {isUpdatingProfile ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <>
                                <Save size={18} color="#FFFFFF" />
                                <Text style={styles.saveButtonText}>
                                    {Translations.save[language]}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Personal Information Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>
                            👤 {Translations.personalInfo[language]}
                        </Text>
                        <View style={styles.card}>
                            <FormField
                                icon={<User size={18} color="#0891B2" />}
                                label={Translations.firstName[language]}
                                value={formData.firstName as string}
                                onChangeText={(text) => updateField('firstName', text)}
                                placeholder={language === 'tr' ? 'Adınız' : 'Your first name'}
                            />
                            <View style={styles.fieldDivider} />
                            <FormField
                                icon={<User size={18} color="#0891B2" />}
                                label={Translations.lastName[language]}
                                value={formData.lastName as string}
                                onChangeText={(text) => updateField('lastName', text)}
                                placeholder={language === 'tr' ? 'Soyadınız' : 'Your last name'}
                            />
                            <View style={styles.fieldDivider} />
                            <FormField
                                icon={<Phone size={18} color="#0891B2" />}
                                label={Translations.phoneNumber[language]}
                                value={formData.phoneNumber as string}
                                onChangeText={(text) => updateField('phoneNumber', text)}
                                placeholder={language === 'tr' ? '05xx xxx xx xx' : '+1 xxx xxx xxxx'}
                                keyboardType="phone-pad"
                            />
                        </View>
                    </View>

                    {/* Professional Information Section - Only for healthcare professionals */}
                    {isHealthProfessional && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>
                                🏥 {Translations.professionalInfoTitle[language]}
                            </Text>
                            <View style={styles.card}>
                                <FormField
                                    icon={<Award size={18} color="#0891B2" />}
                                    label={Translations.specialization[language]}
                                    value={formData.specialization as string}
                                    onChangeText={(text) => updateField('specialization', text)}
                                    placeholder={language === 'tr' ? 'Örn: Dermatoloji' : 'e.g. Dermatology'}
                                />
                                <View style={styles.fieldDivider} />
                                <FormField
                                    icon={<Building2 size={18} color="#0891B2" />}
                                    label={Translations.hospitalInstitution[language]}
                                    value={formData.hospital as string}
                                    onChangeText={(text) => updateField('hospital', text)}
                                    placeholder={language === 'tr' ? 'Çalıştığınız kurum' : 'Your workplace'}
                                />
                                <View style={styles.fieldDivider} />
                                <FormField
                                    icon={<Calendar size={18} color="#0891B2" />}
                                    label={Translations.yearsOfExperience[language]}
                                    value={formData.yearsOfExperience?.toString() || ''}
                                    onChangeText={(text) => {
                                        const num = parseInt(text, 10);
                                        updateField('yearsOfExperience', isNaN(num) ? null : num);
                                    }}
                                    placeholder={language === 'tr' ? 'Örn: 5' : 'e.g. 5'}
                                    keyboardType="number-pad"
                                />
                            </View>
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </Modal>
    );
}

// Form Field Component
function FormField({
    icon,
    label,
    value,
    onChangeText,
    placeholder,
    keyboardType = 'default',
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    keyboardType?: 'default' | 'phone-pad' | 'number-pad' | 'email-address';
}) {
    return (
        <View style={styles.formField}>
            <View style={styles.formFieldHeader}>
                {icon}
                <Text style={styles.formFieldLabel}>{label}</Text>
            </View>
            <TextInput
                style={styles.textInput}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor="#94A3B8"
                keyboardType={keyboardType}
                autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.xl,
        paddingBottom: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.06)',
        backgroundColor: '#FFFFFF',
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#0F172A',
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0891B2',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        gap: 6,
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: Spacing.lg,
        paddingBottom: 100,
    },
    section: {
        marginBottom: Spacing.xl,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0F172A',
        marginBottom: Spacing.sm,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: Spacing.lg,
    },
    fieldDivider: {
        height: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.06)',
        marginVertical: Spacing.md,
    },
    formField: {
        gap: 8,
    },
    formFieldHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    formFieldLabel: {
        fontSize: 13,
        fontWeight: '500',
        color: '#64748B',
    },
    textInput: {
        fontSize: 16,
        color: '#0F172A',
        fontWeight: '500',
        paddingVertical: 8,
        paddingHorizontal: 0,
        borderWidth: 0,
    },
});
