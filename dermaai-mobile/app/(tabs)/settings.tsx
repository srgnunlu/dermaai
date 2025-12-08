/**
 * Settings Screen
 * AI preferences, notifications, appearance, and privacy settings
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    Switch,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
    Brain,
    Bell,
    Palette,
    Shield,
    Info,
    ChevronRight,
    Sun,
    Moon,
    Smartphone,
} from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';
import { useColorScheme } from '@/components/useColorScheme';
import { Card, CardHeader, CardContent } from '@/components/ui';
import { APP_VERSION } from '@/constants/Config';

interface SettingsState {
    // AI Preferences
    useGemini: boolean;
    useOpenAI: boolean;
    confidenceThreshold: number;

    // Notifications
    analysisNotifications: boolean;
    urgentAlerts: boolean;
    soundEnabled: boolean;

    // Appearance
    theme: 'light' | 'dark' | 'system';

    // Privacy
    anonymizeData: boolean;
    autoSaveCases: boolean;
}

export default function SettingsScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const router = useRouter();

    const [settings, setSettings] = useState<SettingsState>({
        useGemini: true,
        useOpenAI: true,
        confidenceThreshold: 50,
        analysisNotifications: true,
        urgentAlerts: true,
        soundEnabled: false,
        theme: 'system',
        anonymizeData: false,
        autoSaveCases: true,
    });

    const updateSetting = <K extends keyof SettingsState>(
        key: K,
        value: SettingsState[K]
    ) => {
        setSettings(prev => ({ ...prev, [key]: value }));
        // TODO: Save to backend/storage
    };

    const renderSwitch = (
        value: boolean,
        onValueChange: (value: boolean) => void
    ) => (
        <Switch
            value={value}
            onValueChange={onValueChange}
            trackColor={{ false: colors.muted, true: colors.primary }}
            thumbColor={value ? colors.primaryForeground : colors.textMuted}
        />
    );

    const renderChevron = () => (
        <ChevronRight size={20} color={colors.textMuted} />
    );

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: colors.background }]}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            {/* AI Preferences Section */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Brain size={20} color={colors.primary} />
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        AI Tercihleri
                    </Text>
                </View>

                <Card>
                    <CardContent>
                        <SettingRow
                            title="DermAI Analizi"
                            subtitle="Yapay zeka destekli tanı analizi"
                            colors={colors}
                            right={renderSwitch(
                                settings.useGemini,
                                (v) => updateSetting('useGemini', v)
                            )}
                        />
                        <SettingRow
                            title="Güven Eşiği"
                            subtitle={`Minimum %${settings.confidenceThreshold} güven`}
                            colors={colors}
                            right={renderChevron()}
                            onPress={() => {
                                // TODO: Show confidence threshold picker
                                Alert.alert('Güven Eşiği', 'Bu özellik yakında eklenecek.');
                            }}
                            isLast
                        />
                    </CardContent>
                </Card>
            </View>

            {/* Notifications Section */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Bell size={20} color={colors.primary} />
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        Bildirimler
                    </Text>
                </View>

                <Card>
                    <CardContent>
                        <SettingRow
                            title="Analiz Bildirimleri"
                            subtitle="Analiz tamamlandığında bildirim al"
                            colors={colors}
                            right={renderSwitch(
                                settings.analysisNotifications,
                                (v) => updateSetting('analysisNotifications', v)
                            )}
                        />
                        <SettingRow
                            title="Acil Uyarılar"
                            subtitle="Acil durumlar için anlık bildirim"
                            colors={colors}
                            right={renderSwitch(
                                settings.urgentAlerts,
                                (v) => updateSetting('urgentAlerts', v)
                            )}
                        />
                        <SettingRow
                            title="Ses"
                            subtitle="Bildirim sesi aç"
                            colors={colors}
                            right={renderSwitch(
                                settings.soundEnabled,
                                (v) => updateSetting('soundEnabled', v)
                            )}
                            isLast
                        />
                    </CardContent>
                </Card>
            </View>

            {/* Appearance Section */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Palette size={20} color={colors.primary} />
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        Görünüm
                    </Text>
                </View>

                <Card>
                    <CardContent>
                        <ThemeSelector
                            value={settings.theme}
                            onChange={(v) => updateSetting('theme', v)}
                            colors={colors}
                        />
                    </CardContent>
                </Card>
            </View>

            {/* Privacy Section */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Shield size={20} color={colors.primary} />
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        Gizlilik
                    </Text>
                </View>

                <Card>
                    <CardContent>
                        <SettingRow
                            title="Veri Anonimleştirme"
                            subtitle="Hasta verilerini anonimleştir"
                            colors={colors}
                            right={renderSwitch(
                                settings.anonymizeData,
                                (v) => updateSetting('anonymizeData', v)
                            )}
                        />
                        <SettingRow
                            title="Otomatik Kaydetme"
                            subtitle="Vakaları otomatik kaydet"
                            colors={colors}
                            right={renderSwitch(
                                settings.autoSaveCases,
                                (v) => updateSetting('autoSaveCases', v)
                            )}
                            isLast
                        />
                    </CardContent>
                </Card>
            </View>

            {/* About Section */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Info size={20} color={colors.primary} />
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        Hakkında
                    </Text>
                </View>

                <Card>
                    <CardContent>
                        <SettingRow
                            title="Uygulama Versiyonu"
                            subtitle={`v${APP_VERSION}`}
                            colors={colors}
                        />
                        <SettingRow
                            title="Tıbbi Uyarı"
                            colors={colors}
                            right={renderChevron()}
                            onPress={() => router.push('/medical-disclaimer')}
                        />
                        <SettingRow
                            title="Gizlilik Politikası"
                            colors={colors}
                            right={renderChevron()}
                            onPress={() => router.push('/privacy-policy')}
                        />
                        <SettingRow
                            title="Kullanım Şartları"
                            colors={colors}
                            right={renderChevron()}
                            onPress={() => router.push('/terms-of-service')}
                            isLast
                        />
                    </CardContent>
                </Card>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <Text style={[styles.footerText, { color: colors.textMuted }]}>
                    DermaAssistAI © 2024
                </Text>
                <Text style={[styles.footerSubtext, { color: colors.textMuted }]}>
                    Sağlık profesyonelleri için tasarlanmıştır
                </Text>
            </View>
        </ScrollView>
    );
}

// Setting row component
function SettingRow({
    title,
    subtitle,
    colors,
    right,
    onPress,
    isLast = false,
}: {
    title: string;
    subtitle?: string;
    colors: typeof Colors.light;
    right?: React.ReactNode;
    onPress?: () => void;
    isLast?: boolean;
}) {
    const content = (
        <View
            style={[
                styles.settingRow,
                !isLast && { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
            ]}
        >
            <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
                {subtitle && (
                    <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                        {subtitle}
                    </Text>
                )}
            </View>
            {right && <View style={styles.settingRight}>{right}</View>}
        </View>
    );

    if (onPress) {
        return (
            <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
                {content}
            </TouchableOpacity>
        );
    }

    return content;
}

// Theme selector component
function ThemeSelector({
    value,
    onChange,
    colors,
}: {
    value: 'light' | 'dark' | 'system';
    onChange: (value: 'light' | 'dark' | 'system') => void;
    colors: typeof Colors.light;
}) {
    const options: { key: 'light' | 'dark' | 'system'; label: string; Icon: any }[] = [
        { key: 'light', label: 'Açık', Icon: Sun },
        { key: 'dark', label: 'Koyu', Icon: Moon },
        { key: 'system', label: 'Sistem', Icon: Smartphone },
    ];

    return (
        <View style={styles.themeSelector}>
            {options.map((option) => (
                <TouchableOpacity
                    key={option.key}
                    style={[
                        styles.themeOption,
                        {
                            backgroundColor: value === option.key ? colors.primaryLight : colors.background,
                            borderColor: value === option.key ? colors.primary : colors.border,
                        },
                    ]}
                    onPress={() => onChange(option.key)}
                    activeOpacity={0.7}
                >
                    <option.Icon
                        size={20}
                        color={value === option.key ? colors.primary : colors.textSecondary}
                    />
                    <Text
                        style={[
                            styles.themeLabel,
                            { color: value === option.key ? colors.primary : colors.text },
                        ]}
                    >
                        {option.label}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: Spacing.base,
        paddingBottom: Spacing['4xl'],
    },
    section: {
        marginBottom: Spacing.xl,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.md,
        paddingHorizontal: Spacing.xs,
    },
    sectionTitle: {
        ...Typography.styles.label,
        marginLeft: Spacing.sm,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: Spacing.md,
    },
    settingText: {
        flex: 1,
        marginRight: Spacing.md,
    },
    settingTitle: {
        ...Typography.styles.body,
        fontWeight: '500',
    },
    settingSubtitle: {
        ...Typography.styles.caption,
        marginTop: 2,
    },
    settingRight: {},
    themeSelector: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    themeOption: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: Spacing.md,
        borderRadius: Spacing.radius.md,
        borderWidth: 1.5,
    },
    themeLabel: {
        ...Typography.styles.caption,
        fontWeight: '500',
        marginTop: Spacing.xs,
    },
    footer: {
        alignItems: 'center',
        paddingVertical: Spacing.xl,
    },
    footerText: {
        ...Typography.styles.caption,
        fontWeight: '500',
    },
    footerSubtext: {
        ...Typography.styles.caption,
        marginTop: Spacing.xs,
    },
});
