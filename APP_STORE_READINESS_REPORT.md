# Corio Scan App Store Hazirlik Denetimi

> Status update, 2026-06-08: The code-level blockers in this original audit have been implemented. Use `dermaai-mobile/docs/APP_STORE_SUBMISSION.md` for the current checklist. Apple Developer, App Store Connect, RevenueCat, TestFlight, and final legal-identity tasks remain external/deferred.

Denetim tarihi: 2026-06-08
Kapsam: `dermaai-mobile` iOS/Expo uygulamasi, ilgili backend auth/subscription/delete akislari ve yayina hazirlik dosyalari.
Sonuc: **App Store'a gonderime hazir degil.** Teknik olarak JS bundle alinabiliyor ve tip kontrolu geciyor, fakat Apple incelemesinde ret veya ciddi gecikme yaratacak eksikler var.

## Resmi Apple Dayanaklari

- App Review Guidelines: <https://developer.apple.com/app-store/review/guidelines/>
- Account deletion guidance: <https://developer.apple.com/support/offering-account-deletion-in-your-app>
- App privacy details: <https://developer.apple.com/app-store/app-privacy-details/>
- App Store Connect app privacy: <https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy>
- Required reason API / privacy manifest: <https://developer.apple.com/documentation/bundleresources/describing-use-of-required-reason-api>
- Auto-renewable subscriptions: <https://developer.apple.com/app-store/subscriptions/>
- App Store Connect subscription setup: <https://developer.apple.com/help/app-store-connect/manage-subscriptions/offer-auto-renewable-subscriptions/>
- App Review information / demo account: <https://developer.apple.com/help/app-store-connect/reference/app-review-information>
- 2026 SDK requirement: <https://developer.apple.com/news/upcoming-requirements/>

## Durum Ozeti

| Alan | Durum | Not |
| --- | --- | --- |
| TypeScript | Gecti | `pnpm check` hatasiz. |
| JS export | Gecti | `npx expo export --platform ios` basarili. |
| Expo doctor | Basarisiz | 5 Expo paketi SDK 54 beklenen patch seviyesinin gerisinde. |
| Native iOS build | Dogrulanamadi | Yerel Xcode iOS 26.5 platformunu bulamadi. |
| EAS/App Store release config | Eksik | `eas.json` yok. |
| Apple zorunlu login | Eksik | Google login var, Sign in with Apple yok. |
| App icon/splash | Uygun degil | Expo hedef/izgara placeholder gorselleri duruyor. |
| IAP/subscription | Eksik/riskli | Hardcoded fiyat, eksik yasal linkler, RevenueCat anahtarlari bos olabilir. |
| Privacy/App Store data disclosure | Eksik/riskli | Privacy manifest veri toplamini bos gosteriyor; uygulama hassas saglik verisi topluyor. |
| Account deletion | Kismen var | UI/API var, fakat tum veriyi ve aktif abonelik bilgisini kapsadigi kanitli degil. |
| Medikal iddialar | Yuksek risk | Tanisal dil, confidence skorlari ve dogruluk/metodoloji dokumani eksik. |
| Destek | Eksik | Uygulama ici destek formu mesaj gondermeden basarili diyor. |

## Ret Engelleri

### 1. Sign in with Apple yok

Apple Guideline 4.8'e gore Google gibi ucuncu taraf sosyal login ile hesap olusturuluyorsa iOS uygulamasinda esdeger bir Apple login secenegi sunulmasi gerekir. Mevcut login ekrani sadece Google OAuth akisi aciyor:

- `dermaai-mobile/app/(auth)/login.tsx`: `WebBrowser.openAuthSessionAsync` ile `/api/auth/google?mobile=true` kullaniliyor.
- `dermaai-mobile/package.json`: `expo-apple-authentication` yok.
- Backend'de Google mobile exchange var, Apple token dogrulama endpoint'i yok.

Yapilacaklar:

