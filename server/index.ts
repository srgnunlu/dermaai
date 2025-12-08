import { config } from 'dotenv';
config({ override: true });
import express, { type Request, Response, NextFunction } from 'express';
import compression from 'compression';
import { registerRoutes } from './routes';
import { setupVite, serveStatic, log } from './vite';

const app = express();

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

// Increase JSON body limit for base64 image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on('finish', () => {
    const duration = Date.now() - start;
    if (path.startsWith('/api')) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + '…';
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Replit Auth is now handled inside registerRoutes with isAuthenticated middleware
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    res.status(status).json({ message });
    throw err;
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
