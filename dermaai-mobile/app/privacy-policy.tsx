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
        tr: `Corio Scan Geliştiricileri ("Geliştirici", "biz", "bizim") olarak kişisel verilerinizin gizliliğine ve güvenliğine büyük önem veriyoruz. Bu Gizlilik Politikası, Corio Scan mobil uygulaması ("Uygulama") aracılığıyla toplanan kişisel verilerin nasıl işlendiğini, korunduğunu ve haklarınızı açıklamaktadır.

Bu politika, 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK), Avrupa Birliği Genel Veri Koruma Tüzüğü (GDPR) ve diğer ilgili mevzuat kapsamında hazırlanmıştır.`,
        en: `At Corio Scan Developers ("Developer", "we", "our"), we place great importance on the privacy and security of your personal data. This Privacy Policy explains how personal data collected through the Corio Scan mobile application ("Application") is processed, protected, and your rights.

This policy has been prepared in accordance with the Turkish Personal Data Protection Law (KVKK), the European Union General Data Protection Regulation (GDPR), and other relevant legislation.`
    },

    // Section 2
    section2Title: { tr: '2. Veri Sorumlusu', en: '2. Data Controller' },
    section2Content: {
        tr: `Corio Scan Geliştiricileri
Adres: İstanbul, Türkiye
E-posta: destek@corioscan.com

Kişisel verilerinizle ilgili tüm sorularınız için yukarıdaki iletişim bilgilerini kullanabilirsiniz.`,
        en: `Corio Scan Developers
Address: Istanbul, Turkey
Email: destek@corioscan.com

You can use the contact information above for all questions regarding your personal data.`
    },

    // Section 3
    section3Title: { tr: '3. Toplanan Kişisel Veriler', en: '3. Personal Data Collected' },
    section3Content: {
        tr: `3.1 Doğrudan Sağladığınız Veriler
• Hesap Bilgileri: Ad, soyad, e-posta adresi, şifre (şifrelenmiş)
• Profil Bilgileri: Profil fotoğrafı, meslek, uzmanlık alanı
• Sağlık Verileri: Yüklenen cilt/lezyon görselleri, belirti açıklamaları, tıbbi geçmiş notları
• Demografik Veriler: Yaş, cinsiyet, bölge bilgisi
• İletişim Verileri: Destek talepleri, geri bildirimler

3.2 Otomatik Olarak Toplanan Veriler
• Cihaz Bilgileri: Cihaz modeli, işletim sistemi, benzersiz cihaz tanımlayıcısı
• Kullanım Verileri: Uygulama kullanım süresi, tıklanan özellikler, analiz sayısı
• Teknik Veriler: IP adresi, tarayıcı türü, zaman damgaları
• Performans Verileri: Çökme raporları, hata günlükleri

3.3 Özel Nitelikli Kişisel Veriler
Yüklediğiniz sağlık verileri (cilt görselleri, tıbbi geçmiş) KVKK kapsamında "özel nitelikli kişisel veri" olarak kabul edilmektedir ve ek güvenlik önlemleriyle korunmaktadır.`,
        en: `3.1 Data You Directly Provide
• Account Information: Name, surname, email address, password (encrypted)
• Profile Information: Profile photo, profession, specialty
• Health Data: Uploaded skin/lesion images, symptom descriptions, medical history notes
• Demographic Data: Age, gender, region information
• Communication Data: Support requests, feedback

3.2 Automatically Collected Data
• Device Information: Device model, operating system, unique device identifier
• Usage Data: App usage time, clicked features, number of analyses
• Technical Data: IP address, browser type, timestamps
• Performance Data: Crash reports, error logs

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
• Otomatik tanımlama çerezleri (cookies) ve benzeri teknolojiler
• Üçüncü taraf analitik araçları (Firebase Analytics, vb.)
• Destek ve iletişim kanalları`,
        en: `Your personal data is collected through the following methods:

• Application registration and login forms
• Profile editing screens
• Image upload and analysis features
• Automatic identification cookies and similar technologies
• Third-party analytics tools (Firebase Analytics, etc.)
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
• Yapay zeka modellerinin eğitimi ve iyileştirilmesi (anonimleştirilmiş verilerle)
• Kullanıcı deneyiminin geliştirilmesi
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
• Training and improving AI models (with anonymized data)
• Enhancing user experience
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
• AES-256 şifrelemesi (depolama sırasında)
• Güvenli bulut altyapısı
• Düzenli güvenlik açığı taramaları
• Penetrasyon testleri
• Erişim kontrolü ve yetkilendirme sistemleri
• İki faktörlü kimlik doğrulama (2FA) desteği

7.2 Organizasyonel Önlemler
• Çalışan gizlilik eğitimleri
• Erişim kısıtlamaları ("need-to-know" prensibi)
• Veri işleme sözleşmeleri
• Düzenli güvenlik denetimleri
• Olay müdahale prosedürleri`,
        en: `7.1 Technical Measures
• SSL/TLS encryption (during transmission)
• AES-256 encryption (during storage)
• Secure cloud infrastructure
• Regular vulnerability scans
• Penetration testing
• Access control and authorization systems
• Two-factor authentication (2FA) support

7.2 Organizational Measures
• Employee privacy training
• Access restrictions ("need-to-know" principle)
• Data processing agreements
• Regular security audits
• Incident response procedures`
    },

    // Section 8
    section8Title: { tr: '8. Veri Paylaşımı ve Aktarımı', en: '8. Data Sharing and Transfer' },
    section8Content: {
        tr: `8.1 Üçüncü Taraflarla Paylaşım
Verileriniz aşağıdaki koşullarda paylaşılabilir:
• Bulut Hizmet Sağlayıcıları: Veri depolama ve işleme
• AI Servis Sağlayıcıları: Görsel analiz işlemleri
• Analitik Araçlar: Anonim kullanım istatistikleri
• Yasal Gereksinimler: Mahkeme kararı veya yasal zorunluluk

8.2 Yurt Dışına Aktarım
Verileriniz, KVKK'nın 9. maddesi kapsamında yeterli koruma sağlanan ülkelere veya açık rızanız ile diğer ülkelere aktarılabilir. Aktarım yapılan tüm taraflarla veri işleme sözleşmeleri imzalanmaktadır.

8.3 Paylaşılmayan Veriler
Kişisel verileriniz hiçbir koşulda:
• Pazarlama amaçlı üçüncü taraflara satılmaz
• Reklam amaçlı kullanılmaz
• İzinsiz olarak paylaşılmaz`,
        en: `8.1 Sharing with Third Parties
Your data may be shared under the following conditions:
• Cloud Service Providers: Data storage and processing
• AI Service Providers: Visual analysis operations
• Analytics Tools: Anonymous usage statistics
• Legal Requirements: Court order or legal obligation

8.2 International Transfer
Your data may be transferred to countries providing adequate protection under KVKK Article 9 or to other countries with your explicit consent. Data processing agreements are signed with all parties receiving data.

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
• Kullanım verileri: Son 24 ay

9.2 Hesap Silme Sonrası
• Kişisel veriler: 30 gün içinde kalıcı olarak silinir
• Yedeklemeler: 90 gün sonra silinir
• Anonimleştirilmiş istatistiksel veriler: Süresiz saklanabilir

9.3 Yasal Saklama
Yasal düzenlemeler gereği bazı veriler belirtilen sürelerde saklanmak zorundadır (örn: mali kayıtlar 10 yıl).`,
        en: `9.1 Active Accounts
• Account information: As long as the account is active
• Analysis history: As long as the account is active, based on user preference
• Usage data: Last 24 months

9.2 After Account Deletion
• Personal data: Permanently deleted within 30 days
• Backups: Deleted after 90 days
• Anonymized statistical data: May be retained indefinitely

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
        tr: `Uygulama, hizmet kalitesini artırmak için çerezler ve benzeri teknolojiler kullanabilir:

• Zorunlu Çerezler: Uygulamanın çalışması için gerekli
• Analitik Çerezler: Kullanım istatistikleri (devre dışı bırakılabilir)
• Performans Çerezleri: Uygulama performansının izlenmesi

Cihaz ayarlarından çerez tercihlerinizi yönetebilirsiniz.`,
        en: `The Application may use cookies and similar technologies to improve service quality:

• Essential Cookies: Required for the Application to function
• Analytics Cookies: Usage statistics (can be disabled)
• Performance Cookies: Monitoring Application performance

You can manage your cookie preferences through device settings.`
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
                    {T.lastUpdated[language]}: 11 {language === 'tr' ? 'Aralık' : 'December'} 2024{'\n'}
                    {T.effectiveDate[language]}: 11 {language === 'tr' ? 'Aralık' : 'December'} 2024{'\n'}
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
