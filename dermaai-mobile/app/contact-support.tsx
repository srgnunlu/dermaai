/**
 * Contact Support Page
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Linking, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { Mail, MessageCircle, HelpCircle, ExternalLink } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';
import { useColorScheme } from '@/components/useColorScheme';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardContent, Button, Input, TextArea } from '@/components/ui';

export default function ContactSupportScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const { language } = useLanguage();
    const isTr = language === 'tr';

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!name.trim() || !email.trim() || !message.trim()) {
            Alert.alert(isTr ? 'Hata' : 'Error', isTr ? 'Lütfen tüm alanları doldurun.' : 'Please fill in all fields.');
            return;
        }

        const subject = encodeURIComponent(`Corio Scan ${isTr ? 'Destek' : 'Support'} - ${name.trim()}`);
        const body = encodeURIComponent(`${isTr ? 'Ad' : 'Name'}: ${name.trim()}\n${isTr ? 'E-posta' : 'Email'}: ${email.trim()}\n\n${message.trim()}`);
        const url = `mailto:destek@corioscan.com?subject=${subject}&body=${body}`;
        setIsSubmitting(true);
        try {
            const canOpen = await Linking.canOpenURL(url);
            if (!canOpen) {
                throw new Error('Mail client is unavailable');
            }
            await Linking.openURL(url);
        } catch {
            Alert.alert(
                isTr ? 'E-posta Uygulaması Bulunamadı' : 'No Email App Found',
                isTr ? 'Lütfen destek@corioscan.com adresine e-posta gönderin.' : 'Please email destek@corioscan.com directly.'
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEmail = () => {
        Linking.openURL('mailto:destek@corioscan.com');
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ title: isTr ? 'Destek' : 'Support' }} />

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
                                {isTr ? 'Yardıma ihtiyacın var mı?' : 'Need help?'}
                            </Text>
                            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                                {isTr ? 'Size yardımcı olmaktan mutluluk duyarız' : 'We are happy to help you'}
                            </Text>
                        </View>
                    </View>
                </Card>

                {/* Quick Contact Options */}
                <Card>
                    <CardHeader title={isTr ? 'Hızlı İletişim' : 'Quick Contact'} />
                    <CardContent>
                        <View style={styles.contactOptions}>
                            <ContactButton
                                icon={<Mail size={20} color={colors.primary} />}
                                label={isTr ? 'E-posta' : 'Email'}
                                value="destek@corioscan.com"
                                onPress={handleEmail}
                                colors={colors}
                            />
                        </View>
                    </CardContent>
                </Card>

                {/* Contact Form */}
                <Card>
                    <CardHeader
                        title={isTr ? 'Mesaj Gönderin' : 'Send a Message'}
                        icon={<MessageCircle size={18} color={colors.primary} />}
                    />
                    <CardContent>
                        <Input
                            label={isTr ? 'Adınız' : 'Your Name'}
                            placeholder={isTr ? 'Adınızı girin' : 'Enter your name'}
                            value={name}
                            onChangeText={setName}
                        />
                        <Input
                            label={isTr ? 'E-posta' : 'Email'}
                            placeholder={isTr ? 'E-posta adresinizi girin' : 'Enter your email address'}
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                        <TextArea
                            label={isTr ? 'Mesajınız' : 'Your Message'}
                            placeholder={isTr ? 'Nasıl yardımcı olabiliriz?' : 'How can we help?'}
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
                            {isTr ? 'Gönder' : 'Send'}
                        </Button>
                    </CardContent>
                </Card>

                {/* FAQ Section */}
                <Card>
                    <CardHeader title={isTr ? 'Sık Sorulan Sorular' : 'Frequently Asked Questions'} />
                    <CardContent>
                        <FAQItem
                            question={isTr ? 'AI analizi ne kadar güvenilir?' : 'How reliable is the AI analysis?'}
                            answer={isTr
                                ? 'Model güven skoru klinik doğruluk ölçüsü değildir. Sonuçlar farkındalık ve yardımcı ön değerlendirme amaçlıdır; sağlık kararları için dermatoloğa danışın.'
                                : 'The model confidence score is not a measure of clinical accuracy. Results are for awareness and assisted preliminary assessment only; consult a dermatologist for health decisions.'}
                            colors={colors}
                        />
                        <FAQItem
                            question={isTr ? 'Verilerim güvende mi?' : 'Is my data safe?'}
                            answer={isTr
                                ? 'Evet, tüm verileriniz şifreli olarak saklanır ve KVKK uyumlu şekilde işlenir.'
                                : 'Yes, all your data is stored encrypted and processed in compliance with data protection regulations.'}
                            colors={colors}
                        />
                        <FAQItem
                            question={isTr ? 'Mobil uygulamayı nasıl güncellerim?' : 'How do I update the mobile app?'}
                            answer={isTr
                                ? 'App Store veya Google Play Store üzerinden otomatik güncellemeleri açabilir veya manuel olarak güncelleyebilirsiniz.'
                                : 'You can enable automatic updates or update manually via the App Store or Google Play Store.'}
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
