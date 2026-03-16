import jwt, { type Secret, type SignOptions, type VerifyOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config';

export interface TokenPayload {
  userId: string;
  username: string;
  role: string;
}

const JWT_ALGORITHM = 'HS256' as const;

export function generateAccessToken(payload: TokenPayload): string {
  const options: SignOptions = {
    algorithm: JWT_ALGORITHM,
    expiresIn: config.jwt.expiresIn as any,
    issuer: 'myanscm-api',
    audience: 'myanscm-client',
  };
  return jwt.sign(payload, config.jwt.secret as Secret, options);
}

export function generateRefreshToken(payload: TokenPayload): string {
  const options: SignOptions = {
    algorithm: JWT_ALGORITHM,
    expiresIn: config.jwt.refreshExpiresIn as any,
    issuer: 'myanscm-api',
    audience: 'myanscm-client',
  };
  return jwt.sign(payload, config.jwt.refreshSecret as Secret, options);
}

const verifyOpts: VerifyOptions = {
  algorithms: [JWT_ALGORITHM],
  issuer: 'myanscm-api',
  audience: 'myanscm-client',
};

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, config.jwt.secret, verifyOpts) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, config.jwt.refreshSecret, verifyOpts) as TokenPayload;
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}
