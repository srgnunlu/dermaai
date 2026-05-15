# DermaAI Project Context

Last reviewed: 2026-05-15

Bu dosya, projeyi her seferinde en bastan kesfetmemek icin tutulur. Yeni bir ozellik, mimari karar veya onemli davranis degisikligi yapildikca guncellenmeli.

## Kisa Ozet

DermaAI, cilt lezyonu gorsellerini analiz eden tam yigin bir uygulamadir. Repo tek kok altinda uc ana parcadan olusur:

- Web uygulamasi: React, TypeScript, Vite, Tailwind, shadcn/ui, Wouter, TanStack Query.
- Backend: Express, TypeScript, Drizzle ORM, PostgreSQL/Neon, Passport session auth, mobil JWT auth.
- Mobil uygulama: `dermaai-mobile` altinda Expo Router, React Native, TanStack Query, RevenueCat.

Uygulamanin ana is akisi: kullanici hasta/vaka bilgisi ve 1-3 gorsel yukler, backend vakayi veritabanina kaydeder, Gemini ve/veya OpenAI ile analiz yapar, sonuclari vakaya yazar, mobilde arka plan analiz tamamlaninca push bildirimi gondermeye calisir.

## Repo Haritasi

- `client/src/App.tsx`: Web routing ve global provider yapisi.
- `client/src/pages/diagnosis.tsx`: Web ana tani akisi.
- `client/src/pages/case-history.tsx`: Web vaka gecmisi.
- `client/src/pages/admin.tsx`: Admin paneli.
- `client/src/pages/dermatologist.tsx`: Blind dermatolog inceleme ekrani.
- `client/src/components/PatientForm.tsx`: Hasta/vaka formu.
- `client/src/components/ImageUpload.tsx`: Web gorsel yukleme.
- `client/src/components/DiagnosisResults.tsx`: Analiz sonuc gosterimi.
- `client/src/lib/queryClient.ts`: Web API helper ve React Query varsayilanlari.
- `client/src/hooks/useAuth.ts`: Web oturum durumunu `/api/auth/user` ile okur.
- `server/index.ts`: Express uygulamasi, gzip, body limitleri, Vite/static servis ve port ayari.
- `server/routes.ts`: Backend endpoint'lerinin buyuk kismi. Vaka analizi, admin, rapor, abonelik, lezyon takibi burada.
- `server/replitAuth.ts`: Web icin Passport local ve Google OAuth session auth. `isAuthenticated` ayni zamanda mobil JWT bearer token'i da kabul eder.
- `server/mobileAuth.ts`: Mobil Google auth, JWT refresh, mobil user ve hesap silme endpoint'leri.
- `server/storage.ts`: Drizzle tabanli veri erisim katmani.
- `server/gemini.ts`: Gemini tani analizi ve lezyon karsilastirma.
- `server/openai.ts`: OpenAI tani analizi.
- `server/localFileStorage.ts`: Lokal upload storage.
- `server/cloudinaryStorage.ts`: Cloudinary storage.
- `server/subscriptions.ts`: Free/basic/pro limitleri ve RevenueCat webhook islemleri.
- `shared/schema.ts`: Drizzle tablolar, Zod insert/update semalari ve paylasilan tipler.
- `dermaai-mobile/lib/api.ts`: Mobil API istemcisi, JWT refresh ve timeout mantigi.
- `dermaai-mobile/hooks/useCases.ts`: Mobil vaka listeleme, yukleme ve async analiz baslatma.
- `dermaai-mobile/constants/Config.ts`: Mobil API base URL, app adi, Google client id, storage key'leri ve secenek listeleri.

## Calistirma ve Kontrol Komutlari

Kok uygulama:

```bash
npm install
npm run dev
npm run build
npm run check
npm test
npm run db:push
```

Mobil uygulama:

```bash
cd dermaai-mobile
npm install
npm start
npm run ios
npm run android
```

Notlar:

- Backend default portu `5000`.
- Development modunda `NODE_ENV=development` ve `RENDER !== true` ise Vite middleware kullanilir.
- Production build `vite build` ile `dist/public`, `esbuild` ile `dist/index.js` uretir.
- README icinde uygulamanin `localhost:3000` calisacagi yaziyor; mevcut `server/index.ts` default olarak `5000` dinliyor. Bu dokumanla README arasinda uyumsuzluk var.

## Ortam Degiskenleri

Ana degiskenler:

