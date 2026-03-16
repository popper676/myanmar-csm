import dotenv from 'dotenv';
import crypto from 'crypto';
import path from 'path';

dotenv.config();

function requireSecret(envVar: string, name: string): string {
  const val = process.env[envVar];
  if (!val || val.length < 32) {
    const generated = crypto.randomBytes(48).toString('base64url');
    console.warn(`[SECURITY] ${name} is weak or missing. Generated ephemeral secret. Set ${envVar} in .env with at least 32 characters.`);
    return generated;
  }
  return val;
}

export const config = {
  port: parseInt(process.env.PORT || '15000', 10),
  nodeEnv: process.env.NODE_ENV || 'production',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:8888',

  jwt: {
    secret: requireSecret('JWT_SECRET', 'JWT access token secret'),
    refreshSecret: requireSecret('JWT_REFRESH_SECRET', 'JWT refresh token secret'),
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  db: {
    path: process.env.DB_PATH || './data/myanscm.db',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '200', 10),
  },

  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10),
    dir: process.env.UPLOAD_DIR || './uploads',
  },
} as const;
