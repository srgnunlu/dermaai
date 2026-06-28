/**
 * Privacy Policy Page
 * Comprehensive privacy policy with multi-language support (TR/EN)
 * KVKK and GDPR compliant
 */

import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { Shield } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';
import { useColorScheme } from '@/components/useColorScheme';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui';

// Translations for Privacy Policy
const T = {
    pageTitle: { tr: 'Gizlilik Politikası', en: 'Privacy Policy' },
    headerTitle: { tr: 'Gizlilik Politikası', en: 'Privacy Policy' },
    lastUpdated: { tr: 'Son güncelleme', en: 'Last updated' },
    effectiveDate: { tr: 'Yürürlük tarihi', en: 'Effective date' },
    version: { tr: 'Versiyon', en: 'Version' },

    // Section 1
    section1Title: { tr: '1. Giriş', en: '1. Introduction' },
    section1Content: {
        tr: `Corio Scan ("biz", "bizim") olarak kişisel verilerinizin gizliliğine ve güvenliğine büyük önem veriyoruz. Bu Gizlilik Politikası, Corio Scan mobil uygulaması ("Uygulama") aracılığıyla toplanan kişisel verilerin nasıl işlendiğini, korunduğunu ve haklarınızı açıklamaktadır.

Bu politika, 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK), Avrupa Birliği Genel Veri Koruma Tüzüğü (GDPR) ve diğer ilgili mevzuat kapsamında hazırlanmıştır.`,
        en: `At Corio Scan ("we", "our"), we place great importance on the privacy and security of your personal data. This Privacy Policy explains how personal data collected through the Corio Scan mobile application ("Application") is processed, protected, and your rights.

This policy has been prepared in accordance with the Turkish Personal Data Protection Law (KVKK), the European Union General Data Protection Regulation (GDPR), and other relevant legislation.`
    },

    // Section 2
    section2Title: { tr: '2. Veri Sorumlusu', en: '2. Data Controller' },
    section2Content: {
        tr: `Corio Scan
Adres: İstanbul, Türkiye
E-posta: destek@corioscan.com

Kişisel verilerinizle ilgili tüm sorularınız için yukarıdaki iletişim bilgilerini kullanabilirsiniz.`,
        en: `Corio Scan
Address: Istanbul, Turkey
Email: destek@corioscan.com

You can use the contact information above for all questions regarding your personal data.`
    },

    // Section 3
    section3Title: { tr: '3. Toplanan Kişisel Veriler', en: '3. Personal Data Collected' },
    section3Content: {
        tr: `3.1 Doğrudan Sağladığınız Veriler
• Hesap Bilgileri: Ad, soyad, e-posta adresi ve kimlik sağlayıcı bilgileri
• Profil Bilgileri: Profil fotoğrafı, meslek, uzmanlık alanı
• Sağlık Verileri: Yüklenen cilt/lezyon görselleri, belirti açıklamaları, tıbbi geçmiş notları
• Demografik Veriler: Yaş, cinsiyet, bölge bilgisi
• İletişim Verileri: Destek talepleri, geri bildirimler

3.2 Otomatik Olarak Toplanan Veriler
• Bildirim Verileri: Bildirimleri etkinleştirirseniz push tokenı ve cihaz platformu
• Hizmet Verileri: Analiz sayısı, abonelik durumu, güvenlik ve hata günlükleri
• Teknik Veriler: Sunucu taleplerinde IP adresi ve zaman damgaları

3.3 Özel Nitelikli Kişisel Veriler
Yüklediğiniz sağlık verileri (cilt görselleri, tıbbi geçmiş) KVKK kapsamında "özel nitelikli kişisel veri" olarak kabul edilmektedir ve ek güvenlik önlemleriyle korunmaktadır.`,
        en: `3.1 Data You Directly Provide
• Account Information: Name, surname, email address, and identity-provider information
• Profile Information: Profile photo, profession, specialty
• Health Data: Uploaded skin/lesion images, symptom descriptions, medical history notes
• Demographic Data: Age, gender, region information
• Communication Data: Support requests, feedback

3.2 Automatically Collected Data
• Notification Data: Push token and device platform if you enable notifications
• Service Data: Analysis count, subscription status, security and error logs
• Technical Data: IP address and timestamps in server requests

3.3 Sensitive Personal Data
The health data you upload (skin images, medical history) is considered "sensitive personal data" under KVKK and is protected with additional security measures.`
    },

    // Section 4
    section4Title: { tr: '4. Verilerin Toplanma Yöntemleri', en: '4. Data Collection Methods' },
    section4Content: {
        tr: `Kişisel verileriniz aşağıdaki yöntemlerle toplanmaktadır:

• Uygulama kayıt ve giriş formları
• Profil düzenleme ekranları
• Görsel yükleme ve analiz özellikleri
• Hizmet güvenliği ve hata kayıtları
• Destek ve iletişim kanalları`,
        en: `Your personal data is collected through the following methods:

• Application registration and login forms
• Profile editing screens
• Image upload and analysis features
• Service security and error logs
• Support and communication channels`
    },

    // Section 5
    section5Title: { tr: '5. Verilerin İşlenme Amaçları', en: '5. Purposes of Data Processing' },
    section5Content: {
        tr: `5.1 Temel Hizmetler
• Hesap oluşturma ve yönetimi
• Yapay zeka destekli görsel analiz hizmeti sunma
• Analiz sonuçlarının raporlanması
• Vaka geçmişinin saklanması ve yönetimi

5.2 Hizmet İyileştirme
• Kullanıcı görselleri ve sağlık verileri model eğitimi veya AI iyileştirmesi için kullanılmaz
• Kullanıcı deneyiminin ve hizmet güvenilirliğinin geliştirilmesi
• Teknik sorunların tespit edilmesi ve giderilmesi

5.3 İletişim
• Bildirim gönderimi
• Destek taleplerinin yanıtlanması
• Hizmet güncellemeleri hakkında bilgilendirme

5.4 Yasal Yükümlülükler
• Yasal düzenlemelere uyum
• Denetim ve raporlama gereksinimleri
• Yasal taleplerin karşılanması`,
        en: `5.1 Core Services
• Account creation and management
• Providing AI-powered visual analysis service
• Reporting analysis results
• Storing and managing case history

5.2 Service Improvement
• User images and health data are not used for model training or AI improvement
• Enhancing user experience and service reliability
• Identifying and resolving technical issues

5.3 Communication
• Sending notifications
• Responding to support requests
• Informing about service updates

5.4 Legal Obligations
• Compliance with legal regulations
• Audit and reporting requirements
• Meeting legal requests`
    },

    // Section 6
    section6Title: { tr: '6. Verilerin İşlenme Hukuki Sebepleri', en: '6. Legal Bases for Data Processing' },
    section6Content: {
        tr: `KVKK Madde 5 ve 6 kapsamında verileriniz aşağıdaki hukuki sebeplere dayanılarak işlenmektedir:

• Açık Rızanız: Özel nitelikli kişisel veriler için açık onayınız alınmaktadır
• Sözleşmenin İfası: Hizmet sözleşmesinin yerine getirilmesi
• Yasal Yükümlülük: Kanuni gereksinimlerin karşılanması
• Meşru Menfaat: Hizmet kalitesinin artırılması, güvenlik önlemleri`,
        en: `Under KVKK Articles 5 and 6, your data is processed based on the following legal grounds:

• Your Explicit Consent: Explicit consent is obtained for sensitive personal data
• Performance of Contract: Fulfilling the service agreement
• Legal Obligation: Meeting legal requirements
• Legitimate Interest: Improving service quality, security measures`
    },

    // Section 7
    section7Title: { tr: '7. Veri Güvenliği Önlemleri', en: '7. Data Security Measures' },
    section7Content: {
        tr: `7.1 Teknik Önlemler
• SSL/TLS şifrelemesi (aktarım sırasında)
• Erişim kontrolü ve yetkilendirme sistemleri
• Kimlik doğrulama tokenlarının cihazın güvenli depolamasında saklanması
• Hassas dosyalara kontrollü erişim

7.2 Organizasyonel Önlemler
• Erişim kısıtlamaları ("need-to-know" prensibi)
• Olay müdahale prosedürleri`,
        en: `7.1 Technical Measures
• SSL/TLS encryption (during transmission)
• Access control and authorization systems
• Authentication tokens stored using the device's secure storage
• Controlled access to sensitive files

7.2 Organizational Measures
• Access restrictions ("need-to-know" principle)
• Incident response procedures`
    },

    // Section 8
    section8Title: { tr: '8. Veri Paylaşımı ve Aktarımı', en: '8. Data Sharing and Transfer' },
    section8Content: {
        tr: `8.1 Üçüncü Taraflarla Paylaşım
Verileriniz aşağıdaki koşullarda paylaşılabilir:
• Bulut Hizmet Sağlayıcıları: Veri depolama ve işleme
• AI Servis Sağlayıcıları (OpenAI ve Google Gemini): Kullanıcı tarafından talep edilen görsel ön değerlendirme işlemleri
• Ödeme ve Abonelik Sağlayıcıları (Apple ve RevenueCat): Abonelik yönetimi
• Bildirim Sağlayıcısı (Expo): Kullanıcı tarafından etkinleştirilen bildirimler
• Analitik Araçlar: Anonim kullanım istatistikleri
• Yasal Gereksinimler: Mahkeme kararı veya yasal zorunluluk

8.2 Yurt Dışına Aktarım
Hizmet sağlayıcıların altyapısı nedeniyle verileriniz yurt dışında işlenebilir. Bu aktarım, yürürlükteki mevzuat ve geçerli aktarım mekanizmaları kapsamında gerçekleştirilir.

8.3 Paylaşılmayan Veriler
Kişisel verileriniz hiçbir koşulda:
• Pazarlama amaçlı üçüncü taraflara satılmaz
• Reklam amaçlı kullanılmaz
• İzinsiz olarak paylaşılmaz`,
        en: `8.1 Sharing with Third Parties
Your data may be shared under the following conditions:
• Cloud Service Providers: Data storage and processing
• AI Service Providers (OpenAI and Google Gemini): User-requested visual preliminary assessment
• Payment and Subscription Providers (Apple and RevenueCat): Subscription management
• Notification Provider (Expo): User-enabled notifications
• Analytics Tools: Anonymous usage statistics
• Legal Requirements: Court order or legal obligation

8.2 International Transfer
Your data may be processed outside your country because of service-provider infrastructure. Transfers are handled under applicable law and valid transfer mechanisms.

8.3 Data Not Shared
Your personal data will under no circumstances:
• Be sold to third parties for marketing purposes
• Be used for advertising purposes
• Be shared without permission`
    },

    // Section 9
    section9Title: { tr: '9. Veri Saklama Süreleri', en: '9. Data Retention Periods' },
    section9Content: {
        tr: `9.1 Aktif Hesaplar
• Hesap bilgileri: Hesap aktif olduğu sürece
• Analiz geçmişi: Kullanıcı tercihine bağlı olarak hesap aktif olduğu sürece
• Hizmet ve güvenlik kayıtları: Hizmetin işletilmesi ve yasal yükümlülükler için gerekli süre boyunca

9.2 Hesap Silme Sonrası
• Uygulama hesabına bağlı aktif kayıtlar ve desteklenen yüklenmiş dosyalar silme talebi işlendiğinde silinir
• Hizmet sağlayıcı yedekleri kendi saklama döngüleri içinde silinebilir

9.3 Yasal Saklama
Yasal düzenlemeler gereği bazı veriler belirtilen sürelerde saklanmak zorundadır (örn: mali kayıtlar 10 yıl).`,
        en: `9.1 Active Accounts
• Account information: As long as the account is active
• Analysis history: As long as the account is active, based on user preference
• Service and security logs: For as long as needed to operate the service and meet legal obligations

9.2 After Account Deletion
• Active account-linked records and supported uploaded files are deleted when the deletion request is processed
• Service-provider backups may be removed according to their backup retention cycles

9.3 Legal Retention
Some data must be retained for specified periods due to legal regulations (e.g., financial records for 10 years).`
    },

    // Section 10
    section10Title: { tr: '10. KVKK Kapsamındaki Haklarınız', en: '10. Your Rights Under KVKK/GDPR' },
    section10Content: {
        tr: `6698 sayılı KVKK'nın 11. maddesi kapsamında aşağıdaki haklara sahipsiniz:

• Bilgi Edinme Hakkı: Kişisel verilerinizin işlenip işlenmediğini öğrenme
• Erişim Hakkı: İşlenen verilere erişim ve kopya talep etme
• Düzeltme Hakkı: Eksik veya yanlış verilerin düzeltilmesini isteme
• Silme Hakkı: KVKK'nın 7. maddesi koşullarında verilerin silinmesini isteme
• Taşınabilirlik Hakkı: Verilerinizi yapılandırılmış formatta alma
• İtiraz Hakkı: Otomatik işleme ve profillemeye itiraz etme
• Şikayet Hakkı: Kişisel Verileri Koruma Kurumu'na şikayette bulunma

Haklarınızı kullanmak için destek@corioscan.com adresine yazılı başvuru yapabilirsiniz. Başvurular en geç 30 gün içinde yanıtlanacaktır.`,
        en: `Under Article 11 of KVKK Law No. 6698, you have the following rights:

• Right to Information: Learn whether your personal data is being processed
• Right of Access: Access processed data and request a copy
• Right to Rectification: Request correction of incomplete or incorrect data
• Right to Erasure: Request deletion of data under Article 7 of KVKK
• Right to Data Portability: Receive your data in a structured format
• Right to Object: Object to automated processing and profiling
• Right to Complain: File a complaint with the Personal Data Protection Authority

To exercise your rights, you can submit a written application to destek@corioscan.com. Applications will be answered within 30 days at the latest.`
    },

    // Section 11
    section11Title: { tr: '11. Çocukların Gizliliği', en: '11. Children\'s Privacy' },
    section11Content: {
        tr: `Uygulamamız 18 yaş altı bireylere yönelik değildir. Bilerek 18 yaş altı kişilerden kişisel veri toplamıyoruz.

18 yaş altı bir bireyin verilerinin toplandığını fark ederseniz, lütfen derhal bizimle iletişime geçin. Bu tür verileri tespit ettiğimizde derhal siliyoruz.`,
        en: `Our Application is not intended for individuals under 18 years of age. We do not knowingly collect personal data from persons under 18.

If you become aware that data from a person under 18 has been collected, please contact us immediately. We delete such data immediately upon detection.`
    },

    // Section 12
    section12Title: { tr: '12. Çerezler ve İzleme Teknolojileri', en: '12. Cookies and Tracking Technologies' },
    section12Content: {
        tr: `Mobil Uygulama reklam amaçlı takip çerezleri kullanmaz. Web sürümü, oturum açma ve güvenlik gibi zorunlu işlevler için gerekli oturum teknolojilerini kullanabilir.`,
        en: `The mobile Application does not use advertising tracking cookies. The web version may use session technologies required for sign-in and security.`
    },

    // Section 13
    section13Title: { tr: '13. Politika Değişiklikleri', en: '13. Policy Changes' },
    section13Content: {
        tr: `Bu Gizlilik Politikasını zaman zaman güncelleyebiliriz. Önemli değişiklikler için:

• Uygulama içi bildirim göndereceğiz
• E-posta ile bilgilendirme yapacağız
• Politikayı Uygulama içinde yayınlayacağız

Değişikliklerden sonra Uygulamayı kullanmaya devam etmeniz, güncel politikayı kabul ettiğiniz anlamına gelir.`,
        en: `We may update this Privacy Policy from time to time. For significant changes:

• We will send in-app notifications
• We will inform you via email
• We will publish the policy within the Application

Your continued use of the Application after changes means you accept the updated policy.`
    },

    // Section 14
    section14Title: { tr: '14. İletişim ve Şikayetler', en: '14. Contact and Complaints' },
    section14Content: {
        tr: `Gizlilik Sorularınız İçin:
📧 E-posta: destek@corioscan.com
📧 Genel Destek: destek@corioscan.com
🌐 Web: www.corioscan.com

Kişisel Verileri Koruma Kurumu:
Şikayetlerinizi www.kvkk.gov.tr adresinden iletebilirsiniz.

Yanıt süresi: Talepler en geç 30 gün içinde yanıtlanır.`,
        en: `For Privacy Questions:
📧 Email: destek@corioscan.com
📧 General Support: destek@corioscan.com
🌐 Web: www.corioscan.com

Personal Data Protection Authority:
You can submit complaints at www.kvkk.gov.tr

Response time: Requests are answered within 30 days at the latest.`
    },
};