- `DATABASE_URL`: PostgreSQL/Neon baglantisi. `server/db.ts` ve Drizzle config icin zorunlu.
- `SESSION_SECRET`: Express session ve fallback JWT secret icin kritik.
- `JWT_SECRET`, `JWT_REFRESH_SECRET`: Mobil token imzalama icin opsiyonel ama production'da ayri verilmesi iyi olur.
- `OPENAI_API_KEY`: OpenAI istemcisi.
- `OPENAI_MODEL`: Varsayilan `gpt-5.5`. Admin panelinden `gpt-5.5` veya `gpt-5.5-pro` secilebilir.
- `OPENAI_MAX_RETRIES`, `OPENAI_RETRY_DELAY_MS`: OpenAI retry ayarlari.
- `GEMINI_API_KEY` veya `GOOGLE_API_KEY`: Gemini istemcisi.
- `GEMINI_MAX_RETRIES`, `GEMINI_RETRY_DELAY_MS`: Gemini retry ayarlari.
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`: Web Google OAuth.
- `GOOGLE_MOBILE_CLIENT_ID`: Mobil Google id token audience kontrolu icin opsiyonel.
- `ADMIN_EMAIL`: Bu email ile olusan kullanicilar admin role alir.
- `LOCAL_AUTH_ENABLED`, `LOCAL_AUTH_EMAIL`, `LOCAL_AUTH_PASSWORD`: Development/test disinda local login'i bilincli acmak icin gerekir.
- `UPLOAD_DIR`: Lokal upload klasoru, default `./uploads`.
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: Varsa upload Cloudinary'ye gider.
- `RENDER`, `RENDER_EXTERNAL_URL`, `BASE_URL`: Render deployment ve upload URL uretimi.
- `REVENUECAT_WEBHOOK_SECRET`: RevenueCat webhook dogrulama.

Mobil Expo public degiskenleri `dermaai-mobile/.env.example` icinde tutulur:

- `EXPO_PUBLIC_API_BASE_URL`: Mobil API base URL. Development default `http://localhost:5000`, production default Render URL.
- `EXPO_PUBLIC_GOOGLE_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`: Mobil Google auth client id'leri.
- `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`, `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY`: RevenueCat public SDK key'leri. Bos ise mobil RevenueCat islemleri devre disi kalir ve uygulama calismaya devam eder.

## Veri Modeli

`shared/schema.ts` ana kaynak dosyadir.

Tablolar:

- `sessions`: Express/Passport session storage.
- `users`: Profil, rol, saglik profesyoneli bilgisi, abonelik seviyesi, aylik analiz sayaci, RevenueCat id.
- `patients`: Hasta demografisi. `patientId` benzersiz insan-okunur id.
- `cases`: Vaka kaydi, gorsel URL'leri, semptomlar, AI analizleri, dermatolog tanisi, secilen AI provider, favori/not alanlari.
- `userSettings`: Kullanici tercihleri, AI provider tercihleri, bildirim ve tema ayarlari.
- `systemSettings`: Admin tarafindan AI provider ve OpenAI model ayarlari.
- `pushTokens`: Mobil push token'lari.
- `lesionTrackings`: Pro ozellik olarak takip edilen lezyonlar.
- `lesionSnapshots`: Bir lezyonun zaman icindeki fotograflari.
- `lesionComparisons`: Iki snapshot arasindaki Gemini karsilastirma sonucu.

Onemli vaka alanlari:

- `imageUrl`: Geriye uyumluluk icin ilk gorsel.
- `imageUrls`: Yeni 1-3 gorsel destegi.
- `geminiAnalysis`, `openaiAnalysis`: Provider bazli ayri sonuc.
- `finalDiagnoses`: Eski consensus/merge alanidir; mevcut analiz akisi bunu `null` yazar.
- `status`: `pending`, `analyzing`, `completed`, `failed` gibi durumlar kullaniliyor.
- `selectedAnalysisProvider`: Mobilde sonuc gorunum tercihi, `gemini` veya `openai`.

## Auth Mimarisi

Web:

- `setupAuth(app)` session store'u PostgreSQL'e baglar.
- Local login endpoint'i `/api/login`; development/test disinda varsayilan kapali. Production'da sadece `LOCAL_AUTH_ENABLED=true`, `LOCAL_AUTH_EMAIL` ve `LOCAL_AUTH_PASSWORD` verilirse calisir.
- Google OAuth endpoint'leri `/api/auth/google` ve `/api/auth/google/callback`.
- Web logout: `/api/logout`.

Mobil:

- `/api/auth/mobile/google`: Mobil Google token alir, kullanici bulur/olusturur, access/refresh JWT dondurur.
- `/api/auth/mobile/refresh`: Refresh token ile yeni token uretir.
- `/api/auth/mobile/user`: Mobil bearer token ile kullanici bilgisini dondurur.
- `/api/auth/mobile/delete-account`: Mobil kullanicinin hesabini siler.

Ortak:

- `isAuthenticated` session kullanicisini kabul eder; yoksa `Authorization: Bearer <jwt>` basligini dogrulayip `req.user` set eder.
- Admin korumasi `requireAdmin` ile yapilir ve DB'deki `users.role === "admin"` kontrol edilir.

