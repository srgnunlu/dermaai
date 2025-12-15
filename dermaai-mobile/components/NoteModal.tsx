/**
 * NoteModal Component
 * Modal for adding/editing notes on cases (Pro feature)
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { X, Save, Trash2 } from 'lucide-react-native';
import { Spacing } from '@/constants/Spacing';
import { Translations } from '@/constants/Translations';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface NoteModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (notes: string | null) => void;
    initialNotes: string | null;
    language: 'tr' | 'en';
    isLoading?: boolean;
}

export function NoteModal({
    visible,
    onClose,
    onSave,
    initialNotes,
    language,
    isLoading = false,
}: NoteModalProps) {
    const [notes, setNotes] = useState(initialNotes || '');

    useEffect(() => {
        if (visible) {
            setNotes(initialNotes || '');
        }
    }, [visible, initialNotes]);

    const handleSave = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onSave(notes.trim() || null);
    };

    const handleDelete = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onSave(null);
    };

    const handleClose = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={handleClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.modalOverlay}
            >
                <View style={styles.modalContainer}>
                    <BlurView intensity={90} tint="light" style={styles.modalBlur}>
                        <View style={styles.modalContent}>
                            {/* Header */}
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>
                                    {Translations.caseNotes[language]}
                                </Text>
                                <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                                    <X size={22} color="#64748B" />
                                </TouchableOpacity>
                            </View>

                            {/* Text Input */}
                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={styles.textInput}
                                    multiline
                                    numberOfLines={6}
                                    placeholder={Translations.notePlaceholder[language]}
                                    placeholderTextColor="#94A3B8"
                                    value={notes}
                                    onChangeText={setNotes}
                                    textAlignVertical="top"
                                    editable={!isLoading}
                                />
                            </View>

                            {/* Actions */}
                            <View style={styles.modalActions}>
                                {initialNotes && (
                                    <TouchableOpacity
                                        style={styles.deleteButton}
                                        onPress={handleDelete}
                                        activeOpacity={0.7}
                                        disabled={isLoading}
                                    >
                                        <Trash2 size={18} color="#EF4444" />
                                        <Text style={styles.deleteButtonText}>
                                            {Translations.deleteNote[language]}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity
                                    style={[
                                        styles.saveButton,
                                        !initialNotes && styles.saveButtonFull,
                                        isLoading && styles.buttonDisabled,
                                    ]}
                                    onPress={handleSave}
                                    activeOpacity={0.7}
                                    disabled={isLoading}
                                >
                                    <Save size={18} color="#FFFFFF" />
                                    <Text style={styles.saveButtonText}>
                                        {Translations.save[language]}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </BlurView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        overflow: 'hidden',
        maxHeight: '70%',
    },
    modalBlur: {
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        overflow: 'hidden',
    },
    modalContent: {
        padding: Spacing.xl,
        paddingBottom: Spacing['3xl'],
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#0F172A',
    },
    closeButton: {
        padding: 4,
    },
    inputContainer: {
        marginBottom: Spacing.lg,
    },
    textInput: {
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.08)',
        borderRadius: 16,
        padding: Spacing.md,
        fontSize: 15,
        color: '#0F172A',
        minHeight: 120,
        maxHeight: 200,
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
    },
    deleteButton: {
        flex: 1,
        flexDirection: 'row',
        padding: Spacing.md,
        borderRadius: 14,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
    },
    deleteButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#EF4444',
    },
    saveButton: {
        flex: 2,
        flexDirection: 'row',
        padding: Spacing.md,
        borderRadius: 14,
        backgroundColor: '#0891B2',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    saveButtonFull: {
        flex: 1,
    },
    saveButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    buttonDisabled: {
        opacity: 0.5,
    },
});
