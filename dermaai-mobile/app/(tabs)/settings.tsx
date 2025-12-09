/**
 * Settings Screen
 * Premium glassmorphism design with AI preferences, notifications, and privacy settings
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    Switch,
    TouchableOpacity,
    Alert,
    ImageBackground,
    SafeAreaView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
    Brain,
    Bell,
    Shield,
    Info,
    ChevronRight,
    Sparkles,
    BellRing,
    Volume2,
    Lock,
    Save,
    FileText,
    Scale,
    Heart,
} from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';
import { Translations } from '@/constants/Translations';
import { useColorScheme } from '@/components/useColorScheme';
import { APP_VERSION } from '@/constants/Config';
import { useLanguage } from '@/contexts/LanguageContext';

interface SettingsState {
    useGemini: boolean;
    useOpenAI: boolean;
    confidenceThreshold: number;
    analysisNotifications: boolean;
    urgentAlerts: boolean;
    soundEnabled: boolean;
    anonymizeData: boolean;
    autoSaveCases: boolean;
}

export default function SettingsScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const router = useRouter();
    const { language } = useLanguage();

    const [settings, setSettings] = useState<SettingsState>({
        useGemini: true,
        useOpenAI: true,
        confidenceThreshold: 50,
        analysisNotifications: true,
        urgentAlerts: true,
        soundEnabled: false,
        anonymizeData: false,
        autoSaveCases: true,
    });

    const updateSetting = <K extends keyof SettingsState>(
        key: K,
        value: SettingsState[K]
    ) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    return (
        <ImageBackground
            source={require('@/assets/images/home-bg.png')}
            style={styles.backgroundImage}
            resizeMode="cover"
        >
            <SafeAreaView style={styles.container}>
                {/* Header Title */}
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>
                        {Translations.settingsTitle[language]}
                    </Text>
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* AI Preferences Section */}
                    <View style={styles.sectionWrapper}>
                        <View style={styles.sectionHeader}>
                            <Brain size={20} color="#0891B2" />
                            <Text style={styles.sectionTitle}>
                                {language === 'tr' ? 'AI Tercihleri' : 'AI Preferences'}
                            </Text>
                        </View>
                        <View style={styles.cardWrapper}>
                            <BlurView intensity={65} tint="light" style={styles.cardBlur}>
                                <View style={styles.card}>
                                    <SettingToggleRow
                                        icon={<Sparkles size={20} color="#8B5CF6" />}
                                        title={language === 'tr' ? 'DermAI Analizi' : 'DermAI Analysis'}
                                        subtitle={language === 'tr' ? 'Yapay zeka destekli tanı analizi' : 'AI-powered diagnosis analysis'}
                                        value={settings.useGemini}
                                        onValueChange={(v) => updateSetting('useGemini', v)}
                                    />
                                    <View style={styles.divider} />
                                    <SettingNavRow
                                        icon={<Brain size={20} color="#0891B2" />}
                                        title={language === 'tr' ? 'Güven Eşiği' : 'Confidence Threshold'}
                                        subtitle={language === 'tr'
                                            ? `Minimum %${settings.confidenceThreshold} güven`
                                            : `Minimum ${settings.confidenceThreshold}% confidence`}
                                        onPress={() => {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                            Alert.alert(
                                                language === 'tr' ? 'Güven Eşiği' : 'Confidence Threshold',
                                                language === 'tr' ? 'Bu özellik yakında eklenecek.' : 'This feature is coming soon.'
                                            );
                                        }}
                                    />
                                </View>
                            </BlurView>
                        </View>
                    </View>

                    {/* Notifications Section */}
                    <View style={styles.sectionWrapper}>
                        <View style={styles.sectionHeader}>
                            <Bell size={20} color="#0891B2" />
                            <Text style={styles.sectionTitle}>
                                {Translations.notifications[language]}
                            </Text>
                        </View>
                        <View style={styles.cardWrapper}>
                            <BlurView intensity={65} tint="light" style={styles.cardBlur}>
                                <View style={styles.card}>
                                    <SettingToggleRow
                                        icon={<BellRing size={20} color="#10B981" />}
                                        title={language === 'tr' ? 'Analiz Bildirimleri' : 'Analysis Notifications'}
                                        subtitle={language === 'tr' ? 'Analiz tamamlandığında bildirim al' : 'Get notified when analysis is complete'}
                                        value={settings.analysisNotifications}
                                        onValueChange={(v) => updateSetting('analysisNotifications', v)}
                                    />
                                    <View style={styles.divider} />
                                    <SettingToggleRow
                                        icon={<Bell size={20} color="#F59E0B" />}
                                        title={language === 'tr' ? 'Acil Uyarılar' : 'Urgent Alerts'}
                                        subtitle={language === 'tr' ? 'Acil durumlar için anlık bildirim' : 'Instant notifications for urgent cases'}
                                        value={settings.urgentAlerts}
                                        onValueChange={(v) => updateSetting('urgentAlerts', v)}
                                    />
                                    <View style={styles.divider} />
                                    <SettingToggleRow
                                        icon={<Volume2 size={20} color="#6366F1" />}
                                        title={language === 'tr' ? 'Ses' : 'Sound'}
                                        subtitle={language === 'tr' ? 'Bildirim sesi aç' : 'Enable notification sound'}
                                        value={settings.soundEnabled}
                                        onValueChange={(v) => updateSetting('soundEnabled', v)}
                                    />
                                </View>
                            </BlurView>
                        </View>
                    </View>

                    {/* Privacy Section */}
                    <View style={styles.sectionWrapper}>
                        <View style={styles.sectionHeader}>
                            <Shield size={20} color="#0891B2" />
                            <Text style={styles.sectionTitle}>
                                {language === 'tr' ? 'Gizlilik' : 'Privacy'}
                            </Text>
                        </View>
                        <View style={styles.cardWrapper}>
                            <BlurView intensity={65} tint="light" style={styles.cardBlur}>
                                <View style={styles.card}>
                                    <SettingToggleRow
                                        icon={<Lock size={20} color="#EF4444" />}
                                        title={language === 'tr' ? 'Veri Anonimleştirme' : 'Data Anonymization'}
                                        subtitle={language === 'tr' ? 'Hasta verilerini anonimleştir' : 'Anonymize patient data'}
                                        value={settings.anonymizeData}
                                        onValueChange={(v) => updateSetting('anonymizeData', v)}
                                    />
                                    <View style={styles.divider} />
                                    <SettingToggleRow
                                        icon={<Save size={20} color="#0891B2" />}
                                        title={language === 'tr' ? 'Otomatik Kaydetme' : 'Auto-Save'}
                                        subtitle={language === 'tr' ? 'Vakaları otomatik kaydet' : 'Auto-save cases'}
                                        value={settings.autoSaveCases}
                                        onValueChange={(v) => updateSetting('autoSaveCases', v)}
                                    />
                                </View>
                            </BlurView>
                        </View>
                    </View>

                    {/* About Section */}
                    <View style={styles.sectionWrapper}>
                        <View style={styles.sectionHeader}>
                            <Info size={20} color="#0891B2" />
                            <Text style={styles.sectionTitle}>
                                {Translations.about[language]}
                            </Text>
                        </View>
                        <View style={styles.cardWrapper}>
                            <BlurView intensity={65} tint="light" style={styles.cardBlur}>
                                <View style={styles.card}>
                                    <SettingInfoRow
                                        icon={<Sparkles size={20} color="#0891B2" />}
                                        title={language === 'tr' ? 'Uygulama Versiyonu' : 'App Version'}
                                        value={`v${APP_VERSION}`}
                                    />
                                    <View style={styles.divider} />
                                    <SettingNavRow
                                        icon={<FileText size={20} color="#0891B2" />}
                                        title={language === 'tr' ? 'Tıbbi Uyarı' : 'Medical Disclaimer'}
                                        onPress={() => {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                            router.push('/medical-disclaimer');
                                        }}
                                    />
                                    <View style={styles.divider} />
                                    <SettingNavRow
                                        icon={<Shield size={20} color="#0891B2" />}
                                        title={Translations.privacyPolicy[language]}
                                        onPress={() => {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                            router.push('/privacy-policy');
                                        }}
                                    />
                                    <View style={styles.divider} />
                                    <SettingNavRow
                                        icon={<Scale size={20} color="#0891B2" />}
                                        title={Translations.termsOfService[language]}
                                        onPress={() => {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                            router.push('/terms-of-service');
                                        }}
                                    />
                                </View>
                            </BlurView>
                        </View>
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <View style={styles.footerLogoContainer}>
                            <Heart size={16} color="#0891B2" />
                        </View>
                        <Text style={styles.footerText}>DermaAssistAI © 2024</Text>
                        <Text style={styles.footerSubtext}>
                            {language === 'tr'
                                ? 'Sağlık profesyonelleri için tasarlanmıştır'
                                : 'Designed for healthcare professionals'}
                        </Text>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </ImageBackground>
    );
}

