import { describe, expect, it } from 'vitest';
import {
  createMobileExchangeCode,
  fingerprintMobileExchangeCode,
  isValidMobileExchangeCode,
} from '../mobileOAuthCode';

describe('mobile OAuth exchange codes', () => {
  it('uses a 64-character lowercase hexadecimal format', () => {
    expect(createMobileExchangeCode()).toMatch(/^[a-f0-9]{64}$/);
  });

  it('generates a different code for each request', () => {
    expect(createMobileExchangeCode()).not.toBe(createMobileExchangeCode());
  });

  it('accepts the generated code format', () => {
    expect(isValidMobileExchangeCode(createMobileExchangeCode())).toBe(true);
  });

  it('rejects the previous base64url format', () => {
    expect(isValidMobileExchangeCode('x'.repeat(41) + '_-')).toBe(false);
  });

  it('creates a safe non-reversible diagnostic fingerprint', () => {
    const code = createMobileExchangeCode();

    expect(fingerprintMobileExchangeCode(code)).toMatch(/^[a-f0-9]{12}$/);
  });
});
