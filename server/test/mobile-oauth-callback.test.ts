import { describe, expect, it } from 'vitest';
import { parseOAuthCallbackUrl } from '../../dermaai-mobile/lib/oauthCallback';

describe('mobile OAuth callback URL parsing', () => {
  it('preserves a hexadecimal exchange code exactly', () => {
    const code = '0123456789abcdef'.repeat(4);

    expect(parseOAuthCallbackUrl(`corioscan://oauth?code=${code}`).code).toBe(code);
  });

  it('decodes encoded query values without changing URL-safe characters', () => {
    expect(parseOAuthCallbackUrl('corioscan://oauth?code=abc_def-123%2E456').code).toBe(
      'abc_def-123.456'
    );
  });

  it('returns the OAuth error when no code is present', () => {
    expect(parseOAuthCallbackUrl('corioscan://oauth?error=access_denied').error).toBe(
      'access_denied'
    );
  });

  it('ignores URL fragments after the query string', () => {
    expect(parseOAuthCallbackUrl('corioscan://oauth?code=abc123#ignored').code).toBe('abc123');
  });
});
