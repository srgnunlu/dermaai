/**
 * Privacy Policy Page
 */

import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { Shield } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';
import { useColorScheme } from '@/components/useColorScheme';
import { Card, CardContent } from '@/components/ui';

export default function PrivacyPolicyScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ title: 'Gizlilik Politikası' }} />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <Card style={{ backgroundColor: colors.primaryLight }}>
                    <View style={styles.header}>
                        <Shield size={32} color={colors.primary} />
                        <Text style={[styles.headerTitle, { color: colors.primary }]}>
                            Gizlilik Politikası
                        </Text>
                    </View>
                </Card>

                <Card>
                    <CardContent>
                        <Section title="Toplanan Veriler" colors={colors}>
                            Corio Scan aşağıdaki verileri toplamaktadır:{'\n\n'}
                            • Kullanıcı hesap bilgileri (ad, e-posta){'\n'}
                            • Yüklenen lezyon görselleri{'\n'}
                            • Hasta demografik bilgileri{'\n'}
                            • Belirti ve tıbbi geçmiş bilgileri{'\n'}
                            • AI analiz sonuçları
                        </Section>

                        <Section title="Veri Kullanımı" colors={colors}>
                            Toplanan veriler aşağıdaki amaçlarla kullanılmaktadır:{'\n\n'}
                            • AI modellerinin analiz yapması{'\n'}
                            • Tanı raporlarının oluşturulması{'\n'}
                            • Vaka geçmişinin saklanması{'\n'}
                            • Hizmet kalitesinin iyileştirilmesi
                        </Section>

                        <Section title="Veri Güvenliği" colors={colors}>
                            Verileriniz aşağıdaki güvenlik önlemleriyle korunmaktadır:{'\n\n'}
                            • SSL/TLS şifrelemesi{'\n'}
                            • Güvenli bulut depolama{'\n'}
                            • Erişim kontrolü ve yetkilendirme{'\n'}
                            • Düzenli güvenlik denetimleri
                        </Section>

                        <Section title="Veri Paylaşımı" colors={colors}>
                            Verileriniz üçüncü taraflarla paylaşılmaz, ancak:{'\n\n'}
                            • AI analizi için Corio AI sistemi kullanılır{'\n'}
                            • Yasal zorunluluklar durumunda paylaşılabilir{'\n'}
                            • Anonimleştirilmiş veriler araştırma amaçlı kullanılabilir
                        </Section>

                        <Section title="Veri Saklama" colors={colors}>
                            • Vaka verileri hesap aktif olduğu sürece saklanır{'\n'}
                            • Hesap silindiğinde veriler 30 gün içinde silinir{'\n'}
                            • Yedeklemeler 90 gün saklanır
                        </Section>

                        <Section title="Haklarınız" colors={colors}>
                            KVKK kapsamında aşağıdaki haklara sahipsiniz:{'\n\n'}
                            • Verilerinize erişim hakkı{'\n'}
                            • Verilerin düzeltilmesini talep etme{'\n'}
                            • Verilerin silinmesini talep etme{'\n'}
                            • Veri taşınabilirliği
                        </Section>

                        <Section title="İletişim" colors={colors} isLast>
                            Gizlilik ile ilgili sorularınız için:{'\n\n'}
                            📧 privacy@corioscan.ai{'\n'}
                            📞 +90 212 XXX XX XX
                        </Section>
                    </CardContent>
                </Card>

                <Text style={[styles.footer, { color: colors.textMuted }]}>
                    Son güncelleme: Aralık 2024
                </Text>
            </ScrollView>
        </View>
    );
}

function Section({
    title,
    children,
    colors,
    isLast = false,
}: {
    title: string;
    children: React.ReactNode;
    colors: typeof Colors.light;
    isLast?: boolean;
}) {
    return (
        <View style={[styles.section, !isLast && styles.sectionBorder, { borderColor: colors.borderLight }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
            <Text style={[styles.sectionContent, { color: colors.textSecondary }]}>{children}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: Spacing.base,
        paddingBottom: Spacing['4xl'],
        gap: Spacing.md,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.lg,
    },
    headerTitle: {
        ...Typography.styles.h3,
        marginLeft: Spacing.md,
    },
    section: {
        paddingVertical: Spacing.md,
    },
    sectionBorder: {
        borderBottomWidth: 1,
    },
    sectionTitle: {
        ...Typography.styles.h4,
        marginBottom: Spacing.sm,
    },
    sectionContent: {
        ...Typography.styles.body,
        lineHeight: 22,
    },
    footer: {
        ...Typography.styles.caption,
        textAlign: 'center',
        marginTop: Spacing.lg,
    },
});
