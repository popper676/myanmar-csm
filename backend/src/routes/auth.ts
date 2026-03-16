import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prepare, transaction } from '../db-wrapper';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, hashToken, generateResetToken } from '../utils/token';
import { generateId } from '../utils/helpers';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { loginSchema, forgotPasswordSchema, resetPasswordSchema, refreshTokenSchema } from '../schemas/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

function trackFailedAttempt(key: string) {
  const attempt = loginAttempts.get(key) || { count: 0, lockedUntil: 0 };
  attempt.count += 1;
  if (attempt.count >= MAX_LOGIN_ATTEMPTS) {
    attempt.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
    attempt.count = 0;
  }
  loginAttempts.set(key, attempt);
}

const loginAttempts = new Map<string, { count: number; lockedUntil: number }>();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

router.post('/login', validate(loginSchema), (req: Request, res: Response) => {
  const { username, password } = req.body;
  const clientKey = `${req.ip}:${username}`;

  const attempt = loginAttempts.get(clientKey);
  if (attempt && attempt.lockedUntil > Date.now()) {
    const minutesLeft = Math.ceil((attempt.lockedUntil - Date.now()) / 60000);
    throw new AppError(429, `Account temporarily locked. Try again in ${minutesLeft} minutes.`);
  }

  const user = prepare(`
    SELECT id, username, email, password_hash, full_name, role, department, status
    FROM users WHERE username = ? OR email = ?
  `).get(username, username) as any;

  if (!user) {
    trackFailedAttempt(clientKey);
    throw new AppError(401, 'Invalid credentials');
  }

  if (user.status === 'inactive') {
    throw new AppError(403, 'Account is deactivated');
  }

  if (!bcrypt.compareSync(password, user.password_hash)) {
    trackFailedAttempt(clientKey);
    throw new AppError(401, 'Invalid credentials');
  }

  loginAttempts.delete(clientKey);

  const tokenPayload = { userId: user.id, username: user.username, role: user.role };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  prepare(`
    INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)
  `).run(generateId(), user.id, hashToken(refreshToken), expiresAt);

  prepare('UPDATE users SET last_login = datetime("now") WHERE id = ?').run(user.id);

  prepare(`
    INSERT INTO audit_log (id, user_id, action, entity_type, ip_address)
    VALUES (?, ?, 'login', 'auth', ?)
  `).run(generateId(), user.id, req.ip);

  res.json({
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      department: user.department,
    },
  });
});

router.post('/refresh', validate(refreshTokenSchema), (req: Request, res: Response) => {
  const { refreshToken } = req.body;


  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError(401, 'Invalid refresh token');
  }

  const tokenHash = hashToken(refreshToken);
  const stored = prepare(`
    SELECT id FROM refresh_tokens WHERE token_hash = ? AND revoked = 0 AND expires_at > datetime('now')
  `).get(tokenHash) as any;

  if (!stored) {
    throw new AppError(401, 'Refresh token revoked or expired');
  }

  prepare('UPDATE refresh_tokens SET revoked = 1 WHERE id = ?').run(stored.id);

  const user = prepare('SELECT id, username, role, status FROM users WHERE id = ?').get(payload.userId) as any;
  if (!user || user.status === 'inactive') {
    throw new AppError(401, 'Account not found or deactivated');
  }

  const newPayload = { userId: user.id, username: user.username, role: user.role };
  const newAccessToken = generateAccessToken(newPayload);
  const newRefreshToken = generateRefreshToken(newPayload);

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  prepare(`
    INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)
  `).run(generateId(), user.id, hashToken(newRefreshToken), expiresAt);

  res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
});

router.post('/logout', authenticate, (req: Request, res: Response) => {

  prepare('UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ?').run(req.user!.userId);

  prepare(`
    INSERT INTO audit_log (id, user_id, action, entity_type, ip_address)
    VALUES (?, ?, 'logout', 'auth', ?)
  `).run(generateId(), req.user!.userId, req.ip);

  res.json({ message: 'Logged out successfully' });
});

router.post('/forgot-password', validate(forgotPasswordSchema), (req: Request, res: Response) => {
  const { email } = req.body;


  const user = prepare('SELECT id FROM users WHERE email = ?').get(email) as any;

  // Always return success to prevent email enumeration
  if (user) {
    const resetToken = generateResetToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    prepare(`
      INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)
    `).run(generateId(), user.id, hashToken(resetToken), expiresAt);

    // In production, send email with resetToken here.
    // Never log tokens in production.
  }

  res.json({ message: 'If an account with that email exists, a reset link has been sent.' });
});

router.post('/reset-password', validate(resetPasswordSchema), (req: Request, res: Response) => {
  const { token, password } = req.body;


  const tokenRecord = prepare(`
    SELECT id, user_id FROM password_reset_tokens
    WHERE token_hash = ? AND used = 0 AND expires_at > datetime('now')
  `).get(hashToken(token)) as any;

  if (!tokenRecord) {
    throw new AppError(400, 'Invalid or expired reset token');
  }

  const passwordHash = bcrypt.hashSync(password, 12);

  transaction(() => {
    prepare('UPDATE users SET password_hash = ?, updated_at = datetime("now") WHERE id = ?')
      .run(passwordHash, tokenRecord.user_id);
    prepare('UPDATE password_reset_tokens SET used = 1 WHERE id = ?')
      .run(tokenRecord.id);
    prepare('UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ?')
      .run(tokenRecord.user_id);
  });

  res.json({ message: 'Password reset successfully' });
});

router.get('/me', authenticate, (req: Request, res: Response) => {

  const user = prepare(`
    SELECT id, username, email, full_name, role, department, status, last_login, created_at
    FROM users WHERE id = ?
  `).get(req.user!.userId) as any;

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  res.json({
    id: user.id,
    username: user.username,
    email: user.email,
    fullName: user.full_name,
    role: user.role,
    department: user.department,
    status: user.status,
    lastLogin: user.last_login,
    createdAt: user.created_at,
  });
});

export default router;
