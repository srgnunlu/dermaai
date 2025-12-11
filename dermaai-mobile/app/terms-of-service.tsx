/**
 * Terms of Service Page
 */

import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { FileText } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';
import { useColorScheme } from '@/components/useColorScheme';
import { Card, CardContent } from '@/components/ui';

export default function TermsOfServiceScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ title: 'Kullanım Şartları' }} />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <Card style={{ backgroundColor: colors.primaryLight }}>
                    <View style={styles.header}>
                        <FileText size={32} color={colors.primary} />
                        <Text style={[styles.headerTitle, { color: colors.primary }]}>
                            Kullanım Şartları
                        </Text>
                    </View>
                </Card>

                <Card>
                    <CardContent>
                        <Section title="1. Kabul" colors={colors}>
                            Corio Scan uygulamasını kullanarak bu kullanım şartlarını kabul
                            etmiş sayılırsınız. Bu şartları kabul etmiyorsanız uygulamayı
                            kullanmayınız.
                        </Section>

                        <Section title="2. Hizmet Tanımı" colors={colors}>
                            Corio Scan, yapay zeka destekli bir dermatolojik tanı destek
                            sistemidir. Sağlık profesyonellerine tanı sürecinde yardımcı olmak
                            amacıyla geliştirilmiştir.
                        </Section>

                        <Section title="3. Kullanım Koşulları" colors={colors}>
                            • Yalnızca sağlık profesyonelleri kullanabilir{'\n'}
                            • Kesin tanı koymak için kullanılamaz{'\n'}
                            • Hasta verilerinin gizliliği korunmalıdır{'\n'}
                            • Ticari amaçlarla yeniden satılamaz
                        </Section>

                        <Section title="4. Hesap Güvenliği" colors={colors}>
                            • Hesap bilgilerinizi gizli tutmalısınız{'\n'}
                            • Şüpheli aktiviteleri bildirmelisiniz{'\n'}
                            • Hesabınızdan yapılan işlemlerden siz sorumlusunuz
                        </Section>

                        <Section title="5. Fikri Mülkiyet" colors={colors}>
                            Uygulama ve içeriğindeki tüm fikri mülkiyet hakları Corio'ye
                            aittir. İzinsiz kopyalama, dağıtım veya değiştirme yasaktır.
                        </Section>

                        <Section title="6. Sorumluluk Sınırlaması" colors={colors}>
                            • AI analiz sonuçları %100 doğru değildir{'\n'}
                            • Yanlış tanıdan kaynaklanan sorunlardan sorumlu değiliz{'\n'}
                            • Hizmet kesintilerinden sorumlu değiliz{'\n'}
                            • Veri kaybından maksimum sorumluluk ödenen ücreti aşamaz
                        </Section>

                        <Section title="7. Hizmet Değişiklikleri" colors={colors}>
                            Corio, hizmeti değiştirme, askıya alma veya sonlandırma
                            hakkını saklı tutar. Önemli değişiklikler e-posta ile bildirilir.
                        </Section>

                        <Section title="8. Hesap İptali" colors={colors}>
                            • Hesabınızı istediğiniz zaman iptal edebilirsiniz{'\n'}
                            • Şartların ihlali durumunda hesabınız askıya alınabilir{'\n'}
                            • İptal sonrası veriler 30 gün içinde silinir
                        </Section>

                        <Section title="9. Uygulanacak Hukuk" colors={colors}>
                            Bu şartlar Türkiye Cumhuriyeti kanunlarına tabidir.
                            Uyuşmazlıklar İstanbul mahkemelerinde çözülecektir.
                        </Section>

                        <Section title="10. İletişim" colors={colors} isLast>
                            Kullanım şartları ile ilgili sorularınız için:{'\n\n'}
                            📧 legal@corioscan.ai{'\n'}
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
