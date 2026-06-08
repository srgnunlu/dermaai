# Manual Release Test Matrix

Run this matrix on the final TestFlight build. Apple Developer and RevenueCat-dependent rows remain deferred until those accounts are connected.

| Area | Scenario | Expected result | Status |
| --- | --- | --- | --- |
| Fresh install | Login → consent → role/18+ → upload → result | User cannot continue without 18+ confirmation; limitation notice appears | Pending device test |
| Permissions | Deny camera access | App explains denial and remains usable through gallery | Pending device test |
| Permissions | Deny photo-library access | App explains denial without crashing | Pending device test |
| Notifications | Login without opening notification settings | No notification permission prompt appears | Pending device test |
| Notifications | Enable notification from Settings | Permission requested only after toggle; token registered after grant | Pending device test |
| Offline | Open app with weak/no network | Clear error state; no fake result or success | Pending device test |
| Images | Invalid, oversized, and non-skin image | Request rejected or explained without crash | Pending device test |
| Results | Review result and report | “Possible finding” and “model confidence score” language is used | Pending device test |
| Accessibility | VoiceOver login, onboarding, upload, result, settings | Critical actions have useful names and states | Pending device test |
| Dynamic Type | Largest supported font size | Critical text/actions remain usable | Pending device test |
| Account deletion | Delete account with records and uploads | Account access ends; owned records/tokens/files are removed | Pending integration test |
| Public pages | Privacy, Terms, Support | All URLs return HTTP 200 and render without browser console errors | Passed locally |
| Apple login | New, existing, and Private Relay user | Correct account created or linked | Deferred: Apple account |
| Purchases | Four products, restore, cancel, expire | StoreKit pricing and backend tier stay in sync | Deferred: RevenueCat/App Store Connect |
| Build | Preview and production EAS builds | Installs and launches on physical device | Deferred: Apple account |
