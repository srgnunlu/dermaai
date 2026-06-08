import crypto from 'crypto';
import type { RequestHandler } from 'express';

const csrfSafeMethods = new Set(['GET', 'HEAD', 'OPTIONS']);

function getSession(req: any) {
  return req.session as { csrfToken?: string } | undefined;
}

function getOrCreateCsrfToken(req: any): string {
  const session = getSession(req);
  if (!session) {
    throw new Error('Session is required for CSRF token issuance');
  }

  if (!session.csrfToken) {
    session.csrfToken = crypto.randomBytes(32).toString('base64url');
  }

  return session.csrfToken;
}

export const csrfTokenHandler: RequestHandler = (req, res) => {
  res.json({ csrfToken: getOrCreateCsrfToken(req) });
};

export const csrfProtection: RequestHandler = (req, res, next) => {
  if (csrfSafeMethods.has(req.method)) {
    return next();
  }

  const hasBearerToken = typeof req.headers.authorization === 'string' && req.headers.authorization.startsWith('Bearer ');
  const usesAuthenticatedCookie = Boolean(req.isAuthenticated?.() && req.user && !hasBearerToken);

  if (!usesAuthenticatedCookie) {
    return next();
  }

  const sessionToken = getSession(req)?.csrfToken;
  const headerToken = req.headers['x-csrf-token'];

  if (typeof sessionToken === 'string' && headerToken === sessionToken) {
    return next();
  }

  return res.status(403).json({ error: 'Invalid CSRF token' });
};
