# Corio Scan App Store Submission Checklist

## Deferred external configuration

- Replace temporary legal controller name `Corio Scan` with the real developer/company identity.
- Confirm `destek@corioscan.com` is monitored.
- Set backend `APPLE_CLIENT_ID=com.corio.scan`.
- Set backend `REVENUECAT_WEBHOOK_SECRET` and configure the RevenueCat webhook URL.
- Set EAS secret `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`.
- Create and attach these App Store Connect subscriptions:
  - `corio_basic_monthly`
  - `corio_basic_yearly`
  - `corio_pro_monthly`
  - `corio_pro_yearly`
- Configure RevenueCat entitlements `basic_access` and `pro_access`, then attach all products to the current offering.
- Confirm Sign in with Apple, Push Notifications, and In-App Purchase capabilities for `com.corio.scan`.
- Create a dedicated, non-expiring App Review demo account and add it to `APP_REVIEW_NOTES.md`.
- Replace the EAS project owner/project ID if the final Apple Developer organization differs from the current Expo project.

These items are intentionally deferred until the Apple Developer and RevenueCat accounts are ready.

## Completed locally

- App positioning, legal language, AI prompts, and reports use non-diagnostic preliminary-assessment language.
- Strict 18+ onboarding confirmation and personal/professional roles are implemented.
- Account deletion covers account records, push tokens, tracking records, orphan patient records, profile image, and supported uploads.
- Privacy manifest configuration and App Store privacy matrix are prepared.
- StoreKit localized price handling, restore action, legal links, and unavailable-purchase state are implemented.
- Brand icon, splash, adaptive icon, notification icon, EAS profiles, metadata draft, screenshot plan, and manual test matrix are prepared.
- Notification permission is requested only after an explicit Settings action.
- Safe incremental schema migration is prepared at `migrations/manual/20260608_app_store_readiness.sql`.
- A single-command local release gate is available as `pnpm appstore:check:local`.

## App Store metadata

- Privacy Policy URL: `https://www.corioscan.com/privacy-policy`
- Support URL: `https://www.corioscan.com/contact-support`
- Category: Medical or Health & Fitness, based on final metadata review.
- Age policy: 18+ only.
- Positioning: AI-assisted skin awareness and preliminary assessment helper. It does not diagnose or replace a healthcare professional.

## Release verification

1. Run `pnpm check` and `pnpm test` at repository root.
2. Run `pnpm --dir dermaai-mobile check` and `pnpm --dir dermaai-mobile audit --audit-level moderate`.
3. Run `npx expo-doctor` and `npx expo export --platform ios --clear` in `dermaai-mobile`.
4. Review and apply `migrations/manual/20260608_app_store_readiness.sql` in each deployment environment. Do not generate or apply a full baseline migration over an existing database.
5. Create an internal build with `eas build --platform ios --profile preview`.
6. Test Apple login, Private Relay email, all four sandbox purchases, restore, expiration, and account deletion.
7. Create a production/TestFlight build with `eas build --platform ios --profile production`.

Do not submit until all external configuration items and the privacy matrix are confirmed in App Store Connect.