1. `expo-apple-authentication` ekle.
2. Login ekranina Google ile ayni agirlikta "Sign in with Apple" butonu koy.
3. Backend'e Apple identity token dogrulama ve mevcut kullanici eslestirme ekle.
4. Apple Private Relay email senaryosunu destekle.
5. Hesap silmede Apple token revoke gerekiyorsa uygulamaya dahil et.

### 2. Uygulama ikonu ve splash placeholder

`dermaai-mobile/assets/images/icon.png`, `adaptive-icon.png` ve `splash-icon.png` gercek marka gorseli degil; Expo hedef/izgara placeholder gorselleri. Bu, Apple Guideline 2.1 "App Completeness" ve genel profesyonel kalite beklentisi acisindan ciddi ret riskidir.

Dosya kaniti:

- `dermaai-mobile/app.json`: icon `./assets/images/icon.png`, splash `./assets/images/splash-icon.png`.
- Gorsel denetimi: 1024x1024 boyut dogru, ancak icerik placeholder.

Yapilacaklar:

1. 1024x1024, alpha icermeyen, marka kimligi olan App Store ikonunu uret.
2. Splash icin ayni marka sisteminden sade, okunakli gorsel hazirla.
3. iPhone dark/light gorunumde test et.
4. App Store screenshotlariyla marka tutarliligini dogrula.

### 3. Eksik notification icon asset'i

`dermaai-mobile/app.json` icinde `expo-notifications` plugin'i `./assets/images/notification-icon.png` dosyasini referans ediyor; dosya yok.

Yapilacaklar:

1. `assets/images/notification-icon.png` ekle ya da plugin konfigunden kaldir.
2. Android icin monochrome bildirim ikon kalitesini ayrica test et.
3. EAS build oncesi `npx expo prebuild --clean --platform ios` ve `npx expo prebuild --clean --platform android` ile dogrula.

### 4. IAP/subscription ekranlari App Store beklentilerine hazir degil

Uygulama dijital premium ozellik satiyor; bu Apple In-App Purchase ile yapilmali. Kodda `react-native-purchases` var, ancak paywall:

- Fiyatlari hardcoded gosteriyor: `PaywallModal.tsx` icinde `₺79.99`, `$4.99`, vb.
- RevenueCat offerings'ten gelen localized price kullanilmiyor.
- Paywall altinda abonelik kosullari sadece kisa bir metin; Privacy Policy ve Terms linkleri yok.
- Hesap silme sirasinda aktif aboneligin Apple uzerinden devam edebilecegi ve kullanicinin aboneligi iptal etmesi gerektigi anlatilmiyor.
- `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY` bos kalirsa satin alma devre disi kaliyor.

Yapilacaklar:

1. App Store Connect'te tek subscription group olustur: Basic monthly/yearly, Pro monthly/yearly.
2. Product ID'leri kodla birebir eslestir: `corio_basic_monthly`, `corio_basic_yearly`, `corio_pro_monthly`, `corio_pro_yearly`.
3. Paywall fiyatlarini RevenueCat/StoreKit localized price kaynagindan oku.
4. Subscribe ekraninda otomatik yenileme, sure, fiyat, iptal yonetimi, Terms ve Privacy linklerini goster.
5. Restore purchases akisini sandbox/TestFlight'ta test et.
6. RevenueCat webhook secret ve App Store Server Notification entegrasyonunu production'da dogrula.

### 5. Gizlilik beyanlari uygulama davranisiyla tutarsiz

Uygulama saglik verisi, cilt gorseli, belirti, tibbi gecmis, profil, push token ve teknik veri topluyor. Buna ragmen iOS privacy manifest `NSPrivacyCollectedDataTypes` alanini bos gosteriyor. App Store Connect Privacy Nutrition Label da bu kapsamda eksiksiz doldurulmali.

Dosya kaniti:

