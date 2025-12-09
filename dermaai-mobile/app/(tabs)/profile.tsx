/**
 * Profile Screen
 * Premium glassmorphism design with user profile and statistics
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Image,
    Alert,
    ImageBackground,
    SafeAreaView,
    ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import {
    User,
    Mail,
    Building2,
    Award,
    Calendar,
    LogOut,
    Edit2,
    ChevronRight,
    Shield,
    HelpCircle,
    Activity,
    TrendingUp,
    FileCheck,
    Camera,
} from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';
import { Translations } from '@/constants/Translations';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/hooks/useAuth';
import { useCases } from '@/hooks/useCases';
import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/lib/api';
import {
    LoadingSpinner,
    EmptyState,
} from '@/components/ui';
import EditProfileModal from '@/components/EditProfileModal';

export default function ProfileScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const router = useRouter();

    const { user, isLoading: authLoading, logout, updateProfile, isUpdatingProfile, refetch } = useAuth();
    const { cases } = useCases();
    const { language } = useLanguage();

    // State for edit modal and photo upload
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

    const handleLogout = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert(
            Translations.logout[language],
            language === 'tr'
                ? 'Hesabınızdan çıkış yapmak istediğinize emin misiniz?'
                : 'Are you sure you want to logout?',
            [
                { text: Translations.cancel[language], style: 'cancel' },
                {
                    text: Translations.logout[language],
                    style: 'destructive',
                    onPress: async () => {
                        await logout();
                        router.replace('/(auth)/login');
                    },
                },
            ]
        );
    };

    const handleEditProfile = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setIsEditModalVisible(true);
    };

    const handleAvatarPress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Alert.alert(
            Translations.profilePhoto[language],
            Translations.choosePhotoSource[language],
            [
                {
                    text: Translations.gallery[language],
                    onPress: pickFromGallery,
                },
                {
                    text: Translations.camera[language],
                    onPress: takePhoto,
                },
                {
                    text: Translations.cancel[language],
                    style: 'cancel',
                },
            ]
        );
    };

    const pickFromGallery = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(
                Translations.error[language],
                Translations.galleryPermissionRequired[language]
            );
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
            base64: true,
        });

        if (!result.canceled && result.assets[0].base64) {
            await uploadProfilePhoto(result.assets[0].base64);
        }
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(
                Translations.error[language],
                Translations.cameraPermissionRequired[language]
            );
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
            base64: true,
        });

        if (!result.canceled && result.assets[0].base64) {
            await uploadProfilePhoto(result.assets[0].base64);
        }
    };

    const uploadProfilePhoto = async (base64Data: string) => {
        setIsUploadingPhoto(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            // Upload image to server
            console.log('[Profile] Uploading image...');
            const uploadResult = await api.uploadImage(base64Data, `profile-${user?.id}-${Date.now()}.jpg`);
            console.log('[Profile] Image uploaded, URL:', uploadResult.url);

            // Update profile with new photo URL
            console.log('[Profile] Updating profile with new photo URL...');
            await updateProfile({ profileImageUrl: uploadResult.url });
            console.log('[Profile] Profile updated');

            // Refetch user data to ensure UI updates
            console.log('[Profile] Refetching user data...');
            await refetch();
            console.log('[Profile] User refetched, new profileImageUrl:', user?.profileImageUrl);

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert(
                language === 'tr' ? 'Başarılı' : 'Success',
                Translations.photoUpdated[language]
            );
        } catch (error) {
            console.error('Photo upload error:', error);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert(
                Translations.error[language],
                Translations.photoUpdateError[language]
            );
        } finally {
            setIsUploadingPhoto(false);
        }
    };

    if (authLoading) {
        return (
            <ImageBackground
                source={require('@/assets/images/home-bg.png')}
                style={styles.backgroundImage}
                resizeMode="cover"
            >
                <View style={[styles.container, styles.centered]}>
                    <LoadingSpinner text={Translations.loading[language]} />
                </View>
            </ImageBackground>
        );
    }

    if (!user) {
        return (
            <ImageBackground
                source={require('@/assets/images/home-bg.png')}
                style={styles.backgroundImage}
                resizeMode="cover"
            >
                <SafeAreaView style={[styles.container, styles.centered]}>
                    <EmptyState
                        emoji="👤"
                        title={language === 'tr' ? 'Giriş yapın' : 'Login required'}
                        description={language === 'tr'
                            ? 'Profilinizi görüntülemek için giriş yapmanız gerekmektedir.'
                            : 'Please login to view your profile.'}
                        actionLabel={language === 'tr' ? 'Giriş Yap' : 'Login'}
                        onAction={() => router.replace('/(auth)/login')}
                    />
                </SafeAreaView>
            </ImageBackground>
        );
    }

    // Calculate statistics
    const totalCases = cases.length;
    const completedCases = cases.filter(c => c.finalDiagnoses?.length).length;
    const avgConfidence = cases.length > 0
        ? Math.round(
            cases.reduce((sum, c) => {
                const topDiagnosis = c.finalDiagnoses?.[0] || c.geminiAnalysis?.diagnoses?.[0];
                return sum + (topDiagnosis?.confidence || 0);
            }, 0) / cases.length
        )
        : 0;

    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || (language === 'tr' ? 'Kullanıcı' : 'User');
    const initials = [user.firstName?.[0], user.lastName?.[0]].filter(Boolean).join('').toUpperCase() || 'U';

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
                        {Translations.myProfile[language]}
                    </Text>
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Profile Header Card */}
                    <View style={styles.profileCardWrapper}>
                        <BlurView intensity={75} tint="light" style={styles.profileCardBlur}>
                            <View style={styles.profileCard}>
                                {/* Avatar - Tappable to change photo */}
                                <TouchableOpacity
                                    style={styles.avatarSection}
                                    onPress={handleAvatarPress}
                                    activeOpacity={0.8}
                                    disabled={isUploadingPhoto}
                                >
                                    {user.profileImageUrl ? (
                                        <Image
                                            source={{ uri: user.profileImageUrl }}
                                            style={styles.avatar}
                                        />
                                    ) : (
                                        <View style={styles.avatarPlaceholder}>
                                            <Text style={styles.avatarText}>{initials}</Text>
                                        </View>
                                    )}
                                    {/* Camera/Loading overlay */}
                                    <View style={styles.avatarOverlay}>
                                        {isUploadingPhoto ? (
                                            <ActivityIndicator size="small" color="#FFFFFF" />
                                        ) : (
                                            <Camera size={16} color="#FFFFFF" />
                                        )}
                                    </View>
                                    {/* Edit button for profile info */}
                                    <TouchableOpacity
                                        style={styles.editButton}
                                        onPress={handleEditProfile}
                                        activeOpacity={0.7}
                                    >
                                        <Edit2 size={14} color="#FFFFFF" />
                                    </TouchableOpacity>
                                </TouchableOpacity>

                                {/* User Info */}
                                <Text style={styles.userName}>{fullName}</Text>
                                <Text style={styles.userEmail}>{user.email}</Text>

                                {/* Role Badge */}
                                <View style={styles.roleBadge}>
                                    <Text style={styles.roleBadgeText}>
                                        {user.role === 'admin'
                                            ? (language === 'tr' ? '👨‍⚕️ Yönetici' : '👨‍⚕️ Admin')
                                            : (language === 'tr' ? '🩺 Doktor' : '🩺 Doctor')}
                                    </Text>
                                </View>
                            </View>
                        </BlurView>
                    </View>

                    {/* Statistics Card */}
                    <View style={styles.sectionWrapper}>
                        <Text style={styles.sectionTitle}>
                            {language === 'tr' ? '📊 İstatistikler' : '📊 Statistics'}
                        </Text>
                        <View style={styles.statsCardWrapper}>
                            <BlurView intensity={65} tint="light" style={styles.statsCardBlur}>
                                <View style={styles.statsCard}>
                                    <StatItem
                                        icon={<FileCheck size={22} color="#0891B2" />}
                                        value={totalCases.toString()}
                                        label={language === 'tr' ? 'Toplam Vaka' : 'Total Cases'}
                                    />
                                    <View style={styles.statDivider} />
                                    <StatItem
                                        icon={<Activity size={22} color="#10B981" />}
                                        value={completedCases.toString()}
                                        label={language === 'tr' ? 'Tamamlanan' : 'Completed'}
                                    />
                                    <View style={styles.statDivider} />
                                    <StatItem
                                        icon={<TrendingUp size={22} color="#8B5CF6" />}
                                        value={`%${avgConfidence}`}
                                        label={language === 'tr' ? 'Ort. Güven' : 'Avg. Conf.'}
                                    />
                                </View>
                            </BlurView>
                        </View>
                    </View>

                    {/* Professional Info Card */}
                    <View style={styles.sectionWrapper}>
                        <Text style={styles.sectionTitle}>
                            {language === 'tr' ? '🏥 Profesyonel Bilgiler' : '🏥 Professional Info'}
                        </Text>
                        <View style={styles.infoCardWrapper}>
                            <BlurView intensity={60} tint="light" style={styles.infoCardBlur}>
                                <View style={styles.infoCard}>
                                    <InfoRow
                                        icon={<Building2 size={18} color="#0891B2" />}
                                        label={language === 'tr' ? 'Kurum' : 'Institution'}
                                        value={user.hospital || (language === 'tr' ? 'Belirtilmedi' : 'Not specified')}
                                    />
                                    <View style={styles.infoDivider} />
                                    <InfoRow
                                        icon={<Award size={18} color="#0891B2" />}
                                        label={language === 'tr' ? 'Uzmanlık' : 'Specialty'}
                                        value={user.specialization || (language === 'tr' ? 'Belirtilmedi' : 'Not specified')}
                                    />
                                    <View style={styles.infoDivider} />
                                    <InfoRow
                                        icon={<Shield size={18} color="#0891B2" />}
                                        label={language === 'tr' ? 'Lisans No' : 'License No'}
                                        value={user.medicalLicenseNumber || (language === 'tr' ? 'Belirtilmedi' : 'Not specified')}
                                    />
                                    <View style={styles.infoDivider} />
                                    <InfoRow
                                        icon={<Calendar size={18} color="#0891B2" />}
                                        label={language === 'tr' ? 'Deneyim' : 'Experience'}
                                        value={user.yearsOfExperience
                                            ? `${user.yearsOfExperience} ${language === 'tr' ? 'yıl' : 'years'}`
                                            : (language === 'tr' ? 'Belirtilmedi' : 'Not specified')}
                                    />
                                </View>
                            </BlurView>
                        </View>
                    </View>

                    {/* Quick Actions Card */}
                    <View style={styles.sectionWrapper}>
                        <Text style={styles.sectionTitle}>
                            {language === 'tr' ? '⚡ Hızlı İşlemler' : '⚡ Quick Actions'}
                        </Text>
                        <View style={styles.actionsCardWrapper}>
                            <BlurView intensity={60} tint="light" style={styles.actionsCardBlur}>
                                <View style={styles.actionsCard}>
                                    <ActionRow
                                        icon={<HelpCircle size={20} color="#0891B2" />}
                                        label={Translations.contactSupport[language]}
                                        onPress={() => {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                            router.push('/contact-support');
                                        }}
                                    />
                                    <View style={styles.actionDivider} />
                                    <ActionRow
                                        icon={<Shield size={20} color="#0891B2" />}
                                        label={Translations.privacyPolicy[language]}
                                        onPress={() => {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                            router.push('/privacy-policy');
                                        }}
                                    />
                                </View>
                            </BlurView>
                        </View>
                    </View>

                    {/* Logout Button */}
                    <TouchableOpacity
                        style={styles.logoutButtonWrapper}
                        onPress={handleLogout}
                        activeOpacity={0.8}
                    >
                        <BlurView intensity={60} tint="light" style={styles.logoutButtonBlur}>
                            <View style={styles.logoutButton}>
                                <LogOut size={20} color="#EF4444" />
                                <Text style={styles.logoutButtonText}>
                                    {Translations.logout[language]}
                                </Text>
                            </View>
                        </BlurView>
                    </TouchableOpacity>
                </ScrollView>

                {/* Edit Profile Modal */}
                <EditProfileModal
                    visible={isEditModalVisible}
                    onClose={() => setIsEditModalVisible(false)}
                />
            </SafeAreaView>
        </ImageBackground>
    );
}

