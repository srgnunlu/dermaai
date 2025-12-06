import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Image,
    Alert,
} from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/hooks/useAuth';

export default function ProfileScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const { user, logout, isLoggingOut } = useAuth();

    const handleLogout = async () => {
        Alert.alert(
            'Çıkış Yap',
            'Hesabınızdan çıkış yapmak istediğinizden emin misiniz?',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Çıkış Yap',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await logout();
                        } catch (error) {
                            Alert.alert('Hata', 'Çıkış yapılırken bir hata oluştu.');
                        }
                    }
                },
            ]
        );
    };

    const initials = user
        ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || user.email?.[0]?.toUpperCase()
        : '?';

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: colors.background }]}
            contentContainerStyle={styles.content}
        >
            {/* Profile Header */}
            <View style={[styles.header, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {user?.profileImageUrl ? (
                    <Image
                        source={{ uri: user.profileImageUrl }}
                        style={styles.avatar}
                    />
                ) : (
                    <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                        <Text style={[styles.avatarText, { color: colors.primaryForeground }]}>
                            {initials}
                        </Text>
                    </View>
                )}

                <Text style={[styles.name, { color: colors.text }]}>
                    {user?.firstName && user?.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : user?.email || 'Kullanıcı'
                    }
                </Text>

                <Text style={[styles.email, { color: colors.textSecondary }]}>
                    {user?.email}
                </Text>

                {user?.role === 'admin' && (
                    <View style={[styles.badge, { backgroundColor: colors.primary + '20' }]}>
                        <Text style={[styles.badgeText, { color: colors.primary }]}>Admin</Text>
                    </View>
                )}
            </View>

            {/* Profile Info */}
            <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Hesap Bilgileri</Text>

                <InfoRow
                    label="Email"
                    value={user?.email || '-'}
                    colors={colors}
                />
                <InfoRow
                    label="Ad"
                    value={user?.firstName || '-'}
                    colors={colors}
                />
                <InfoRow
                    label="Soyad"
                    value={user?.lastName || '-'}
                    colors={colors}
                />
                <InfoRow
                    label="Rol"
                    value={user?.role === 'admin' ? 'Yönetici' : 'Kullanıcı'}
                    colors={colors}
                />
                {user?.hospital && (
                    <InfoRow
                        label="Hastane"
                        value={user.hospital}
                        colors={colors}
                    />
                )}
                {user?.specialization && (
                    <InfoRow
                        label="Uzmanlık"
                        value={user.specialization}
                        colors={colors}
                    />
                )}
            </View>

            {/* Logout Button */}
            <TouchableOpacity
                style={[styles.logoutButton, { backgroundColor: colors.destructive }]}
                onPress={handleLogout}
                disabled={isLoggingOut}
            >
                <Text style={[styles.logoutText, { color: colors.destructiveForeground }]}>
                    {isLoggingOut ? 'Çıkış yapılıyor...' : 'Çıkış Yap'}
                </Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

function InfoRow({ label, value, colors }: { label: string; value: string; colors: typeof Colors.light }) {
    return (
        <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{label}</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 16,
        gap: 16,
    },
    header: {
        alignItems: 'center',
        padding: 24,
        borderRadius: 16,
        borderWidth: 1,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginBottom: 12,
    },
    avatarPlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    avatarText: {
        fontSize: 28,
        fontWeight: '600',
    },
    name: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 4,
    },
    email: {
        fontSize: 14,
        marginBottom: 8,
    },
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    section: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 16,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#e2e8f0',
    },
    infoLabel: {
        fontSize: 14,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '500',
    },
    logoutButton: {
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '600',
    },
});