- `dermaai-mobile/ios/CorioScan/PrivacyInfo.xcprivacy`: `NSPrivacyCollectedDataTypes` bos.
- `dermaai-mobile/app/privacy-policy.tsx`: saglik verisi, cihaz bilgisi, IP, kullanim verisi toplandigini yaziyor.
- `server/routes.ts` ve `server/mobileAuth.ts`: auth, upload, push token, subscription ve analiz akislari var.

Yapilacaklar:

1. App Store Connect Privacy formunda en az su kategorileri degerlendir: Health & Fitness, User Content/Photos, Contact Info, Identifiers, Purchases, Usage Data, Diagnostics.
2. Hangi verinin kullaniciya bagli oldugunu, tracking amacli olup olmadigini ve ucuncu taraflarla paylasilip paylasilmadigini netlestir.
3. `PrivacyInfo.xcprivacy` dosyasini uygulamanin gercek veri toplama pratigiyle uyumlu hale getir.
4. Privacy policy'deki yanlis/kanıtlanmamis iddialari kaldir: parola saklama, Firebase Analytics, AES-256 at-rest, 2FA, penetrasyon testi, calisan egitimi gibi repo tarafindan kanitlanmayan ifadeler.

### 6. Medikal uygulama olarak metodoloji/validasyon eksik

Apple Guideline 1.4.1 medikal uygulamalari daha siki inceler. Uygulama "diagnosis", "confidence", "AI dermatological analysis", "high accuracy" gibi tanisal algi olusturan ifadeler kullaniyor. Disclaimer var; bu iyi, fakat tek basina yeterli degil.

Riskli noktalar:

- Sonuc kartinda tani adi ve yuzdelik confidence gosteriliyor.
- FAQ'da "AI modellerimiz yuksek dogruluk oranina sahip" deniyor.
- Teknik dokumanda "medical decisions" ve accuracy improvement dili var.
- FDA/CE/TITCK onayi olmadigi soyleniyor; buna ragmen urun deneyimi tani hissi veriyor.

Yapilacaklar:

1. UI metinlerini "diagnosis/tani" yerine "preliminary assessment/on degerlendirme" diline cek.
2. Confidence yuzdesini "model confidence" olarak acikla; klinik dogruluk gibi sunma.
3. App Review Notes'a metodoloji ozeti, limitasyonlar, veri kaynaklari ve doktor kontrolu uyarilarini ekle.
4. Regulator onayi yoksa App Store metadata ve screenshotlarda "diagnose", "detect cancer", "treat" gibi iddialardan kac.
5. Acil durum yonlendirmelerini ilk consent, sonuc ve urgent notification akislari boyunca gorunur tut.

## Yuksek Riskli Eksikler

### Account deletion kismen uygulanmis

UI'da hesap silme var ve `/api/auth/mobile/delete-account` endpoint'i cagriliyor. Ancak Apple rehberi, tum hesap kaydinin ve iliskili kisisel verilerin silinmesini, aktif abonelik varsa kullanicinin bilgilendirilmesini bekliyor.

Eksikler:

- `storage.deleteUser()` sadece `cases`, `userSettings`, `users` siliyor.
- `patients` tablosu kullaniciya dogrudan bagli degil; kullanici vakalari silinince hasta kayitlari orphan kalabilir.
- Yuklenen Cloudinary/local image dosyalari silinmiyor.
- RevenueCat customer/subscription eslestirmesi silinmiyor veya anonimlestirilmiyor.
- Aktif abonelik icin `https://apps.apple.com/account/subscriptions` yonlendirmesi yok.

Yapilacaklar:

1. Silme modelini tablo ve dosya seviyesinde yeniden tasarla.
2. `patients` icin ownership kur ya da kullanicinin hasta kayitlarini sil.
3. Cloudinary/local upload cleanup ekle.
4. RevenueCat alias/customer metadata cleanup stratejisi belirle.
5. Hesap silme onay ekranina aktif abonelik ve Apple subscription management linki ekle.

