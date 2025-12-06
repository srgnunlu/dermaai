import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    Switch,
    TouchableOpacity,
} from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { APP_NAME, APP_VERSION } from '@/constants/Config';

export default function SettingsScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: colors.background }]}
            contentContainerStyle={styles.content}
        >
            {/* AI Models Section */}
            <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>AI Modelleri</Text>

                <SettingRow
                    label="Gemini AI"
                    description="Google Gemini 3 modelini kullan"
                    colors={colors}
                    trailing={<Switch value={true} disabled />}
                />
                <SettingRow
                    label="OpenAI GPT"
                    description="OpenAI GPT-5.1 modelini kullan"
                    colors={colors}
                    trailing={<Switch value={true} disabled />}
                />
            </View>

            {/* Preferences Section */}
            <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Tercihler</Text>

                <SettingRow
                    label="Tema"
                    description="Sistem temasını kullan"
                    colors={colors}
                    trailing={
                        <Text style={[styles.trailingText, { color: colors.textSecondary }]}>Sistem</Text>
                    }
                />
                <SettingRow
                    label="Bildirimler"
                    description="Analiz tamamlandığında bildir"
                    colors={colors}
                    trailing={<Switch value={true} disabled />}
                />
                <SettingRow
                    label="Acil Uyarılar"
                    description="Acil durumlar için uyarı gönder"
                    colors={colors}
                    trailing={<Switch value={true} disabled />}
                />
            </View>

            {/* About Section */}
            <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Hakkında</Text>

                <SettingRow
                    label="Uygulama"
                    colors={colors}
                    trailing={
                        <Text style={[styles.trailingText, { color: colors.textSecondary }]}>
                            {APP_NAME} v{APP_VERSION}
                        </Text>
                    }
                />
                <SettingRow
                    label="Gizlilik Politikası"
                    colors={colors}
                    trailing={<Text style={{ color: colors.primary }}>→</Text>}
                />
                <SettingRow
                    label="Kullanım Koşulları"
                    colors={colors}
                    trailing={<Text style={{ color: colors.primary }}>→</Text>}
                />
                <SettingRow
                    label="Tıbbi Sorumluluk Reddi"
                    colors={colors}
                    trailing={<Text style={{ color: colors.primary }}>→</Text>}
                />
            </View>

            {/* Disclaimer */}
            <Text style={[styles.disclaimer, { color: colors.textSecondary }]}>
                Bu sistem eğitim/demo amaçlıdır. Gerçek tıbbi teşhis için mutlaka uzman doktor görüşü alınmalıdır.
            </Text>
        </ScrollView>
    );
}

function SettingRow({
    label,
    description,
    trailing,
    colors
}: {
    label: string;
    description?: string;
    trailing?: React.ReactNode;
    colors: typeof Colors.light;
}) {
    return (
        <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>{label}</Text>
                {description && (
                    <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                        {description}
                    </Text>
                )}
            </View>
            {trailing}
        </TouchableOpacity>
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
    section: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#e2e8f0',
    },
    settingInfo: {
        flex: 1,
        marginRight: 12,
    },
    settingLabel: {
        fontSize: 14,
        fontWeight: '500',
    },
    settingDescription: {
        fontSize: 12,
        marginTop: 2,
    },
    trailingText: {
        fontSize: 14,
    },
    disclaimer: {
        fontSize: 12,
        textAlign: 'center',
        paddingHorizontal: 16,
        marginTop: 8,
    },
});
