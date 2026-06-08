# Suggested App Review Notes

Corio Scan is an 18+ AI-assisted skin awareness and preliminary assessment helper. It does not provide a diagnosis, clinical decision, or replacement for a healthcare professional. A medical limitation notice is shown before first use and remains available in Settings.

Sign in with Apple and Google are available. Apple Private Relay email addresses are supported. The reviewer can use the provided review account if external login testing is unavailable.

The app offers four auto-renewable subscriptions through StoreKit and RevenueCat: Basic monthly/yearly and Pro monthly/yearly. Restore Purchases is available on the paywall. Subscription cancellation is managed through the user's Apple account.

User photos and health-related context are processed only to provide the requested service and are not used to train or improve AI models. Account deletion is available in Settings and removes account-owned records, push tokens, tracking data, and supported uploaded files.

Review account credentials: Deferred until the production authentication configuration is connected. A dedicated, non-expiring review account must be added here before submission.

Backend health endpoint: `https://dermaai-1d9i.onrender.com/api/health`

The reviewer should grant camera or photo-library access only when testing the upload flow. Notification permission is requested only if notifications are enabled from Settings.

## Deferred fields requiring account setup

- Dedicated App Review account username and password
- Apple login production verification
- StoreKit sandbox product and restore verification
- RevenueCat webhook verification
- TestFlight build/version identifier
