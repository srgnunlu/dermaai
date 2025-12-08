/**
 * Profile Screen
 * User profile information and account management
 */

import React from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Image,
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
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
} from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing, Shadows } from '@/constants/Spacing';
import { Translations } from '@/constants/Translations';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/hooks/useAuth';
import { useCases } from '@/hooks/useCases';
import { useLanguage } from '@/contexts/LanguageContext';
import {
    Card,
    CardHeader,
    CardContent,
    Button,
    Badge,
    LoadingSpinner,
    EmptyState,
} from '@/components/ui';

export default function ProfileScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const router = useRouter();

    const { user, isLoading: authLoading, logout } = useAuth();
    const { cases } = useCases();
    const { language } = useLanguage();

    const handleLogout = () => {
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
        Alert.alert(
            Translations.editProfile[language],
            language === 'tr' ? 'Bu özellik yakında eklenecek.' : 'This feature is coming soon.'
        );
    };

    if (authLoading) {
        return (
            <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
                <LoadingSpinner text={Translations.loading[language]} />
            </View>
        );
    }

    if (!user) {
        return (
            <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
                <EmptyState
                    emoji="👤"
                    title={language === 'tr' ? 'Giriş yapın' : 'Login required'}
                    description={language === 'tr'
                        ? 'Profilinizi görüntülemek için giriş yapmanız gerekmektedir.'
                        : 'Please login to view your profile.'}
                    actionLabel={language === 'tr' ? 'Giriş Yap' : 'Login'}
                    onAction={() => router.replace('/(auth)/login')}
                />
            </View>
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
        <ScrollView
            style={[styles.container, { backgroundColor: colors.background }]}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            {/* Profile Header */}
            <Card style={{ ...styles.headerCard, backgroundColor: colors.primaryLight }}>
                <View style={styles.header}>
                    {user.profileImageUrl ? (
                        <Image
                            source={{ uri: user.profileImageUrl }}
                            style={[styles.avatar, { borderColor: colors.primary }]}
                        />
                    ) : (
                        <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                            <Text style={[styles.avatarText, { color: colors.primaryForeground }]}>
                                {initials}
                            </Text>
                        </View>
                    )}

                    <View style={styles.headerInfo}>
                        <Text style={[styles.name, { color: colors.text }]}>{fullName}</Text>
                        <Text style={[styles.email, { color: colors.textSecondary }]}>
                            {user.email}
                        </Text>
                        <Badge variant={user.role === 'admin' ? 'primary' : 'default'} style={styles.roleBadge}>
                            {user.role === 'admin'
                                ? (language === 'tr' ? 'Yönetici' : 'Admin')
                                : (language === 'tr' ? 'Kullanıcı' : 'User')}
                        </Badge>
                    </View>

                    <TouchableOpacity
                        style={[styles.editButton, { backgroundColor: colors.card }]}
                        onPress={handleEditProfile}
                    >
                        <Edit2 size={16} color={colors.primary} />
                    </TouchableOpacity>
                </View>
            </Card>

            {/* Statistics */}
            <Card>
                <CardHeader title={language === 'tr' ? 'İstatistikler' : 'Statistics'} icon={<Award size={18} color={colors.primary} />} />
                <CardContent>
                    <View style={styles.statsRow}>
                        <StatItem
                            value={totalCases.toString()}
                            label={language === 'tr' ? 'Toplam Vaka' : 'Total Cases'}
                            colors={colors}
                        />
                        <StatItem
                            value={completedCases.toString()}
                            label={language === 'tr' ? 'Tamamlanan' : 'Completed'}
                            colors={colors}
                        />
                        <StatItem
                            value={`%${avgConfidence}`}
                            label={language === 'tr' ? 'Ort. Güven' : 'Avg. Confidence'}
                            colors={colors}
                        />
                    </View>
                </CardContent>
            </Card>

            {/* Professional Info */}
            <Card>
                <CardHeader title={language === 'tr' ? 'Profesyonel Bilgiler' : 'Professional Info'} icon={<Building2 size={18} color={colors.primary} />} />
                <CardContent>
                    <InfoRow
                        icon={<Building2 size={16} color={colors.textSecondary} />}
                        label={language === 'tr' ? 'Kurum' : 'Institution'}
                        value={user.hospital || (language === 'tr' ? 'Belirtilmedi' : 'Not specified')}
                        colors={colors}
                    />
                    <InfoRow
                        icon={<Award size={16} color={colors.textSecondary} />}
                        label={language === 'tr' ? 'Uzmanlık' : 'Specialty'}
                        value={user.specialization || (language === 'tr' ? 'Belirtilmedi' : 'Not specified')}
                        colors={colors}
                    />
                    <InfoRow
                        icon={<Shield size={16} color={colors.textSecondary} />}
                        label={language === 'tr' ? 'Lisans No' : 'License No'}
                        value={user.medicalLicenseNumber || (language === 'tr' ? 'Belirtilmedi' : 'Not specified')}
                        colors={colors}
                    />
                    <InfoRow
                        icon={<Calendar size={16} color={colors.textSecondary} />}
                        label={language === 'tr' ? 'Deneyim' : 'Experience'}
                        value={user.yearsOfExperience
                            ? `${user.yearsOfExperience} ${language === 'tr' ? 'yıl' : 'years'}`
                            : (language === 'tr' ? 'Belirtilmedi' : 'Not specified')}
                        colors={colors}
                        isLast
                    />
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
                <CardHeader title={language === 'tr' ? 'Hızlı İşlemler' : 'Quick Actions'} />
                <CardContent>
                    <ActionRow
                        icon={<HelpCircle size={18} color={colors.primary} />}
                        label={Translations.contactSupport[language]}
                        colors={colors}
                        onPress={() => router.push('/contact-support')}
                    />
                    <ActionRow
                        icon={<Shield size={18} color={colors.primary} />}
                        label={Translations.privacyPolicy[language]}
                        colors={colors}
                        onPress={() => router.push('/privacy-policy')}
                        isLast
                    />
                </CardContent>
            </Card>

            {/* Logout Button */}
            <Button
                variant="destructive"
                size="lg"
                fullWidth
                icon={<LogOut size={18} color={colors.destructiveForeground} />}
                onPress={handleLogout}
                style={styles.logoutButton}
            >
                {Translations.logout[language]}
            </Button>
        </ScrollView>
    );
}

