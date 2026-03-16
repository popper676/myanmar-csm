import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { config } from './config';
import { initDb } from './db-wrapper';
import { initializeDatabase, seedDatabase } from './database';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { authenticate } from './middleware/auth';
import { cleanupExpiredTokens } from './utils/cleanup';

import authRoutes from './routes/auth';
import dashboardRoutes from './routes/dashboard';
import inventoryRoutes from './routes/inventory';
import purchaseOrderRoutes from './routes/purchaseOrders';
import shipmentRoutes from './routes/shipments';
import supplierRoutes from './routes/suppliers';
import paymentRoutes from './routes/payments';
import reportRoutes from './routes/reports';
import settingsRoutes from './routes/settings';

const app = express();

app.set('trust proxy', 1);

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", config.frontendUrl],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  hsts: { maxAge: 31536000, includeSubDomains: true },
}));

app.use((_req, res, next) => {
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  next();
});

app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
}));

const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
  skip: (req) => req.path === '/api/health',
  keyGenerator: (req) => req.ip || req.socket.remoteAddress || 'unknown',
});
app.use('/api/', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please wait 15 minutes.' },
  keyGenerator: (req) => req.ip || req.socket.remoteAddress || 'unknown',
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

app.use('/uploads', authenticate, express.static(path.resolve(config.upload.dir)));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

async function start() {
  try {
    console.log('Initializing database...');
    await initDb();
    initializeDatabase();
    seedDatabase();

    cleanupExpiredTokens();
    setInterval(cleanupExpiredTokens, 60 * 60 * 1000);

    app.listen(config.port, '0.0.0.0', () => {
      console.log(`
  Myanmar SCM Backend API Server
  ================================
  Port:        ${config.port}
  Environment: ${config.nodeEnv}
  Frontend:    ${config.frontendUrl}
  Status:      Running
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
  process.exit(1);
});

start();
