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
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/hooks/useAuth';
import { useCases } from '@/hooks/useCases';
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

    const handleLogout = () => {
        Alert.alert(
            'Çıkış Yap',
            'Hesabınızdan çıkış yapmak istediğinize emin misiniz?',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Çıkış Yap',
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
        Alert.alert('Profil Düzenle', 'Bu özellik yakında eklenecek.');
    };

    if (authLoading) {
        return (
            <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
                <LoadingSpinner text="Yükleniyor..." />
            </View>
        );
    }

    if (!user) {
        return (
            <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
                <EmptyState
                    emoji="👤"
                    title="Giriş yapın"
                    description="Profilinizi görüntülemek için giriş yapmanız gerekmektedir."
                    actionLabel="Giriş Yap"
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

    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Kullanıcı';
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
                            {user.role === 'admin' ? 'Yönetici' : 'Kullanıcı'}
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
                <CardHeader title="İstatistikler" icon={<Award size={18} color={colors.primary} />} />
                <CardContent>
                    <View style={styles.statsRow}>
                        <StatItem
                            value={totalCases.toString()}
                            label="Toplam Vaka"
                            colors={colors}
                        />
                        <StatItem
                            value={completedCases.toString()}
                            label="Tamamlanan"
                            colors={colors}
                        />
                        <StatItem
                            value={`%${avgConfidence}`}
                            label="Ort. Güven"
                            colors={colors}
                        />
                    </View>
                </CardContent>
            </Card>

            {/* Professional Info */}
            <Card>
                <CardHeader title="Profesyonel Bilgiler" icon={<Building2 size={18} color={colors.primary} />} />
                <CardContent>
                    <InfoRow
                        icon={<Building2 size={16} color={colors.textSecondary} />}
                        label="Kurum"
                        value={user.hospital || 'Belirtilmedi'}
                        colors={colors}
                    />
                    <InfoRow
                        icon={<Award size={16} color={colors.textSecondary} />}
                        label="Uzmanlık"
                        value={user.specialization || 'Belirtilmedi'}
                        colors={colors}
                    />
                    <InfoRow
                        icon={<Shield size={16} color={colors.textSecondary} />}
                        label="Lisans No"
                        value={user.medicalLicenseNumber || 'Belirtilmedi'}
                        colors={colors}
                    />
                    <InfoRow
                        icon={<Calendar size={16} color={colors.textSecondary} />}
                        label="Deneyim"
                        value={user.yearsOfExperience ? `${user.yearsOfExperience} yıl` : 'Belirtilmedi'}
                        colors={colors}
                        isLast
                    />
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
                <CardHeader title="Hızlı İşlemler" />
                <CardContent>
                    <ActionRow
                        icon={<HelpCircle size={18} color={colors.primary} />}
                        label="Destek"
                        colors={colors}
                        onPress={() => router.push('/contact-support')}
                    />
                    <ActionRow
                        icon={<Shield size={18} color={colors.primary} />}
                        label="Gizlilik Politikası"
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
                Çıkış Yap
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
