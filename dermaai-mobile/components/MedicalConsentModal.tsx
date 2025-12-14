/**
 * MedicalConsentModal Component
 * First-time user consent modal for medical disclaimer
 * Users must acknowledge that the app is not a medical diagnostic tool
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    Modal,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Platform,
    Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { AlertTriangle, Check, Shield, Square, CheckSquare } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';
import { useColorScheme } from '@/components/useColorScheme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type Language = 'tr' | 'en';

interface MedicalConsentModalProps {
    visible: boolean;
    onAccept: () => void;
    language: Language;
}

// Translations for the medical consent modal
const T = {
    title: {
        tr: 'Önemli Tıbbi Uyarı',
        en: 'Important Medical Notice',
    },
    subtitle: {
        tr: 'Devam etmeden önce lütfen aşağıdaki bilgileri dikkatlice okuyun.',
        en: 'Please read the following information carefully before proceeding.',
    },
    section1Title: {
        tr: '🚫 Bu Uygulama Ne DEĞİLDİR',
        en: '🚫 What This App is NOT',
    },
    section1Content: {
        tr: `• Tıbbi bir cihaz değildir
• FDA, CE veya TİTCK onaylı değildir
• Tıbbi tanı koymaz veya tedavi önermez
• Bir dermatoloğun veya sağlık profesyonelinin yerini almaz
• Acil durumlar için kullanılamaz`,
        en: `• It is NOT a medical device
• It is NOT FDA, CE, or TİTCK approved
• It does NOT provide medical diagnosis or treatment recommendations
• It does NOT replace a dermatologist or healthcare professional
• It should NOT be used for emergencies`,
    },
    section2Title: {
        tr: '✅ Bu Uygulama Ne İçindir',
        en: '✅ What This App IS For',
    },
    section2Content: {
        tr: `• Cilt değişiklikleri hakkında farkındalık aracı
• Yapay zeka destekli ön değerlendirme
• Profesyonel konsültasyon öncesi bilgilendirme
• Cilt sağlığı takibi ve kayıt`,
        en: `• Skin change awareness tool
• AI-assisted preliminary assessment
• Information before professional consultation
• Skin health tracking and recording`,
    },
    section3Title: {
        tr: '⚠️ Önemli Sorumluluk Uyarısı',
        en: '⚠️ Important Responsibility Notice',
    },
    section3Content: {
        tr: `• Analiz sonuçları %100 doğru olmayabilir
• Tüm kararların sorumluluğu size aittir
• "Endişelenecek bir şey yok" sonucu bile garanti değildir
• Her zaman bir dermatoloğa danışmanız önerilir`,
        en: `• Analysis results may not be 100% accurate
• All decisions are your responsibility
• Even "nothing to worry about" results are not guaranteed
• Consulting a dermatologist is always recommended`,
    },
    emergencyTitle: {
        tr: '🚨 Acil Durumlar İçin',
        en: '🚨 For Emergencies',
    },
    emergencyContent: {
        tr: 'Acil bir sağlık sorunu yaşıyorsanız, bu uygulamayı kullanmayın. Derhal 112\'yi arayın veya en yakın acil servise gidin.',
        en: 'If you are experiencing a health emergency, do not use this app. Call emergency services immediately or go to the nearest emergency room.',
    },
    checkboxText: {
        tr: 'Yukarıdaki bilgileri okudum ve anladım. Bu uygulamanın tıbbi bir araç olmadığını, tanı koymadığını ve profesyonel tıbbi tavsiye yerine geçmediğini kabul ediyorum.',
        en: 'I have read and understood the above information. I acknowledge that this app is not a medical tool, does not provide diagnosis, and does not replace professional medical advice.',
    },
    acceptButton: {
        tr: 'Kabul Ediyorum ve Devam Et',
        en: 'I Accept and Continue',
    },
    mustAccept: {
        tr: 'Devam etmek için lütfen onay kutusunu işaretleyin',
        en: 'Please check the box to continue',
    },
};

export function MedicalConsentModal({ visible, onAccept, language }: MedicalConsentModalProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const [isChecked, setIsChecked] = useState(false);

    const handleAccept = () => {
        if (isChecked) {
            onAccept();
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={true}
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
                    {/* Header */}
                    <View style={styles.headerWrapper}>
                        {Platform.OS === 'ios' ? (
                            <BlurView intensity={80} tint="light" style={styles.headerBlur}>
                                <View style={styles.headerContent}>
                                    <View style={styles.headerIconContainer}>
                                        <LinearGradient
                                            colors={['#DC2626', '#EF4444']}
                                            style={styles.headerIcon}
                                        >
                                            <AlertTriangle size={28} color="#FFFFFF" />
                                        </LinearGradient>
                                    </View>
                                    <View style={styles.headerTextContainer}>
                                        <Text style={[styles.headerTitle, { color: colors.text }]}>
                                            {T.title[language]}
                                        </Text>
                                        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                                            {T.subtitle[language]}
                                        </Text>
                                    </View>
                                </View>
                            </BlurView>
                        ) : (
                            <View style={[styles.headerAndroid, { backgroundColor: colors.secondary }]}>
                                <View style={styles.headerContent}>
                                    <View style={styles.headerIconContainer}>
                                        <LinearGradient
                                            colors={['#DC2626', '#EF4444']}
                                            style={styles.headerIcon}
                                        >
                                            <AlertTriangle size={28} color="#FFFFFF" />
                                        </LinearGradient>
                                    </View>
                                    <View style={styles.headerTextContainer}>
                                        <Text style={[styles.headerTitle, { color: colors.text }]}>
                                            {T.title[language]}
                                        </Text>
                                        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                                            {T.subtitle[language]}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Content */}
                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Section 1 - What app is NOT */}
                        <View style={[styles.section, styles.warningSection, { backgroundColor: '#FEE2E2' }]}>
                            <Text style={[styles.sectionTitle, { color: '#991B1B' }]}>
                                {T.section1Title[language]}
                            </Text>
                            <Text style={[styles.sectionContent, { color: '#7F1D1D' }]}>
                                {T.section1Content[language]}
                            </Text>
                        </View>

                        {/* Section 2 - What app IS */}
                        <View style={[styles.section, styles.infoSection, { backgroundColor: '#DCFCE7' }]}>
                            <Text style={[styles.sectionTitle, { color: '#166534' }]}>
                                {T.section2Title[language]}
                            </Text>
                            <Text style={[styles.sectionContent, { color: '#14532D' }]}>
                                {T.section2Content[language]}
                            </Text>
                        </View>

                        {/* Section 3 - Responsibility */}
                        <View style={[styles.section, styles.cautionSection, { backgroundColor: '#FEF3C7' }]}>
                            <Text style={[styles.sectionTitle, { color: '#92400E' }]}>
                                {T.section3Title[language]}
                            </Text>
                            <Text style={[styles.sectionContent, { color: '#78350F' }]}>
                                {T.section3Content[language]}
                            </Text>
                        </View>

                        {/* Emergency Section */}
                        <View style={[styles.emergencySection, { backgroundColor: '#1E40AF' }]}>
                            <Text style={styles.emergencyTitle}>
                                {T.emergencyTitle[language]}
                            </Text>
                            <Text style={styles.emergencyContent}>
                                {T.emergencyContent[language]}
                            </Text>
                        </View>
                    </ScrollView>

                    {/* Footer with checkbox and button */}
                    <View style={[styles.footer, { borderTopColor: colors.border }]}>
                        {/* Checkbox */}
                        <TouchableOpacity
                            style={styles.checkboxContainer}
                            onPress={() => setIsChecked(!isChecked)}
                            activeOpacity={0.7}
                        >
                            <View style={[
                                styles.checkbox,
                                { borderColor: isChecked ? colors.primary : colors.border }
                            ]}>
                                {isChecked ? (
                                    <CheckSquare size={24} color={colors.primary} />
                                ) : (
                                    <Square size={24} color={colors.textSecondary} />
                                )}
                            </View>
                            <Text style={[styles.checkboxText, { color: colors.text }]}>
                                {T.checkboxText[language]}
                            </Text>
                        </TouchableOpacity>

                        {/* Accept Button */}
                        <TouchableOpacity
                            style={[
                                styles.acceptButton,
                                !isChecked && styles.acceptButtonDisabled,
                            ]}
                            onPress={handleAccept}
                            disabled={!isChecked}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={isChecked ? ['#0E7490', '#0891B2', '#06B6D4'] : ['#9CA3AF', '#9CA3AF']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.acceptButtonGradient}
                            >
                                {isChecked && <Check size={20} color="#FFFFFF" />}
                                <Text style={styles.acceptButtonText}>
                                    {T.acceptButton[language]}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        {!isChecked && (
                            <Text style={[styles.mustAcceptText, { color: colors.textSecondary }]}>
                                {T.mustAccept[language]}
                            </Text>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '92%',
        maxHeight: SCREEN_HEIGHT * 0.85,
        borderRadius: 24,
        overflow: 'hidden',
        flexDirection: 'column',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.3,
                shadowRadius: 20,
            },
            android: {
                elevation: 10,
            },
        }),
    },
    headerWrapper: {
        width: '100%',
    },
    headerBlur: {
        width: '100%',
        padding: Spacing.lg,
        paddingTop: Spacing.xl,
    },
    headerAndroid: {
        width: '100%',
        padding: Spacing.lg,
        paddingTop: Spacing.xl,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.md,
    },
    headerIconContainer: {
        marginTop: 4,
    },
    headerIcon: {
        width: 52,
        height: 52,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTextContainer: {
        flex: 1,
    },
    headerTitle: {
        ...Typography.styles.h3,
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 4,
    },
    headerSubtitle: {
        ...Typography.styles.caption,
        fontSize: 14,
        lineHeight: 20,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        gap: Spacing.md,
    },
    section: {
        borderRadius: 16,
        padding: Spacing.md,
    },
    warningSection: {},
    infoSection: {},
    cautionSection: {},
    sectionTitle: {
        ...Typography.styles.h4,
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    sectionContent: {
        ...Typography.styles.body,
        fontSize: 14,
        lineHeight: 22,
    },
    emergencySection: {
        borderRadius: 16,
        padding: Spacing.md,
        marginTop: Spacing.xs,
    },
    emergencyTitle: {
        ...Typography.styles.h4,
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    emergencyContent: {
        ...Typography.styles.body,
        fontSize: 14,
        lineHeight: 22,
        color: '#E0E7FF',
    },
    footer: {
        padding: Spacing.lg,
        borderTopWidth: 1,
        gap: Spacing.md,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.sm,
    },
    checkbox: {
        marginTop: 2,
    },
    checkboxText: {
        flex: 1,
        ...Typography.styles.body,
        fontSize: 13,
        lineHeight: 20,
    },
    acceptButton: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    acceptButtonDisabled: {
        opacity: 0.8,
    },
    acceptButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        gap: 8,
    },
    acceptButtonText: {
        ...Typography.styles.button,
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    mustAcceptText: {
        ...Typography.styles.caption,
        fontSize: 12,
        textAlign: 'center',
    },
});
