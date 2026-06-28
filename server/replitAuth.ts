import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import session from 'express-session';
import type { Express, RequestHandler } from 'express';
import connectPg from 'connect-pg-simple';
import { storage } from './storage';
import crypto from 'crypto';
import logger from './logger';
import { verifyAccessToken } from './mobileAuth';
import { csrfProtection } from './csrf';
import {
  createMobileExchangeCode,
  fingerprintMobileExchangeCode,
  isValidMobileExchangeCode,
} from './mobileOAuthCode';

const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
const isProduction = process.env.NODE_ENV === 'production';
const sameSiteMode: 'lax' = 'lax';
const isLocalAuthEnabled =
  process.env.LOCAL_AUTH_ENABLED === 'true' ||
  (!isProduction && process.env.LOCAL_AUTH_ENABLED !== 'false');
const mobileOAuthCodeTtlMs = 60 * 1000;
const oauthStateTtlMs = 10 * 60 * 1000;
const defaultMobileRedirectUri = 'corioscan://oauth';
const defaultMobileRedirectUris = [defaultMobileRedirectUri, 'corioscan:///oauth'];

type OAuthStatePayload = {
  mobile: boolean;
  redirectUri?: string;
  nonce: string;
  issuedAt: number;
};

type MobileAuthCodeRecord = {
  userId: string;
  email: string;
  role: string;
  expiresAt: Date;
};

const sessionCookieSettings = {
  httpOnly: true,
  secure: isProduction,
  sameSite: sameSiteMode,
};

const clearCookieSettings = {
  ...sessionCookieSettings,
  path: '/',
};

export function getSession() {
  if (!process.env.SESSION_SECRET) {
    throw new Error('SESSION_SECRET must be configured for session authentication');
  }

  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    // Auto-create the sessions table on first run to avoid boot-time crashes
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: 'sessions',
  });
  return session({
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      ...sessionCookieSettings,
      maxAge: sessionTtl,
    },
  });
}

