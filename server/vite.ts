import express, { type Express } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { type Server } from 'http';
import { nanoid } from 'nanoid';
import logger from './logger';

export function log(message: string, source = 'express') {
  const formattedTime = new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  logger.info(`${formattedTime} [${source}] ${message}`);
}

// IMPORTANT: Do not import 'vite' or the local vite config at module scope.
// They are dev-only dependencies and not present in production images.
// We dynamically import them only when this function is called (in development).
export async function setupVite(app: Express, server: Server) {
  // Dynamically import Vite only in development
  const { createServer: createViteServer, createLogger } = await import('vite');
  const viteLogger = createLogger();
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  // Build a minimal inline Vite config. Avoid importing local vite.config
  // because it statically imports 'vite' plugins which are dev-only.
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const vite = await createViteServer({
    configFile: false,
    root: path.resolve(__dirname, '..', 'client'),
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '..', 'client', 'src'),
        '@shared': path.resolve(__dirname, '..', 'shared'),
        '@assets': path.resolve(__dirname, '..', 'attached_assets'),
      },
    },
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: 'custom',
  });

  app.use(vite.middlewares);
  app.use('*', async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(__dirname, '..', 'client', 'index.html');

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, 'utf-8');
      template = template.replace(`src="/src/main.tsx"`, `src="/src/main.tsx?v=${nanoid()}"`);
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ 'Content-Type': 'text/html' }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const distPath = path.resolve(__dirname, 'public');

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use('*', (_req, res) => {
    res.sendFile(path.resolve(distPath, 'index.html'));
  });
}
