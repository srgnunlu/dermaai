export type OAuthCallbackParams = {
  code?: string;
  error?: string;
};

function decodeQueryComponent(value: string): string {
  try {
    return decodeURIComponent(value.replace(/\+/g, ' '));
  } catch {
    return value;
  }
}

/**
 * Parse a custom-scheme OAuth callback without depending on URLSearchParams.
 * Some React Native/iOS combinations normalize custom URLs differently from
 * web URLs; reading the raw query keeps the one-time exchange code intact.
 */
export function parseOAuthCallbackUrl(callbackUrl: string): OAuthCallbackParams {
  const queryStart = callbackUrl.indexOf('?');
  if (queryStart < 0) return {};

  const fragmentStart = callbackUrl.indexOf('#', queryStart + 1);
  const rawQuery = callbackUrl.slice(
    queryStart + 1,
    fragmentStart < 0 ? callbackUrl.length : fragmentStart
  );
  const result: OAuthCallbackParams = {};

  for (const field of rawQuery.split('&')) {
    if (!field) continue;

    const separator = field.indexOf('=');
    const rawKey = separator < 0 ? field : field.slice(0, separator);
    const rawValue = separator < 0 ? '' : field.slice(separator + 1);
    const key = decodeQueryComponent(rawKey);

    if ((key === 'code' || key === 'error') && result[key] === undefined) {
      result[key] = decodeQueryComponent(rawValue);
    }
  }

  return result;
}