function safeCompare(value: string, expected: string): boolean {
  const valueBuffer = Buffer.from(value);
  const expectedBuffer = Buffer.from(expected);

  if (valueBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(valueBuffer, expectedBuffer);
}

function getSigningSecret(): string {
  if (!process.env.SESSION_SECRET) {
    throw new Error('SESSION_SECRET must be configured for OAuth state signing');
  }

  return process.env.SESSION_SECRET;
}

function signValue(value: string): string {
  return crypto.createHmac('sha256', getSigningSecret()).update(value).digest('base64url');
}

function normalizeRedirectUri(rawUri: string): string | null {
  try {
    const uri = new URL(rawUri);
    return `${uri.protocol}//${uri.host}${uri.pathname}`.replace(/\/$/, '');
  } catch {
    return null;
  }
}

function getAllowedMobileRedirectUris(): string[] {
  const configuredUris =
    process.env.MOBILE_OAUTH_ALLOWED_REDIRECTS?.split(',')
      .map((uri) => normalizeRedirectUri(uri.trim()))
      .filter((uri): uri is string => Boolean(uri)) ?? [];

  return [...defaultMobileRedirectUris, ...configuredUris]
    .map((uri) => normalizeRedirectUri(uri))
    .filter((uri): uri is string => Boolean(uri));
}

export function isAllowedMobileRedirectUri(rawUri?: string): boolean {
  const redirectUri = rawUri || defaultMobileRedirectUri;
  const normalizedUri = normalizeRedirectUri(redirectUri);

  if (!normalizedUri) {
    return false;
  }

  if (getAllowedMobileRedirectUris().includes(normalizedUri)) {
    return true;
  }

  if (!isProduction) {
    try {
      const parsed = new URL(redirectUri);
      if (parsed.protocol === 'exp:') {
        return true;
      }

      if (parsed.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(parsed.hostname)) {
        return true;
      }
    } catch {
      return false;
    }
  }

  return false;
}

export function createSignedOAuthState(input: { mobile: boolean; redirectUri?: string }): string {
  const payload: OAuthStatePayload = {
    mobile: input.mobile,
    redirectUri: input.redirectUri,
    nonce: crypto.randomUUID(),
    issuedAt: Date.now(),
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const signature = signValue(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export function parseSignedOAuthState(state: unknown): OAuthStatePayload | null {
  if (typeof state !== 'string') {
    return null;
  }

  const [encodedPayload, signature] = state.split('.');
  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = signValue(encodedPayload);
  if (!safeCompare(signature, expectedSignature)) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, 'base64url').toString('utf8')
    ) as OAuthStatePayload;

    if (!payload.nonce || Date.now() - payload.issuedAt > oauthStateTtlMs) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

// Punctuation-free random opaque one-time exchange code, persisted in Postgres.
// Two reasons over the previous approaches:
//  - Hex-only, no punctuation: avoids custom-scheme URL normalization after
//    signed and base64url codes failed to survive the iOS handoff end-to-end.
//  - Persisted (not an in-memory Map): survives instance/cold-start, so the
//    exchange works regardless of which server instance handles it.
async function createMobileAuthCode(user: {
  id: string;
  email: string;
  role?: string;
}): Promise<string> {
  const code = createMobileExchangeCode();
  await storage.saveMobileAuthCode({
    code,
    userId: user.id,
    email: user.email,
    role: user.role || 'user',
    expiresAt: new Date(Date.now() + mobileOAuthCodeTtlMs),
  });
  logger.info('[AUTH] Mobile OAuth exchange code issued', {
    fingerprint: fingerprintMobileExchangeCode(code),
    codeLength: code.length,
  });
  return code;
}

async function consumeMobileAuthCode(code: string): Promise<MobileAuthCodeRecord | null> {
  const record = await storage.consumeMobileAuthCode(code);
  return record ? { ...record } : null;
}

function buildMobileRedirectUrl(redirectUri: string | undefined, code: string): string {
  const targetUri = redirectUri || defaultMobileRedirectUri;
  const redirectUrl = new URL(targetUri);
  redirectUrl.searchParams.set('code', code);
  return redirectUrl.toString();
}

function canUseLocalCredentials(email: string, password: string): boolean {
  if (!isLocalAuthEnabled) {
    return false;
  }

  const configuredEmail = process.env.LOCAL_AUTH_EMAIL;
  const configuredPassword = process.env.LOCAL_AUTH_PASSWORD;

  if (configuredEmail || configuredPassword) {
    return Boolean(
      configuredEmail &&
      configuredPassword &&
      safeCompare(email, configuredEmail) &&
      safeCompare(password, configuredPassword)
    );
  }

  // Development convenience only. Production must use Google OAuth or explicit local credentials.
  return !isProduction;
}

async function getOrCreateLocalUser(email: string) {
  const role = email === process.env.ADMIN_EMAIL ? 'admin' : 'user';

  // Check if user already exists
  try {
    const user = await storage.getUserByEmail(email);
    if (user) {
      logger.debug(`[AUTH] User already exists: ${email}`);
      return user;
    }
  } catch (error) {
    logger.debug(`[AUTH] getUserByEmail failed for local user ${email}:`, error);
  }

  // Create user in database
  const user = await storage.upsertUser({
    id: crypto.randomUUID(),
    email,
    firstName: email.split('@')[0],
    lastName: '',
    profileImageUrl: null,
    role,
  });

  logger.debug(`[AUTH] Created new user: ${email} with role: ${role}`);
  return user;
}

export async function setupAuth(app: Express) {
  logger.debug('[AUTH] Setting up authentication...');

  app.set('trust proxy', 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure local strategy
  passport.use(
    new LocalStrategy(
      {
        usernameField: 'email',
        passwordField: 'password',
      },
      async (email: string, password: string, done) => {
        try {
          if (!canUseLocalCredentials(email, password)) {
            logger.warn(`[AUTH] Rejected local login attempt for ${email}`);
            return done(null, false, { message: 'Invalid local login credentials' });
          }

          const user = await getOrCreateLocalUser(email);
          return done(null, { id: user.id, email: user.email, role: user.role });
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  // Configure Google OAuth strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    // Behind a TLS-terminating proxy (Render), passport rebuilds a relative
    // callbackURL as http:// and would mismatch the https:// URI registered in
    // Google Cloud Console, failing the token exchange with a 500. Use an
    // explicit absolute https callback derived from the deployment base URL.
    // Prefer the explicit canonical domain (BASE_URL, e.g. https://www.corioscan.com)
    // over Render's auto-assigned *.onrender.com URL, so the OAuth callback and the
    // session cookie stay on the domain the user actually browses.
    const configuredBaseUrl = (
      process.env.BASE_URL ||
      process.env.RENDER_EXTERNAL_URL ||
      ''
    ).replace(/\/$/, '');
    const googleCallbackURL = configuredBaseUrl
      ? `${configuredBaseUrl}/api/auth/google/callback`
      : '/api/auth/google/callback';
    logger.debug(`[AUTH] Google OAuth callback URL: ${googleCallbackURL}`);

    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: googleCallbackURL,
          // Honor X-Forwarded-Proto so the relative fallback also stays https.
          proxy: true,
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value;
            logger.debug(`[AUTH] Google profile email received: "${email}"`);
            if (!email) {
              return done(new Error('No email found in Google profile'));
            }

            // Check if user exists or create new one
            let user;
            try {
              user = await storage.getUserByEmail(email);
              logger.debug(`[AUTH] getUserByEmail result for ${email}:`, user);
              if (user) {
                logger.debug(`[AUTH] Found existing Google user: ${email}`);
              } else {
                logger.debug(`[AUTH] getUserByEmail returned undefined for: ${email}`);
              }
            } catch (error) {
              logger.debug(`[AUTH] getUserByEmail threw error for ${email}:`, error);
              user = undefined;
            }

            if (!user) {
              // User doesn't exist, create new one
              logger.debug(`[AUTH] Creating new Google user for: ${email}`);
              const role = email === process.env.ADMIN_EMAIL ? 'admin' : 'user';
              user = await storage.upsertUser({
                id: crypto.randomUUID(),
                email,
                firstName: profile.name?.givenName || profile.displayName?.split(' ')[0] || '',
                lastName: profile.name?.familyName || profile.displayName?.split(' ')[1] || '',
                profileImageUrl: profile.photos?.[0]?.value || null,
                role,
              });
              logger.debug(
                `[AUTH] Created new Google user: ${email} with role: ${role}, user object:`,
                user
              );
            }

            if (!user) {
              logger.error(`[AUTH] No user object after Google OAuth for: ${email}`);
              return done(new Error('Failed to create or retrieve user'));
            }

            logger.debug(`[AUTH] Google OAuth success for user:`, {
              id: user.id,
              email: user.email,
              role: user.role,
            });
            return done(null, { id: user.id, email: user.email, role: user.role });
          } catch (error) {
            return done(error);
          }
        }
      )
    );
    logger.debug('[AUTH] Google OAuth strategy configured');
  }

  passport.serializeUser((user: any, cb) => cb(null, user));
  passport.deserializeUser((user: any, cb) => cb(null, user));

  logger.debug('[AUTH] Local authentication setup complete');

  // Login endpoint
  app.post('/api/login', (req, res, next) => {
    passport.authenticate('local', (err: Error | null, user: Express.User | false) => {
      if (err) {
        return next(err);
      }

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      req.login(user, (loginErr) => {
        if (loginErr) {
          return next(loginErr);
        }
        res.json({ user: req.user, message: 'Login successful' });
      });
    })(req, res, next);
  });

  // Simple login form endpoint for development
  app.get('/api/login', (req, res) => {
    if (!isLocalAuthEnabled) {
      return res
        .status(404)
        .send('Local login is disabled. Use Google OAuth or set LOCAL_AUTH_ENABLED=true.');
    }

    res.send(`
      <html>
        <body>
          <h2>Login</h2>
          <form action="/api/login" method="post">
            <div>
              <label>Email:</label>
              <input type="email" name="email" required>
            </div>
            <div>
              <label>Password:</label>
              <input type="password" name="password" required>
            </div>
            <button type="submit">Login</button>
          </form>
        </body>
      </html>
    `);
  });

  // Google OAuth endpoints
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    // Google OAuth login
    app.get('/api/auth/google', (req, res, next) => {
      const mobile = req.query.mobile === 'true';
      const redirectUri =
        typeof req.query.redirect_uri === 'string' ? req.query.redirect_uri : undefined;

      if (mobile && !isAllowedMobileRedirectUri(redirectUri)) {
        logger.warn('[AUTH] Rejected mobile OAuth request with disallowed redirect URI');
        return res.status(400).json({ error: 'Invalid redirect URI' });
      }

      const state = createSignedOAuthState({
        mobile,
        redirectUri,
      });

      passport.authenticate('google', {
        scope: ['profile', 'email'],
        state,
      })(req, res, next);
    });

    app.post('/api/auth/mobile/exchange', async (req, res) => {
      const code = typeof req.body?.code === 'string' ? req.body.code.trim() : '';
      if (!code) {
        return res.status(400).json({ error: 'Missing exchange code' });
      }

      const fingerprint = fingerprintMobileExchangeCode(code);
      if (!isValidMobileExchangeCode(code)) {
        logger.warn('[AUTH] Rejected malformed mobile OAuth exchange code', {
          fingerprint,
          codeLength: code.length,
        });
        return res.status(401).json({ error: 'Invalid or expired exchange code' });
      }

      const record = await consumeMobileAuthCode(code);
      if (!record) {
        logger.warn('[AUTH] Mobile OAuth exchange code not found or expired', {
          fingerprint,
          codeLength: code.length,
        });
        return res.status(401).json({ error: 'Invalid or expired exchange code' });
      }

      logger.info('[AUTH] Mobile OAuth exchange code consumed', {
        fingerprint,
        codeLength: code.length,
      });

      const { generateTokens } = await import('./mobileAuth');
      const tokens = generateTokens({
        id: record.userId,
        email: record.email,
        role: record.role,
      });

      const storedUser = await storage.getUser(record.userId);
      const user = storedUser
        ? {
            id: storedUser.id,
            email: storedUser.email,
            firstName: storedUser.firstName,
            lastName: storedUser.lastName,
            profileImageUrl: storedUser.profileImageUrl,
            role: storedUser.role,
          }
        : {
            id: record.userId,
            email: record.email,
            role: record.role,
          };

      res.json({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user,
      });
    });

    app.get(
      '/api/auth/google/callback',
      passport.authenticate('google', { failureRedirect: '/login' }),
      async (req, res) => {
        const user = req.user as any;

        try {
          const state = parseSignedOAuthState(req.query.state);

          if (state?.mobile && user) {
            if (!isAllowedMobileRedirectUri(state.redirectUri)) {
              logger.warn('[AUTH] Rejected mobile OAuth callback with disallowed redirect URI');
              return res.redirect('/login?error=invalid_redirect_uri');
            }

            const code = await createMobileAuthCode({
              id: user.id,
              email: user.email,
              role: user.role,
            });
            const mobileRedirectUrl = buildMobileRedirectUrl(state.redirectUri, code);

            return res.redirect(mobileRedirectUrl);
          }
        } catch (e) {
          logger.error('[AUTH] Error validating OAuth state:', e);
        }

        // Web: redirect to dashboard
        res.redirect('/');
      }
    );
  }

  // Logout endpoint
  app.post('/api/logout', csrfProtection, (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: 'Logout failed' });
      }
      // Clear session
      req.session.destroy((sessionErr) => {
        if (sessionErr) {
          logger.error('[AUTH] Session destroy error:', sessionErr);
        }
        // Clear cookie
        res.clearCookie('connect.sid', clearCookieSettings);
        res.json({ message: 'Logout successful' });
      });
    });
  });

  // GET logout endpoint for direct browser navigation
  app.get('/api/logout', (req, res) => {
    logger.debug('[AUTH] Logout request received for user:', (req.user as any)?.email);
    req.logout((err) => {
      if (err) {
        logger.error('[AUTH] Logout error:', err);
      }
      logger.debug('[AUTH] Passport logout completed');
      // Clear session
      if (req.session) {
        req.session.destroy((sessionErr) => {
          if (sessionErr) {
            logger.error('[AUTH] Session destroy error:', sessionErr);
          }
          logger.debug('[AUTH] Session destroyed');
          // Clear all possible cookies
          res.clearCookie('connect.sid', clearCookieSettings);
          res.clearCookie('sessionId', clearCookieSettings);
          logger.debug('[AUTH] Cookies cleared, redirecting to landing page');
          res.redirect('/');
        });
      } else {
        logger.debug('[AUTH] No session to destroy, redirecting');
        res.clearCookie('connect.sid', clearCookieSettings);
        res.redirect('/');
      }
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  // 1. Check existing Passport session
  if (req.isAuthenticated() && req.user) {
    logger.debug('[AUTH] User authenticated via Session:', (req.user as any).email);
    return next();
  }

  // 2. Check for Mobile JWT Token
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);

    if (payload) {
      // Map payload to req.user structure expected by the app
      req.user = {
        id: payload.userId,
        email: payload.email,
        role: payload.role,
      } as any;

      logger.debug('[AUTH] User authenticated via JWT:', payload.email);
      return next();
    } else {
      // Token provided but invalid
      logger.debug('[AUTH] Invalid JWT token provided');
    }
  }

  // 3. No valid auth found
  logger.debug('[AUTH] User not authenticated - needs to login');
  return res.status(401).json({ message: 'Unauthorized - Please login first' });
};