## Ana API Akislari

Saglik ve profil:

- `GET /api/health`
- `GET /api/auth/user`
- `GET/PUT /api/settings`
- `GET/PUT /api/profile`
- `GET /api/profile/stats`

Upload:

- `POST /api/upload`: multipart upload. Cloudinary ayarliysa Cloudinary, degilse lokal storage.
- `POST /api/upload/base64`: Mobilin kullandigi base64 upload.
- `POST /api/upload/:fileId`: Dosya id ile upload.
- `GET /files/:filePath(*)`: Lokal dosya servis endpoint'i.

Vaka:

- `POST /api/patients`
- `GET /api/patients/:patientId`
- `POST /api/cases/analyze`: Senkron analiz; web icin daha uygun. Response analiz bitince gelir.
- `POST /api/cases/submit`: Mobil async analiz; case olusturur, `analyzing` dondurur, analiz `setImmediate` ile arka planda devam eder.
- `GET /api/cases`
- `GET /api/cases/:id`: Internal id veya `DR-...` case id destekler.
- `DELETE /api/cases/:id`
- `PATCH /api/mobile/cases/:id/select-provider`
- `PATCH /api/mobile/cases/:id/favorite`
- `PATCH /api/mobile/cases/:id/notes`
- `POST /api/cases/:id/report`: PDF raporu.

Dermatolog ve admin:

- `GET /api/dermatologist/cases`: Admin icin AI sonuc alanlari gizlenmis blind review listesi.
- `POST /api/cases/:id/dermatologist-diagnosis`: Admin dermatolog tanisi kaydeder.
- `GET /api/admin/cases/paginated`, `GET /api/admin/cases`
- `GET /api/admin/users/paginated`, `GET /api/admin/users`
- `GET /api/admin/stats`
- `PUT /api/admin/users/:userId/promote`
- `PUT /api/admin/users/:userId/demote`
- `DELETE /api/admin/cases/:id`
- `DELETE /api/admin/users/:id`
- `GET/PUT /api/admin/system-settings`
- Admin analytics endpoint'leri `/api/admin/analytics/...`
- Bulk endpoint'ler `/api/admin/bulk/delete-cases` ve `/api/admin/bulk/export-cases`

Abonelik ve Pro:

- `GET /api/subscription`
- `GET /api/subscription/plans`
- `POST /api/webhooks/revenuecat`
- Pro lezyon takibi endpoint'leri `/api/lesion-trackings...` ve `/api/lesion-comparisons/:id`.

## AI Analiz Davranisi

Gemini:

- `server/gemini.ts` icinde `GoogleGenAI`.
- Kod yorumuna gore model `gemini-3-pro-preview` olarak dusunulmus; model secimi dosyanin ilerleyen kisminda yapiliyor.
- Gorseller local veya Cloudinary storage'dan okunup base64 inline data olarak gonderilir.
- Cikti JSON beklenir; 5 differansiyel tani, confidence, aciklama, key features ve oneriler.
- Mobil isteklerde `language` ve `isHealthProfessional` baglamina gore Turkce/Ingilizce ve hedef kitle tonu degisir.
- Lezyon takibinde `compareWithGemini` iki zaman noktasi arasinda degisim analizi yapar.

OpenAI:

- `server/openai.ts` icinde OpenAI SDK kullanilir.
- Varsayilan model `OPENAI_MODEL || "gpt-5.5"`.
- Gorseller storage'dan okunur, base64 image input'a cevrilir.
- Gemini ile benzer JSON cikti sozlesmesi var.
- `AIAnalysisError` ile eksik key, gorsel yukleme hatasi, rate limit veya desteklenmeyen parametre gibi durumlar UI'a structured error olarak donebilir.

Analiz birlestirme:

- Eski `mergeAnalysesWithoutConsensus` import ediliyor ama mevcut `/api/cases/analyze` akisi provider sonuclarini ayri sakliyor ve `finalDiagnoses: null` yaziyor.
- Sistem ayarlari `enableGemini`, `enableOpenAI`, `openaiModel`, `openaiAllowFallback` ile hangi modellerin calisacagini belirler.
- Mobil `/api/cases/submit` abonelik sayacini artirir, `analyzing` status yazar, arka planda tamamlaninca status ve analiz alanlarini gunceller.

## Mobil Uygulama Notlari