// Setting toggle row component
function SettingToggleRow({
    icon,
    title,
    subtitle,
    value,
    onValueChange,
}: {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
}) {
    return (
        <View style={styles.settingRow}>
            <View style={styles.settingIconContainer}>
                {icon}
            </View>
            <View style={styles.settingText}>
                <Text style={styles.settingTitle}>{title}</Text>
                {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
            </View>
            <Switch
                value={value}
                onValueChange={onValueChange}
                trackColor={{ false: '#E2E8F0', true: '#0891B2' }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="#E2E8F0"
            />
        </View>
    );
}

// Setting navigation row component
function SettingNavRow({
    icon,
    title,
    subtitle,
    onPress,
}: {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    onPress: () => void;
}) {
    return (
        <TouchableOpacity style={styles.settingRow} onPress={onPress} activeOpacity={0.7}>
            <View style={styles.settingIconContainer}>
                {icon}
            </View>
            <View style={styles.settingText}>
                <Text style={styles.settingTitle}>{title}</Text>
                {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
            </View>
            <ChevronRight size={20} color="#94A3B8" />
        </TouchableOpacity>
    );
}

// Setting info row component
function SettingInfoRow({
    icon,
    title,
    value,
}: {
    icon: React.ReactNode;
    title: string;
    value: string;
}) {
    return (
        <View style={styles.settingRow}>
            <View style={styles.settingIconContainer}>
                {icon}
            </View>
            <View style={styles.settingText}>
                <Text style={styles.settingTitle}>{title}</Text>
            </View>
            <Text style={styles.settingValue}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    backgroundImage: {
        flex: 1,
    },
    container: {
        flex: 1,
    },

    // Header
    headerTitleContainer: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.sm,
        paddingBottom: Spacing.md,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#0F172A',
    },

    // Scroll
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: Spacing.lg,
        paddingBottom: 140,
    },

    // Section
    sectionWrapper: {
        marginBottom: Spacing.xl,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.sm,
        gap: 8,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },

    // Card
    cardWrapper: {
        borderRadius: 18,
        overflow: 'hidden',
        shadowColor: '#0891B2',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 5,
    },
    cardBlur: {
        borderRadius: 18,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    card: {
        padding: Spacing.md,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.06)',
        marginHorizontal: -Spacing.md,
        paddingHorizontal: Spacing.md,
    },

    // Setting Row
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.md,
    },
    settingIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.md,
    },
    settingText: {
        flex: 1,
        marginRight: Spacing.md,
    },
    settingTitle: {
        fontSize: 15,
        fontWeight: '500',
        color: '#0F172A',
    },
    settingSubtitle: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 2,
    },
    settingValue: {
        fontSize: 14,
        fontWeight: '500',
        color: '#64748B',
    },

    // Footer
    footer: {
        alignItems: 'center',
        paddingVertical: Spacing.xl,
    },
    footerLogoContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(8, 145, 178, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.sm,
    },
    footerText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748B',
    },
    footerSubtext: {
        fontSize: 12,
        color: '#94A3B8',
        marginTop: 4,
    },
});