### Destek formu gercek destek akisi degil

`dermaai-mobile/app/contact-support.tsx` formu mesaj gondermeden 1.5 saniye bekliyor ve basari mesaji gosteriyor. Apple 2.1 kapsaminda placeholder/fake fonksiyon ret riski tasir.

Yapilacaklar:

1. Ya formu kaldirip yalnizca mailto/support URL birak.
2. Ya da backend'e gercek support ticket/email endpoint'i ekle.
3. App Store Connect Support URL ile uygulama ici destek kanalini tutarli hale getir.

### Yayina tekrarlanabilir build sistemi eksik

`dermaai-mobile` icinde `eas.json` yok. `ios/` klasoru `.gitignore` ile yok sayiliyor; buna ragmen lokal native proje mevcut. Bu durum buildlerin makineden makineye degismesine neden olur.

Yapilacaklar:

1. Managed Expo kullanilacaksa native `ios/` klasorunu temiz uretilebilir kabul et ve `eas.json` ekle.
2. Bare/native degisiklik gerekiyorsa `ios/` klasorunu git'e alin.
3. EAS production profile tanimla: `autoIncrement`, `resourceClass`, env, submit config.
4. Apple Team ID, bundle identifier, capabilities ve push entitlement production olarak dogrula.

### Push notification izin ve entitlement riski

Mevcut entitlement `aps-environment = development`. Production App Store build'de bunun production profile/capability ile dogru uretildigi dogrulanmali. Ayrica app acilisinda login sonrasi push token kaydi deneniyor; kullanici bildirim izni vermeden zorlanmamali.

Yapilacaklar:

1. Push token kaydini kullanici ayarlardan bildirim actiginda baslat.
2. Production provisioning ve APNs capability dogrula.
3. Bildirim metinlerinde medikal aciliyet iddialarini dikkatli kullan.

### Yas ve cocuk politikasi tutarsiz

Privacy policy "18 yas alti hedeflenmez" diyor; Terms "18 veya yasal vasi onayi" diyor. Uygulama onboarding'de yas aliyor ama minimum yas/guardian consent enforcement yok.

Yapilacaklar:

1. Net politika sec: 18+ mi, yoksa guardian consent ile kullanilabilir mi?
2. Onboarding'de yas kontrolu ekle.
3. App Store age rating sorularini saglik/medikal icerik ve hassas veri kapsaminda dogru doldur.

## Yayina Hazirlik Checklist'i

### Kod ve urun

- [ ] Sign in with Apple eklendi ve TestFlight'ta dogrulandi.
- [ ] Gercek app icon, adaptive icon, splash ve notification icon eklendi.
- [ ] Paywall StoreKit/RevenueCat localized fiyatlarini gosteriyor.
- [ ] Privacy/Terms linkleri paywall ve login ekraninda erisilebilir.
- [ ] Account deletion tum DB kayitlari, uploadlar, push tokenlar ve RevenueCat metadata icin kapsamli.
- [ ] Destek formu gercek calisiyor veya kaldirildi.
- [ ] Medikal dil "on degerlendirme/farkindalik" seviyesine indirildi.
- [ ] VoiceOver icin kritik butonlara `accessibilityLabel`, `accessibilityRole`, `accessibilityHint` eklendi.
- [ ] Console debug loglari production'da sessiz veya structured logging'e bagli.

### Apple Developer / App Store Connect

- [ ] Apple Developer Program hesabi aktif.
- [ ] App Store Connect app record olusturuldu.
- [ ] Bundle ID `com.corio.scan` olarak kayitli ve app ownership uygun.
- [ ] Capabilities: Sign in with Apple, Push Notifications, In-App Purchase.
- [ ] Subscription group ve 4 urun olusturuldu.
- [ ] IAP review screenshot ve review notes girildi.
- [ ] Privacy Policy URL: `https://www.corioscan.com/privacy-policy`.
- [ ] Support URL: `https://www.corioscan.com/contact-support` veya calisan destek sayfasi.
- [ ] App Privacy Nutrition Label eksiksiz dolduruldu.
- [ ] Age rating sorulari 2026 sistemine gore dolduruldu.
- [ ] Review Notes'a demo hesap, medikal metodoloji, test kart/IAP notlari, backend uptime bilgisi yazildi.

