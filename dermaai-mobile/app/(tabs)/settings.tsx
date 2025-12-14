/**
 * Settings Screen
 * Premium glassmorphism design with notifications, privacy, account management
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
    ImageBackground,
    Platform,
    Linking,
    Modal,
    Pressable,
    ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GlassCard } from '@/components/ui/GlassCard';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
    Bell,
    Shield,
    Info,
    ChevronRight,
    BellRing,
    Volume2,
    Lock,
    FileText,
    Scale,
    Heart,
    Globe,
    LogOut,
    Trash2,
    Mail,
    Star,
    User,
    Check,
    X,
} from 'lucide-react-native';
import { Spacing } from '@/constants/Spacing';
import { Translations } from '@/constants/Translations';
import { APP_VERSION } from '@/constants/Config';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import {
    requestNotificationPermissions,
    checkNotificationPermissions,
    scheduleSkinCheckReminder,
    cancelSkinCheckReminder,
    cancelAllNotifications,
    unregisterPushToken,
} from '@/lib/notifications';

const SETTINGS_STORAGE_KEY = 'corio_settings';

interface SettingsState {
    analysisNotifications: boolean;
    urgentAlerts: boolean;
    soundEnabled: boolean;
    anonymizeData: boolean;
    notificationPermissionGranted: boolean;
}

const defaultSettings: SettingsState = {
    analysisNotifications: true,
    urgentAlerts: true,
    soundEnabled: false,
    anonymizeData: false,
    notificationPermissionGranted: false,
};

export default function SettingsScreen() {
    const router = useRouter();
    const { language, setLanguage } = useLanguage();
    const { logout } = useAuth();
    const insets = useSafeAreaInsets();

    const [settings, setSettings] = useState<SettingsState>(defaultSettings);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);
    const [isCheckingPermission, setIsCheckingPermission] = useState(false);
    const [isDeletingAccount, setIsDeletingAccount] = useState(false);

    // Load settings from AsyncStorage on mount and check notification permission
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const savedSettings = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
                if (savedSettings) {
                    setSettings({ ...defaultSettings, ...JSON.parse(savedSettings) });
                }
                // Check current notification permission status
                const hasPermission = await checkNotificationPermissions();
                setSettings(prev => ({ ...prev, notificationPermissionGranted: hasPermission }));
            } catch (error) {
                console.error('Failed to load settings:', error);
            } finally {
                setIsLoaded(true);
            }
        };
        loadSettings();
    }, []);

    // Save settings to AsyncStorage whenever they change
    useEffect(() => {
        if (isLoaded) {
            const saveSettings = async () => {
                try {
                    await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
                } catch (error) {
                    console.error('Failed to save settings:', error);
                }
            };
            saveSettings();
        }
    }, [settings, isLoaded]);

    const updateSetting = <K extends keyof SettingsState>(
        key: K,
        value: SettingsState[K]
    ) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    // Handle notification toggle with permission request
    const handleNotificationToggle = async (key: 'analysisNotifications' | 'urgentAlerts', value: boolean) => {
        if (value && !settings.notificationPermissionGranted) {
            // Need to request permission first
            setIsCheckingPermission(true);
            const granted = await requestNotificationPermissions();
            setIsCheckingPermission(false);

            if (!granted) {
                Alert.alert(
                    language === 'tr' ? 'Bildirim İzni Gerekli' : 'Notification Permission Required',
                    language === 'tr'
                        ? 'Bildirimleri etkinleştirmek için cihaz ayarlarından izin vermeniz gerekiyor.'
                        : 'You need to grant permission in device settings to enable notifications.',
                    [
                        { text: language === 'tr' ? 'İptal' : 'Cancel', style: 'cancel' },
                        {
                            text: language === 'tr' ? 'Ayarlar' : 'Settings',
                            onPress: () => Linking.openSettings(),
                        },
                    ]
                );
                return;
            }

            setSettings(prev => ({ ...prev, notificationPermissionGranted: true }));
        }

        updateSetting(key, value);

        // If enabling analysis notifications, schedule skin check reminder
        if (key === 'analysisNotifications') {
            if (value) {
                await scheduleSkinCheckReminder(20, 0, language);
            } else {
                await cancelSkinCheckReminder();
            }
        }
    };

    const handleAnonymizeToggle = (value: boolean) => {
        if (value) {
            // Show warning when enabling anonymization
            Alert.alert(
                language === 'tr' ? '⚠️ Dikkat' : '⚠️ Warning',
                language === 'tr'
                    ? 'Bu özelliği açarsanız, yapılan analizler geçmiş taramalarınızda kaydedilmeyecek ve tekrar görüntüleyemeyeceksiniz. Devam etmek istiyor musunuz?'
                    : 'If you enable this feature, your analyses will not be saved to your history and you won\'t be able to view them again. Do you want to continue?',
                [
                    {
                        text: language === 'tr' ? 'İptal' : 'Cancel',
                        style: 'cancel',
                    },
                    {
                        text: language === 'tr' ? 'Evet, Aç' : 'Yes, Enable',
                        style: 'destructive',
                        onPress: () => updateSetting('anonymizeData', true),
                    },
                ]
            );
        } else {
            updateSetting('anonymizeData', false);
        }
    };

    const handleLanguageChange = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setIsLanguageModalVisible(true);
    };

    const selectLanguage = (lang: 'tr' | 'en') => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setLanguage(lang);
        setIsLanguageModalVisible(false);
    };

    const handleLogout = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert(
            language === 'tr' ? 'Çıkış Yap' : 'Logout',
            language === 'tr'
                ? 'Hesabınızdan çıkış yapmak istediğinize emin misiniz?'
                : 'Are you sure you want to logout?',
            [
                { text: language === 'tr' ? 'İptal' : 'Cancel', style: 'cancel' },
                {
                    text: language === 'tr' ? 'Çıkış Yap' : 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        // Unregister push token before logout
                        await unregisterPushToken();
                        await logout();
                        router.replace('/(auth)/login');
                    },
                },
            ]
        );
    };

    const handleDeleteAccount = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert(
            language === 'tr' ? '⚠️ Hesabı Sil' : '⚠️ Delete Account',
            language === 'tr'
                ? 'Bu işlem geri alınamaz! Hesabınız ve tüm verileriniz kalıcı olarak silinecektir. Devam etmek istiyor musunuz?'
                : 'This action cannot be undone! Your account and all your data will be permanently deleted. Do you want to continue?',
            [
                { text: language === 'tr' ? 'İptal' : 'Cancel', style: 'cancel' },
                {
                    text: language === 'tr' ? 'Hesabı Sil' : 'Delete Account',
                    style: 'destructive',
                    onPress: async () => {
                        setIsDeletingAccount(true);
                        try {
                            // Unregister push token before deleting account
                            await unregisterPushToken();

                            // Call the delete account API
                            await api.delete('/api/auth/mobile/delete-account');

                            // Clear local data and logout
                            await logout();

                            // Navigate to login screen
                            router.replace('/(auth)/login');
                        } catch (error) {
                            console.error('Delete account error:', error);
                            Alert.alert(
                                language === 'tr' ? 'Hata' : 'Error',
                                language === 'tr'
                                    ? 'Hesap silinirken bir hata oluştu. Lütfen tekrar deneyin.'
                                    : 'An error occurred while deleting your account. Please try again.'
                            );
                        } finally {
                            setIsDeletingAccount(false);
                        }
                    },
                },
            ]
        );
    };

    const handleContactSupport = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Linking.openURL('mailto:destek@corioscan.com?subject=Corio%20Scan%20Support');
    };

    const handleRateApp = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        // TODO: Replace with actual App Store / Play Store URL
        const storeUrl = Platform.select({
            ios: 'https://apps.apple.com/app/idXXXXXXXXXX',
            android: 'https://play.google.com/store/apps/details?id=com.corio.scan',
        });
        if (storeUrl) {
            Linking.openURL(storeUrl).catch(() => {
                Alert.alert(
                    language === 'tr' ? 'Bilgi' : 'Info',
                    language === 'tr'
                        ? 'Uygulama henüz mağazada yayınlanmadı.'
                        : 'The app is not yet published on the store.'
                );
            });
        }
    };

    return (
        <ImageBackground
            source={require('@/assets/images/home-bg.png')}
            style={styles.backgroundImage}
            resizeMode="cover"
        >
            <View style={[styles.container, { paddingTop: insets.top }]}>
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
                    {/* General Section */}
                    <View style={styles.sectionWrapper}>
                        <View style={styles.sectionHeader}>
                            <Globe size={20} color="#0891B2" />
                            <Text style={styles.sectionTitle}>
                                {language === 'tr' ? 'Genel' : 'General'}
                            </Text>
                        </View>
                        <View style={styles.cardWrapper}>
                            <GlassCard style={styles.cardBlur} innerStyle={styles.card}>
                                <SettingNavRow
                                    icon={<Globe size={20} color="#0891B2" />}
                                    title={language === 'tr' ? 'Dil' : 'Language'}
                                    subtitle={language === 'tr' ? 'Türkçe' : 'English'}
                                    onPress={handleLanguageChange}
                                />
                            </GlassCard>
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
                            <GlassCard style={styles.cardBlur} innerStyle={styles.card}>
                                <SettingToggleRow
                                    icon={<BellRing size={20} color="#10B981" />}
                                    title={language === 'tr' ? 'Analiz Bildirimleri' : 'Analysis Notifications'}
                                    subtitle={language === 'tr' ? 'Analiz tamamlandığında bildirim al' : 'Get notified when analysis is complete'}
                                    value={settings.analysisNotifications}
                                    onValueChange={(v) => handleNotificationToggle('analysisNotifications', v)}
                                    disabled={isCheckingPermission}
                                />
                                <View style={styles.divider} />
                                <SettingToggleRow
                                    icon={<Bell size={20} color="#F59E0B" />}
                                    title={language === 'tr' ? 'Acil Uyarılar' : 'Urgent Alerts'}
                                    subtitle={language === 'tr' ? 'Acil durumlar için anlık bildirim' : 'Instant notifications for urgent cases'}
                                    value={settings.urgentAlerts}
                                    onValueChange={(v) => handleNotificationToggle('urgentAlerts', v)}
                                    disabled={isCheckingPermission}
                                />
                                <View style={styles.divider} />
                                <SettingToggleRow
                                    icon={<Volume2 size={20} color="#6366F1" />}
                                    title={language === 'tr' ? 'Ses' : 'Sound'}
                                    subtitle={language === 'tr' ? 'Bildirim sesi aç' : 'Enable notification sound'}
                                    value={settings.soundEnabled}
                                    onValueChange={(v) => updateSetting('soundEnabled', v)}
                                />
                            </GlassCard>
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
                            <GlassCard style={styles.cardBlur} innerStyle={styles.card}>
                                <SettingToggleRow
                                    icon={<Lock size={20} color="#EF4444" />}
                                    title={language === 'tr' ? 'Veri Anonimleştirme' : 'Data Anonymization'}
                                    subtitle={language === 'tr' ? 'Vakalarınız geçmişe kaydedilmez' : 'Your cases won\'t be saved to history'}
                                    value={settings.anonymizeData}
                                    onValueChange={handleAnonymizeToggle}
                                />
                            </GlassCard>
                        </View>
                    </View>

                    {/* Support Section */}
                    <View style={styles.sectionWrapper}>
                        <View style={styles.sectionHeader}>
                            <Mail size={20} color="#0891B2" />
                            <Text style={styles.sectionTitle}>
                                {language === 'tr' ? 'Destek' : 'Support'}
                            </Text>
                        </View>
                        <View style={styles.cardWrapper}>
                            <GlassCard style={styles.cardBlur} innerStyle={styles.card}>
                                <SettingNavRow
                                    icon={<Mail size={20} color="#0891B2" />}
                                    title={language === 'tr' ? 'İletişim' : 'Contact Us'}
                                    subtitle="destek@corioscan.com"
                                    onPress={handleContactSupport}
                                />
                                <View style={styles.divider} />
                                <SettingNavRow
                                    icon={<Star size={20} color="#F59E0B" />}
                                    title={language === 'tr' ? 'Uygulamayı Değerlendir' : 'Rate the App'}
                                    subtitle={language === 'tr' ? 'Görüşleriniz bizim için önemli' : 'Your feedback matters'}
                                    onPress={handleRateApp}
                                />
                            </GlassCard>
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
                            <GlassCard style={styles.cardBlur} innerStyle={styles.card}>
                                <SettingInfoRow
                                    icon={<Info size={20} color="#0891B2" />}
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
                            </GlassCard>
                        </View>
                    </View>

                    {/* Account Section */}
                    <View style={styles.sectionWrapper}>
                        <View style={styles.sectionHeader}>
                            <User size={20} color="#0891B2" />
                            <Text style={styles.sectionTitle}>
                                {language === 'tr' ? 'Hesap' : 'Account'}
                            </Text>
                        </View>
                        <View style={styles.cardWrapper}>
                            <GlassCard style={styles.cardBlur} innerStyle={styles.card}>
                                <SettingActionRow
                                    icon={<LogOut size={20} color="#F59E0B" />}
                                    title={language === 'tr' ? 'Çıkış Yap' : 'Logout'}
                                    titleColor="#F59E0B"
                                    onPress={handleLogout}
                                />
                                <View style={styles.divider} />
                                <SettingActionRow
                                    icon={<Trash2 size={20} color="#EF4444" />}
                                    title={language === 'tr' ? 'Hesabı Sil' : 'Delete Account'}
                                    titleColor="#EF4444"
                                    onPress={handleDeleteAccount}
                                />
                            </GlassCard>
                        </View>
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <View style={styles.footerLogoContainer}>
                            <Heart size={16} color="#0891B2" />
                        </View>
                        <Text style={styles.footerText}>Corio Scan © 2025</Text>
                    </View>
                </ScrollView>
            </View>

            {/* Language Selection Modal */}
            <Modal
                visible={isLanguageModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsLanguageModalVisible(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setIsLanguageModalVisible(false)}
                >
                    <Pressable style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
                        <BlurView intensity={80} tint="light" style={styles.modalBlur}>
                            <View style={styles.modalContent}>
                                {/* Modal Header */}
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>
                                        {language === 'tr' ? 'Dil Seçimi' : 'Language Selection'}
                                    </Text>
                                    <Text style={styles.modalSubtitle}>
                                        {language === 'tr' ? 'Uygulama dilini seçin' : 'Select app language'}
                                    </Text>
                                </View>

                                {/* Language Options */}
                                <View style={styles.languageOptions}>
                                    {/* Turkish Option */}
                                    <TouchableOpacity
                                        style={[
                                            styles.languageOption,
                                            language === 'tr' && styles.languageOptionSelected,
                                        ]}
                                        onPress={() => selectLanguage('tr')}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={styles.languageFlag}>🇹🇷</Text>
                                        <Text style={[
                                            styles.languageText,
                                            language === 'tr' && styles.languageTextSelected,
                                        ]}>Türkçe</Text>
                                        {language === 'tr' && (
                                            <View style={styles.checkIcon}>
                                                <Check size={18} color="#FFFFFF" />
                                            </View>
                                        )}
                                    </TouchableOpacity>

                                    {/* English Option */}
                                    <TouchableOpacity
                                        style={[
                                            styles.languageOption,
                                            language === 'en' && styles.languageOptionSelected,
                                        ]}
                                        onPress={() => selectLanguage('en')}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={styles.languageFlag}>🇬🇧</Text>
                                        <Text style={[
                                            styles.languageText,
                                            language === 'en' && styles.languageTextSelected,
                                        ]}>English</Text>
                                        {language === 'en' && (
                                            <View style={styles.checkIcon}>
                                                <Check size={18} color="#FFFFFF" />
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                </View>

                                {/* Cancel Button */}
                                <TouchableOpacity
                                    style={styles.cancelButton}
                                    onPress={() => setIsLanguageModalVisible(false)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.cancelButtonText}>
                                        {language === 'tr' ? 'İptal' : 'Cancel'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </BlurView>
                    </Pressable>
                </Pressable>
            </Modal>
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
    disabled = false,
}: {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
    disabled?: boolean;
}) {
    return (
        <View style={[styles.settingRow, disabled && { opacity: 0.5 }]}>
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
                disabled={disabled}
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

// Setting action row component (for logout, delete account, etc.)
function SettingActionRow({
    icon,
    title,
    titleColor,
    onPress,
}: {
    icon: React.ReactNode;
    title: string;
    titleColor?: string;
    onPress: () => void;
}) {
    return (
        <TouchableOpacity style={styles.settingRow} onPress={onPress} activeOpacity={0.7}>
            <View style={styles.settingIconContainer}>
                {icon}
            </View>
            <View style={styles.settingText}>
                <Text style={[styles.settingTitle, titleColor ? { color: titleColor } : null]}>{title}</Text>
            </View>
            <ChevronRight size={20} color="#94A3B8" />
        </TouchableOpacity>
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
    },
    cardBlur: {
        borderRadius: 18,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    card: {
        padding: Spacing.md,
        backgroundColor: Platform.select({
            android: 'transparent',
            ios: 'rgba(255, 255, 255, 0.2)',
        }),
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
        backgroundColor: Platform.select({
            android: 'transparent',
            ios: 'rgba(255, 255, 255, 0.5)',
        }),
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

    // Language Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.lg,
    },
    modalContainer: {
        width: '100%',
        maxWidth: 340,
        borderRadius: 24,
        overflow: 'hidden',
    },
    modalBlur: {
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.6)',
    },
    modalContent: {
        padding: Spacing.xl,
        backgroundColor: Platform.select({
            android: 'rgba(255, 255, 255, 0.95)',
            ios: 'rgba(255, 255, 255, 0.3)',
        }),
    },
    modalHeader: {
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 4,
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#64748B',
    },
    languageOptions: {
        gap: 12,
        marginBottom: Spacing.lg,
    },
    languageOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: 16,
        backgroundColor: Platform.select({
            android: 'rgba(255, 255, 255, 0.8)',
            ios: 'rgba(255, 255, 255, 0.5)',
        }),
        borderWidth: 2,
        borderColor: 'transparent',
    },
    languageOptionSelected: {
        borderColor: '#0891B2',
        backgroundColor: Platform.select({
            android: 'rgba(8, 145, 178, 0.1)',
            ios: 'rgba(8, 145, 178, 0.15)',
        }),
    },
    languageFlag: {
        fontSize: 28,
        marginRight: Spacing.md,
    },
    languageText: {
        flex: 1,
        fontSize: 17,
        fontWeight: '600',
        color: '#0F172A',
    },
    languageTextSelected: {
        color: '#0891B2',
    },
    checkIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#0891B2',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        alignItems: 'center',
        paddingVertical: Spacing.md,
        borderRadius: 14,
        backgroundColor: Platform.select({
            android: 'rgba(0, 0, 0, 0.05)',
            ios: 'rgba(0, 0, 0, 0.05)',
        }),
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#64748B',
    },
});
