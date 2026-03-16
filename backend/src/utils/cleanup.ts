import { prepare } from '../db-wrapper';

export function cleanupExpiredTokens(): void {
  try {
    const refreshDeleted = prepare(
      "DELETE FROM refresh_tokens WHERE expires_at < datetime('now') OR revoked = 1"
    ).run();

    const resetDeleted = prepare(
      "DELETE FROM password_reset_tokens WHERE expires_at < datetime('now') OR used = 1"
    ).run();

    if (refreshDeleted.changes > 0 || resetDeleted.changes > 0) {
      console.log(`[CLEANUP] Removed ${refreshDeleted.changes} refresh tokens, ${resetDeleted.changes} reset tokens`);
    }
  } catch (err) {
    console.error('[CLEANUP] Failed:', err);
  }
}
