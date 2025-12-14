/**
 * Terms of Service Page
 * Comprehensive legal terms with multi-language support (TR/EN)
 */

import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { FileText } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';
import { useColorScheme } from '@/components/useColorScheme';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui';

// Translations for Terms of Service
const T = {
    pageTitle: { tr: 'Kullanım Şartları', en: 'Terms of Service' },
    headerTitle: { tr: 'Kullanım Şartları ve Koşulları', en: 'Terms and Conditions' },
    lastUpdated: { tr: 'Son güncelleme', en: 'Last updated' },
    effectiveDate: { tr: 'Yürürlük tarihi', en: 'Effective date' },
    version: { tr: 'Versiyon', en: 'Version' },

    // Section 1
    section1Title: { tr: '1. Giriş ve Kabul', en: '1. Introduction and Acceptance' },
    section1Content: {
        tr: `Corio Scan mobil uygulamasını ("Uygulama") indirerek, yükleyerek veya kullanarak, bu Kullanım Şartları ve Koşullarını ("Şartlar") okuduwğunuzu, anladığınızı ve bunlara bağlı kalmayı kabul ettiğinizi beyan etmiş olursunuz.

Bu Şartları kabul etmiyorsanız, Uygulamayı kullanmamalısınız. Uygulamayı kullanmaya devam etmeniz, Şartlardaki değişiklikleri de kabul ettiğiniz anlamına gelir.

Corio Scan Geliştiricileri ("Geliştirici", "biz", "bizim") bu Şartları herhangi bir zamanda değiştirme hakkını saklı tutar. Değişiklikler, Uygulama içinde yayınlandığı tarihte yürürlüğe girer.`,
        en: `By downloading, installing, or using the Corio Scan mobile application ("Application"), you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions ("Terms").

If you do not accept these Terms, you should not use the Application. Your continued use of the Application signifies your acceptance of any changes to the Terms.

Corio Scan Developers ("Developer", "we", "our") reserves the right to modify these Terms at any time. Changes become effective upon publication within the Application.`
    },

    // Section 2
    section2Title: { tr: '2. Hizmet Tanımı', en: '2. Service Description' },
    section2Content: {
        tr: `Corio Scan, yapay zeka teknolojisi kullanarak dermatolojik görüntülerin analiz edilmesine yardımcı olan bir mobil uygulamadır. Uygulama aşağıdaki hizmetleri sunar:

• Ciltteki lezyonların görsel analizi
• Yapay zeka destekli ön değerlendirme raporları
• Vaka geçmişi yönetimi
• Profesyonel kullanıcılar için değerlendirme destek araçları

ÖNEMLİ UYARI: Bu Uygulama, kesinlikle tıbbi değerlendirme yapmak, tedavi önermek veya bir sağlık profesyonelinin değerlendirmesinin yerini almak amacıyla tasarlanmamıştır. Uygulama yalnızca bilgilendirme ve karar destek aracı olarak kullanılmalıdır.`,
        en: `Corio Scan is a mobile application that helps analyze dermatological images using artificial intelligence technology. The Application offers the following services:

• Visual analysis of skin lesions
• AI-powered preliminary assessment reports
• Case history management
• Assessment support tools for professional users

IMPORTANT WARNING: This Application is not designed to provide medical assessment, recommend treatment, or replace the evaluation of a healthcare professional. The Application should only be used as an informational and decision support tool.`
    },

    // Section 3
    section3Title: { tr: '3. Kullanıcı Yeterliliği ve Hesap', en: '3. User Eligibility and Account' },
    section3Content: {
        tr: `3.1 Yaş Sınırı
Uygulamayı kullanmak için en az 18 yaşında olmanız veya yasal vasinizin onayını almış olmanız gerekmektedir.

3.2 Hesap Oluşturma
Bazı özellikleri kullanmak için hesap oluşturmanız gerekebilir. Hesap oluştururken doğru ve güncel bilgiler vermeyi kabul edersiniz.

3.3 Hesap Güvenliği
• Giriş bilgilerinizi gizli tutmak sizin sorumluluğunuzdadır
• Hesabınızdaki tüm aktivitelerden siz sorumlusunuz
• Yetkisiz erişim şüphesi durumunda derhal bizi bilgilendirmelisiniz
• Hesabınızı üçüncü kişilerle paylaşamazsınız

3.4 Profesyonel Kullanıcılar
Sağlık profesyoneli olarak kayıt oluyorsanız, geçerli bir lisansa sahip olduğunuzu ve mesleki yetkinliğinizi beyan etmiş olursunuz.`,
        en: `3.1 Age Requirement
You must be at least 18 years old or have the consent of your legal guardian to use the Application.

3.2 Account Creation
You may need to create an account to use certain features. You agree to provide accurate and current information when creating an account.

3.3 Account Security
• You are responsible for keeping your login credentials confidential
• You are responsible for all activities on your account
• You must notify us immediately if you suspect unauthorized access
• You may not share your account with third parties

3.4 Professional Users
If you register as a healthcare professional, you represent that you hold a valid license and professional competency.`
    },

    // Section 4
    section4Title: { tr: '4. Kullanım Kuralları', en: '4. Usage Rules' },
    section4Content: {
        tr: `4.1 İzin Verilen Kullanım
• Uygulamayı yalnızca yasal amaçlarla kullanmak
• Kendi sağlık durumunuz veya izin verilen kişiler için kullanmak
• Uygulama arayüzü üzerinden erişim sağlamak

4.2 Yasak Kullanımlar
Aşağıdaki eylemler kesinlikle yasaktır:
• Uygulamayı tersine mühendislik yapmak, kaynak kodunu çıkarmak
• Güvenlik önlemlerini atlatmaya çalışmak
• Zararlı yazılım veya virüs yaymak
• Sahte veya yanıltıcı bilgi yüklemek
• Başkalarının kişisel verilerini izinsiz yüklemek
• Uygulamayı ticari amaçlarla yeniden satmak veya alt lisanslamak
• Otomatik sistemlerle Uygulamaya erişmek (bot, scraper vb.)
• Sunucuları aşırı yükleyecek şekilde kullanmak`,
        en: `4.1 Permitted Use
• Using the Application only for lawful purposes
• Using it for your own health or for authorized individuals
• Accessing through the Application interface

4.2 Prohibited Uses
The following actions are strictly prohibited:
• Reverse engineering or extracting the source code
• Attempting to bypass security measures
• Spreading malware or viruses
• Uploading false or misleading information
• Uploading personal data of others without permission
• Reselling or sublicensing the Application for commercial purposes
• Accessing the Application with automated systems (bots, scrapers, etc.)
• Using in a way that overloads servers`
    },

    // Section 5
    section5Title: { tr: '5. Fikri Mülkiyet Hakları', en: '5. Intellectual Property Rights' },
    section5Content: {
        tr: `5.1 Şirket Hakları
Uygulama ve içeriği (yazılım, tasarım, grafikler, logolar, yapay zeka modelleri, algoritmalar dahil) Şirket veya lisans verenlerinin mülkiyetindedir ve telif hakkı, ticari marka ve diğer fikri mülkiyet yasalarıyla korunmaktadır.

5.2 Sınırlı Lisans
Size, Uygulamayı bu Şartlara uygun olarak kişisel ve ticari olmayan amaçlarla kullanmak için sınırlı, geri alınabilir, münhasır olmayan ve devredilemez bir lisans verilmektedir.

5.3 Kullanıcı İçeriği
Yüklediğiniz görüntüler ve veriler üzerindeki haklarınız size aittir. Ancak, bunları Uygulamaya yükleyerek, Şirkete bu içerikleri işlemek ve analiz etmek için gerekli lisansı vermiş olursunuz.`,
        en: `5.1 Company Rights
The Application and its content (including software, design, graphics, logos, AI models, algorithms) are the property of the Company or its licensors and are protected by copyright, trademark, and other intellectual property laws.

5.2 Limited License
You are granted a limited, revocable, non-exclusive, and non-transferable license to use the Application for personal and non-commercial purposes in accordance with these Terms.

5.3 User Content
You retain the rights to the images and data you upload. However, by uploading them to the Application, you grant the Company the necessary license to process and analyze this content.`
    },

    // Section 6
    section6Title: { tr: '6. Yapay Zeka ve Analiz Sonuçları', en: '6. Artificial Intelligence and Analysis Results' },
    section6Content: {
        tr: `6.1 AI Doğruluğu
Yapay zeka analiz sonuçları:
• %100 doğruluk garantisi vermez
• Tıbbi tanı yerine geçmez
• Sürekli geliştirme altındadır
• Görüntü kalitesinden etkilenebilir

6.2 Klinik Doğrulama
Tüm analiz sonuçları mutlaka bir sağlık profesyoneli tarafından değerlendirilmeli ve doğrulanmalıdır.

6.3 Acil Durumlar
Acil tıbbi durumlar için Uygulamayı kullanmayın. Acil bir sağlık sorunu varsa derhal 112'yi arayın veya en yakın acil servise başvurun.`,
        en: `6.1 AI Accuracy
AI analysis results:
• Do not guarantee 100% accuracy
• Do not replace medical diagnosis
• Are under continuous development
• May be affected by image quality

6.2 Clinical Validation
All analysis results must be evaluated and verified by a healthcare professional.

6.3 Emergencies
Do not use the Application for medical emergencies. If there is an urgent health issue, immediately call emergency services or go to the nearest emergency room.`
    },

    // Section 7
    section7Title: { tr: '7. Sorumluluk Sınırlaması', en: '7. Limitation of Liability' },
    section7Content: {
        tr: `7.1 Garanti Reddi
Uygulama "OLDUĞU GİBİ" ve "MEVCUT OLDUĞU ŞEKİLDE" sunulmaktadır. Şirket, uygulamanın kesintisiz, hatasız veya güvenli olacağına dair açık veya zımni hiçbir garanti vermemektedir.

7.2 Sorumluluk Sınırı
Şirket, aşağıdaki durumlardan sorumlu tutulamaz:
• Yanlış veya eksik analiz sonuçları
• Tedavi gecikmesi veya yanlış tedavi kararları
• Veri kaybı veya güvenlik ihlalleri
• Hizmet kesintileri
• Üçüncü taraf hizmetlerinden kaynaklanan sorunlar
• Dolaylı, özel, arızi veya cezai zararlar

7.3 Maksimum Sorumluluk
Şirketin toplam sorumluluğu, herhangi bir durumda, son 12 ayda Şirkete ödediğiniz tutarı veya 100 TL'yi (hangisi daha yüksekse) aşamaz.`,
        en: `7.1 Disclaimer of Warranty
The Application is provided "AS IS" and "AS AVAILABLE". The Company makes no express or implied warranties that the application will be uninterrupted, error-free, or secure.

7.2 Limitation of Liability
The Company cannot be held responsible for:
• Incorrect or incomplete analysis results
• Treatment delays or wrong treatment decisions
• Data loss or security breaches
• Service interruptions
• Issues arising from third-party services
• Indirect, special, incidental, or punitive damages

7.3 Maximum Liability
The Company's total liability, in any event, cannot exceed the amount you paid to the Company in the last 12 months or $10 (whichever is greater).`
    },

    // Section 8
    section8Title: { tr: '8. Tazminat', en: '8. Indemnification' },
    section8Content: {
        tr: `Bu Şartları ihlal etmeniz, Uygulamayı kötüye kullanmanız veya yüklediğiniz içerikler nedeniyle ortaya çıkabilecek tüm talep, dava, zarar ve masraflardan Şirketi, yöneticilerini, çalışanlarını ve iş ortaklarını tazmin etmeyi ve korumayı kabul edersiniz.`,
        en: `You agree to indemnify and hold harmless the Company, its directors, employees, and business partners from any claims, lawsuits, damages, and expenses that may arise from your violation of these Terms, misuse of the Application, or content you upload.`
    },

    // Section 9
    section9Title: { tr: '9. Hesap Askıya Alma ve Fesih', en: '9. Account Suspension and Termination' },
    section9Content: {
        tr: `9.1 Sizin Tarafınızdan Fesih
Hesabınızı istediğiniz zaman Ayarlar menüsünden veya destek@corioscan.com adresine e-posta göndererek silebilirsiniz.

9.2 Şirket Tarafından Fesih
Şirket, aşağıdaki durumlarda hesabınızı askıya alabilir veya sonlandırabilir:
• Bu Şartların ihlali
• Yasadışı faaliyetler
• Diğer kullanıcılara zarar veren davranışlar
• Uzun süreli hesap inaktivitesi

9.3 Fesih Sonrası
Hesap feshinden sonra verileriniz 30 gün içinde kalıcı olarak silinir. Yasal zorunluluklar gereği bazı veriler daha uzun süre saklanabilir.`,
        en: `9.1 Termination by You
You can delete your account at any time through the Settings menu or by sending an email to destek@corioscan.com.

9.2 Termination by Company
The Company may suspend or terminate your account in the following cases:
• Violation of these Terms
• Illegal activities
• Behavior harmful to other users
• Extended account inactivity

9.3 After Termination
After account termination, your data will be permanently deleted within 30 days. Some data may be retained longer due to legal requirements.`
    },

    // Section 10
    section10Title: { tr: '10. Hizmet Değişiklikleri', en: '10. Service Changes' },
    section10Content: {
        tr: `Şirket, aşağıdaki hakları saklı tutar:

• Uygulamayı güncellemek veya değiştirmek
• Yeni özellikler eklemek veya mevcut özellikleri kaldırmak
• Hizmeti geçici veya kalıcı olarak durdurmak
• Fiyatlandırma veya abonelik modelini değiştirmek

Önemli değişiklikler, Uygulama içi bildirim veya kayıtlı e-posta adresinize gönderilecek bildirim ile duyurulacaktır.`,
        en: `The Company reserves the following rights:

• To update or modify the Application
• To add new features or remove existing features
• To temporarily or permanently discontinue the service
• To change pricing or subscription models

Significant changes will be announced through in-app notifications or notifications sent to your registered email address.`
    },

    // Section 11
    section11Title: { tr: '11. Üçüncü Taraf Hizmetleri', en: '11. Third-Party Services' },
    section11Content: {
        tr: `Uygulama, üçüncü taraf hizmetlerini kullanabilir (bulut depolama, analitik, AI servisleri vb.). Bu hizmetlerin kullanımı, ilgili üçüncü tarafların şartlarına ve gizlilik politikalarına tabidir.

Şirket, üçüncü taraf hizmetlerinin performansından veya kesintilerinden sorumlu değildir.`,
        en: `The Application may use third-party services (cloud storage, analytics, AI services, etc.). The use of these services is subject to the terms and privacy policies of the respective third parties.

The Company is not responsible for the performance or interruptions of third-party services.`
    },

    // Section 12
    section12Title: { tr: '12. Uygulanacak Hukuk ve Uyuşmazlık Çözümü', en: '12. Governing Law and Dispute Resolution' },
    section12Content: {
        tr: `12.1 Uygulanacak Hukuk
Bu Şartlar, Türkiye Cumhuriyeti kanunlarına göre yorumlanacak ve uygulanacaktır.

12.2 Yargı Yetkisi
Bu Şartlardan kaynaklanan tüm uyuşmazlıklar için İstanbul (Çağlayan) Mahkemeleri ve İcra Daireleri münhasır yetkilidir.

12.3 Bölünebilirlik
Bu Şartların herhangi bir hükmünün geçersiz veya uygulanamaz bulunması durumunda, diğer hükümler tam olarak yürürlükte kalmaya devam edecektir.`,
        en: `12.1 Governing Law
These Terms shall be interpreted and applied in accordance with the laws of the Republic of Turkey.

12.2 Jurisdiction
Istanbul (Çağlayan) Courts and Enforcement Offices have exclusive jurisdiction for all disputes arising from these Terms.

12.3 Severability
If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions shall continue in full force and effect.`
    },

    // Section 13
    section13Title: { tr: '13. Genel Hükümler', en: '13. General Provisions' },
    section13Content: {
        tr: `13.1 Tam Anlaşma
Bu Şartlar, Gizlilik Politikası ve Tıbbi Uyarı birlikte, sizinle Şirket arasındaki tam anlaşmayı oluşturur.

13.2 Feragat
Şirketin bu Şartların herhangi bir hükmünü uygulamaması, o haktan feragat ettiği anlamına gelmez.

13.3 Devir
Bu Şartlar kapsamındaki haklarınızı Şirketin yazılı onayı olmadan devredemezsiniz.`,
        en: `13.1 Entire Agreement
These Terms, along with the Privacy Policy and Medical Disclaimer, constitute the entire agreement between you and the Company.

13.2 Waiver
The Company's failure to enforce any provision of these Terms does not constitute a waiver of that right.

13.3 Assignment
You may not transfer your rights under these Terms without the written consent of the Company.`
    },

    // Section 14
    section14Title: { tr: '14. İletişim Bilgileri', en: '14. Contact Information' },
    section14Content: {
        tr: `Bu Kullanım Şartları ile ilgili sorularınız için:

Corio Scan Geliştiricileri
📧 Destek: destek@corioscan.com
🌐 Web: www.corioscan.com

Yanıt süresi: İş günlerinde 48 saat içinde`,
        en: `For questions regarding these Terms of Service:

Corio Scan Developers
📧 Support: destek@corioscan.com
🌐 Web: www.corioscan.com

Response time: Within 48 hours on business days`
    },
};

export default function TermsOfServiceScreen() {
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
                        <FileText size={32} color={colors.primary} />
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
