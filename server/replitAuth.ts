import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import session from 'express-session';
import type { Express, RequestHandler } from 'express';
import connectPg from 'connect-pg-simple';
import { storage } from './storage';
import crypto from 'crypto';
import logger from './logger';

// Simple password hashing utility
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
const isProduction = process.env.NODE_ENV === 'production';
const sameSiteMode: 'lax' | 'none' = isProduction ? 'none' : 'lax';

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
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    // Auto-create the sessions table on first run to avoid boot-time crashes
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: 'sessions',
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      ...sessionCookieSettings,
      maxAge: sessionTtl,
    },
  });
}

// Simple user object for local auth
interface LocalUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}

async function createDefaultUser(email: string, password: string) {
  const hashedPassword = hashPassword(password);
  const role = email === process.env.ADMIN_EMAIL ? 'admin' : 'user';

  // Check if user already exists
  try {
    const user = await storage.getUserByEmail(email);
    if (user) {
      logger.debug(`[AUTH] User already exists: ${email}`);
      return user;
    }
  } catch (error) {
    // User doesn't exist, continue to create
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
  logger.debug('[AUTH] Setting up local authentication...');

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
          // For demo purposes, accept any email/password combination
          // In production, you'd verify against a user database
          const user = await createDefaultUser(email, password);
          return done(null, { id: user.id, email: user.email, role: user.role });
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  // Configure Google OAuth strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: '/api/auth/google/callback',
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
  app.post('/api/login', passport.authenticate('local'), (req, res) => {
    res.json({ user: req.user, message: 'Login successful' });
  });

  // Simple login form endpoint for development
  app.get('/api/login', (req, res) => {
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
      // Pass mobile flag and redirect URI in state to persist through redirect
      const stateObj = {
        mobile: req.query.mobile === 'true',
        redirectUri: req.query.redirect_uri as string
      };
      const state = Buffer.from(JSON.stringify(stateObj)).toString('base64');

      passport.authenticate('google', {
        scope: ['profile', 'email'],
        state: state
      })(req, res, next);
    });

    app.get(
      '/api/auth/google/callback',
      passport.authenticate('google', { failureRedirect: '/login' }),
      async (req, res) => {
        const user = req.user as any;

        try {
          // Decode state parameter
          const stateStr = req.query.state ? Buffer.from(req.query.state as string, 'base64').toString() : '{}';
          const state = JSON.parse(stateStr);
          const isMobile = state.mobile;
          const redirectUri = state.redirectUri;

          if (isMobile && user) {
            // Generate JWT for mobile
            const { generateTokens } = await import('./mobileAuth');
            const tokens = generateTokens({
              id: user.id,
              email: user.email,
              role: user.role || 'user',
            });

            // Redirect to mobile app with token, using the provided dynamic URI or fallback
            // Determine connector: if redirectUri already has params, use &, else ?
            const targetUri = redirectUri || 'dermaai://oauth';
            const connector = targetUri.includes('?') ? '&' : '?';

            const mobileRedirectUrl = `${targetUri}${connector}access_token=${tokens.accessToken}&refresh_token=${tokens.refreshToken}`;

            logger.debug(`[AUTH] Mobile redirect to: ${mobileRedirectUrl}`);
            return res.redirect(mobileRedirectUrl);
          }
        } catch (e) {
          logger.error('[AUTH] Error parsing state:', e);
        }

        // Web: redirect to dashboard
        res.redirect('/');
      }
    );
  }

  // Logout endpoint
  app.post('/api/logout', (req, res) => {
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
  if (!req.isAuthenticated() || !req.user) {
    logger.debug('[AUTH] User not authenticated - needs to login');
    return res.status(401).json({ message: 'Unauthorized - Please login first' });
  }

  // Simple authentication check - user exists in session
  logger.debug('[AUTH] User authenticated:', (req.user as any).email);
  return next();
};
