import crypto from 'crypto';

const defaultFileUrlTtlSeconds = 30 * 24 * 60 * 60;

function getFileAccessSecret(): string {
  const secret = process.env.FILE_ACCESS_SECRET || process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('SESSION_SECRET or FILE_ACCESS_SECRET must be configured for file URLs');
  }

  return secret;
}

function sign(payload: string): string {
  return crypto.createHmac('sha256', getFileAccessSecret()).update(payload).digest('base64url');
}

function safeCompare(value: string, expected: string): boolean {
  const valueBuffer = Buffer.from(value);
  const expectedBuffer = Buffer.from(expected);

  return valueBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(valueBuffer, expectedBuffer);
}

export function createSignedFileAccessToken(
  filePath: string,
  ttlSeconds = Number(process.env.FILE_URL_TTL_SECONDS || defaultFileUrlTtlSeconds)
): string {
  const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = `${filePath}.${expiresAt}`;
  return `${expiresAt}.${sign(payload)}`;
}

export function verifySignedFileAccessToken(filePath: string, token: unknown): boolean {
  if (typeof token !== 'string') {
    return false;
  }

  const [expiresAtRaw, signature] = token.split('.');
  const expiresAt = Number(expiresAtRaw);
  if (!expiresAt || !signature || expiresAt <= Math.floor(Date.now() / 1000)) {
    return false;
  }

  const expectedSignature = sign(`${filePath}.${expiresAt}`);
  return safeCompare(signature, expectedSignature);
}
