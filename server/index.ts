import { config } from 'dotenv';
config({ override: true });
import express, { type Request, Response, NextFunction } from 'express';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { registerRoutes } from './routes';
import { setupVite, serveStatic, log } from './vite';

const app = express();

if (process.env.NODE_ENV === 'production' && !process.env.REVENUECAT_WEBHOOK_SECRET) {
  log('REVENUECAT_WEBHOOK_SECRET is not configured; RevenueCat webhook will return 503');
}

app.disable('x-powered-by');

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    hsts: process.env.NODE_ENV === 'production',
    referrerPolicy: { policy: 'no-referrer' },
  })
);

// Enable gzip compression for all responses
app.use(
  compression({
    level: 6, // Balance between speed and compression ratio
    threshold: 1024, // Only compress responses larger than 1KB
    filter: (req: Request, res: Response) => {
      // Compress all responses except if explicitly disabled
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    },
  })
);

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: false, limit: '15mb' }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth', authLimiter);
app.use('/api/login', authLimiter);
app.use('/api/upload', uploadLimiter);
app.use('/api', apiLimiter);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;

  res.on('finish', () => {
    const duration = Date.now() - start;
    if (path.startsWith('/api')) {
      log(`${req.method} ${path} ${res.statusCode} in ${duration}ms`);
    }
  });

  next();
});

(async () => {
  // Replit Auth is now handled inside registerRoutes with isAuthenticated middleware
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = status >= 500 ? 'Internal Server Error' : err.message || 'Request failed';

    log(`request error ${status}: ${err.message || err.name || 'unknown error'}`);
    res.status(status).json({ message });
  });

  // Only enable Vite in true local development.
  // On Render (RENDER=true) we always serve static assets.
  const isLocalDev = process.env.NODE_ENV === 'development' && process.env.RENDER !== 'true';
  if (isLocalDev) {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen(port, () => {
    log(`serving on port ${port}`);
  });
})();
