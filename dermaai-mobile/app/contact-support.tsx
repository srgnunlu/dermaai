/**
 * Contact Support Page
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Linking, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { Mail, Phone, MessageCircle, HelpCircle, ExternalLink } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';
import { useColorScheme } from '@/components/useColorScheme';
import { Card, CardHeader, CardContent, Button, Input, TextArea } from '@/components/ui';

export default function ContactSupportScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!name.trim() || !email.trim() || !message.trim()) {
            Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
            return;
        }

        setIsSubmitting(true);
        // Simulate submission
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsSubmitting(false);

        Alert.alert(
            'Mesaj Gönderildi',
            'Mesajınız başarıyla gönderildi. En kısa sürede size dönüş yapacağız.',
            [{
                text: 'Tamam', onPress: () => {
                    setName('');
                    setEmail('');
                    setMessage('');
                }
            }]
        );
    };

    const handleEmail = () => {
        Linking.openURL('mailto:support@dermaassistai.com');
    };

    const handlePhone = () => {
        Linking.openURL('tel:+902121234567');
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ title: 'Destek' }} />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Header */}
                <Card style={{ backgroundColor: colors.primaryLight }}>
                    <View style={styles.header}>
                        <HelpCircle size={32} color={colors.primary} />
                        <View style={styles.headerText}>
                            <Text style={[styles.headerTitle, { color: colors.primary }]}>
                                Yardım mı lazım?
                            </Text>
                            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                                Size yardımcı olmaktan mutluluk duyarız
                            </Text>
                        </View>
                    </View>
                </Card>

                {/* Quick Contact Options */}
                <Card>
                    <CardHeader title="Hızlı İletişim" />
                    <CardContent>
                        <View style={styles.contactOptions}>
                            <ContactButton
                                icon={<Mail size={20} color={colors.primary} />}
                                label="E-posta"
                                value="support@dermaassistai.com"
                                onPress={handleEmail}
                                colors={colors}
                            />
                            <ContactButton
                                icon={<Phone size={20} color={colors.primary} />}
                                label="Telefon"
                                value="+90 212 123 45 67"
                                onPress={handlePhone}
                                colors={colors}
                            />
                        </View>
                    </CardContent>
                </Card>

                {/* Contact Form */}
                <Card>
                    <CardHeader
                        title="Mesaj Gönderin"
                        icon={<MessageCircle size={18} color={colors.primary} />}
                    />
                    <CardContent>
                        <Input
                            label="Adınız"
                            placeholder="Adınızı girin"
                            value={name}
                            onChangeText={setName}
                        />
                        <Input
                            label="E-posta"
                            placeholder="E-posta adresinizi girin"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                        <TextArea
                            label="Mesajınız"
                            placeholder="Nasıl yardımcı olabiliriz?"
                            value={message}
                            onChangeText={setMessage}
                            numberOfLines={5}
                        />
                        <Button
                            variant="primary"
                            size="lg"
                            fullWidth
                            onPress={handleSubmit}
                            loading={isSubmitting}
                            style={{ marginTop: Spacing.sm }}
                        >
                            Gönder
                        </Button>
                    </CardContent>
                </Card>

                {/* FAQ Section */}
                <Card>
                    <CardHeader title="Sık Sorulan Sorular" />
                    <CardContent>
                        <FAQItem
                            question="AI analizi ne kadar güvenilir?"
                            answer="AI modellerimiz yüksek doğruluk oranına sahip olsa da, kesin tanı için mutlaka bir dermatolog değerlendirmesi gereklidir."
                            colors={colors}
                        />
                        <FAQItem
                            question="Verilerim güvende mi?"
                            answer="Evet, tüm verileriniz şifreli olarak saklanır ve KVKK uyumlu şekilde işlenir."
                            colors={colors}
                        />
                        <FAQItem
                            question="Mobil uygulamayı nasıl güncellerim?"
                            answer="App Store veya Google Play Store üzerinden otomatik güncellemeleri açabilir veya manuel olarak güncelleyebilirsiniz."
                            colors={colors}
                            isLast
                        />
                    </CardContent>
                </Card>
            </ScrollView>
        </View>
    );
}

function ContactButton({
    icon,
    label,
    value,
    onPress,
    colors,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    onPress: () => void;
    colors: typeof Colors.light;
}) {
    return (
        <Button
            variant="outline"
            size="lg"
            onPress={onPress}
            style={styles.contactButton}
        >
            <View style={styles.contactButtonContent}>
                {icon}
                <View style={styles.contactButtonText}>
                    <Text style={[styles.contactLabel, { color: colors.textSecondary }]}>{label}</Text>
                    <Text style={[styles.contactValue, { color: colors.text }]}>{value}</Text>
                </View>
                <ExternalLink size={16} color={colors.textMuted} />
            </View>
        </Button>
    );
}

function FAQItem({
    question,
    answer,
    colors,
    isLast = false,
}: {
    question: string;
    answer: string;
    colors: typeof Colors.light;
    isLast?: boolean;
}) {
    return (
        <View style={[styles.faqItem, !isLast && { borderBottomWidth: 1, borderBottomColor: colors.borderLight }]}>
            <Text style={[styles.faqQuestion, { color: colors.text }]}>{question}</Text>
            <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>{answer}</Text>
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
    headerText: {
        marginLeft: Spacing.md,
    },
    headerTitle: {
        ...Typography.styles.h3,
    },
    headerSubtitle: {
        ...Typography.styles.body,
        marginTop: 2,
    },
    contactOptions: {
        gap: Spacing.md,
    },
    contactButton: {
        height: 'auto',
        paddingVertical: Spacing.md,
    },
    contactButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
    },
    contactButtonText: {
        flex: 1,
        marginLeft: Spacing.md,
    },
    contactLabel: {
        ...Typography.styles.caption,
    },
    contactValue: {
        ...Typography.styles.body,
        fontWeight: '500',
    },
    faqItem: {
        paddingVertical: Spacing.md,
    },
    faqQuestion: {
        ...Typography.styles.label,
        marginBottom: Spacing.xs,
    },
    faqAnswer: {
        ...Typography.styles.body,
        lineHeight: 20,
    },
});
