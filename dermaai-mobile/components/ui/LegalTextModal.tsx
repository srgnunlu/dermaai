/**
 * LegalTextModal Component
 * Modal for displaying Privacy Policy and Terms of Service in-app
 * Content matches the full legal pages exactly
 */

import React from 'react';
import {
    View,
    Text,
    Modal,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Platform,
    Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { X, Shield, FileText } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';
import { useColorScheme } from '@/components/useColorScheme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type LegalType = 'privacy' | 'terms';
type Language = 'tr' | 'en';

interface LegalTextModalProps {
    visible: boolean;
    onClose: () => void;
    type: LegalType;
    language: Language;
}

// Privacy Policy Translations (matches privacy-policy.tsx)
const PRIVACY_T = {
    pageTitle: { tr: 'Gizlilik Politikası', en: 'Privacy Policy' },
    headerTitle: { tr: 'Gizlilik Politikası', en: 'Privacy Policy' },
    lastUpdated: { tr: 'Son güncelleme', en: 'Last updated' },
    effectiveDate: { tr: 'Yürürlük tarihi', en: 'Effective date' },
    version: { tr: 'Versiyon', en: 'Version' },

    section1Title: { tr: '1. Giriş', en: '1. Introduction' },
    section1Content: {
        tr: `Corio Teknoloji A.Ş. ("Şirket", "biz", "bizim") olarak kişisel verilerinizin gizliliğine ve güvenliğine büyük önem veriyoruz. Bu Gizlilik Politikası, Corio Scan mobil uygulaması ("Uygulama") aracılığıyla toplanan kişisel verilerin nasıl işlendiğini, korunduğunu ve haklarınızı açıklamaktadır.

Bu politika, 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK), Avrupa Birliği Genel Veri Koruma Tüzüğü (GDPR) ve diğer ilgili mevzuat kapsamında hazırlanmıştır.`,
        en: `At Corio Technology Inc. ("Company", "we", "our"), we place great importance on the privacy and security of your personal data. This Privacy Policy explains how personal data collected through the Corio Scan mobile application ("Application") is processed, protected, and your rights.

This policy has been prepared in accordance with the Turkish Personal Data Protection Law (KVKK), the European Union General Data Protection Regulation (GDPR), and other relevant legislation.`
    },

    section2Title: { tr: '2. Veri Sorumlusu', en: '2. Data Controller' },
    section2Content: {
        tr: `Corio Teknoloji A.Ş.
Adres: İstanbul, Türkiye
E-posta: destek@corioscan.com

Kişisel verilerinizle ilgili tüm sorularınız için yukarıdaki iletişim bilgilerini kullanabilirsiniz.`,
        en: `Corio Technology Inc.
Address: Istanbul, Turkey
Email: destek@corioscan.com

You can use the contact information above for all questions regarding your personal data.`
    },

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

    section11Title: { tr: '11. Çocukların Gizliliği', en: '11. Children\'s Privacy' },
    section11Content: {
        tr: `Uygulamamız 18 yaş altı bireylere yönelik değildir. Bilerek 18 yaş altı kişilerden kişisel veri toplamıyoruz.

18 yaş altı bir bireyin verilerinin toplandığını fark ederseniz, lütfen derhal bizimle iletişime geçin. Bu tür verileri tespit ettiğimizde derhal siliyoruz.`,
        en: `Our Application is not intended for individuals under 18 years of age. We do not knowingly collect personal data from persons under 18.

If you become aware that data from a person under 18 has been collected, please contact us immediately. We delete such data immediately upon detection.`
    },

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

// Terms of Service Translations (matches terms-of-service.tsx)
const TERMS_T = {
    pageTitle: { tr: 'Kullanım Şartları', en: 'Terms of Service' },
    headerTitle: { tr: 'Kullanım Şartları ve Koşulları', en: 'Terms and Conditions' },
    lastUpdated: { tr: 'Son güncelleme', en: 'Last updated' },
    effectiveDate: { tr: 'Yürürlük tarihi', en: 'Effective date' },
    version: { tr: 'Versiyon', en: 'Version' },

    section1Title: { tr: '1. Giriş ve Kabul', en: '1. Introduction and Acceptance' },
    section1Content: {
        tr: `Corio Scan mobil uygulamasını ("Uygulama") indirerek, yükleyerek veya kullanarak, bu Kullanım Şartları ve Koşullarını ("Şartlar") okuduğunuzu, anladığınızı ve bunlara bağlı kalmayı kabul ettiğinizi beyan etmiş olursunuz.

Bu Şartları kabul etmiyorsanız, Uygulamayı kullanmamalısınız. Uygulamayı kullanmaya devam etmeniz, Şartlardaki değişiklikleri de kabul ettiğiniz anlamına gelir.

Corio Teknoloji A.Ş. ("Şirket", "biz", "bizim") bu Şartları herhangi bir zamanda değiştirme hakkını saklı tutar. Değişiklikler, Uygulama içinde yayınlandığı tarihte yürürlüğe girer.`,
        en: `By downloading, installing, or using the Corio Scan mobile application ("Application"), you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions ("Terms").

If you do not accept these Terms, you should not use the Application. Your continued use of the Application signifies your acceptance of any changes to the Terms.

Corio Technology Inc. ("Company", "we", "our") reserves the right to modify these Terms at any time. Changes become effective upon publication within the Application.`
    },

    section2Title: { tr: '2. Hizmet Tanımı', en: '2. Service Description' },
    section2Content: {
        tr: `Corio Scan, yapay zeka teknolojisi kullanarak dermatolojik görüntülerin analiz edilmesine yardımcı olan bir mobil uygulamadır. Uygulama aşağıdaki hizmetleri sunar:

• Ciltteki lezyonların görsel analizi
• Yapay zeka destekli ön değerlendirme raporları
• Vaka geçmişi yönetimi
• Profesyonel kullanıcılar için tanı destek araçları

ÖNEMLİ UYARI: Bu Uygulama, kesinlikle tıbbi tanı koymak, tedavi önermek veya bir sağlık profesyonelinin değerlendirmesinin yerini almak amacıyla tasarlanmamıştır. Uygulama yalnızca bilgilendirme ve karar destek aracı olarak kullanılmalıdır.`,
        en: `Corio Scan is a mobile application that helps analyze dermatological images using artificial intelligence technology. The Application offers the following services:

• Visual analysis of skin lesions
• AI-powered preliminary assessment reports
• Case history management
• Diagnostic support tools for professional users

IMPORTANT WARNING: This Application is not designed to provide medical diagnosis, recommend treatment, or replace the evaluation of a healthcare professional. The Application should only be used as an informational and decision support tool.`
    },

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

    section8Title: { tr: '8. Tazminat', en: '8. Indemnification' },
    section8Content: {
        tr: `Bu Şartları ihlal etmeniz, Uygulamayı kötüye kullanmanız veya yüklediğiniz içerikler nedeniyle ortaya çıkabilecek tüm talep, dava, zarar ve masraflardan Şirketi, yöneticilerini, çalışanlarını ve iş ortaklarını tazmin etmeyi ve korumayı kabul edersiniz.`,
        en: `You agree to indemnify and hold harmless the Company, its directors, employees, and business partners from any claims, lawsuits, damages, and expenses that may arise from your violation of these Terms, misuse of the Application, or content you upload.`
    },

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

    section11Title: { tr: '11. Üçüncü Taraf Hizmetleri', en: '11. Third-Party Services' },
    section11Content: {
        tr: `Uygulama, üçüncü taraf hizmetlerini kullanabilir (bulut depolama, analitik, AI servisleri vb.). Bu hizmetlerin kullanımı, ilgili üçüncü tarafların şartlarına ve gizlilik politikalarına tabidir.

Şirket, üçüncü taraf hizmetlerinin performansından veya kesintilerinden sorumlu değildir.`,
        en: `The Application may use third-party services (cloud storage, analytics, AI services, etc.). The use of these services is subject to the terms and privacy policies of the respective third parties.

The Company is not responsible for the performance or interruptions of third-party services.`
    },

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

    section14Title: { tr: '14. İletişim Bilgileri', en: '14. Contact Information' },
    section14Content: {
        tr: `Bu Kullanım Şartları ile ilgili sorularınız için:

Corio Teknoloji A.Ş.
📧 E-posta: destek@corioscan.com
📧 Destek: destek@corioscan.com
🌐 Web: www.corioscan.com

Yanıt süresi: İş günlerinde 48 saat içinde`,
        en: `For questions regarding these Terms of Service:

Corio Technology Inc.
📧 Email: destek@corioscan.com
📧 Support: destek@corioscan.com
🌐 Web: www.corioscan.com

Response time: Within 48 hours on business days`
    },
};

// Build sections array from translation objects
function buildPrivacySections(language: Language) {
    return [
        { title: PRIVACY_T.section1Title[language], content: PRIVACY_T.section1Content[language] },
        { title: PRIVACY_T.section2Title[language], content: PRIVACY_T.section2Content[language] },
        { title: PRIVACY_T.section3Title[language], content: PRIVACY_T.section3Content[language] },
        { title: PRIVACY_T.section4Title[language], content: PRIVACY_T.section4Content[language] },
        { title: PRIVACY_T.section5Title[language], content: PRIVACY_T.section5Content[language] },
        { title: PRIVACY_T.section6Title[language], content: PRIVACY_T.section6Content[language] },
        { title: PRIVACY_T.section7Title[language], content: PRIVACY_T.section7Content[language] },
        { title: PRIVACY_T.section8Title[language], content: PRIVACY_T.section8Content[language] },
        { title: PRIVACY_T.section9Title[language], content: PRIVACY_T.section9Content[language] },
        { title: PRIVACY_T.section10Title[language], content: PRIVACY_T.section10Content[language] },
        { title: PRIVACY_T.section11Title[language], content: PRIVACY_T.section11Content[language] },
        { title: PRIVACY_T.section12Title[language], content: PRIVACY_T.section12Content[language] },
        { title: PRIVACY_T.section13Title[language], content: PRIVACY_T.section13Content[language] },
        { title: PRIVACY_T.section14Title[language], content: PRIVACY_T.section14Content[language] },
    ];
}

function buildTermsSections(language: Language) {
    return [
        { title: TERMS_T.section1Title[language], content: TERMS_T.section1Content[language] },
        { title: TERMS_T.section2Title[language], content: TERMS_T.section2Content[language] },
        { title: TERMS_T.section3Title[language], content: TERMS_T.section3Content[language] },
        { title: TERMS_T.section4Title[language], content: TERMS_T.section4Content[language] },
        { title: TERMS_T.section5Title[language], content: TERMS_T.section5Content[language] },
        { title: TERMS_T.section6Title[language], content: TERMS_T.section6Content[language] },
        { title: TERMS_T.section7Title[language], content: TERMS_T.section7Content[language] },
        { title: TERMS_T.section8Title[language], content: TERMS_T.section8Content[language] },
        { title: TERMS_T.section9Title[language], content: TERMS_T.section9Content[language] },
        { title: TERMS_T.section10Title[language], content: TERMS_T.section10Content[language] },
        { title: TERMS_T.section11Title[language], content: TERMS_T.section11Content[language] },
        { title: TERMS_T.section12Title[language], content: TERMS_T.section12Content[language] },
        { title: TERMS_T.section13Title[language], content: TERMS_T.section13Content[language] },
        { title: TERMS_T.section14Title[language], content: TERMS_T.section14Content[language] },
    ];
}

export function LegalTextModal({ visible, onClose, type, language }: LegalTextModalProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    const T = type === 'privacy' ? PRIVACY_T : TERMS_T;
    const sections = type === 'privacy' ? buildPrivacySections(language) : buildTermsSections(language);
    const Icon = type === 'privacy' ? Shield : FileText;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
                    {/* Header */}
                    <View style={styles.headerWrapper}>
                        {Platform.OS === 'ios' ? (
                            <BlurView intensity={80} tint="light" style={styles.headerBlur}>
                                <View style={styles.headerContent}>
                                    <View style={styles.headerLeft}>
                                        <Icon size={24} color={colors.primary} />
                                        <Text style={[styles.headerTitle, { color: colors.text }]}>
                                            {T.headerTitle[language]}
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={onClose}
                                        style={[styles.closeButton, { backgroundColor: colors.backgroundSecondary }]}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        <X size={20} color={colors.textSecondary} />
                                    </TouchableOpacity>
                                </View>
                            </BlurView>
                        ) : (
                            <View style={[styles.headerAndroid, { backgroundColor: colors.backgroundSecondary }]}>
                                <View style={styles.headerContent}>
                                    <View style={styles.headerLeft}>
                                        <Icon size={24} color={colors.primary} />
                                        <Text style={[styles.headerTitle, { color: colors.text }]}>
                                            {T.headerTitle[language]}
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={onClose}
                                        style={[styles.closeButton, { backgroundColor: colors.border }]}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        <X size={20} color={colors.textSecondary} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Content */}
                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {sections.map((section, index) => (
                            <View key={index} style={[styles.section, index < sections.length - 1 && styles.sectionBorder, { borderColor: colors.borderLight }]}>
                                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                    {section.title}
                                </Text>
                                <Text style={[styles.sectionContent, { color: colors.textSecondary }]}>
                                    {section.content}
                                </Text>
                            </View>
                        ))}

                        <Text style={[styles.footer, { color: colors.textMuted }]}>
                            {T.lastUpdated[language]}: 11 {language === 'tr' ? 'Aralık' : 'December'} 2024{'\n'}
                            {T.effectiveDate[language]}: 11 {language === 'tr' ? 'Aralık' : 'December'} 2024{'\n'}
                            {T.version[language]}: 1.0
                        </Text>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        height: SCREEN_HEIGHT * 0.9,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        overflow: 'hidden',
    },
    headerWrapper: {
        zIndex: 10,
    },
    headerBlur: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        overflow: 'hidden',
    },
    headerAndroid: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        paddingTop: Spacing.lg,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        flex: 1,
    },
    headerTitle: {
        ...Typography.styles.h4,
        fontWeight: '600',
        flex: 1,
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: Spacing.lg,
        paddingBottom: Spacing['4xl'],
    },
    section: {
        paddingVertical: Spacing.md,
    },
    sectionBorder: {
        borderBottomWidth: 1,
    },
    sectionTitle: {
        ...Typography.styles.h5,
        fontWeight: '600',
        marginBottom: Spacing.sm,
    },
    sectionContent: {
        ...Typography.styles.body,
        lineHeight: 24,
    },
    footer: {
        ...Typography.styles.caption,
        textAlign: 'center',
        marginTop: Spacing.xl,
        lineHeight: 20,
    },
});
