import jwt, { type Secret, type SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config';

export interface TokenPayload {
  userId: string;
  username: string;
  role: string;
}

export function generateAccessToken(payload: TokenPayload): string {
  const options: SignOptions = {
    expiresIn: config.jwt.expiresIn as any,
    issuer: 'myanscm-api',
    audience: 'myanscm-client',
  };
  return jwt.sign(payload, config.jwt.secret as Secret, options);
}

export function generateRefreshToken(payload: TokenPayload): string {
  const options: SignOptions = {
    expiresIn: config.jwt.refreshExpiresIn as any,
    issuer: 'myanscm-api',
    audience: 'myanscm-client',
  };
  return jwt.sign(payload, config.jwt.refreshSecret as Secret, options);
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, config.jwt.secret, {
    issuer: 'myanscm-api',
    audience: 'myanscm-client',
  }) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, config.jwt.refreshSecret, {
    issuer: 'myanscm-api',
    audience: 'myanscm-client',
  }) as TokenPayload;
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}
