import express from 'express';
import cors from 'cors';
import { loadEnv } from './config/env.js';
import { securityMiddleware } from './middleware/security.js';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import menuRoutes from './routes/menu.js';
import orderRoutes from './routes/orders.js';
import squareWebhookRoutes from './routes/webhooks.js';

export function createApp() {
  const env = loadEnv();
  const app = express();

  // Atrás de nginx/Cloudflare o header X-Forwarded-For vem preenchido; sem isso o
  // express-rate-limit lança ERR_ERL_UNEXPECTED_X_FORWARDED_FOR (v7+).
  // `1` = confiar no primeiro hop (um proxy reverso).
  app.set('trust proxy', 1);

  app.use(
    '/api/webhooks/square',
    express.raw({ type: 'application/json' }),
    squareWebhookRoutes
  );
  app.use(express.json({ limit: '32kb' }));
  app.use(
    cors({
      origin: env.CORS_ORIGIN
        ? env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean)
        : true,
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type'],
    })
  );
  app.use(requestLogger());
  app.use(securityMiddleware());

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', env: env.NODE_ENV });
  });
  app.use('/api/menu', menuRoutes);
  app.use('/api/orders', orderRoutes);

  app.use(notFound);
  app.use(errorHandler(env.NODE_ENV));

  return { app, env };
}