- `dermaai-mobile/constants/Config.ts` mobil config merkezidir. API base URL `EXPO_PUBLIC_API_BASE_URL` ile override edilir; verilmezse development'ta `http://localhost:5000`, production'da `https://dermaai-1d9i.onrender.com` kullanilir.
- App adi `Corio Scan`, storage key'leri `corio_*`. Repo adi ve web marka metinleri DermaAI/DermAssistAI ile karisik olabilir.
- Google client id'leri Expo public env degiskenlerinden okunur; web id icin eski default degeri fallback olarak duruyor.
- RevenueCat API key'leri koddan kaldirildi. `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY` veya `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY` yoksa init/purchase/restore/login/logout islemleri guvenli sekilde atlanir.
- Mobil analiz akisi `useAnalyzeCase` icinde once hasta olusturur, lokal gorselleri base64'e cevirir, `/api/upload/base64` ile yukler, sonra `/api/cases/submit` ile async analiz baslatir.
- `useCase` analiz durumunda 5 saniyede bir polling yapar.
- Push token kaydi backend tarafinda `/api/push-tokens` ile desteklenir.

## Test ve Kalite Durumu

Mevcut testler:

- Frontend component testleri: `client/src/components/__tests__`.
- Backend testleri: `server/test/*.test.ts`.
- Test runner: Vitest, jsdom setup `client/src/test/setup.ts`.

Kontrol komutlari:

- TypeScript: `npm run check`
- Tum testler: `npm test`
- Lint: `npm run lint`
- Format kontrolu: `npm run format:check`

Son dogrulama:

- 2026-05-15: `npm run check` temiz.
- 2026-05-15: `npm test` temiz, 5 test dosyasi ve 56 test gecti.
- 2026-05-15: `npx eslint . --ext .js,.jsx,.ts,.tsx --quiet` temiz. Full lint komutu cok sayida warning uretiyor.
- 2026-05-15: `cd dermaai-mobile && npx tsc -p tsconfig.json --noEmit` temiz.
- 2026-05-15: `npm audit --omit=dev` sadece `@google-cloud/storage` zincirinden gelen 5 low vulnerability raporluyor; npm'in onerisi breaking downgrade oldugu icin uygulanmadi.
- 2026-05-15: `cd dermaai-mobile && npm audit --omit=dev` Expo/Metro `postcss` zincirinden 4 moderate vulnerability raporluyor; npm'in onerisi breaking force degisikligi oldugu icin uygulanmadi.

Bilinen teknik borc / dikkat alanlari:

- README ve `TECHNICAL_DOCUMENTATION.md` bazi noktalarda eski kalmis. Ornekler: Replit OIDC/GCS ve GPT-4 vurgulari mevcut kodla tam ortusmuyor; default port README'de 3000, kodda 5000.
- `SESSION_SECRET` artik explicit zorunlu; production ortaminda `JWT_SECRET` ve `JWT_REFRESH_SECRET` de verilmelidir.
- OpenAI ana model default'u `gpt-5.5`; ana model bos/legacy (`gpt-4o-mini` veya `gpt-5.1`) ise `system_settings` okundugunda `gpt-5.5`'e tasinir. Ek hata toleransi icin kod icinde son fallback model olarak `gpt-4o-mini` duruyor.
- Full lint warning borcu yuksek: agirlikla Prettier format uyarilari, `any` kullanimi ve kullanilmayan degiskenler.
- Full `npm audit --audit-level=moderate`, dev tooling tarafinda `vite/esbuild` icin breaking upgrade isteyen moderate uyarilar raporluyor.
- Mobil `npm audit --omit=dev` 4 moderate `postcss` uyarisi veriyor; Expo/Metro zinciri nedeniyle force fix su an riskli.
- `anonymizeData` mobil case submit payload'unda tasiniyor ama ana akista tam uygulanip uygulanmadigi kontrol edilmeli.
- `finalDiagnoses` eski UI veya rapor akislarinda hala bekleniyor olabilir; provider bazli yeni modelle tum ekranlarin uyumu kontrol edilmeli.

## Sonraki Gelistirmelerde Izlenecek Yol

1. Degisiklikten once ilgili dosyalar: `shared/schema.ts`, `server/routes.ts`, `server/storage.ts`, ilgili web/mobil hook ve ekranlar birlikte okunmali.
2. DB alan degisikliginde Drizzle schema guncellenmeli, sonra `npm run db:push` veya migration plani netlestirilmeli.
3. Vaka analizi davranisi degisiyorsa hem senkron `/api/cases/analyze` hem async `/api/cases/submit` akislari birlikte guncellenmeli.
4. Auth veya admin degisikliginde hem session hem bearer JWT yollarinin etkisi dusunulmeli.
5. Mobil ozellikte backend endpoint, `dermaai-mobile/lib/api.ts`, ilgili hook ve ekran beraber ele alinmali.
6. Rapor/export degisikliginde PDF ve CSV sanitizasyon yardimcilari unutulmamali.
7. Degisiklikten sonra en az `npm run check` ve ilgili testler calistirilmali; UI degisikliginde lokal browser ile gorsel kontrol yapilmali.
