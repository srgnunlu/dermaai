/**
 * Medical Disclaimer Page
 */

import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { AlertTriangle } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';
import { useColorScheme } from '@/components/useColorScheme';
import { Card, CardContent } from '@/components/ui';

export default function MedicalDisclaimerScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ title: 'Tıbbi Uyarı' }} />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Warning Header */}
                <Card style={{ backgroundColor: colors.warningLight }}>
                    <View style={styles.warningHeader}>
                        <AlertTriangle size={32} color={colors.warning} />
                        <Text style={[styles.warningTitle, { color: colors.warning }]}>
                            Önemli Tıbbi Uyarı
                        </Text>
                    </View>
                </Card>

                <Card>
                    <CardContent>
                        <Section title="Amaç ve Kapsam" colors={colors}>
                            Corio Scan, yapay zeka destekli bir dermatolojik tanı destek sistemidir.
                            Bu uygulama, sağlık profesyonellerine tanı sürecinde yardımcı olmak amacıyla
                            geliştirilmiştir ve kesinlikle tıbbi tanı koymak veya tedavi önermek için
                            kullanılmamalıdır.
                        </Section>

                        <Section title="Kullanım Sınırlamaları" colors={colors}>
                            • Bu uygulama bir tıbbi cihaz değildir{'\n'}
                            • Yapay zeka analizi kesin tanı değildir{'\n'}
                            • Sonuçlar sadece referans amaçlıdır{'\n'}
                            • Acil durumlarda mutlaka bir sağlık kuruluşuna başvurun
                        </Section>

                        <Section title="Hedef Kullanıcılar" colors={colors}>
                            Bu uygulama yalnızca sağlık profesyonelleri (doktorlar, dermatologlar,
                            sağlık teknisyenleri vb.) tarafından kullanılmak üzere tasarlanmıştır.
                            Hastalar veya sağlık profesyoneli olmayan kişiler bu uygulamayı
                            kendi başlarına tanı koymak için kullanmamalıdır.
                        </Section>

                        <Section title="Yapay Zeka Sınırlamaları" colors={colors}>
                            • AI modelleri %100 doğru sonuç vermez{'\n'}
                            • Görsel kalitesi sonuçları etkiler{'\n'}
                            • Nadir hastalıkları tespit edemeyebilir{'\n'}
                            • Klinik muayenenin yerini alamaz
                        </Section>

                        <Section title="Veri Güvenliği" colors={colors}>
                            Yüklenen tüm hasta verileri ve görseller güvenli sunucularda saklanmaktadır.
                            Ancak, hassas tıbbi verilerin paylaşımında dikkatli olunmalı ve kurumsal
                            veri koruma politikalarına uyulmalıdır.
                        </Section>

                        <Section title="Sorumluluk Reddi" colors={colors} isLast>
                            Corio Scan ve geliştiricileri, bu uygulamanın kullanımından kaynaklanan
                            herhangi bir yanlış tanı, tedavi gecikmesi veya diğer tıbbi sorunlardan
                            sorumlu tutulamaz. Tüm tıbbi kararlar yetkili sağlık profesyonelleri
                            tarafından verilmelidir.
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
    warningHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.lg,
    },
    warningTitle: {
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