export default function PrivacyPolicyScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const { language } = useLanguage();

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ title: T.pageTitle[language] }} />

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
                            {T.headerTitle[language]}
                        </Text>
                    </View>
                </Card>

                <Card>
                    <CardContent>
                        <Section title={T.section1Title[language]} colors={colors}>
                            {T.section1Content[language]}
                        </Section>

                        <Section title={T.section2Title[language]} colors={colors}>
                            {T.section2Content[language]}
                        </Section>

                        <Section title={T.section3Title[language]} colors={colors}>
                            {T.section3Content[language]}
                        </Section>

                        <Section title={T.section4Title[language]} colors={colors}>
                            {T.section4Content[language]}
                        </Section>

                        <Section title={T.section5Title[language]} colors={colors}>
                            {T.section5Content[language]}
                        </Section>

                        <Section title={T.section6Title[language]} colors={colors}>
                            {T.section6Content[language]}
                        </Section>

                        <Section title={T.section7Title[language]} colors={colors}>
                            {T.section7Content[language]}
                        </Section>

                        <Section title={T.section8Title[language]} colors={colors}>
                            {T.section8Content[language]}
                        </Section>

                        <Section title={T.section9Title[language]} colors={colors}>
                            {T.section9Content[language]}
                        </Section>

                        <Section title={T.section10Title[language]} colors={colors}>
                            {T.section10Content[language]}
                        </Section>

                        <Section title={T.section11Title[language]} colors={colors}>
                            {T.section11Content[language]}
                        </Section>

                        <Section title={T.section12Title[language]} colors={colors}>
                            {T.section12Content[language]}
                        </Section>

                        <Section title={T.section13Title[language]} colors={colors}>
                            {T.section13Content[language]}
                        </Section>

                        <Section title={T.section14Title[language]} colors={colors} isLast>
                            {T.section14Content[language]}
                        </Section>
                    </CardContent>
                </Card>

                <Text style={[styles.footer, { color: colors.textMuted }]}>
                    {T.lastUpdated[language]}: 25 {language === 'tr' ? 'Haziran' : 'June'} 2026{'\n'}
                    {T.effectiveDate[language]}: 25 {language === 'tr' ? 'Haziran' : 'June'} 2026{'\n'}
                    {T.version[language]}: 1.0
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
        flex: 1,
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
        lineHeight: 24,
    },
    footer: {
        ...Typography.styles.caption,
        textAlign: 'center',
        marginTop: Spacing.lg,
        lineHeight: 20,
    },
});