### Build ve test

- [ ] `eas.json` production profile eklendi.
- [ ] `npx expo install --check` temiz.
- [ ] `npx expo-doctor` temiz.
- [ ] `pnpm check` temiz.
- [ ] iOS release build EAS ile alindi.
- [ ] TestFlight install, login, Apple login, analiz, paywall, restore, hesap silme, bildirim ve destek akislari fiziksel cihazda test edildi.
- [ ] Crash-free smoke test: temiz kurulum, izin reddi, zayif internet, buyuk gorsel, invalid token, abonelik iptal/restore.

## 4 Haftalik Uygulama Plani

### Hafta 1 - App Store ret engelleri

1. Sign in with Apple frontend/backend.
2. Gercek ikon/splash/notification assetleri.
3. EAS production config.
4. Expo paketlerini SDK 54 beklenen patchlerine cek.
5. Support formunu gercek endpoint'e bagla veya kaldir.

### Hafta 2 - Privacy, hesap silme, abonelik

1. Privacy policy'yi gercek veri akislariyla yeniden yaz.
2. App privacy manifest ve App Store privacy label matrisi hazirla.
3. Account deletion cleanup kapsamlarini tamamla.
4. RevenueCat/App Store Connect subscription group ve product setup.
5. Paywall'u localized StoreKit fiyatlari ve yasal linklerle guncelle.

### Hafta 3 - Medikal risk azaltma ve kalite

1. Tanisal dili on degerlendirme/farkindalik diline cek.
2. App Review Notes icin medikal metodoloji ve limitasyon dokumani hazirla.
3. Accessibility pass: login, wizard, sonuc, paywall, settings.
4. TR/EN lokalizasyon tutarlilik denetimi.
5. Onboarding age/consent politikasini netlestir.

### Hafta 4 - TestFlight ve submission

1. EAS iOS production build.
2. TestFlight internal test: en az 3 cihaz, iOS 26 dahil.
3. Sandbox IAP: purchase, restore, upgrade/downgrade, cancellation webhook.
4. App Store screenshots, metadata, privacy, age rating, support/review notes.
5. Final smoke test ve App Review submission.

## Dogrulama Komutlari

Calistirilanlar:

- `pnpm check` -> basarili.
- `npx expo-doctor` -> basarisiz; Expo patch uyumsuzluklari var.
- `npx expo export --platform ios --output-dir /tmp/corio-ios-export-audit --clear` -> basarili.
- `pnpm test -- --run` -> 6 test dosyasi, 60 test basarili.
- `pnpm audit --audit-level moderate` -> bilinen zafiyet yok.
- `curl` ile `https://www.corioscan.com`, privacy, terms ve backend health -> HTTP 200.
- `xcodebuild` -> yerel Xcode iOS 26.5 platformu eksik oldugu icin native build dogrulanamadi.

## Nihai Karar

Bu haliyle gonderim yapilmamali. En olasi ret nedenleri:

1. Google login var, Sign in with Apple yok.
2. Placeholder ikon/splash.
3. Eksik/mismatch subscription/IAP sunumu.
4. Gizlilik beyanlarinin ve privacy manifest'in uygulama veri toplama gercegiyle uyusmamasi.
5. Medikal tanisal dil ve validasyon/metodoloji eksigi.
6. Fake destek formu ve eksik hesap silme kapsami.

Bu maddeler kapandiktan sonra uygulama TestFlight'a alinabilir; TestFlight smoke testleri ve App Store Connect metadata tamamlanmadan App Review'a gonderilmemeli.
