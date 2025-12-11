/**
 * Medical Disclaimer Page
 * Comprehensive medical and legal disclaimer with multi-language support (TR/EN)
 * Critical for App Store / Play Store approval and liability protection
 */

import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { AlertTriangle } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';
import { useColorScheme } from '@/components/useColorScheme';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui';

// Translations for Medical Disclaimer
const T = {
    pageTitle: { tr: 'Tıbbi Uyarı', en: 'Medical Disclaimer' },
    headerTitle: { tr: 'ÖNEMLİ TIBBİ UYARI', en: 'IMPORTANT MEDICAL DISCLAIMER' },
    lastUpdated: { tr: 'Son güncelleme', en: 'Last updated' },
    effectiveDate: { tr: 'Yürürlük tarihi', en: 'Effective date' },
    version: { tr: 'Versiyon', en: 'Version' },

    // Warning Box
    warningText: {
        tr: 'Bu uygulama TIBBİ TANI KOYMAZ, TEDAVİ ÖNERİSİ VERMEZ ve bir sağlık profesyonelinin muayenesinin YERİNİ ALMAZ. Sağlık sorunlarınız için mutlaka bir hekime başvurun.',
        en: 'This application DOES NOT PROVIDE MEDICAL DIAGNOSIS, DOES NOT GIVE TREATMENT ADVICE, and DOES NOT REPLACE a healthcare professional\'s examination. Always consult a doctor for your health concerns.'
    },

    // Section 1
    section1Title: { tr: '1. Uygulamanın Amacı ve Kapsamı', en: '1. Purpose and Scope of the Application' },
    section1Content: {
        tr: `1.1 Genel Amaç
Corio Scan, yapay zeka teknolojisi kullanarak cilt lezyonlarının görsel analizine yardımcı olmak amacıyla geliştirilmiş bir mobil uygulamadır. Uygulama, kullanıcılara cilt değişiklikleri hakkında ön bilgi sağlamak ve farkındalık oluşturmak için tasarlanmıştır.

1.2 Uygulama NE DEĞİLDİR
• Bu uygulama bir TIBBİ CİHAZ değildir
• FDA, CE veya Sağlık Bakanlığı onaylı bir tanı aracı değildir
• Tıbbi muayenenin, teşhisin veya tedavinin yerini alamaz
• Dermatoloji uzmanı veya diğer sağlık profesyonellerinin yerini almaz
• Acil tıbbi durumlar için kullanılamaz

1.3 Kullanım Sınırlamaları
Bu uygulama yalnızca bilgilendirme ve farkındalık amaçlıdır. Herhangi bir sağlık kararı vermek için tek başına kullanılmamalıdır.`,
        en: `1.1 General Purpose
Corio Scan is a mobile application developed to assist in visual analysis of skin lesions using artificial intelligence technology. The Application is designed to provide users with preliminary information about skin changes and raise awareness.

1.2 What the Application IS NOT
• This application is NOT a MEDICAL DEVICE
• It is not a diagnostic tool approved by FDA, CE, or Ministry of Health
• It cannot replace medical examination, diagnosis, or treatment
• It does not replace dermatologists or other healthcare professionals
• It cannot be used for medical emergencies

1.3 Usage Limitations
This application is for informational and awareness purposes only. It should not be used alone to make any health decisions.`
    },

    // Section 2
    section2Title: { tr: '2. Yapay Zeka Teknolojisi Sınırlamaları', en: '2. Artificial Intelligence Technology Limitations' },
    section2Content: {
        tr: `2.1 Doğruluk Oranları
Yapay zeka analiz sonuçları:
• %100 doğruluk GARANTİ EDİLMEZ
• Yanlış pozitif (olmayan bir şeyi tespit etme) verebilir
• Yanlış negatif (var olan bir şeyi kaçırma) verebilir
• Görüntü kalitesi, aydınlatma ve açıdan etkilenir
• Cilt rengi, tipi ve diğer bireysel faktörlerden etkilenebilir

2.2 Teknolojik Kısıtlamalar
• AI modelleri belirli veri setleriyle eğitilmiştir
• Nadir hastalıkları tespit etmede sınırlı kalabilir
• Yeni veya atipik prezentasyonları tanıyamayabilir
• Sürekli güncelleme ve iyileştirme sürecindedir

2.3 Görüntü Kalitesi Gereksinimleri
Analiz sonuçlarının güvenilirliği için:
• Net ve odaklanmış görüntüler kullanın
• Yeterli aydınlatma sağlayın
• Yakın ve doğru açıdan çekim yapın
• Filtresiz ve düzenlenmemiş fotoğraflar kullanın`,
        en: `2.1 Accuracy Rates
AI analysis results:
• 100% accuracy is NOT GUARANTEED
• May give false positives (detecting something that doesn't exist)
• May give false negatives (missing something that exists)
• Are affected by image quality, lighting, and angle
• May be affected by skin color, type, and other individual factors

2.2 Technological Limitations
• AI models are trained with specific datasets
• May be limited in detecting rare diseases
• May not recognize new or atypical presentations
• Is under continuous updating and improvement

2.3 Image Quality Requirements
For reliable analysis results:
• Use clear and focused images
• Ensure adequate lighting
• Take photos from close and correct angles
• Use unfiltered and unedited photos`
    },

    // Section 3
    section3Title: { tr: '3. Acil Durumlar İçin Kritik Uyarı', en: '3. Critical Warning for Emergencies' },
    section3Content: {
        tr: `⚠️ ACİL DURUMLAR

Aşağıdaki durumlarda DERHAL 112'yi arayın veya en yakın acil servise gidin:

• Hızla büyüyen veya şekil değiştiren ben/lezyon
• Kanayan veya kabuk bağlamayan yaralar
• Şiddetli kaşıntı, yanma veya ağrı
• Yüz, dudak veya boğazda şişlik (alerjik reaksiyon)
• Ateş eşliğinde döküntü
• Nefes darlığı veya yutma güçlüğü
• Bilinç bulanıklığı veya bayılma

BU UYGULAMA ACİL TIBBİ DURUMLAR İÇİN TASARLANMAMIŞTIR!`,
        en: `⚠️ EMERGENCIES

IMMEDIATELY call emergency services or go to the nearest emergency room in the following situations:

• Rapidly growing or shape-changing mole/lesion
• Bleeding or non-healing wounds
• Severe itching, burning, or pain
• Swelling in face, lips, or throat (allergic reaction)
• Rash accompanied by fever
• Difficulty breathing or swallowing
• Confusion or fainting

THIS APPLICATION IS NOT DESIGNED FOR MEDICAL EMERGENCIES!`
    },

    // Section 4
    section4Title: { tr: '4. Hedef Kullanıcılar ve Kullanım Profilleri', en: '4. Target Users and Usage Profiles' },
    section4Content: {
        tr: `4.1 Genel Kullanıcılar
Genel halk için bu uygulama:
• Cilt sağlığı farkındalığı aracıdır
• Bir doktora danışmayı ne zaman düşünmeniz gerektiğini belirlemenize yardımcı olabilir
• Kendi başınıza tanı koymak için kullanılmamalıdır

4.2 Sağlık Profesyonelleri
Sağlık profesyonelleri için bu uygulama:
• Klinik değerlendirmeye ek bir araç olarak kullanılabilir
• Profesyonel tıbbi yargının yerini ALMAZ
• Nihai tanı ve tedavi kararı her zaman hekimindir
• Mesleki sorumluluk ve etik kurallara tabi kullanılmalıdır`,
        en: `4.1 General Users
For the general public, this application:
• Is a skin health awareness tool
• Can help determine when you should consider consulting a doctor
• Should NOT be used to diagnose yourself

4.2 Healthcare Professionals
For healthcare professionals, this application:
• Can be used as a supplementary tool to clinical evaluation
• Does NOT replace professional medical judgment
• The final diagnosis and treatment decision is always the physician's
• Must be used subject to professional responsibility and ethical rules`
    },

    // Section 5
    section5Title: { tr: '5. Tıbbi Tavsiyeler', en: '5. Medical Advice' },
    section5Content: {
        tr: `5.1 Profesyonel Danışmanlık
Her zaman nitelikli bir sağlık profesyoneline danışmanız gerekir:
• Herhangi bir sağlık endişeniz olduğunda
• Tanı veya tedavi kararları almadan önce
• Mevcut tedavinizi değiştirmeden önce
• İlaç kullanmaya başlamadan veya bırakmadan önce

5.2 Cilt Sağlığı Önerileri
Genel cilt sağlığı için:
• Düzenli cilt muayenesi yapın veya yaptırın
• Güneşten korunma tedbirlerini uygulayın
• Değişiklik gösteren ben veya lezyonları takip edin
• Yıllık dermatolojik kontrolleri aksatmayın`,
        en: `5.1 Professional Consultation
You should always consult a qualified healthcare professional:
• When you have any health concerns
• Before making diagnosis or treatment decisions
• Before changing your current treatment
• Before starting or stopping any medication

5.2 Skin Health Recommendations
For general skin health:
• Perform or have regular skin examinations
• Apply sun protection measures
• Monitor changing moles or lesions
• Don't skip annual dermatological check-ups`
    },

    // Section 6
    section6Title: { tr: '6. Veri Kullanımı ve Gizlilik', en: '6. Data Usage and Privacy' },
    section6Content: {
        tr: `6.1 Sağlık Verilerinin Hassasiyeti
Yüklediğiniz cilt görüntüleri ve sağlık bilgileri özel nitelikli kişisel verilerdir. Bu veriler:
• Şifrelenmiş olarak saklanır
• Yalnızca analiz amacıyla kullanılır
• İzniniz olmadan üçüncü taraflarla paylaşılmaz
• Talep ettiğinizde silinir

6.2 Dikkat Edilmesi Gerekenler
• Başkalarının görüntülerini izinsiz yüklemeyin
• Çocukların görüntüleri için veli izni gereklidir
• Mahrem bölge görüntüleri için ekstra dikkat gösterin
• Görüntülerin yanlış ellere geçme riskini değerlendirin`,
        en: `6.1 Sensitivity of Health Data
The skin images and health information you upload are sensitive personal data. This data:
• Is stored encrypted
• Is used only for analysis purposes
• Is not shared with third parties without your permission
• Is deleted upon your request

6.2 Points to Consider
• Do not upload images of others without permission
• Parental consent is required for children's images
• Exercise extra caution with images of intimate areas
• Evaluate the risk of images falling into wrong hands`
    },

    // Section 7
    section7Title: { tr: '7. Sorumluluk Reddi', en: '7. Disclaimer of Liability' },
    section7Content: {
        tr: `7.1 Genel Sorumluluk Reddi
Corio Scan ve geliştiricileri (Corio Teknoloji A.Ş.) aşağıdaki durumlardan HİÇBİR KOŞULDA SORUMLU TUTULAMAZ:

• Yanlış veya eksik analiz sonuçları
• Kaçırılan veya geciken tanılar
• Yanlış tedavi kararları
• Sağlık durumunuzun kötüleşmesi
• Uygulama sonuçlarına dayanarak alınan kararlar
• Doktor ziyaretinin ertelenmesi veya ihmal edilmesi
• Herhangi bir bedensel zarar, hastalık veya ölüm

7.2 Karar Sorumluluğu
Uygulamayı kullanarak, tüm sağlık kararlarının sizin (veya yetkili sağlık profesyonelinin) sorumluluğunda olduğunu kabul etmiş olursunuz.

7.3 Bilgi Doğruluğu
Uygulama içindeki bilgiler genel bilgilendirme amaçlıdır ve tıbbi tavsiye niteliği taşımaz. Bilgilerin doğruluğu veya güncelliği garanti edilmez.`,
        en: `7.1 General Disclaimer
Corio Scan and its developers (Corio Technology Inc.) CANNOT BE HELD LIABLE UNDER ANY CIRCUMSTANCES for:

• Incorrect or incomplete analysis results
• Missed or delayed diagnoses
• Wrong treatment decisions
• Deterioration of your health condition
• Decisions made based on Application results
• Postponing or neglecting doctor visits
• Any bodily harm, illness, or death

7.2 Decision Responsibility
By using the Application, you acknowledge that all health decisions are your (or the authorized healthcare professional's) responsibility.

7.3 Information Accuracy
Information within the Application is for general informational purposes and does not constitute medical advice. The accuracy or currency of information is not guaranteed.`
    },

    // Section 8
    section8Title: { tr: '8. Yasal Uyarılar', en: '8. Legal Notices' },
    section8Content: {
        tr: `8.1 Düzenleyici Durum
Bu uygulama:
• Türkiye İlaç ve Tıbbi Cihaz Kurumu (TİTCK) tarafından tıbbi cihaz olarak sınıflandırılmamıştır
• FDA (ABD) veya CE (Avrupa) tıbbi cihaz onayına sahip değildir
• Sağlık Bakanlığı onaylı bir tanı aracı değildir

8.2 Mesleki Standartlar
Sağlık profesyonelleri, bu uygulamayı kullanırken:
• Mesleki etik ve deontoloji kurallarına uymak zorundadır
• Malpraktis sorumluluğu tamamen kendilerine aittir
• Uygulama sonuçlarını bağımsız olarak doğrulamalıdır
• Hastalarını uygulamanın sınırlamaları hakkında bilgilendirmelidir`,
        en: `8.1 Regulatory Status
This application:
• Is not classified as a medical device by the Turkish Medicines and Medical Devices Agency (TİTCK)
• Does not have FDA (USA) or CE (Europe) medical device approval
• Is not a diagnostic tool approved by the Ministry of Health

8.2 Professional Standards
Healthcare professionals using this application:
• Must comply with professional ethics and deontology rules
• Bear full malpractice liability themselves
• Must independently verify Application results
• Must inform patients about the Application's limitations`
    },

    // Section 9
    section9Title: { tr: '9. Önemli Hatırlatmalar', en: '9. Important Reminders' },
    section9Content: {
        tr: `LÜTFEN UNUTMAYIN:

✓ Yapay zeka sonuçları yalnızca bir ön değerlendirmedir
✓ Her cilt değişikliği için bir dermatoloğa danışın
✓ "Endişelenecek bir şey yok" sonucu bile %100 güvenilir değildir
✓ Şüphe durumunda mutlaka profesyonel görüş alın
✓ Düzenli cilt kontrollerini ihmal etmeyin
✓ Erken tanı hayat kurtarır - şüphelendiğinizde hekime başvurun

Sağlığınız değerlidir - teknolojiyi bir yardımcı araç olarak kullanın, profesyonel tıbbi bakımın yerini almasına izin vermeyin.`,
        en: `PLEASE REMEMBER:

✓ AI results are only a preliminary assessment
✓ Consult a dermatologist for any skin changes
✓ Even "nothing to worry about" results are not 100% reliable
✓ Always seek professional advice when in doubt
✓ Don't neglect regular skin check-ups
✓ Early detection saves lives - consult a doctor when you're suspicious

Your health is valuable - use technology as a supporting tool, don't let it replace professional medical care.`
    },

    // Section 10
    section10Title: { tr: '10. İletişim', en: '10. Contact' },
    section10Content: {
        tr: `Tıbbi uyarı veya uygulama kullanımı hakkında sorularınız için:

Corio Teknoloji A.Ş.
📧 Genel Destek: support@corioscan.ai
📧 Yasal Sorular: legal@corioscan.ai
🌐 Web: www.corioscan.ai

⚠️ Tıbbi acil durumlar için 112'yi arayın!`,
        en: `For questions about the medical disclaimer or Application usage:

Corio Technology Inc.
📧 General Support: support@corioscan.ai
📧 Legal Questions: legal@corioscan.ai
🌐 Web: www.corioscan.ai

⚠️ For medical emergencies, call emergency services!`
    },
};

export default function MedicalDisclaimerScreen() {
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
                {/* Critical Warning Header */}
                <Card style={{ backgroundColor: colors.warningLight }}>
                    <View style={styles.warningHeader}>
                        <AlertTriangle size={32} color={colors.warning} />
                        <Text style={[styles.warningTitle, { color: colors.warning }]}>
                            {T.headerTitle[language]}
                        </Text>
                    </View>
                    <View style={styles.warningContent}>
                        <Text style={[styles.warningText, { color: colors.warning }]}>
                            {T.warningText[language]}
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

                        <Section title={T.section10Title[language]} colors={colors} isLast>
                            {T.section10Content[language]}
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
    warningHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.lg,
        paddingBottom: 0,
    },
    warningTitle: {
        ...Typography.styles.h3,
        marginLeft: Spacing.md,
        flex: 1,
    },
    warningContent: {
        padding: Spacing.lg,
        paddingTop: Spacing.sm,
    },
    warningText: {
        ...Typography.styles.body,
        fontWeight: '600',
        lineHeight: 22,
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
