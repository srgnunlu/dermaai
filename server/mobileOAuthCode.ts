import crypto from 'crypto';

const mobileExchangeCodePattern = /^[a-f0-9]{64}$/;

/**
 * Hex avoids every punctuation character that can be normalized while an iOS
 * custom-scheme callback is handed from ASWebAuthenticationSession to the app.
 * 32 random bytes still provide 256 bits of entropy.
 */
export function createMobileExchangeCode(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function isValidMobileExchangeCode(code: string): boolean {
  return mobileExchangeCodePattern.test(code);
}

/**
 * A short one-way identifier for correlating callback and exchange logs.
 * Never log the bearer code itself.
 */
export function fingerprintMobileExchangeCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex').slice(0, 12);
}