// Stat item component
function StatItem({
    value,
    label,
    colors,
}: {
    value: string;
    label: string;
    colors: typeof Colors.light;
}) {
    return (
        <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{value}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
        </View>
    );
}

// Info row component
function InfoRow({
    icon,
    label,
    value,
    colors,
    isLast = false,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    colors: typeof Colors.light;
    isLast?: boolean;
}) {
    return (
        <View
            style={[
                styles.infoRow,
                !isLast && { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
            ]}
        >
            <View style={styles.infoLabel}>
                {icon}
                <Text style={[styles.infoLabelText, { color: colors.textSecondary }]}>{label}</Text>
            </View>
            <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
        </View>
    );
}

// Action row component
function ActionRow({
    icon,
    label,
    colors,
    onPress,
    isLast = false,
}: {
    icon: React.ReactNode;
    label: string;
    colors: typeof Colors.light;
    onPress: () => void;
    isLast?: boolean;
}) {
    return (
        <TouchableOpacity
            style={[
                styles.actionRow,
                !isLast && { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
            ]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.actionLeft}>
                {icon}
                <Text style={[styles.actionLabel, { color: colors.text }]}>{label}</Text>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: Spacing.base,
        paddingBottom: Spacing['4xl'],
        gap: Spacing.md,
    },
    headerCard: {
        padding: Spacing.lg,
        borderWidth: 0,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    avatar: {
        width: 72,
        height: 72,
        borderRadius: 36,
        borderWidth: 3,
    },
    avatarPlaceholder: {
        width: 72,
        height: 72,
        borderRadius: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: 24,
        fontWeight: '700',
    },
    headerInfo: {
        flex: 1,
        marginLeft: Spacing.md,
    },
    name: {
        ...Typography.styles.h3,
    },
    email: {
        ...Typography.styles.body,
        marginTop: 2,
    },
    roleBadge: {
        marginTop: Spacing.sm,
    },
    editButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadows.sm,
    },
    statsRow: {
        flexDirection: 'row',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        ...Typography.styles.h2,
    },
    statLabel: {
        ...Typography.styles.caption,
        marginTop: 2,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: Spacing.md,
    },
    infoLabel: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoLabelText: {
        ...Typography.styles.body,
        marginLeft: Spacing.sm,
    },
    infoValue: {
        ...Typography.styles.body,
        fontWeight: '500',
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: Spacing.md,
    },
    actionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionLabel: {
        ...Typography.styles.body,
        fontWeight: '500',
        marginLeft: Spacing.md,
    },
    logoutButton: {
        marginTop: Spacing.lg,
    },
});