// Stat item component
function StatItem({
    icon,
    value,
    label,
}: {
    icon: React.ReactNode;
    value: string;
    label: string;
}) {
    return (
        <View style={styles.statItem}>
            <View style={styles.statIconContainer}>
                {icon}
            </View>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );
}

// Info row component
function InfoRow({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
}) {
    return (
        <View style={styles.infoRow}>
            <View style={styles.infoRowLeft}>
                {icon}
                <Text style={styles.infoLabel}>{label}</Text>
            </View>
            <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
        </View>
    );
}

// Action row component
function ActionRow({
    icon,
    label,
    onPress,
}: {
    icon: React.ReactNode;
    label: string;
    onPress: () => void;
}) {
    return (
        <TouchableOpacity
            style={styles.actionRow}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.actionRowLeft}>
                {icon}
                <Text style={styles.actionLabel}>{label}</Text>
            </View>
            <ChevronRight size={18} color="#94A3B8" />
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
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
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

    // Profile Card
    profileCardWrapper: {
        marginBottom: Spacing.lg,
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#0891B2',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
    },
    profileCardBlur: {
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    profileCard: {
        padding: Spacing.xl,
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    avatarSection: {
        position: 'relative',
        marginBottom: Spacing.md,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 4,
        borderColor: 'rgba(255, 255, 255, 0.8)',
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#0891B2',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 4,
        borderColor: 'rgba(255, 255, 255, 0.8)',
    },
    avatarText: {
        fontSize: 36,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    avatarOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    editButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#0891B2',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    userName: {
        fontSize: 22,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        color: '#64748B',
        marginBottom: Spacing.md,
    },
    roleBadge: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(8, 145, 178, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(8, 145, 178, 0.3)',
    },
    roleBadgeText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#0891B2',
    },

    // Section
    sectionWrapper: {
        marginBottom: Spacing.lg,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0F172A',
        marginBottom: Spacing.sm,
    },

    // Stats Card
    statsCardWrapper: {
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#0891B2',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 5,
    },
    statsCardBlur: {
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    statsCard: {
        flexDirection: 'row',
        padding: Spacing.lg,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '700',
        color: '#0F172A',
    },
    statLabel: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 2,
        fontWeight: '500',
    },
    statDivider: {
        width: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.08)',
        marginHorizontal: Spacing.sm,
    },

    // Info Card
    infoCardWrapper: {
        borderRadius: 18,
        overflow: 'hidden',
        shadowColor: '#0891B2',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 5,
    },
    infoCardBlur: {
        borderRadius: 18,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    infoCard: {
        padding: Spacing.lg,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: Spacing.sm,
    },
    infoRowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    infoLabel: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
    },
    infoValue: {
        fontSize: 14,
        color: '#0F172A',
        fontWeight: '600',
        maxWidth: '45%',
        textAlign: 'right',
    },
    infoDivider: {
        height: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.06)',
        marginVertical: 4,
    },

    // Actions Card
    actionsCardWrapper: {
        borderRadius: 18,
        overflow: 'hidden',
        shadowColor: '#0891B2',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 5,
    },
    actionsCardBlur: {
        borderRadius: 18,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    actionsCard: {
        padding: Spacing.md,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.sm,
    },
    actionRowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    actionLabel: {
        fontSize: 15,
        color: '#0F172A',
        fontWeight: '500',
    },
    actionDivider: {
        height: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.06)',
    },

    // Logout Button
    logoutButtonWrapper: {
        marginTop: Spacing.md,
        borderRadius: 18,
        overflow: 'hidden',
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 5,
    },
    logoutButtonBlur: {
        borderRadius: 18,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        backgroundColor: 'rgba(254, 226, 226, 0.6)',
        gap: 10,
    },
    logoutButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#EF4444',
    },
});
