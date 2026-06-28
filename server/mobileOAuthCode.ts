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
 * Legacy TestFlight builds pass the raw text after `?` to URLSearchParams.
 * When iOS appends an empty URL fragment, that parser treats the trailing `#`
 * as part of the code. Accept only that exact, unambiguous legacy encoding.
 */
export function normalizeMobileExchangeCode(code: string): string | null {
  if (isValidMobileExchangeCode(code)) {
    return code;
  }

  if (code.length === 65 && code.endsWith('#')) {
    const withoutEmptyFragment = code.slice(0, -1);
    return isValidMobileExchangeCode(withoutEmptyFragment) ? withoutEmptyFragment : null;
  }

  return null;
}

/**
 * A short one-way identifier for correlating callback and exchange logs.
 * Never log the bearer code itself.
 */
export function fingerprintMobileExchangeCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex').slice(0, 12);
}
